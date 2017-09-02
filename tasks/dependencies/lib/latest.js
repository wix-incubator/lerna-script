const {exec} = require('child_process'),
  {satisfies, validRange} = require('semver');

function latestDependenciesTask() {
  return log => {
    const {managedDependencies, managedPeerDependencies} = require(process.cwd() + '/lerna.json');
    return checkForLatestDependencies(managedDependencies, managedPeerDependencies, log);
  }
}

function checkForLatestDependencies(managedDependencies, managedPeerDependencies, log) {
  const depsPromises = Object.keys(cleanLatest(managedDependencies || {})).map(depName => fetchLatestVersion(depName, managedDependencies[depName]));
  const peerDepsPromises = Object.keys(cleanLatest(managedPeerDependencies || {})).map(depName => fetchLatestVersion(depName, managedPeerDependencies[depName]));

  return Promise.all([Promise.all(depsPromises), Promise.all(peerDepsPromises)]).then(([deps, peerDeps]) => {
    deps.forEach(({name, currentVersion, latestVersion}) => {
      if (!satisfies(latestVersion, validRange(currentVersion))) {
        log.info(`Update found for dependency ${name}: ${currentVersion} -> ${latestVersion}`);
      }
    });

    peerDeps.forEach(({name, currentVersion, latestVersion}) => {
      if (!satisfies(latestVersion, validRange(currentVersion))) {
        log.info(`Update found for peerDependency ${name}: ${currentVersion} -> ${latestVersion}`);
      }
    });
  });
}

function cleanLatest(deps) {
  Object.keys(deps).forEach(depName => deps[depName] === 'latest' && delete deps[depName]);
  return deps;
}

function fetchLatestVersion(name, version) {
  return new Promise((resolve, reject) => {
    exec(`npm info ${name} dist-tags.latest`, (error, stdout) => {
      error ? reject(error) : resolve({name, currentVersion: version, latestVersion: stdout.toString().trim('\n')})
    });
  });
}

module.exports.task = latestDependenciesTask;