import { Injectable } from '@nestjs/common';
import { Config, ConfigDocument, ConfigKeys } from './configs.model';
import AbstractMongooseService from 'src/shared/mongo/AbstractMongooseService';
import { DatabaseConfigurationRepo } from './database-configuration.repo';

export enum DataTypes {
    NUMBER = 'numberValue',
    NUMBERS_ARRAY = 'numberValues',
    STRING = 'stringValue',
    STRING_ARRAY = 'stringValues',
    DATE = 'dateValue',
    DATE_ARRAY = 'dateValues',
    REF = 'refValue',
    REF_ARRAY = 'refValues',
    BOOLEAN = 'booleanValue',
    BOOLEAN_ARRAY = 'booleanValues',
    OBJECT = 'objectValue',
    OBJECT_ARRAY = 'objectValues',
}

@Injectable()
export class DatabaseConfigurationService extends AbstractMongooseService<
    Config,
    ConfigDocument,
    DatabaseConfigurationRepo
> {
    constructor(repo: DatabaseConfigurationRepo) {
        super(repo);
    }

    async getConfig(key: string, type: DataTypes) {
        const result = await this.findOne({ key }, { projection: { [type]: 1 } });
        if (result) {
            return result[type];
        } else {
            return undefined;
        }
    }

    async getOrCreateConfig(key: string, type: DataTypes, value: any) {
        const result = await this.getConfig(key, type);
        if (result) {
            return result;
        } else {
            return await this.setConfig(key, type, value);
        }
    }

    async setConfig(key: string, type: DataTypes, value: any) {
        const result = await this.upsert({ key }, { key, [type]: value });
        return result[type];
    }

    async getNextKeyNumberValue(key: ConfigKeys) {
        const result = await this.findOneAndUpdate(
            {
                key,
            },
            {
                $inc: {
                    numberValue: 1,
                },
            },
            {
                projection: {
                    numberValue: 1,
                },
                upsert: true,
                new: true,
            },
        );

        return result.numberValue;
    }
}
