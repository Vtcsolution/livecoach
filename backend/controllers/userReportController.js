// controllers/userReportController.js
const UserReportModal = require("../models/UserReportModal");
const Message = require("../models/Message");
const transporter = require("../config/mailer");

// Fetch all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const users = await UserReportModal.find()
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Fetch total users for pagination
    const totalUsers = await UserReportModal.countDocuments();

    // Fetch message stats for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const messages = await Message.find({ email: user.email })
          .select("replied repliedAt replyContent replySubject createdAt")
          .lean();
        
        return {
          ...user,
          totalMessages: messages.length,
          newMessages: messages.filter(msg => !msg.replied).length,
          repliedMessages: messages.filter(msg => msg.replied).length,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithStatus,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Fetch user details by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserReportModal.findById(id).lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch messages for the user
    const messages = await Message.find({ email: user.email })
      .select("message replied repliedAt replyContent replySubject createdAt")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...user,
        messages,
        totalMessages: messages.length,
        newMessages: messages.filter(msg => !msg.replied).length,
        repliedMessages: messages.filter(msg => msg.replied).length,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

// Fetch email statistics
exports.getEmailStats = async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const newMessages = await Message.countDocuments({ replied: false });
    const repliedMessages = await Message.countDocuments({ replied: true });

    res.status(200).json({
      success: true,
      data: {
        totalMessages,
        newMessages,
        repliedMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching email stats:", error);
    res.status(500).json({ error: "Failed to fetch email stats" });
  }
};

// Send email to user (quick send)
exports.sendUserEmail = async (req, res) => {
  try {
    const { userId, subject, message } = req.body;

    if (!userId || !subject || !message) {
      return res.status(400).json({ error: "User ID, subject, and message are required" });
    }

    const user = await UserReportModal.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send email
    await transporter.sendMail({
      from: `"Spiritueel Chatten" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject} - Spiritueel Chatten</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; max-width: 600px;">
          <div style="text-align: center; padding: 30px 0 20px 0; border-bottom: 3px solid #3B5EB7; margin-bottom: 30px;">
            <h1 style="color: #3B5EB7; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">Spiritueel Chatten</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 16px; font-weight: 500;">Message from Our Team</p>
          </div>
          <div style="margin-bottom: 40px;">
            <h2 style="color: #3B5EB7; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">${subject}</h2>
            <div style="line-height: 1.7; font-size: 16px; color: #333333; white-space: pre-wrap;">
              ${message}
            </div>
          </div>
          <div style="text-align: center; padding: 30px 0; border-top: 2px solid #3B5EB7; color: #666666;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #3B5EB7;">
              Best regards,
            </p>
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
              <a href="https://spiritueelchatten.nl" style="color: #3B5EB7; text-decoration: none; font-weight: 600;">
                The Spiritueel Chatten Team
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #999999;">
              Thank you for being part of our community
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Email sent to ${user.email}: ${subject}`);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending user email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};