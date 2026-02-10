import { Global, Module } from '@nestjs/common';
import { DatabaseMigrationService } from './database-migration.service';

@Global()
@Module({
    providers: [DatabaseMigrationService],
})
export class DatabaseMigrationModule {}
