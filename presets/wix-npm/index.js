const {loadPackages, loadRootPackage, iter, exec, filters} = require('lerna-script'),
  idea = require('lerna-script-tasks-idea'),
  modules = require('lerna-script-tasks-modules'),
  npmfix = require('lerna-script-tasks-npmfix'),
  dependencies = require('lerna-script-tasks-dependencies'),
  depcheck = require('lerna-script-tasks-depcheck');

function test() {
  return log => iter.forEach(loadPackages(), {log, build: 'test'})((lernaPackage, log) => {
    return Promise.resolve()
      .then(() => exec.script(lernaPackage, {log})('build'))
      .then(() => exec.script(lernaPackage, {log, silent: false})('test'));
  });
}

function prepush(log) {
  const syncNvmRc = () => {
    log.info('sync', 'syncing .nvmrc from root to modules');
    return iter.parallel(loadPackages(), {log})(pkg => exec.command(pkg)(`cp ${process.cwd()}/.nvmrc .`));
  };

  return Promise.resolve()
    .then(() => syncNvmRc())
    .then(() => modules()(log))
    .then(() => npmfix()(log))
    .then(() => dependencies.sync()(log));
}

function clean(log) {
  const rootPackage = loadRootPackage();
  const packages = loadPackages();
  const cleanCommands = ['rm -f *.log', 'rm -f *.log.*', 'rm -f yarn.lock', 'rm -rf target', 'rm -f package-lock.json'];

  log.info('clean', 'running lerna clean --yes');
  return exec.command(rootPackage, {log})('lerna clean --yes').then(() => {
    log.info('clean', `cleaning misc files for ${packages.length} packages`, cleanCommands);
    return iter.parallel(packages.concat(rootPackage), {log})((lernaPackage, log) => {
      return Promise.all(cleanCommands.map(cmd => exec.command(lernaPackage, {log})(cmd)));
    });
  });
}

function pullreq(log) {
  const bootstrapApp = () => exec.command(loadRootPackage(), {log, silent: false})('lerna bootstrap --concurrency 8');
  const buildAll = () => iter.forEach(loadPackages(), {log})((lernaPackage, log) =>
    exec.script(lernaPackage, {log})('build'));
  const testChanged = () => iter.forEach(filters.gitSince(loadPackages(), {log})('origin/master'), {log})((lernaPackage, log) =>
    exec.script(lernaPackage, {log, silent: false})('test'));

  return Promise.resolve().then(bootstrapApp).then(buildAll).then(testChanged);
}

module.exports = {
  clean,
  prepush,
  pullreq,
  test: test(loadPackages),
  idea: idea(),
  depcheck: depcheck(),
  'deps:extraneous': dependencies.extraneous(),
  'deps:unmanaged': dependencies.unmanaged(),
  'deps:latest': dependencies.latest(),
  'deps:sync': dependencies.sync()
};
