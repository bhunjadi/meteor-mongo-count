import { Promise } from 'meteor/promise';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { MongoInternals } from 'meteor/mongo';

chai.should();
chai.use(sinonChai);

const RawCollection = MongoInternals.NpmModules.mongodb.module.Collection;
const Cursor = MongoInternals.NpmModules.mongodb.module.FindCursor;

const Col = new Mongo.Collection<{ a: number }>('col');

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

  beforeEach(async () => {
    await Col.removeAsync({});

    await Col.insertAsync({ a: 1 });
    await Col.insertAsync({ a: 2 });
    await Col.insertAsync({ a: 1 });

    IN_TRANSACTION = true;

    countDocumentsSpy = sandbox.spy(RawCollection.prototype, 'countDocuments');
    countSpy = sandbox.spy(Cursor.prototype, 'count');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('cursor.count', function () {
    it('works', async function () {
      expect(await Col.find({ a: 1 }).countAsync()).to.be.equal(2);

      expect(countDocumentsSpy).to.have.been.calledOnceWith(
        { a: 1 },
        { transform: null },
      );

      expect(countSpy).to.have.not.been.calledOnce;
    });

    it('works with limit', async function () {
      expect(await Col.find({ a: 1 }, { limit: 1 }).countAsync()).to.be.equal(
        1,
      );

      expect(countDocumentsSpy).to.have.been.calledOnceWith(
        { a: 1 },
        { limit: 1, transform: null },
      );
      expect(countSpy).to.have.not.been.calledOnce;
    });

    it('just passes args when not in transaction', async function () {
      IN_TRANSACTION = false;

      expect(await Col.find({ a: 1 }).countAsync()).to.be.equal(2);

      expect(countSpy).to.have.not.been.calledOnce;
      expect(countDocumentsSpy).to.have.been.calledOnceWith(
        { a: 1 },
        {
          transform: null,
        },
      );
    });

    it('works with empty query', async function () {
      expect(await Col.find().countAsync()).to.be.equal(3);

      expect(countSpy).to.have.not.been.calledOnce;
      expect(countDocumentsSpy).to.have.been.calledOnceWith(
        {},
        {
          transform: null,
        },
      );
    });
  });

  describe('collection.count', function () {
    it('works', async function () {
      expect(await Col.rawCollection().count({ a: 1 })).to.be.equal(2);
      expect(countDocumentsSpy).to.have.been.calledOnceWith({
        a: 1,
      });
    });

    it('works with empty query', async function () {
      expect(await Col.rawCollection().count()).to.be.equal(3);
      expect(countDocumentsSpy).to.have.been.calledOnceWith();
    });
  });
});
