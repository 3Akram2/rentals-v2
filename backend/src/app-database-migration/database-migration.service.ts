import { Injectable, Logger, OnApplicationBootstrap, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { DatabaseConfigurationService, DataTypes } from 'src/app-database-configuration/database-configuration.service';
import { Loggers } from 'src/shared/constants';
import { migrations } from './migrations/migrations';

const DB_VERSION = 'DB_VERSION';

@Injectable()
export class DatabaseMigrationService implements OnApplicationBootstrap {
    private logger: Logger = new Logger(Loggers.DatabaseMigration);
    private currentVersion: number;

    constructor(
        private databaseConfiguration: DatabaseConfigurationService,
        private config: ConfigService,
        private moduleRef: ModuleRef,
    ) {}

    resolveService<T>(service: Type<T>): T {
        return this.moduleRef.get(service, { strict: false });
    }

    async onApplicationBootstrap() {
        this.currentVersion = (await this.databaseConfiguration.getOrCreateConfig(
            DB_VERSION,
            DataTypes.NUMBER,
            0,
        )) as number;

        const latestVersion = Object.keys(migrations)
            .map((key) => parseInt(key))
            .reduce((previous, current) => Math.max(previous, current), 0);
        this.logger.log(`current mongo db version: ${this.currentVersion}/${latestVersion}`);

        if (!this.config.get('database').runMigrations) {
            if (latestVersion > this.currentVersion) {
                this.logger.log(
                    `this instance not configured to run database migrations; current: ${this.currentVersion}, latest: ${latestVersion}`,
                );
            }
            return;
        }
        if (latestVersion > this.currentVersion) {
            await this.migrate(latestVersion);
        }
    }

    async migrate(latestVersion: number) {
        while (migrations[this.currentVersion + 1]) {
            const migrationFunction = migrations[this.currentVersion + 1];
            try {
                await migrationFunction(this);
                ++this.currentVersion;
                await this.databaseConfiguration.setConfig(DB_VERSION, DataTypes.NUMBER, this.currentVersion);
                this.logger.log(`database migrated successfully to version: ${this.currentVersion}/${latestVersion}`);
            } catch (error) {
                this.logger.error(
                    `error migrating database to version ${this.currentVersion + 1}, ${error}, system will exit`,
                );
                process.exit(1);
            }
        }
        this.logger.log('database version aligned, ready to use.');
    }
}
