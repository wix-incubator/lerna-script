const //Repository = require('lerna/lib/Repository'),
  {getPackages} = require('@lerna/project'),
  batchPackages = require('@lerna/batch-packages'),
  Package = require('@lerna/package'),
  _ = require('lodash'),
  {join} = require('path'),
  npmlog = require('npmlog')

async function loadPackages({log = npmlog, packageConfigs} = {log: npmlog}) {
  //const repo = new Repository()
  const effectivePackageConfigs = packageConfigs// || repo.packageConfigs
  if (packageConfigs) {
    log.verbose('loadPackages', 'using provided packageConfigs', {
      packageConfigs: effectivePackageConfigs
    })
  } else {
    log.verbose('loadPackages', 'using default packageConfigs', {
      packageConfigs: effectivePackageConfigs
    })
  }

  const loadedPackages = await getPackages(process.cwd())

  // const loadedPackages = getPackages({
  //   rootPath: repo.rootPath,
  //   packageConfigs: effectivePackageConfigs
  // })

  const batched = batchPackages(loadedPackages, true)
  return _.flatten(batched)
}

function loadRootPackage({log = npmlog} = {log: npmlog}) {
  const cwd = process.cwd()
  log.verbose('loadRootPackage', {cwd})
  return new Package(require(join(cwd, './package.json')), cwd)
}

module.exports = {
  loadPackages,
  loadRootPackage
}
