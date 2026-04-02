import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const emailExists = await User.findOne({ email: email.toLowerCase() });
  if (emailExists) {
    res.status(400);
    throw new Error('Email already exists');
  }

  const usernameExists = await User.findOne({ username: username.toLowerCase() });
  if (usernameExists) {
    res.status(400);
    throw new Error('Username already taken');
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful!',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      },
      token
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful!',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      },
      token
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: { user }
  });
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    isOnline: false,
    lastSeen: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default { register, login, getMe, logout };
