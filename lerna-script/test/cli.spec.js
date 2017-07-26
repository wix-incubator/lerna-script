const {expect} = require('chai'),
  {empty} = require('octopus-test-utils'),
  exec = require('child_process').execSync;

describe('cli', () => {

  it('should fail if lerna-tasks.js is missing', done => {
    const runCli = cliRunner();

    aLernaProject()
      .within(() => runCli())
      .catch(err => {
        expect(err.stderr).to.match(/.*Cannot find module.*lerna-tasks.js/);
        done();
      });
  });

  it('should run exported script', () => {
    const runCli = cliRunner();

    return aLernaProject()
      .addFile('lerna-tasks.js', 'module.exports.someTask = console.log("task someTask executed")')
      .within(() => runCli('someTask'))
      .then(res => expect(res.toString()).to.match(/.*task someTask executed/));
  });

  it.skip('should print exports if no command provided');

  it.skip('should fail if provided task does not exist');

  function cliRunner() {
    const cmd = `${process.cwd()}/bin/cli.js`;
    return (args = '') => exec(`${cmd} ${args}`);
  }

  function aLernaProject() {
    const module = empty()
      .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["*"], "version": "0.0.0"});
      module.module('a', module => module.packageJson({version: '1.0.0'}));
      module.module('b', module => module.packageJson({name: 'b', version: '1.0.1', dependencies: {'a': '~1.0.0'}}));

      return module;
  }
});