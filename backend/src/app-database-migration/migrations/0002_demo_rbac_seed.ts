import { Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Building } from 'src/buildings/building.model';
import { BuildingsService } from 'src/buildings/buildings.service';
import { Expense } from 'src/expenses/expense.model';
import { ExpensesService } from 'src/expenses/expenses.service';
import { MainGroups } from 'src/groups/constants';
import { GroupService } from 'src/groups/group.service';
import { PaymentsService } from 'src/payments/payments.service';
import { Property } from 'src/properties/property.model';
import { PropertiesService } from 'src/properties/properties.service';
import { Loggers } from 'src/shared/constants';
import { UsersService } from 'src/users/users.service';
import { DatabaseMigrationService } from '../database-migration.service';

const parseBoolean = (value?: string) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());

export const seedDemoRbacData = async (migrationService: DatabaseMigrationService) => {
    const logger = new Logger(Loggers.DatabaseMigration);

    const shouldSeedDemoData = parseBoolean(process.env.ENABLE_DEMO_SEED);
    if (!shouldSeedDemoData) {
        logger.log('Skipping demo RBAC seed (ENABLE_DEMO_SEED is not enabled)');
        return;
    }

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

    const demoBuildings = [];
    for (const item of demoBuildingsInput) {
        let building = await buildingsService.findOne({ number: item.number });
        if (!building) {
            building = await buildingsService.create(item as Partial<Building> as Building);
        }
        demoBuildings.push(building);
    }

    const [buildingA, buildingB] = demoBuildings;

    const upsertProperty = async (
        buildingId: string,
        unit: string,
        type: 'apartment' | 'store',
        paymentType = 'fixed',
        fixedRent = 0,
    ) => {
        const existing = await propertiesService.findOne({ buildingId, unit });
        if (existing) return existing;
        return propertiesService.create({
            buildingId,
            unit,
            type,
            renterName: `Tenant ${unit}`,
            renterId: null,
            paymentType,
            fixedRent,
        } as Partial<Property> as Property);
    };

    const p1 = await upsertProperty(String(buildingA._id), '1', 'apartment', 'fixed', 3200);
    const p2 = await upsertProperty(String(buildingA._id), '2', 'apartment', 'fixed', 3400);
    const p3 = await upsertProperty(String(buildingB._id), 'S1', 'store', 'fixed', 6000);

    const nowYear = new Date().getFullYear();
    const upsertPayment = (propertyId: string, month: number, amount: number) =>
        paymentsService.upsert(
            { propertyId, year: nowYear, month },
            { $set: { propertyId, year: nowYear, month, amount } },
        );

    await upsertPayment(String(p1._id), 1, 3200);
    await upsertPayment(String(p1._id), 2, 3200);
    await upsertPayment(String(p2._id), 1, 3400);
    await upsertPayment(String(p3._id), 1, 6000);

    const existingExpense = await expensesService.findOne({
        buildingId: String(buildingA._id),
        year: nowYear,
        description: 'Demo maintenance',
    });
    if (!existingExpense) {
        await expensesService.create({
            buildingId: String(buildingA._id),
            year: nowYear,
            description: 'Demo maintenance',
            amount: 1500,
            ownerGroupId: null,
            expenseType: 'proportional',
        } as Partial<Expense> as Expense);
    }

    const demoSeedPassword = process.env.DEMO_SEED_PASSWORD;
    if (!demoSeedPassword) {
        logger.warn('Skipping demo users creation: DEMO_SEED_PASSWORD is missing');
        return;
    }

    const demoPasswordHash = await hash(demoSeedPassword, 10);

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
