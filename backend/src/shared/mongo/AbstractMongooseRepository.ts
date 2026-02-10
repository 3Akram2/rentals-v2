import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import {
    AggregationPagination,
    AggregationRange,
    UnaryProducerFunction,
    CallBackFunction,
    EachAsyncCallBackFunction,
} from './AbstractMongooseService';
import { GenericFilterQuery } from './generic-filter-query.dto';

export type ResultPage<C> = {
    data: C[];
    total: number;
    page: number;
    pages: number;
    pageSize: number;
};

export function handleMongooseError(error) {
    if (error.code === 11000 || error.code === 11001) {
        // credits to feathers mongoose error handling.
        // NOTE (EK): Error parsing as discussed in this github thread
        // https://github.com/Automattic/mongoose/issues/2129
        const match1 = error.message.match(/_?([a-zA-Z]*)_?\d?\s*dup key/i);
        const match2 = error.message.match(/\s*dup key:\s*\{\s*:\s*"?(.*?)"?\s*\}/i);

        const key = match1 ? match1[1] : 'path';
        let value = match2 ? match2[1] : 'value';

        if (value === 'null') {
            value = null;
        } else if (value === 'undefined') {
            value = undefined;
        }

        error.errors = {
            [key]: value,
        };

        return Promise.reject(
            new ConflictException(`${key}: ${value} already exists. ${error.message}`, {
                cause: error,
            }),
        );
    }

    if (error.name) {
        switch (error.name) {
            case 'ValidationError':
            case 'ValidatorError':
            case 'CastError':
            case 'VersionError':
                return Promise.reject(
                    new BadRequestException(`${error.name}: ${error.message}`, {
                        cause: error,
                    }),
                );
            case 'OverwriteModelError':
                return Promise.reject(
                    new ConflictException(`${error.name}: ${error.message}`, {
                        cause: error,
                    }),
                );
            case 'MissingSchemaError':
            case 'DivergentArrayError':
                return Promise.reject(
                    new InternalServerErrorException(`${error.name}: ${error.message}`, {
                        cause: error,
                    }),
                );
            case 'MongoError':
                return Promise.reject(
                    new InternalServerErrorException(`${error.name}: ${error.message}`, {
                        cause: error,
                    }),
                );
        }
    }
    return Promise.reject(error);
}

// this.Model.bulkSave
// this.Model.createIndexes
// this.Model.ensureIndexes
// this.Model.exists
// this.Model.geoSearch
// this.Model.replaceOne
// this.Model.validate
// this.Model.watch
// this.Model.where

export default abstract class<C, D extends mongoose.HydratedDocument<C>> {
    constructor(private readonly Model: mongoose.Model<D>) {}

    getModel(): mongoose.Model<D> {
        return this.Model;
    }

    appendDefaultOps(operation: any, options?: any) {
        if (options) {
            if (options.$populate && operation.populate) {
                operation = operation.populate(options.$populate);
            }
            delete options.$populate;

            if (operation.setOptions) {
                operation = operation.setOptions(options);
            }
        }
        if (operation.lean) {
            operation = operation.lean(true);
        }
        if (operation.exec) {
            operation = operation.exec();
        }
        operation = operation.catch(handleMongooseError);
        return operation;
    }

    create(document: any, options?: mongoose.SaveOptions): Promise<C> {
        return this.appendDefaultOps(this.Model.create(document, options)) as unknown as Promise<C>;
    }

    createAll(documents: any[], options?: mongoose.InsertManyOptions): Promise<C[]> {
        return this.appendDefaultOps(this.Model.insertMany(documents, options)) as unknown as Promise<C[]>;
    }

