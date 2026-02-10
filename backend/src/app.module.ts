import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from './app-config/app-config.module';
import { AppLoggerModule } from './app-logger/app-logger.module';
import { AppDatabaseModule } from './app-database/app-database.module';
import { UsersModule } from './users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppAuthModule } from './app-auth/app-auth.module';
import { AppDatabaseConfigurationModule } from './app-database-configuration/app-database-configuration.module';
import { DatabaseMigrationModule } from './app-database-migration/app-database-migration.module';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GroupModule } from './groups/group.module';
import { UsersGroupModule } from './users-group/users-group.module';
import { ErrorsFilter } from './shared/errors/errors.filter';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { BuildingsModule } from './buildings/buildings.module';
import { PropertiesModule } from './properties/properties.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RentalUsersModule } from './rental-users/rental-users.module';
import { ReportsModule } from './reports/reports.module';

@Global()
@Module({
    imports: [
        //
        // App Modules
        //
        AppConfigModule,
        AppLoggerModule,
        AppDatabaseModule,
        EventEmitterModule.forRoot({
            global: true,
            verboseMemoryLeak: true,
            maxListeners: 10,
            wildcard: true,
        }),
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
                setup: (cls, req) => {
                    const requestId = req?.headers?.['x-request-id'] || uuidv4();
                    cls.set('requestId', requestId);
                },
            },
        }),
        AppAuthModule,
        AppDatabaseConfigurationModule,
        DatabaseMigrationModule,
        // Auth/Admin Modules
        UsersModule,
        GroupModule,
        UsersGroupModule,
        // Rental Business Modules
        BuildingsModule,
        PropertiesModule,
        PaymentsModule,
        ExpensesModule,
        RentalUsersModule,
        ReportsModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: ErrorsFilter,
        },
        AppService,
    ],
    exports: [AppService],
})
export class AppModule {}
