
module.exports.run = function(config, cb) {
	var u = require('../util');

	var stylus = require('stylus');
	var vinyl = require('vinyl-fs');
	var map = require('map-stream');
	var uglify = require('uglifycss');

	var out = config.styl_dest.replace(config.output, '');
	out = require('path').join(config.output, config.timestamp, out);

	vinyl
		.src(require('path').join(config.styl_src, '*.styl'))
		.pipe(map(function(file, cb) {
			stylus.render(file.contents.toString('utf8'), {
				'basePath': config.styl_src,
				'filename': file.path
			}, function(err, res) {
				if(err)
					return cb(err);

				file.contents = new Buffer(res);
				file.path = file.path.replace('.styl', '.css');
				cb(null, file);
			});
		}))
		.pipe(map(function(file, cb) {
			var str = file.contents.toString('utf8');
			var res = str;
			if(config.minify)
				res = uglify.processString(str);
			res = res.replace(/\'\/img\//g, '\'/' + config.timestamp + '/img/');
			res = res.replace(/\"\/img\//g, '\"/' + config.timestamp + '/img/');
			file.contents = new Buffer(res);
			cb(null, file);
		}))
		.on('error', function(err) {
			u.log.error('Stylus error', err);
		})
		.on('end', function(err) {
			u.log('Stylus update complete');
			cb && cb(err);
		})
		.pipe(vinyl.dest(out));
};
