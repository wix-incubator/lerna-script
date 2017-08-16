const shelljs = require('shelljs');
const fs = require('fs');
const path = require('path');
const fsUtils = require('lerna/lib/FileSystemUtilities');
const ignore = require('ignore');

function makePackageBuilt(lernaPackage, label) {
  shelljs.mkdir('-p', path.join(process.cwd(), '.lerna'));
  fsUtils.writeFileSync(targetFileSentinelFile(lernaPackage, label), '');
}

function makePackageUnbuilt(lernaPackage, label) {
  const targetSentinelForPackage = targetFileSentinelFile(lernaPackage, label);
  fsUtils.existsSync(targetSentinelForPackage) && fsUtils.unlinkSync(targetSentinelForPackage);
}

function isPackageBuilt(lernaPackage, label) {
  const ignored = collectIgnores(lernaPackage.location);
  const targetSentinelForPackage = targetFileSentinelFile(lernaPackage, label);
  return fsUtils.existsSync(targetSentinelForPackage) &&
    !modifiedAfter(lernaPackage, ignored, fs.statSync(targetSentinelForPackage).mtime.getTime());
}

function targetFileSentinelFile(lernaPackage, label = 'default') {
  return path.resolve(process.cwd(), '.lerna', `.octo-${lernaPackage.name}-${label}-sentinel`);
}

function modifiedAfter(lernaPackage, ignored, timeStamp) {
  let rootAbsolutePath = path.resolve(process.cwd(), lernaPackage.location);
  const entries = shelljs.ls(lernaPackage.location);

  return entries.map(entry => {
    const absolutePath = path.resolve(rootAbsolutePath, entry);
    return {
      absolutePath,
      relativePath: path.relative(process.cwd(), absolutePath),
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
