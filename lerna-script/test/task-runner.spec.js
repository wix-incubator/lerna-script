const {expect} = require('chai').use(require('sinon-chai')),
  taskRunner = require('../lib/task-runner'),
  sinon = require('sinon');

describe('task-runner', () => {

  it('should run provided script', () => {
    const {runTask} = setupMocks();
    const task = sinon.spy();

    return runTask({task}, 'task').then(() => {
      expect(task).to.have.been.calledOnce;
    });
  });

  it('should log error, available tasks and exit with code 1 if provided task is not present', () => {
    const {consoleMock, processMock, runTask} = setupMocks();

    runTask({task1: '', task2: ''}, 'non-existent');

    expect(processMock.exit).to.have.been.calledWith(1);
    expect(consoleMock.error).to.have.been.calledWithMatch('Unable to find task "non-existent"');
    expect(consoleMock.error).to.have.been.calledWithMatch('Available tasks: "task1", "task2"');
  });

  it('should log available tasks and exit with 0 if no task is provided', () => {
    const {consoleMock, processMock, runTask} = setupMocks();

    runTask({task1: '', task2: ''});

    expect(processMock.exit).to.have.been.calledWith(0);
    expect(consoleMock.log).to.have.been.calledWithMatch('Available tasks: "task1", "task2"');
  });

  function setupMocks() {
    const consoleMock = {
      log: sinon.spy(),
      error: sinon.spy()
    };
    const processMock = {
      exit: sinon.spy()
    };


    return {consoleMock, processMock, runTask: taskRunner(consoleMock, processMock)};
  }
});