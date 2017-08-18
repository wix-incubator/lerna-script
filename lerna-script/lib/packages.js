const Repository = require('lerna/lib/Repository'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  Package = require('lerna/lib/Package'),
  {join} = require('path'),
  npmlog = require('npmlog');

function loadPackages({log = npmlog, packages} = {log: npmlog}) {
  log.verbose('loadPackages');
  const repo = new Repository();
  return PackageUtilities.getPackages({
    rootPath: repo.rootPath,
    packageConfigs: packages || repo.packageConfigs
  });
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