const {join, relative} = require('path'),
  templates = require('./lib/templates'),
  shelljs = require('shelljs'),
  {loadRootPackage, loadPackages, exec, iter} = require('lerna-script'),
  {execSync} = require('child_process');

const excludeFolders = ['node_modules', 'dist'];
const languageLevel = 'ES6';

const supportedSourceFolders = [
  {name: 'test', isTestSource: true},
  {name: 'tests', isTestSource: true},
  {name: 'src', isTestSource: false},
  {name: 'lib', isTestSource: false},
  {name: 'scripts', isTestSource: false}
];

//TODO: add options: {packages, mocha: {patterns: ''}}
function generateIdeaProject({packages} = {}) {
  return log => {
    const rootPackage = loadRootPackage();
    const lernaPackages = packages || loadPackages();
    const execInRoot = cmd => {
      log.verbose('idea', `executing command: ${cmd}`);
      return exec.command(rootPackage)(cmd);
    };

    log.info('idea', `Generating idea projects for ${lernaPackages.length} packages`);
    log.info('idea', `cleaning existing project files...`);
    return execInRoot('rm -rf .idea')
      .then(() => execInRoot('rm -f *.iml'))
      .then(() => execInRoot('mkdir .idea'))
      .then(() => log.info('idea', 'writing project files'))
      .then(() => execInRoot(`cp ${join(__dirname, '/files/vcs.xml')} ${join(rootPackage.location, '.idea/')}`))
      .then(() => {
        createWorkspaceXml(lernaPackages, rootPackage, log);
        createModulesXml(lernaPackages, rootPackage, log);

        log.info('idea', 'writing module files');
        return iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
          return exec.command(lernaPackage)('rm -f *.iml')
            .then(() => createModuleIml(lernaPackage, log));
        });
      });
  };
}

function createWorkspaceXml(lernaPackages, rootPackage, log) {
  log.verbose('idea', 'creating .idea/workspace.xml');
  const nodePath = execSync('which node').toString().replace('\n', '');
  const mochaPackage = join(relative(rootPackage.location, lernaPackages[0].location), 'node_modules', 'mocha');
  log.verbose('idea', `setting node - using current system node: '${nodePath}'`);
  log.verbose('idea', `setting language level to: '${languageLevel}'`);
  log.verbose('idea', `setting mocha package: '${mochaPackage}'`);
  const config = {
    modules: lernaPackages.map(lernaPackage => ({
      name: lernaPackage.name,
      relativePath: relative(rootPackage.location, lernaPackage.location),
      nodePath
    })),
    mochaPackage,
    languageLevel
  };

  templates.ideaWorkspaceXmlFile(join(rootPackage.location, '.idea', 'workspace.xml'), config);
}

function createModulesXml(lernaPackages, rootPackage, log) {
  log.verbose('idea', 'creating .idea/modules.xml');
  templates.ideaModulesFile(join(rootPackage.location, '.idea', 'modules.xml'), lernaPackages.map(lernaPackage => {
    const relativePath = relative(rootPackage.location, lernaPackage.location);
    if (relativePath.indexOf('/') > -1) {
      const parts = relativePath.split('/');
      parts.pop();
      return {name: lernaPackage.name, dir: relativePath, group: parts.join('/')};
    } else {
      return {name: lernaPackage.name, dir: relativePath};
    }
  }));
}

function createModuleIml(lernaPackage, log) {
  const directories = shelljs
    .ls(lernaPackage.location)
    .filter(entry => shelljs.test('-d', join(lernaPackage.location, entry)));

  const sourceFolders = [];
  supportedSourceFolders.forEach(sourceFolder => {
    if (directories.indexOf(sourceFolder.name) > -1) {
      sourceFolders.push(sourceFolder);
    }
  });

  log.verbose('idea', `writing module: '${lernaPackage.name}'`, {sourceFolders, excludeFolders});
  const imlFile = join(lernaPackage.location, lernaPackage.name + '.iml');
  templates.ideaModuleImlFile(imlFile, {excludeFolders, sourceFolders});
}

module.exports = generateIdeaProject;