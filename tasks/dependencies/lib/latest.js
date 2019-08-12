const {exec} = require('child_process'),
  {satisfies, validRange, diff} = require('semver'),
  inquire = require('./inquire'),
  {fs, loadRootPackage} = require('lerna-script')

function latestDependenciesTask({onInquire = () => ({}), addRange = ''} = {}) {
  return log => {
    log.info('latest', `checking for latest dependencies`)
    return checkForLatestDependencies(
      require(process.cwd() + '/lerna.json'),
      onInquire,
      addRange,
      log
    )
  }
}

function checkForLatestDependencies(lernaJson, onInquire, addRange, log) {
  const {
    managedDependencies = {},
    managedPeerDependencies = {},
    autoselect: {versionDiff, exclude} = {versionDiff: [], exclude: []}
  } = lernaJson

  const depsList = Object.keys(cleanLatest(managedDependencies || {}))
  const peerDepsList = Object.keys(cleanLatest(managedPeerDependencies || {}))

  const tracker = log.newItem('fetching', depsList.length + peerDepsList.length)

  const depsPromises = depsList.map(depName =>
    fetchLatestVersion(depName, managedDependencies[depName], tracker)
  )
  const peerDepsPromises = peerDepsList.map(depName =>
    fetchLatestVersion(depName, managedPeerDependencies[depName], tracker)
  )

  return Promise.all([Promise.all(depsPromises), Promise.all(peerDepsPromises)]).then(
    ([deps, peerDeps]) => {
      tracker.finish()
      log.disableProgress()
      const depsChoices = deps
        .filter(
          ({currentVersion, latestVersion}) => !satisfies(latestVersion, validRange(currentVersion))
        )
        .map(({name, currentVersion, latestVersion}) => {
          return {
            name: `${name}: ${currentVersion} -> ${latestVersion} (${diff(
              currentVersion,
              latestVersion
            )})`,
            value: {type: 'managedDependencies', name, latestVersion},
            checked:
              versionDiff.includes(diff(currentVersion, latestVersion)) && !exclude.includes(name)
          }
        })

      const peerDepsChoices = peerDeps
        .filter(
          ({currentVersion, latestVersion}) => !satisfies(latestVersion, validRange(currentVersion))
        )
        .map(({name, currentVersion, latestVersion}) => {
          return {
            name: `${name}: ${currentVersion} -> ${latestVersion} (${diff(
              currentVersion,
              latestVersion
            )})`,
            value: {type: 'managedPeerDependencies', name, latestVersion},
            checked:
              versionDiff.includes(diff(currentVersion, latestVersion)) && !exclude.includes(name)
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
              ({type, name, latestVersion}) =>
                (lernaJson[type][name] = `${addRange}${latestVersion}`)
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

function fetchLatestVersion(name, version, logItem) {
  return new Promise((resolve, reject) => {
    exec(`npm info ${name} dist-tags.latest`, (error, stdout) => {
      logItem.completeWork(1)
      error
        ? reject(error)
        : resolve({name, currentVersion: version, latestVersion: stdout.toString().trim('\n')})
    })
  })
}

module.exports.task = latestDependenciesTask
