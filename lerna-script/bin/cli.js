#!/usr/bin/env node
const {join} = require('path'),
  taskRunner = require('../lib/task-runner');

console.log(process.cwd());

const tasks = require(join(process.cwd(), 'lerna-tasks.js'));
const taskName = process.argv[3];

taskRunner(console, process)(tasks, taskName);