    async getOrCreate(
        query: mongoose.FilterQuery<D>,
        producer: UnaryProducerFunction<any, C>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C> {
        const result = await this.findOne(query, options, projection);
        if (result) {
            return result;
        }
        const newObject = producer(query);
        if (newObject) {
            return this.create(newObject, options);
        }
        return null;
    }

    findAll(
        query: mongoose.FilterQuery<D>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C[]> {
        return this.appendDefaultOps(this.Model.find(query, projection), options) as unknown as Promise<C[]>;
    }

    findRandom(
        query: mongoose.FilterQuery<D>,
        sampleSize = 1,
        options?: mongoose.AggregateOptions,
        projection?: {
            [field: string]: mongoose.AnyExpression | mongoose.Expression | mongoose.PipelineStage.Project['$project'];
        },
    ): Promise<C[]> {
        // old implementation depending on count,
        // the problem is that sample itself will be consecutive, the starting document is the only random variable.
        // const total = await this.count(query);
        // if (total === 0) {
        //   return null;
        // }
        // const result = (await this.appendDefaultOps(this.Model.find(query, projection), {
        //   ...options,
        //   limit: 1,// sampleSize||1
        //   skip: Math.floor(Math.random() * total)
        // })) as unknown as Promise<C[]>;
        // return result[0];

        const pipeline: mongoose.PipelineStage[] = [
            {
                $match: query,
            },
        ];
        if (projection) {
            pipeline.push({
                $project: projection,
            });
        }
        this.selectRandomSample(pipeline, sampleSize);
        return this.aggregatePipeline(pipeline, options) as Promise<C[]>;
    }

    async findAllSyncCursor(
        query: mongoose.FilterQuery<D>,
        handler: CallBackFunction<D>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<void> {
        const cursor: mongoose.Cursor<D, mongoose.QueryOptions<D>> = this.Model.find(query, projection).cursor(options);
        for await (const doc of cursor) {
            await handler(doc);
        }
    }

    findAllAsyncCursor(
        query: mongoose.FilterQuery<D>,
        handler: EachAsyncCallBackFunction<D>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): void {
        this.Model.find(query, projection).cursor(options).eachAsync(handler);
    }

    // distinct<ReturnType = any>(
    //   field: string,
    //   query?: mongoose.FilterQuery<D>
    // ): Promise<ReturnType[]> {
    //   return this.appendDefaultOps(this.Model.distinct<ReturnType>(field, query));
    // }

    distinct<DocKey extends string, ResultType = unknown>(field: DocKey, query?: mongoose.FilterQuery<D>) {
        return this.appendDefaultOps(this.Model.distinct<DocKey, ResultType>(field, query));
    }

    async findPage(
        query: mongoose.FilterQuery<D>,
        page: number,
        pageSize: number,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<ResultPage<C>> {
        const data = (await this.appendDefaultOps(this.Model.find(query, projection), {
            ...(options || {}),
            limit: pageSize,
            skip: (page - 1) * pageSize,
        })) as unknown as C[];
        const total = await this.appendDefaultOps(
            this.Model.where(query)[
                query && Object.keys(query).length === 0 ? 'estimatedDocumentCount' : 'countDocuments'
            ](),
        );

        return Promise.resolve({
            data,
            total,
            page,
            pageSize,
            pages: Math.ceil(total / pageSize),
        });
    }

    findOne(
        query: mongoose.FilterQuery<D>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C> {
        return this.appendDefaultOps(this.Model.findOne(query, projection), options) as unknown as Promise<C>;
    }

    findById(
        id: string | mongoose.ObjectId,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C> {
        return this.appendDefaultOps(this.Model.findById(id, projection), options) as unknown as Promise<C>;
    }

    findOneAndUpdate(
        filter: mongoose.FilterQuery<D>,
        update: mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.appendDefaultOps(this.Model.findOneAndUpdate(filter, update), options) as unknown as Promise<C>;
    }

    async deleteOne(
        query: mongoose.FilterQuery<D>,
        fetch = true,
        options?: mongoose.QueryOptions<D>,
    ): Promise<DeleteResult | C> {
        if (fetch) {
            return this.appendDefaultOps(this.Model.findOneAndDelete(query), options);
        }
        return this.Model.deleteOne(query, options as any);
    }

    deleteById(id: string | mongoose.ObjectId, options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.appendDefaultOps(this.Model.findByIdAndDelete(id), options);
    }

    deleteMany(query: mongoose.FilterQuery<D>, options?: mongoose.QueryOptions<D>): Promise<DeleteResult> {
        return this.appendDefaultOps(this.Model.deleteMany(query), options);
    }

    updateOne(
        query: mongoose.FilterQuery<D>,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        fetch = true,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult | C> {
        if (fetch) {
            return this.appendDefaultOps(this.Model.findOneAndUpdate(query, update), options);
        }
        return this.appendDefaultOps(this.Model.updateOne(query, update), options);
    }

    upsert(
        query: mongoose.FilterQuery<D>,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.updateOne(query, update, true, {
            ...(options || {}),
            upsert: true,
            returnOriginal: false,
        }) as Promise<C>;
    }

    updateById(
        id: string | mongoose.ObjectId,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.appendDefaultOps(this.Model.findByIdAndUpdate(id, update), options) as unknown as Promise<C>;
    }

    updateMany(
        query: mongoose.FilterQuery<D>,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult> {
        return this.appendDefaultOps(this.Model.updateMany(query, update), options);
    }

    replace(query: mongoose.FilterQuery<D>, update: any, options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.appendDefaultOps(this.Model.findOneAndReplace(query, update), options);
    }

    replaceById(_id: string | mongoose.ObjectId, update: any, options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.appendDefaultOps(this.Model.findOneAndReplace({ _id }, update), options);
    }

    estimatedCount() {
        return this.Model.estimatedDocumentCount();
    }

    count(query: mongoose.FilterQuery<D>) {
        return this.appendDefaultOps(this.Model.countDocuments(query));
        // return this.appendDefaultOps(
        //   this.Model.where(query)[
        //     query && Object.keys(query).length === 0 ? 'estimatedDocumentCount' : 'countDocuments'
        //   ]()
        // );
    }

    push(id: string, field: any, arrayItem: any | any[], options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.updateById(
            id,
            {
                $push: {
                    [field]: { $each: Array.isArray(arrayItem) ? arrayItem : [arrayItem] },
                },
            },
            options,
        );
    }

    pushAtTop(id: string, field: any, arrayItem: any | any[], options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.pushAtPosition(id, field, arrayItem, 0, options);
    }

    pushAtPosition(
        id: string,
        field: any,
        arrayItem: any | any[],
        position: number,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.updateById(
            id,
            {
                $push: {
                    [field]: {
                        $each: Array.isArray(arrayItem) ? arrayItem : [arrayItem],
                    },
                    $position: position,
                },
            },
            options,
        );
    }

    updateEmbeddedObjectField(
        id: string,
        fieldPath: any,
        fieldValue: any,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.updateById(
            id,
            {
                $set: {
                    [fieldPath]: fieldValue,
                },
            },
            options,
        );
    }

    // for parent: [{name: 'x'}] use 'parent.name:x' not 'name', this is important for positional update operator '.$'
    updateEmbeddedArrayItem(
        field: any,
        query: any,
        userData: any,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult | C> {
        const data = {};
        for (const f of Object.keys(userData)) {
            data[`${field}.$.${f}`] = userData[f];
        }
        return this.updateOne(
            query,
            {
                $set: data,
            },
            true,
            options,
        );
    }

    updateEmbeddedArrayItems(
        field: any,
        query: any,
        userData: any,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult> {
        const data = {};
        for (const f of Object.keys(userData)) {
            data[`${field}.$.${f}`] = userData[f];
        }
        return this.updateMany(
            query,
            {
                $set: data,
            },
            options,
        );
    }

    updateEmbeddedArrayItemById(
        id: string,
        field: string,
        arrayItemId: string,
        data: any,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult | C> {
        return this.updateEmbeddedArrayItemByQuery(id, field, { _id: arrayItemId }, data, options);
    }

    updateEmbeddedArrayItemByQuery(
        id: string,
        field: string,
        userQuery: any,
        data: any,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult | C> {
        const query = {
            _id: id,
        };
        for (const f of Object.keys(userQuery)) {
            query[`${field}.${f}`] = userQuery[f];
        }
        return this.updateEmbeddedArrayItem(field, query, data, options);
    }

    softDeleteOne(
        query: mongoose.FilterQuery<D>,
        update?: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        fetch = true,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult | C> {
        return this.updateOne(query, { ...(update || {}), deleted: true, deletedAt: Date.now() }, fetch, options);
    }

    softDeleteById(
        id: string | mongoose.ObjectId,
        update?: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.updateById(id, { ...(update || {}), deleted: true, deletedAt: Date.now() }, options);
    }

    softDeleteMany(
        query: mongoose.FilterQuery<D>,
        update?: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult> {
        return this.updateMany(query, { ...(update || {}), deleted: true, deletedAt: Date.now() }, options);
    }

    increment(id: string, field: any, value = 1, options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.updateById(
            id,
            {
                $inc: {
                    [field]: value,
                },
            },
            options,
        );
    }

    incrementEmbeddedArrayItemById(
        id: string,
        documentField: string,
        arrayItemId: string,
        itemField: string,
        value = 1,
        options?: mongoose.QueryOptions<D>,
    ): Promise<UpdateResult | C> {
        const key: any = `${documentField}.$.${itemField}`;
        return this.updateOne(
            {
                _id: id,
                [`${documentField}._id`]: arrayItemId,
            },
            {
                $inc: {
                    [key]: value,
                },
            },
            true,
            options,
        );
    }

    incrementEmbeddedObjectField(
        id: string,
        fieldPath: any,
        value = 1,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.updateById(
            id,
            {
                $inc: {
                    [fieldPath]: value,
                },
            },
            options,
        );
    }

    async search(searchFilter: GenericFilterQuery) {
        const { query, projection, options, meta } = this.buildFiltersQuery(searchFilter);

        const [data, total] = await Promise.all([
            this.appendDefaultOps(this.Model.find(query, projection), options) as unknown as Promise<C[]>,
            this.count(query),
        ]);

        if (meta.page) {
            meta.from = total === 0 ? 0 : meta.skip + 1;
            meta.to = total >= meta.page * meta.pageSize ? meta.skip + meta.pageSize : total;
        }

        return { data, total, meta };
    }

    buildFiltersQuery(searchFilter: GenericFilterQuery) {
        const query = {};
        const options: mongoose.QueryOptions = {};
        const projection: mongoose.ProjectionType<D> = searchFilter.select || undefined;

        const meta: {
            page?: number;
            pageSize?: number;
            skip?: number;
            from?: number;
            to?: number;
        } = {};

        if (searchFilter.equal) {
            const equalOperation = searchFilter.equal;
            Object.keys(equalOperation).forEach((key) => {
                query[key] = { $eq: equalOperation[key] };
            });
        }

        if (searchFilter.notEqual) {
            const notEqualOperation = searchFilter.notEqual;
            Object.keys(notEqualOperation).forEach((key) => {
                query[key] = { $ne: notEqualOperation[key] };
            });
        }

        if (searchFilter.in) {
            const inOperation = searchFilter.in;
            Object.keys(inOperation).forEach((key) => {
                query[key] = { $in: inOperation[key] };
            });
        }

        if (searchFilter.notIn) {
            const notInOperation = searchFilter.notIn;
            Object.keys(notInOperation).forEach((key) => {
                query[key] = { $nin: notInOperation[key] };
            });
        }

        if (searchFilter.or) {
            const orOperation = [];
            for (const key in searchFilter.or) {
                const condition = {};
                condition[key] = searchFilter.or[key];
                orOperation.push(condition);
            }
            if (orOperation.length) {
                query['$and'] = query['$and'] ? query['$and'].push({ $or: orOperation }) : [{ $or: orOperation }];
            }
        }

        if (searchFilter.search) {
            const searchOperation = searchFilter.search;
            const orOperation = [];
            searchOperation.searchFields.forEach((field) => {
                const condition = {};
                condition[field] = { $regex: searchOperation.searchKey, $options: 'i' };
                orOperation.push(condition);
            });
            if (orOperation.length) {
                query['$and'] = query['$and'] ? [...query['$and'], { $or: orOperation }] : [{ $or: orOperation }];
            }
        }
        if (searchFilter.range?.length) {
            searchFilter.range.forEach((range) => {
                query[range.field] = {
                    ...(range.from && { $gte: range.from }),
                    ...(range.to && { $lte: range.to }),
                };
            });
        }
        if (searchFilter.paginate) {
            Object.assign(options, {
                limit: searchFilter.paginate.pageSize,
                skip: (searchFilter.paginate.page - 1) * searchFilter.paginate.pageSize,
            });

            meta.page = searchFilter.paginate.page;
            meta.pageSize = searchFilter.paginate.pageSize;
            meta.skip = options.skip;
        }
        if (searchFilter.populate) {
            if (Array.isArray(options.populate)) options.populate.unshift(...(searchFilter.populate as any));
            else options.populate = searchFilter.populate;
        }

        if (searchFilter.sort) {
            options.sort = { [searchFilter.sort.field]: searchFilter.sort.direction };
        }

        if (searchFilter?.multipleSort?.length) {
            options.sort = searchFilter.multipleSort.reduce((acc, sort) => {
                acc[sort.field] = sort.direction;
                return acc;
            }, {});
        }

        return {
            query,
            projection,
            options,
            meta,
        };
    }

    async getSearchCount(searchFields: GenericFilterQuery) {
        const { query } = this.buildFiltersQuery(searchFields);
        const count = await this.count(query);
        return {
            count,
        };
    }

    // =====================Aggregation Functions=====================

    spreadIfValueNotNull(value: any, object: any) {
        if (value) {
            return object;
        } else {
            return {};
        }
    }

    spreadRange(key: any, range: AggregationRange) {
        if (range.from && range.to) {
            return { [key]: { $gt: range.from, $lte: range.to } };
        } else if (range.from) {
            return { [key]: { $gt: range.from } };
        } else if (range.to) {
            return { [key]: { $lte: range.to } };
        } else {
            return {};
        }
    }

    getFirstResult(result: any[], orDefault?: any) {
        if (Array.isArray(result) && result.length > 0) {
            return result[0];
        } else {
            return orDefault;
        }
    }

    paginate(pipeline: mongoose.PipelineStage[], pagination: AggregationPagination) {
        let limitValue = 10;
        if (pagination.limit) {
            limitValue = pagination.limit;
        } else if (pagination.$limit) {
            limitValue = pagination.$limit;
        } else if (pagination.rowsPerPage) {
            limitValue = pagination.rowsPerPage;
        } else if (pagination.$pageSize) {
            limitValue = pagination.$pageSize;
        }

        let skipValue: number = null;
        if (pagination.skip) {
            skipValue = pagination.skip;
        } else if (pagination.$skip) {
            skipValue = pagination.$skip;
        } else if (pagination.page) {
            skipValue = (pagination.page - 1) * limitValue;
        } else if (pagination.$page) {
            skipValue = (pagination.$page - 1) * limitValue;
        }
        if (skipValue) {
            pipeline.push({ $skip: skipValue });
        }
        pipeline.push({ $limit: limitValue });
    }

    sortRandomly(pipeline: mongoose.PipelineStage[]) {
        pipeline.push(
            {
                $addFields: {
                    randomValue: { $rand: {} },
                },
            },
            {
                $sort: {
                    randomValue: 1,
                },
            },
        );
    }

    selectRandomSample(pipeline: mongoose.PipelineStage[], sample = 1) {
        pipeline.push({ $sample: { size: sample } });
    }

    async aggregatePipeline<T>(
        pipeline: mongoose.PipelineStage[],
        options?: mongoose.AggregateOptions,
        returnFirstItem = false,
        defaultResult: T = null,
        itemProcessorFunction: UnaryProducerFunction<any, T> = null,
    ): Promise<T[] | T> {
        let result = await this.Model.aggregate(pipeline, options).allowDiskUse(true);

        if (!result) {
            if (defaultResult) {
                return defaultResult;
            }
            return [];
        }
        if (Array.isArray(result) && result.length > 0) {
            if (itemProcessorFunction) {
                result = await Promise.all(
                    result.map((item) => {
                        const value = itemProcessorFunction(item);
                        return value || item;
                    }),
                );
            }
            if (returnFirstItem) {
                return result[0];
            } else {
                return result;
            }
        } else {
            if (defaultResult) {
                return defaultResult;
            }
            return [];
        }
    }

    async awaitProcessPipeline<T>(
        pipeline: mongoose.PipelineStage[],
        handler: CallBackFunction<T>,
        options?: mongoose.AggregateOptions,
    ) {
        const readyTasks = this.Model.aggregate(pipeline, options).allowDiskUse(true).cursor();
        for await (const doc of readyTasks) {
            await handler(doc);
        }
    }

    // bulkWrite<T>(
    //   writes: Array<
    //     mongoose.AnyBulkWriteOperation<
    //       T extends Document ? any : T extends object ? T : any
    //     >
    //   >,
    //   options?: BulkWriteOptions &
    //     mongoose.MongooseBulkWriteOptions & { ordered: false }
    // ): Promise<BulkWriteResult & { mongoose?: { validationErrors: Error[] } }> {
    //   if (writes && Array.isArray(writes) && writes.length) {
    //     return this.Model.bulkWrite(writes, options);
    //   } else {
    //     return null;
    //   }
    // }
    bulkWrite<TRaw = C extends mongoose.Document ? any : C>(
        writes: mongoose.AnyBulkWriteOperation<TRaw>[],
        options?: mongoose.MongooseBulkWriteOptions,
    ) {
        return this.Model.bulkWrite(writes as any, options);
    }
}
