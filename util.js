
module.exports.async = require('async');

module.exports.series = function() {
	var api = {};
	var steps = [];
	var res = {};

	api.step = function(id, fn) {
		steps.push([id, fn]);
		return api;
	};

	api.run = function(cb) {
		module.exports.async.eachSeries(steps, function(step, next) {
			step[1](res, function(err, out) {
				if(!err)
					res[step[0]] = out;
				next(err);
			});
		}, function(err) {
			cb && cb(err, res);
		});

		return api;
	};

	return api;
};

module.exports.parallel = function() {
	var api = {};
	var steps = [];
	var res = {};

	api.step = function(id, fn) {
		steps.push([id, fn]);
		return api;
	};

	api.run = function(cb) {
		module.exports.async.each(steps, function(step, next) {
			step[1](function(err, out) {
				if(!err)
					res[step[0]] = out;
				next(err);
			});
		}, function(err) {
			cb && cb(err, res);
		});

		return api;
	};

	return api;
};

module.exports.log = function() {
	console.log.apply(console, arguments);
};

module.exports.log.error = function() {
	console.error.apply(console, arguments);
};
