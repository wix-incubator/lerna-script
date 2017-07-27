const fs = require('fs'),
  handlebars = require('handlebars').create();

require.extensions['.tmpl'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

const modulesTemplate = handlebars.compile(require('../files/modules.xml.tmpl'));
const moduleImlTemplate = handlebars.compile(require('../files/module.iml.tmpl'));
const workspaceXmlTemplate = handlebars.compile(require('../files/workspace.xml.tmpl'));

module.exports.ideaModulesFile = function(targetFile, modules) {
  const content = modulesTemplate({modules: modules});
  fs.writeFileSync(targetFile, content);
};

module.exports.ideaModuleImlFile = function(targetFile, sourceFolders) {
  const content = moduleImlTemplate({sourceFolders: sourceFolders});
  fs.writeFileSync(targetFile, content);
};

module.exports.ideaWorkspaceXmlFile = function(targetFile, config) {
  const content = workspaceXmlTemplate({config});
  fs.writeFileSync(targetFile, content);
};
