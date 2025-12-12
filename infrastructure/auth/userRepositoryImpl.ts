import { IUserRepository } from '../../domain/user/model/IUserRepository';
import { User } from '../../domain/user/model/User';
import { Email } from '../../domain/user/model/Email';
import { prismaClient } from '../prisma/prismaClient';

export class UserRepositoryImpl implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const userData = await prismaClient.user.findUnique({
      where: { id },
    });

    if (!userData) {
      return null;
    }

    return User.reconstruct(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.createdAt,
      userData.updatedAt
    );
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await prismaClient.user.findUnique({
      where: { email: email.toString() },
    });

    if (!userData) {
      return null;
    }

    return User.reconstruct(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.createdAt,
      userData.updatedAt
    );
  }

  async save(user: User): Promise<User> {
    const userData = await prismaClient.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email.toString(),
        passwordHash: user.passwordHash.toString(),
        name: user.name,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email.toString(),
        passwordHash: user.passwordHash.toString(),
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return User.reconstruct(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.createdAt,
      userData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.user.delete({
      where: { id },
    });
  }
}

