const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai').use(require('sinon-chai')),
  depcheckTask = require('..');

describe('depcheck', () => {

  it('should fail for extraneous dependency', done => {
    const log = loggerMock();
    const project = aLernaProject({'a': ['lodash']});

    project.within(() => {
      return depcheckTask()(log)
        .then(() => expect(log.info).to.have.been.calledWith('depcheck', 'checking dependencies for 1 modules'))
        .catch(err => {
          expect(log.item.error).to.have.been.calledWith('depcheck', 'module a has unused dependencies: lodash');
          expect(err.message).to.be.string('unused deps found for module a');
          done();
        });
    });
  });

  it('should support custom packages', () => {
    const log = loggerMock();
    const project = aLernaProject({'a': ['lodash'], b: []});

    return project.within(() => {
      const packages = loadPackages().filter(p => p.name === 'b');
      return depcheckTask({packages})(log);
    })
  });

  it('should pass for no extraneous dependencies', () => {
    const log = loggerMock();
    const project = aLernaProject({'a': []});

    return project.within(() => depcheckTask()(log));
  });

  it('should respect provided overrides', () => {
    const log = loggerMock();
    const project = aLernaProject({'a': ['lodash']});

    return project.within(() => depcheckTask({depcheck: {ignoreMatches: ['lodash']}})(log));
  });

  // it('build modules incrementally', () => {
  //   const reporter = sinon.spy();
  //   const project = empty()
  //     .module('a', module => module.packageJson({version: '1.0.0'}))
  //     .module('b', module => module.packageJson({version: '1.0.0'}));
  //
  //   return project.within(() => {
  //     return Promise.resolve()
  //       .then(() => new Start(reporter)(depcheckTask()))
  //       .then(() => expect(reporter).to.have.been.calledWith(sinon.match.any, sinon.match.any, 'Filtered-out 0 unchanged modules'))
  //       .then(() => removeSync('a/target'))
  //       .then(() => new Start(reporter)(depcheckTask()))
  //       .then(() => expect(reporter).to.have.been.calledWith(sinon.match.any, sinon.match.any, 'Filtered-out 1 unchanged modules'));
  //   });
  // });

});