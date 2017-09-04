const {loadPackages, iter, exec} = require('lerna-script'),
  idea = require('lerna-script-tasks-idea'),
  modules = require('lerna-script-tasks-modules'),
  npmfix = require('lerna-script-tasks-npmfix'),
  dependencies = require('lerna-script-tasks-dependencies'),
  depcheck = require('lerna-script-tasks-depcheck');

function test(log) {
  return iter.forEach(loadPackages(), {log, build: 'test'})((lernaPackage, log) => {
      return exec.script(lernaPackage, {log, silent: false})('test');
  });
}

function sync(log) {
  return Promise.resolve()
    .then(() => modules()(log))
    .then(() => npmfix()(log))
    .then(() => dependencies.sync()(log));
}

module.exports = {
  test,
  sync,
  idea: idea(),
  depcheck: depcheck(),
  'deps:unmanaged': dependencies.unmanaged(),
  'deps:latest': dependencies.latest(),
  'deps:sync': dependencies.sync()
};