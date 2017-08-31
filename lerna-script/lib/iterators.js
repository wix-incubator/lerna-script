const PackageUtilities = require('lerna/lib/PackageUtilities'),
  npmlog = require('npmlog'),
  Promise = require('bluebird'),
  {markPackageBuilt} = require('./detect-changes');

function forEach(lernaPackages, {log = npmlog, build} = {log: npmlog}) {
  return taskFn => {
    const promisifiedTaskFn = Promise.method(taskFn);
    const forEachTracker = log.newItem('forEach', lernaPackages.length);
    npmlog.enableProgress();

    return Promise.each(lernaPackages, lernaPackage => {
      return promisifiedTaskFn(lernaPackage, forEachTracker)
        .then(() => {
          return build && markPackageBuilt(lernaPackage, {log: forEachTracker})(build)
        })
        .finally(() => {
          forEachTracker.completeWork(1)
        });
    }).finally(() => {
      forEachTracker.finish()
    });
  };
}

function parallel(lernaPackages, {log = npmlog, build} = {log: npmlog}) {
  return taskFn => {
    const promisifiedTaskFn = Promise.method(taskFn);
    const forEachTracker = log.newGroup('parallel', lernaPackages.length);
    npmlog.enableProgress();

    return Promise.map(lernaPackages, lernaPackage => {
      const promiseTracker = forEachTracker.newItem(lernaPackage.name);
      promiseTracker.pause();
      return promisifiedTaskFn(lernaPackage, promiseTracker)
        .then(() => build && markPackageBuilt(lernaPackage, {log: forEachTracker})(build))
        .finally(() => {
          promiseTracker.resume();
          promiseTracker.completeWork(1);
        });
    }).finally(() => forEachTracker.finish());
  };
}

function batched(lernaPackages, {log = npmlog, build} = {log: npmlog}) {
  return taskFn => {
    const promisifiedTaskFn = Promise.method(taskFn);
    const forEachTracker = log.newGroup('batched', lernaPackages.length);
    npmlog.enableProgress();

    const batchedPackages = PackageUtilities.topologicallyBatchPackages(lernaPackages);
    const lernaTaskFn = lernaPackage => done => {
      const promiseTracker = forEachTracker.newItem(lernaPackage.name);
      promiseTracker.pause();
      promisifiedTaskFn(lernaPackage, promiseTracker)
        .then(() => build && markPackageBuilt(lernaPackage, {log: forEachTracker})(build))
        .then(done)
        .catch(done)
        .finally(() => {
          promiseTracker.resume();
          promiseTracker.completeWork(1);
        })
    };

    return new Promise((resolve, reject) => {
      PackageUtilities.runParallelBatches(batchedPackages, lernaTaskFn, 4, err => err ? reject(err) : resolve());
    });
  };
}

module.exports = {
  forEach,
  parallel,
  batched
};