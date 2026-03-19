import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'Aviapark' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Moscow' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Ходынский бульвар, 4' })
  @IsOptional()
  @IsString()
  address?: string;
}
