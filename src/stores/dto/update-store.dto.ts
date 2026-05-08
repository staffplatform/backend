import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Aviapark' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Moscow' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Ходынский бульвар, 4' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Store becomes schedulable starting from this date'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  activeFrom?: Date;
}
