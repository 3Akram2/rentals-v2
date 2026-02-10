import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { Group, GroupSchema } from './group.model';
import { GroupRepo } from './group.repo';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }], Databases.Primary)],
    controllers: [GroupController],
    providers: [GroupService, GroupRepo],
    exports: [GroupService],
})
export class GroupModule {}
