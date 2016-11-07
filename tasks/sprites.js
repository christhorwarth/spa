
var _ = require('lodash');
var u = require('../util');

var Sprites = function() {
	var api = {};
	var sprites = {};

	api.create = function(id) {
		if(sprites[id])
			return sprites[id];

		var sprite = sprites[id] = {};
		sprite.img = function(id, path) {
			sprite.images = sprite.images || {};
			sprite.images[id] = path;
			return sprite;
		};

		sprite.id = function() {
			return id;
		};

		return sprite;
	};

	api.get = function(id) {
		if(_.isUndefined(id))
			return sprites;
		return sprites[id];
	};

	return api;
};

module.exports.run = function(config, cb) {
	u.log('Generating sprites');

	var sprites = Sprites();
	try {
		require(config.sprite_map).run(sprites.create);
	} catch(e) {
		u.log.error('Missing sprites map file.');
		return cb && cb();
	}

	var spritesmith = require('spritesmith');
	var mustache = require('mustache');
	var fs = require('fs');
	var path = require('path');
	var multiline = require('multiline');
	var async = require('async');

	var size = function(size) {
		return Math.ceil(size / 2) + 'px';
	};

	var styl = path.join(config.styl_src, 'sprites.styl');
	var out = [];

	out.push(multiline.stripIndent(function() {/*
	.sprite
		display block
		overflow hidden
		background-repeat no-repeat
	*/}));

	var template = multiline(function() {/*

	&.{{id}}
		background-image url('{{{img}}}')
		background-size {{width}} {{height}}
		{{#images}}

		&.{{id}}
			width {{width}}
			height {{height}}
			background-position {{x}} {{y}}
		{{/images}}
	*/});

	async.eachSeries(sprites.get(), function(sprite, next) {
		u.log('Generating sprite:', sprite.id());

		var img = path.join(config.img_src, 'sprites', sprite.id() + '.png');

		u.series()
						.step('sprite', function(res, next) {
							spritesmith.run({
								'src': _.chain(sprite.images).values().map(function(path) {
									if(!_.startsWith(path, '/')) {
										path = '/' + path;
									}

									path = config.img_src + path;
									return path;
								}).value(),
								'padding': 4
							}, next);
						})
						.step('img', function(res, next) {
							u.log('Writing', img);
							fs.writeFile(img, res.sprite.image, next);
						})
						.step('styl', function(res, next) {
							var data = {};
							data.id = sprite.id();
							data.width = size(res.sprite.properties.width);
							data.height = size(res.sprite.properties.height);
							data.img = '/img/sprites/' + sprite.id() + '.png';

							data.images = _.map(res.sprite.coordinates, function(coords, file) {
								coords.width += 2;
								coords.height += 2;

								var id;
								_.forEach(sprite.images, function(path, _id) {
									if(_.endsWith(file, path)) {
										id = _id;
									}

								});

								return {
									'id': id,
									'width': size(coords.width),
									'height': size(coords.height),
									'x': size(-1 * coords.x),
									'y': size(-1 * coords.y),
									'total': {
										'width': data.width,
										'height': data.height,
										'img': data.img
									}
								};
							});

							out.push(mustache.render(template, data));
							next();
						}).run(next);
	}, function(err) {
		if(err) {
			u.log.error('Sprite generation error', err);
			return cb && cb(err);
		}

		fs.writeFile(styl, out.join('\n'), function(err) {
			u.log('Sprite generation complete', err);
			if(err)
				return cb && cb(err);

			require('./img.js').compress({
				'compress_path': config.sprites_dest
			}, cb);
		});
	});
};
