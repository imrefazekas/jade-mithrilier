var fs = require('fs');
var gulp = require('gulp'),
	webpack = require("webpack"),
	gutil = require('gulp-util');

var mithrilier = require('jade-mithrilier');

gulp.task('mithril', function( cb ){
	var folder = './m/';

	var jadeContent = fs.readFileSync( folder + 'Content.jade', { encoding: 'utf8' });
	var mithrilView = mithrilier.generateMithrilJS( jadeContent );
	fs.writeFileSync( folder + 'Content.js', mithrilView.trim() + '\n', { encoding: 'utf8' } );

	cb();
});

var config = {
	cache: true,
	entry: './main.js',
	node: {
		fs: "empty"
	},
	output: {
		path: './',
		filename: './www/main.js',
		publicPath: './'
	},
	module: {
		noParse: [
			/Gulpfile\.js$/, /.\.json$/, /.\.txt$/, /\.gitignore$/, /\.jshintrc$/
		]
	},
	plugins: [ ]
};
gulp.task('webpack', function( callback ) {
	webpack( config, function(err, stats) {
		if(err){
			throw new global.gutil.PluginError("webpack", err);
		}
		gutil.log("[webpack]", stats.toString({
			// output options
		}));
		callback();
	});
});

gulp.task( 'default', [ 'mithril', 'webpack' ] );
