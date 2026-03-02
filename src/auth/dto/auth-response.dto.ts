import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;
}

export class TokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ type: TokensDto })
  tokens!: TokensDto;
}

export class RefreshResponseDto {
  @ApiProperty({ type: TokensDto })
  tokens!: TokensDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}
