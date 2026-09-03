const Contact = require("../models/Contact");

// POST /api/contact - Send message (Public)
const sendMessage = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    const contact = new Contact({
      name,
      phone,
      email,
      subject,
      message,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET /api/contact - Get all messages (Admin)
const getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  sendMessage,
  getContactMessages,
};
