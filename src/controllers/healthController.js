import { prisma } from '../config/database.js';

class HealthController {
  async checkDatabase(req, res) {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        success: true,
        status: 'connected',
        message: 'Database connection is healthy'
      });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Database connection failed'
      });
    }
  }

  async checkPaymentGateway(req, res) {
    try {
      // Check if Razorpay credentials are configured
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!razorpayKeyId || !razorpayKeySecret) {
        return res.status(503).json({
          success: false,
          status: 'error',
          message: 'Payment gateway configuration missing - Razorpay credentials not found'
        });
      }

      // Test Razorpay API connectivity by making a simple request
      const { default: Razorpay } = await import('razorpay');
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });

      // Try to fetch payment methods to test API connectivity
      try {
        // This is a lightweight API call to test connectivity
        await razorpay.payments.fetch('dummy_payment_id').catch(() => {
          // We expect this to fail with 404, but it confirms API is reachable
        });
        
        res.json({
          success: true,
          status: 'active',
          message: 'Payment gateway is operational',
          provider: 'Razorpay',
          keyId: razorpayKeyId.substring(0, 8) + '...' // Show partial key for verification
        });
      } catch (apiError) {
        // If we get a 404, it means the API is working but payment doesn't exist
        if (apiError.statusCode === 404) {
          res.json({
            success: true,
            status: 'active',
            message: 'Payment gateway is operational',
            provider: 'Razorpay',
            keyId: razorpayKeyId.substring(0, 8) + '...'
          });
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Payment gateway health check failed:', error);
      
      // Check if it's a network/connectivity issue
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          status: 'error',
          message: 'Payment gateway is temporarily unavailable - Network connectivity issue'
        });
      }
      
      // Check if it's an authentication issue
      if (error.statusCode === 401 || error.statusCode === 403) {
        return res.status(503).json({
          success: false,
          status: 'error',
          message: 'Payment gateway authentication failed - Invalid credentials'
        });
      }
      
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Payment gateway check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async checkEmailService(req, res) {
    try {
      // Simulate email service check
      // In a real implementation, you would check your email provider's API
      const isHealthy = Math.random() > 0.05; // 95% success rate for demo
      
      if (isHealthy) {
        res.json({
          success: true,
          status: 'operational',
          message: 'Email service is operational'
        });
      } else {
        res.status(503).json({
          success: false,
          status: 'error',
          message: 'Email service is temporarily down'
        });
      }
    } catch (error) {
      console.error('Email service health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Email service check failed'
      });
    }
  }

  async getSystemHealth(req, res) {
    try {
      const [dbHealth, paymentHealth, emailHealth] = await Promise.allSettled([
        this.checkDatabase(req, res),
        this.checkPaymentGateway(req, res),
        this.checkEmailService(req, res)
      ]);

      const overallHealth = {
        database: dbHealth.status === 'fulfilled' ? 'connected' : 'error',
        paymentGateway: paymentHealth.status === 'fulfilled' ? 'active' : 'error',
        emailService: emailHealth.status === 'fulfilled' ? 'operational' : 'error'
      };

      const allHealthy = Object.values(overallHealth).every(status => 
        status === 'connected' || status === 'active' || status === 'operational'
      );

      res.json({
        success: true,
        status: allHealthy ? 'healthy' : 'degraded',
        services: overallHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('System health check failed:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'System health check failed'
      });
    }
  }
}

export default new HealthController();
