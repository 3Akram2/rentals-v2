import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { ReportsService } from './reports.service';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';
import { BuildingAccessService } from 'src/app-auth/building-access.service';

@ApiTags(Endpoints.Reports)
@Controller(Endpoints.Reports)
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly buildingAccessService: BuildingAccessService,
    ) {}

    @Get('building/:buildingId/year/:year')
    @AuthPermissions(Permissions.ReportRead)
    async getYearlyReport(
        @Param('buildingId') buildingId: string,
        @Param('year') year: string,
        @Query('fromMonth') fromMonth?: string,
        @Query('toMonth') toMonth?: string,
        @CurrentUser() user?: User,
    ) {
        await this.buildingAccessService.assertBuildingAccess(user, buildingId);
        return this.reportsService.getYearlyReport(
            buildingId,
            parseInt(year),
            fromMonth ? parseInt(fromMonth) : 1,
            toMonth ? parseInt(toMonth) : 12,
        );
    }
}
