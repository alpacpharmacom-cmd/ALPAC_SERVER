import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/user.model';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';
import { getPasswordResetTemplate } from '../utils/emailTemplates';

export const registerUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  if (user) {
    const token = generateToken(res, user._id.toString());

    successResponse(
      res,
      {
        token: token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          isAdmin: user.checkIsAdmin(),
        },
      },
      'User registered successfully',
      201
    );
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(res, user._id.toString());

    successResponse(
      res,
      {
        token: token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          isAdmin: user.checkIsAdmin(),
        },
      },
      'User logged in successfully'
    );
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export const logoutUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  successResponse(res, null, 'User logged out successfully');
});

export const getUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user;
    if (user) {
      successResponse(
        res,
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          isAdmin: user.isAdmin,
        },
        'User profile retrieved successfully'
      );
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  }
);

export const updateUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.user._id).select('+password');

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;
      user.address = req.body.address || user.address;

      if (req.body.newPassword) {
        if (!req.body.oldPassword) {
          res.status(400);
          throw new Error('Please provide your old password to set a new one');
        }

        if (!(await user.matchPassword(req.body.oldPassword))) {
          res.status(401);
          throw new Error('Invalid old password');
        }

        if (req.body.newPassword.length < 6) {
          res.status(400);
          throw new Error('New password must be at least 6 characters long');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt);
      }

      const updatedUser = await user.save();

      successResponse(
        res,
        {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          address: updatedUser.address,
          isAdmin: updatedUser.checkIsAdmin(),
        },
        'User profile updated successfully'
      );
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  }
);

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404);
    throw new Error('There is no user with that email');
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  // For production, this should be the frontend URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Alpac Pharmacom - Password Reset Request',
      message,
      html: getPasswordResetTemplate(resetUrl),
    });


    successResponse(res, null, 'Email sent');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken as string)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  // Set new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  successResponse(res, null, 'Password reset success');
});

//////////////////////////////////////////////////////////////////////// ADMIN ///////////////////////////////////////////////////////////////////////

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({}).select('-password');
  successResponse(res, users, 'Users retrieved successfully');
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    successResponse(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        isAdmin: user.checkIsAdmin(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      'User retrieved successfully'
    );
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.avatar = req.body.avatar || user.avatar;
    user.address = req.body.address || user.address;

    const updatedUser = await user.save();

    successResponse(
      res,
      {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        address: updatedUser.address,
        isAdmin: updatedUser.checkIsAdmin(),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      'User updated successfully'
    );
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (user) {
    await User.deleteOne({ _id: user._id });
    successResponse(res, null, 'User removed successfully');
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
