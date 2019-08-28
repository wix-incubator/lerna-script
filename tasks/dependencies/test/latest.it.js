const {aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  {expect} = require('chai').use(require('sinon-chai')),
  {latest} = require('..'),
  {execSync} = require('child_process'),
  bddStdin = require('bdd-stdin'),
  Promise = require('bluebird')

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

  describe('auto select', () => {
    it('should autoselect minor and patch updates', () => {
      const {log, project} = setup({
        managedDependencies: {
          package1: '1.0.0'
        },
        managedPeerDependencies: {
          package2: '2.0.0',
          package3: '3.0.0'
        },
        autoselect: {
          versionDiff: ['patch', 'minor']
        }
      })

      const onInquire = () => bddStdin('\n')
      const fetch = name => {
        switch (name) {
          case 'package1':
            return Promise.resolve('1.0.1') //patch diff
          case 'package2':
            return Promise.resolve('2.1.1') //minor diff
          case 'package3':
            return Promise.resolve('4.1.1') //major diff
        }
      }

      return project.within(ctx => {
        return latest({onInquire, fetch})(log).then(() => {
          const lernaJson = ctx.readJsonFile('lerna.json')

          console.log(lernaJson)
          expect(lernaJson.managedDependencies.package1).to.equal('1.0.1')
          expect(lernaJson.managedPeerDependencies.package2).to.equal('2.1.1')
          expect(lernaJson.managedPeerDependencies.package3).to.equal('3.0.0')
        })
      })
    })

    it('should autoselect major updates but exclude speicific packages', () => {
      const {log, project} = setup({
        managedDependencies: {
          package1: '1.0.0'
        },
        managedPeerDependencies: {
          package2: '2.0.0',
          package3: '3.0.0'
        },
        autoselect: {
          versionDiff: ['major'],
          exclude: ['package3']
        }
      })

      const onInquire = () => bddStdin('\n')
      const fetch = name => {
        switch (name) {
          case 'package1':
            return Promise.resolve('4.1.1') //major
          case 'package2':
            return Promise.resolve('2.1.2') //minor
          case 'package3':
            return Promise.resolve('4.0.9') //major
        }
      }

      return project.within(ctx => {
        return latest({onInquire, fetch})(log).then(() => {
          const lernaJson = ctx.readJsonFile('lerna.json')

          console.log(lernaJson)
          expect(lernaJson.managedDependencies.package1).to.equal('4.1.1')
          expect(lernaJson.managedPeerDependencies.package2).to.equal('2.0.0')
          expect(lernaJson.managedPeerDependencies.package3).to.equal('3.0.0')
        })
      })
    })

    it('should respect silent flag', () => {
      const {log, project} = setup({
        managedDependencies: {
          package1: '1.0.0'
        },
        managedPeerDependencies: {
          package2: '2.0.0',
          package3: '3.0.0'
        },
        autoselect: {
          versionDiff: ['patch'],
          exclude: ['package1', 'package3']
        }
      })

      const fetch = name => {
        switch (name) {
          case 'package1':
            return Promise.resolve('1.0.1') //patch
          case 'package2':
            return Promise.resolve('2.0.1') //patch
          case 'package3':
            return Promise.resolve('3.0.9') //patch
        }
      }

      return project.within(ctx => {
        return latest({fetch, silent: true})(log).then(() => {
          const lernaJson = ctx.readJsonFile('lerna.json')

          console.log(lernaJson)
          expect(lernaJson.managedDependencies.package1).to.equal('1.0.0')
          expect(lernaJson.managedPeerDependencies.package2).to.equal('2.0.1')
          expect(lernaJson.managedPeerDependencies.package3).to.equal('3.0.0')
        })
      })
    })
  })

  function setup(lernaJsonOverrides = {}) {
    const log = loggerMock()
    const project = aLernaProject().lernaJson(lernaJsonOverrides)

    return {log, project}
  }
})
