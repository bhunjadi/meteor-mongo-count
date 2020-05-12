import {MongoInternals} from 'meteor/mongo';

const RawCollection = MongoInternals.NpmModule.Collection;
const Cursor = MongoInternals.NpmModule.Cursor;

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

const originalCursorCount = Cursor.prototype.count;

Cursor.prototype.count = function (...args) {
    if (isInTransaction()) {
        const callback = typeof args[args.length - 1] === 'function' ? args.pop() : undefined;
        const options = typeof args[args.length - 1] === 'object' ? args.shift() || {} : {};
        const applySkipLimit = args.length ? args.shift() ?? true : true;

        const {operation} = this;
        const {ns: {collection: collectionName}, options: {db}, cmd: {query}} = operation;

        const col = db.collection(collectionName);

        const countDocumentsOptions = {
            ...options,
            collation: this.cmd.collation,
        };

        if (applySkipLimit) {
            if (typeof this.cursorSkip() === 'number') countDocumentsOptions.skip = this.cursorSkip();
            if (typeof this.cursorLimit() === 'number') countDocumentsOptions.limit = this.cursorLimit();
        }

        return col.countDocuments(query, countDocumentsOptions, callback);
    }
    return originalCursorCount.call(this, ...args);
};
