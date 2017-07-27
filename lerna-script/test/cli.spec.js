const {expect} = require('chai'),
  {empty} = require('octopus-test-utils'),
  exec = require('child_process').execSync;

describe('cli', () => {

  it('should fail if lerna-tasks.js is missing', done => {
    const runCli = cliRunner();

    empty()
      .within(() => runCli())
      .catch(err => {
        expect(err.stderr).to.match(/.*Cannot find module.*lerna-tasks.js/);
        done();
      });
  });

  it('should run exported script', () => {
    const runCli = cliRunner();

    return empty()
      .addFile('lerna-tasks.js', 'module.exports.someTask = console.log("task someTask executed")')
      .within(() => runCli('someTask'))
      .then(res => expect(res.toString()).to.match(/.*task someTask executed/));
  });

  function cliRunner() {
    const cmd = `${process.cwd()}/bin/cli.js`;
    return (args = '') => exec(`${cmd} ${args}`, {stdio: [null, null, null]});
  }
});