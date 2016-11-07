
module.exports.run = function(config, cb) {
	var vinyl = require('vinyl-fs');
	vinyl
		.src(require('path').join(config.static_src, '**', '*.*'))
		.on('end', cb)
		.pipe(vinyl.dest(config.static_dest));	
};
