module.exports = {
  proxy: "localhost:3000",
  files: ["public/**/*.html", "public/**/*.css", "public/**/*.js"],
  watchEvents: ["change", "add"],
  watch: true,
  ignore: [],
  single: false,
  watchOptions: {
    ignoreInitial: true,
    ignored: [],
  },
  open: false,
  port: 3001,
  notify: false,
  reloadDelay: 50,
  reloadDebounce: 250,
};
