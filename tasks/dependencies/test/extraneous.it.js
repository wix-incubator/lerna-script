const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {loadPackages} = require('lerna-script'),
  {extraneous} = require('..')

describe('extraneous task', () => {
  it('should list dependencies present in managed*Dependencies, but not in modules', () => {
    const {log, project} = setup()

    return project.within(() => {
      return extraneous()(log).then(() => {
        expect(log.error).to.have.been.calledWith(
          'extraneous',
          'managedDependencies: adash, highdash'
        )
        expect(log.error).to.have.been.calledWith('extraneous', 'managedPeerDependencies: bar')
      })
    })
  })

  it('should use packages if provided', () => {
    const {log, project} = setup()

    return project.within(() => {
      const packages = loadPackages().filter(p => p.name === 'b')

      return extraneous({packages})(log).then(() => {
        expect(log.error).to.have.been.calledWith(
          'extraneous',
          'managedDependencies: adash, highdash'
        )
        expect(log.error).to.have.been.calledWith('extraneous', 'managedPeerDependencies: bar, foo')
      })
    })
  })

  function setup() {
    const log = loggerMock()
    const project = aLernaProject()
      .lernaJson({
        managedDependencies: {lodash: '1.1.0', highdash: '1.1.0', adash: '1.1.0'},
        managedPeerDependencies: {foo: '> 1.0.0', bar: '> 1.0.0'}
      })
      .module('packages/a', module =>
        module.packageJson({
          name: 'a',
          version: '1.0.0',
          peerDependencies: {foo: '1'},
          devDependencies: {lodash: 'nope'}
        })
      )
      .module('packages/b', module =>
        module.packageJson({
          version: '1.0.0',
          dependencies: {a: '~1.0.0', lodash: '~1.0.0'}
        })
      )

    return {project, log}
  }
})
