import express from 'express';
import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import userIdService from '../services/userIdService.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        school: true,
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
      school,
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

    // Generate custom user ID
    const customUserId = await userIdService.generateUserId();

    // Generate custom password: Iam<phone number (trimmed)>!@#
    const trimmedPhone = phone.replace(/\D/g, ''); // Remove all non-digits
    const customPassword = `Iam${trimmedPhone}!@#`;
    
    // Hash the custom password
    const hashedPassword = await bcrypt.hash(customPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        userId: customUserId,
        firstName,
        lastName,
        email,
        phone,
        school,
        grade,
        role: role || 'DELEGATE',
        password: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        school: true,
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
        password: customPassword, // Use the generated custom password
        role: role || 'DELEGATE'
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
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        school: true,
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
    const { firstName, lastName, email, phone, school, grade, role, isActive, password } = req.body;
    
    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      school,
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
        school: true,
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

// Delete user (complete deletion with all related records)
router.delete('/:id', authenticateToken, authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), async (req, res) => {
  try {
    const userId = req.params.id;

    // First, check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Use a transaction to ensure all deletions succeed or none do
    await prisma.$transaction(async (tx) => {
      // Delete all related records in the correct order (respecting foreign key constraints)
      
      // 1. Delete activity logs
      await tx.activityLog.deleteMany({
        where: { userId: userId }
      });

      // 2. Delete marks
      await tx.mark.deleteMany({
        where: { userId: userId }
      });

      // 3. Delete attendance records
      await tx.attendanceRecord.deleteMany({
        where: { userId: userId }
      });

      // 4. Delete check-ins
      await tx.checkIn.deleteMany({
        where: { userId: userId }
      });

      // 5. Delete payments
      await tx.payment.deleteMany({
        where: { userId: userId }
      });

      // 6. Delete registrations
      await tx.registration.deleteMany({
        where: { userId: userId }
      });

      // 7. Delete registration forms
      await tx.registrationForm.deleteMany({
        where: { userId: userId }
      });

      // 8. Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    console.log(`User ${existingUser.email} (${existingUser.firstName} ${existingUser.lastName}) and all related records deleted successfully`);

    return res.json({ 
      success: true,
      message: 'User and all related records deleted successfully',
      data: { 
        id: userId,
        email: existingUser.email,
        name: `${existingUser.firstName} ${existingUser.lastName}`
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to delete user',
      error: error.message 
    });
  }
});

export default router;
