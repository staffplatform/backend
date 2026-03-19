import { ScheduleEntryType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleStoreDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  city!: string | null;

  @ApiPropertyOptional()
  address!: string | null;
}

export class ScheduleEmployeeDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName!: string | null;

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
