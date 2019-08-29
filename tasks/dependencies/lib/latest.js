const {exec} = require('child_process'),
  {satisfies, validRange, diff} = require('semver'),
  inquire = require('./inquire'),
  {fs, loadRootPackage} = require('lerna-script'),
  Promise = require('bluebird')

function latestDependenciesTask({onInquire = () => ({}), addRange = '', fetch, silent} = {}) {
  return log => {
    log.info('latest', `checking for latest dependencies`)

    //TODO: hack
    const lernaJson = require(process.cwd() + '/lerna.json')
    lernaJson.location = process.cwd()

    return checkForLatestDependencies(lernaJson, onInquire, addRange, log, fetch, silent)
  }
}

function checkForLatestDependencies(lernaJson, onInquire, addRange, log, fetch, silent) {
  const {
    managedDependencies = {},
    managedPeerDependencies = {},
    autoselect: {versionDiff = [], exclude = []} = {versionDiff: [], exclude: []}
  } = lernaJson

  const depsList = Object.keys(cleanLatest(managedDependencies || {}))
  const peerDepsList = Object.keys(cleanLatest(managedPeerDependencies || {}))

  const tracker = log.newItem('fetching', depsList.length + peerDepsList.length)

  const depsPromises = depsList.map(depName =>
    fetchLatestVersion(depName, managedDependencies[depName], tracker, fetch)
  )
  const peerDepsPromises = peerDepsList.map(depName =>
    fetchLatestVersion(depName, managedPeerDependencies[depName], tracker, fetch)
  )

  return Promise.all([Promise.all(depsPromises), Promise.all(peerDepsPromises)]).then(
    ([deps, peerDeps]) => {
      tracker.finish()
      log.disableProgress()

      const depsChoices = createChoicesList(deps, 'managedDependencies', versionDiff, exclude)
      const peerDepsChoices = createChoicesList(
        peerDeps,
        'managedPeerDependencies',
        versionDiff,
        exclude
      )

      // <<<<<<< HEAD
      //       if (choiceGroups.length > 0) {
      //         onInquire()
      //         return inquire({message: 'Updates found', choiceGroups}).then(async answers => {
      //           if (answers.length > 0) {
      //             answers.forEach(
      //               ({type, name, latestVersion}) =>
      //                 (lernaJson[type][name] = `${addRange}${latestVersion}`)
      //             )
      //             const rootPackage = await loadRootPackage()
      //             return fs.writeFile(rootPackage)('./lerna.json', lernaJson)
      //           } else {
      //             log.info('latest', `nothing selected, exiting...`)
      //           }
      // =======
      if (depsChoices.length + peerDepsChoices.length > 0) {
        let selections
        if (silent) {
          selections = findSelectedUpdates(depsChoices, peerDepsChoices, log)
        } else {
          selections = inquireSelectedUpdates(depsChoices, peerDepsChoices, onInquire)
        }
        return selections.then(selectedUpdates => {
          return writeSelectedUpdates(selectedUpdates, lernaJson, addRange, log)
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

function createChoicesList(peerDeps, depType, versionDiff, exclude) {
  return peerDeps
    .filter(
      ({currentVersion, latestVersion}) => !satisfies(latestVersion, validRange(currentVersion))
    )
    .map(({name, currentVersion, latestVersion}) => {
      return {
        name: `${name}: ${currentVersion} -> ${latestVersion} (${diff(
          currentVersion,
          latestVersion
        )})`,
        value: {type: depType, name, latestVersion},
        short: `\n${name}: ${currentVersion} -> ${latestVersion}`,
        checked:
          versionDiff.includes(diff(currentVersion, latestVersion)) && !exclude.includes(name)
      }
    })
}

function inquireSelectedUpdates(depsChoices, peerDepsChoices, onInquire) {
  const choiceGroups = []

  if (depsChoices.length > 0) {
    choiceGroups.push({name: 'dependencies/devDependencies', choices: depsChoices})
  }
  if (peerDepsChoices.length > 0) {
    choiceGroups.push({name: 'peerDependencies', choices: peerDepsChoices})
  }

  onInquire()
  return inquire({message: 'Updates found', choiceGroups})
}

function findSelectedUpdates(depsChoices, peerDepsChoices, log) {
  let logs = []

  function getSelectedValues(choices) {
    return choices
      .filter(c => c.checked)
      .map(c => {
        logs.push(c.short)
        return c.value
      })
  }

  const selected = getSelectedValues(depsChoices).concat(getSelectedValues(peerDepsChoices))
  log.info('latest', logs.join())
  return Promise.resolve(selected)
}

async function writeSelectedUpdates(selectedUpdates, lernaJson, addRange, log) {
  if (selectedUpdates.length > 0) {
    selectedUpdates.forEach(
      ({type, name, latestVersion}) => (lernaJson[type][name] = `${addRange}${latestVersion}`)
    )
    const rootPackage = await loadRootPackage()
    return fs.writeFile(rootPackage)('./lerna.json', lernaJson)
  } else {
    log.info('latest', `nothing selected, exiting...`)
  }
}

function fetchLatestVersionFromNpm(name) {
  return new Promise((resolve, reject) => {
    exec(`npm info ${name} dist-tags.latest`, (error, stdout) => {
      error ? reject(error) : resolve(stdout.toString().trim('\n'))
    })
  })
}

function fetchLatestVersion(name, version, logItem, onFetch) {
  const f = onFetch || fetchLatestVersionFromNpm
  return f(name, version)
    .then(result => ({name, currentVersion: version, latestVersion: result}))
    .finally(() => logItem.completeWork(1))
}

module.exports.task = latestDependenciesTask
