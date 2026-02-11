import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { Group, GroupDocument } from './group.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { GroupRepo } from './group.repo';
import { UsersService } from 'src/users/users.service';
import { MainGroups, predefinedGroups } from './constants';

@Injectable()
export class GroupService extends AbstractMongooseService<Group, GroupDocument, GroupRepo> implements OnModuleInit {
    private logger = new Logger(GroupService.name);

    constructor(
        repo: GroupRepo,
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService,
    ) {
        super(repo);
    }

    async onModuleInit() {
        await this.seedPredefinedGroups();
    }

    async seedPredefinedGroups() {
        await this.bulkWrite(
            predefinedGroups.map((group) => {
                return {
                    updateOne: {
                        filter: {
                            name: group.name,
                        },
                        update: {
                            $set: {
                                ...group,
                            },
                        },
                        upsert: true,
                    },
                };
            }),
        );
    }

    async getUserPermissions(userId: string) {
        const user = await this.usersService.findById(userId, {
            projection: {
                groups: 1,
            },
        });

        return this.distinct('permissions', {
            _id: { $in: user?.groups },
        });
    }

    async isAdminGroup(groupsIds: string[]) {
        const groups = await this.findAll({
            _id: { $in: groupsIds },
            name: { $in: [MainGroups.Admin, MainGroups.SuperAdmin] },
        });

        return groups.length > 0;
    }

    async isSuperAdminGroup(groupsIds: string[] = []) {
        if (!groupsIds?.length) return false;
        const group = await this.findOne({
            _id: { $in: groupsIds },
            name: MainGroups.SuperAdmin,
        });
        return !!group;
    }
}
