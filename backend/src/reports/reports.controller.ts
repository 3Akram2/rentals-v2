import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from 'src/app-auth/guards/app-auth.base.guard';
import { ReportsService } from './reports.service';

@ApiTags(Endpoints.Reports)
@Controller(Endpoints.Reports)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('building/:buildingId/year/:year')
    @Public()
    async getYearlyReport(
        @Param('buildingId') buildingId: string,
        @Param('year') year: string,
        @Query('fromMonth') fromMonth?: string,
        @Query('toMonth') toMonth?: string,
    ) {
        return this.reportsService.getYearlyReport(
            buildingId,
            parseInt(year),
            fromMonth ? parseInt(fromMonth) : 1,
            toMonth ? parseInt(toMonth) : 12,
        );
    }
}
