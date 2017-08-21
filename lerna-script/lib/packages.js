const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  Package = require('lerna/lib/Package'),
  _ = require('lodash'),
  {join} = require('path'),
  npmlog = require('npmlog');

function loadPackages({log = npmlog, packageConfigs} = {log: npmlog}) {
  const repo = new Repository();
  const effectivePackageConfigs = packageConfigs || repo.packageConfigs;
  if (packageConfigs) {
    log.verbose('loadPackages', 'using provided packageConfigs', {packageConfigs: effectivePackageConfigs});
  } else {
    log.verbose('loadPackages', 'using default packageConfigs', {packageConfigs: effectivePackageConfigs});
  }

  const loadedPackages = PackageUtilities.getPackages({
    rootPath: repo.rootPath,
    packageConfigs: effectivePackageConfigs
  });

  const batched = PackageUtilities.topologicallyBatchPackages(loadedPackages);
  return _.flatten(batched);
}

function loadRootPackage({log = npmlog} = {log: npmlog}) {
  const cwd = process.cwd();
  log.verbose('loadRootPackage', {cwd});
  return new Package(require(join(cwd, './package.json')), cwd);
}

module.exports = {
  loadPackages,
  loadRootPackage
};