const PackageUtilities = require('lerna/lib/PackageUtilities'),
  npmlog = require('npmlog'),
  Promise = require('bluebird'),
  {markPackageBuilt} = require('./detect-changes'),
  {removeBuilt} = require('./filters')

function forEach(lernaPackages, {log = npmlog, build} = {log: npmlog}) {
  return taskFn => {
    const filteredLernaPackages = filterBuilt(lernaPackages, log, build)
    const promisifiedTaskFn = Promise.method(taskFn)
    const forEachTracker = log.newItem('forEach', lernaPackages.length)
    npmlog.enableProgress()

    return Promise.each(filteredLernaPackages, lernaPackage => {
      return promisifiedTaskFn(lernaPackage, forEachTracker)
        .then(res => {
          build && markPackageBuilt(lernaPackage, {log: forEachTracker})(build)
          return res
        })
        .finally(() => forEachTracker.completeWork(1))
    }).finally(() => forEachTracker.finish())
  }
}

function parallel(lernaPackages, {log = npmlog, build} = {log: npmlog}) {
  return taskFn => {
    const filteredLernaPackages = filterBuilt(lernaPackages, log, build)
    const promisifiedTaskFn = Promise.method(taskFn)
    const forEachTracker = log.newGroup('parallel', lernaPackages.length)
    npmlog.enableProgress()

    return Promise.map(filteredLernaPackages, lernaPackage => {
      const promiseTracker = forEachTracker.newItem(lernaPackage.name)
      promiseTracker.pause()
      return promisifiedTaskFn(lernaPackage, promiseTracker)
        .then(res => {
          build && markPackageBuilt(lernaPackage, {log: forEachTracker})(build)
          return res
        })
        .finally(() => {
          promiseTracker.resume()
          promiseTracker.completeWork(1)
        })
    }).finally(() => forEachTracker.finish())
  }
}

function batched(lernaPackages, {log = npmlog, build} = {log: npmlog}) {
  return taskFn => {
    const filteredLernaPackages = filterBuilt(lernaPackages, log, build)
    const promisifiedTaskFn = Promise.method(taskFn)
    const forEachTracker = log.newGroup('batched', lernaPackages.length)
    npmlog.enableProgress()

    const batchedPackages = PackageUtilities.topologicallyBatchPackages(filteredLernaPackages)
    const lernaTaskFn = lernaPackage => done => {
      const promiseTracker = forEachTracker.newItem(lernaPackage.name)
      promiseTracker.pause()
      promisifiedTaskFn(lernaPackage, promiseTracker)
        .then(() => build && markPackageBuilt(lernaPackage, {log: forEachTracker})(build))
        .then(done)
        .catch(done)
        .finally(() => {
          promiseTracker.resume()
          promiseTracker.completeWork(1)
        })
    }

    return new Promise((resolve, reject) => {
      PackageUtilities.runParallelBatches(
        batchedPackages,
        lernaTaskFn,
        4,
        err => (err ? reject(err) : resolve())
      )
    })
  }
}

function filterBuilt(lernaPackages, log, label) {
  if (label) {
    const filteredLernaPackages = removeBuilt(lernaPackages, {log})(label)
    if (filteredLernaPackages.length !== lernaPackages.length) {
      log.info(
        'filter',
        `filtered-out ${lernaPackages.length - filteredLernaPackages.length} of ${
          lernaPackages.length
        } built packages`
      )
    }
    return filteredLernaPackages
  } else {
    return lernaPackages
  }
}

module.exports = {
  forEach,
  parallel,
  batched
}
