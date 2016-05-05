(function() {
  var path;

  path = require("path");

  module.exports = function(grunt) {
    return grunt.registerMultiTask("liquid", "Compile liquid templates.", function() {
      var done, engine, options;
      done = this.async();
      engine = require("./lib/liquid-ext")();
      options = this.options({
        includes: ""
      });
      grunt.verbose.writeflags(options, "Options");
      if (options.filters) {
        engine.registerFilters(options.filters);
      }
      return this.files.forEach(function(fp) {
        var content, dir, ext, newpath, parsePromise, srcFiles;
        srcFiles = fp.src;
        content = grunt.file.read(srcFiles);
        newpath = Array.isArray(fp.src) ? fp.src[0] : fp.src;
        ext = path.extname(newpath);
        dir = path.dirname(newpath);
        parsePromise = engine.extParse(content, function(subFilepath, cb) {
          var found, includes;
          includes = options.includes;
          if (!Array.isArray(includes)) {
            includes = [includes];
          }
          found = false;
          includes.some(function(include) {
            var includePath;
            includePath = path.join(include, subFilepath + ext);
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
        parsePromise.then(function(template) {
          return template.render(options).then(function(output) {
            grunt.file.write(fp.dest, output);
            return grunt.log.writeln("File \"" + fp.dest + "\" created.");
          })["catch"](function(e) {
            return grunt.fail.warn(e);
          })["finally"](done);
        });
        return parsePromise["catch"](function(e) {
          grunt.log.error(e);
          grunt.fail.warn("Liquid failed to compile " + srcFiles + ".");
          return done();
        });
      });
    });
  };

}).call(this);
