import { StoreRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  city!: string | null;

  @ApiPropertyOptional()
  address!: string | null;

  @ApiProperty({ example: '2026-03-01' })
  activeFrom!: Date;

  @ApiProperty()
  employeesCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class StoreEmployeeDto {
  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  email!: string | null;

  @ApiPropertyOptional()
  firstName!: string | null;

  @ApiPropertyOptional()
  middleName!: string | null;

  @ApiPropertyOptional()
  lastName!: string | null;

  @ApiPropertyOptional()
  avatarUrl!: string | null;

  @ApiProperty({ enum: StoreRole })
  role!: StoreRole;

  @ApiPropertyOptional({ example: '2026-06-01' })
  activeFrom!: Date | null;

  @ApiProperty()
  assignedAt!: Date;
}
