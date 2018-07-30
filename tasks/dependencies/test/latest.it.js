const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {latest} = require('..'),
  {execSync} = require('child_process'),
  bddStdin = require('bdd-stdin')

describe('latest task', function() {
  this.timeout(30000)

  it('should list dependencies that can be updated', () => {
    const ramdaVersion = execSync('npm info ramda dist-tags.latest')
      .toString()
      .trim('\n')
    const lodashVersion = execSync('npm info lodash dist-tags.latest')
      .toString()
      .trim('\n')
    const {log, project} = setup({
      managedDependencies: {
        lodash: 'latest',
        shelljs: '*',
        ramda: '0.0.1',
        url: '>0.0.1'
      },
      managedPeerDependencies: {
        ramda: '> 0.0.1',
        lodash: '0.0.1'
      }
    })

    const onInquire = () => bddStdin('a', '\n')

    return project.within(ctx => {
      return latest({onInquire})(log).then(() => {
        const lernaJson = ctx.readJsonFile('lerna.json')

        expect(lernaJson.managedPeerDependencies.lodash).to.equal(lodashVersion)
        expect(lernaJson.managedDependencies.ramda).to.equal(ramdaVersion)
        expect(lernaJson.managedPeerDependencies.ramda).to.not.equal(ramdaVersion)
      })
    })
  })

  it('should respect range operator when provided', () => {
    const ramdaVersion = execSync('npm info ramda dist-tags.latest')
      .toString()
      .trim('\n')
    const lodashVersion = execSync('npm info lodash dist-tags.latest')
      .toString()
      .trim('\n')
    const {log, project} = setup({
      managedDependencies: {
        lodash: 'latest',
        shelljs: '*',
        ramda: '0.0.1',
        url: '>0.0.1'
      },
      managedPeerDependencies: {
        ramda: '> 0.0.1',
        lodash: '0.0.1'
      }
    })

    const onInquire = () => bddStdin('a', '\n')

    return project.within(ctx => {
      return latest({onInquire, addRange: '+'})(log).then(() => {
        const lernaJson = ctx.readJsonFile('lerna.json')

        expect(lernaJson.managedPeerDependencies.lodash).to.equal(`+${lodashVersion}`)
        expect(lernaJson.managedDependencies.ramda).to.equal(`+${ramdaVersion}`)
        expect(lernaJson.managedPeerDependencies.ramda).to.not.equal(ramdaVersion)
      })
    })
  })

  it('should log and exit for no updates', () => {
    const {log, project} = setup({
      managedDependencies: {
        lodash: 'latest'
      }
    })

    return project.within(() => {
      return latest()(log).then(() => {
        expect(log.info).to.have.been.calledWith('latest', `no updates found, exiting...`)
      })
    })
  })

  it('should not reject for missing managedDependencies, managedPeerDependencies', () => {
    const {log, project} = setup()

    return project.within(() => latest()(log))
  })

  function setup(lernaJsonOverrides = {}) {
    const log = loggerMock()
    const project = aLernaProject().lernaJson(lernaJsonOverrides)

    return {log, project}
  }
})
