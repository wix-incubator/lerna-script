const {loadPackages, iter} = require('lerna-script')
const checkDeps = require('depcheck')
const colors = require('colors')

function depcheckTask({packages, depcheck} = {}) {
  return async log => {
    const lernaPackages = await (packages || loadPackages())
    log.info('depcheck', `checking dependencies for ${lernaPackages.length} modules`)

    return iter.parallel(lernaPackages, {build: 'depcheck'})(lernaPackage => {
      return checkModule(lernaPackage, depcheck)
    })
  }
}

function checkModule(lernaPackage, depcheckOpts = {}) {
  return Promise.resolve()
    .then(() => checkDeps(lernaPackage.location, depcheckOpts, val => val))
    .then(({dependencies, devDependencies}) => {
      const hasUnusedDeps = devDependencies.concat(dependencies).length > 0
      if (hasUnusedDeps) {
        console.log(`\nunused deps found for module ${colors.brightCyan.bold(lernaPackage.name)}`)
        if (dependencies.length > 0) {
          console.log({dependencies})
        }
        if (devDependencies.length > 0) {
          console.log({devDependencies})
        }
        return Promise.reject(new Error(`unused deps found for module ${lernaPackage.name}`))
      }
      return Promise.resolve()
    })
}

module.exports = depcheckTask
