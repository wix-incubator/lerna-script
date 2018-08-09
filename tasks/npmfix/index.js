const {loadPackages, iter, fs} = require('lerna-script'),
  gitRemoteUrl = require('git-remote-url'),
  gitInfo = require('hosted-git-info'),
  {relative} = require('path')

function sortByKey(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => ({...acc, [key]: obj[key]}), {})
}

function sortDependencies(deps) {
  if (deps) {
    return sortByKey(deps)
  }
}

function npmfix({packages} = {}) {
  return log => {
    const lernaPackages = packages || loadPackages()
    log.info('npmfix', `fixing homepage, repo urls for ${lernaPackages.length} packages`)

    return gitRemoteUrl('.', 'origin').then(gitRemoteUrl => {
      const repoUrl = gitInfo.fromUrl(gitRemoteUrl).browse()

      return iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
        const moduleGitUrl =
          repoUrl + '/tree/master/' + relative(process.cwd(), lernaPackage.location)

        return fs
          .readFile(lernaPackage, {log})('package.json', JSON.parse)
          .then(packageJson => {
            const updated = Object.assign({}, packageJson, {
              homepage: moduleGitUrl,
              dependencies: sortDependencies(packageJson.dependencies),
              devDependencies: sortDependencies(packageJson.devDependencies),
              peerDependencies: sortDependencies(packageJson.peerDependencies),
              repository: {
                type: 'git',
                url: moduleGitUrl
              }
            })
            return fs.writeFile(lernaPackage, {log})('package.json', updated)
          })
      })
    })
  }
}

module.exports = npmfix
