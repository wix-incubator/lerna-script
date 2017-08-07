const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  Package = require('lerna/lib/Package'),
  NpmUtilities = require('lerna/lib/NpmUtilities'),
  ChildProcessUtilities = require('lerna/lib/ChildProcessUtilities'),
  {join} = require('path'),
  npmlog = require('npmlog');

module.exports.packages = loadPackages;
module.exports.rootPackage = loadRootPackage;
module.exports.iter = {forEach, parallel, batched};
module.exports.exec = {command: runCommand, script: runScript};

function forEach(lernaPackages, taskFn) {
  return Promise.resolve().then(() => lernaPackages.forEach(pkg => taskFn(pkg)));
}

function parallel(lernaPackages, taskFn) {
  const packagePromiseFunctions = () => lernaPackages.map(lernaPackage => Promise.resolve().then(() => taskFn(lernaPackage)));
  return Promise.all(packagePromiseFunctions());
}

function batched(lernaPackages, taskFn) {
  const batchedPackages = PackageUtilities.topologicallyBatchPackages(lernaPackages);
  const lernaTaskFn = lernaPackage => done => Promise.resolve()
    .then(() => taskFn(lernaPackage))
    .then(done)
    .catch(done);

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
