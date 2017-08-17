const PackageUtilities = require('lerna/lib/PackageUtilities'),
  ChildProcessUtilities = require('lerna/lib/ChildProcessUtilities'),
  npmlog = require('npmlog'),
  Promise = require('bluebird');


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

module.exports = {
  forEach,
  parallel,
  batched
};