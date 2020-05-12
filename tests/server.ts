import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {MongoInternals} from 'meteor/mongo';

chai.should();
chai.use(sinonChai);

const RawCollection = MongoInternals.NpmModule.Collection;
const Cursor = MongoInternals.NpmModule.Cursor;

const Col = new Mongo.Collection<{a: number}>('col');

let IN_TRANSACTION = true;

Package['bhunjadi:mongo-transactions'] = {
    isInTransaction() {
        return IN_TRANSACTION;
    },
};

describe('mongo-count', function () {
    const sandbox = sinon.createSandbox();

    let countDocumentsSpy;
    let countSpy;

    beforeEach(() => {
        IN_TRANSACTION = true;

        Col.remove({});

        Col.insert({a: 1});
        Col.insert({a: 2});
        Col.insert({a: 1});

        countDocumentsSpy = sandbox.spy(RawCollection.prototype, 'countDocuments');
        countSpy = sandbox.spy(Cursor.prototype, 'count');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('cursor.count', function () {
        it('works', function () {
            expect(Col.find({a: 1}).count()).to.be.equal(2);
    
            expect(countDocumentsSpy).to.have.been.calledOnceWith(
                {a: 1},
                {collation: undefined},
            );
    
            expect(countSpy).to.have.been.calledOnce;
        });
    
        it('works with applySkipLimit', function () {
            expect(Col.find({a: 1}, {limit: 1}).count(true)).to.be.equal(1);
    
            expect(countDocumentsSpy).to.have.been.calledOnceWith(
                {a: 1},
                {collation: undefined, limit: 1, skip: 0},
            );
            expect(countSpy).to.have.been.calledOnce;
        });
    
        it('just passes args when not in transaction', function () {
            IN_TRANSACTION = false;
    
            expect(Col.find({a: 1}).count()).to.be.equal(2);
    
            expect(countSpy).to.have.been.calledOnceWith(false, sinon.match.func);
            expect(countDocumentsSpy).to.have.not.been.called;
        }); 

        it('works with empty query', function () {
            expect(Col.find().count()).to.be.equal(3);
        });
    });

    describe('collection.count', function () {
        it('works', function () {
            expect(Promise.await(Col.rawCollection().count({a: 1}))).to.be.equal(2);
            expect(countDocumentsSpy).to.have.been.calledOnceWith({
                a: 1,
            });
        });

        it('works with empty query', function () {
            expect(Promise.await(Col.rawCollection().count())).to.be.equal(3);
        });
    });
});
