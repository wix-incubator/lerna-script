module.exports = (console, process) => (tasks, task) => {
  if (!isTaskProvided(task)) {
    console.log(getAvailableTaskRunners(tasks));
    process.exit(0);
  } else if (!isTaskPresent(tasks, task)) {
    console.error(`Unable to find task "${task}"`);
    console.error(getAvailableTaskRunners(tasks));
    process.exit(1);
  } else {
    return Promise.resolve().then(tasks[task]);
  }
};

function isTaskProvided(task) {
  return !(task === null || task === undefined);
}

function isTaskPresent(tasks, task) {
  return tasks[task];
}

function getAvailableTaskRunners(tasks) {
  return `Available tasks: "${Object.keys(tasks).join('", "')}"`;
}