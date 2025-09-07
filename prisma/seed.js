import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import userIdService from '../src/services/userIdService.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check existing users and log their custom user IDs
  console.log('🆔 Checking existing users...');
  const allExistingUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });

  if (allExistingUsers.length > 0) {
    console.log(`Found ${allExistingUsers.length} existing users with custom user IDs:`);
    for (const user of allExistingUsers) {
      console.log(`  - ${user.email}: ${user.userId}`);
    }
  }

  // Create default admin users
  const hashedPassword = await bcrypt.hash('kmun2025', 12);

  const users = [
    {
      firstName: 'Dev',
      lastName: 'Admin',
      email: 'dev@mun.com',
      password: hashedPassword,
      phone: '+91 9876543211',
      role: 'DEV_ADMIN',
      school: 'MUN Organization',
      grade: 'Staff',
      isActive: true
    },
    {
      firstName: 'John',
      lastName: 'Delegate',
      email: 'delegate@mun.com',
      password: hashedPassword,
      phone: '+91 9876543210',
      role: 'DELEGATE',
      school: 'Harvard University',
      grade: 'Undergraduate',
      isActive: true
    },
    {
      firstName: 'Delegate',
      lastName: 'Affairs',
      email: 'affairs@mun.com',
      password: hashedPassword,
      phone: '+91 9876543212',
      role: 'DELEGATE_AFFAIRS',
      school: 'MUN Organization',
      grade: 'Staff',
      isActive: true
    },
    {
      firstName: 'Front',
      lastName: 'Desk',
      email: 'frontdesk@mun.com',
      password: hashedPassword,
      phone: '+91 9876543213',
      role: 'FRONT_DESK_ADMIN',
      school: 'MUN Organization',
      grade: 'Staff',
      isActive: true
    },
    {
      firstName: 'Committee',
      lastName: 'Director',
      email: 'director@mun.com',
      password: hashedPassword,
      phone: '+91 9876543214',
      role: 'COMMITTEE_DIRECTOR',
      school: 'MUN Organization',
      grade: 'Staff',
      isActive: true
    },
    {
      firstName: 'Hospitality',
      lastName: 'Admin',
      email: 'hospitality@mun.com',
      password: hashedPassword,
      phone: '+91 9876543215',
      role: 'HOSPITALITY_ADMIN',
      school: 'MUN Organization',
      grade: 'Staff',
      isActive: true
    }
  ];

  console.log('👥 Creating/updating users with custom user IDs...');
  const createdUsers = [];
  for (const userData of users) {
    const existingUser = await prisma.user.findFirst({
      where: { email: userData.email }
    });

    if (!existingUser) {
      // Generate custom user ID for new user (KMUN25XXX format)
      const customUserId = await userIdService.generateUserId();
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          userId: customUserId
        }
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${userData.email} with User ID: ${customUserId}`);
    } else {
      createdUsers.push(existingUser);
      console.log(`⏭️  User already exists: ${userData.email} (User ID: ${existingUser.userId})`);
    }
  }

  // Create committees
  const committees = [
    {
      name: 'United Nations Security Council (UNSC)',
      description: 'Addressing global security challenges and international peace. Delegates will debate on critical security issues affecting global stability.',
      type: 'SC',
      institutionType: 'both',
      isActive: true
    },
    {
      name: 'United Nations General Assembly (UNGA)',
      description: 'Deliberating on international cooperation and development. The main deliberative body of the United Nations.',
      type: 'GA',
      institutionType: 'both',
      isActive: true
    },
    {
      name: 'World Health Organization (WHO)',
      description: 'Addressing global health challenges and policy. Focus on international health cooperation and pandemic response.',
      type: 'SPECIALIZED',
      institutionType: 'college',
      isActive: true
    },
    {
      name: 'International Court of Justice (ICJ)',
      description: 'Legal disputes between nations and international law. The principal judicial organ of the United Nations.',
      type: 'COURT',
      institutionType: 'college',
      isActive: true
    },
    {
      name: 'United Nations Educational, Scientific and Cultural Organization (UNESCO)',
      description: 'Promoting international collaboration in education, science, culture and communication.',
      type: 'SPECIALIZED',
      institutionType: 'school',
      isActive: true
    },
    {
      name: 'United Nations Children\'s Fund (UNICEF)',
      description: 'Protecting children\'s rights and ensuring their well-being worldwide.',
      type: 'SPECIALIZED',
      institutionType: 'school',
      isActive: true
    }
  ];

  console.log('🏛️ Creating committees...');
  for (const committeeData of committees) {
    const existingCommittee = await prisma.committee.findFirst({
      where: { name: committeeData.name }
    });

    if (!existingCommittee) {
      await prisma.committee.create({
        data: committeeData
      });
      console.log(`✅ Created committee: ${committeeData.name}`);
    } else {
      console.log(`⏭️  Committee already exists: ${committeeData.name}`);
    }
  }

  // Create sample registrations
  console.log('📝 Creating sample registrations...');
  
  // Find the John Delegate user and a committee
  const johnDelegate = createdUsers.find(user => user.email === 'delegate@mun.com');
  const unscCommittee = await prisma.committee.findFirst({
    where: { name: 'United Nations Security Council (UNSC)' }
  });
  
  if (johnDelegate && unscCommittee) {
    const existingReg = await prisma.registration.findFirst({
      where: { userId: johnDelegate.id }
    });

    if (!existingReg) {
      await prisma.registration.create({
        data: {
          userId: johnDelegate.id,
          committeeId: unscCommittee.id,
          status: 'APPROVED',
          paymentStatus: 'COMPLETED',
          amount: 2500.0
        }
      });
      console.log(`✅ Created registration for: ${johnDelegate.email}`);
    } else {
      console.log(`⏭️  Registration already exists for: ${johnDelegate.email}`);
    }
  } else {
    console.log('⚠️  John Delegate user or UNSC committee not found, skipping registration creation');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
