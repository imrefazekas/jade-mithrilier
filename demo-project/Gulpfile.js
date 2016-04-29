'use strict'

let fs = require('fs')
let gulp = require('gulp'),
	webpack = require('webpack'),
	gutil = require('gulp-util')

let mithrilier = require('pug-mithrilier')

gulp.task('mithril', function ( cb ) {
	let folder = './m/'

	let jadeContent = fs.readFileSync( folder + 'Content.jade', { encoding: 'utf8' })
	mithrilier.generateMithrilJS( folder + 'Content.jade', jadeContent, null, null, function (err, mithrilView) {
		if ( err ) return cb(err)

		fs.writeFileSync( folder + 'Content.js', mithrilView.trim() + '\n', { encoding: 'utf8' } )
		cb()
	} )
})

let config = {
	cache: true,
	entry: './main.js',
	node: {
		fs: 'empty'
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
}
gulp.task('webpack', function ( callback ) {
	webpack( config, function (err, stats) {
		if (err) {
			throw new global.gutil.PluginError('webpack', err)
		}
		gutil.log('[webpack]', stats.toString({
			// output options
		}))
		callback()
	})
})

gulp.task( 'default', [ 'mithril', 'webpack' ] )
