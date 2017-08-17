const {expect} = require('chai'),
  sinon = require('sinon'),
  {aLernaProject} = require('./utils'),
  index = require('..');

describe('iterators', () => {

  describe('forEach', () => {

    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.forEach(packages)(pkg => task(pkg.name)).then(() => {
          expect(task.getCall(0).args[0]).to.equal('a');
          expect(task.getCall(1).args[0]).to.equal('b');
        });
      });
    });
  });

  describe('parallel', () => {

    //TODO: verify async nature?
    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.parallel(packages)(pkg => task(pkg.name)).then(() => {
          expect(task).to.have.been.calledWith('a');
          expect(task).to.have.been.calledWith('b');
        });
      });
    });
  });

  describe('batched', () => {

    //TODO: verify batched nature
    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.batched(packages)(pkg => task(pkg.name)).then(() => {
          expect(task).to.have.been.calledWith('a');
          expect(task).to.have.been.calledWith('b');
        });
      });
    });
  });
});
