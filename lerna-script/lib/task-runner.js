module.exports = ({process, log}) => (tasks, task) => {
  if (!isTaskProvided(task)) {
    log.info('lerna-script', 'No task provided.', getAvailableTaskRunners(tasks));
    process.exit(0);
  } else if (!isTaskPresent(tasks, task)) {
    log.error('lerna-script', `Unable to find task "${task}"`);
    log.error('lerna-script', getAvailableTaskRunners(tasks));
    process.exit(1);
  } else {
    log.info('lerna-script', `executing task: "${task}"`);
    return Promise.resolve().then(tasks[task](log));
  }
};

function isTaskProvided(task) {
  return !!task;
}

function isTaskPresent(tasks, task) {
  return tasks[task];
}

function getAvailableTaskRunners(tasks) {
  return `Available tasks: "${Object.keys(tasks).join('", "')}"`;
}