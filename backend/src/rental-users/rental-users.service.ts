import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RentalUser, RentalUserDocument } from './rental-user.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { RentalUsersRepo } from './rental-users.repo';
import { BuildingsService } from '../buildings/buildings.service';
import { PropertiesService } from '../properties/properties.service';
import { PaymentsService } from '../payments/payments.service';
import { ExpensesService } from '../expenses/expenses.service';
import { BuildingAccessService } from 'src/app-auth/building-access.service';
import { User } from 'src/users/user.model';

@Injectable()
export class RentalUsersService extends AbstractMongooseService<RentalUser, RentalUserDocument, RentalUsersRepo> {
    constructor(
        repo: RentalUsersRepo,
        private readonly buildingsService: BuildingsService,
        private readonly propertiesService: PropertiesService,
        private readonly paymentsService: PaymentsService,
        private readonly expensesService: ExpensesService,
        private readonly buildingAccessService: BuildingAccessService,
    ) {
        super(repo);
    }

    private async getAccessibleRentalUserIds(actor: User): Promise<string[] | null> {
        if (await this.buildingAccessService.isSuperAdmin(actor)) return null;

        const buildingFilter = await this.buildingAccessService.buildingFilter(actor, '_id');
        const buildings = await this.buildingsService.findAll(buildingFilter);
        const buildingIds = buildings.map((b: any) => String(b._id));

        if (!buildingIds.length) return [];

        const properties = await this.propertiesService.findAll({ buildingId: { $in: buildingIds } }, { projection: { renterId: 1 } });

        const linkedIds = new Set<string>();

        buildings.forEach((building: any) => {
            (building.ownerGroups || []).forEach((group: any) => {
                (group.members || []).forEach((member: any) => {
                    if (member.userId) linkedIds.add(String(member.userId));
                });
            });
        });

        properties.forEach((property: any) => {
            if (property.renterId) linkedIds.add(String(property.renterId));
        });

        return Array.from(linkedIds);
    }

    async findAllAccessible(actor: User, status?: string, search?: string) {
        const query: any = {};
        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };

        const accessibleIds = await this.getAccessibleRentalUserIds(actor);
        if (accessibleIds !== null) {
            query._id = { $in: accessibleIds };
        }

