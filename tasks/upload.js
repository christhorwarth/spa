
var _ = require('lodash');

var type = function(file) {
	file = (file || '').toLowerCase();

	if(_.endsWith(file, '.html'))
		return 'text/html';
	if(_.endsWith(file, '.css'))
		return 'text/css';
	if(_.endsWith(file, '.json'))
		return 'application/json';
	if(_.endsWith(file, '.js'))
		return 'application/x-javascript';
	if(_.endsWith(file, '.png'))
		return 'image/png';
	if(_.endsWith(file, '.jpg'))
		return 'image/jpg';
	if(_.endsWith(file, '.eot'))
		return 'application/vnd.ms-fontobject';
	if(_.endsWith(file, '.svg'))
		return 'image/svg+xml';
	if(_.endsWith(file, '.ttf'))
		return 'application/font-sfnt';
	if(_.endsWith(file, '.woff'))
		return 'application/font-woff';
	if(_.endsWith(file, '.woff2'))
		return 'font/woff2';
	if(_.endsWith(file, '.txt'))
		return 'text/plain';
	if(_.endsWith(file, '.pdf'))
		return 'application/pdf';
	return 'application/octet-stream';
};

module.exports.run = function(config, cb) {
	var path = require('path');
	var glob = require('glob');
	var async = require('async');
	var aws = require('aws-sdk');
	var fs = require('fs');

	var u = require('../util');

	aws.config.update({
		'accessKeyId': config.s3_key,
		'secretAccessKey': config.s3_secret
	});

	var s3 = new aws.S3();

	glob(path.join(config.output, '**', '*.*'), function(err, files) {
		if(err)
			return cb(err);

		async.eachLimit(files, 10, function(file, next) {
			fs.readFile(file, function(err, buffer) {
				if(err) {
					return next(err);
				}

				var dest = file.replace(config.output, '');
				if(_.startsWith(dest, path.sep))
					dest = dest.slice(1);

				u.log('Uploading', dest);

				var mime = type(dest);
				var age = 60 * 60 * 24 * 365;
				if(mime == 'text/html') {
					age = 60 * 5;
				}

				s3.putObject({
					'ACL': 'public-read',
					'Bucket': config.s3_bucket,
					'Key': dest,
					'Body': buffer,
					'ContentType': mime,
					'CacheControl': 'max-age=' + age
				}, next);
			});

		}, function(err) {
			if(err)
				u.log.error('Uploading error', err);
			else
				u.log('Upload complete');
			cb && cb(err);
		});
	});
};
