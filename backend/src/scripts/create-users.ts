import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

async function createUsers() {
  const sagarPassword = 'Sagar@Boko2024!';
  const piyushPassword = 'Piyush@Boko2024!';

  const sagarHash = await bcrypt.hash(sagarPassword, 10);
  const piyushHash = await bcrypt.hash(piyushPassword, 10);

  const sagar = await prisma.user.upsert({
    where: { email: 'sagar@boko.app' },
    update: { password: sagarHash, name: 'Sagar', role: 'ADMIN' },
    create: {
      email: 'sagar@boko.app',
      password: sagarHash,
      name: 'Sagar',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created/Updated:', sagar.email);

  const piyush = await prisma.user.upsert({
    where: { email: 'piyush@boko.app' },
    update: { password: piyushHash, name: 'Piyush', role: 'ADMIN' },
    create: {
      email: 'piyush@boko.app',
      password: piyushHash,
      name: 'Piyush',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created/Updated:', piyush.email);

  console.log('\n--- Credentials ---');
  console.log('sagar@boko.app:', sagarPassword);
  console.log('piyush@boko.app:', piyushPassword);

  await prisma.$disconnect();
}

createUsers().catch(console.error);
