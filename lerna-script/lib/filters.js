const _ = require('lodash'),
  detectChanges = require('./detect-changes'),
  collectUpdates = require('@lerna/collect-updates'),
  PackageGraph = require('@lerna/package-graph'),
  batchPackages = require('@lerna/batch-packages'),
  filterPackages = require('@lerna/filter-packages'),
  npmlog = require('npmlog')

function includeFilteredDeps(allLernaPackages, {log = npmlog} = {log: npmlog}) {
  return filteredLernaPackages => {
    const packageGraph = new PackageGraph(allLernaPackages)
    const withFiltered = packageGraph.addDependencies(filteredLernaPackages)

    const batched = batchPackages(withFiltered)

    return _.flatten(batched)
  }
}

function removeByGlob(lernaPackages, {log = npmlog} = {log: npmlog}) {
  return glob => {
    const filteredPackages = filterPackages(lernaPackages, [], glob)
    const removedPackageNames = diffPackages(lernaPackages, filteredPackages)
    log.verbose('removeByGlob', `removed ${removedPackageNames.length} packages`, {
      glob,
      removed: removedPackageNames
    })
    return filteredPackages
  }
}

//TODO: see how to make it less sucky
function removeGitSince(lernaPackages, {log = npmlog} = {log: npmlog}) {
  return refspec => {
    const packageGraph = new PackageGraph(lernaPackages)
    const collectedPackages = collectUpdates(
      lernaPackages,
      packageGraph,
      {cwd: process.cwd()},
      {since: refspec}
    ).map(graphNode => graphNode.pkg)

    const removedPackageNames = diffPackages(lernaPackages, collectedPackages)
    log.verbose('removeGitSince', `removed ${removedPackageNames.length} packages`, {
      refspec,
      removed: removedPackageNames
    })
    return collectedPackages
  }
}

function removeBuilt(lernaPackages, {log = npmlog} = {log: npmlog}) {
  return label => {
    const changedPackages = lernaPackages.filter(
      lernaPackage => !detectChanges.isPackageBuilt(lernaPackage)(label)
    )
    log.verbose('removeBuilt', `found ${changedPackages.length} packages with changes`)
    const unbuiltPackages = figureOutAllPackagesThatNeedToBeBuilt(lernaPackages, changedPackages)
    unbuiltPackages.forEach(p => detectChanges.markPackageUnbuilt(p)(label))

    const removedPackageNames = diffPackages(lernaPackages, unbuiltPackages)
    log.verbose('removeBuilt', `removed ${removedPackageNames.length} packages`, {
      label,
      removed: removedPackageNames
    })

    return unbuiltPackages
  }
}

function figureOutAllPackagesThatNeedToBeBuilt(allPackages, changedPackages) {
  const transitiveClosureOfPackagesToBuild = new Set(changedPackages.map(el => el.name))
  let dependencyEdges = createDependencyEdgesFromPackages(allPackages)

  let dependencyEdgesLengthBeforeFiltering = dependencyEdges.length
  do {
    dependencyEdgesLengthBeforeFiltering = dependencyEdges.length

    const newDependencyEdges = []

    for (let edge of dependencyEdges) {
      if (transitiveClosureOfPackagesToBuild.has(edge[1])) {
        transitiveClosureOfPackagesToBuild.add(edge[0])
      } else {
        newDependencyEdges.push(edge)
      }
    }
    dependencyEdges = newDependencyEdges
  } while (dependencyEdgesLengthBeforeFiltering !== dependencyEdges.length)

  return allPackages.filter(p => transitiveClosureOfPackagesToBuild.has(p.name))
}

function createDependencyEdgesFromPackages(packages) {
  const setOfAllPackageNames = new Set(packages.map(p => p.name))
  const packagesByNpmName = _.keyBy(packages, 'name')

  const dependencyEdges = []
  packages.forEach(lernaPackage => {
    Object.keys({...lernaPackage.dependencies, ...lernaPackage.devDependencies}).forEach(name => {
      if (setOfAllPackageNames.has(name)) {
        dependencyEdges.push([lernaPackage.name, packagesByNpmName[name].name])
      }
    })
  })

  return dependencyEdges
}

function diffPackages(before, after) {
  return _.difference(
    before.map(p => p.name),
    after.map(p => p.name)
  )
}

module.exports = {
  removeBuilt,
  removeGitSince,
  includeFilteredDeps,
  removeByGlob
}
