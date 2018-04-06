const iterators = require('./lib/iterators'),
  packages = require('./lib/packages'),
  detectChanges = require('./lib/detect-changes'),
  filters = require('./lib/filters'),
  exec = require('./lib/exec'),
  fs = require('./lib/fs')

module.exports.loadPackages = packages.loadPackages
module.exports.loadRootPackage = packages.loadRootPackage

module.exports.iter = {
  forEach: iterators.forEach,
  parallel: iterators.parallel,
  batched: iterators.batched
}

module.exports.changes = {
  build: detectChanges.markPackageBuilt,
  unbuild: detectChanges.markPackageUnbuilt,
  isBuilt: detectChanges.isPackageBuilt
}

module.exports.filters = {
  removeBuilt: filters.removeBuilt,
  gitSince: filters.removeGitSince,
  removeByGlob: filters.removeByGlob,
  includeFilteredDeps: filters.includeFilteredDeps
}

module.exports.exec = {
  command: exec.runCommand,
  script: exec.runScript
}

module.exports.fs = {
  readFile: fs.readFile,
  writeFile: fs.writeFile
}
