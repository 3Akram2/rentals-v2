import { Global, Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { User, UserSchema } from './user.model';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepo } from './users.repo';
import { UsersGroupModule } from 'src/users-group/users-group.module';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], Databases.Primary),
        forwardRef(() => UsersGroupModule),
    ],
    controllers: [UsersController],
    providers: [UsersService, UsersRepo],
    exports: [UsersService],
})
export class UsersModule {}
