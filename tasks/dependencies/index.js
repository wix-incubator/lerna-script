const extraneous = require('./lib/extraneous'),
  sync = require('./lib/sync'),
  unmanaged = require('./lib/unmanaged'),
  latest = require('./lib/latest');

module.exports.sync = sync.task;
module.exports.unmanaged = unmanaged.task;
module.exports.extraneous = extraneous.task;
module.exports.latest = latest.task;