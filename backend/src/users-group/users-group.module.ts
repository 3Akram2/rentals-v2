import { Global, Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { UsersGroup, UsersGroupSchema } from './users-group.model';
import { UsersGroupRepo } from './users-group.repo';
import { UsersGroupController } from './users-group.controller';
import { UsersGroupService } from './users-group.service';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: UsersGroup.name, schema: UsersGroupSchema }], Databases.Primary),
        forwardRef(() => UsersModule),
    ],
    controllers: [UsersGroupController],
    providers: [UsersGroupService, UsersGroupRepo],
    exports: [UsersGroupService],
})
export class UsersGroupModule {}
