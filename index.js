
var u = require('./util');

module.exports.run = function(config) {

	var join = require('path').join;
	var base = join(require.main.filename, '..');

	config = config || {};
	config.source = config.source || base;
	config.output = config.output || join(base, 'public');
	config.static_src = config.static_src || join(config.source, 'static');
	config.static_dest = config.static_dest || config.output;
	config.img_src = config.img_src || join(config.source, 'img');
	config.img_dest = config.img_dest || join(config.output, 'img');
	config.styl_src = config.styl_src || join(config.source, 'styl');
	config.styl_dest = config.styl_dest || join(config.output, 'css');
	config.port = config.port || 3003;
	config.jade_src = config.jade_src || join(config.source, 'jade');
	config.jade_dest = config.jade_dest || config.output;
	config.js_src = config.js_src || join(config.source, 'js');
	config.js_dest = config.js_dest || join(config.output, 'js');
	config.s3_bucket = config.s3_bucket || false;
	config.s3_key = config.s3_key || false;
	config.s3_secret = config.s3_secret || false;
	config.sprites_dest = config.sprites_dest || join(config.img_src, 'sprites');
	config.sprite_map = config.sprite_map || join(config.sprites_dest, 'map.js');
	config.locals = config.locals || {};
	config.disable_jade = config.disable_jade || false;

	var args = require('minimist')(process.argv.slice(2));
	args.spa = args.spa || 'build';

	config.package = (args.spa == 'package');
	if(!config.package)
		config.cdn_base_url = false;
	config.minify = config.minify || config.package || false;

	if(args.spa == 'build' || args.spa == 'package')
		return require('./tasks/build').run(config);

	if(args.spa == 'upload')
		return require('./tasks/upload').run(config);

	if(args.spa == 'compress')
		return require('./tasks/img').compress(config);

	if(args.spa == 'sprites')
		return require('./tasks/sprites').run(config);

	if(args.spa == 'deploy') {
		require('./tasks/build').run(config, function(err) {
			if(err)
				return u.log.error('Build error', err);
			require('./tasks/upload').run(config);
		});
	}

	u.log.error('Invalid SPA command');
};
