#!/usr/bin/env node
const {join} = require('path'),
  taskRunner = require('../lib/task-runner'),
  log = require('npmlog');

const argv = require('yargs')
  .usage('Usage: $0  [options] <task>')
  .option('loglevel', {
    describe: 'choose a size',
    choices: ['silly', 'verbose', 'info', 'warn', 'error']
  })
  .default('loglevel', 'info')
  .demandCommand(1)
  .help('help')
  .argv;

log.level = argv.loglevel;
log.enableProgress();
log.enableColor();

const tasks = require(join(process.cwd(), 'lerna.js'));
const taskName = argv._[0];
taskRunner({process, log})(tasks, taskName).catch(e => {
  log.error('lerna-script', `Task "${taskName}" failed.`, e);
  process.exit(1);
});