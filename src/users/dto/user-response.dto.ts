import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '1990-01-20T00:00:00.000Z'
  })
  birthDate?: Date | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/john.jpg' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'Moscow' })
  workCity?: string | null;

  @ApiPropertyOptional({ example: 'ул. Ленина, 10' })
  workAddress?: string | null;

  @ApiPropertyOptional({ example: 'ул. Тверская, 7, офис 12' })
  companyAddress?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
