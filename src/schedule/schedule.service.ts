import { BadRequestException, Injectable } from '@nestjs/common';
import { ScheduleEntryType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StoresService } from '../stores/stores.service';
import { DeleteScheduleEntryDto } from './dto/delete-schedule-entry.dto';
import { GetScheduleMonthDto, GetScheduleWeekDto } from './dto/get-schedule-month.dto';
import {
  ScheduleEntryTypesResponseDto,
  ScheduleEmployeeDto,
  ScheduleEntryDto,
  ScheduleMonthResponseDto,
  ScheduleStoreDto,
  ScheduleWeekResponseDto
} from './dto/schedule-response.dto';
import {
  ScheduleEntryChangeDto,
  UpdateMonthlyScheduleDto,
  UpdateWeeklyScheduleDto
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

  async getMonth(actorId: string, dto: GetScheduleMonthDto): Promise<ScheduleMonthResponseDto> {
    const store = await this.storesService.getStoreForUser(dto.storeId, actorId);
    const { monthStart, nextMonthStart, daysInMonth } = this.getMonthBounds(dto.year, dto.month);
    this.ensureMonthIsAvailable(store.activeFrom, nextMonthStart);
    const scheduleData = await this.getScheduleRange(store.id, monthStart, nextMonthStart);

    return {
      store: this.mapScheduleStore(store),
      year: dto.year,
      month: dto.month,
      daysInMonth,
      employees: scheduleData.employees,
      entries: scheduleData.entries
    };
  }

  async getWeek(actorId: string, dto: GetScheduleWeekDto): Promise<ScheduleWeekResponseDto> {
    const store = await this.storesService.getStoreForUser(dto.storeId, actorId);
    const dateInWeek = this.parseDateOnly(dto.week, 'Invalid week date');
    const { weekStart, nextWeekStart } = this.getWeekBounds(dateInWeek);
    this.ensureWeekIsAvailable(store.activeFrom, nextWeekStart);
    const scheduleData = await this.getScheduleRange(store.id, weekStart, nextWeekStart);

    return {
      store: this.mapScheduleStore(store),
      week: this.formatDate(dateInWeek),
      weekStart: this.formatDate(weekStart),
      weekEnd: this.formatDate(this.addDays(nextWeekStart, -1)),
      employees: scheduleData.employees,
      entries: scheduleData.entries
    };
  }

  async updateMonth(
    actorId: string,
    dto: UpdateMonthlyScheduleDto
  ): Promise<ScheduleMonthResponseDto> {
    const store = await this.storesService.ensureStoreManager(dto.storeId, actorId);
    const { monthStart, nextMonthStart } = this.getMonthBounds(dto.year, dto.month);
    this.ensureMonthIsAvailable(store.activeFrom, nextMonthStart);
    await this.updateEntriesInRange(
      store.id,
      actorId,
      dto.entries,
      monthStart,
      nextMonthStart,
      store.activeFrom,
      'month'
    );

    return this.getMonth(actorId, {
      storeId: store.id,
      year: dto.year,
      month: dto.month
    });
  }

  async updateWeek(
    actorId: string,
    dto: UpdateWeeklyScheduleDto
  ): Promise<ScheduleWeekResponseDto> {
    const store = await this.storesService.ensureStoreManager(dto.storeId, actorId);
    const dateInWeek = this.parseDateOnly(dto.week, 'Invalid week date');
    const { weekStart, nextWeekStart } = this.getWeekBounds(dateInWeek);
    this.ensureWeekIsAvailable(store.activeFrom, nextWeekStart);
    await this.updateEntriesInRange(
      store.id,
      actorId,
      dto.entries,
      weekStart,
      nextWeekStart,
      store.activeFrom,
      'week'
    );

    return this.getWeek(actorId, {
      storeId: store.id,
      week: dto.week
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

  private async updateEntriesInRange(
    storeId: string,
    actorId: string,
    entries: ScheduleEntryChangeDto[],
    rangeStart: Date,
    rangeEndExclusive: Date,
    activeFrom: Date,
    rangeLabel: 'month' | 'week'
  ): Promise<void> {
    const uniqueUserIds = [...new Set(entries.map((entry) => entry.userId))];

    if (uniqueUserIds.length > 0) {
      const assignments = await this.prisma.storeEmployee.findMany({
        where: {
          storeId,
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
        throw new BadRequestException(`User ${missingUserId} is not assigned to this store`);
      }
    }

    await this.prisma.$transaction(
      entries.map((entry) =>
        this.buildScheduleMutation(
          storeId,
          actorId,
          entry,
          rangeStart,
          rangeEndExclusive,
          activeFrom,
          rangeLabel
        )
      )
    );
  }

  private buildScheduleMutation(
    storeId: string,
    actorId: string,
    entry: ScheduleEntryChangeDto,
    rangeStart: Date,
    rangeEndExclusive: Date,
    activeFrom: Date,
    rangeLabel: 'month' | 'week'
  ) {
    const date = this.parseDateOnly(entry.date);

    if (date < rangeStart || date >= rangeEndExclusive) {
      throw new BadRequestException(`Entry date must belong to the requested ${rangeLabel}`);
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
        startTime: entry.type === ScheduleEntryType.SHIFT ? (entry.startTime ?? null) : null,
        endTime: entry.type === ScheduleEntryType.SHIFT ? (entry.endTime ?? null) : null,
        comment: entry.comment ?? null,
        createdById: actorId
      },
      update: {
        type: entry.type,
        startTime: entry.type === ScheduleEntryType.SHIFT ? (entry.startTime ?? null) : null,
        endTime: entry.type === ScheduleEntryType.SHIFT ? (entry.endTime ?? null) : null,
        comment: entry.comment ?? null,
        createdById: actorId
      }
    });
  }

  private getMonthBounds(
    year: number,
    month: number
  ): {
    monthStart: Date;
    nextMonthStart: Date;
    daysInMonth: number;
  } {
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    if (monthStart.getUTCFullYear() !== year || monthStart.getUTCMonth() !== month - 1) {
      throw new BadRequestException('Invalid year or month');
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    return {
      monthStart,
      nextMonthStart,
      daysInMonth
    };
  }

  private getWeekBounds(date: Date): {
    weekStart: Date;
    nextWeekStart: Date;
  } {
    const day = date.getUTCDay();
    const offsetToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = this.addDays(date, offsetToMonday);
    const nextWeekStart = this.addDays(weekStart, 7);

    return {
      weekStart,
      nextWeekStart
    };
  }

  private parseDateOnly(value: string, errorMessage = 'Invalid entry date'): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(errorMessage);
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || this.formatDate(date) !== value) {
      throw new BadRequestException(errorMessage);
    }

    return date;
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private async getScheduleRange(
    storeId: string,
    rangeStart: Date,
    rangeEndExclusive: Date
  ): Promise<{
    employees: ScheduleEmployeeDto[];
    entries: ScheduleEntryDto[];
  }> {
    const [employees, entries] = await Promise.all([
      this.prisma.storeEmployee.findMany({
        where: {
          storeId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              middleName: true,
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
          storeId,
          date: {
            gte: rangeStart,
            lt: rangeEndExclusive
          }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { endTime: 'asc' }, { userId: 'asc' }]
      })
    ]);

    return {
      employees: employees.map((employee) => ({
        userId: employee.user.id,
        email: employee.user.email,
        firstName: employee.user.firstName,
        middleName: employee.user.middleName,
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

  private mapScheduleStore(store: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    activeFrom: Date;
  }): ScheduleStoreDto {
    return {
      id: store.id,
      name: store.name,
      city: store.city,
      address: store.address,
      activeFrom: store.activeFrom
    };
  }

  private ensureMonthIsAvailable(activeFrom: Date, nextMonthStart: Date): void {
    if (nextMonthStart <= activeFrom) {
      throw new BadRequestException(
        `Schedule is available starting from ${this.formatDate(activeFrom)}`
      );
    }
  }

  private ensureWeekIsAvailable(activeFrom: Date, nextWeekStart: Date): void {
    if (nextWeekStart <= activeFrom) {
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
