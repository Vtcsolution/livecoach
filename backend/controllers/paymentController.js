const mongoose = require("mongoose");
const { createMollieClient } = require("@mollie/api-client");
const Wallet = require("../models/Wallet");
const Payment = require("../models/Payment");
const User = require("../models/User"); // Now properly used for username lookup
const mollieClient = createMollieClient({ 
  apiKey: process.env.MOLLIE_TEST_API_KEY 
});

exports.createWalletTopup = async (req, res) => {
  try {
    const { amount, planName, creditsPurchased, paymentMethod } = req.body;
    const userId = req.user._id;

    // Validate input
    if (amount < 1) return res.status(400).json({ error: "Amount must be at least €1" });
    if (!planName || !creditsPurchased || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // URL construction with validation
    const getValidUrl = (base, path) => {
      try {
        return new URL(path, base).toString();
      } catch (err) {
        console.error(`Invalid URL: ${base}${path}`, err);
        throw new Error('Invalid URL configuration');
      }
    };

    const webhookUrl = getValidUrl(
      process.env.NODE_ENV === 'production' 
        ? process.env.BACKEND_URL 
        : 'https://webhook.site', // Temporary for development
      '/api/payments/webhook'
    );

    const redirectUrl = getValidUrl(
      process.env.FRONTEND_URL || 'https://spiritueelchatten.nl',
      '/payment/result'
    );

    // Create Mollie payment
    const payment = await mollieClient.payments.create({
      amount: {
        value: amount.toFixed(2),
        currency: "EUR"
      },
      description: `Purchase: ${planName} (${creditsPurchased} credits)`,
      redirectUrl, // Use base redirectUrl without payment ID
      webhookUrl,
      method: paymentMethod,
      metadata: {
        userId: userId.toString(),
        planName,
        creditsPurchased,
        timestamp: new Date().toISOString()
      }
    });

    // Append payment ID to redirect URL for database storage
    const finalRedirectUrl = `${redirectUrl}?id=${payment.id}`;

    // Save payment to DB
    const newPayment = new Payment({
      userId,
      amount,
      planName,
      creditsPurchased,
      paymentMethod,
      molliePaymentId: payment.id,
      status: "pending",
      createdAt: new Date(),
      redirectUrl: finalRedirectUrl,
      webhookUrl
    });

    await newPayment.save();

    console.log('Payment created:', {
      paymentId: payment.id,
      redirectUrl: finalRedirectUrl,
      checkoutUrl: payment.getCheckoutUrl(),
      userId,
      amount,
      planName,
      creditsPurchased,
      paymentMethod
    });

    res.json({
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id
    });
    
  } catch (error) {
    console.error("Payment creation failed:", {
      error: error.message,
      stack: error.stack,
      mollieError: error.field ? `Mollie error: ${error.field}` : undefined
    });
    
    res.status(500).json({ 
      error: "Payment initialization failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const paymentId = req.body.id;
    if (!paymentId) {
      console.error('Webhook: No payment ID provided');
      return res.status(400).send("No payment ID provided");
    }

    const payment = await mollieClient.payments.get(paymentId);
    console.log('Webhook: Payment status:', { paymentId, status: payment.status });

    const dbPayment = await Payment.findOne({ molliePaymentId: paymentId });
    if (!dbPayment) {
      console.error('Webhook: Payment not found in database', { paymentId });
      return res.status(404).send("Payment not found in database");
    }

    // Update payment status
    dbPayment.status = payment.status;
    dbPayment.updatedAt = new Date();

    if (payment.status === 'paid' && dbPayment.creditsAdded === 0) {
      try {
        dbPayment.creditsAdded = dbPayment.creditsPurchased;
        await dbPayment.save();

        const walletUpdate = await Wallet.findOneAndUpdate(
          { userId: dbPayment.userId },
          {
            $inc: {
              balance: dbPayment.creditsPurchased,
              credits: dbPayment.creditsPurchased
            },
            $set: { lastTopup: new Date() }
          },
          { upsert: true, new: true }
        );

        console.log('Webhook: Wallet updated successfully:', {
          userId: dbPayment.userId.toString(),
          creditsAdded: dbPayment.creditsPurchased,
          wallet: {
            balance: walletUpdate.balance,
            credits: walletUpdate.credits,
            lastTopup: walletUpdate.lastTopup
          }
        });
      } catch (walletError) {
        console.error('Webhook: Failed to update wallet:', {
          error: walletError.message,
          stack: walletError.stack,
          userId: dbPayment.userId.toString(),
          creditsPurchased: dbPayment.creditsPurchased
        });
        // Save payment status even if wallet update fails
        await dbPayment.save();
        return res.status(500).send("Webhook processed but wallet update failed");
      }
    } else {
      await dbPayment.save();
      console.log('Webhook: Payment status updated:', { paymentId, status: payment.status });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error('Webhook processing failed:', {
      error: error.message,
      stack: error.stack,
      paymentId: req.body.id
    });
    res.status(500).send("Error processing webhook");
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findOne({ molliePaymentId: paymentId });
    if (!payment) {
      console.error('checkPaymentStatus: Payment not found', { paymentId });
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify with Mollie to ensure sync
    const molliePayment = await mollieClient.payments.get(paymentId);
    if (molliePayment.status !== payment.status) {
      payment.status = molliePayment.status;
      payment.updatedAt = new Date();
      await payment.save();
      console.log('checkPaymentStatus: Synced payment status with Mollie', {
        paymentId,
        status: molliePayment.status
      });

      // If status is now paid and credits not added, update wallet
      if (molliePayment.status === 'paid' && payment.creditsAdded === 0) {
        try {
          payment.creditsAdded = payment.creditsPurchased;
          await payment.save();

          const walletUpdate = await Wallet.findOneAndUpdate(
            { userId: payment.userId },
            {
              $inc: {
                balance: payment.creditsPurchased,
                credits: payment.creditsPurchased
              },
              $set: { lastTopup: new Date() }
            },
            { upsert: true, new: true }
          );

          console.log('checkPaymentStatus: Wallet updated after sync:', {
            userId: payment.userId.toString(),
            creditsAdded: payment.creditsPurchased,
            wallet: {
              balance: walletUpdate.balance,
              credits: walletUpdate.credits,
              lastTopup: walletUpdate.lastTopup
            }
          });
        } catch (walletError) {
          console.error('checkPaymentStatus: Failed to update wallet:', {
            error: walletError.message,
            stack: walletError.stack,
            userId: payment.userId.toString(),
            creditsPurchased: payment.creditsPurchased
          });
        }
      }
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      creditsAdded: payment.creditsAdded
    });
  } catch (error) {
    console.error("Error checking payment status:", {
      error: error.message,
      stack: error.stack,
      paymentId: req.params.paymentId
    });
    res.status(500).json({ error: "Error checking payment status" });
  }
};

// UPDATED: Get user payments with username using User model
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // First, get the user details to include username
    const user = await User.findById(userId).select('username email image firstName lastName');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Aggregation pipeline to get payments with user info
    const pipeline = [
      // Match payments for the specific user
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      
      // Lookup user information (for consistency)
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      
      // Unwind user array
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      
      // Project the fields we need with proper username
      {
        $project: {
          _id: 1,
          tran_id: "$molliePaymentId",
          user: {
            username: { $ifNull: ["$user.username", user.username] }, // Use schema field
            name: { $concat: [ { $ifNull: ["$user.firstName", ""] }, " ", { $ifNull: ["$user.lastName", ""] } ] },
            email: { $ifNull: ["$user.email", user.email] },
            profile: { $ifNull: ["$user.image", user.image || ""] }, // Use image field from schema
            firstName: { $ifNull: ["$user.firstName", user.firstName] },
            lastName: { $ifNull: ["$user.lastName", user.lastName] }
          },
          amount: 1,
          credits: "$creditsPurchased",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          planName: 1,
          paymentMethod: 1,
          creditsAdded: 1,
          redirectUrl: 1,
          // Add direct fields for easier frontend access
          username: { $ifNull: ["$user.username", user.username] },
          userEmail: { $ifNull: ["$user.email", user.email] },
          userProfile: { $ifNull: ["$user.image", user.image || ""] }
        }
      },
      
      // Sort by createdAt descending
      { $sort: { createdAt: -1 } }
    ];

    const paymentsWithUser = await Payment.aggregate(pipeline);
    const totalCount = await Payment.countDocuments({ userId });

    res.json({
      success: true,
      count: paymentsWithUser.length,
      total: totalCount,
      user: {
        username: user.username,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        profile: user.image || ""
      },
      payments: paymentsWithUser
    });

  } catch (error) {
    console.error("Error fetching user payments:", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    res.status(500).json({ error: "Failed to fetch user payments" });
  }
};

// UPDATED: Get all transactions with proper username field
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sort = 'createdAt', order = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object with username search capability
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      // Create complex filter for searching across multiple fields including username
      const searchFilter = [
        { "planName": { $regex: search, $options: 'i' } },
        { "molliePaymentId": { $regex: search, $options: 'i' } }
      ];
      
      // Add username and email search using aggregation approach
      const userSearch = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      if (userSearch.length > 0) {
        const userIds = userSearch.map(u => u._id);
        searchFilter.push({ userId: { $in: userIds } });
      }
      
      filter.$or = searchFilter;
    }

    // Enhanced aggregation pipeline for rich data with proper username
    const pipeline = [
      // Match documents
      { $match: filter },
      
      // Lookup user information with all relevant fields
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1, // Primary username field
                firstName: 1,
                lastName: 1,
                email: 1,
                image: 1, // Use image field from your schema
                gender: 1,
                isActive: { $ifNull: [true, true] },
                createdAt: 1
              }
            }
          ]
        }
      },
      
      // Unwind user array
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      
      // Create full name and handle null values
      {
        $addFields: {
          fullName: {
            $cond: {
              if: { $and: [{ $ne: ["$user.firstName", null] }, { $ne: ["$user.firstName", ""] }] },
              then: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              },
              else: { $ifNull: ["$user.username", "Unknown User"] }
            }
          },
          userDisplayName: { $ifNull: ["$user.username", "Unknown User"] }
        }
      },
      
      // Project the fields we need with proper username structure
      {
        $project: {
          _id: 1,
          tran_id: "$molliePaymentId",
          user: {
            username: "$userDisplayName", // Primary username field
            name: "$fullName", // Full name as display name
            email: { $ifNull: ["$user.email", "No email"] },
            profile: { $ifNull: ["$user.image", ""] }, // Use image field
            firstName: { $ifNull: ["$user.firstName", ""] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            gender: { $ifNull: ["$user.gender", ""] },
            isActive: { $ifNull: ["$user.isActive", true] }
          },
          // Direct fields for easier frontend access
          username: "$userDisplayName",
          fullName: "$fullName",
          userEmail: { $ifNull: ["$user.email", "No email"] },
          userProfile: { $ifNull: ["$user.image", ""] },
          userGender: { $ifNull: ["$user.gender", ""] },
          userIsActive: { $ifNull: ["$user.isActive", true] },
          amount: 1,
          credits: "$creditsPurchased",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          planName: 1,
          paymentMethod: 1,
          creditsAdded: 1,
          redirectUrl: 1
        }
      },
      
      // Sort
      { 
        $sort: { 
          [sort]: order === 'desc' ? -1 : 1 
        } 
      },
      
      // Pagination
      { $skip: skip },
      { $limit: limitNum }
    ];

    const transactions = await Payment.aggregate(pipeline);
    const total = await Payment.countDocuments(filter);

    console.log(`Fetched ${transactions.length} transactions for page ${pageNum}, total: ${total}`);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error("Error fetching all transactions:", {
      error: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({ 
      error: "Failed to fetch transactions",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// UPDATED: Delete transaction with user information including username
exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    // Find transaction with user information before deleting
    const transactionWithUser = await Payment.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(transactionId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          tran_id: "$molliePaymentId",
          username: { $ifNull: ["$user.username", "Unknown User"] },
          fullName: {
            $cond: {
              if: { $and: [{ $ne: ["$user.firstName", null] }, { $ne: ["$user.firstName", ""] }] },
              then: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              },
              else: { $ifNull: ["$user.username", "Unknown User"] }
            }
          },
          userEmail: { $ifNull: ["$user.email", "No email"] },
          amount: 1,
          credits: "$creditsPurchased",
          status: 1,
          planName: 1,
          createdAt: 1,
          userId: 1
        }
      }
    ]);

    if (!transactionWithUser.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Delete the actual document
    await Payment.findByIdAndDelete(transactionId);

    const transactionData = transactionWithUser[0];
    
    console.log('Transaction deleted:', {
      transactionId,
      username: transactionData.username,
      fullName: transactionData.fullName,
      userEmail: transactionData.userEmail,
      molliePaymentId: transactionData.tran_id,
      userId: transactionData.userId,
      amount: transactionData.amount,
      credits: transactionData.credits
    });

    res.json({
      success: true,
      message: "Transaction deleted successfully",
      data: transactionData
    });

  } catch (error) {
    console.error("Error deleting transaction:", {
      error: error.message,
      stack: error.stack,
      transactionId: req.params.transactionId
    });
    res.status(500).json({ 
      error: "Failed to delete transaction",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// UPDATED: Get transaction details by ID with complete user information
exports.getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(transactionId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1, // Primary username field
                firstName: 1,
                lastName: 1,
                email: 1,
                image: 1, // Use image field from schema
                gender: 1,
                bio: 1,
                dob: 1,
                isActive: { $ifNull: [true, true] },
                createdAt: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      
      // Create full name
      {
        $addFields: {
          fullName: {
            $cond: {
              if: { $and: [{ $ne: ["$user.firstName", null] }, { $ne: ["$user.firstName", ""] }] },
              then: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              },
              else: { $ifNull: ["$user.username", "Unknown User"] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          tran_id: "$molliePaymentId",
          user: {
            username: { $ifNull: ["$user.username", "Unknown User"] },
            name: "$fullName",
            email: { $ifNull: ["$user.email", "No email"] },
            profile: { $ifNull: ["$user.image", ""] },
            firstName: { $ifNull: ["$user.firstName", ""] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            gender: { $ifNull: ["$user.gender", ""] },
            bio: { $ifNull: ["$user.bio", ""] },
            dob: { $ifNull: ["$user.dob", ""] },
            isActive: { $ifNull: ["$user.isActive", true] },
            createdAt: "$user.createdAt"
          },
          // Direct fields for easier frontend access
          username: { $ifNull: ["$user.username", "Unknown User"] },
          fullName: "$fullName",
          userEmail: { $ifNull: ["$user.email", "No email"] },
          userProfile: { $ifNull: ["$user.image", ""] },
          userGender: { $ifNull: ["$user.gender", ""] },
          userBio: { $ifNull: ["$user.bio", ""] },
          userDob: { $ifNull: ["$user.dob", ""] },
          userIsActive: { $ifNull: ["$user.isActive", true] },
          amount: 1,
          credits: "$creditsPurchased",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          planName: 1,
          paymentMethod: 1,
          creditsAdded: 1,
          redirectUrl: 1
        }
      }
    ];

    const transaction = await Payment.aggregate(pipeline);

    if (!transaction.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      data: transaction[0]
    });

  } catch (error) {
    console.error("Error fetching transaction details:", {
      error: error.message,
      stack: error.stack,
      transactionId: req.params.transactionId
    });
    res.status(500).json({ 
      error: "Failed to fetch transaction details",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};