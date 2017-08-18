const {expect} = require('chai').use(require('sinon-chai')),
  {aLernaProject, aLernaProjectWithSpec, loggerMock} = require('./utils'),
  index = require('..');

describe('packages', () => {

  describe('packages', () => {

    it('should return a list of packages', () => {
      const log = loggerMock();

      return aLernaProject().within(() => {
        const packages = index.loadPackages({log});

        expect(packages.length).to.equal(2);
        expect(log.verbose).to.have.been.calledWithMatch('loadPackages');
      });
    });

    it('should accept custom package configs', () => {
      return aLernaProject().within(() => {
        const packages = index.loadPackages({packages: ['nested/a']});

        expect(packages.map(p => p.name)).to.have.same.members(['a']);
      });
    });

    it('should return topo-sorted packages', () => {
      return aLernaProjectWithSpec({
        a: ['b'],
        b: ['c'],
        c: ['d'],
        d: []
      }).within(() => {
        const packages = index.loadPackages();
        expect(packages.map(p => p.name)).to.deep.equal(['d', 'c', 'b', 'a']);
      });
    });
  });

  describe('rootPackage', () => {

    it('should return a root package', () => {
      const log = loggerMock();

      return aLernaProject().within(() => {
        const rootPackage = index.loadRootPackage({log});

        expect(rootPackage.name).to.equal('root');
        expect(rootPackage.location).to.equal(process.cwd());
        expect(log.verbose).to.have.been.calledWithMatch('loadRootPackage');
      });
    });
  });
});