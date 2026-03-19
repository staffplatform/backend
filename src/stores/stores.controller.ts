import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { AssignStoreEmployeeDto } from './dto/assign-store-employee.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDto, StoreEmployeeDto } from './dto/store-response.dto';
import { StoresService } from './stores.service';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post('companies/:companyId/stores')
  @ApiOkResponse({ type: StoreDto })
  async createStore(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('companyId') companyId: string,
    @Body() dto: CreateStoreDto
  ): Promise<StoreDto> {
    return this.storesService.createStore(companyId, currentUser.sub, dto);
  }

  @Get('companies/:companyId/stores')
  @ApiOkResponse({ type: StoreDto, isArray: true })
  async listCompanyStores(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('companyId') companyId: string
  ): Promise<StoreDto[]> {
    return this.storesService.listCompanyStores(companyId, currentUser.sub);
  }

  @Get('stores/my')
  @ApiOkResponse({ type: StoreDto, isArray: true })
  async listMyStores(@GetCurrentUser() currentUser: RequestUser): Promise<StoreDto[]> {
    return this.storesService.listMyStores(currentUser.sub);
  }

  @Post('stores/:storeId/employees')
  @ApiOkResponse({ type: StoreEmployeeDto })
  async addEmployee(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: AssignStoreEmployeeDto
  ): Promise<StoreEmployeeDto> {
    return this.storesService.addEmployee(storeId, currentUser.sub, dto);
  }

  @Get('stores/:storeId/employees')
  @ApiOkResponse({ type: StoreEmployeeDto, isArray: true })
  async listStoreEmployees(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('storeId') storeId: string
  ): Promise<StoreEmployeeDto[]> {
    return this.storesService.listStoreEmployees(storeId, currentUser.sub);
  }
}
