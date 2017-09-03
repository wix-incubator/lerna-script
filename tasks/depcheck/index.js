const {loadPackages, iter, fs} = require('lerna-script'),
  depcheck = require('depcheck');

function checkModule(item, depcheckOpts) {
  return () => () => Promise.resolve()
    .then(() => depcheck(item.path, depcheckOpts, val => val))
    .then(({dependencies, devDependencies}) => {
      const unusedDeps = devDependencies.concat(dependencies);
      if (unusedDeps.length > 0) {
        return Promise.reject(new Error(`module ${item.name} has unused dependencies: ${unusedDeps.join(', ')}`));
      } else {
        return Promise.resolve();
      }
    });
}

function depcheckTask(depcheckOpts = {}) {
  return () => function depCheck(log, reporter) {
    return start(reporter)(
      tasks.modules.load(),
      tasks.modules.removeUnchanged('depcheck'),
      tasks.iter.async()((item, input, asyncReporter) => start(asyncReporter)(
        checkModule(item, depcheckOpts),
        tasks.module.markBuilt(item, 'depcheck')
      ))
    )
  }
}

module.exports = depcheckTask;