import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config-builders/app.config';
import databaseConfig from './config-builders/database.config';
import yamlConfig from './config-builders/yaml.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            // use ConfigService directly without need to import ConfigModule first
            isGlobal: true,
            expandVariables: true,
            cache: true,
            // order matters, later will override the previous if the same key
            load: [appConfig, databaseConfig, yamlConfig],
        }),
    ],
    providers: [ConfigService],
    exports: [],
})
export class AppConfigModule implements OnModuleInit {
    constructor(private readonly configService: ConfigService) {}
    onModuleInit() {
        // you can populate objects depending on config.yaml here as soon as possible.
    }
}
