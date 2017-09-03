const idea = require('lerna-script-tasks-idea'),
  modules = require('lerna-script-tasks-modules'),
  npmfix = require('lerna-script-tasks-npmfix'),
  dependencies = require('lerna-script-tasks-dependencies')

function sync(log) {
  return Promise.resolve()
    .then(() => modules()(log))
    .then(() => npmfix()(log))
    .then(() => dependencies.sync()(log));
}

module.exports = {
  idea: idea(),
  sync,
  'deps:unmanaged': dependencies.unmanaged(),
  'deps:latest': dependencies.latest(),
  'deps:sync': dependencies.sync()
};