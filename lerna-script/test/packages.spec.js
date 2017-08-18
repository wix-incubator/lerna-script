const {expect} = require('chai').use(require('sinon-chai')),
  {aLernaProject, loggerMock} = require('./utils'),
  index = require('..');

describe('packages', () => {

  describe.only('packages', () => {

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