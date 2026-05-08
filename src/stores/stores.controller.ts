import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { AssignStoreEmployeeDto } from './dto/assign-store-employee.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDto, StoreEmployeeDto } from './dto/store-response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post('stores')
  @ApiOperation({ summary: 'Создать магазин и назначить текущего пользователя владельцем' })
  @ApiOkResponse({ type: StoreDto })
  async createStore(
    @GetCurrentUser() currentUser: RequestUser,
    @Body() dto: CreateStoreDto
  ): Promise<StoreDto> {
    return this.storesService.createStore(currentUser.sub, dto);
  }

  @Get('stores/my')
  @ApiOperation({ summary: 'Получить список магазинов, к которым привязан текущий пользователь' })
  @ApiOkResponse({ type: StoreDto, isArray: true })
  async listMyStores(@GetCurrentUser() currentUser: RequestUser): Promise<StoreDto[]> {
    return this.storesService.listMyStores(currentUser.sub);
  }

  @Patch('stores/:storeId')
  @ApiOperation({ summary: 'Редактировать магазин с ролью владелец' })
  @ApiOkResponse({ type: StoreDto })
  async updateStore(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: UpdateStoreDto
  ): Promise<StoreDto> {
    return this.storesService.updateStore(storeId, currentUser.sub, dto);
  }

  @Delete('stores/:storeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить магазин с ролью владелец' })
  @ApiNoContentResponse()
  async deleteStore(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('storeId') storeId: string
  ): Promise<void> {
    await this.storesService.deleteStore(storeId, currentUser.sub);
  }

  @Post('stores/:storeId/employees')
  @ApiOperation({ summary: 'Добавить сотрудника в магазин и назначить роль на уровне магазина' })
  @ApiOkResponse({ type: StoreEmployeeDto })
  async addEmployee(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: AssignStoreEmployeeDto
  ): Promise<StoreEmployeeDto> {
    return this.storesService.addEmployee(storeId, currentUser.sub, dto);
  }

  @Get('stores/:storeId/employees')
  @ApiOperation({ summary: 'Получить список сотрудников магазина' })
  @ApiOkResponse({ type: StoreEmployeeDto, isArray: true })
  async listStoreEmployees(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('storeId') storeId: string
  ): Promise<StoreEmployeeDto[]> {
    return this.storesService.listStoreEmployees(storeId, currentUser.sub);
  }
}
