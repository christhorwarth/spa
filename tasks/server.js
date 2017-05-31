
var u = require('../util');
var request = require('request');
var _ = require('lodash');

module.exports.run = function(config, cb) {
	if(config.package)
		return cb && cb();

	var express = require('express');
	var app = express();

	app.use(function(req, res, next) {
		req.rawBody = '';
		req.setEncoding('utf8');
		req.on('data', function(chunk) { 
			req.rawBody += chunk;
		});

		req.on('end', function() {
			next();
		});
	});

	_.forEach(config.proxy, function(proxy) {
		app.all(proxy.base + '*', function(req, res, next) {
			req = req || {};
			var reqHeaders = _.pick(req.headers, [
				'content-type',
				'x-admin-auth-token',
				'x-admin-user-id',
				'x-loc-lat',
				'x-loc-lng'
			]);

			var headers = _.extend({}, reqHeaders, proxy.headers || {});
			console.log('proxying', proxy.url + req.originalUrl, headers)
			request({
				'method': req.method,
				'headers': headers,
				'body': req.rawBody,
				'url': proxy.url + req.originalUrl,
				'strictSSL': false
			}, function(err, _res, body) {
				_res = _res || {};
				if(!_res.headers)
					_res.headers = {};
				if(!_res.statusCode)
					_res.statusCode = 509;
				if(!body)
					body = '';
				res.set(_res.headers);
				res.status(_res.statusCode).send(body);
			});
		});
	});

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
