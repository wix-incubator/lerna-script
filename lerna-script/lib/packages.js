const {getPackages} = require('@lerna/project'),
  batchPackages = require('@lerna/batch-packages'),
  Package = require('@lerna/package'),
  _ = require('lodash'),
  {join} = require('path'),
  npmlog = require('npmlog')

async function loadPackages({log = npmlog} = {log: npmlog}) {
  log.verbose('loadPackages', 'using default packageConfigs')

  const loadedPackages = await getPackages(process.cwd())
  const batched = batchPackages(loadedPackages, true)
  return _.flatten(batched)
}

async function loadRootPackage({log = npmlog} = {log: npmlog}) {
  const cwd = process.cwd()
  log.verbose('loadRootPackage', {cwd})
  return new Package(require(join(cwd, './package.json')), cwd)
}

module.exports = {
  loadPackages,
  loadRootPackage
}
