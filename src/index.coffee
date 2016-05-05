#
# grunt-liquid
# http://gruntjs.com/
#
# Copyright (c) 2013 Marcel Jackwerth
# Licensed under the MIT license.
#
path = require "path"

module.exports = (grunt) ->
  grunt.registerMultiTask "liquid", "Compile liquid templates.", ->
    done = @async()

    engine = require("./lib/liquid-ext")()

    # Merge task-specific and/or target-specific options with these defaults.
    options = @options includes: ""
    grunt.verbose.writeflags options, "Options"

    engine.registerFilters options.filters if options.filters

    @files.forEach (fp) ->
      srcFiles = fp.src

      content = grunt.file.read(srcFiles)

      newpath = if Array.isArray fp.src then fp.src[0] else fp.src
      ext = path.extname(newpath)
      dir = path.dirname(newpath)

      parsePromise = engine.extParse content, (subFilepath, cb) ->
        includes = options.includes
        includes = [includes] unless Array.isArray includes

        found = false
        includes.some (include) ->
          includePath = path.join(include, subFilepath + ext)

          if grunt.file.exists includePath
            found = true
            cb null, grunt.file.read(includePath)

          found

        cb "Not found." unless found

      parsePromise.then (template) ->
        template.render(options)
        .then (output) ->
          grunt.file.write fp.dest, output
          grunt.log.writeln "File \"#{fp.dest}\" created."
        .catch (e) ->
          grunt.fail.warn e
        .finally done

      parsePromise.catch (e) ->
        grunt.log.error e
        grunt.fail.warn "Liquid failed to compile #{srcFiles}."
        done()
