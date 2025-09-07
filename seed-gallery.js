import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const galleryItems = [
  // Portrait Images
  {
    title: 'UNSC Committee Session',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/7648047/pexels-photo-7648047.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'General Assembly First Committee',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'Economic and Social Council',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1454360/pexels-photo-1454360.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'Human Rights Council',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'International Court of Justice',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'World Health Organization',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'General Assembly Second Committee',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'General Assembly Third Committee',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'General Assembly Fourth Committee',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'General Assembly Fifth Committee',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1454360/pexels-photo-1454360.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'General Assembly Sixth Committee',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },
  {
    title: 'United Nations Environment Programme',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'portraits'
  },

  // Highlight Videos
  {
    title: 'K-MUN 2024 Opening Ceremony',
    type: 'video',
    imageUrl: 'https://images.pexels.com/photos/7648047/pexels-photo-7648047.jpeg?auto=compress&cs=tinysrgb&w=600',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'highlights'
  },
  {
    title: 'Committee Sessions 2024',
    type: 'video',
    imageUrl: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'highlights'
  },
  {
    title: 'Award Ceremony 2024',
    type: 'video',
    imageUrl: 'https://images.pexels.com/photos/1454360/pexels-photo-1454360.jpeg?auto=compress&cs=tinysrgb&w=600',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'highlights'
  },
  {
    title: 'Cultural Night 2024',
    type: 'video',
    imageUrl: 'https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=600',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'highlights'
  },

  // Event Images
  {
    title: 'Registration Day',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'events'
  },
  {
    title: 'Networking Session',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'events'
  },
  {
    title: 'Closing Ceremony',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1454360/pexels-photo-1454360.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'events'
  },
  {
    title: 'Group Photo',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/7648047/pexels-photo-7648047.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'events'
  }
];

async function seedGallery() {
  try {
    console.log('🌱 Seeding gallery items...');

    // Clear existing gallery items
    await prisma.galleryItem.deleteMany({});
    console.log('✅ Cleared existing gallery items');

    // Create new gallery items
    for (const item of galleryItems) {
      await prisma.galleryItem.create({
        data: item
      });
    }

    console.log(`✅ Created ${galleryItems.length} gallery items`);
    console.log('🎉 Gallery seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding gallery:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedGallery();


