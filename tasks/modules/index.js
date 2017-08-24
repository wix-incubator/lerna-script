const {loadPackages, iter, fs} = require('lerna-script'),
  _ = require('lodash');

function syncModulesTask(mutateVersion = version => `~${version}`) {
  return log => {
    const lernaPackages = loadPackages();
    const modulesAndVersions = toModulesAndVersion(lernaPackages, mutateVersion);
    return iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
      const {modulesAndVersions} = input;
      return fs.readJson(lernaPackage)('package.json')
        .then(packageJson => merge(packageJson, {dependencies: modulesAndVersions, devDependencies: modulesAndVersions}))
        .then(packageJson => fs.writeJson(lernaPackage)('package.json', packageJson));
    });
  }
}

function toModulesAndVersion(modules, mutateVersion) {
  return modules.reduce((acc, val) => {
    acc[val.name] = mutateVersion(val.version);
    return acc;
  }, {})
}

function merge(dest, source, onMerged = _.noop) {
  const destKeys = deepKeys(dest);
  const sourceKeys = deepKeys(source);
  const sharedKeys = _.intersection(destKeys, sourceKeys);

  sharedKeys.forEach(key => {
    const currentValue = _.get(dest, key);
    const newValue = _.get(source, key);
    if (currentValue !== newValue) {
      _.set(dest, key, newValue);
      onMerged({key, currentValue, newValue});
    }
  });

  return dest;
}


module.exports = syncModulesTask;
