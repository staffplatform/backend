import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Retail Group' })
  @IsString()
  name!: string;
}
