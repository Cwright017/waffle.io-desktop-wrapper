const gulp = require('gulp'),
    clean = require('gulp-clean'),
    install = require('gulp-install'),
    babel = require('gulp-babel'),
    packager = require('electron-packager'),
    runElectron = require("gulp-run-electron"),
    eslint = require('gulp-eslint'),
    appdmg = require('gulp-appdmg'),
    fs = require('fs');

const packageData = JSON.parse(fs.readFileSync('./package.json'));

gulp.task('clean', () => {
  return gulp.src('package', {read: false})
    .pipe(clean({force: true}));
});

gulp.task('copy-app', () => {
  return gulp.src(['app/**/*', 'images/**/*', 'main.js', 'package.json'], {base: '.'})
    .pipe(gulp.dest('package'));
});

gulp.task('install', () => {
  return gulp.src('./package/package.json')
    .pipe(install({production: true}));
});

gulp.task('precompile', () => {
  return gulp.src('./package/**/*.js')
          .pipe(babel({
              presets: ['es2015']
          }))
          .pipe(gulp.dest('./package'))
});

gulp.task('run', () => {
  gulp.src("./package")
  	.pipe(runElectron());
});

gulp.task('package', () => {
  const options = {
         dir: "./package",
         platform: "darwin",
         arch: "x64",
         icon: "./images/icon.icns",
         out: "./_packages",
         overwrite: true,
         asar: true,
         "app-version": packageData.version
     };
  packager(options, function done (err, appPath) {
         if(err) { return console.log(err); }
         return console.log('App created: ' + appPath);
  });
});

gulp.task('lint', function () {
    return gulp.src(['./app/**/*.js', 'main.js', '!*/node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('release', function() {
  return gulp.src(['apppackage.json'])
    .pipe(appdmg({
      source: 'apppackage.json',
      target: `./_packages/waffle.io-desktop-wrapper-darwin-x64/${packageData.name}-${packageData.version}.dmg`
    }));
});

gulp.task('watch', () => {
    gulp.watch(['./app/**/*', 'main.js'], ['start-dev']);
});

gulp.task('default', gulp.series('clean', 'lint', 'copy-app', 'install', 'precompile', 'package'));
gulp.task('start-dev', gulp.series('clean', 'lint', 'copy-app', 'install', 'precompile', 'run'));
gulp.task('start-dev-no-lint', gulp.series('clean', 'copy-app', 'install', 'precompile', 'run'));
gulp.task('lint', gulp.series('clean', 'lint'));
