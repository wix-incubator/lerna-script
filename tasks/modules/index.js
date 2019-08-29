const {loadPackages, iter, fs} = require('lerna-script'),
  _ = require('lodash'),
  deepKeys = require('deep-keys')

function syncModulesTask({packages, transformDependencies, transformPeerDependencies} = {}) {
  return async log => {
    const {loadedPackages, transformDeps, transformPeerDeps} = await providedOrDefaults({
      packages,
      transformDependencies,
      transformPeerDependencies
    })

    log.info('modules', `syncing module versions for ${loadedPackages.length} packages`)
    const modulesAndVersions = toModulesAndVersion(loadedPackages, transformDeps)
    const modulesAndPeerVersions = toModulesAndVersion(loadedPackages, transformPeerDeps)
    return iter.parallel(loadedPackages, {log})((lernaPackage, log) => {
      const logMerged = input =>
        log.info(
          'modules',
          `${lernaPackage.name}: ${input.key} (${input.currentValue} -> ${input.newValue})`
        )
      return fs
        .readFile(lernaPackage)('package.json', JSON.parse)
        .then(packageJson =>
          merge(
            packageJson,
            {
              dependencies: modulesAndVersions,
              devDependencies: modulesAndVersions,
              peerDependencies: modulesAndPeerVersions
            },
            logMerged
          )
        )
        .then(packageJson => fs.writeFile(lernaPackage)('package.json', packageJson))
    })
  }
}

async function providedOrDefaults({
  packages,
  transformDependencies,
  transformPeerDependencies
} = {}) {
  return {
    loadedPackages: await (packages || loadPackages()),
    transformDeps: transformDependencies || (version => `~${version}`),
    transformPeerDeps: transformPeerDependencies || (version => `>=${version}`)
  }
}

function toModulesAndVersion(modules, mutateVersion) {
  return modules.reduce((acc, val) => {
    acc[val.name] = mutateVersion(val.version)
    return acc
  }, {})
}

function merge(dest, source, onMerged = _.noop) {
  const destKeys = deepKeys(dest)
  const sourceKeys = deepKeys(source)
  const sharedKeys = _.intersection(destKeys, sourceKeys)

  sharedKeys.forEach(key => {
    const currentValue = _.get(dest, key)
    const newValue = _.get(source, key)
    if (currentValue !== newValue) {
      _.set(dest, key, newValue)
      onMerged({key, currentValue, newValue})
    }
  })

  return dest
}

module.exports = syncModulesTask
