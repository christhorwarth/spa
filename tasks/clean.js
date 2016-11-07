
var rimraf = require('rimraf');

module.exports.run = function(config, cb) {
	rimraf(config.output, cb);
};
