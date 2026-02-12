import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
class AuditActor {
    @Prop()
    userId?: string;

    @Prop()
    email?: string;

    @Prop()
    username?: string;

    @Prop()
    name?: string;

    @Prop({ type: [String], default: [] })
    roles?: string[];
}

@Schema({ _id: false })
class AuditTarget {
    @Prop()
    resourceType?: string;

    @Prop()
    resourceId?: string;

    @Prop()
    label?: string;
}

@Schema({ _id: false })
class AuditAction {
    @Prop({ required: true })
    module: string;

    @Prop({ required: true })
    operation: string;

    @Prop({ required: true, enum: ['success', 'fail'] })
    status: 'success' | 'fail';

    @Prop()
    reason?: string;
}

@Schema({ _id: false })
class AuditHttp {
    @Prop()
    method?: string;

    @Prop()
    path?: string;

    @Prop()
    statusCode?: number;
}

@Schema({ _id: false })
class AuditClient {
    @Prop()
    ip?: string;

    @Prop()
    userAgent?: string;

    @Prop()
    country?: string;

    @Prop()
    city?: string;

    @Prop()
    asn?: string;

    @Prop({ enum: ['desktop', 'mobile', 'tablet', 'bot', 'unknown'], default: 'unknown' })
    deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';

    @Prop()
    browser?: string;

    @Prop()
    os?: string;
}

@Schema({ _id: false })
class AuditChanges {
    @Prop({ type: Object, default: undefined })
    before?: Record<string, any>;

    @Prop({ type: Object, default: undefined })
    after?: Record<string, any>;

    @Prop({ type: [String], default: [] })
    fields?: string[];
}

@Schema({ timestamps: true })
export class AuditEvent {
    _id?: string;

    @Prop({ required: true, default: () => new Date() })
    ts: Date;

    @Prop({ index: true })
    requestId?: string;

    @Prop({ required: true, index: true })
    eventType: string;

    @Prop({ required: true, enum: ['info', 'warn', 'critical'], default: 'info' })
    severity: 'info' | 'warn' | 'critical';

    @Prop({ type: AuditActor, default: undefined })
    actor?: AuditActor;

    @Prop({ type: AuditTarget, default: undefined })
    target?: AuditTarget;

    @Prop({ type: AuditAction, required: true })
    action: AuditAction;

    @Prop({ type: AuditHttp, default: undefined })
    http?: AuditHttp;

    @Prop({ type: AuditClient, default: undefined })
    client?: AuditClient;

    @Prop({ type: AuditChanges, default: undefined })
    changes?: AuditChanges;

    @Prop({ type: Object, default: undefined })
    meta?: Record<string, any>;
}

export type AuditEventDocument = HydratedDocument<AuditEvent>;
export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

AuditEventSchema.index({ ts: -1 });
AuditEventSchema.index({ eventType: 1, ts: -1 });
AuditEventSchema.index({ 'actor.userId': 1, ts: -1 });
AuditEventSchema.index({ 'target.resourceType': 1, 'target.resourceId': 1, ts: -1 });
AuditEventSchema.index({ 'action.status': 1, ts: -1 });
