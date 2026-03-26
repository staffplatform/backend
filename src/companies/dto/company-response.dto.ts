import { CompanyRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CompanyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({ enum: CompanyRole })
  role!: CompanyRole;

  @ApiProperty()
  storesCount!: number;

  @ApiProperty()
  membersCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CompanyMemberDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string | null;

  @ApiProperty()
  lastName!: string | null;

  @ApiProperty()
  avatarUrl!: string | null;

  @ApiProperty({ enum: CompanyRole })
  role!: CompanyRole;

  @ApiProperty()
  createdAt!: Date;
}
