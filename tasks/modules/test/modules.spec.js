const {aLernaProject, fs, loggerMock} = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai').use(require('sinon-chai')),
  sinon = require('sinon'),
  sync = require('..');

describe('modules sync task', () => {

  it('should sync module versions with defaults', () => {
    const log = loggerMock();
    const project = aLernaProject()
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {'a': '~1.0.0'}}))
      .module('packages/c', module => module.packageJson({devDependencies: {'a': '~1.0.0'}}))
      .module('packages/d', module => module.packageJson({peerDependencies: {'a': '~1.0.0'}}));

    return project.within(() => {
      return sync()(log).then(() => {
        expect(fs.readJson('packages/b/package.json')).to.contain.deep.property('dependencies.a', '~2.0.0');
        expect(fs.readJson('packages/c/package.json')).to.contain.deep.property('devDependencies.a', '~2.0.0');
        expect(fs.readJson('packages/d/package.json')).to.contain.deep.property('peerDependencies.a', '>=2.0.0');
        expect(log.info).to.have.been.calledWith('syncModulesTask', `syncing 4 modules`);
      });
    });
  });

  it('should respect provided packages', () => {
    const log = loggerMock();
    const project = aLernaProject()
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {'a': '~1.0.0'}}))
      .module('packages/c', module => module.packageJson({dependencies: {'a': '~1.0.0'}}));

    return project.within(() => {
      const lernaPackage = loadPackages().filter(p => p.name !== 'c');
      return sync({packages: lernaPackage})(log).then(() => {
        expect(fs.readJson('packages/b/package.json')).to.contain.deep.property('dependencies.a', '~2.0.0');
        expect(fs.readJson('packages/c/package.json')).to.contain.deep.property('dependencies.a', '~1.0.0');
        expect(log.info).to.have.been.calledWith('syncModulesTask', `syncing 2 modules`);
      });
    });
  });

  it('should accept custom transformFunctions', () => {
    const log = loggerMock();
    const project = aLernaProject()
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {'a': '~1.0.0'}}))
      .module('packages/c', module => module.packageJson({devDependencies: {'a': '~1.0.0'}}))
      .module('packages/d', module => module.packageJson({peerDependencies: {'a': '~1.0.0'}}));

    return project.within(() => {
      return sync({transformDependencies: v => `+${v}`, transformPeerDependencies: v => `-${v}`})(log).then(() => {
        expect(fs.readJson('packages/b/package.json')).to.contain.deep.property('dependencies.a', '+2.0.0');
        expect(fs.readJson('packages/c/package.json')).to.contain.deep.property('devDependencies.a', '+2.0.0');
        expect(fs.readJson('packages/d/package.json')).to.contain.deep.property('peerDependencies.a', '-2.0.0');
        expect(log.info).to.have.been.calledWith('syncModulesTask', `syncing 4 modules`);
      });
    });
  });
});
