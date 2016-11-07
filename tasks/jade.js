
module.exports.run = function(config, cb) {
	if(config.disable_jade)
		return cb();

	var u = require('../util');

	var jade = require('jade');
	var vinyl = require('vinyl-fs');
	var map = require('map-stream');
	var multiline = require('multiline');
	var _ = require('lodash');

	var mixins = multiline.stripIndent(function() {/*

		mixin script(id)
			script(src=cdn.timestamp('/js/' + id + '.js'))

		mixin css(id)
			link(rel='stylesheet', href=cdn.timestamp('/css/' + id + '.css'))

		mixin setting(name, val)
			.setting(data-id=name, data-val=JSON.stringify(val))

	*/});

	vinyl
		.src(require('path').join(config.jade_src, '*.jade'))
		.pipe(map(function(file, cb) {
			var cdn = function(url) {
				return cdn.base + url;
			};

			cdn.timestamp = function(url) {
				return cdn.base + '/' + config.timestamp + url;
			};

			cdn.base = config.cdn_base_url || '';

			var locals = _.merge(config.locals, {
				'pretty': !config.minify,
				'filename': file.path,
				'timestamp': config.timestamp,
				'cdn': cdn
			});


			jade.render(mixins + file.contents.toString('utf8'), locals, function(err, res) {
				if(err)
					return cb(err);

				file.contents = new Buffer(res);
				file.path = file.path.replace('.jade', '.html');
				file.path = file.path.replace(/\_\_/g, '/');
				if(!_.endsWith(file.path, 'index.html')) {
					file.path = file.path.replace('.html', '/index.html');
				}
				cb(null, file);
			});
		}))
		.on('error', function(err) {
			u.log.error('Stylus error', err);
		})
		.on('end', function(err) {
			u.log('Jade update complete');
			cb && cb(err);
		})
		.pipe(vinyl.dest(config.jade_dest));
};
