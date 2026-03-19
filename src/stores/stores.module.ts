import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  imports: [CompaniesModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService]
})
export class StoresModule {}
