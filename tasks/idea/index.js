const {join, relative} = require('path'),
  templates = require('./lib/templates'),
  shelljs = require('shelljs'),
  {loadRootPackage, loadPackages, exec, iter} = require('lerna-script'),
  {execSync} = require('child_process')

const EXCLUDE_FOLDERS = ['node_modules', 'dist']
const LANGIAGE_LEVEL = 'ES6'

const SUPPORTED_SOURCE_LEVELS = [
  {name: 'test', isTestSource: true},
  {name: 'tests', isTestSource: true},
  {name: 'src', isTestSource: false},
  {name: 'lib', isTestSource: false},
  {name: 'scripts', isTestSource: false}
]

const DEFAULT_MOCHA_CONFIGURATIONS = packageJson => {
  return [
    {
      name: packageJson.name,
      environmentVariables: {
        DEBUG: 'wix:*'
      },
      extraOptions: '--exit',
      testKind: 'PATTERN',
      testPattern: 'test/**/*.spec.js test/**/*.it.js test/**/*.e2e.js'
    }
  ]
}

//TODO: add options: {packages, mocha: {patterns: ''}}
function generateIdeaProject({packages, mochaConfigurations} = {}) {
  const mochaConfigurationsFn = mochaConfigurations || DEFAULT_MOCHA_CONFIGURATIONS
  return log => {
    const rootPackage = loadRootPackage()
    const lernaPackages = packages || loadPackages()
    const execInRoot = cmd => {
      log.verbose('idea', `executing command: ${cmd}`)
      return exec.command(rootPackage)(cmd)
    }

    log.info('idea', `Generating idea projects for ${lernaPackages.length} packages`)
    log.info('idea', `cleaning existing project files...`)
    return execInRoot('rm -rf .idea')
      .then(() => execInRoot('rm -f *.iml'))
      .then(() => execInRoot('mkdir .idea'))
      .then(() => log.info('idea', 'writing project files'))
      .then(() =>
        execInRoot(
          `cp ${join(__dirname, '/files/vcs.xml')} ${join(rootPackage.location, '.idea/')}`
        )
      )
      .then(() => {
        createWorkspaceXml(lernaPackages, rootPackage, mochaConfigurationsFn, log)
        createModulesXml(lernaPackages, rootPackage, log)

        log.info('idea', 'writing module files')
        return iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
          return exec
            .command(lernaPackage)('rm -f *.iml')
            .then(() => createModuleIml(lernaPackage, log))
        })
      })
  }
}

function createWorkspaceXml(lernaPackages, rootPackage, mochaConfigurations, log) {
  log.verbose('idea', 'creating .idea/workspace.xml')
  const nodePath = execSync('which node')
    .toString()
    .replace('\n', '')
  const mochaPackage = join(
    relative(rootPackage.location, lernaPackages[0].location),
    'node_modules',
    'mocha'
  )
  log.verbose('idea', `setting node - using current system node: '${nodePath}'`)
  log.verbose('idea', `setting language level to: '${LANGIAGE_LEVEL}'`)
  log.verbose('idea', `setting mocha package: '${mochaPackage}'`)
  const config = {
    modules: lernaPackages.map(lernaPackage => ({
      name: lernaPackage.name,
      relativePath: relative(rootPackage.location, lernaPackage.location),
      nodePath,
      mocha: mochaConfigurations(lernaPackage.toJSON())
    })),
    mochaPackage,
    languageLevel: LANGIAGE_LEVEL
  }

  templates.ideaWorkspaceXmlFile(join(rootPackage.location, '.idea', 'workspace.xml'), config)
}

function createModulesXml(lernaPackages, rootPackage, log) {
  log.verbose('idea', 'creating .idea/modules.xml')
  templates.ideaModulesFile(
    join(rootPackage.location, '.idea', 'modules.xml'),
    lernaPackages.map(lernaPackage => {
      const relativePath = relative(rootPackage.location, lernaPackage.location)
      if (relativePath.indexOf('/') > -1) {
        const parts = relativePath.split('/')
        parts.pop()
        return {name: lernaPackage.name, dir: relativePath, group: parts.join('/')}
      } else {
        return {name: lernaPackage.name, dir: relativePath}
      }
    })
  )
}

function createModuleIml(lernaPackage, log) {
  const directories = shelljs
    .ls(lernaPackage.location)
    .filter(entry => shelljs.test('-d', join(lernaPackage.location, entry)))

  const sourceFolders = []
  SUPPORTED_SOURCE_LEVELS.forEach(sourceFolder => {
    if (directories.indexOf(sourceFolder.name) > -1) {
      sourceFolders.push(sourceFolder)
    }
  })

  log.verbose('idea', `writing module: '${lernaPackage.name}'`, {
    sourceFolders,
    excludeFolders: EXCLUDE_FOLDERS
  })
  const imlFile = join(lernaPackage.location, lernaPackage.name + '.iml')
  templates.ideaModuleImlFile(imlFile, {excludeFolders: EXCLUDE_FOLDERS, sourceFolders})
}

module.exports = generateIdeaProject
