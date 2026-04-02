import Message from '../models/Message.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getConversations = asyncHandler(async (req, res) => {
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', req.user._id] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' }
      }
    }
  ]);

  const conversations = await Promise.all(
    messages.map(async (msg) => {
      const user = await Message.populate(msg, {
        path: '_id',
        select: 'username avatar isOnline'
      });
      return {
        user: user._id,
        lastMessage: msg.lastMessage,
        unreadCount: 0
      };
    })
  );

  res.status(200).json({
    success: true,
    data: { conversations }
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ]
  })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: { messages }
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    res.status(400);
    throw new Error('Receiver and content are required');
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    content: content.trim()
  });

  await message.populate('sender', 'username avatar');
  await message.populate('receiver', 'username avatar');

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: { message }
  });
});

export default { getConversations, getMessages, sendMessage };
