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
        permissions: [
            Permissions.BuildingCreate,
            Permissions.BuildingRead,
            Permissions.BuildingUpdate,
            Permissions.BuildingDelete,
            Permissions.PropertyCreate,
            Permissions.PropertyRead,
            Permissions.PropertyUpdate,
            Permissions.PropertyDelete,
            Permissions.PaymentCreate,
            Permissions.PaymentRead,
            Permissions.PaymentUpdate,
            Permissions.PaymentDelete,
            Permissions.ExpenseCreate,
            Permissions.ExpenseRead,
            Permissions.ExpenseUpdate,
            Permissions.ExpenseDelete,
            Permissions.ReportRead,
            Permissions.RentalUserCreate,
            Permissions.RentalUserRead,
            Permissions.RentalUserUpdate,
            Permissions.RentalUserDelete,
        ],
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
