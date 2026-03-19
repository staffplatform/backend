import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { GetScheduleMonthDto } from './dto/get-schedule-month.dto';
import { ScheduleMonthResponseDto } from './dto/schedule-response.dto';
import { UpdateMonthlyScheduleDto } from './dto/update-monthly-schedule.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('month')
  @ApiOkResponse({ type: ScheduleMonthResponseDto })
  async getMonth(
    @GetCurrentUser() currentUser: RequestUser,
    @Query() dto: GetScheduleMonthDto
  ): Promise<ScheduleMonthResponseDto> {
    return this.scheduleService.getMonth(currentUser.sub, dto);
  }

  @Put('month')
  @ApiOkResponse({ type: ScheduleMonthResponseDto })
  async updateMonth(
    @GetCurrentUser() currentUser: RequestUser,
    @Body() dto: UpdateMonthlyScheduleDto
  ): Promise<ScheduleMonthResponseDto> {
    return this.scheduleService.updateMonth(currentUser.sub, dto);
  }
}
