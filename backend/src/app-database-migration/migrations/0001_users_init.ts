import { Logger } from '@nestjs/common';
import { Loggers } from 'src/shared/constants';
import { UsersService } from 'src/users/users.service';
import { DatabaseMigrationService } from '../database-migration.service';
import { GroupService } from 'src/groups/group.service';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { hash } from 'bcrypt';
import { MainGroups } from 'src/groups/constants';

export const createInitialUser = async (migrationService: DatabaseMigrationService) => {
    try {
        const usersService = migrationService.resolveService<UsersService>(UsersService);
        const groupService = migrationService.resolveService<GroupService>(GroupService);

        const group = await groupService.findOneAndUpdate(
            {
                name: MainGroups.SuperAdmin,
            },
            {
                $set: {
                    permissions: Object.values(Permissions),
                },
            },
            {
                upsert: true,
                new: true,
                projection: {
                    _id: 1,
                },
            },
        );

        const user = await usersService.findOneAndUpdate(
            {
                email: 'admin@rentals.local',
            },
            {
                password: await hash('admin123', 10),
                groups: [group._id],
                active: true,
                username: 'admin',
                name: 'Admin',
            },
            {
                upsert: true,
            },
        );

        new Logger(Loggers.DatabaseMigration).log(`initial admin user created: ${user?._id}`);
    } catch (error) {
        console.log({ error });
    }
};
