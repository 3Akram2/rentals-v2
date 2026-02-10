import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import AbstractMongooseService from './AbstractMongooseService';
import { Pagination } from 'src/shared/dto/pagination.dto';
import AbstractMongooseRepository from './AbstractMongooseRepository';

export function buildPopulateObject(path: string): any {
    const paths = path.split('.');
    let latestPopulateObject: any = {
        path: paths[paths.length - 1],
        strictPopulate: false, // only set to prevent internal server error, but in practice you still needs the model, so better to handle on case
        // model: User,
    };
    for (let i = paths.length - 2; i > -1; i--) {
        latestPopulateObject = {
            path: paths[i],
            populate: latestPopulateObject,
            strictPopulate: false,
            // model: User,
        };
    }
    return latestPopulateObject;
}

export default class<
    C,
    D extends mongoose.HydratedDocument<C>,
    R extends AbstractMongooseRepository<C, D>,
    S extends AbstractMongooseService<C, D, R>,
> {
    private paginationConfiguration;
    constructor(
        private _service: S,
        private configService: ConfigService,
    ) {
        this.paginationConfiguration = this.configService.get('pagination') || {
            default: 10,
            max: 100,
        };
    }

    getService(): S {
        return this._service;
    }

    async getOrThrow404(process: Promise<any>) {
        const result = await process;
        if (result) {
            return result;
        }
        throw new NotFoundException();
    }

    buildFilterQuery(queryparams: any, pagination: Pagination = {}) {
        // build pagination object
        const result: any = { pagination };

        pagination.$page = pagination.$page || 1;
        pagination.$pageSize = pagination.$pageSize
            ? Math.min(this.paginationConfiguration.max, pagination.$pageSize)
            : this.paginationConfiguration.default;
        Object.keys(pagination).forEach((key) => delete queryparams[key]);

        // build $sort
        result.sort = queryparams.$sort;
        delete queryparams.$sort;

        // build projection
        if (queryparams.$select) {
            result.projection = queryparams.$select.split(',').map((x) => x.trim());
        }
        delete queryparams.$select; // fix issue when queryparams.$select is empty

        // build a convenient helper query to explode $regex search, eliminating use of complex query
        if (queryparams.$find) {
            const parsedQuery = queryparams.$find.split('|');
            if (parsedQuery.length === 2) {
                const parsedKeyword = parsedQuery[0];
                const parsedFields = parsedQuery[1].split(',').map((f) => f.trim());
                let modifier = 'contain';
                if (parsedKeyword.startsWith('start:')) {
                    modifier = 'start';
                } else if (parsedKeyword.startsWith('end:')) {
                    modifier = 'end';
                }
                const keyword = parsedKeyword.replace('start:', '').replace('end:', '');

                if (modifier && keyword && parsedFields?.length) {
                    queryparams.$or = [];
                    parsedFields.forEach((field) => {
                        queryparams.$or.push({
                            [field]: {
                                $regex: new RegExp(
                                    `${modifier === 'start' ? '^' : ''}${keyword}${modifier === 'end' ? '$' : ''}`,
                                ),
                                $options: 'i',
                            },
                        });
                    });
                }
            }
        }
        delete queryparams.$find;

        // build $populate and convenient helper query to expand paths in populate query
        if (queryparams.$populate !== undefined) {
            if (!Array.isArray(queryparams.$populate)) {
                queryparams.$populate = [queryparams.$populate];
            }
            result.$populate = queryparams.$populate
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
                .map((path: string) => {
                    if (path.includes('.') && path.split('.').length > 1) {
                        return buildPopulateObject(path);
                    }
                    return {
                        path,
                        strictPopulate: false,
                        // model: User,
                    };
                });
            delete queryparams.$populate;
        }

        result.filterQuery = queryparams;
        return result;
    }

    find_(queryparams: any, pagination: Pagination) {
        const constructedQueryParams = this.buildFilterQuery(queryparams, pagination);
        return this._service.findPage(
            constructedQueryParams.filterQuery,
            constructedQueryParams.pagination.$page,
            constructedQueryParams.pagination.$pageSize,
            {
                sort: constructedQueryParams.sort,
                $populate: constructedQueryParams.$populate,
            },
            constructedQueryParams.projection,
        );
    }

    async findAll_(queryparams: any, pagination: Pagination) {
        const constructedQueryParams = this.buildFilterQuery(queryparams, pagination);
        if (constructedQueryParams.pagination.$getAll) {
            const data = await this._service.findAll(
                constructedQueryParams.filterQuery,
                {
                    sort: constructedQueryParams.sort,
                    $populate: constructedQueryParams.$populate,
                },
                constructedQueryParams.projection,
            );
            return {
                data,
                total: data.length,
            };
        } else {
            return this._service.findPage(
                constructedQueryParams.filterQuery,
                constructedQueryParams.pagination.$page,
                constructedQueryParams.pagination.$pageSize,
                {
                    sort: constructedQueryParams.sort,
                    $populate: constructedQueryParams.$populate,
                },
                constructedQueryParams.projection,
            );
        }
    }

    get_(id: string, queryparams: any) {
        const constructedQueryParams = this.buildFilterQuery(queryparams);
        return this.getOrThrow404(
            this._service.findById(
                id,
                { $populate: constructedQueryParams.$populate },
                constructedQueryParams.projection,
            ),
        );
    }

    patch_(id: string, data: Partial<D>) {
        return this.getOrThrow404(
            this._service.updateById(id, {
                $set: data,
            }),
        );
    }

    delete_(id: string) {
        return this.getOrThrow404(this._service.deleteById(id));
    }

    softDelete_(id: string) {
        return this.getOrThrow404(this._service.softDeleteById(id));
    }

    replace_(id: string, data: Partial<C>) {
        return this.getOrThrow404(this._service.replaceById(id, data));
    }
}
