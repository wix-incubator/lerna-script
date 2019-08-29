const {aLernaProject, fs, loggerMock} = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai').use(require('sinon-chai')),
  sync = require('..')

describe('modules sync task', () => {
  it('should sync module versions with defaults', async () => {
    const log = loggerMock()
    const project = await aLernaProject()
    project
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {a: '~1.0.0'}}))
      .module('packages/c', module => module.packageJson({devDependencies: {a: '~1.0.0'}}))
      .module('packages/d', module => module.packageJson({peerDependencies: {a: '~1.0.0'}}))

    return project.within(() => {
      return sync()(log).then(() => {
        expect(log.info).to.have.been.calledWith(
          'modules',
          'syncing module versions for 4 packages'
        )
        expect(fs.readJson('packages/b/package.json')).to.contain.nested.property(
          'dependencies.a',
          '~2.0.0'
        )
        expect(fs.readJson('packages/c/package.json')).to.contain.nested.property(
          'devDependencies.a',
          '~2.0.0'
        )
        expect(fs.readJson('packages/d/package.json')).to.contain.nested.property(
          'peerDependencies.a',
          '>=2.0.0'
        )
      })
    })
  })

  it('should respect provided packages', async () => {
    const log = loggerMock()
    const project = await aLernaProject()
    project
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {a: '~1.0.0'}}))
      .module('packages/c', module => module.packageJson({dependencies: {a: '~1.0.0'}}))

    return project.within(async () => {
      const lernaPackages = await loadPackages()
      const filteredPackages = lernaPackages.filter(p => p.name !== 'c')
      return sync({packages: filteredPackages})(log).then(() => {
        expect(log.info).to.have.been.calledWith(
          'modules',
          'syncing module versions for 2 packages'
        )
        expect(fs.readJson('packages/b/package.json')).to.contain.nested.property(
          'dependencies.a',
          '~2.0.0'
        )
        expect(fs.readJson('packages/c/package.json')).to.contain.nested.property(
          'dependencies.a',
          '~1.0.0'
        )
      })
    })
  })

  it('should accept custom transformFunctions', async () => {
    const log = loggerMock()
    const project = await aLernaProject()
    project
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {a: '~1.0.0'}}))
      .module('packages/c', module => module.packageJson({devDependencies: {a: '~1.0.0'}}))
      .module('packages/d', module => module.packageJson({peerDependencies: {a: '~1.0.0'}}))

    return project.within(() => {
      return sync({transformDependencies: v => `+${v}`, transformPeerDependencies: v => `-${v}`})(
        log
      ).then(() => {
        expect(fs.readJson('packages/b/package.json')).to.contain.nested.property(
          'dependencies.a',
          '+2.0.0'
        )
        expect(fs.readJson('packages/c/package.json')).to.contain.nested.property(
          'devDependencies.a',
          '+2.0.0'
        )
        expect(fs.readJson('packages/d/package.json')).to.contain.nested.property(
          'peerDependencies.a',
          '-2.0.0'
        )
      })
    })
  })

  it('should beauify json on update', async () => {
    const log = loggerMock()
    const project = await aLernaProject()
    project
      .module('packages/a', module => module.packageJson({version: '2.0.0'}))
      .module('packages/b', module => module.packageJson({dependencies: {a: '~1.0.0'}}))

    return project.within(() => {
      return sync()(log).then(() => {
        expect(fs.readFile('packages/b/package.json').split('\n').length).to.be.gt(2)
      })
    })
  })
})
