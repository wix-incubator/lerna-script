const {expect} = require('chai'),
  {asBuilt, asGitCommited} = require('./utils'),
  {empty, aLernaProjectWith2Modules, loggerMock} = require('lerna-script-test-utils'),
  index = require('..')

describe('filters', function() {
  this.timeout(5000)

  describe('removeByGlob', () => {
    it('should filter-out packages by provided glob', () => {
      const log = loggerMock()
      const project = aLernaProjectWith2Modules()

      return project.within(() => {
        const lernaPackages = index.filters.removeByGlob(index.loadPackages(), {log})('a')
        expect(lernaPackages.map(p => p.name)).to.have.same.members(['b'])
        expect(log.verbose).to.have.been.calledWithMatch('removeByGlob', 'removed 1 packages')
      })
    })
  })

  describe('removeBuilt', () => {
    it('should not filter-out any packages for unbuilt project', () => {
      const project = aLernaProjectWith2Modules()

      return project.within(() => {
        const unbuiltLernaPackages = index.filters.removeBuilt(index.loadPackages())()
        expect(unbuiltLernaPackages.length).to.equal(2)
      })
    })

    it('should filter-out changed packages', () => {
      const log = loggerMock()
      const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()))

      return project.within(() => {
        const packages = index.loadPackages()
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

    it('should filter-out packages whose dependencies changed', () => {
      const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()))

      return project.within(() => {
        const lernaPackages = index.loadPackages()
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))()

        const unbuiltLernaPackages = index.filters.removeBuilt(lernaPackages)()
        expect(unbuiltLernaPackages.length).to.equal(1)
      })
    })

    it('should respect labels when filtering-out packages', () => {
      const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: 'woop'})

      return project.within(() => {
        const lernaPackages = index.loadPackages()

        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))()
        expect(index.filters.removeBuilt(lernaPackages)('woop').length).to.equal(0)

        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'b'))('woop')
        expect(index.filters.removeBuilt(lernaPackages)('woop').length).to.equal(1)
      })
    })

    it('should unmark dependents as built', () => {
      const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()))

      return project.within(ctx => {
        const lernaPackages = index.loadPackages()
        index.changes.unbuild(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'))()

        expect(index.filters.removeBuilt(lernaPackages)().length).to.equal(2)

        index.changes.build(lernaPackages.find(lernaPackage => lernaPackage.name === 'a'))()
        ctx.exec('sleep 1')
        expect(index.filters.removeBuilt(lernaPackages)().length).to.equal(1)
      })
    })
  })

  describe('filters.gitSince', () => {
    it('removes modules without changes', () => {
      const log = loggerMock()
      return empty()
        .addFile('package.json', {name: 'root', version: '1.0.0'})
        .addFile('lerna.json', {lerna: '2.0.0', packages: ['packages/**'], version: '0.0.0'})
        .module('packages/a', module => module.packageJson({name: 'a', version: '2.0.0'}))
        .module('packages/ba', module =>
          module.packageJson({name: 'ba', version: '1.0.0', dependencies: {b: '~1.0.0'}})
        )
        .inDir(ctx => {
          ctx.exec(
            'git init && git config user.email mail@example.org && git config user.name name'
          )
          ctx.exec('git add -A && git commit -am ok')
          ctx.exec('git checkout -b test')
        })
        .module('packages/b', module => module.packageJson({name: 'b', version: '1.0.0'}))
        .inDir(ctx => {
          ctx.exec('git add -A && git commit -am ok')
        })
        .within(() => {
          const lernaPackages = index.filters.gitSince(index.loadPackages(), {log})('master')

          expect(lernaPackages.map(p => p.name)).to.have.same.members(['b', 'ba'])
          expect(log.verbose).to.have.been.calledWithMatch('removeGitSince', 'removed 1 packages')
        })
    })
  })
})
