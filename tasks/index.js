var path = require("path");

module.exports = function (grunt) {
  return grunt.registerMultiTask("liquid", "Compile liquid templates.", function () {

    var done = this.async();
    var engine = require("./lib/liquid-ext")();
    var options = this.options({
      includes: ""
    });

    grunt.verbose.writeflags(options, "Options");

    if (options.filters) {
      engine.registerFilters(options.filters);
    }

    var templates = this.files.map(function (fp) {
      var srcFiles = fp.src;
      var content = grunt.file.read(srcFiles);
      var newpath = Array.isArray(fp.src) ? fp.src[0] : fp.src;
      var ext = path.extname(newpath);
      var dir = path.dirname(newpath);

      var parsePromise = engine.extParse(content, function (subFilepath, cb) {
        var found = false;
        var includes = options.includes;

        if (!Array.isArray(includes)) {
          includes = [includes];
        }

        includes.some(function(include) {
          var includePath = path.join(include, subFilepath + ext);

          if (grunt.file.exists(includePath)) {
            found = true;
            cb(null, grunt.file.read(includePath));
          }

          return found;
        });

        if (!found) {
          return cb("Not found.");
        }
      });

      return parsePromise.then(function (template) {
        return template.render(options).then(function (output) {
          grunt.file.write(fp.dest, output);
          return grunt.log.writeln("File \"" + fp.dest + "\" created.");
        })
        .catch(function (e) {
          return grunt.fail.warn(e);
        });
      })
      .catch(function (e) {
        grunt.log.error(e);
        return grunt.fail.warn("Liquid failed to compile " + srcFiles + ".");
      });
    });

    return Promise.all(templates).then(function (logs) {
      return Promise.all(logs);
    })
    .then(function () {
      return done();
    })
    .catch(function (e) {
      grunt.log.error(e);
      return done();
    });
  });
};