        return this.findAll(query, { sort: { name: 1 } });
    }

    async findOneAccessible(actor: User, id: string) {
        const user = await this.findById(id);
        if (!user) throw new NotFoundException('User not found');

        const accessibleIds = await this.getAccessibleRentalUserIds(actor);
        if (accessibleIds === null) return user;

        if (!accessibleIds.includes(String(id))) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async refreshUserData(userId: string): Promise<RentalUser> {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        // Find all buildings where user is a member
        const buildings = await this.buildingsService.findAll({
            'ownerGroups.members.userId': userId,
        });

        const buildingsOwned = [];
        for (const building of buildings) {
            for (const group of building.ownerGroups) {
                for (const member of group.members) {
                    if (member.userId && member.userId.toString() === userId) {
                        buildingsOwned.push({
                            buildingId: (building as any)._id,
                            buildingNumber: building.number,
                            kirats: member.kirats,
                            percentage: (member.kirats / building.totalKirats) * 100,
                        });
                    }
                }
            }
        }

        // Find all properties where user is renter
        const properties = await this.propertiesService.findAll({ renterId: userId });
        const propertiesRented = [];
        for (const prop of properties) {
            const building = await this.buildingsService.findById(prop.buildingId);
            propertiesRented.push({
                propertyId: (prop as any)._id,
                buildingId: prop.buildingId,
                unit: prop.unit,
                buildingNumber: building ? building.number : '',
            });
        }

        return this.findOneAndUpdate(
            { _id: userId },
            { $set: { buildingsOwned, propertiesRented } },
            { new: true },
        );
    }

    async getUserReport(userId: string, year: number) {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const buildings = await this.buildingsService.findAll({
            'ownerGroups.members.userId': userId,
        });

        const buildingReports = [];
        let totalGrossIncome = 0;
        let totalEqualExpenses = 0;
        let totalRentDeduction = 0;

        for (const building of buildings) {
            let userKirats = 0;

            for (const group of building.ownerGroups) {
                for (const member of group.members) {
                    if (member.userId && member.userId.toString() === userId) {
                        userKirats += member.kirats;
                    }
                }
            }

            const properties = await this.propertiesService.findAll({ buildingId: (building as any)._id });
            const propertyIds = properties.map((p: any) => p._id);

            const payments = await this.paymentsService.findAll({
                propertyId: { $in: propertyIds },
                year,
            });

            const buildingGrossIncome = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

            const expenses = await this.expensesService.findAll({
                buildingId: (building as any)._id,
                year,
            });

            const totalMembers = building.ownerGroups.reduce(
                (sum, g) => sum + g.members.length, 0,
            );

            let proportionalExpenseTotal = 0;
            let userEqualExpense = 0;

            for (const expense of expenses) {
                if (expense.expenseType === 'equal') {
                    if (expense.ownerGroupId) {
                        const group = building.ownerGroups.find(
                            (g: any) => g._id.toString() === expense.ownerGroupId.toString(),
                        );
                        if (group) {
                            const userInGroup = group.members.some(
                                (m) => m.userId && m.userId.toString() === userId,
                            );
                            if (userInGroup) {
                                userEqualExpense += expense.amount / group.members.length;
                            }
                        }
                    } else {
                        userEqualExpense += totalMembers > 0 ? expense.amount / totalMembers : 0;
                    }
                } else {
                    proportionalExpenseTotal += expense.amount;
                }
            }

            const ownershipPercentage = (userKirats / building.totalKirats) * 100;
            const buildingNetIncomeAfterProportional = buildingGrossIncome - proportionalExpenseTotal;
            const userGrossIncome = (userKirats / building.totalKirats) * buildingNetIncomeAfterProportional;

            let rentDeduction = 0;
            for (const property of properties) {
                if ((property as any).renterId && (property as any).renterId.toString() === userId) {
                    const propertyPayments = payments.filter(
                        (p: any) => p.propertyId.toString() === (property as any)._id.toString(),
                    );
                    rentDeduction += propertyPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
                }
            }

            const netIncome = userGrossIncome - userEqualExpense - rentDeduction;

            const expenseDetails = expenses
                .filter((exp) => exp.expenseType === 'equal')
                .filter((exp) => {
                    if (exp.ownerGroupId) {
                        const group = building.ownerGroups.find(
                            (g: any) => g._id.toString() === exp.ownerGroupId.toString(),
                        );
                        if (group) {
                            return group.members.some((m) => m.userId && m.userId.toString() === userId);
                        }
                        return false;
                    }
                    return true;
                })
                .map((exp) => {
                    let membersInScope = totalMembers;
                    if (exp.ownerGroupId) {
                        const group = building.ownerGroups.find(
                            (g: any) => g._id.toString() === exp.ownerGroupId.toString(),
                        );
                        membersInScope = group ? group.members.length : 1;
                    }
                    return {
                        description: exp.description,
                        totalAmount: exp.amount,
                        type: 'equal',
                        groupName: exp.ownerGroupId
                            ? building.ownerGroups.find((g: any) => g._id.toString() === exp.ownerGroupId.toString())?.name
                            : null,
                        userShare: membersInScope > 0 ? exp.amount / membersInScope : 0,
                    };
                });

            buildingReports.push({
                buildingId: (building as any)._id,
                buildingNumber: building.number,
                kirats: userKirats,
                ownershipPercentage,
                grossIncome: userGrossIncome,
                equalExpenses: userEqualExpense,
                expenseDetails,
                rentDeduction,
                netIncome,
            });

            totalGrossIncome += userGrossIncome;
            totalEqualExpenses += userEqualExpense;
            totalRentDeduction += rentDeduction;
        }

        return {
            user: { id: (user as any)._id, name: user.name },
            year,
            buildings: buildingReports,
            summary: {
                totalGrossIncome,
                totalExpenses: totalEqualExpenses,
                totalRentDeduction,
                netIncome: totalGrossIncome - totalEqualExpenses - totalRentDeduction,
            },
        };
    }

    async deleteWithValidation(userId: string) {
        // Check if user is linked to any members
        const buildingsWithMember = await this.buildingsService.findAll({
            'ownerGroups.members.userId': userId,
        });

        if (buildingsWithMember.length > 0) {
            throw new BadRequestException({
                error: 'Cannot delete user - linked to building members',
                buildings: buildingsWithMember.map((b) => b.number),
            });
        }

        // Check if user is linked as renter
        const propertiesWithRenter = await this.propertiesService.findAll({ renterId: userId });

        if (propertiesWithRenter.length > 0) {
            throw new BadRequestException({
                error: 'Cannot delete user - linked as renter to properties',
                propertyCount: propertiesWithRenter.length,
            });
        }

        const user = await this.deleteById(userId);
        if (!user) throw new NotFoundException('User not found');
        return { message: 'User deleted successfully' };
    }
}
