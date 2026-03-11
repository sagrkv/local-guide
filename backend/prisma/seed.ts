import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding database...');

  // =========================================================================
  // Default Admin User
  // =========================================================================
  const adminEmail = 'admin@localguide.in';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('Created default admin user: admin@localguide.in / admin123');
  } else {
    // Ensure existing admin has a password
    if (!existingAdmin.password) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.update({
        where: { email: adminEmail },
        data: { password: hashedPassword },
      });
      console.log('Updated admin user with password');
    } else {
      console.log('Admin user already exists');
    }
  }

  // =========================================================================
  // Default Global Categories (15)
  // =========================================================================
  const defaultCategories = [
    { name: 'Temples & Shrines', icon: 'temple', color: '#E74C3C', emoji: null },
    { name: 'Forts & Palaces', icon: 'castle', color: '#8E44AD', emoji: null },
    { name: 'Museums', icon: 'museum', color: '#2980B9', emoji: null },
    { name: 'Parks & Gardens', icon: 'tree', color: '#27AE60', emoji: null },
    { name: 'Markets & Bazaars', icon: 'shopping-bag', color: '#F39C12', emoji: null },
    { name: 'Restaurants', icon: 'utensils', color: '#E67E22', emoji: null },
    { name: 'Cafes', icon: 'coffee', color: '#795548', emoji: null },
    { name: 'Street Food', icon: 'food-stall', color: '#FF5722', emoji: null },
    { name: 'Nightlife', icon: 'moon', color: '#9C27B0', emoji: null },
    { name: 'Shopping', icon: 'bag', color: '#E91E63', emoji: null },
    { name: 'Beaches', icon: 'umbrella-beach', color: '#00BCD4', emoji: null },
    { name: 'Lakes & Rivers', icon: 'water', color: '#0288D1', emoji: null },
    { name: 'Viewpoints', icon: 'binoculars', color: '#4CAF50', emoji: null },
    { name: 'Art & Culture', icon: 'palette', color: '#FF9800', emoji: null },
    { name: 'Wellness & Spas', icon: 'spa', color: '#009688', emoji: null },
  ];

  for (const [index, cat] of defaultCategories.entries()) {
    const slug = slugify(cat.name);

    // Global categories have cityId = null, so we find by slug + isGlobal
    const existing = await prisma.category.findFirst({
      where: { slug, isGlobal: true, cityId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug,
          icon: cat.icon,
          color: cat.color,
          emoji: cat.emoji,
          isGlobal: true,
          cityId: null,
          sortOrder: index,
        },
      });
    }
  }

  console.log('Created default global categories');

  // =========================================================================
  // Default Tags (10)
  // =========================================================================
  const defaultTags = [
    { name: 'Family-Friendly', color: '#4CAF50' },
    { name: 'Instagram-Worthy', color: '#E91E63' },
    { name: 'Free Entry', color: '#2196F3' },
    { name: 'Street Food', color: '#FF5722' },
    { name: 'Hidden Gem', color: '#9C27B0' },
    { name: 'Budget-Friendly', color: '#4DB6AC' },
    { name: 'Romantic', color: '#F44336' },
    { name: 'Photography', color: '#607D8B' },
    { name: 'Accessible', color: '#00BCD4' },
    { name: 'Pet-Friendly', color: '#8BC34A' },
  ];

  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: {
        name: tag.name,
        slug: slugify(tag.name),
        color: tag.color,
      },
    });
  }

  console.log('Created default tags');

  // =========================================================================
  // Sample City: Mysore
  // =========================================================================
  const mysore = await prisma.city.upsert({
    where: { slug: 'mysore' },
    update: {},
    create: {
      name: 'Mysore',
      slug: 'mysore',
      tagline: 'The City of Palaces',
      description: 'Mysore, officially Mysuru, is a city in the southern part of the Indian state of Karnataka. Known for its glittering royal heritage and magnificent monuments, Mysore is one of the most popular tourist destinations in India.',
      country: 'India',
      state: 'Karnataka',
      centerLat: 12.3051,
      centerLng: 76.6551,
      defaultZoom: 13,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en',
      status: 'DRAFT',
      sortOrder: 0,
    },
  });

  console.log('Created sample city: Mysore');

  // =========================================================================
  // Mysore Theme
  // =========================================================================
  await prisma.cityTheme.upsert({
    where: { cityId: mysore.id },
    update: {},
    create: {
      cityId: mysore.id,
      themePresetId: 'mysore',
      colorPrimary: '#4A0E4E',
      colorSecondary: '#D4AF37',
      colorAccent: '#FFFFF0',
      colorBackground: '#FAF8F5',
      colorText: '#1A1A1A',
      displayFontFamily: "'Playfair Display', serif",
      bodyFontFamily: "'Inter', sans-serif",
      displayFontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
      bodyFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      iconPack: 'default',
    },
  });

  console.log('Created Mysore theme');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
