const {expect} = require('chai').use(require('sinon-chai')),
  {aLernaProject, loggerMock} = require('./utils'),
  index = require('..');

describe('packages', () => {

  describe('packages', () => {

    it('should return a list of packages', () => {
      const log = loggerMock();

      return aLernaProject().within(() => {
        const packages = index.packages({log});

        expect(packages.length).to.equal(2);
        expect(log.verbose).to.have.been.calledWithMatch('loadPackages');
      });
    });
  });

  describe('rootPackage', () => {

    it('should return a root package', () => {
      const log = loggerMock();

      return aLernaProject().within(() => {
        const rootPackage = index.rootPackage({log});

        expect(rootPackage.name).to.equal('root');
        expect(rootPackage.location).to.equal(process.cwd());
        expect(log.verbose).to.have.been.calledWithMatch('loadRootPackage');
      });
    });
  });
});