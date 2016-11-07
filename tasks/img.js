
module.exports.run = function(config, cb) {
	var vinyl = require('vinyl-fs');
	var out = config.img_dest.replace(config.output, '');
	out = require('path').join(config.output, config.timestamp, out);

	vinyl
		.src(require('path').join(config.img_src, '**', '*'))
		.on('end', cb)
		.pipe(vinyl.dest(out));
};

module.exports.compress = function(config, cb) {
	var dir = require('node-dir');
	var Imagemin = require('imagemin');
	var _ = require('lodash');

	var u = require('../util');
	u.log('Compressing images');

	var path = config.img_src;
	if(config.compress_path)
		path = config.compress_path;

	dir.files(path, function(err, files) {
		if(err) {
			return log.debug('Err', err);
		}

		if(_.isEmpty(files))
			return cb && cb();

		var min = new Imagemin();
		min
			.src(files)
			.dest(function(file) {
				u.log(file.path);
				return file.base;
			})
			.use(Imagemin.jpegtran({
				'progressive': true
			}))
			.use(Imagemin.optipng({
				'optimizationLevel': 3
			}))
			.use(Imagemin.gifsicle({
				'interlaced': true
			}))
			.use(Imagemin.svgo())
			.run(function(err, files) {
				if(err) {
					u.log.error('Error compressing', err);
					return cb && cb(err);
				}

				u.log('compressed', files);
				cb && cb();
			});
	});
};