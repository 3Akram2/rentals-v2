import * as mongoose from 'mongoose';
import AbstractMongooseRepository, { ResultPage } from './AbstractMongooseRepository';
import { DeleteResult, UpdateResult } from 'mongodb';
import { GenericFilterQuery } from './generic-filter-query.dto';

export type CallBackFunction<T> = (source: T) => any;
export type EachAsyncCallBackFunction<T> = (source: T, index: number) => any;
export type ProducerFunction<T> = () => T;
export type UnaryProducerFunction<V, T> = (item: V) => T;
export type AggregationPagination = {
    skip?: number;
    limit?: number;
    $skip?: number;
    $limit?: number;
    page?: number;
    rowsPerPage?: number;
    $page?: number;
    $pageSize?: number;
};
export type AggregationRange = {
    from?: any;
    to?: any;
};

function getDefaultOptions(options: mongoose.QueryOptions): mongoose.QueryOptions {
    return {
        returnDocument: 'after',
        ...(options || {}),
    };
}

export default abstract class<C, D extends mongoose.HydratedDocument<C>, R extends AbstractMongooseRepository<C, D>> {
    constructor(private repo: R) {}

    getRepo(): R {
        return this.repo;
    }

    create(data: C, options?: mongoose.SaveOptions): Promise<C> {
        return this.repo.create(data, options);
    }

    createAll(data: C[], options?: mongoose.InsertManyOptions): Promise<C[]> {
        return this.repo.createAll(data, options);
    }

