const gulp = require('gulp');

const htmlmin = require('gulp-htmlmin');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const babelMinify = require('gulp-babel-minify');


gulp.task('minify-html', () => {
    return gulp.src('./src/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minify-css', () => {
    return gulp.src(['./src/css/styles.css', './src/css/responsive.css'])
        .pipe(concat('styles.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('js-main', () => {
    return gulp.src(['./src/js/dbhelper.js', './src/js/main.js'])
        .pipe(concat('main.js'))
        .pipe(babel({
			presets: ['env']
        }))
        .pipe(babelMinify({
            mangle: {
              keepClassName: true
            }
        }))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('js-restaurant', () => {
    return gulp.src(['./src/js/dbhelper.js', './src/js/restaurant_info.js'])
        .pipe(concat('restaurant.js'))
        .pipe(babel({
			presets: ['env']
        }))
        .pipe(babelMinify({
            mangle: {
              keepClassName: true
            }
        }))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('minify-js', ['js-main', 'js-restaurant']);

gulp.task('build', ['minify-html', 'minify-css', 'minify-js']);
