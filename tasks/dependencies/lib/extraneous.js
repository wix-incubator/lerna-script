const {iter, fs, loadPackages} = require('lerna-script'),
  R = require('ramda');

//TODO: logging for task
function extraneousDependenciesTask({packages} = {}) {
  return log => {
    const lernaPackages = packages || loadPackages();
    log.info('extraneous', `checking for extraneous dependencies for ${lernaPackages.length} modules`);
    const deps = {dependencies: {}, peerDependencies: {}};
    const {managedDependencies = {}, managedPeerDependencies = {}} = require(process.cwd() + '/lerna.json');
    const readJson = lernaPackage => fs.readFile(lernaPackage)('package.json', JSON.parse);

    return iter.parallel(lernaPackages, {log})(readJson)
      .then(packageJsons => {
        packageJsons.forEach(packageJson => fillModulesAndDeps(deps, packageJson));
        executeExtraneous(managedDependencies, managedPeerDependencies, deps, log);
      });
  }
}

function executeExtraneous(managedDependencies, managedPeerDependencies, deps, log) {
  cleanManagedDeps(deps, managedDependencies, managedPeerDependencies);
  logExtraneous({managedDependencies}, log, 'managedDependencies');
  logExtraneous({managedPeerDependencies}, log, 'managedPeerDependencies');
}

function logExtraneous(deps, log, dependencyType) {
  const managedDependencies = deps[dependencyType];
  const toSortedUniqKeys = R.compose(R.sort((a, b) => a.localeCompare(b)), R.uniq, R.keys);
  const modules = toSortedUniqKeys(managedDependencies);
  if (modules.length > 0) {
    log.error('extraneous', `${dependencyType}: ${modules.join(', ')}`);
  }
}

function cleanManagedDeps(deps, managedDependencies, managedPeerDependencies) {
  Object.keys(deps.dependencies || {}).forEach(name => delete managedDependencies[name]);
  Object.keys(deps.devDependencies || {}).forEach(name => delete managedDependencies[name]);
  Object.keys(deps.peerDependencies || {}).forEach(name => delete managedPeerDependencies[name]);
}

function fillModulesAndDeps(deps, packageJson) {
  Object.assign(deps.dependencies, packageJson.dependencies);
  Object.assign(deps.dependencies, packageJson.devDependencies);
  Object.assign(deps.peerDependencies, packageJson.peerDependencies);
}

module.exports.task = extraneousDependenciesTask;
module.exports.logExtraneous = logExtraneous;