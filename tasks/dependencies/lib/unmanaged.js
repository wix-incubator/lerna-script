const {iter, fs, loadPackages} = require('lerna-script'),
  R = require('ramda');

function unmanagedDependenciesTask() {
  return log => {
    const lernaPackages = loadPackages();
    const deps = {dependencies: {}, peerDependencies: {}};
    const {managedDependencies, managedPeerDependencies} = require(process.cwd() + '/package.json');
    const innerModules = lernaPackages.map(p => p.name);
    const readJson = lernaPackage => fs.readFile(lernaPackage)('package.json', JSON.parse);

    return iter.parallel(lernaPackages, {log})(readJson)
      .then(packageJsons => {
        packageJsons.forEach(packageJson => fillModulesAndDeps(deps, packageJson));
        executeUnmanaged(managedDependencies, managedPeerDependencies, deps, innerModules, log);
      });
  };
}

function executeUnmanaged(managedDependencies, managedPeerDependencies, deps, innerModules, log) {
  cleanProjectDeps(innerModules, deps);
  cleanManagedDeps(deps, managedDependencies, managedPeerDependencies);
  logUnmanaged(deps, log);
}

function logUnmanaged(deps, log) {
  const toSortedUniqKeys = R.compose(R.sort(R.ascend), R.uniq, R.values);
  Object.keys(deps.dependencies).forEach(depKey => {
    const modulesAndVersions = toSortedUniqKeys(deps.dependencies[depKey]);
    log.error(`Unmanaged dependency ${depKey} (${modulesAndVersions.join(', ')})`);
  });

  Object.keys(deps.peerDependencies).forEach(depKey => {
    const modulesAndVersions = toSortedUniqKeys(deps.peerDependencies[depKey]);
    log.error(`Unmanaged peerDependency ${depKey} (${modulesAndVersions.join(', ')})`);
  });
}

function cleanProjectDeps(innerModules, deps) {
  innerModules.forEach(name => delete deps.dependencies[name]);
  innerModules.forEach(name => delete deps.peerDependencies[name]);
}

function cleanManagedDeps(deps, managedDependencies, managedPeerDependencies) {
  Object.keys(managedDependencies).forEach(name => delete deps.dependencies[name]);
  Object.keys(managedPeerDependencies).forEach(name => delete deps.peerDependencies[name]);
}

function fillModulesAndDeps(deps, packageJson) {
  fill(deps.dependencies)(packageJson, 'dependencies');
  fill(deps.dependencies)(packageJson, 'devDependencies');
  fill(deps.peerDependencies)(packageJson, 'peerDependencies');
}

function fill(deps) {
  return (packageJson, type) => {
    Object.keys(packageJson[type] || []).forEach(depKey => {
      deps[depKey] = deps[depKey] || {};
      deps[depKey][packageJson.name] = packageJson[type][depKey];
    });
  }
}

module.exports.task = unmanagedDependenciesTask;