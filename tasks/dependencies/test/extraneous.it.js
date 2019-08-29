const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {loadPackages} = require('lerna-script'),
  {extraneous} = require('..')

describe('extraneous task', () => {
  it('should list dependencies present in managed*Dependencies, but not in modules', async () => {
    const {log, project} = await setup()

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

  it('should use packages if provided', async () => {
    const {log, project} = await setup()

    return project.within(async () => {
      const packages = await loadPackages()
      const filteredPackages = packages.filter(p => p.name === 'b')

      return extraneous({packages: filteredPackages})(log).then(() => {
        expect(log.error).to.have.been.calledWith(
          'extraneous',
          'managedDependencies: adash, highdash'
        )
        expect(log.error).to.have.been.calledWith('extraneous', 'managedPeerDependencies: bar, foo')
      })
    })
  })

  async function setup() {
    const log = loggerMock()
    const project = await aLernaProject()

    project
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
