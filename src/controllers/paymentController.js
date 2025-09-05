import paymentService from '../services/paymentService.js';
import { prisma } from '../config/database.js';

class PaymentController {
  async createPaymentOrder(req, res) {
    try {
      const { userId, registrationId, amount, currency = 'INR' } = req.body;

      // Validate required fields
      if (!userId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'User ID and amount are required'
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create payment order
      const result = await paymentService.processRegistrationPayment(
        userId,
        registrationId,
        amount
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment order',
          error: result.error
        });
      }

      // Log the payment attempt
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_PAYMENT_ORDER',
          details: {
            targetUserId: userId,
            amount,
            currency,
            paymentId: result.payment.id,
            razorpayOrderId: result.razorpayOrder.id
          }
        }
      });

      res.json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          payment: result.payment,
          razorpayOrder: result.razorpayOrder,
          key: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (error) {
      console.error('Create payment order error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  async verifyPayment(req, res) {
    try {
      const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!paymentId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID, Razorpay Payment ID, and signature are required'
        });
      }

      // Verify payment
      const result = await paymentService.confirmPayment(
        paymentId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!result.success) {
        // Log failed payment verification
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action: 'PAYMENT_VERIFICATION_FAILED',
            details: {
              paymentId,
              razorpayPaymentId,
              error: result.error
            }
          }
        });

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          error: result.error
        });
      }

      // Log successful payment verification
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'PAYMENT_VERIFIED',
          details: {
            paymentId,
            razorpayPaymentId,
            amount: result.payment.amount,
            status: result.payment.status
          }
        }
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: result.payment
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 10, status, userId } = req.query;
      const skip = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;
      if (userId) whereClause.userId = userId;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                institution: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.payment.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: error.message
      });
    }
  }

  async getPaymentById(req, res) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              institution: true,
              phone: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Get payment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment',
        error: error.message
      });
    }
  }

  async getPaymentStats(req, res) {
    try {
      const [
        totalPayments,
        successfulPayments,
        pendingPayments,
        failedPayments,
        totalAmount,
        successfulAmount
      ] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'PAID' } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        prisma.payment.aggregate({
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalPayments,
          successfulPayments,
          pendingPayments,
          failedPayments,
          totalAmount: totalAmount._sum.amount || 0,
          successfulAmount: successfulAmount._sum.amount || 0,
          successRate: totalPayments > 0 ? (successfulPayments / totalPayments * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment statistics',
        error: error.message
      });
    }
  }

  async refundPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      if (!amount || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Amount and reason are required for refund'
        });
      }

      const result = await paymentService.refundPayment(id, amount, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Refund failed',
          error: result.error
        });
      }

      // Log refund action
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'PAYMENT_REFUNDED',
          details: {
            paymentId: id,
            refundAmount: amount,
            reason,
            razorpayRefundId: result.refund.id
          }
        }
      });

      res.json({
        success: true,
        message: 'Payment refunded successfully',
        data: result.refund
      });
    } catch (error) {
      console.error('Refund payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  async getTransactionLogs(req, res) {
    try {
      const { page = 1, limit = 20, action, userId } = req.query;
      const skip = (page - 1) * limit;

      const whereClause = {
        action: {
          in: ['CREATE_PAYMENT_ORDER', 'PAYMENT_VERIFIED', 'PAYMENT_VERIFICATION_FAILED', 'PAYMENT_REFUNDED']
        }
      };

      if (action) whereClause.action = action;
      if (userId) whereClause.userId = userId;

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.activityLog.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get transaction logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction logs',
        error: error.message
      });
    }
  }
}

export default new PaymentController();
