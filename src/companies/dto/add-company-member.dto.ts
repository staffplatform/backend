import { CompanyRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddCompanyMemberDto {
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: CompanyRole, default: CompanyRole.EMPLOYEE })
  @IsOptional()
  @IsEnum(CompanyRole)
  role?: CompanyRole;
}
