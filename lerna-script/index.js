const Repository = require('lerna/lib/Repository');
const PackageUtilities = require('lerna/lib/PackageUtilities');

module.exports.packages = () => PackageUtilities.getPackages(new Repository());
module.exports.iter = {forEach, parallel};
module.exports.exec = {cmd: runCommand, script: runScript};

function forEach(packages, callback) {
  return Promise.resolve().then(() => {
    return packages.forEach(pkg => callback(pkg));
  });
}

function parallel(packages, callback) {

}

function parallelBatched(packages, callback) {

}

function runCommand(pkg, command, options) {

}

function runScript(pkg, script, options) {

}
