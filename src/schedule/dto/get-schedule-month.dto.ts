import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Matches, Max, Min } from 'class-validator';

export class GetScheduleMonthDto {
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
}

export class GetScheduleWeekDto {
  @ApiProperty()
  @IsUUID()
  storeId!: string;

  @ApiProperty({ example: '2026-03-26' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'week must be a valid date in YYYY-MM-DD format'
  })
  week!: string;
}
