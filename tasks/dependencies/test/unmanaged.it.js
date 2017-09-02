const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {unmanaged} = require('..');

describe('unmanaged task', () => {

  it('should list dependencies present in modules, but not in managed*Dependencies', () => {
    const {log, project} = setup();

    return project.within(() => {
      return unmanaged()(log).then(() => {
        expect(log.error).to.have.been.calledWith('Unmanaged dependency highdash (1.1.0, 1.2.0)');
        expect(log.error).to.have.been.calledWith('Unmanaged peerDependency bar (> 1.0.0)');
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
          foo: '1',
          bar: '> 1.0.0'
        },
        devDependencies: {
          lodash: 'nope',
          highdash: '1.1.0'
        }
      }))
      .module('packages/b', module => module.packageJson({
        version: '1.0.0',
        dependencies: {
          a: '~1.0.0',
          lodash: '~1.0.0',
          highdash: '1.2.0'
        }
      }));

    return {log, project};
  }

});