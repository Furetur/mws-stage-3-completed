const gulp = require('gulp');

const htmlmin = require('gulp-htmlmin');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const babelMinify = require('gulp-babel-minify');
const gzip = require('gulp-gzip');
const gm = require('gulp-gm');
const rename = require('gulp-rename');


function _copy(filename, foldername, additionalStep) {
    const sourcePath = foldername? `${foldername}/${filename}` : filename;
    const destPath = foldername? '/' + foldername : '';

    if (additionalStep) {
        return gulp.src(`./src/${sourcePath}`)
            .pipe(additionalStep())
            .pipe(gulp.dest(`./dist${destPath}`));
    }

    return gulp.src(`./src/${sourcePath}`)
        .pipe(gulp.dest(`./dist${destPath}`));

}


function _gzip(filename, foldername) {
    return _copy(filename, foldername, gzip);
}


gulp.task('minify-html', () => {
    return gulp.src('./src/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gzip())
        .pipe(gulp.dest('./dist'));
});


gulp.task('html:copy', () => {
    return _copy('*.html');
});

gulp.task('html:gzip', () => {
    return _gzip('*.html');
});

gulp.task('html', ['html:copy', 'html:gzip']);

gulp.task('minify-css', () => {
    return gulp.src(['./src/css/styles.css', './src/css/responsive.css'])
        .pipe(concat('styles.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gzip())
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
        .pipe(gzip())
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
        .pipe(gzip())
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('sw:copy', () => {
    return gulp.src('./src/sw.js')
        .pipe(gulp.dest('./dist'))
});

gulp.task('sw:gzip', () => {
    return gulp.src('./src/sw.js')
        .pipe(gzip())
        .pipe(gulp.dest('./dist'))
});

gulp.task('icon-192', () => {
    return gulp.src('./src/icon.png')
        .pipe(gm(gmfile => gmfile.resize(192)))
        .pipe(rename('icon-192.png'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('icon-512', () => {
    return gulp.src('./src/icon.png')
        .pipe(gm(gmfile => gmfile.resize(512)))
        .pipe(rename('icon-512.png'))
        .pipe(gulp.dest('./dist'));
})

gulp.task('sw', ['sw:copy', 'sw:gzip']);

gulp.task('minify-js', ['js-main', 'js-restaurant']);

gulp.task('build', ['minify-html', 'minify-css', 'minify-js']);
