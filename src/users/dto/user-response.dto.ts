import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreRole } from '@prisma/client';

export class UserStoreAssignmentDto {
  @ApiProperty()
  storeId!: string;

  @ApiProperty()
  storeName!: string;

  @ApiPropertyOptional()
  storeCity!: string | null;

  @ApiProperty({ enum: StoreRole })
  role!: StoreRole;

  @ApiPropertyOptional({ example: '2026-06-01' })
  activeFrom!: Date | null;

  @ApiProperty()
  assignedAt!: Date;
}

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  email!: string | null;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  middleName?: string | null;

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

  @ApiPropertyOptional({ example: 'Barista' })
  jobTitle?: string | null;

  @ApiPropertyOptional({ example: 'Moscow' })
  workCity?: string | null;

  @ApiPropertyOptional({ example: 'ул. Ленина, 10' })
  workAddress?: string | null;

  @ApiPropertyOptional({ example: 'ул. Тверская, 7, офис 12' })
  companyAddress?: string | null;

  @ApiPropertyOptional({ type: UserStoreAssignmentDto, isArray: true })
  storeAssignments?: UserStoreAssignmentDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