    getOrCreate(
        query: mongoose.FilterQuery<D>,
        producer: UnaryProducerFunction<any, C>,
        options?: mongoose.QueryOptions,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C> {
        return this.repo.getOrCreate(query, producer, options, projection);
    }

    findAll(
        query: mongoose.FilterQuery<D>,
        options?: mongoose.QueryOptions,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C[]> {
        return this.repo.findAll(query, options, projection);
    }

    findPage(
        query: mongoose.FilterQuery<D>,
        page: number,
        pageSize: number,
        options?: mongoose.QueryOptions,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<ResultPage<C>> {
        return this.repo.findPage(query, page, pageSize, options, projection);
    }

    findOne(
        query: mongoose.FilterQuery<D>,
        options?: mongoose.QueryOptions,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C> {
        return this.repo.findOne(query, options, projection);
    }

    findOneAndUpdate(
        filter: mongoose.FilterQuery<D>,
        update: mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions<D>,
    ): Promise<C> {
        return this.repo.findOneAndUpdate(filter, update, options);
    }

    findById(
        id: string | mongoose.ObjectId,
        options?: mongoose.QueryOptions,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<C> {
        return this.repo.findById(id, options, projection);
    }

    deleteOne(query: mongoose.FilterQuery<D>, options?: mongoose.QueryOptions): Promise<DeleteResult | C> {
        return this.repo.deleteOne(query, true, options);
    }

    deleteById(id: string | mongoose.ObjectId, options?: mongoose.QueryOptions): Promise<C> {
        return this.repo.deleteById(id, options);
    }

    deleteMany(query: mongoose.FilterQuery<D>, options?: mongoose.QueryOptions): Promise<DeleteResult> {
        return this.repo.deleteMany(query, options);
    }

    softDeleteOne(
        query: mongoose.FilterQuery<D>,
        update?: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        return this.repo.softDeleteOne(query, update, true, getDefaultOptions(options));
    }

    softDeleteById(
        id: string | mongoose.ObjectId,
        update?: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<C> {
        return this.repo.softDeleteById(id, update, getDefaultOptions(options));
    }

    softDeleteMany(
        query: mongoose.FilterQuery<D>,
        update?: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult> {
        return this.repo.softDeleteMany(query, update, options);
    }

    upsert(
        query: mongoose.FilterQuery<D>,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<C> {
        return this.repo.upsert(query, update, options);
    }

    updateOne(
        query: mongoose.FilterQuery<D>,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        return this.repo.updateOne(query, update, true, getDefaultOptions(options));
    }

    updateById(
        id: string | mongoose.ObjectId,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<C> {
        return this.repo.updateById(id, update, getDefaultOptions(options));
    }

    updateMany(
        query: mongoose.FilterQuery<D>,
        update: mongoose.UpdateWithAggregationPipeline | mongoose.UpdateQuery<D>,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult> {
        return this.repo.updateMany(query, update, options);
    }

    async loadOneAndPatch(
        query: mongoose.FilterQuery<D>,
        updaterFn: CallBackFunction<C>,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        const source = await this.findOne(query, options);
        if (!source) {
            return null;
        }
        const update = updaterFn(source);
        if (!update) {
            return source;
        }
        return this.updateById((source as any)._id, update, options);
    }

    async loadByIdAndPatch(
        id: string | mongoose.ObjectId,
        updaterFn: CallBackFunction<C>,
        options?: mongoose.QueryOptions,
    ): Promise<C> {
        const source = await this.findById(id, options);
        if (!source) {
            return null;
        }
        const update = updaterFn(source);
        if (!update) {
            return source;
        }
        return this.updateById(id, update, options);
    }

    async loadManyAndPatch(
        query: mongoose.FilterQuery<D>,
        updaterFn: CallBackFunction<C>,
        options?: mongoose.QueryOptions,
    ): Promise<C[]> {
        const sources = await this.findAll(query, options);
        return Promise.all(
            sources.map((source) => {
                const update = updaterFn(source);
                if (!update) {
                    return source;
                }
                return this.updateById((source as any)._id, update, options);
            }),
        );
    }

    replace(query: mongoose.FilterQuery<D>, update: any, options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.repo.replace(query, update, getDefaultOptions(options));
    }

    replaceById(_id: string | mongoose.ObjectId, update: any, options?: mongoose.QueryOptions<D>): Promise<C> {
        return this.repo.replaceById(_id, update, {
            ...getDefaultOptions(options),
            runValidators: true,
        });
    }

    async estimatedCount() {
        return { total: await this.repo.estimatedCount() };
    }

    async count(query: mongoose.FilterQuery<D>) {
        return { total: await this.repo.count(query) };
    }

    push(id: string, field: any, arrayItem: any | any[], options?: mongoose.QueryOptions): Promise<C> {
        return this.repo.push(id, field, arrayItem, getDefaultOptions(options));
    }

    pushAtPosition(
        id: string,
        field: any,
        arrayItem: any | any[],
        position: number,
        options?: mongoose.QueryOptions,
    ): Promise<C> {
        return this.repo.pushAtPosition(id, field, arrayItem, position, getDefaultOptions(options));
    }

    pushAtTop(id: string, field: any, arrayItem: any | any[], options?: mongoose.QueryOptions): Promise<C> {
        return this.repo.pushAtTop(id, field, arrayItem, getDefaultOptions(options));
    }

    updateEmbeddedObjectField(
        id: string,
        fieldPath: any,
        fieldValue: any,
        options?: mongoose.QueryOptions,
    ): Promise<C> {
        return this.repo.updateEmbeddedObjectField(id, fieldPath, fieldValue, getDefaultOptions(options));
    }

    updateEmbeddedArrayItem(
        field: any,
        query: any,
        userData: any,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        return this.repo.updateEmbeddedArrayItem(field, query, userData, getDefaultOptions(options));
    }

    updateEmbeddedArrayItems(
        field: any,
        query: any,
        userData: any,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult> {
        return this.repo.updateEmbeddedArrayItems(field, query, userData, options);
    }

    updateEmbeddedArrayItemById(
        id: string,
        field: string,
        arrayItemId: string,
        data: any,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        return this.repo.updateEmbeddedArrayItemById(id, field, arrayItemId, data, getDefaultOptions(options));
    }

    updateEmbeddedArrayItemByQuery(
        id: string,
        field: string,
        userQuery: any,
        data: any,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        return this.repo.updateEmbeddedArrayItemByQuery(id, field, userQuery, data, getDefaultOptions(options));
    }

    increment(id: string, field: any, value = 1, options?: mongoose.QueryOptions) {
        return this.repo.increment(id, field, value, getDefaultOptions(options));
    }

    incrementEmbeddedArrayItemById(
        id: string,
        documentField: string,
        arrayItemId: string,
        itemField: string,
        value = 1,
        options?: mongoose.QueryOptions,
    ): Promise<UpdateResult | C> {
        return this.repo.incrementEmbeddedArrayItemById(
            id,
            documentField,
            arrayItemId,
            itemField,
            value,
            getDefaultOptions(options),
        );
    }

    incrementEmbeddedObjectField(id: string, fieldPath: any, value = 1, options?: mongoose.QueryOptions): Promise<C> {
        return this.repo.incrementEmbeddedObjectField(id, fieldPath, value, getDefaultOptions(options));
    }

    distinct<DocKey extends string, ResultType = unknown>(field: DocKey, query?: mongoose.FilterQuery<D>) {
        return this.repo.distinct<DocKey, ResultType>(field, query);
    }

    findAllSyncCursor(
        query: mongoose.FilterQuery<D>,
        handler: CallBackFunction<D>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): Promise<void> {
        return this.repo.findAllSyncCursor(query, handler, options, projection);
    }

    findAllAsyncCursor(
        query: mongoose.FilterQuery<D>,
        handler: EachAsyncCallBackFunction<D>,
        options?: mongoose.QueryOptions<D>,
        projection?: mongoose.ProjectionType<D>,
    ): void {
        return this.repo.findAllAsyncCursor(query, handler, options, projection);
    }

    aggregatePipeline<D>(
        pipeline: mongoose.PipelineStage[],
        options?: mongoose.AggregateOptions,
        returnFirstItem = false,
        defaultResult: D = null,
        itemProcessorFunction: UnaryProducerFunction<any, D> = null,
    ) {
        return this.repo.aggregatePipeline(pipeline, options, returnFirstItem, defaultResult, itemProcessorFunction);
    }

    search(query: GenericFilterQuery) {
        return this.repo.search(query);
    }

    buildFiltersQuery(query: GenericFilterQuery) {
        return this.repo.buildFiltersQuery(query);
    }

    getSearchCount(query: GenericFilterQuery) {
        return this.repo.getSearchCount(query);
    }

    findRandom(
        query: mongoose.FilterQuery<D>,
        sampleSize = 1,
        options?: mongoose.AggregateOptions,
        projection?: {
            [field: string]: mongoose.AnyExpression | mongoose.Expression | mongoose.PipelineStage.Project['$project'];
        },
    ): Promise<C[]> {
        return this.repo.findRandom(query, sampleSize, options, projection);
    }

    // bulkWrite<T>(
    //   writes: Array<
    //     AnyBulkWriteOperation<
    //       T extends mongoose.Document ? any : T extends {} ? T : any
    //     >
    //   >,
    //   options?: BulkWriteOptions &
    //     mongoose.MongooseBulkWriteOptions & { ordered: false }
    // ): Promise<BulkWriteResult & { mongoose?: { validationErrors: Error[] } }> {
    //   return this.repo.bulkWrite(writes, options);
    // }

    bulkWrite<TRaw = C extends mongoose.Document ? any : C>(
        writes: mongoose.AnyBulkWriteOperation<TRaw>[],
        options?: mongoose.MongooseBulkWriteOptions,
    ) {
        return this.repo.bulkWrite(writes, options);
    }
}
