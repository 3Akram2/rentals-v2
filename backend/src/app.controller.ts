import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from './app-auth/guards/app-auth.base.guard';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @Public()
    getDefaultLandingResponse(): any {
        return { message: 'server is ready' };
    }

    @Get('health')
    @Public()
    @HttpCode(200)
    getHealth(): any {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }

    @Get('app-info')
    @ApiBearerAuth()
    getAppInfo(): any {
        return this.appService.getAppInfo();
    }
}
