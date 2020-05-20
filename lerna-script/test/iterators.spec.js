const {expect} = require('chai'),
  {asBuilt, asGitCommited} = require('./utils'),
  sinon = require('sinon'),
  {aLernaProjectWith2Modules, loggerMock, aLernaProject} = require('lerna-script-test-utils'),
  index = require('..'),
  Promise = require('bluebird'),
  invertPromise = require('invert-promise')

describe('iterators', () => {
  ;['forEach', 'parallel', 'batched'].forEach(type => {
    describe(type, () => {
      it('should filter-out changed packages', async () => {
        const project = await asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: type})
        const log = loggerMock()
        let processedPackagesCount = 0

        return project.within(async () => {
          const packages = await index.loadPackages()
          index.changes.unbuild(packages.find(p => p.name === 'b'))(type)

          return index.iter[type](packages, {build: type, log})(
            () => processedPackagesCount++
          ).then(() => {
            expect(processedPackagesCount).to.equal(1)
            expect(log.info).to.have.been.calledWithMatch(
              'filter',
              'filtered-out 1 of 2 built packages'
            )
          })
        })
      })

      it('should mark modules as built if "build" is provided', async () => {
        const project = await aLernaProjectWith2Modules()
        return project.within(async () => {
          const packages = await index.loadPackages()

          return index.iter[type](packages, {build: type})(() => Promise.resolve()).then(() => {
            packages.forEach(lernaPackage =>
              expect(index.changes.isBuilt(lernaPackage)(type)).to.equal(true)
            )
          })
        })
      })

      it('should not mark as build on failure', async () => {
        const project = await aLernaProjectWith2Modules()
        return project.within(async () => {
          const packages = await index.loadPackages()

          return invertPromise(
            index.iter[type](packages, {build: type})(() => Promise.reject(new Error('woops')))
          ).then(() => {
            packages.forEach(lernaPackage =>
              expect(index.changes.isBuilt(lernaPackage)(type)).to.equal(false)
            )
          })
        })
      })
    })
  })

  describe('forEach', () => {
    it('should iterate through available packages', async () => {
      const task = sinon.spy()
      const log = loggerMock()

      const project = await aLernaProjectWith2Modules()
      return project.within(async () => {
        const packages = await index.loadPackages()

        return index.iter
          .forEach(packages, {log})((pkg, innerLog) => task(pkg.name) || innerLog.info(pkg.name))
          .then(() => {
            expect(task.getCall(0).args[0]).to.equal('a')
            expect(task.getCall(1).args[0]).to.equal('b')

            expect(log.newItem().info).to.have.been.called
          })
      })
    })
  })

  describe('parallel', () => {
    //TODO: verify async nature?
    it('should iterate through available packages', async () => {
      const task = sinon.spy()
      const log = loggerMock()

      const project = await aLernaProjectWith2Modules()
      return project.within(async () => {
        const packages = await index.loadPackages()

        return index.iter
          .parallel(packages, {log})((pkg, innerLog) => task(pkg.name) || innerLog.info(pkg.name))
          .then(() => {
            expect(task).to.have.been.calledWith('a')
            expect(task).to.have.been.calledWith('b')

            expect(log.newGroup().newItem().info).to.have.been.called
          })
      })
    })

    it('should respect concurrency limit', async () => {
      // project with 20 modules
      const project = await aLernaProject(
        Array.from(Array(20).keys()).reduce((acc, idx) => ({...acc, [`package${idx}`]: []}), {})
      )
      let concurrentExecutions = 0

      return project.within(async () => {
        const packages = await index.loadPackages()
        return index.iter.parallel(packages, {concurrency: 3})(async () => {
          concurrentExecutions++
          expect(concurrentExecutions, 'concurrentExecutions').to.be.at.most(3)
          await Promise.delay(5 + Math.random() * 10)
          concurrentExecutions--
        })
      })
    })
  })

  describe('batched', () => {
    //TODO: verify batched nature
    it('should iterate through available packages', async () => {
      const task = sinon.spy()
      const log = loggerMock()
      const project = await aLernaProjectWith2Modules()

      return project.within(async () => {
        const packages = await index.loadPackages()

        return index.iter
          .batched(packages, {log})((pkg, innerLog) => task(pkg.name) || innerLog.info(pkg.name))
          .then(() => {
            expect(task).to.have.been.calledWith('a')
            expect(task).to.have.been.calledWith('b')

            expect(log.newGroup().newItem().info).to.have.been.called
          })
      })
    })
  })
})
