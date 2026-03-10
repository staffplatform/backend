import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      birthDate?: Date | null;
      avatarUrl?: string;
      workCity?: string;
      workAddress?: string;
      companyAddress?: string;
    }
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data
    });
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null }
    });
  }
}
