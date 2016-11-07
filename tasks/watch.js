
module.exports.run = function(config, cb) {
	if(config.package)
		return cb && cb();

	var path = require('path');
	var _ = require('lodash');

	var watchers = [{
		'fn': require('./js.js').run,
		'path': path.join(config.js_src, '**', '*.js')
	}, {
		'fn': require('./js.js').run,
		'path': path.join(config.jade_src, '**', '*.jade')
	}, {
		'fn': require('./styl.js').run,
		'path': path.join(config.styl_src, '**', '*.styl')
	}, {
		'fn': require('./jade.js').run,
		'path': path.join(config.jade_src, '**', '*.jade')		
	}];

	_.forEach(watchers, function(watcher) {
		require('chokidar').watch(watcher.path, {
			'ignored': /[\/\\]\./,
			'persistent': true
		}).on('change', function() {
			watcher.fn(config);
		});
	});

	cb && cb();
};
