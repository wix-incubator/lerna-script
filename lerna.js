const {loadRootPackage, loadPackages, iter, exec} = require('lerna-script'),
  idea = require('lerna-script-tasks-idea'),
  syncModules = require('lerna-script-tasks-modules'),
  npmfix = require('lerna-script-tasks-npmfix'),
  dependencies = require('lerna-script-tasks-dependencies'),
  depcheck = require('lerna-script-tasks-depcheck');

function test(log) {
  return iter.forEach(loadPackages(), {log, build: 'test'})((lernaPackage, log) => {
      return exec.script(lernaPackage, {log, silent: false})('test');
  });
}

function clean(log) {
  return exec.command(loadRootPackage(), {log})('lerna clean --yes').then(() => {
    return iter.forEach(loadPackages().join([loadRootPackage()]), {log})((lernaPackage, log) => {
      const execCmd = cmd => exec.command(lernaPackage, {log})(cmd);
      return Promise.all(['rm -f *.log', 'rm -f *.log.*', 'rm -f yarn.lock', 'rm -f package-lock.json', 'rm -rf .lerna'].map(execCmd));
    });
  });
}

function sync(log) {
  return Promise.resolve()
    .then(() => syncModules()(log))
    .then(() => npmfix()(log))
    .then(() => dependencies.sync()(log));
}

module.exports = {
  test,
  sync,
  idea: idea(),
  depcheck: depcheck(),
  clean,
  'deps:unmanaged': dependencies.unmanaged(),
  'deps:latest': dependencies.latest(),
  'deps:sync': dependencies.sync()
};