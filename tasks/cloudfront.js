
module.exports.run = function(config, cb) {
	cb = cb || function() {};
	if(!config.cloudfront_distribution_id)
		return cb();

	var _ = require('lodash');
	var u = require('../util');
	var aws = require('aws-sdk');

	aws.config.update({
		'accessKeyId': config.s3_key,
		'secretAccessKey': config.s3_secret
	});

	var cloudfront = new aws.CloudFront();
	u.log('Invalidating Cloudfront');
	cloudfront.createInvalidation({
		'DistributionId': config.cloudfront_distribution_id,
		'InvalidationBatch': {
			'CallerReference': _.now().toString(),
			'Paths': {
				'Quantity': 1,
				'Items': ['/*']
			}
		}
	}, function(err, res) {
		if(err)
			u.log.error('Cloudfront error', err);
		else
			u.log('Cloudfront response', res);
		cb(err);
	});
};
