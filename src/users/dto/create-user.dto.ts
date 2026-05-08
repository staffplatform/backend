import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'ivan.ivanov@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Ivanov' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'Ivan' })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Ivanovich' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: '1990-01-20' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: 'Moscow' })
  @IsString()
  workCity!: string;

  @ApiPropertyOptional({
    description: 'Магазин, в котором пользователь будет работать'
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
