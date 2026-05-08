import { StoreRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AssignStoreEmployeeDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: StoreRole, default: StoreRole.EMPLOYEE })
  @IsOptional()
  @IsEnum(StoreRole)
  role?: StoreRole;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Дата выхода сотрудника на работу в магазине'
  })
  @IsOptional()
  @IsDateString()
  activeFrom?: string;
}
