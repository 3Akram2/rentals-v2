import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Databases } from 'src/shared/constants';

@Injectable()
export class DatabaseService {
    constructor(@InjectConnection(Databases.Primary) private _connection: Connection) {}

    public getStatus(): string {
        return this._connection && this._connection.readyState === 1 ? 'Connected' : 'Disconnected';
    }

    public get connection(): Connection {
        return this._connection;
    }
}
