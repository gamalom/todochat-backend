import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = { _id: { $ne: req.user._id } };

  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('username email avatar isOnline')
    .limit(20);

  res.status(200).json({
    success: true,
    data: { users }
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    res.status(400);
    throw new Error('Search query must be at least 2 characters');
  }

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ]
  })
    .select('username email avatar isOnline')
    .limit(10);

  res.status(200).json({
    success: true,
    data: { users }
  });
});

export default { getUsers, searchUsers };
