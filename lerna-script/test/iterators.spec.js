const {expect} = require('chai'),
  sinon = require('sinon'),
  {aLernaProject, loggerMock} = require('./utils'),
  index = require('..');

describe('iterators', () => {

  ['forEach', 'parallel', 'batched'].forEach(type => {

    describe(type, () => {

      it('should mark modules as built if "build" is provided', () => {
        return aLernaProject().within(() => {
          const packages = index.loadPackages();

          return index.iter[type](packages, {build: type})(() => Promise.resolve()).then(() => {
            packages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)(type)).to.equal(true));
          });
        });
      });

      it('should not mark as build on failure', done => {
        aLernaProject().within(() => {
          const packages = index.loadPackages();

          return index.iter[type](packages, {build: type})(() => Promise.reject(new Error('woops')))
            .catch(() => {
              packages.forEach(lernaPackage => expect(index.changes.isBuilt(lernaPackage)(type)).to.equal(false));
              done();
            });
        });
      });
    });
  });

  describe('forEach', () => {

    it('should iterate through available packages', () => {
      const task = sinon.spy();
      const log = loggerMock();

      return aLernaProject().within(() => {
        const packages = index.loadPackages();

        return index.iter
          .forEach(packages, {log})((pkg, innerLog) => task(pkg.name) || innerLog.info(pkg.name))
          .then(() => {
            expect(task.getCall(0).args[0]).to.equal('a');
            expect(task.getCall(1).args[0]).to.equal('b');

            expect(log.newItem().info).to.have.been.called;
          });
      });
    });
  });

  describe('parallel', () => {

    //TODO: verify async nature?
    it('should iterate through available packages', () => {
      const task = sinon.spy();
      const log = loggerMock();

      return aLernaProject().within(() => {
        const packages = index.loadPackages();

        return index.iter
          .parallel(packages, {log})((pkg, innerLog) => task(pkg.name) || innerLog.info(pkg.name))
          .then(() => {
            expect(task).to.have.been.calledWith('a');
            expect(task).to.have.been.calledWith('b');

            expect(log.newGroup().newItem().info).to.have.been.called;
          });
      });
    });
  });

  describe('batched', () => {

    //TODO: verify batched nature
    it('should iterate through available packages', () => {
      const task = sinon.spy();
      const log = loggerMock();

      return aLernaProject().within(() => {
        const packages = index.loadPackages();

        return index.iter
          .batched(packages, {log})((pkg, innerLog) => task(pkg.name) || innerLog.info(pkg.name))
          .then(() => {
            expect(task).to.have.been.calledWith('a');
            expect(task).to.have.been.calledWith('b');

            expect(log.newGroup().newItem().info).to.have.been.called;
          });
      });
    });
  });
});
