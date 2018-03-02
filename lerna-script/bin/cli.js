#!/usr/bin/env node
const {readFileSync} = require('fs'),
  {join} = require('path'),
  taskRunner = require('../lib/task-runner'),
  log = require('npmlog')

const argv = require('yargs')
  .usage('Usage: $0  [options] <task>')
  .option('loglevel', {
    describe: 'choose a size',
    choices: ['silly', 'verbose', 'info', 'warn', 'error']
  })
  .default('loglevel', 'info')
  .demandCommand(1)
  .help('help').argv

log.level = argv.loglevel
log.enableProgress()
log.enableColor()

const tasks = resolveTasksFile()
const taskName = argv._[0]

taskRunner({process, log})(tasks, taskName).catch(e => {
  log.error('lerna-script', `Task "${taskName}" failed.`, e)
  process.exit(1)
})

function resolveTasksFile() {
  log.verbose('Resolving lerna-script tasks file...')
  const lernaJson = JSON.parse(readFileSync('./lerna.json', 'utf8'))
  if (lernaJson['lerna-script-tasks']) {
    const tasks = lernaJson['lerna-script-tasks']
    log.verbose('lerna-script tasks defined in lerna.json, loading', {
      cwd: process.cwd(),
      'lerna-script-tasks': tasks
    })
    const tasksOrFunction = require(tasks.startsWith('./') ? join(process.cwd(), tasks) : tasks)

    return typeof tasksOrFunction === 'function' ? tasksOrFunction() : tasksOrFunction
  } else {
    log.verbose('lerna-script tasks not defined in lerna.json, using defaults', {
      cwd: process.cwd(),
      'lerna-script-tasks': 'lerna.js'
    })
    return require(join(process.cwd(), './lerna.js'))
  }
}
