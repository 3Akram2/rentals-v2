import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/app-config/app-config.module';
import { AppLoggerService } from './app-logger.service';

@Module({
    imports: [AppConfigModule],
    providers: [AppLoggerService],
    exports: [AppLoggerService],
})
export class AppLoggerModule {}
