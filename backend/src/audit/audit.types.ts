export type AuditLogInput = {
    eventType: string;
    severity?: 'info' | 'warn' | 'critical';
    actor?: {
        userId?: string;
        email?: string;
        username?: string;
        name?: string;
        roles?: string[];
    };
    target?: {
        resourceType?: string;
        resourceId?: string;
        label?: string;
    };
    action: {
        module: string;
        operation: string;
        status: 'success' | 'fail';
        reason?: string;
    };
    http?: {
        method?: string;
        path?: string;
        statusCode?: number;
    };
    client?: {
        ip?: string;
        userAgent?: string;
        country?: string;
        city?: string;
        asn?: string;
        deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
        browser?: string;
        os?: string;
    };
    changes?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
        fields?: string[];
    };
    meta?: Record<string, any>;
};
