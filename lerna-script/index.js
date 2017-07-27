const Repository = require('lerna/lib/Repository');
const PackageUtilities = require('lerna/lib/PackageUtilities');

module.exports.packages = () => PackageUtilities.getPackages(new Repository());
module.exports.iter = {forEach, parallel};
module.exports.exec = {cmd: runCommand, script: runScript};

function forEach(packages, task) {

}

function parallel(packages, task) {

}

function runCommand(pkg, command, options) {

}

function runScript(pkg, script, options) {

}
