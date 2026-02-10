import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { UsersGroup, UsersGroupDocument } from './users-group.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { UsersGroupRepo } from './users-group.repo';
import { ErrorCodes } from 'src/shared/errors/custom';
import * as mongoose from 'mongoose';
import { CreateUsersGroupDto } from './dto/create-users-group.dto';
import { UsersService } from '../users/users.service';
import { UpdateUsersGroupDto } from './dto/update-users-group.dto';

@Injectable()
export class UsersGroupService extends AbstractMongooseService<UsersGroup, UsersGroupDocument, UsersGroupRepo> {
    private logger = new Logger(UsersGroupService.name);

    constructor(
        repo: UsersGroupRepo,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {
        super(repo);
    }

    async isValueExist(key: string, value: string, exceptDocId?: string) {
        const result = await this.count({
            [`${key}`]: { $regex: new RegExp(`^${value}$`, 'i') },
            deleted: false,
            ...(exceptDocId && {
                _id: { $ne: exceptDocId },
            }),
        });

        return result.total > 0;
    }

    async validateUsersGroupNameUniqueness(usersGroup: UsersGroup, exceptDocId?: string) {
        if (usersGroup.name && (await this.isValueExist('name', usersGroup.name, exceptDocId))) {
            throw new BadRequestException(ErrorCodes.usersGroup.nameAlreadyExist);
        }
    }

    async create(data: CreateUsersGroupDto, options?: mongoose.SaveOptions): Promise<UsersGroup> {
        await this.validateUsersGroupNameUniqueness(data as UsersGroup);
        const group = await super.create(data as UsersGroup, options);
        await this.usersService.updateMany(
            { _id: { $in: data.userIds } },
            { $addToSet: { userGroupsIds: (group as any)?._doc?._id } },
        );
        return group;
    }

    async updateById(
        id: string | mongoose.ObjectId,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<UsersGroupDocument>,
        options?: mongoose.QueryOptions,
    ): Promise<UsersGroup> {
        // If the update contains a name field, validate uniqueness
        if (update && typeof update === 'object' && '$set' in update && update.$set && 'name' in update.$set) {
            await this.validateUsersGroupNameUniqueness({ name: update.$set.name } as UsersGroup, id.toString());
        }
        return super.updateById(id, update, options);
    }

    async addUsers(groupId: string, userIds: string[]) {
        const group = await this.findOne({ _id: groupId, deleted: false });
        if (!group) {
            throw new NotFoundException(ErrorCodes.usersGroup.notFound);
        }

        // Validate that all users exist
        const existingUsers = await this.usersService.findAll({ _id: { $in: userIds }, deleted: false });
        if (existingUsers.length !== userIds.length) {
            throw new BadRequestException(ErrorCodes.usersGroup.usersNotFound);
        }

        // Add users to the group (avoid duplicates)
        const updatedGroup = await this.findOneAndUpdate(
            { _id: groupId },
            { $addToSet: { userIds: { $each: userIds } } },
            { new: true },
        );

        // Add the group to each user's userGroupIds array
        await this.usersService.updateMany({ _id: { $in: userIds } }, { $addToSet: { userGroupsIds: groupId } });

        return updatedGroup;
    }

    async removeUsers(groupId: string, userIds: string[]) {
        const group = await this.findOne({ _id: groupId, deleted: false });
        if (!group) {
            throw new NotFoundException(ErrorCodes.usersGroup.notFound);
        }

        // Validate that all users exist
        const existingUsers = await this.usersService.findAll({ _id: { $in: userIds }, deleted: false });
        if (existingUsers.length !== userIds.length) {
            throw new BadRequestException(ErrorCodes.usersGroup.usersNotFound);
        }

        // Remove users from the group
        const updatedGroup = await this.findOneAndUpdate(
            { _id: groupId },
            { $pull: { userIds: { $in: userIds } } },
            { new: true },
        );

        // Remove the group from each user's userGroupIds array
        await this.usersService.updateMany({ _id: { $in: userIds } }, { $pull: { userGroupsIds: groupId } });

        return updatedGroup;
    }

    async deleteById(id: string | mongoose.ObjectId, options?: mongoose.QueryOptions): Promise<UsersGroup> {
        // Get the group before deletion to get the users
        const group = await this.findOne({ _id: id, deleted: false });
        if (!group) {
            throw new NotFoundException(ErrorCodes.usersGroup.notFound);
        }

        await this.usersService.updateMany({ _id: { $in: group.userIds } }, { $pull: { userGroupsIds: id } });

        return super.deleteById(id, options);
    }

    async updateUsersGroup(id: string, data: UpdateUsersGroupDto) {
        const group = await this.findOne({ _id: id, deleted: false });
        if (!group) {
            throw new NotFoundException(ErrorCodes.usersGroup.notFound);
        }

        await this.validateUsersGroupNameUniqueness({ name: data.name } as UsersGroup, id);

        const removedUsers = group.userIds.filter(
            (userId) => !data.userIds.some((id) => String(id) === String(userId)),
        );
        const addedUsers = data.userIds.filter((id) => !group.userIds.some((userId) => String(id) === String(userId)));

        if (removedUsers.length)
            await this.usersService.updateMany({ _id: { $in: removedUsers } }, { $pull: { userGroupsIds: id } });
        if (addedUsers.length)
            await this.usersService.updateMany({ _id: { $in: addedUsers } }, { $addToSet: { userGroupsIds: id } });

        return await this.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
    }

    async updateUsersGroupStatus(id: string, data: { active: boolean }) {
        const group = await this.findOne({ _id: id, deleted: false });
        if (!group) {
            throw new NotFoundException(ErrorCodes.usersGroup.notFound);
        }

        if (data.active) {
            await this.usersService.updateMany(
                { _id: { $in: group.userIds } },
                { $pull: { inactiveUserGroupsIds: id }, $addToSet: { userGroupsIds: id } },
            );
        } else {
            await this.usersService.updateMany(
                { _id: { $in: group.userIds } },
                { $pull: { userGroupsIds: id }, $addToSet: { inactiveUserGroupsIds: id } },
            );
        }

        return await this.findOneAndUpdate({ _id: id }, { $set: { active: data.active } }, { new: true });
    }
}
