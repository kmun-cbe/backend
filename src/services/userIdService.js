import { prisma } from '../config/database.js';

class UserIdService {
  /**
   * Generate a custom user ID in KMUN25XXX format
   * @returns {Promise<string>} The generated user ID
   */
  async generateUserId() {
    try {
      // Get the latest user with a custom userId
      const latestUser = await prisma.user.findFirst({
        where: {
          userId: {
            startsWith: 'KMUN25'
          }
        },
        orderBy: {
          userId: 'desc'
        }
      });

      let nextNumber = 1;

      if (latestUser && latestUser.userId) {
        // Extract the number from the latest userId (e.g., KMUN25001 -> 1)
        const match = latestUser.userId.match(/KMUN25(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Format the number with leading zeros (3 digits)
      const formattedNumber = nextNumber.toString().padStart(3, '0');
      const userId = `KMUN25${formattedNumber}`;

      // Check if this userId already exists (safety check)
      const existingUser = await prisma.user.findUnique({
        where: { userId }
      });

      if (existingUser) {
        // If it exists, try the next number
        return this.generateUserId();
      }

      return userId;
    } catch (error) {
      console.error('Error generating user ID:', error);
      throw new Error('Failed to generate user ID');
    }
  }

  /**
   * Validate if a user ID is in the correct format
   * @param {string} userId - The user ID to validate
   * @returns {boolean} True if valid format
   */
  isValidFormat(userId) {
    const pattern = /^KMUN25\d{3}$/;
    return pattern.test(userId);
  }
}

export default new UserIdService();
