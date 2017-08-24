const {aLernaProject, fs} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  sinon = require('sinon'),
  sync = require('..');

describe('modules sync task', () => {

  it('should sync module versions', () => {
    const project = aLernaProject()
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({version: '1.0.0', dependencies: {'a': '~1.0.0'}}));

    return project.within(() => {
      return sync()().then(() => {
        expect(fs.readJson('packages/b/package.json')).to.contain.deep.property('dependencies.a', '~2.0.0');
        // expect(reporter).to.have.been.calledWith(sinon.match.any, 'info', 'b: dependencies.a (~1.0.0 -> ~2.0.0)');
      });
    });
  });
});