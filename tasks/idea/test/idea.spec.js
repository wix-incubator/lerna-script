const {loggerMock, aLernaProject} = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai').use(require('sinon-chai')),
  idea = require('..'),
  shelljs = require('shelljs')

describe('idea', async () => {
  it('should generate idea project files', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()
    return project.within(() => {
      return idea()(log).then(() => assertIdeaFilesGenerated())
    })
  })

  it('should generate idea project files for provided modules', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()

    return project.within(async () => {
      const packages = await loadPackages()
      const filteredPackages = packages.filter(p => p.name === 'a')
      return idea({packages: filteredPackages})(log).then(() => {
        expect(shelljs.test('-f', 'packages/a/a.iml')).to.equal(true)
        expect(shelljs.test('-f', 'packages/b/b.iml')).to.equal(false)
        expect(shelljs.test('-f', 'packages/c/c.iml')).to.equal(false)
      })
    })
  })

  it('should set language level to ES6', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()

    return project.within(() => {
      return idea()(log).then(() => {
        expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
          '<property name="JavaScriptLanguageLevel" value="ES6" />'
        )
      })
    })
  })

  it.skip('removes existing .idea project files before generating new ones', async () => {
    const log = loggerMock()

    const project = await aLernaProjectWith3Modules()
    project.addFile('.idea/some-existing-file.txt', 'qwe')

    return project.within(() => {
      return idea()(log).then(() => {
        expect(shelljs.test('-f', '.idea/some-existing-file.txt')).to.equal(false)
      })
    })
  })

  it('generates [module-name].iml with node_modules, dist excluded so idea would not index all deps', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()

    return project.within(() => {
      return idea()(log).then(() => {
        expect(shelljs.cat('packages/a/a.iml').stdout).to.be.string(
          '<excludeFolder url="file://$MODULE_DIR$/node_modules" />'
        )
        expect(shelljs.cat('packages/a/a.iml').stdout).to.be.string(
          '<excludeFolder url="file://$MODULE_DIR$/dist" />'
        )
      })
    })
  })

  it('generates [module-name].iml and marks test/tests as test root', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()

    project.addFolder('packages/a/test').addFolder('packages/a/tests')

    return project.within(() => {
      return idea()(log).then(() => {
        const imlFile = shelljs.cat('packages/a/a.iml').stdout
        expect(imlFile).to.be.string(
          '<sourceFolder url="file://$MODULE_DIR$/test" isTestSource="true" />'
        )
        expect(imlFile).to.be.string(
          '<sourceFolder url="file://$MODULE_DIR$/tests" isTestSource="true" />'
        )
      })
    })
  })

  it('generates [module-name].iml and marks src/lib/scripts as source roots', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()
    project
      .addFolder('packages/a/src')
      .addFolder('packages/a/lib')
      .addFolder('packages/a/scripts')

    return project.within(() => {
      return idea()(log).then(() => {
        const imlFile = shelljs.cat('packages/a/a.iml').stdout
        expect(imlFile).to.be.string(
          '<sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />'
        )
        expect(imlFile).to.be.string(
          '<sourceFolder url="file://$MODULE_DIR$/lib" isTestSource="false" />'
        )
        expect(imlFile).to.be.string(
          '<sourceFolder url="file://$MODULE_DIR$/scripts" isTestSource="false" />'
        )
      })
    })
  })

  context('mocha configurations', async () => {
    it('generates Mocha run configurations for all modules with mocha, extra options, interpreter and env set', async () => {
      const log = loggerMock()
      const project = await aLernaProjectWith3Modules()
      return project.within(() => {
        return idea()(log).then(() => {
          const node = shelljs
            .exec('which node')
            .stdout.split('/node/')[1]
            .replace('\n', '')

          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            `<data>$PROJECT_DIR$/packages/a/node_modules/mocha</data>`
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            `<property name="nodejs.mocha.mocha_node_package_dir" value="$PROJECT_DIR$/packages/a/node_modules/mocha" />`
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<configuration default="false" name="a" type="mocha-javascript-test-runner" factoryName="Mocha">'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<env name="DEBUG" value="wix:*" />'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<test-kind>PATTERN</test-kind>'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<test-pattern>test/**/*.spec.js test/**/*.it.js test/**/*.e2e.js</test-pattern>'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            `${node}</node-interpreter>`
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            `$PROJECT_DIR$/packages/a</working-directory>`
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<extra-mocha-options>--exit</extra-mocha-options>'
          )
        })
      })
    })

    it('respects custom mocha config', async () => {
      const log = loggerMock()
      const mochaConfig = packageJson => [
        {
          name: packageJson.name + 'custom',
          environmentVariables: {
            NODEBUG: 'woop',
            GUBEDON: 'poow'
          },
          extraOptions: 'woo-extra',
          testKind: 'PATTERN_woo',
          testPattern: 'test-pattern-woo'
        }
      ]

      const project = await aLernaProject({a: []})

      return project.within(() => {
        return idea({mochaConfigurations: mochaConfig})(log).then(() => {
          const node = shelljs
            .exec('which node')
            .stdout.split('/node/')[1]
            .replace('\n', '')
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '$PROJECT_DIR$/packages/a/node_modules/mocha'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<configuration default="false" name="acustom" type="mocha-javascript-test-runner" factoryName="Mocha">'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.match(
            /<envs>\s*<env name="NODEBUG" value="woop" \/>\s*<env name="GUBEDON" value="poow" \/>\s*<\/envs>/g
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<test-kind>PATTERN_woo</test-kind>'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<test-pattern>test-pattern-woo</test-pattern>'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            `${node}</node-interpreter>`
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            `$PROJECT_DIR$/packages/a</working-directory>`
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<extra-mocha-options>woo-extra</extra-mocha-options>'
          )
        })
      })
    })

    it('does generate multiple mocha configs per module', async () => {
      const log = loggerMock()
      const mochaConfig = packageJson => [
        {name: packageJson.name + 'custom1'},
        {name: packageJson.name + 'custom2'}
      ]

      const project = await aLernaProject({a: []})

      return project.within(() => {
        return idea({mochaConfigurations: mochaConfig})(log).then(() => {
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<configuration default="false" name="acustom1" type="mocha-javascript-test-runner" factoryName="Mocha">'
          )
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
            '<configuration default="false" name="acustom2" type="mocha-javascript-test-runner" factoryName="Mocha">'
          )
        })
      })
    })

    it('does not generate mocha configuration if empty list is provided', async () => {
      const log = loggerMock()
      const project = await aLernaProject({a: []})

      return project.within(() => {
        return idea({mochaConfigurations: () => []})(log).then(() => {
          expect(shelljs.cat('.idea/workspace.xml').stdout).to.not.be.string(
            '<configuration default="false" name="a" type="mocha-javascript-test-runner" factoryName="Mocha">'
          )
        })
      })
    })

    context('mocha module resolution', async () => {
      it('uses mocha from root node_modules if mocha package is present', async () => {
        const log = loggerMock()
        const project = await aLernaProject({a: []})

        return project.within(ctx => {
          ctx.addFolder('node_modules/mocha')

          return idea()(log).then(() => {
            expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
              '$PROJECT_DIR$/node_modules/mocha'
            )
          })
        })
      })

      it('uses mocha from one of modules if present', async () => {
        const log = loggerMock()
        const project = await aLernaProject({a: [], b: []})

        return project.within(ctx => {
          ctx.addFolder('packages/b/node_modules/mocha')

          return idea()(log).then(() => {
            expect(shelljs.cat('.idea/workspace.xml').stdout).to.be.string(
              '$PROJECT_DIR$/packages/b/node_modules/mocha'
            )
          })
        })
      })
    })
  })

  it('adds modules to groups if they are in subfolders', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()

    return project.within(() => {
      return idea()(log).then(() => {
        const modulesXml = shelljs.cat('.idea/modules.xml').stdout

        expect(modulesXml).to.be.string('group="packages"')
        expect(modulesXml).to.not.be.string('group="a"')
        expect(modulesXml).to.not.be.string('group="b"')
      })
    })
  })

  it('creates git-based ./idea/vcs.xml', async () => {
    const log = loggerMock()
    const project = await aLernaProjectWith3Modules()
    return project.within(() => {
      return idea()(log).then(() => {
        expect(shelljs.cat('.idea/vcs.xml').stdout).to.be.string(
          '<mapping directory="$PROJECT_DIR$" vcs="Git" />'
        )
      })
    })
  })

  function aLernaProjectWith3Modules() {
    return aLernaProject({a: [], b: ['a'], c: ['a']})
  }

  function assertIdeaFilesGenerated() {
    expect(shelljs.test('-d', '.idea')).to.equal(true)
    expect(shelljs.test('-f', '.idea/workspace.xml')).to.equal(true)
    expect(shelljs.test('-f', '.idea/vcs.xml')).to.equal(true)
    expect(shelljs.test('-f', '.idea/modules.xml')).to.equal(true)
    expect(shelljs.test('-f', 'packages/a/a.iml')).to.equal(true)
    expect(shelljs.test('-f', 'packages/b/b.iml')).to.equal(true)
    expect(shelljs.test('-f', 'packages/c/c.iml')).to.equal(true)
  }
})
