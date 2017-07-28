const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  Package = require('lerna/lib/Package'),
  execThen = require('exec-then'),
  {join} = require('path');

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
    PackageUtilities.runParallelBatches(batchedPackages, lernaTaskFn, 4, err => err ? reject(err): resolve());
  });
}

function runCommand(lernaPackage) {
  return command => execThen(command, {cwd: lernaPackage.location}).then((res = {}) => {
      if (res.err) {
        return Promise.reject(new Error(`message: '${res.err.message}'\n stdout: ${res.stdout}\n, stderr: ${res.stderr}\n`));
      } else {
        return res.stdout;
      }
    });
}

function runScript(pkg, script, options) {

}

function loadPackages() {
  return PackageUtilities.getPackages(new Repository());
}

function loadRootPackage() {
  return new Package(require(join(process.cwd(), './package.json')), process.cwd());
}