import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Config, ConfigSchema } from './configs.model';
import { DatabaseConfigurationRepo } from './database-configuration.repo';
import { DatabaseConfigurationService } from './database-configuration.service';

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }], Databases.Primary)],
    providers: [DatabaseConfigurationService, DatabaseConfigurationRepo],
    exports: [DatabaseConfigurationService],
})
export class AppDatabaseConfigurationModule {}
