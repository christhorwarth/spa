
var u = require('../util');
var multiline = require('multiline');

var template = multiline.stripIndent(function() {/*
	window.require.register('{{{path}}}', function(module, exports, global) {
		{{{data}}};
	});
*/});

var requireInclude = multiline.stripIndent(function() {/*
	var modules = {};
	var global = window;

	global.require = function(path) {
		if(path && path.indexOf('.js') === -1)
			path += '.js';
		if(require.cache[path])
			return require.cache[path];

		var module = {
			'exports': {}
		};

		if(typeof modules[path] == 'function') {
			modules[path](module, module.exports, global);
			modules[path] = module;
		}

		if(!modules[path])
			throw Error('Cannot find module: ' + path);
		require.cache[path] = modules[path].exports;
		return require.cache[path];
	};

	require.cache = {};

	require.register = function(path, fn) {
		modules[path] = fn;

		var chunk = require;
		var chain = [];
		var chunks = path.split('/');
		for(var i=0; i<chunks.length; i++) {
			chain.push(chunks[i]);
			if(!chunk[chunks[i]]) {
				chunk[chunks[i]] = (function(chain) {
					return function(id) {
						id = id || '';
						return require(chain + id);
					};
				})(chain.join('/') + '/');
			}
		}
	};

*/});

module.exports.run = function(config, cb) {
	var vinyl = require('vinyl-fs');
	var map = require('map-stream');
	var out = config.js_dest.replace(config.output, '');
	out = require('path').join(config.output, config.timestamp, out);

	vinyl
		.src(require('path').join(config.js_src, '*.js'))
		.pipe(map(function(file, cb) {
			processFile(file, config, cb);
		}))
		.on('error', function(err) {
			u.log.error('JS error', err);
		})
		.on('end', function(err) {
			u.log('JS update complete');
			cb && cb(err);
		})
		.pipe(vinyl.dest(out));
};

var processFile = function(file, config, cb) {
	var async = require('async');
	var fs = require('fs');
	var _ = require('lodash');
	var jade = require('jade');
	var uglify = require('uglify-js');

	var mustache = require('mustache');
	var Module = module.constructor;

	var m = new Module();
	fn = file.contents.toString('utf8');
	m._compile(fn, _.uniqueId());

	var build = m.exports;
	var out = [];
	var wrap = !!build.require;

	if(wrap)
		out.push(requireInclude);

	async.eachSeries(build, function(file, next) {
		var run = _.endsWith(file, ' > run');
		file = file.split(' > run').shift();
		var templ = _.endsWith(file, ' > template');
		file = file.split(' > template').shift();

		var ext = templ ? '.jade' : '.js';
		if(!_.endsWith(file, ext))
			file += ext;

		var path = require('path').join(config.js_src, file);
		if(templ)
			path = require('path').join(config.jade_src, file);

		fs.readFile(path, 'utf8', function(err, res) {
			if(err)
				return next(err);

			if(templ) {
				res = 'module.exports = ' + jade.compileClient(res, {
					'pretty': false,
					'cache': false,
					'basedir': config.jade_src,
					'filename': path
				});
				file = 'template/' + file.replace('.jade', '.js');
			}

			if(wrap && !run) {
				res = mustache.render(template, {
					'data': res,
					'path': file.replace(/\/+/g, '/')
				});
			} else if(run)
				res = '(function() {' + res + '})()';

			out.push(res);
			next();
		});
	}, function(err) {
		if(err)
			return cb(err);

		out = out.join(';');
		if(config.minify) {
			out = uglify.minify(out, {
				'fromString': true,
				'mangle': true
			}).code;
		}

		file.contents = new Buffer(out);
		cb(null, file);
	});
};
