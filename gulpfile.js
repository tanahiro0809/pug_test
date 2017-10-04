const browserVersion = [
  'Android >= 4.4',
  'Chrome >= 57',
  'ChromeAndroid >= 57',
  'Edge >= 14',
  'Firefox >= 52',
  'ie 11',
  'iOS >= 9',
  'Safari >= 9'
];

const port = {};
port.http = 33556;
port.https = 43556;

// 以降は触らない

const SRC_DIR = `src`;
const DIST_DIR = `dist`;

const autoprefixer = require(`gulp-autoprefixer`);
const connectSSI = require(`connect-ssi`);
const webserver = require(`gulp-webserver`);
const gulp = require(`gulp`);
const pug = require(`gulp-pug`);
const data = require(`gulp-data`);
const htmlhint = require(`gulp-htmlhint`);
const notify = require(`gulp-notify`);
const path = require(`path`);
const plumber = require(`gulp-plumber`);
const header = require(`gulp-header`);
const sass = require(`gulp-sass`);
const cmq = require(`gulp-combine-media-queries`);
const fs = require(`fs`);

//sass
gulp.task(`sass`, function() {
  return gulp.src(`${SRC_DIR}/**/*.scss`)
  .pipe(plumber({
    errorHandler: notify.onError(`sassにエラーがあります`)
  }))
  .pipe(sass({
    outputStyle: `compact`
  }))
  .pipe(autoprefixer({
    browsers: browserVersion,
    cascade: false
  }))
  .pipe(cmq({
    log: true
  }))
  .pipe(header('@charset "UTF-8";\n\n'))
  .pipe(gulp.dest(`./${DIST_DIR}`))
  .pipe(notify(`Sassをコンパイルしました`));
});


gulp.task(`pug`, function() {
  // JSONファイルの読み込み。
  var locals = {
    'site': JSON.parse(fs.readFileSync('./src/http/data/site.json'))
  }
  return gulp.src(
     [`${SRC_DIR}/**/*.pug`,'!' + `${SRC_DIR}/**/_*.pug`]
  )
  .pipe(plumber({
    errorHandler: notify.onError(`pugにエラーがあります`)
  }))
  .pipe(data(function(file) {
    locals.relativePath = path.relative(file.base, file.path.replace(/.pug$/, '.html'));
      return locals;
  }))
  .pipe(pug({
    locals: locals,
    baseDir: `${DIST_DIR}/http`,
    pretty: true
  }))
  .pipe(gulp.dest(`${DIST_DIR}`))
  .pipe(notify(`pugをコンパイルしました`))
});

//html-hint
gulp.task(`html-hint`, function() {
  gulp.src([`${DIST_DIR}/**/*.html`, `!${DIST_DIR}/**/ssi/**/*.html`])
  .pipe(htmlhint())
  .pipe(htmlhint.reporter());
});

// server
gulp.task(`server`, function() {
  gulp.src(`${DIST_DIR}/http`)
    .pipe(webserver({
      host: `localhost`,
      port: port.http,
      middleware: [
        connectSSI({
          baseDir: `${DIST_DIR}/http`,
          ext: `.html`
        })
      ]
    }));

  gulp.src(`${DIST_DIR}/https`)
    .pipe(webserver({
      host: `localhost`,
      port: port.https,
      middleware: [
        connectSSI({
          baseDir: `${DIST_DIR}/https`,
          ext: `.html`
        })
      ]
    }));
});

// watch
gulp.task(`watch`, function(){
  gulp.watch(`${SRC_DIR}/**/*.scss`, [`sass`]);
  gulp.watch(`${SRC_DIR}/**/*.pug`, [`pug`]);
  gulp.watch(`${DIST_DIR}/**/*.html`, [`html-hint`]);
});

// default
gulp.task(`default`,[`watch`, `server`, `sass`, `pug`]);
