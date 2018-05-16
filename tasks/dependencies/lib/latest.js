const {exec} = require('child_process'),
  {satisfies, validRange} = require('semver'),
  inquire = require('./inquire'),
  {fs, loadRootPackage} = require('lerna-script')

function latestDependenciesTask({onInquire} = {onInquire: () => ({})}) {
  return log => {
    log.info('latest', `checking for latest dependencies`)
    return checkForLatestDependencies(require(process.cwd() + '/lerna.json'), onInquire, log)
  }
}

function checkForLatestDependencies(lernaJson, onInquire, log) {
  const {managedDependencies = {}, managedPeerDependencies = {}} = lernaJson

  const depsPromises = Object.keys(cleanLatest(managedDependencies || {})).map(depName =>
    fetchLatestVersion(depName, managedDependencies[depName])
  )
  const peerDepsPromises = Object.keys(cleanLatest(managedPeerDependencies || {})).map(depName =>
    fetchLatestVersion(depName, managedPeerDependencies[depName])
  )

  return Promise.all([Promise.all(depsPromises), Promise.all(peerDepsPromises)]).then(
    ([deps, peerDeps]) => {
      const depsChoices = deps
        .filter(
          ({currentVersion, latestVersion}) => !satisfies(latestVersion, validRange(currentVersion))
        )
        .map(({name, currentVersion, latestVersion}) => {
          return {
            name: `${name}: ${currentVersion} -> ${latestVersion}`,
            value: {type: 'managedDependencies', name, latestVersion}
          }
        })

      const peerDepsChoices = peerDeps
        .filter(
          ({currentVersion, latestVersion}) => !satisfies(latestVersion, validRange(currentVersion))
        )
        .map(({name, currentVersion, latestVersion}) => {
          return {
            name: `${name}: ${currentVersion} -> ${latestVersion}`,
            value: {type: 'managedPeerDependencies', name, latestVersion}
          }
        })

      const choiceGroups = []

      if (depsChoices.length > 0) {
        choiceGroups.push({name: 'dependencies/devDependencies', choices: depsChoices})
      }
      if (peerDepsChoices.length > 0) {
        choiceGroups.push({name: 'peerDependencies', choices: peerDepsChoices})
      }

      if (choiceGroups.length > 0) {
        onInquire()
        return inquire({message: 'Updates found', choiceGroups}).then(answers => {
          if (answers.length > 0) {
            answers.forEach(
              ({type, name, latestVersion}) => (lernaJson[type][name] = latestVersion)
            )
            return fs.writeFile(loadRootPackage())('./lerna.json', lernaJson)
          } else {
            log.info('latest', `nothing selected, exiting...`)
          }
        })
      } else {
        log.info('latest', `no updates found, exiting...`)
      }
    }
  )
}

function cleanLatest(deps) {
  Object.keys(deps).forEach(depName => deps[depName] === 'latest' && delete deps[depName])
  return deps
}

function fetchLatestVersion(name, version) {
  return new Promise((resolve, reject) => {
    exec(`npm info ${name} dist-tags.latest`, (error, stdout) => {
      error
        ? reject(error)
        : resolve({name, currentVersion: version, latestVersion: stdout.toString().trim('\n')})
    })
  })
}

module.exports.task = latestDependenciesTask
