const {expect} = require('chai'),
  {empty} = require('lerna-script-test-utils'),
  {spawnSync} = require('child_process');

describe('cli', () => {
  const runCli = cliRunner();

  it('should fail if lerna.json is missing', done => {
    empty()
      .within(() => runCli('--loglevel verbose non-existing-task'))
      .catch(err => {
        expect(err.output).to.match(/.*Resolving lerna-script tasks file.../);
        expect(err.output).to.match(/.*no such file or directory, open '\.\/lerna.json'/);
        done();
      });
  });

  it('should fail with error if no tasks file is set and lerna.js is missing', done => {
    empty()
      .addFile('lerna.json', {})
      .within(() => runCli('non-existing-task'))
      .catch(err => {
        expect(err.output).to.match(/.*Cannot find module.*lerna.js/);
        done();
      });
  });

  it('should fail if task is not provided', done => {
    empty()
      .within(() => runCli())
      .catch(err => {
        expect(err.output).to.match(/.*Not enough non-option arguments: got 0, need at least 1/);
        done();
      });
  });

  it('should run exported script from default lerna.js task file', () => {
    return empty()
      .addFile('lerna.json', {})
      .addFile('lerna.js', 'module.exports.someTask = () => console.log("task someTask executed")')
      .within(() => runCli('--loglevel verbose someTask'))
      .then(res => expect(res.toString()).to.match(/.*task someTask executed/));
  });

  it('should run exported script from custom script defined in lerna.json', () => {
    return empty()
      .addFile('lerna.json', {'lerna-script-tasks': './tasks.js'})
      .addFile('tasks.js', 'module.exports.someTask = () => console.log("task someTask executed")')
      .within(() => runCli('someTask'))
      .then(res => expect(res.toString()).to.match(/.*task someTask executed/));
  });

  it('should run exported script from custom script defined in lerna.json as function', () => {
    return empty()
      .addFile('lerna.json', {'lerna-script-tasks': './tasks.js'})
      .addFile('tasks.js', 'module.exports = () => ({someTask: () => console.log("task someTask executed")})')
      .within(() => runCli('someTask'))
      .then(res => expect(res.toString()).to.match(/.*task someTask executed/));
  });


  it('should report error and fail with exit code 1 if task rejected', done => {
    empty()
      .addFile('lerna.json', {})
      .addFile('lerna.js', 'module.exports.someTask = () => Promise.reject(new Error("woop"));')
      .within(() => runCli('someTask'))
      .catch(e => {
        expect(e.status).to.equal(1);
        expect(e.output).to.be.string('Task "someTask" failed');
        expect(e.output).to.be.string('at Object.module.exports.someTask');
        done();
      })
  });

  it('should set loglevel', () => {
    return empty()
      .addFile('lerna.json', {})
      .addFile('lerna.js', 'module.exports.someTask = log => log.verbose("verbose ok");')
      .within(() => runCli('--loglevel verbose someTask'))
      .then(output => {
        expect(output).to.match(/.*verbose ok/)
      });
  });

  it('should defaults to info loglevel', () => {
    return empty()
      .addFile('lerna.json', {})
      .addFile('lerna.js', 'module.exports.someTask = log => log.info("info ok");')
      .within(() => runCli('--loglevel verbose someTask'))
      .then(output => {
        expect(output).to.match(/.*info ok/)
      });
  });




  function cliRunner() {
    const cmd = `${process.cwd()}/bin/cli.js`;
    return (args = '') => {
      const res = spawnSync('bash', ['-c', `${cmd} ${args}`], {cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe']});
      if (res.status !== 0) {
        const toThrow = new Error(`Command failed with status ${res.status} and output ${res.stdout.toString() + res.stderr.toString()}`);
        toThrow.output = res.stdout.toString() + res.stderr.toString();
        toThrow.status = res.status;
        throw toThrow;
      } else {
        return res.stdout.toString() + res.stderr.toString();
      }
    }
  }
});