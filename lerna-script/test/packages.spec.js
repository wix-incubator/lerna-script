const {expect} = require('chai').use(require('sinon-chai')),
  {aLernaProjectWith2Modules, aLernaProject, loggerMock} = require('lerna-script-test-utils'),
  index = require('..'),
  sinon = require('sinon')

describe('packages', () => {
  describe('loadPackages', () => {
    it('should return a list of packages', async () => {
      const log = loggerMock()

      await aLernaProjectWith2Modules().within(async () => {
        const packages = await index.loadPackages({log})

        expect(packages.length).to.equal(2)
        expect(log.verbose).to.have.been.calledWithMatch(
          'loadPackages',
          'using default packageConfigs',
          sinon.match.object
        )
      })
    })

    it('should accept custom package configs', async () => {
      const log = loggerMock()

      await aLernaProjectWith2Modules().within(async () => {
        const packages = await index.loadPackages({log, packageConfigs: ['packages/a']})

        expect(packages.map(p => p.name)).to.have.same.members(['a'])
        expect(log.verbose).to.have.been.calledWithMatch(
          'loadPackages',
          'using provided packageConfigs',
          sinon.match.object
        )
      })
    })

    it('should return topo-sorted packages', async () => {
      await aLernaProject({
        a: ['b'],
        b: ['c'],
        c: ['d'],
        d: []
      }).within(async () => {
        const packages = await index.loadPackages()
        expect(packages.map(p => p.name)).to.deep.equal(['d', 'c', 'b', 'a'])
      })
    })
  })

  describe('loadRootPackage', () => {
    it('should return a root package', () => {
      const log = loggerMock()

      return aLernaProjectWith2Modules().within(() => {
        const rootPackage = index.loadRootPackage({log})

        expect(rootPackage.name).to.equal('root')
        expect(rootPackage.location).to.equal(process.cwd())
        expect(log.verbose).to.have.been.calledWithMatch('loadRootPackage', sinon.match.object)
      })
    })
  })
})
