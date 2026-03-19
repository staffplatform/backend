import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { AddCompanyMemberDto } from './dto/add-company-member.dto';
import { CompanyDto, CompanyMemberDto } from './dto/company-response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOkResponse({ type: CompanyDto })
  async createCompany(
    @GetCurrentUser() currentUser: RequestUser,
    @Body() dto: CreateCompanyDto
  ): Promise<CompanyDto> {
    return this.companiesService.createCompany(currentUser.sub, dto);
  }

  @Get()
  @ApiOkResponse({ type: CompanyDto, isArray: true })
  async listMyCompanies(@GetCurrentUser() currentUser: RequestUser): Promise<CompanyDto[]> {
    return this.companiesService.listMyCompanies(currentUser.sub);
  }

  @Get('current')
  @ApiOkResponse({ type: CompanyDto })
  async getCurrentCompany(@GetCurrentUser() currentUser: RequestUser): Promise<CompanyDto> {
    return this.companiesService.getCurrentCompany(currentUser.sub);
  }

  @Get(':companyId')
  @ApiOkResponse({ type: CompanyDto })
  async getCompany(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('companyId') companyId: string
  ): Promise<CompanyDto> {
    return this.companiesService.getCompany(companyId, currentUser.sub);
  }

  @Get(':companyId/members')
  @ApiOkResponse({ type: CompanyMemberDto, isArray: true })
  async listMembers(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('companyId') companyId: string
  ): Promise<CompanyMemberDto[]> {
    return this.companiesService.listMembers(companyId, currentUser.sub);
  }

  @Post(':companyId/members')
  @ApiOkResponse({ type: CompanyMemberDto })
  async addMember(
    @GetCurrentUser() currentUser: RequestUser,
    @Param('companyId') companyId: string,
    @Body() dto: AddCompanyMemberDto
  ): Promise<CompanyMemberDto> {
    return this.companiesService.addMember(companyId, currentUser.sub, dto);
  }
}
