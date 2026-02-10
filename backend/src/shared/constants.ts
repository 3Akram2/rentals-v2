const NOW = new Date();
export const BASE_RUN_TIMESTAMP = `${
    process.env.MY_POD_NAME || process.env.INSTANCE || 'main-app'
}_${NOW.getUTCFullYear()}.${NOW.getUTCMonth() + 1}.${NOW.getUTCDate()}_${NOW.getUTCHours()}_${NOW.getUTCMinutes()}`;

export const LOGGER_LOCALE = 'en-US';
export const LOGGER_TIMEZONE = 'UTC';

export const API = 'api';
export const BASE_API = `${API}/`;
export const Endpoints = {
    Authentication: 'authentication',
    AuthenticatedUser: 'profile',
    AdminUsers: 'admin-users',
    Groups: 'groups',
    UsersGroup: 'users-groups',
    Buildings: 'buildings',
    Properties: 'properties',
    Payments: 'payments',
    Expenses: 'expenses',
    RentalUsers: 'users',
    Reports: 'reports',
};

export const Databases = {
    Primary: 'primary',
};

export const AuthenticationStrategies = {
    Local: 'local',
    JWT: 'jwt',
};

export enum AppEnv {
    Production = 'production',
    Development = 'development',
    Testing = 'testing',
}

export const Loggers = {
    MainApp: 'MainApp',
    MainApp_Cache: 'MainApp_Cache',
    MainApp_Jobs: 'MainApp_Jobs',
    MainApp_Middlewares: 'MainApp_Middlewares',
    MainApp_Queues: 'MainApp_Queues',
    Logger: 'Logger',
    AccessLog: 'AccessLog',
    PerformanceLog: 'PerformanceLog',
    Database: 'Database',
    ServeStatic: 'ServeStatic',
    ApiDocumentation: 'ApiDocumentation',
    DatabaseMigration: 'DatabaseMigration',
    ExceptionsHandler: 'ExceptionsHandler',
};

export const successResponse = { message: 'success' };
