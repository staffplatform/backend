import { BadRequestException, Injectable } from '@nestjs/common';
import { ScheduleEntryType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StoresService } from '../stores/stores.service';
import { DeleteScheduleEntryDto } from './dto/delete-schedule-entry.dto';
import { GetScheduleMonthDto } from './dto/get-schedule-month.dto';
import {
  ScheduleEntryTypesResponseDto,
  ScheduleMonthResponseDto
} from './dto/schedule-response.dto';
import {
  ScheduleEntryChangeDto,
  UpdateMonthlyScheduleDto
} from './dto/update-monthly-schedule.dto';

@Injectable()
export class ScheduleService {
  private readonly scheduleEntryTypes: ScheduleEntryTypesResponseDto['entryTypes'] = [
    { value: ScheduleEntryType.SHIFT, label: 'Смена' },
    { value: ScheduleEntryType.VACATION, label: 'Отпуск' },
    { value: ScheduleEntryType.ABSENCE, label: 'Отсутствие' }
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly storesService: StoresService
  ) {}

  getEntryTypes(): ScheduleEntryTypesResponseDto {
    return {
      entryTypes: this.scheduleEntryTypes
    };
  }

  async getMonth(
    actorId: string,
    dto: GetScheduleMonthDto
  ): Promise<ScheduleMonthResponseDto> {
    const store = await this.storesService.getStoreForUser(dto.storeId, actorId);
    const { monthStart, nextMonthStart, daysInMonth } = this.getMonthBounds(dto.year, dto.month);
    this.ensureMonthIsAvailable(store.activeFrom, nextMonthStart);

    const [employees, entries] = await Promise.all([
      this.prisma.storeEmployee.findMany({
        where: {
          storeId: store.id
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              jobTitle: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      this.prisma.scheduleEntry.findMany({
        where: {
          storeId: store.id,
          date: {
            gte: monthStart,
            lt: nextMonthStart
          }
        },
        orderBy: [{ date: 'asc' }, { userId: 'asc' }]
      })
    ]);

    return {
      store: {
        id: store.id,
        companyId: store.companyId,
        name: store.name,
        city: store.city,
        address: store.address,
        activeFrom: store.activeFrom
      },
      year: dto.year,
      month: dto.month,
      daysInMonth,
      employees: employees.map((employee) => ({
        userId: employee.user.id,
        email: employee.user.email,
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        avatarUrl: employee.user.avatarUrl,
        jobTitle: employee.user.jobTitle
      })),
      entries: entries.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        date: this.formatDate(entry.date),
        type: entry.type,
        startTime: entry.startTime,
        endTime: entry.endTime,
        comment: entry.comment,
        createdById: entry.createdById,
        updatedAt: entry.updatedAt
      }))
    };
  }

