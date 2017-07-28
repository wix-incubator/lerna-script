#!/usr/bin/env node
const {join} = require('path'),
  taskRunner = require('../lib/task-runner'),
  log = require('npmlog'),
  util = require('util');

const tasks = require(join(process.cwd(), 'lerna.js'));
const taskName = process.argv[process.argv.length - 1];

taskRunner({process, log})(tasks, taskName).catch(e => {
  log.error('lerna-script', `Task "${taskName}" failed.`, e);
  process.exit(1);
});