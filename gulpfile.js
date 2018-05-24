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


gulp.task('html:copy', () => {
    return gulp.src('./src/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('html:gzip', () => {
    return gulp.src('./src/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gzip())
        .pipe(gulp.dest('./dist'));
});

gulp.task('html', ['html:copy', 'html:gzip']);

gulp.task('html', ['html:copy', 'html:gzip']);

gulp.task('css:copy', () => {
    return gulp.src(['./src/css/styles.css', './src/css/responsive.css'])
        .pipe(concat('styles.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('css:gzip', () => {
    return gulp.src(['./src/css/styles.css', './src/css/responsive.css'])
        .pipe(concat('styles.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gzip())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('css', ['css:copy', 'css:gzip']);

gulp.task('js-main:copy', () => {
    return gulp.src(['./src/js/localforage.min.js', './src/js/dbhelper.js', './src/js/main.js'])
        .pipe(concat('main.js'))
        /*.pipe(babel({
			presets: ['env']
        }))
        .pipe(babelMinify({
            mangle: {
              keepClassName: true
            }
        }))*/
        .pipe(gulp.dest('./dist/js'));
});


gulp.task('js-main:gzip', () => {
    return gulp.src(['./src/js/localforage.min.js', './src/js/dbhelper.js', './src/js/main.js'])
        .pipe(concat('main.js'))
        /*.pipe(babel({
			presets: ['env']
        }))
        .pipe(babelMinify({
            mangle: {
              keepClassName: true
            }
        }))*/
        .pipe(gzip())
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('js-main', ['js-main:copy', 'js-main:gzip']);

gulp.task('js-restaurant:copy', () => {
    return gulp.src(['./src/js/localforage.min.js', './src/js/dbhelper.js', './src/js/restaurant_info.js'])
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

gulp.task('js-restaurant:gzip', () => {
    return gulp.src(['./src/js/localforage.min.js', './src/js/dbhelper.js', './src/js/restaurant_info.js'])
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

gulp.task('js-restaurant', ['js-restaurant:copy', 'js-restaurant:gzip']);

gulp.task('js', ['js-main', 'js-restaurant']);

gulp.task('sw:copy', () => {
    return gulp.src('./src/sw.js')
        .pipe(gulp.dest('./dist'))
});

gulp.task('sw:gzip', () => {
    return gulp.src('./src/sw.js')
        .pipe(gzip())
        .pipe(gulp.dest('./dist'))
});

gulp.task('sw', ['sw:copy', 'sw:gzip']);

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

gulp.task('js', ['js-main', 'js-restaurant']);

gulp.task('build', ['html', 'css', 'js']);