  async updateMonth(
    actorId: string,
    dto: UpdateMonthlyScheduleDto
  ): Promise<ScheduleMonthResponseDto> {
    const store = await this.storesService.ensureStoreManager(dto.storeId, actorId);
    const { monthStart, nextMonthStart } = this.getMonthBounds(dto.year, dto.month);
    this.ensureMonthIsAvailable(store.activeFrom, nextMonthStart);
    const uniqueUserIds = [...new Set(dto.entries.map((entry) => entry.userId))];

    if (uniqueUserIds.length > 0) {
      const assignments = await this.prisma.storeEmployee.findMany({
        where: {
          storeId: store.id,
          userId: {
            in: uniqueUserIds
          }
        },
        select: {
          userId: true
        }
      });

      const assignedUserIds = new Set(assignments.map((assignment) => assignment.userId));
      const missingUserId = uniqueUserIds.find((userId) => !assignedUserIds.has(userId));

      if (missingUserId) {
        throw new BadRequestException(
          `User ${missingUserId} is not assigned to this store`
        );
      }
    }

    await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.buildScheduleMutation(
          store.id,
          actorId,
          entry,
          monthStart,
          nextMonthStart,
          store.activeFrom
        )
      )
    );

    return this.getMonth(actorId, {
      storeId: store.id,
      year: dto.year,
      month: dto.month
    });
  }

  async deleteEntry(actorId: string, dto: DeleteScheduleEntryDto): Promise<void> {
    const store = await this.storesService.ensureStoreManager(dto.storeId, actorId);
    const date = this.parseDateOnly(dto.date);

    this.ensureDateIsAvailable(date, store.activeFrom);

    const assignment = await this.prisma.storeEmployee.findUnique({
      where: {
        storeId_userId: {
          storeId: store.id,
          userId: dto.userId
        }
      },
      select: {
        userId: true
      }
    });

    if (!assignment) {
      throw new BadRequestException(`User ${dto.userId} is not assigned to this store`);
    }

    await this.prisma.scheduleEntry.deleteMany({
      where: {
        storeId: store.id,
        userId: dto.userId,
        date
      }
    });
  }

  private buildScheduleMutation(
    storeId: string,
    actorId: string,
    entry: ScheduleEntryChangeDto,
    monthStart: Date,
    nextMonthStart: Date,
    activeFrom: Date
  ) {
    const date = this.parseDateOnly(entry.date);

    if (date < monthStart || date >= nextMonthStart) {
      throw new BadRequestException('Entry date must belong to the requested month');
    }

    this.ensureDateIsAvailable(date, activeFrom);

    if (entry.clear) {
      return this.prisma.scheduleEntry.deleteMany({
        where: {
          storeId,
          userId: entry.userId,
          date
        }
      });
    }

    if (!entry.type) {
      throw new BadRequestException('Entry type is required when creating a schedule entry');
    }

    if ((entry.startTime && !entry.endTime) || (!entry.startTime && entry.endTime)) {
      throw new BadRequestException('startTime and endTime must be filled together');
    }

    if (entry.type !== ScheduleEntryType.SHIFT && (entry.startTime || entry.endTime)) {
      throw new BadRequestException('Only shifts can have startTime and endTime');
    }

    return this.prisma.scheduleEntry.upsert({
      where: {
        storeId_userId_date: {
          storeId,
          userId: entry.userId,
          date
        }
      },
      create: {
        storeId,
        userId: entry.userId,
        date,
        type: entry.type,
        startTime: entry.type === ScheduleEntryType.SHIFT ? entry.startTime ?? null : null,
        endTime: entry.type === ScheduleEntryType.SHIFT ? entry.endTime ?? null : null,
        comment: entry.comment ?? null,
        createdById: actorId
      },
      update: {
        type: entry.type,
        startTime: entry.type === ScheduleEntryType.SHIFT ? entry.startTime ?? null : null,
        endTime: entry.type === ScheduleEntryType.SHIFT ? entry.endTime ?? null : null,
        comment: entry.comment ?? null,
        createdById: actorId
      }
    });
  }

  private getMonthBounds(year: number, month: number): {
    monthStart: Date;
    nextMonthStart: Date;
    daysInMonth: number;
  } {
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    if (
      monthStart.getUTCFullYear() !== year ||
      monthStart.getUTCMonth() !== month - 1
    ) {
      throw new BadRequestException('Invalid year or month');
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    return {
      monthStart,
      nextMonthStart,
      daysInMonth
    };
  }

  private parseDateOnly(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid entry date');
    }

    return date;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private ensureMonthIsAvailable(activeFrom: Date, nextMonthStart: Date): void {
    if (nextMonthStart <= activeFrom) {
      throw new BadRequestException(
        `Schedule is available starting from ${this.formatDate(activeFrom)}`
      );
    }
  }

  private ensureDateIsAvailable(date: Date, activeFrom: Date): void {
    if (date < activeFrom) {
      throw new BadRequestException(
        `Entry date must be on or after ${this.formatDate(activeFrom)}`
      );
    }
  }
}
