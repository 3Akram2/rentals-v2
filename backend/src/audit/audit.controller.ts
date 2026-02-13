import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { SuperAdminAccessGuard } from 'src/app-auth/guards/super-admin-access.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Get('events')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async listEvents(
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '25',
        @Query('eventType') eventType?: string,
        @Query('status') status?: 'success' | 'fail',
        @Query('module') module?: string,
        @Query('userId') userId?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        const pageNum = Math.max(1, Number(page) || 1);
        const sizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));

        return this.auditService.listEvents({
            page: pageNum,
            pageSize: sizeNum,
            eventType,
            status,
            module,
            userId,
            dateFrom,
            dateTo,
        });
    }
}
