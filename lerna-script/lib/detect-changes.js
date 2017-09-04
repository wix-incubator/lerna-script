const fs = require('fs'),
  fsExtra = require('fs-extra'),
  path = require('path'),
  fsUtils = require('lerna/lib/FileSystemUtilities'),
  ignore = require('ignore'),
  shelljs = require('shelljs'),
  npmlog = require('npmlog');

function makePackageBuilt(lernaPackage, {log = npmlog} = {log: npmlog}) {
  return label => {
    log.verbose('makePackageBuilt', 'marking module built', {packagePath: lernaPackage.location, label});
    fsExtra.ensureDirSync(path.join(process.cwd(), '.lerna'));
    fs.writeFileSync(targetFileSentinelFile(lernaPackage, label), '');
  };
}

function makePackageUnbuilt(lernaPackage, {log = npmlog} = {log: npmlog}) {
  return label => {
    log.verbose('makePackageUnbuilt', 'marking module unbuilt', {packagePath: lernaPackage.location, label});
    fsExtra.removeSync(targetFileSentinelFile(lernaPackage, label));
  }
}

function isPackageBuilt(lernaPackage) {
  return label => {
    const ignored = collectIgnores(lernaPackage.location);
    const targetSentinelForPackage = targetFileSentinelFile(lernaPackage, label);
    return fsUtils.existsSync(targetSentinelForPackage) &&
      !modifiedAfter(lernaPackage.location, '.', ignored, fs.statSync(targetSentinelForPackage).mtime.getTime());
  };
}

function targetFileSentinelFile(lernaPackage, label = 'default') {
  return path.resolve(process.cwd(), '.lerna', `.${lernaPackage.name}-${label}-sentinel`);
}

function modifiedAfter(baseDir, dir, ignored, timeStamp) {
  let rootAbsolutePath = path.resolve(baseDir, dir);
  const entries = shelljs.ls(rootAbsolutePath);
  //const entries = klawSync(lernaPackage.location);

  return entries.map(entry => {
    const absolutePath = path.resolve(rootAbsolutePath, entry);
    return {
      absolutePath,
      relativePath: path.relative(baseDir, absolutePath),
      stats: fs.lstatSync(absolutePath)
    }
  })
    .filter(({relativePath}) => !ignored.ignores(relativePath))
    .filter(({stats}) => !stats.isSymbolicLink())
    .sort(({stats}) => stats.isFile() ? -1 : 1)
    .some(({relativePath, stats}) => {
      return stats.isDirectory() ? modifiedAfter(baseDir, relativePath, ignored, timeStamp) : stats.mtime.getTime() > timeStamp
    });
}

function collectIgnores(dir) {
  const paths = [dir];
  let current = dir;
  while (current !== process.cwd()) {
    current = current.split(path.sep).slice(0, -1).join(path.sep) || '/';
    paths.push(current);
  }

  const ig = ignore();
  paths.reverse().map(dir => {
    if (fs.existsSync(path.join(dir, '.gitignore'))) {
      ig.add(fs.readFileSync(path.join(dir, '.gitignore')).toString())
    }
  });

  return ig;
}

module.exports = {
  markPackageBuilt: makePackageBuilt,
  markPackageUnbuilt: makePackageUnbuilt,
  isPackageBuilt: isPackageBuilt
};
