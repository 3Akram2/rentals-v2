export enum Permissions {
    // auth user accounts
    UserCreate = 'user@create',
    UserRead = 'user@read',
    UserUpdate = 'user@update',
    UserDelete = 'user@delete',

    // groups
    GroupCreate = 'group@create',
    GroupRead = 'group@read',
    GroupUpdate = 'group@update',
    GroupDelete = 'group@delete',

    // buildings
    BuildingCreate = 'building@create',
    BuildingRead = 'building@read',
    BuildingUpdate = 'building@update',
    BuildingDelete = 'building@delete',

    // properties
    PropertyCreate = 'property@create',
    PropertyRead = 'property@read',
    PropertyUpdate = 'property@update',
    PropertyDelete = 'property@delete',

    // payments
    PaymentCreate = 'payment@create',
    PaymentRead = 'payment@read',
    PaymentUpdate = 'payment@update',
    PaymentDelete = 'payment@delete',

    // expenses
    ExpenseCreate = 'expense@create',
    ExpenseRead = 'expense@read',
    ExpenseUpdate = 'expense@update',
    ExpenseDelete = 'expense@delete',

    // reports
    ReportRead = 'report@read',

    // rental users (people/tenants/owners)
    RentalUserCreate = 'rental-user@create',
    RentalUserRead = 'rental-user@read',
    RentalUserUpdate = 'rental-user@update',
    RentalUserDelete = 'rental-user@delete',
}
