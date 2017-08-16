const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  Package = require('lerna/lib/Package'),
  NpmUtilities = require('lerna/lib/NpmUtilities'),
  ChildProcessUtilities = require('lerna/lib/ChildProcessUtilities'),
  {join} = require('path'),
  npmlog = require('npmlog'),
  Promise = require('bluebird'),
  detectChanges = require('./detect-changes');

module.exports.packages = loadPackages;

module.exports.rootPackage = loadRootPackage;

module.exports.iter = {
  forEach,
  parallel,
  batched
};

module.exports.exec = {
  command: runCommand,
  script: runScript
};

module.exports.changes = {
  build: detectChanges.markPackageBuilt,
  unbuild: detectChanges.markPackageUnbuilt,
  isBuilt: detectChanges.isPackageBuilt
};

function forEach(lernaPackages, taskFn) {
  const promisifiedTaskFn = Promise.method(taskFn);
  const forEachTracker = npmlog.newItem('forEach', lernaPackages.length);
  return Promise.each(lernaPackages, lernaPackage => {
    return promisifiedTaskFn(lernaPackage, forEachTracker).finally(() => forEachTracker.completeWork(1));
  }).finally(() => forEachTracker.finish());
}

function parallel(lernaPackages, taskFn) {
  const promisifiedTaskFn = Promise.method(taskFn);
  const forEachTracker = npmlog.newGroup('forEach', lernaPackages.length);
  return Promise.map(lernaPackages, (lernaPackage) => {
    const promiseTracker = forEachTracker.newItem(lernaPackage.name);
    promiseTracker.pause();
    return promisifiedTaskFn(lernaPackage, promiseTracker).finally(() => {
      promiseTracker.resume();
      promiseTracker.completeWork(1);
    });
  }).finally(() => forEachTracker.finish());
}

function batched(lernaPackages, taskFn) {
  const promisifiedTaskFn = Promise.method(taskFn);
  const forEachTracker = npmlog.newGroup('forEach', lernaPackages.length);
  const batchedPackages = PackageUtilities.topologicallyBatchPackages(lernaPackages);
  const lernaTaskFn = lernaPackage => done => {
    const promiseTracker = forEachTracker.newItem(lernaPackage.name);
    promiseTracker.pause();
    promisifiedTaskFn(lernaPackage, promiseTracker)
      .finally(() => {
        promiseTracker.resume();
        promiseTracker.completeWork(1);
        done();
      });
  };

  return new Promise((resolve, reject) => {
    PackageUtilities.runParallelBatches(batchedPackages, lernaTaskFn, 4, err => err ? reject(err) : resolve());
  });
}

function loadPackages({log = npmlog} = {log: npmlog}) {
  log.verbose('loadPackages');
  return PackageUtilities.getPackages(new Repository());
}

function loadRootPackage({log = npmlog} = {log: npmlog}) {
  const cwd = process.cwd();
  log.verbose('loadRootPackage', {cwd});
  return new Package(require(join(cwd, './package.json')), cwd);
}

function runCommand(command) {
  return (lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) => {
    log.silly("runCommand", command, {cwd: lernaPackage.location, silent});
    const commandAndArgs = command.split(' ');
    const actualCommand = commandAndArgs.shift();
    const actualCommandArgs = commandAndArgs;
    return new Promise((resolve, reject) => {
      const callback = (err, stdout) => err ? reject(err) : resolve(stdout);
      if (silent) {
        ChildProcessUtilities.exec(actualCommand, [...actualCommandArgs], {cwd: lernaPackage.location}, callback);
      } else {
        ChildProcessUtilities.spawnStreaming(actualCommand, [...actualCommandArgs], {cwd: lernaPackage.location}, lernaPackage.name, callback);
      }
    });
  };
}

function runScript(script) {
  return (lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) => {
    if (lernaPackage.scripts && lernaPackage.scripts[script]) {
      return new Promise((resolve, reject) => {
        const callback = (err, stdout) => err ? reject(err) : resolve(stdout);
        if (silent) {
          NpmUtilities.runScriptInDir(script, [], lernaPackage.location, callback);
        } else {
          NpmUtilities.runScriptInPackageStreaming(script, [], lernaPackage, callback)
        }
      });
    } else {
      log.warn('runNpmScript', 'script not found', {script, cwd: lernaPackage.location});
      return Promise.resolve('');
    }
  };
}