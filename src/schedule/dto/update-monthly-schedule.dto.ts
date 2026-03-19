import { ScheduleEntryType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleEntryChangeDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ enum: ScheduleEntryType })
  @IsOptional()
  @IsEnum(ScheduleEntryType)
  type?: ScheduleEntryType;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(TIME_PATTERN)
  startTime?: string | null;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @Matches(TIME_PATTERN)
  endTime?: string | null;

  @ApiPropertyOptional({ example: 'Подмена в соседнем магазине' })
  @IsOptional()
  @IsString()
  comment?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  clear?: boolean;
}

export class UpdateMonthlyScheduleDto {
  @ApiProperty()
  @IsUUID()
  storeId!: string;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ type: ScheduleEntryChangeDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleEntryChangeDto)
  entries!: ScheduleEntryChangeDto[];
}
