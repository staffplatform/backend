import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'ivan.ivanov@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ minLength: 8, example: 'NewStrongPass123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'Ivanov' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Ivan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ivanovich' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: '1990-01-20' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Moscow' })
  @IsOptional()
  @IsString()
  workCity?: string;

  @ApiPropertyOptional({
    description: 'Новый магазин пользователя. Если передан, пользователь будет привязан к магазину.'
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Дата выхода на работу в магазине'
  })
  @IsOptional()
  @IsDateString()
  activeFrom?: string;
}
