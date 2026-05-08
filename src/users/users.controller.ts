import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  Post,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-response.dto';
import { UsersService, UserWithAssignments } from './users.service';

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
      middleName: dto.middleName,
      lastName: dto.lastName,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      avatarUrl: dto.avatarUrl,
      jobTitle: dto.jobTitle,
      workCity: dto.workCity,
      workAddress: dto.workAddress,
      companyAddress: dto.companyAddress
    });

    return this.mapUserToProfile(updatedUser);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создать пользователя вручную с ролью владельца или администратора магазина'
  })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createUser(
    @GetCurrentUser() currentUser: RequestUser,
    @Body() dto: CreateUserDto
  ): Promise<UserProfileDto> {
    const user = await this.usersService.createManagedUser(currentUser.sub, dto);
    return this.mapUserToProfile(user);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновить пользователя вручную с ролью владельца или администратора магазина'
  })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateUser(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto
  ): Promise<UserProfileDto> {
    const user = await this.usersService.updateManagedUser(currentUser.sub, userId, dto);
    return this.mapUserToProfile(user);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить пользователя вручную с ролью владельца или администратора магазина'
  })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteUser(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('userId') userId: string
  ): Promise<void> {
    await this.usersService.deleteManagedUser(currentUser.sub, userId);
  }

  private mapUserToProfile(
    user:
      | {
          id: string;
          email: string | null;
          firstName: string | null;
          middleName: string | null;
          lastName: string | null;
          birthDate: Date | null;
          avatarUrl: string | null;
          jobTitle: string | null;
          workCity: string | null;
          workAddress: string | null;
          companyAddress: string | null;
          createdAt: Date;
          updatedAt: Date;
        }
      | UserWithAssignments
  ): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle,
      workCity: user.workCity,
      workAddress: user.workAddress,
      companyAddress: user.companyAddress,
      storeAssignments:
        'storeAssignments' in user
          ? user.storeAssignments.map((assignment) => ({
              storeId: assignment.store.id,
              storeName: assignment.store.name,
              storeCity: assignment.store.city,
              role: assignment.role,
              activeFrom: assignment.activeFrom,
              assignedAt: assignment.createdAt
            }))
          : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
