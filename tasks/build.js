
var u = require('../util');

module.exports.run = function(config, cb) {
	u.series()
				.step('clean', function(res, next) {
					var _ = require('lodash');
					config.timestamp = _.now().toString();
					require('./clean').run(config, next);
				})
				.step('static', function(res, next) {
					require('./static').run(config, next);
				})
				.step('img', function(res, next) {
					require('./img').run(config, next);
				})
				.step('sprites', function(res, next) {
					if(!config.package)
						return next();
					require('./sprites').run(config, next);
				})
				.step('js', function(res, next) {
					require('./js').run(config, next);
				})
				.step('styl', function(res, next) {
					require('./styl').run(config, next);
				})
				.step('jade', function(res, next) {
					require('./jade').run(config, next);
				})
				.step('server', function(res, next) {
					if(config.local)
						return require('./server').run(config, next);
					next();
				})
				.step('watch', function(res, next) {
					if(config.local)
						return require('./watch').run(config, next);
					next();
				})
				.run(cb);
};
