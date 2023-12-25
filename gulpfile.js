const gulp = require('gulp');

const del = require('del');
const browserify = require('gulp-browserify');
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const gulpUtil = require('gulp-util');

// var concat = require('gulp-concat');
// var jscs = require('gulp-jscs');
// var inlineImageBase64 = require('gulp-base64');
// var minifyCss = require('gulp-clean-css');
// var sass = require('gulp-sass');


var paths = {
    debug: ['./src/**/*.js', './src/index.html'],
};

gulp.task('default', ['debug']);


gulp.task('clean', function () {
    del(['./dist/assets', './dist/*'], {force: true}, null);
});

gulp.task('lint', function () {

    // gulp.src('./src/**/*.js')
    //     .pipe(jshint())
    //     .pipe(jshint.reporter('default'));
    //     //.pipe(jshint.reporter('fail'));

    // gulp.src('./src/app.js')
    //     .pipe(jshint())
    //     .pipe(jshint.reporter('default'));
    //     //.pipe(jshint.reporter('fail'));
});

gulp.task('debug', ['clean', 'lint'], function () {    
    gulp.src(['./src/index.html', './src/style.css'])
        .pipe(gulp.dest('./dist'));
    gulp.src('./src/3rdparty/**/*')
        .pipe(gulp.dest('./dist'));
    gulp.src('./src/assets/**/*')
        .pipe(gulp.dest('./dist/assets'));

    gulp.src(['./src/efw/efw-platform.js', './src/efw/**/*.js'])
        .pipe(concat('efw.min.js'))
        // .pipe(browserify({
        //     debug : true
        // }).on('error', function(err) { console.log( err.message ); }))
        .pipe(gulp.dest('./dist'));

    gulp.src('./src/app.js')
        // .pipe(browserify({
        //     debug : true
        // }).on('error', function(err) { console.log( err.message ); }))
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('release', ['clean', 'lint'], function () {
    gulp.src(['./src/index.html', './src/style.css'])
        .pipe(gulp.dest('./dist'));
    gulp.src('./src/3rdparty/**/*')
        .pipe(gulp.dest('./dist'));
    gulp.src('./src/assets/**/*')
        .pipe(gulp.dest('./dist/assets'));

    gulp.src(['./src/efw/**/*.js'])
        .pipe(concat('efw.min.js'))
        // .pipe(browserify({
        //     debug : false
        // }).on('error', function(err) { console.log( err.message ); }))
        .pipe(uglify({mangle: false}).on('error', gulpUtil.log))
        .pipe(gulp.dest('./dist'));

    gulp.src('./src/app.js')
        // .pipe(browserify({
        //     debug : false
        // }).on('error', function(err) { console.log( err.message ); }))
        .pipe(uglify({mangle: false}).on('error', gulpUtil.log))
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
    gulp.watch(paths.debug, ['debug']);
});
