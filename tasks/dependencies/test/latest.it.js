const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {latest} = require('..'),
  sinon = require('sinon'),
  {execSync} = require('child_process');

describe('latest task', function () {
  this.timeout(30000);

  it('should list dependencies that can be updated', () => {
    const ramdaVersion = execSync('npm info ramda dist-tags.latest').toString().trim('\n');
    const lodashVersion = execSync('npm info lodash dist-tags.latest').toString().trim('\n');
    const {log, project} = setup({
      managedDependencies: {
        lodash: 'latest',
        shelljs: '*',
        ramda: '0.0.1',
        url: '>0.0.1'
      },
      managedPeerDependencies: {
        ramda: '> 0.0.1',
        lodash: '0.0.1'
      }
    });

    return project.within(() => {
      return latest()(log)
        .then(() => {
          expect(log.info).to.have.been.calledWith('latest', `update found for dependency ramda: 0.0.1 -> ${ramdaVersion}`);
          expect(log.info).to.not.have.been.calledWith(sinon.match('dependency lodash'));
          expect(log.info).to.not.have.been.calledWith(sinon.match('dependency shelljs'));
          expect(log.info).to.not.have.been.calledWith(sinon.match('dependency url'));

          expect(log.info).to.not.have.been.calledWith(sinon.match('peerDependency ramda'));
          expect(log.info).to.have.been.calledWith('latest', `update found for peerDependency lodash: 0.0.1 -> ${lodashVersion}`);
        });
    });
  });

  it('should not reject for missing managedDependencies, managedPeerDependencies', () => {
    const {log, project} = setup();

    return project.within(() => latest()(log));
  });

  function setup(lernaJsonOverrides = {}) {
    const log = loggerMock();
    const project = aLernaProject()
      .lernaJson(lernaJsonOverrides);

    return {log, project};
  }
});
