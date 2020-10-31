const fs = require('fs'),
  handlebars = require('handlebars').create()

require.extensions['.tmpl'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8')
}

const modulesTemplate = handlebars.compile(require('../files/modules.xml.tmpl'))
const moduleImlTemplate = handlebars.compile(require('../files/module.iml.tmpl'))
const rootModuleImlTemplate = handlebars.compile(require('../files/root_module.iml.tmpl'))
const workspaceXmlTemplate = handlebars.compile(require('../files/workspace.xml.tmpl'))

module.exports.ideaModulesFile = function (targetFile, modules, options) {
  const content = modulesTemplate({modules: modules, options})
  fs.writeFileSync(targetFile, content)
}

module.exports.ideaModuleImlFile = function (targetFile, config) {
  const content = moduleImlTemplate({config})
  fs.writeFileSync(targetFile, content)
}

module.exports.ideaRootModuleImlFile = function (targetFile) {
  const content = rootModuleImlTemplate({})
  fs.writeFileSync(targetFile, content)
}

module.exports.ideaWorkspaceXmlFile = function (targetFile, config) {
  const content = workspaceXmlTemplate({config})
  fs.writeFileSync(targetFile, content)
}
