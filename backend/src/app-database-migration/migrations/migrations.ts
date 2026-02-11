import { createInitialUser } from './0001_users_init';
import { seedDemoRbacData } from './0002_demo_rbac_seed';

export const migrations = {
    1: createInitialUser,
    2: seedDemoRbacData,
};
