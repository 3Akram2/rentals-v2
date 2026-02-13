import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AuditEventRepo } from './audit-event.repo';
import { AuditLogInput } from './audit.types';

type ListEventsFilter = {
    page: number;
    pageSize: number;
    eventType?: string;
    status?: 'success' | 'fail';
    module?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
};

@Injectable()
export class AuditService {
    constructor(
        private readonly auditRepo: AuditEventRepo,
        private readonly cls: ClsService,
    ) {}

    async log(input: AuditLogInput) {
        const requestId = String(this.cls.get('requestId') || '');

        const method = String(this.cls.get('http.method') || input.http?.method || '');
        const path = String(this.cls.get('http.path') || input.http?.path || '');
        const ip = String(this.cls.get('http.ip') || input.client?.ip || '');
        const userAgent = String(this.cls.get('http.userAgent') || input.client?.userAgent || '');

        const deviceType = this.detectDeviceType(userAgent);

        return this.auditRepo.create({
            ts: new Date(),
            requestId: requestId || undefined,
            eventType: input.eventType,
            severity: input.severity || 'info',
            actor: input.actor,
            target: input.target,
            action: input.action,
            http: {
                method: method || undefined,
                path: path || undefined,
                statusCode: input.http?.statusCode,
            },
            client: {
                ...input.client,
                ip: ip || undefined,
                userAgent: userAgent || undefined,
                deviceType: input.client?.deviceType || deviceType,
            },
            changes: input.changes,
            meta: input.meta,
        } as any);
    }

    async listEvents(filter: ListEventsFilter) {
        const query: any = {};
        if (filter.eventType) query.eventType = filter.eventType;
        if (filter.status) query['action.status'] = filter.status;
        if (filter.module) query['action.module'] = filter.module;
        if (filter.userId) query['actor.userId'] = filter.userId;

        if (filter.dateFrom || filter.dateTo) {
            query.ts = {};
            if (filter.dateFrom) query.ts.$gte = new Date(filter.dateFrom);
            if (filter.dateTo) query.ts.$lte = new Date(filter.dateTo);
        }

        const [data, total] = await Promise.all([
            this.auditRepo.findAll(query, {
                sort: { ts: -1 },
                skip: (filter.page - 1) * filter.pageSize,
                limit: filter.pageSize,
            }),
            this.auditRepo.count(query),
        ]);

        return {
            page: filter.page,
            pageSize: filter.pageSize,
            total: total.total,
            data,
        };
    }

    private detectDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' {
        if (!ua) return 'unknown';
        const l = ua.toLowerCase();
        if (l.includes('bot') || l.includes('spider') || l.includes('crawl')) return 'bot';
        if (l.includes('ipad') || (l.includes('android') && !l.includes('mobile'))) return 'tablet';
        if (l.includes('mobile') || l.includes('iphone') || l.includes('android')) return 'mobile';
        return 'desktop';
    }
}
