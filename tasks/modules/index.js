const {loadPackages, iter, fs} = require('lerna-script'),
  _ = require('lodash'),
  deepKeys = require('deep-keys');

function syncModulesTask(mutateVersion = version => `~${version}`) {
  return log => {
    const lernaPackages = loadPackages();
    const modulesAndVersions = toModulesAndVersion(lernaPackages, mutateVersion);
    return iter.forEach(lernaPackages, {log})((lernaPackage, log) => {
      return fs.readFile(lernaPackage)('package.json', JSON.parse)
        .then(packageJson => merge(packageJson, {
          dependencies: modulesAndVersions,
          devDependencies: modulesAndVersions
        }))
        .then(packageJson => fs.writeFile(lernaPackage)('package.json', packageJson));
    });
  }
}

function toModulesAndVersion(modules, mutateVersion) {
  return modules.reduce((acc, val) => {
    acc[val.name] = mutateVersion(val.version);
    return acc;
  }, {});
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
