const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  async = require('async');

module.exports.packages = loadPackages;
module.exports.iter = {forEach, parallel, batched};
module.exports.exec = {cmd: runCommand, script: runScript};

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
    PackageUtilities.runParallelBatches(batchedPackages, lernaTaskFn, 4, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function runCommand(pkg, command, options) {

}

function runScript(pkg, script, options) {

}

function loadPackages() {
  return PackageUtilities.getPackages(new Repository());
}