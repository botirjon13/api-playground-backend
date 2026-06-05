import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@apiplayground.local' },
  });

  if (existingAdmin) {
    console.log('✓ Admin user already exists');
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@apiplayground.local',
        password_hash: hashedPassword,
        role: Role.ADMIN,
      },
    });

    console.log(`✓ Admin user created: ${admin.email}`);
  }

  // Check if student user already exists
  const existingStudent = await prisma.user.findUnique({
    where: { email: 'student@apiplayground.local' },
  });

  if (existingStudent) {
    console.log('✓ Student user already exists');
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash('Student123!', 10);

    // Create student user
    const student = await prisma.user.create({
      data: {
        email: 'student@apiplayground.local',
        password_hash: hashedPassword,
        role: Role.STUDENT,
      },
    });

    console.log(`✓ Student user created: ${student.email}`);
  }

  console.log('✓ Seed completed successfully');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
