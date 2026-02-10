import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
    private appInfo;
    constructor(private readonly configService: ConfigService) {
        this.appInfo = configService.get('app');
    }

    getAppInfo() {
        return this.appInfo;
    }
}
