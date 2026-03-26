import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class DeleteScheduleEntryDto {
  @ApiProperty()
  @IsUUID()
  storeId!: string;

  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date!: string;
}
