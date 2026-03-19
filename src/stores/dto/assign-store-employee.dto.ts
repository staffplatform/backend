import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignStoreEmployeeDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;
}
