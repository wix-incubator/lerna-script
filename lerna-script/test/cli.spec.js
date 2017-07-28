const {expect} = require('chai'),
  {empty} = require('lerna-script-test-utils'),
  execSync = require('child_process').execSync;

describe('cli', () => {
  const runCli = cliRunner();

  it('should fail with error if lerna-tasks.js is missing', done => {
    empty()
      .within(() => runCli())
      .catch(err => {
        expect(err.stderr).to.match(/.*Cannot find module.*lerna.js/);
        done();
      });
  });

  it('should run exported script', () => {
    return empty()
      .addFile('lerna.js', 'module.exports.someTask = () => console.log("task someTask executed")')
      .within(() => runCli('someTask'))
      .then(res => expect(res.toString()).to.match(/.*task someTask executed/));
  });

  it('should report error and fail with exit code 1 if task rejected', done => {
    empty()
      .addFile('lerna.js', 'module.exports.someTask = () => Promise.reject(new Error("woop"));')
      .within(() => runCli('someTask'))
      .catch(e => {
        expect(e.status).to.equal(1);
        expect(e.stderr.toString()).to.be.string('Task "someTask" failed');
        expect(e.stderr.toString()).to.be.string('at module.exports.someTask');
        done();
      })
  });

  function cliRunner() {
    const cmd = `${process.cwd()}/bin/cli.js`;
    return (args = '') => execSync(`${cmd} ${args}`, {stdio: [null, null, null]});
  }
});