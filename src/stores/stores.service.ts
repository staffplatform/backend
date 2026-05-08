import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, Store, StoreRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AssignStoreEmployeeDto } from './dto/assign-store-employee.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDto, StoreEmployeeDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  async createStore(actorId: string, dto: CreateStoreDto): Promise<StoreDto> {
    const store = await this.prisma.$transaction(async (tx) => {
      const createdStore = await tx.store.create({
        data: {
          name: dto.name,
          city: dto.city,
          address: dto.address,
          activeFrom: this.toUtcDateOnly(dto.activeFrom)
        },
        include: {
          _count: {
            select: {
              employees: true
            }
          }
        }
      });

      await tx.storeEmployee.create({
        data: {
          storeId: createdStore.id,
          userId: actorId,
          role: StoreRole.OWNER
        }
      });

      return {
        ...createdStore,
        _count: {
          employees: createdStore._count.employees + 1
        }
      };
    });

    return this.mapStore(store);
  }

  async listMyStores(userId: string): Promise<StoreDto[]> {
    const assignments = await this.prisma.storeEmployee.findMany({
      where: { userId },
      include: {
        store: {
          include: {
            _count: {
              select: {
                employees: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return assignments.map((assignment) => this.mapStore(assignment.store));
  }

  async listStoreEmployees(storeId: string, actorId: string): Promise<StoreEmployeeDto[]> {
    await this.getStoreMembershipOrThrow(storeId, actorId);

    const employees = await this.prisma.storeEmployee.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            middleName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
    });

    return employees.map((employee) => ({
      userId: employee.user.id,
      email: employee.user.email,
      firstName: employee.user.firstName,
      middleName: employee.user.middleName,
      lastName: employee.user.lastName,
      avatarUrl: employee.user.avatarUrl,
      role: employee.role,
      activeFrom: employee.activeFrom,
      assignedAt: employee.createdAt
    }));
  }

  async addEmployee(
    storeId: string,
    actorId: string,
    dto: AssignStoreEmployeeDto
  ): Promise<StoreEmployeeDto> {
    await this.ensureStoreManager(storeId, actorId);

    if (dto.role === StoreRole.OWNER) {
      throw new ConflictException('Owner role can only be assigned when creating a store');
    }

    const user = await this.usersService.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const assignment = await this.prisma.storeEmployee.create({
        data: {
          storeId,
          userId: dto.userId,
          role: dto.role ?? StoreRole.EMPLOYEE,
          activeFrom: dto.activeFrom ? this.toUtcDateOnly(new Date(dto.activeFrom)) : undefined
        }
      });

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: assignment.role,
        activeFrom: assignment.activeFrom,
        assignedAt: assignment.createdAt
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('User is already assigned to this store');
      }

      throw error;
    }
  }

  async updateStore(storeId: string, actorId: string, dto: UpdateStoreDto): Promise<StoreDto> {
    await this.ensureStoreOwner(storeId, actorId);

    const data: Prisma.StoreUpdateInput = {
      name: dto.name,
      city: dto.city,
      address: dto.address,
      activeFrom: dto.activeFrom ? this.toUtcDateOnly(dto.activeFrom) : undefined
    };

    const store = await this.prisma.store.update({
      where: { id: storeId },
      data,
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    return this.mapStore(store);
  }

  async deleteStore(storeId: string, actorId: string): Promise<void> {
    await this.ensureStoreOwner(storeId, actorId);

    await this.prisma.store.delete({
      where: { id: storeId }
    });
  }

  async getStoreForUser(storeId: string, actorId: string): Promise<Store> {
    await this.getStoreMembershipOrThrow(storeId, actorId);
    return this.getStoreOrThrow(storeId);
  }

  async ensureStoreManager(storeId: string, actorId: string): Promise<Store> {
    const membership = await this.getStoreMembershipOrThrow(storeId, actorId);

    if (membership.role === StoreRole.EMPLOYEE) {
      throw new ForbiddenException('You do not have access to manage this store');
    }

    return this.getStoreOrThrow(storeId);
  }

  private async ensureStoreOwner(storeId: string, actorId: string): Promise<Store> {
    const membership = await this.getStoreMembershipOrThrow(storeId, actorId);

    if (membership.role !== StoreRole.OWNER) {
      throw new ForbiddenException('Only store owner can manage this store');
    }

    return this.getStoreOrThrow(storeId);
  }

  private async getStoreMembershipOrThrow(storeId: string, userId: string) {
    const membership = await this.prisma.storeEmployee.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId
        }
      },
      select: {
        role: true
      }
    });

    if (!membership) {
      throw new NotFoundException('Store not found');
    }

    return membership;
  }

  private async getStoreOrThrow(storeId: string): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  private mapStore(store: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    activeFrom: Date;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      employees: number;
    };
  }): StoreDto {
    return {
      id: store.id,
      name: store.name,
      city: store.city,
      address: store.address,
      activeFrom: store.activeFrom,
      employeesCount: store._count.employees,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };
  }

  private toUtcDateOnly(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
