const {loadPackages, iter} = require('lerna-script'),
  checkDeps = require('depcheck')

function depcheckTask({packages, depcheck} = {}) {
  return async log => {
    const lernaPackages = await (packages || loadPackages())
    log.info('depcheck', `checking dependencies for ${lernaPackages.length} modules`)

    return iter.parallel(lernaPackages, {build: 'depcheck', log})((lernaPackage, log) => {
      return checkModule(lernaPackage, log, depcheck)
    })
  }
}

function checkModule(lernaPackage, log, depcheckOpts = {}) {
  return Promise.resolve()
    .then(() => checkDeps(lernaPackage.location, depcheckOpts, val => val))
    .then(({dependencies, devDependencies}) => {
      const unusedDeps = devDependencies.concat(dependencies)
      if (unusedDeps.length > 0) {
        log.error(
          'depcheck',
          `module ${lernaPackage.name} has unused dependencies: ${unusedDeps.join(', ')}`
        )
        return Promise.reject(new Error(`unused deps found for module ${lernaPackage.name}`))
      } else {
        return Promise.resolve()
      }
    })
}

module.exports = depcheckTask
