import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        institution: true,
        grade: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

// Create new user
router.post('/', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      institution,
      grade,
      role,
      password
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        institution,
        grade,
        role: role || 'PARTICIPANT',
        password: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        institution: true,
        grade: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmail(email, {
        firstName,
        lastName,
        email,
        password,
        role: role || 'PARTICIPANT'
      }, 'outlook');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        institution: true,
        grade: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user',
      error: error.message 
    });
  }
});

// Update user
router.put('/:id', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, institution, grade, role, isActive, password } = req.body;
    
    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      institution,
      grade,
      role,
      isActive,
      updatedAt: new Date()
    };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        institution: true,
        grade: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user',
      error: error.message 
    });
  }
});

// Change user password
router.put('/:id/password', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update password',
      error: error.message 
    });
  }
});

// Delete user
router.delete('/:id', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete user',
      error: error.message 
    });
  }
});

export default router;
