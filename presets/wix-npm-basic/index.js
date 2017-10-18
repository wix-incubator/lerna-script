const {loadPackages, loadRootPackage, iter, exec, filters} = require('lerna-script'),
  idea = require('lerna-script-tasks-idea'),
  npmfix = require('lerna-script-tasks-npmfix');

function test(log) {
  return iter.forEach(loadPackages(), {log, build: 'test'})((lernaPackage, log) => {
    return Promise.resolve()
      .then(() => exec.script(lernaPackage, {log})('build'))
      .then(() => exec.script(lernaPackage, {log, silent: false})('test'));
  });
}

function prepush(log) {
  const syncNvmRc = () => {
    log.info('sync', 'syncing .nvmrc from root to modules (if present)');
    return iter.parallel(loadPackages(), {log})(pkg => exec.command(pkg)(`cp ${process.cwd()}/.nvmrc .;`));
  };

  const syncNpmVersion = () => {
    log.info('sync', 'syncing .npmversion from root to modules (if present)');
    return iter.parallel(loadPackages(), {log})(pkg => exec.command(pkg)(`cp ${process.cwd()}/.npmversion .;`));
  };

  return Promise.resolve()
    .then(() => syncNvmRc())  
    .then(() => syncNpmVersion())
    .then(() => npmfix()(log));
}

function clean(log) {
  const rootPackage = loadRootPackage();
  const packages = loadPackages();
  const cleanCommands = ['rm -f *.log', 'rm -f *.log.*', 'rm -f yarn.lock', 'rm -rf target', 'rm -f package-lock.json'];

  log.info('clean', 'running lerna clean --yes');
  return exec.command(rootPackage, {log})('lerna clean --yes').then(() => {
    log.info('clean', `cleaning misc files for ${packages.length} packages`, cleanCommands);
    return iter.forEach(packages.concat(rootPackage), {log})((lernaPackage, log) => {
      return Promise.all(cleanCommands.map(cmd => exec.command(lernaPackage, {log})(cmd)));
    });
  });
}

module.exports = () => ({clean, prepush, test, idea: idea()});
