import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

export async function seed() {
  console.log('Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Get the User repository
  const userRepository = dataSource.getRepository(User);

  // Define test users
  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'admin123',
      role: UserRole.ADMIN,
    },
    {
      email: 'manager@example.com',
      password: 'manager123',
      role: UserRole.MANAGER,
    },
    {
      email: 'user@example.com',
      password: 'user123',
      role: UserRole.USER,
    },
  ];

  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create new user
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(
        `Created user: ${userData.email} with role: ${userData.role}`,
      );
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await app.close();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
