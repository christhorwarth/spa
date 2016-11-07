
var u = require('../util');

module.exports.run = function(config, cb) {
	if(config.package)
		return cb && cb();

	var express = require('express');
	var app = express();
	app.use(express.static(config.output, {
		'etag': false,
		'setHeaders': function(res) {
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		}
	}));

	app.get('*', function(req, res, next) {
		require('fs').readFile(require('path').join(config.output, 'index.html'), 'utf8', function(err, data) {
			res.send(data);
		});
	});

	app.listen(config.port);
	u.log('Listening on port', config.port);
	cb();
};
