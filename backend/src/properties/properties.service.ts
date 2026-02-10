import { Injectable } from '@nestjs/common';
import { Property, PropertyDocument } from './property.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { PropertiesRepo } from './properties.repo';

@Injectable()
export class PropertiesService extends AbstractMongooseService<Property, PropertyDocument, PropertiesRepo> {
    constructor(repo: PropertiesRepo) {
        super(repo);
    }
}
