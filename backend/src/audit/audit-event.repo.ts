import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Databases } from 'src/shared/constants';
import AbstractMongooseRepository from 'src/shared/mongo/AbstractMongooseRepository';
import { AuditEvent, AuditEventDocument } from './audit-event.model';

@Injectable()
export class AuditEventRepo extends AbstractMongooseRepository<AuditEvent, AuditEventDocument> {
    constructor(
        @InjectModel(AuditEvent.name, Databases.Primary)
        Model_: mongoose.Model<AuditEventDocument>,
    ) {
        super(Model_);
    }
}
