const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai').use(require('sinon-chai')),
  depcheckTask = require('..'),
  invertPromise = require('invert-promise')

describe('depcheck', () => {
  it('should fail for extraneous dependency', async () => {
    const log = loggerMock()
    const project = await aLernaProject({a: ['lodash']})

    return project.within(() => {
      return invertPromise(
        depcheckTask()(log).then(() =>
          expect(log.info).to.have.been.calledWith(
            'depcheck',
            'checking dependencies for 1 modules'
          )
        )
      ).then(err => {
        expect(log.item.error).to.have.been.calledWith(
          'depcheck',
          'module a has unused dependencies: lodash'
        )
        expect(err.message).to.be.string('unused deps found for module a')
      })
    })
  })

  it('should support custom packages', async () => {
    const log = loggerMock()
    const project = await aLernaProject({a: ['lodash'], b: []})

    return project.within(async () => {
      const packages = await loadPackages()
      const filteredPackages = packages.filter(p => p.name === 'b')
      return depcheckTask({packages: filteredPackages})(log)
    })
  })

  it('should pass for no extraneous dependencies', async () => {
    const log = loggerMock()
    const project = await aLernaProject({a: []})

    return project.within(() => depcheckTask()(log))
  })

  it('should respect provided overrides', async () => {
    const log = loggerMock()
    const project = await aLernaProject({a: ['lodash']})

    return project.within(() => depcheckTask({depcheck: {ignoreMatches: ['lodash']}})(log))
  })

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
})
