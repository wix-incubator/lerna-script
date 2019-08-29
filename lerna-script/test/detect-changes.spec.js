const {expect} = require('chai').use(require('sinon-chai')),
  {asBuilt, asGitCommited} = require('./utils'),
  {aLernaProjectWith2Modules, loggerMock} = require('lerna-script-test-utils'),
  index = require('..'),
  {join} = require('path'),
  {writeFileSync} = require('fs'),
  sinon = require('sinon')

describe('detect-changes', async () => {
  it('should not detect any changes for already marked modules', async () => {
    const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()))

    await project.within(async () => {
      const lernaPackages = await index.loadPackages()
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)()).to.equal(true)
      )
    })
  })

  it('should support scoped module names', () => {
    expect(() => asBuilt(asGitCommited(aLernaProjectWith2Modules('@foo/a')))).to.not.throw()
  })

  it('should detect changes recursively', async () => {
    const modules = await aLernaProjectWith2Modules()
    const project = await asBuilt(
      asGitCommited(modules.inDir(ctx => ctx.addFile('packages/a/test/test.js', '')))
    )

    return project.within(async ctx => {
      ctx.addFile('packages/a/test/test2.js', '')
      const lernaPackages = await index.loadPackages()
      const lernaPackage = lernaPackages.find(p => p.name === 'a')

      expect(index.changes.isBuilt(lernaPackage)()).to.equal(false)
    })
  })

  it('should detect uncommitted modules as changed', async () => {
    const project = await aLernaProjectWith2Modules()

    return project.within(async () => {
      const lernaPackages = await index.loadPackages()
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)()).to.equal(false)
      )
    })
  })

  it('should detect change in module', async () => {
    const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()))

    return project.within(async () => {
      const [aLernaPackage] = await index.loadPackages()
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe')

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
    })
  })

  it('should respect .gitignore in root', async () => {
    const projectWithGitIgnore = await aLernaProjectWith2Modules()
    const project = await asBuilt(
      asGitCommited(projectWithGitIgnore.inDir(ctx => ctx.addFile('.gitignore', 'some.txt\n')))
    )

    return project.within(async () => {
      const [aLernaPackage] = await index.loadPackages()
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe')

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true)
    })
  })

  it('should respect .gitignore in module dir', async () => {
    const projectWithGitIgnore = await aLernaProjectWith2Modules()

    const project = await asBuilt(
      asGitCommited(
        projectWithGitIgnore.inDir(ctx => ctx.addFile('packages/a/.gitignore', 'some.txt\n'))
      )
    )

    return project.within(async () => {
      const packages = await index.loadPackages()
      const aLernaPackage = packages.find(lernaPackage => lernaPackage.name === 'a')
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe')

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true)
    })
  })

  it('should unbuild a module', async () => {
    const log = loggerMock()
    const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()))

    return project.within(async () => {
      const [aLernaPackage] = await index.loadPackages()
      index.changes.unbuild(aLernaPackage, {log})()

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
      expect(log.verbose).to.have.been.calledWithMatch(
        'makePackageUnbuilt',
        'marking module unbuilt',
        sinon.match.object
      )
    })
  })

  it('should build a module', async () => {
    const log = loggerMock()
    const project = await asGitCommited(aLernaProjectWith2Modules())

    return project.within(async () => {
      const [aLernaPackage] = await index.loadPackages()

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
      index.changes.build(aLernaPackage, {log})()
      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true)
      expect(log.verbose).to.have.been.calledWithMatch(
        'makePackageBuilt',
        'marking module built',
        sinon.match.object
      )
    })
  })

  it('should respect label for makePackageBuilt', async () => {
    const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: 'woop'})

    return project.within(async () => {
      const lernaPackages = await index.loadPackages()
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)()).to.equal(false)
      )
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)('woop')).to.equal(true)
      )
    })
  })

  it('should respect label for makePackageUnbuilt', async () => {
    const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: 'woop'})

    return project.within(async () => {
      const [aLernaPackage] = await index.loadPackages()
      index.changes.unbuild(aLernaPackage)()
      expect(index.changes.isBuilt(aLernaPackage)('woop')).to.equal(true)

      index.changes.unbuild(aLernaPackage)('woop')
      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
    })
  })
})
