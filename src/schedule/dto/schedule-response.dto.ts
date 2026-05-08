import { ScheduleEntryType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleEntryTypeDto {
  @ApiProperty({ enum: ScheduleEntryType })
  value!: ScheduleEntryType;

  @ApiProperty({ example: 'Смена' })
  label!: string;
}

export class ScheduleEntryTypesResponseDto {
  @ApiProperty({ type: ScheduleEntryTypeDto, isArray: true })
  entryTypes!: ScheduleEntryTypeDto[];
}

export class ScheduleStoreDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  city!: string | null;

  @ApiPropertyOptional()
  address!: string | null;

  @ApiProperty({ example: '2026-03-01' })
  activeFrom!: Date;
}

export class ScheduleEmployeeDto {
  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  email!: string | null;

  @ApiPropertyOptional()
  firstName!: string | null;

  @ApiPropertyOptional()
  middleName!: string | null;

  @ApiPropertyOptional()
  lastName!: string | null;

  @ApiPropertyOptional()
  avatarUrl!: string | null;

  @ApiPropertyOptional({ example: 'Barista' })
  jobTitle!: string | null;
}

export class ScheduleEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ example: '2026-03-15' })
  date!: string;

  @ApiProperty({ enum: ScheduleEntryType })
  type!: ScheduleEntryType;

  @ApiPropertyOptional()
  startTime!: string | null;

  @ApiPropertyOptional()
  endTime!: string | null;

  @ApiPropertyOptional()
  comment!: string | null;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  updatedAt!: Date;
}

export class ScheduleMonthResponseDto {
  @ApiProperty({ type: ScheduleStoreDto })
  store!: ScheduleStoreDto;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  month!: number;

  @ApiProperty()
  daysInMonth!: number;

  @ApiProperty({ type: ScheduleEmployeeDto, isArray: true })
  employees!: ScheduleEmployeeDto[];

  @ApiProperty({ type: ScheduleEntryDto, isArray: true })
  entries!: ScheduleEntryDto[];
}

export class ScheduleWeekResponseDto {
  @ApiProperty({ type: ScheduleStoreDto })
  store!: ScheduleStoreDto;

  @ApiProperty({ example: '2026-03-26' })
  week!: string;

  @ApiProperty({ example: '2026-03-23' })
  weekStart!: string;

  @ApiProperty({ example: '2026-03-29' })
  weekEnd!: string;

  @ApiProperty({ type: ScheduleEmployeeDto, isArray: true })
  employees!: ScheduleEmployeeDto[];

  @ApiProperty({ type: ScheduleEntryDto, isArray: true })
  entries!: ScheduleEntryDto[];
}
