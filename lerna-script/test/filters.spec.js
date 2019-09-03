const {expect} = require('chai').use(require('sinon-chai')),
  {asBuilt, asGitCommited} = require('./utils'),
  Package = require('@lerna/package'),
  {empty, aLernaProjectWith2Modules, loggerMock} = require('lerna-script-test-utils'),
  index = require('..')

describe('filters', function() {
  this.timeout(5000)

  describe('includeFilteredDeps', () => {
    it('should add dependent package', async () => {
      const log = loggerMock()
      const project = await aLernaProjectWith2Modules()

      return project.within(async () => {
        const allPackages = await index.loadPackages()
        const lernaPackages = index.filters.removeByGlob(allPackages, {log})('a')
        const filteredPackages = index.filters.includeFilteredDeps(allPackages, {log})(
          lernaPackages
        )
        expect(filteredPackages.map(p => p.name)).to.deep.equal(['a', 'b'])
      })
    })
  })

  describe('removeByGlob', () => {
    it('should filter-out packages by provided glob', async () => {
      const log = loggerMock()
      const project = await aLernaProjectWith2Modules()

      return project.within(async () => {
        const packages = await index.loadPackages()
        const lernaPackages = index.filters.removeByGlob(packages, {log})('a')
        expect(lernaPackages.map(p => p.name)).to.have.same.members(['b'])
        expect(log.verbose).to.have.been.calledWithMatch('removeByGlob', 'removed 1 packages')
      })
    })
  })

  describe('removeBuilt', () => {
    it('should not filter-out any packages for unbuilt project', async () => {
      const project = await aLernaProjectWith2Modules()

      return project.within(async () => {
        const packages = await index.loadPackages()
        const unbuiltLernaPackages = index.filters.removeBuilt(packages)()
        expect(unbuiltLernaPackages.length).to.equal(2)
      })
    })

    it('should filter-out changed packages', async () => {
      const log = loggerMock()
      const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()))

      return project.within(async () => {
        const packages = await index.loadPackages()
        index.changes.unbuild(packages.find(p => p.name === 'b'))()

        const unbuiltLernaPackages = index.filters.removeBuilt(packages, {log})()

        expect(unbuiltLernaPackages.length).to.equal(1)
        expect(log.verbose).to.have.been.calledWithMatch(
          'removeBuilt',
          'found 1 packages with changes'
        )
        expect(log.verbose).to.have.been.calledWithMatch('removeBuilt', 'removed 1 packages')
      })
    })

    it('should filter-out packages whose dependencies changed', async () => {
      const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()))

      return project.within(async () => {
        const lernaPackages = await index.loadPackages()
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))()

        const unbuiltLernaPackages = index.filters.removeBuilt(lernaPackages)()
        expect(unbuiltLernaPackages.length).to.equal(1)
      })
    })

    it('should respect labels when filtering-out packages', async () => {
      const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: 'woop'})

      return project.within(async () => {
        const lernaPackages = await index.loadPackages()

        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))()
        expect(index.filters.removeBuilt(lernaPackages)('woop').length).to.equal(0)

        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))('woop')
        expect(index.filters.removeBuilt(lernaPackages)('woop').length).to.equal(1)
      })
    })

    it('should unmark dependents as built', async () => {
      const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()))

      return project.within(async ctx => {
        const lernaPackages = await index.loadPackages()
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'))()

        expect(index.filters.removeBuilt(lernaPackages)().length).to.equal(2)

        index.changes.build(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'))()
        ctx.exec('sleep 1')
        expect(index.filters.removeBuilt(lernaPackages)().length).to.equal(1)
      })
    })
  })

  describe('filters.gitSince', () => {
    it('removes modules without changes', async () => {
      const log = loggerMock()
      const project = empty()
        .addFile('package.json', {name: 'root', version: '1.0.0'})
        .addFile('lerna.json', {lerna: '2.0.0', packages: ['packages/**'], version: '0.0.0'})
        .module('packages/a', module => module.packageJson({name: 'a', version: '2.0.0'}))
        .module('packages/ba', module =>
          module.packageJson({name: 'ba', version: '1.0.0', dependencies: {b: '~1.0.0'}})
        )

      await project.inDir(ctx => {
        ctx.exec('git init && git config user.email mail@example.org && git config user.name name')
        ctx.exec('git add -A && git commit -am ok')
        ctx.exec('git checkout -b test')
      })

      project.module('packages/b', module => module.packageJson({name: 'b', version: '1.0.0'}))

      await project.inDir(ctx => {
        ctx.exec('git add -A && git commit -am ok')
      })
      return project.within(async () => {
        const packages = await index.loadPackages()
        const lernaPackages = index.filters.gitSince(packages, {log})('master')

        expect(lernaPackages[0]).to.be.instanceof(Package)
        expect(lernaPackages.map(p => p.name)).to.have.same.members(['b', 'ba'])
        expect(log.verbose).to.have.been.calledWithMatch('removeGitSince', 'removed 1 packages')
      })
    })
  })
})
