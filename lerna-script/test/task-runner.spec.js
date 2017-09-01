const {expect} = require('chai').use(require('sinon-chai')),
  {loggerMock} = require('lerna-script-test-utils'),
  taskRunner = require('../lib/task-runner'),
  sinon = require('sinon');

describe('task-runner', () => {

  it('should run provided script', () => {
    const {logMock, runTask} = setupMocks();
    const task = sinon.spy();

    return runTask({task}, 'task').then(() => {
      expect(task).to.have.been.calledWith(logMock);
      expect(logMock.info).to.have.been.calledWith('lerna-script', 'executing task: "task"')
    });
  });

  it('should log error, available tasks and exit with code 1 if provided task is not present', () => {
    const {logMock, processMock, runTask} = setupMocks();

    runTask({task1: '', task2: ''}, 'non-existent');

    expect(processMock.exit).to.have.been.calledWith(1);
    expect(logMock.error).to.have.been.calledWithMatch('lerna-script', 'Unable to find task "non-existent"');
    expect(logMock.error).to.have.been.calledWithMatch('lerna-script', 'Available tasks: "task1", "task2"');
  });

  it('should log available tasks and exit with 0 if no task is provided', () => {
    const {logMock, processMock, runTask} = setupMocks();

    runTask({task1: '', task2: ''});

    expect(processMock.exit).to.have.been.calledWith(0);
    expect(logMock.info).to.have.been.calledWithMatch('lerna-script', 'No task provided.', 'Available tasks: "task1", "task2"');
  });

  function setupMocks() {
    const logMock = loggerMock();
    const processMock = {
      exit: sinon.spy()
    };


    return {logMock, processMock, runTask: taskRunner({log: logMock, process: processMock})};
  }
});