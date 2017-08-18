const fs = require('fs'),
  fsExtra = require('fs-extra'),
  path = require('path'),
  fsUtils = require('lerna/lib/FileSystemUtilities'),
  ignore = require('ignore'),
  klawSync = require('klaw-sync');

function makePackageBuilt(lernaPackage) {
  return label => {
    fsExtra.ensureDirSync(path.join(process.cwd(), '.lerna'));
    fs.writeFileSync(targetFileSentinelFile(lernaPackage, label), '');
  };
}

function makePackageUnbuilt(lernaPackage) {
  return label => fsExtra.removeSync(targetFileSentinelFile(lernaPackage, label));
}

function isPackageBuilt(lernaPackage) {
  return label => {
    const ignored = collectIgnores(lernaPackage.location);
    const targetSentinelForPackage = targetFileSentinelFile(lernaPackage, label);
    return fsUtils.existsSync(targetSentinelForPackage) &&
      !modifiedAfter(lernaPackage, ignored, fs.statSync(targetSentinelForPackage).mtime.getTime());
  };
}

function targetFileSentinelFile(lernaPackage, label = 'default') {
  return path.resolve(process.cwd(), '.lerna', `.octo-${lernaPackage.name}-${label}-sentinel`);
}

function modifiedAfter(lernaPackage, ignored, timeStamp) {
  let rootAbsolutePath = path.resolve(process.cwd(), lernaPackage.location);
  const entries = klawSync(lernaPackage.location);

  return entries.map(entry => {
    const absolutePath = path.resolve(rootAbsolutePath, entry.path);
    return {
      absolutePath,
      relativePath: path.relative(process.cwd(), absolutePath),
      stats: entry.stats
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
