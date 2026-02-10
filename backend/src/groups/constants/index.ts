import { Permissions } from '../enums/permissions.enum';

export enum MainGroups {
    SuperAdmin = 'SuperAdmin',
    Admin = 'Admin',
    Viewer = 'Viewer',
}

type PredefinedGroup = {
    name: MainGroups;
    permissions: Permissions[];
    isGlobal?: boolean;
};

export const predefinedGroups: PredefinedGroup[] = [
    {
        name: MainGroups.SuperAdmin,
        permissions: Object.values(Permissions),
    },
    {
        name: MainGroups.Admin,
        permissions: Object.values(Permissions),
    },
    {
        name: MainGroups.Viewer,
        permissions: [
            Permissions.BuildingRead,
            Permissions.PropertyRead,
            Permissions.PaymentRead,
            Permissions.ExpenseRead,
            Permissions.ReportRead,
            Permissions.RentalUserRead,
        ],
    },
];
