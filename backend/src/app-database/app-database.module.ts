import { Logger, Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { Databases } from 'src/shared/constants';
import mongoose from 'mongoose';

function getDatabaseConfig(configService: ConfigService, configKey: string): MongooseModuleOptions {
    const dbConfig: MongooseModuleOptions = {};
    const loadedConfig = configService.get(configKey);
    dbConfig.uri = loadedConfig.uri;
    if (loadedConfig.database) {
        dbConfig.dbName = loadedConfig.database;
    }
    if (loadedConfig.username && loadedConfig.password) {
        dbConfig.auth = {
            username: loadedConfig.username,
            password: loadedConfig.password,
        };
        dbConfig.authSource = loadedConfig.authSource || 'admin';
    }

    if (loadedConfig.debug) {
        // mongoose.set('debug', function (collection, method, query) {
        //     Logger.debug(`${collection}.${method}(${JSON.stringify(query)})`, 'MongoDB');
        // });
        mongoose.set('debug', true);
    }

    return dbConfig;
}

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService): MongooseModuleOptions => {
                return getDatabaseConfig(configService, 'database');
            },
            inject: [ConfigService],
            connectionName: Databases.Primary,
        }),
    ],
    exports: [DatabaseService],
    providers: [DatabaseService],
})
export class AppDatabaseModule {}
