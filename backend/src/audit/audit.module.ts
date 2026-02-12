import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { AuditEvent, AuditEventSchema } from './audit-event.model';
import { AuditEventRepo } from './audit-event.repo';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: AuditEvent.name, schema: AuditEventSchema }], Databases.Primary),
    ],
    controllers: [AuditController],
    providers: [AuditEventRepo, AuditService],
    exports: [AuditService],
})
export class AuditModule {}
