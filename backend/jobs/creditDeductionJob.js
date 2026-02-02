const schedule = require("node-schedule");
const ActiveSession = require("../models/ActiveSession");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const startCreditDeductionJob = (io) => {
  // Run every 30 seconds instead of every second
  schedule.scheduleJob("*/30 * * * * *", async () => {
    try {
      const now = new Date();
      console.log(`[Credit Job] Running at ${now.toISOString()}`);
      
      // Find active paid sessions
      const sessions = await ActiveSession.find({
        paidSession: true,
        paidStartTime: { $exists: true, $ne: null },
        isArchived: false,
        // Remove lock check here - we'll handle locking differently
      }).lean(); // Use lean() for better performance

      for (const session of sessions) {
        // Use transaction-like pattern for atomic operations
        let sessionUpdated = false;
        try {
          // First, try to acquire lock with atomic operation
          const lockedSession = await ActiveSession.findOneAndUpdate(
            { 
              _id: session._id, 
              lock: false,
              isArchived: false
            },
            { 
              $set: { 
                lock: true,
                lastProcessed: now
              } 
            },
            { new: true }
          );

          if (!lockedSession) {
            console.log(`[Credit Job] Session ${session._id} already locked, skipping`);
            continue;
          }

          // Get user's wallet
          const wallet = await Wallet.findOneAndUpdate(
            { 
              userId: session.userId,
              lock: false 
            },
            { $set: { lock: true } },
            { new: true }
          );

          if (!wallet) {
            console.log(`[Credit Job] Wallet for user ${session.userId} not found or locked`);
            await ActiveSession.updateOne(
              { _id: session._id }, 
              { $set: { lock: false } }
            );
            continue;
          }

          // Calculate elapsed time
          const elapsedSeconds = Math.floor((now - session.paidStartTime) / 1000);
          const elapsedMinutes = Math.floor(elapsedSeconds / 60);
          
          // Determine if we should deduct a credit
          const creditsToDeduct = elapsedMinutes - (session.lastDeductedMinute || 0);
          
          if (creditsToDeduct > 0 && wallet.credits >= creditsToDeduct) {
            // Deduct credits
            wallet.credits -= creditsToDeduct;
            wallet.lastDeduction = now;
            
            // Update session tracking
            lockedSession.lastDeductedMinute = elapsedMinutes;
            lockedSession.lastChargeTime = now;
            
            await wallet.save();
            await lockedSession.save();
            sessionUpdated = true;
            
            // Emit update
            io.to(session.userId.toString()).emit("creditsUpdate", {
              userId: session.userId,
              credits: wallet.credits,
              deducted: creditsToDeduct,
              timestamp: now
            });
            
            console.log(`[Credit Job] Deducted ${creditsToDeduct} credit(s) for user ${session.userId}, remaining: ${wallet.credits}`);
          }

          // Calculate remaining time
          const totalPaidSeconds = session.initialCredits * 60;
          const remainingTime = Math.max(0, totalPaidSeconds - elapsedSeconds);
          const remainingCredits = Math.max(0, Math.floor(remainingTime / 60));

          // Update frontend
          io.to(session.userId.toString()).emit("sessionUpdate", {
            userId: session.userId,
            psychicId: session.psychicId,
            isFree: false,
            remainingFreeTime: 0,
            paidTimer: remainingTime,
            credits: wallet.credits,
            status: wallet.credits > 0 ? "paid" : "insufficient_credits",
            showFeedbackModal: wallet.credits <= 0,
            freeSessionUsed: true,
            lastUpdated: now
          });

          // End session if no credits or time remaining
          if (wallet.credits <= 0 || remainingTime <= 0) {
            console.log(`[Credit Job] Ending session ${session._id} - credits: ${wallet.credits}, remainingTime: ${remainingTime}`);
            
            lockedSession.paidSession = false;
            lockedSession.paidStartTime = null;
            lockedSession.isArchived = true;
            lockedSession.endedAt = now;
            
            await lockedSession.save();
          }

        } catch (error) {
          console.error(`[Credit Job] Error processing session ${session._id}:`, error);
        } finally {
          // Always release locks
          try {
            if (session._id) {
              await ActiveSession.updateOne(
                { _id: session._id }, 
                { $set: { lock: false } }
              );
            }
            if (session.userId) {
              await Wallet.updateOne(
                { userId: session.userId }, 
                { $set: { lock: false } }
              );
            }
          } catch (lockError) {
            console.error(`[Credit Job] Error releasing locks:`, lockError);
          }
        }
      }
    } catch (error) {
      console.error("[Credit Job] General error:", error);
    }
  });
};

const startFreeSessionTimerJob = (io) => {
  // Run every 30 seconds instead of every second
  schedule.scheduleJob("*/30 * * * * *", async () => {
    try {
      const now = new Date();
      console.log(`[Free Session Job] Running at ${now.toISOString()}`);
      
      const sessions = await ActiveSession.find({
        freeSessionUsed: false,
        isArchived: false,
        lock: false,
        freeEndTime: { $exists: true, $gt: now } // Only sessions with future end time
      }).lean();

      for (const session of sessions) {
        try {
          // Acquire lock
          const lockedSession = await ActiveSession.findOneAndUpdate(
            { 
              _id: session._id, 
              lock: false 
            },
            { $set: { lock: true } },
            { new: true }
          );

          if (!lockedSession) continue;

          // Check user's free minute status
          const user = await User.findById(session.userId);
          if (!user || user.hasUsedFreeMinute) {
            lockedSession.freeSessionUsed = true;
            lockedSession.isArchived = true;
            await lockedSession.save();
            await ActiveSession.updateOne(
              { _id: session._id }, 
              { $set: { lock: false } }
            );
            continue;
          }

          // Calculate remaining time
          const remainingFreeTime = Math.max(0, Math.floor((session.freeEndTime - now) / 1000));
          
          // Update session
          lockedSession.remainingFreeTime = remainingFreeTime;
          
          if (remainingFreeTime <= 0) {
            lockedSession.freeSessionUsed = true;
            lockedSession.isArchived = true;
            await User.updateOne(
              { _id: session.userId }, 
              { hasUsedFreeMinute: true }
            );
            console.log(`[Free Session Job] Free session ended for user ${session.userId}`);
          }
          
          await lockedSession.save();

          // Get wallet for credits display
          const wallet = await Wallet.findOne({ userId: session.userId });
          
          // Emit update
          io.to(session.userId.toString()).emit("sessionUpdate", {
            userId: session.userId,
            psychicId: session.psychicId,
            isFree: remainingFreeTime > 0,
            remainingFreeTime,
            paidTimer: 0,
            credits: wallet?.credits || 0,
            status: remainingFreeTime > 0 ? "free" : "stopped",
            freeSessionUsed: lockedSession.freeSessionUsed,
            showFeedbackModal: remainingFreeTime <= 0,
            lastUpdated: now
          });

        } catch (error) {
          console.error(`[Free Session Job] Error processing session ${session._id}:`, error);
        } finally {
          // Release lock
          try {
            await ActiveSession.updateOne(
              { _id: session._id }, 
              { $set: { lock: false } }
            );
          } catch (lockError) {
            console.error(`[Free Session Job] Error releasing lock:`, lockError);
          }
        }
      }
    } catch (error) {
      console.error("[Free Session Job] General error:", error);
    }
  });
};

module.exports = { startCreditDeductionJob, startFreeSessionTimerJob };