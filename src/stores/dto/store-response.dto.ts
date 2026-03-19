import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  city!: string | null;

  @ApiPropertyOptional()
  address!: string | null;

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

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName!: string | null;

  @ApiPropertyOptional()
  lastName!: string | null;

  @ApiPropertyOptional()
  avatarUrl!: string | null;

  @ApiProperty()
  assignedAt!: Date;
}
