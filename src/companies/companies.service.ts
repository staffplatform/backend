import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { CompanyRole, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AddCompanyMemberDto } from './dto/add-company-member.dto';
import { CompanyDto, CompanyMemberDto } from './dto/company-response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  async createCompany(ownerId: string, dto: CreateCompanyDto): Promise<CompanyDto> {
    const existingMembership = await this.prisma.companyMember.findUnique({
      where: {
        userId: ownerId
      }
    });

    if (existingMembership) {
      throw new ConflictException('User already belongs to a company');
    }

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: dto.name,
          ownerId
        }
      });

      await tx.companyMember.create({
        data: {
          companyId: createdCompany.id,
          userId: ownerId,
          role: CompanyRole.OWNER
        }
      });

      return createdCompany;
    });

    return this.getCompany(company.id, ownerId);
  }

  async getCurrentCompany(userId: string): Promise<CompanyDto> {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        userId
      },
      include: {
        company: {
          include: {
            _count: {
              select: {
                stores: true,
                members: true
              }
            }
          }
        }
      }
    });

    if (!membership) {
      throw new NotFoundException('Company not found');
    }

    return this.mapCompany(membership.company, membership.role);
  }

  async listMyCompanies(userId: string): Promise<CompanyDto[]> {
    return [await this.getCurrentCompany(userId)];
  }

  async getCompany(companyId: string, userId: string): Promise<CompanyDto> {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId
        }
      },
      include: {
        company: {
          include: {
            _count: {
              select: {
                stores: true,
                members: true
              }
            }
          }
        }
      }
    });

    if (!membership) {
      throw new NotFoundException('Company not found');
    }

    return this.mapCompany(membership.company, membership.role);
  }

  async listMembers(companyId: string, userId: string): Promise<CompanyMemberDto[]> {
    await this.ensureCompanyAccess(companyId, userId);

    const members = await this.prisma.companyMember.findMany({
      where: { companyId },
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
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
    });

    return members.map((member) => ({
      userId: member.user.id,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      createdAt: member.createdAt
    }));
  }

  async addMember(
    companyId: string,
    actorId: string,
    dto: AddCompanyMemberDto
  ): Promise<CompanyMemberDto> {
    await this.ensureCompanyManager(companyId, actorId);

    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new NotFoundException('User with this email was not found');
    }

    const existingMembership = await this.prisma.companyMember.findUnique({
      where: {
        userId: user.id
      }
    });

    if (existingMembership) {
      throw new ConflictException('User already belongs to a company');
    }

    try {
      const member = await this.prisma.companyMember.create({
        data: {
          companyId,
          userId: user.id,
          role: dto.role ?? CompanyRole.EMPLOYEE
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

      return {
        userId: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        createdAt: member.createdAt
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('User is already a company member');
      }

      throw error;
    }
  }

  async ensureCompanyAccess(companyId: string, userId: string): Promise<{
    companyId: string;
    role: CompanyRole;
  }> {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId
        }
      }
    });

    if (!membership) {
      throw new NotFoundException('Company not found');
    }

    return {
      companyId: membership.companyId,
      role: membership.role
    };
  }

  async ensureCompanyManager(companyId: string, userId: string): Promise<{
    companyId: string;
    role: CompanyRole;
  }> {
    const membership = await this.ensureCompanyAccess(companyId, userId);

    if (membership.role === CompanyRole.EMPLOYEE) {
      throw new ForbiddenException('You do not have access to manage this company');
    }

    return membership;
  }

  private mapCompany(
    company: {
      id: string;
      name: string;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
      _count: {
        stores: number;
        members: number;
      };
    },
    role: CompanyRole
  ): CompanyDto {
    return {
      id: company.id,
      name: company.name,
      ownerId: company.ownerId,
      role,
      storesCount: company._count.stores,
      membersCount: company._count.members,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
