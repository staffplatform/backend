import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '1990-01-20',
    description: 'Дата рождения в формате ISO 8601 (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/john.jpg',
    description: 'URL аватарки сотрудника'
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'Barista',
    description: 'Должность сотрудника'
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'Moscow',
    description: 'Город, где сотрудник работает'
  })
  @IsOptional()
  @IsString()
  workCity?: string;

  @ApiPropertyOptional({
    example: 'ул. Ленина, 10',
    description: 'Рабочий адрес сотрудника'
  })
  @IsOptional()
  @IsString()
  workAddress?: string;

  @ApiPropertyOptional({
    example: 'ул. Тверская, 7, офис 12',
    description: 'Адрес предприятия'
  })
  @IsOptional()
  @IsString()
  companyAddress?: string;
}
