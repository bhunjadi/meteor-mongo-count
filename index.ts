import {MongoInternals} from 'meteor/mongo';
import { FindCursor, CountOptions, CountDocumentsOptions, FindOptions } from 'mongodb';

const mongoModule = MongoInternals.NpmModules.mongodb.module;

const RawCollection = mongoModule.Collection;
const FindCursorClass = mongoModule.FindCursor;

function isInTransaction() {
    const MongoTransactionsPackage = Package['bhunjadi:mongo-transactions'];
    return MongoTransactionsPackage.isInTransaction();
}

const originalCollectionCount = RawCollection.prototype.count;

RawCollection.prototype.count = function (...args) {
    if (isInTransaction()) {
        return this.countDocuments(...args);
    }
    return originalCollectionCount.call(this, ...args);
};

const originalCursorCount = FindCursorClass.prototype.count;

FindCursorClass.prototype.count = function (...args) {
    if (isInTransaction()) {
        const callback = typeof args[args.length - 1] === 'function' ? args.pop() : undefined;
        const options: CountOptions = typeof args[args.length - 1] === 'object' ? args.shift() || {} : {};

        // Sadly, we have to use internal fields to get data needed, like filter, limit, skip and collation.
        const symbols = Object.getOwnPropertySymbols(this);
        const kFilter = symbols.find((s) => s.description === 'filter');
        const kBuiltOptions = symbols.find((s) => s.description === 'builtOptions');
        if (!kFilter || !kBuiltOptions) {
            console.warn(new Error().stack);
            console.warn('Cannot find kFilter and kBuiltOption on a cursor when fetching count. Default to deprected method.');
            return originalCursorCount.call(this, ...arguments);
        }

        const filter = this[kFilter];
        const builtOptions: FindOptions = this[kBuiltOptions];

        const {client} = MongoInternals.defaultRemoteCollectionDriver().mongo;
        const db = client.db(this.namespace.db);
        const collection = db.collection(this.namespace.collection);

        const countDocumentsOptions: CountDocumentsOptions = {
            ...options,
        };

        if (typeof builtOptions.limit === 'number') {
            countDocumentsOptions.limit = builtOptions.limit;
        }
        if (typeof builtOptions.skip === 'number') {
            countDocumentsOptions.skip = builtOptions.skip;
        }
        if (builtOptions.collation) {
            countDocumentsOptions.collation = builtOptions.collation;
        }

        return collection.countDocuments(filter, countDocumentsOptions, callback);
    }

    return originalCursorCount.call(this, ...args);
};
