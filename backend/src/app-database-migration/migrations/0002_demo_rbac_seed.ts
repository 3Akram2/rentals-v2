import { Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import { BuildingsService } from 'src/buildings/buildings.service';
import { ExpensesService } from 'src/expenses/expenses.service';
import { MainGroups } from 'src/groups/constants';
import { GroupService } from 'src/groups/group.service';
import { PaymentsService } from 'src/payments/payments.service';
import { PropertiesService } from 'src/properties/properties.service';
import { Loggers } from 'src/shared/constants';
import { UsersService } from 'src/users/users.service';
import { DatabaseMigrationService } from '../database-migration.service';

export const seedDemoRbacData = async (migrationService: DatabaseMigrationService) => {
    const logger = new Logger(Loggers.DatabaseMigration);

    const usersService = migrationService.resolveService<UsersService>(UsersService);
    const groupService = migrationService.resolveService<GroupService>(GroupService);
    const buildingsService = migrationService.resolveService<BuildingsService>(BuildingsService);
    const propertiesService = migrationService.resolveService<PropertiesService>(PropertiesService);
    const paymentsService = migrationService.resolveService<PaymentsService>(PaymentsService);
    const expensesService = migrationService.resolveService<ExpensesService>(ExpensesService);

    const adminGroup = await groupService.findOne({ name: MainGroups.Admin });
    const viewerGroup = await groupService.findOne({ name: MainGroups.Viewer });

    if (!adminGroup || !viewerGroup) {
        logger.warn('Skipping demo RBAC seed: required groups were not found');
        return;
    }

    const demoBuildingsInput = [
        { number: 'DEMO-101', address: 'Demo District A', totalKirats: 24 },
        { number: 'DEMO-202', address: 'Demo District B', totalKirats: 24 },
    ];

    const demoBuildings: any[] = [];
    for (const item of demoBuildingsInput) {
        let building = await buildingsService.findOne({ number: item.number });
        if (!building) {
            building = await buildingsService.create(item as any);
        }
        demoBuildings.push(building);
    }

    const [buildingA, buildingB] = demoBuildings;

    const upsertProperty = async (buildingId: string, unit: string, type: 'apartment' | 'store', paymentType = 'fixed', fixedRent = 0) => {
        const existing = await propertiesService.findOne({ buildingId, unit });
        if (existing) return existing;
        return propertiesService.create({
            buildingId,
            unit,
            type,
            renterName: `Tenant ${unit}`,
            paymentType,
            fixedRent,
        } as any);
    };

    const p1 = await upsertProperty(String((buildingA as any)._id), '1', 'apartment', 'fixed', 3200);
    const p2 = await upsertProperty(String((buildingA as any)._id), '2', 'apartment', 'fixed', 3400);
    const p3 = await upsertProperty(String((buildingB as any)._id), 'S1', 'store', 'fixed', 6000);

    const nowYear = new Date().getFullYear();
    const upsertPayment = (propertyId: string, month: number, amount: number) =>
        paymentsService.upsert(
            { propertyId, year: nowYear, month },
            { $set: { propertyId, year: nowYear, month, amount } },
        );

    await upsertPayment(String((p1 as any)._id), 1, 3200);
    await upsertPayment(String((p1 as any)._id), 2, 3200);
    await upsertPayment(String((p2 as any)._id), 1, 3400);
    await upsertPayment(String((p3 as any)._id), 1, 6000);

    const existingExpense = await expensesService.findOne({
        buildingId: String((buildingA as any)._id),
        year: nowYear,
        description: 'Demo maintenance',
    });
    if (!existingExpense) {
        await expensesService.create({
            buildingId: String((buildingA as any)._id),
            year: nowYear,
            description: 'Demo maintenance',
            amount: 1500,
            expenseType: 'proportional',
        } as any);
    }

    const demoPasswordHash = await hash('Demo@1234', 10);

    const managerEmail = 'demo.operator@rentals.local';
    const viewerEmail = 'demo.viewer@rentals.local';

    const manager = await usersService.findOneAndUpdate(
        { email: managerEmail },
        {
            $set: {
                name: 'Demo Operator',
                username: 'demo.operator',
                email: managerEmail,
                active: true,
                groups: [adminGroup._id],
                allowedBuildingIds: [buildingA._id, buildingB._id],
            },
            $setOnInsert: {
                password: demoPasswordHash,
            },
        },
        { upsert: true, new: true },
    );

    const viewer = await usersService.findOneAndUpdate(
        { email: viewerEmail },
        {
            $set: {
                name: 'Demo Observer',
                username: 'demo.viewer',
                email: viewerEmail,
                active: true,
                groups: [viewerGroup._id],
                allowedBuildingIds: [buildingA._id],
            },
            $setOnInsert: {
                password: demoPasswordHash,
            },
        },
        { upsert: true, new: true },
    );

    logger.log(`demo RBAC seed ready. manager=${manager?._id}, viewer=${viewer?._id}`);
};
