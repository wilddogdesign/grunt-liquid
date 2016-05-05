(function() {
  var Liquid, Q,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Q = require('q');

  Liquid = require('liquid-node');

  module.exports = function() {
    var engine;
    engine = new Liquid.Engine;
    engine.registerTag("block", (function() {
      var BlockBlock;
      return BlockBlock = (function(superClass) {
        var Syntax, SyntaxHelp;

        extend(BlockBlock, superClass);

        Syntax = /(\w+)/;

        SyntaxHelp = "Syntax Error in 'block' - Valid syntax: block [templateName]";

        function BlockBlock(template, tagName, markup, tokens) {
          var match;
          match = Syntax.exec(markup);
          if (!match) {
            throw new Liquid.SyntaxError(SyntaxHelp);
          }
          template.exportedBlocks || (template.exportedBlocks = {});
          template.exportedBlocks[match[1]] = this;
          BlockBlock.__super__.constructor.apply(this, arguments);
        }

        BlockBlock.prototype.replace = function(block) {
          return this.nodelist = block.nodelist;
        };

        return BlockBlock;

      })(Liquid.Block);
    })());
    engine.registerTag("extends", (function() {
      var ExtendsTag;
      return ExtendsTag = (function(superClass) {
        var Syntax, SyntaxHelp;

        extend(ExtendsTag, superClass);

        Syntax = /([a-z0-9\/\\_-]+)/i;

        SyntaxHelp = "Syntax Error in 'extends' - Valid syntax: extends [templateName]";

        function ExtendsTag(template, tagName, markup, tokens) {
          var match;
          match = Syntax.exec(markup);
          if (!match) {
            throw new Liquid.SyntaxError(SyntaxHelp);
          }
          template["extends"] = match[1];
          ExtendsTag.__super__.constructor.apply(this, arguments);
        }

        ExtendsTag.prototype.render = function(context) {
          return "";
        };

        return ExtendsTag;

      })(Liquid.Tag);
    })());
    engine.registerTag("include", (function() {
      var IncludeTag;
      return IncludeTag = (function(superClass) {
        var Syntax, SyntaxHelp;

        extend(IncludeTag, superClass);

        Syntax = /([a-z0-9\/\\_-]+)/i;

        SyntaxHelp = "Syntax Error in 'include' - Valid syntax: include [templateName]";

        function IncludeTag(template, tagName, markup, tokens) {
          var deferred, match;
          match = Syntax.exec(markup);
          if (!match) {
            throw new Liquid.SyntaxError(SyntaxHelp);
          }
          this.filepath = match[1];
          deferred = Q.defer();
          this.included = deferred.promise;
          template.engine.importer(this.filepath, function(err, src) {
            var subTemplate;
            subTemplate = engine.extParse(src, template.engine.importer);
            return subTemplate.then(function(t) {
              return deferred.resolve(t);
            });
          });
          IncludeTag.__super__.constructor.apply(this, arguments);
        }

        IncludeTag.prototype.render = function(context) {
          return this.included.then(function(i) {
            return i.render(context);
          });
        };

        return IncludeTag;

      })(Liquid.Tag);
    })());
    engine.extParse = function(src, importer) {
      var parser;
      engine.importer = importer;
      parser = engine.parse(src);
      return parser.then(function(baseTemplate) {
        var deferred, depth, stack, walker;
        if (!baseTemplate["extends"]) {
          return baseTemplate;
        }
        stack = [baseTemplate];
        depth = 0;
        deferred = Q.defer();
        walker = function(tmpl, cb) {
          if (!tmpl["extends"]) {
            return cb();
          }
          return tmpl.engine.importer(tmpl["extends"], function(err, data) {
            if (err) {
              return cb(err);
            }
            if (depth > 100) {
              return cb("too many `extends`");
            }
            depth++;
            return engine.extParse(data, importer).then(function(subTemplate) {
              stack.unshift(subTemplate);
              return walker(subTemplate, cb);
            })["catch"](function(err) {
              return cb(err != null ? err : "Failed to parse template.");
            });
          });
        };
        walker(stack[0], function(err) {
          var rootTemplate, subTemplates;
          if (err) {
            return deferred.reject(err);
          }
          rootTemplate = stack[0], subTemplates = 2 <= stack.length ? slice.call(stack, 1) : [];
          subTemplates.forEach(function(subTemplate) {
            var k, ref, results, rootTemplateBlocks, subTemplateBlocks, v;
            subTemplateBlocks = subTemplate.exportedBlocks || {};
            rootTemplateBlocks = rootTemplate.exportedBlocks || {};
            results = [];
            for (k in subTemplateBlocks) {
              if (!hasProp.call(subTemplateBlocks, k)) continue;
              v = subTemplateBlocks[k];
              results.push((ref = rootTemplateBlocks[k]) != null ? ref.replace(v) : void 0);
            }
            return results;
          });
          return deferred.resolve(rootTemplate);
        });
        return deferred.promise;
      });
    };
    return engine;
  };

}).call(this);
