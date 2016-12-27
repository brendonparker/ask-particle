var gulp   = require('gulp');
var lambda = require('gulp-awslambda');
var zip    = require('gulp-zip');

gulp.task('default', function() {
	return gulp.src('src/**')
		.pipe(zip('archive.zip'))
		.pipe(lambda('particle', { region: 'us-east-1', profile: 'bp' }))
		.pipe(gulp.dest('.'));
});