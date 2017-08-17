const NpmUtilities = require('lerna/lib/NpmUtilities'),
  ChildProcessUtilities = require('lerna/lib/ChildProcessUtilities'),
  npmlog = require('npmlog');

function runCommand(command) {
  return (lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) => {
    log.silly("runCommand", command, {cwd: lernaPackage.location, silent});
    const commandAndArgs = command.split(' ');
    const actualCommand = commandAndArgs.shift();
    const actualCommandArgs = commandAndArgs;
    return new Promise((resolve, reject) => {
      const callback = (err, stdout) => err ? reject(err) : resolve(stdout);
      if (silent) {
        ChildProcessUtilities.exec(actualCommand, [...actualCommandArgs], {cwd: lernaPackage.location}, callback);
      } else {
        ChildProcessUtilities.spawnStreaming(actualCommand, [...actualCommandArgs], {cwd: lernaPackage.location}, lernaPackage.name, callback);
      }
    });
  };
}

function runScript(script) {
  return (lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) => {
    if (lernaPackage.scripts && lernaPackage.scripts[script]) {
      return new Promise((resolve, reject) => {
        const callback = (err, stdout) => err ? reject(err) : resolve(stdout);
        if (silent) {
          NpmUtilities.runScriptInDir(script, [], lernaPackage.location, callback);
        } else {
          NpmUtilities.runScriptInPackageStreaming(script, [], lernaPackage, callback)
        }
      });
    } else {
      log.warn('runNpmScript', 'script not found', {script, cwd: lernaPackage.location});
      return Promise.resolve('');
    }
  };
}

module.exports = {
  runCommand,
  runScript
};