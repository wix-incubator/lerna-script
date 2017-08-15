const {join, relative} = require('path'),
  templates = require('./lib/templates'),
  shelljs = require('shelljs'),
  lernaScript = require('lerna-script'),
  {execSync} = require('child_process');

const supportedSourceFolders = [
  {name: 'test', isTestSource: true},
  {name: 'tests', isTestSource: true},
  {name: 'src', isTestSource: false},
  {name: 'lib', isTestSource: false},
  {name: 'scripts', isTestSource: false}
];

module.exports = function generateIdeaProject() {
  const rootPackage = lernaScript.rootPackage();
  const lernaPackages = lernaScript.packages();

  return lernaScript.exec.command('rm -rf .idea')(rootPackage)
    .then(() => lernaScript.exec.command('rm -f *.iml')(rootPackage))
    .then(() => lernaScript.exec.command('mkdir .idea')(rootPackage))
    .then(() => lernaScript.exec.command(`cp ${join(__dirname, '/files/vcs.xml')} ${join(rootPackage.location, '.idea/')}`)(rootPackage))
    .then(() => {
      createWorkspaceXml(lernaPackages, rootPackage);
      createModulesXml(lernaPackages, rootPackage);

      return lernaScript.iter.parallel(lernaPackages, lernaPackage => {
        return lernaScript.exec.command('rm -f *.iml')(lernaPackage)
          .then(() => createModuleIml(lernaPackage));
      });
    });
};

function createWorkspaceXml(lernaPackages, rootPackage) {
  const node = execSync('which node').toString().replace('\n', '');
  const config = {
    modules: lernaPackages.map(lernaPackage => ({
      name: lernaPackage.name,
      relativePath: relative(rootPackage.location, lernaPackage.location),
      nodePath: node
    })),
    mochaPackage: join(relative(rootPackage.location, lernaPackages[0].location), 'node_modules', 'mocha')
  };

  templates.ideaWorkspaceXmlFile(join(rootPackage.location, '.idea', 'workspace.xml'), config);
}

function createModulesXml(lernaPackages, rootPackage) {
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

function createModuleIml(lernaPackage) {
  const directories = shelljs
    .ls(lernaPackage.location)
    .filter(entry => shelljs.test('-d', join(lernaPackage.location, entry)));

  const sourceFolders = [];
  supportedSourceFolders.forEach(sourceFolder => {
    if (directories.indexOf(sourceFolder.name) > -1) {
      sourceFolders.push(sourceFolder);
    }
  });

  const imlFile = join(lernaPackage.location, lernaPackage.name + '.iml');
  templates.ideaModuleImlFile(imlFile, sourceFolders);
}