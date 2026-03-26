import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, Store } from '@prisma/client';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../database/prisma.service';
import { AssignStoreEmployeeDto } from './dto/assign-store-employee.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDto, StoreEmployeeDto } from './dto/store-response.dto';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesService: CompaniesService
  ) {}

  async createStore(
    companyId: string,
    actorId: string,
    dto: CreateStoreDto
  ): Promise<StoreDto> {
    await this.companiesService.ensureCompanyManager(companyId, actorId);

    const store = await this.prisma.store.create({
      data: {
        companyId,
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

    return this.mapStore(store);
  }

  async listCompanyStores(companyId: string, actorId: string): Promise<StoreDto[]> {
    await this.companiesService.ensureCompanyAccess(companyId, actorId);

    const stores = await this.prisma.store.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return stores.map((store) => this.mapStore(store));
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
    const store = await this.getStoreOrThrow(storeId);
    await this.companiesService.ensureCompanyAccess(store.companyId, actorId);

    const employees = await this.prisma.storeEmployee.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return employees.map((employee) => ({
      userId: employee.user.id,
      email: employee.user.email,
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      avatarUrl: employee.user.avatarUrl,
      assignedAt: employee.createdAt
    }));
  }

  async addEmployee(
    storeId: string,
    actorId: string,
    dto: AssignStoreEmployeeDto
  ): Promise<StoreEmployeeDto> {
    const store = await this.getStoreOrThrow(storeId);
    await this.companiesService.ensureCompanyManager(store.companyId, actorId);

    const companyMember = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: store.companyId,
          userId: dto.userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!companyMember) {
      throw new NotFoundException('User is not a member of this company');
    }

    try {
      const assignment = await this.prisma.storeEmployee.create({
        data: {
          storeId,
          userId: dto.userId
        }
      });

      return {
        userId: companyMember.user.id,
        email: companyMember.user.email,
        firstName: companyMember.user.firstName,
        lastName: companyMember.user.lastName,
        avatarUrl: companyMember.user.avatarUrl,
        assignedAt: assignment.createdAt
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('User is already assigned to this store');
      }

      throw error;
    }
  }

  async getStoreForUser(storeId: string, actorId: string): Promise<Store> {
    const store = await this.getStoreOrThrow(storeId);
    await this.companiesService.ensureCompanyAccess(store.companyId, actorId);
    return store;
  }

  async ensureStoreManager(storeId: string, actorId: string): Promise<Store> {
    const store = await this.getStoreOrThrow(storeId);
    await this.companiesService.ensureCompanyManager(store.companyId, actorId);
    return store;
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
    companyId: string;
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
      companyId: store.companyId,
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
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
