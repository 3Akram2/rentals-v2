import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { AuditEvent, AuditEventSchema } from './audit-event.model';
import { AuditEventRepo } from './audit-event.repo';
import { AuditService } from './audit.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: AuditEvent.name, schema: AuditEventSchema }], Databases.Primary),
    ],
    providers: [AuditEventRepo, AuditService],
    exports: [AuditService],
})
export class AuditModule {}
