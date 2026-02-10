import { Injectable } from '@nestjs/common';
import { Building, BuildingDocument } from './building.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { BuildingsRepo } from './buildings.repo';

@Injectable()
export class BuildingsService extends AbstractMongooseService<Building, BuildingDocument, BuildingsRepo> {
    constructor(repo: BuildingsRepo) {
        super(repo);
    }
}
