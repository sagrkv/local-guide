import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

async function createUsers() {
  const sagarPassword = 'Sagar@Summer2024!';
  const piyushPassword = 'Piyush@Summer2024!';

  const sagarHash = await bcrypt.hash(sagarPassword, 10);
  const piyushHash = await bcrypt.hash(piyushPassword, 10);

  const sagar = await prisma.user.upsert({
    where: { email: 'sagar@summerstudios.in' },
    update: { password: sagarHash, name: 'Sagar', role: 'ADMIN' },
    create: {
      email: 'sagar@summerstudios.in',
      password: sagarHash,
      name: 'Sagar',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created/Updated:', sagar.email);

  const piyush = await prisma.user.upsert({
    where: { email: 'piyush@summerstudios.in' },
    update: { password: piyushHash, name: 'Piyush', role: 'ADMIN' },
    create: {
      email: 'piyush@summerstudios.in',
      password: piyushHash,
      name: 'Piyush',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created/Updated:', piyush.email);

  console.log('\n--- Credentials ---');
  console.log('sagar@summerstudios.in:', sagarPassword);
  console.log('piyush@summerstudios.in:', piyushPassword);

  await prisma.$disconnect();
}

createUsers().catch(console.error);
