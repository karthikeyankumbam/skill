const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const { protect, checkCredits } = require('../middleware/auth');
const upload = require('../utils/upload');

// @route   GET /api/chat/rooms
// @desc    Get all chat rooms for user
// @access  Private
router.get('/rooms', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.userId': req.user._id
    })
      .populate('participants.userId', 'name profileImage')
      .populate('booking', 'status serviceDate')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching chat rooms' });
  }
});

// @route   GET /api/chat/room/:roomId
// @desc    Get messages for a chat room
// @access  Private
router.get('/room/:roomId', protect, checkCredits(1), async (req, res) => {
  try {
    const chat = await Chat.findOne({ roomId: req.params.roomId })
      .populate('participants.userId', 'name profileImage')
      .populate('booking');

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.userId._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Deduct credit for accessing chat
    await req.wallet.deductCredits(1, 'Chat access', chat._id);

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching chat' });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', protect, checkCredits(0), upload.single('media'), [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let chat = await Chat.findOne({ roomId: req.body.roomId });

    if (!chat) {
      // Create new chat room if booking exists
      const booking = await Booking.findOne({ chatRoomId: req.body.roomId });
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Chat room not found' });
      }

      chat = await Chat.create({
        roomId: req.body.roomId,
        booking: booking._id,
        participants: [
          { userId: booking.user, role: 'user' },
          { userId: (await require('../models/Professional').findById(booking.professional)).userId, role: 'professional' }
        ],
        messages: []
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messageData = {
      sender: req.user._id,
      message: req.body.message,
      type: req.file ? 'image' : 'text',
      mediaUrl: req.file ? `/uploads/chat/${req.file.filename}` : undefined,
      readBy: [{ userId: req.user._id, readAt: new Date() }]
    };

    chat.messages.push(messageData);
    await chat.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.body.roomId).emit('new-message', {
        roomId: req.body.roomId,
        message: messageData
      });
    }

    res.json({
      success: true,
      message: 'Message sent',
      chatMessage: messageData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

module.exports = router;

