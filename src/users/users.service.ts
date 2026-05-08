import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, StoreRole, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findProfileById(id: string): Promise<UserWithAssignments | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.userAssignmentsInclude
    });
  }

  async createManagedUser(actorId: string, dto: CreateUserDto): Promise<UserWithAssignments> {
    if (dto.activeFrom && !dto.storeId) {
      throw new BadRequestException('storeId is required when activeFrom is provided');
    }

    if (dto.storeId) {
      await this.ensureCanManageStore(dto.storeId, actorId);
    } else {
      await this.ensureCanManageUsers(actorId);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            lastName: dto.lastName,
            firstName: dto.firstName,
            middleName: dto.middleName,
            birthDate: this.toUtcDateOnly(dto.birthDate),
            workCity: dto.workCity
          }
        });

        if (dto.storeId) {
          await tx.storeEmployee.create({
            data: {
              storeId: dto.storeId,
              userId: user.id,
              role: StoreRole.EMPLOYEE,
              activeFrom: dto.activeFrom ? this.toUtcDateOnly(dto.activeFrom) : undefined
            }
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id: user.id },
          include: this.userAssignmentsInclude
        });
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already in use');
      }

      throw error;
    }
  }

  async updateManagedUser(
    actorId: string,
    userId: string,
    dto: UpdateUserDto
  ): Promise<UserWithAssignments> {
    if (dto.activeFrom && !dto.storeId) {
      throw new BadRequestException('storeId is required when activeFrom is provided');
    }

    await this.ensureCanManageTargetUser(actorId, userId);

    if (dto.storeId) {
      await this.ensureCanManageStore(dto.storeId, actorId);
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, this.saltRounds)
      : undefined;

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            email: dto.email ? dto.email.toLowerCase() : undefined,
            passwordHash,
            refreshTokenHash: dto.email || dto.password ? null : undefined,
            lastName: dto.lastName,
            firstName: dto.firstName,
            middleName: dto.middleName,
            birthDate: dto.birthDate ? this.toUtcDateOnly(dto.birthDate) : undefined,
            workCity: dto.workCity
          }
        });

        if (dto.storeId) {
          await tx.storeEmployee.upsert({
            where: {
              storeId_userId: {
                storeId: dto.storeId,
                userId
              }
            },
            update: {
              activeFrom: dto.activeFrom ? this.toUtcDateOnly(dto.activeFrom) : undefined
            },
            create: {
              storeId: dto.storeId,
              userId,
              role: StoreRole.EMPLOYEE,
              activeFrom: dto.activeFrom ? this.toUtcDateOnly(dto.activeFrom) : undefined
            }
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id: userId },
          include: this.userAssignmentsInclude
        });
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already in use');
      }

      throw error;
    }
  }

  async deleteManagedUser(actorId: string, userId: string): Promise<void> {
    if (actorId === userId) {
      throw new BadRequestException('You cannot delete your own user');
    }

    await this.ensureCanManageTargetUser(actorId, userId);

    await this.prisma.user.delete({
      where: { id: userId }
    });
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      birthDate?: Date | null;
      avatarUrl?: string;
      jobTitle?: string;
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

  private readonly userAssignmentsInclude = {
    storeAssignments: {
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' as const
      }
    }
  };

  private async ensureCanManageUsers(actorId: string): Promise<void> {
    const managerStoresCount = await this.prisma.storeEmployee.count({
      where: {
        userId: actorId,
        role: {
          in: [StoreRole.OWNER, StoreRole.MANAGER]
        }
      }
    });

    if (managerStoresCount === 0) {
      throw new ForbiddenException('You do not have access to manage users');
    }
  }

  private async ensureCanManageStore(storeId: string, actorId: string): Promise<void> {
    const membership = await this.prisma.storeEmployee.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId: actorId
        }
      },
      select: {
        role: true
      }
    });

    if (!membership) {
      throw new NotFoundException('Store not found');
    }

    if (membership.role === StoreRole.EMPLOYEE) {
      throw new ForbiddenException('You do not have access to manage this store');
    }
  }

  private async ensureCanManageTargetUser(actorId: string, userId: string): Promise<void> {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        storeAssignments: {
          select: {
            storeId: true
          }
        }
      }
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.storeAssignments.length === 0) {
      await this.ensureCanManageUsers(actorId);
      return;
    }

    const targetStoreIds = [
      ...new Set(target.storeAssignments.map((assignment) => assignment.storeId))
    ];
    const managedAssignmentsCount = await this.prisma.storeEmployee.count({
      where: {
        userId: actorId,
        storeId: {
          in: targetStoreIds
        },
        role: {
          in: [StoreRole.OWNER, StoreRole.MANAGER]
        }
      }
    });

    if (managedAssignmentsCount !== targetStoreIds.length) {
      throw new ForbiddenException('You do not have access to manage this user');
    }
  }

  private toUtcDateOnly(value: string): Date {
    const date = new Date(value);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}

export type UserWithAssignments = Prisma.UserGetPayload<{
  include: {
    storeAssignments: {
      include: {
        store: {
          select: {
            id: true;
            name: true;
            city: true;
          };
        };
      };
    };
  };
}>;
