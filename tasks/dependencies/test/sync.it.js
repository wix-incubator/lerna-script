const {aLernaProject, loggerMock, fs} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {loadPackages} = require('lerna-script'),
  {sync} = require('..');

describe('sync task', () => {

  it('should sync dependencies, depDependencies, peerDependencies defined in root package.json as managed*Dependencies', () => {
    const {log, project} = setup();

    return project.within(() => {

      return sync()(log).then(() => {
        expect(fs.readJson('packages/a/package.json')).to.contain.deep.property('peerDependencies.foo', '> 1.0.0');
        expect(log.item.info).to.have.been.calledWith('a: peerDependencies.foo (1 -> > 1.0.0)');

        expect(fs.readJson('packages/a/package.json')).to.contain.deep.property('devDependencies.lodash', '1.1.0');
        expect(log.item.info).to.have.been.calledWith('a: devDependencies.lodash (nope -> 1.1.0)');

        expect(fs.readJson('packages/b/package.json')).to.contain.deep.property('dependencies.lodash', '1.1.0');
        expect(log.item.info).to.have.been.calledWith('b: dependencies.lodash (~1.0.0 -> 1.1.0)');
      });
    });
  });

  it('should use packages if provided', () => {
    const {log, project} = setup();

    return project.within(() => {
      const packages = loadPackages().filter(p => p.name === 'a');

      return sync({packages})(log).then(() => {
        expect(fs.readJson('packages/a/package.json')).to.contain.deep.property('peerDependencies.foo', '> 1.0.0');
        expect(fs.readJson('packages/a/package.json')).to.contain.deep.property('devDependencies.lodash', '1.1.0');

        expect(fs.readJson('packages/b/package.json')).to.not.contain.deep.property('dependencies.lodash', '1.1.0');
      });
    });
  });


  function setup() {
    const log = loggerMock();
    const project = aLernaProject()
      .lernaJson({
        managedDependencies: {
          lodash: '1.1.0'
        },
        managedPeerDependencies: {
          foo: '> 1.0.0'
        }
      })
      .module('packages/a', module => module.packageJson({
        name: 'a',
        version: '1.0.0',
        peerDependencies: {
          foo: '1'
        },
        devDependencies: {
          lodash: 'nope'
        }
      }))
      .module('packages/b', module => module.packageJson({
        name: 'b',
        version: '1.0.0',
        dependencies: {
          a: '~1.0.0',
          lodash: '~1.0.0'
        }
      }));

    return {log, project};
  }

});