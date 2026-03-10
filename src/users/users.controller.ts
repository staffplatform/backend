import {
  Body,
  Controller,
  Get,
  Patch,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMe(@GetCurrentUser() currentUser: RequestUser): Promise<UserProfileDto> {
    const user = await this.usersService.findById(currentUser.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.mapUserToProfile(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateMe(
    @GetCurrentUser() currentUser: RequestUser,
    @Body() dto: UpdateProfileDto
  ): Promise<UserProfileDto> {
    const user = await this.usersService.findById(currentUser.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    const updatedUser = await this.usersService.updateProfile(currentUser.sub, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      avatarUrl: dto.avatarUrl,
      workCity: dto.workCity,
      workAddress: dto.workAddress,
      companyAddress: dto.companyAddress
    });

    return this.mapUserToProfile(updatedUser);
  }

  private mapUserToProfile(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    birthDate: Date | null;
    avatarUrl: string | null;
    workCity: string | null;
    workAddress: string | null;
    companyAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      workCity: user.workCity,
      workAddress: user.workAddress,
      companyAddress: user.companyAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
