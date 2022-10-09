(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var HTML = Package.htmljs.HTML;
var HTMLTools = Package['html-tools'].HTMLTools;
var BlazeTools = Package['blaze-tools'].BlazeTools;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var SpacebarsCompiler;

var require = meteorInstall({"node_modules":{"meteor":{"spacebars-compiler":{"preamble.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/preamble.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  SpacebarsCompiler: () => SpacebarsCompiler
});
let CodeGen, builtInBlockHelpers, isReservedName;
module.link("./codegen", {
  CodeGen(v) {
    CodeGen = v;
  },

  builtInBlockHelpers(v) {
    builtInBlockHelpers = v;
  },

  isReservedName(v) {
    isReservedName = v;
  }

}, 0);
let optimize;
module.link("./optimizer", {
  optimize(v) {
    optimize = v;
  }

}, 1);
let parse, compile, codeGen, TemplateTagReplacer, beautify;
module.link("./compiler", {
  parse(v) {
    parse = v;
  },

  compile(v) {
    compile = v;
  },

  codeGen(v) {
    codeGen = v;
  },

  TemplateTagReplacer(v) {
    TemplateTagReplacer = v;
  },

  beautify(v) {
    beautify = v;
  }

}, 2);
let TemplateTag;
module.link("./templatetag", {
  TemplateTag(v) {
    TemplateTag = v;
  }

}, 3);
module.runSetters(SpacebarsCompiler = {
  CodeGen,
  _builtInBlockHelpers: builtInBlockHelpers,
  isReservedName,
  optimize,
  parse,
  compile,
  codeGen,
  _TemplateTagReplacer: TemplateTagReplacer,
  _beautify: beautify,
  TemplateTag
}, ["SpacebarsCompiler"]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"codegen.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/codegen.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CodeGen: () => CodeGen,
  builtInBlockHelpers: () => builtInBlockHelpers,
  isReservedName: () => isReservedName
});
let HTMLTools;
module.link("meteor/html-tools", {
  HTMLTools(v) {
    HTMLTools = v;
  }

}, 0);
let HTML;
module.link("meteor/htmljs", {
  HTML(v) {
    HTML = v;
  }

}, 1);
let BlazeTools;
module.link("meteor/blaze-tools", {
  BlazeTools(v) {
    BlazeTools = v;
  }

}, 2);
let codeGen;
module.link("./compiler", {
  codeGen(v) {
    codeGen = v;
  }

}, 3);

function CodeGen() {}

const builtInBlockHelpers = {
  'if': 'Blaze.If',
  'unless': 'Blaze.Unless',
  'with': 'Spacebars.With',
  'each': 'Blaze.Each',
  'let': 'Blaze.Let'
};
// Mapping of "macros" which, when preceded by `Template.`, expand
// to special code rather than following the lookup rules for dotted
// symbols.
var builtInTemplateMacros = {
  // `view` is a local variable defined in the generated render
  // function for the template in which `Template.contentBlock` or
  // `Template.elseBlock` is invoked.
  'contentBlock': 'view.templateContentBlock',
  'elseBlock': 'view.templateElseBlock',
  // Confusingly, this makes `{{> Template.dynamic}}` an alias
  // for `{{> __dynamic}}`, where "__dynamic" is the template that
  // implements the dynamic template feature.
  'dynamic': 'Template.__dynamic',
  'subscriptionsReady': 'view.templateInstance().subscriptionsReady()'
};
var additionalReservedNames = ["body", "toString", "instance", "constructor", "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "__defineGetter__", "__lookupGetter__", "__defineSetter__", "__lookupSetter__", "__proto__", "dynamic", "registerHelper", "currentData", "parentData", "_migrateTemplate", "_applyHmrChanges", "__pendingReplacement"]; // A "reserved name" can't be used as a <template> name.  This
// function is used by the template file scanner.
//
// Note that the runtime imposes additional restrictions, for example
// banning the name "body" and names of built-in object properties
// like "toString".

function isReservedName(name) {
  return builtInBlockHelpers.hasOwnProperty(name) || builtInTemplateMacros.hasOwnProperty(name) || additionalReservedNames.includes(name);
}

var makeObjectLiteral = function (obj) {
  var parts = [];

  for (var k in obj) parts.push(BlazeTools.toObjectLiteralKey(k) + ': ' + obj[k]);

  return '{' + parts.join(', ') + '}';
};

Object.assign(CodeGen.prototype, {
  codeGenTemplateTag: function (tag) {
    var self = this;

    if (tag.position === HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG) {
      // Special dynamic attributes: `<div {{attrs}}>...`
      // only `tag.type === 'DOUBLE'` allowed (by earlier validation)
      return BlazeTools.EmitCode('function () { return ' + self.codeGenMustache(tag.path, tag.args, 'attrMustache') + '; }');
    } else {
      if (tag.type === 'DOUBLE' || tag.type === 'TRIPLE') {
        var code = self.codeGenMustache(tag.path, tag.args);

        if (tag.type === 'TRIPLE') {
          code = 'Spacebars.makeRaw(' + code + ')';
        }

        if (tag.position !== HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
          // Reactive attributes are already wrapped in a function,
          // and there's no fine-grained reactivity.
          // Anywhere else, we need to create a View.
          code = 'Blaze.View(' + BlazeTools.toJSLiteral('lookup:' + tag.path.join('.')) + ', ' + 'function () { return ' + code + '; })';
        }

        return BlazeTools.EmitCode(code);
      } else if (tag.type === 'INCLUSION' || tag.type === 'BLOCKOPEN') {
        var path = tag.path;
        var args = tag.args;

        if (tag.type === 'BLOCKOPEN' && builtInBlockHelpers.hasOwnProperty(path[0])) {
          // if, unless, with, each.
          //
          // If someone tries to do `{{> if}}`, we don't
          // get here, but an error is thrown when we try to codegen the path.
          // Note: If we caught these errors earlier, while scanning, we'd be able to
          // provide nice line numbers.
          if (path.length > 1) throw new Error("Unexpected dotted path beginning with " + path[0]);
          if (!args.length) throw new Error("#" + path[0] + " requires an argument");
          var dataCode = null; // #each has a special treatment as it features two different forms:
          // - {{#each people}}
          // - {{#each person in people}}

          if (path[0] === 'each' && args.length >= 2 && args[1][0] === 'PATH' && args[1][1].length && args[1][1][0] === 'in') {
            // minimum conditions are met for each-in.  now validate this
            // isn't some weird case.
            var eachUsage = "Use either {{#each items}} or " + "{{#each item in items}} form of #each.";
            var inArg = args[1];

            if (!(args.length >= 3 && inArg[1].length === 1)) {
              // we don't have at least 3 space-separated parts after #each, or
              // inArg doesn't look like ['PATH',['in']]
              throw new Error("Malformed #each. " + eachUsage);
            } // split out the variable name and sequence arguments


            var variableArg = args[0];

            if (!(variableArg[0] === "PATH" && variableArg[1].length === 1 && variableArg[1][0].replace(/\./g, ''))) {
              throw new Error("Bad variable name in #each");
            }

            var variable = variableArg[1][0];
            dataCode = 'function () { return { _sequence: ' + self.codeGenInclusionData(args.slice(2)) + ', _variable: ' + BlazeTools.toJSLiteral(variable) + ' }; }';
          } else if (path[0] === 'let') {
            var dataProps = {};
            args.forEach(function (arg) {
              if (arg.length !== 3) {
                // not a keyword arg (x=y)
                throw new Error("Incorrect form of #let");
              }

              var argKey = arg[2];
              dataProps[argKey] = 'function () { return Spacebars.call(' + self.codeGenArgValue(arg) + '); }';
            });
            dataCode = makeObjectLiteral(dataProps);
          }

          if (!dataCode) {
            // `args` must exist (tag.args.length > 0)
            dataCode = self.codeGenInclusionDataFunc(args) || 'null';
          } // `content` must exist


          var contentBlock = 'content' in tag ? self.codeGenBlock(tag.content) : null; // `elseContent` may not exist

          var elseContentBlock = 'elseContent' in tag ? self.codeGenBlock(tag.elseContent) : null;
          var callArgs = [dataCode, contentBlock];
          if (elseContentBlock) callArgs.push(elseContentBlock);
          return BlazeTools.EmitCode(builtInBlockHelpers[path[0]] + '(' + callArgs.join(', ') + ')');
        } else {
          var compCode = self.codeGenPath(path, {
            lookupTemplate: true
          });

          if (path.length > 1) {
            // capture reactivity
            compCode = 'function () { return Spacebars.call(' + compCode + '); }';
          }

          var dataCode = self.codeGenInclusionDataFunc(tag.args);
          var content = 'content' in tag ? self.codeGenBlock(tag.content) : null;
          var elseContent = 'elseContent' in tag ? self.codeGenBlock(tag.elseContent) : null;
          var includeArgs = [compCode];

          if (content) {
            includeArgs.push(content);
            if (elseContent) includeArgs.push(elseContent);
          }

          var includeCode = 'Spacebars.include(' + includeArgs.join(', ') + ')'; // calling convention compat -- set the data context around the
          // entire inclusion, so that if the name of the inclusion is
          // a helper function, it gets the data context in `this`.
          // This makes for a pretty confusing calling convention --
          // In `{{#foo bar}}`, `foo` is evaluated in the context of `bar`
          // -- but it's what we shipped for 0.8.0.  The rationale is that
          // `{{#foo bar}}` is sugar for `{{#with bar}}{{#foo}}...`.

          if (dataCode) {
            includeCode = 'Blaze._TemplateWith(' + dataCode + ', function () { return ' + includeCode + '; })';
          } // XXX BACK COMPAT - UI is the old name, Template is the new


          if ((path[0] === 'UI' || path[0] === 'Template') && (path[1] === 'contentBlock' || path[1] === 'elseBlock')) {
            // Call contentBlock and elseBlock in the appropriate scope
            includeCode = 'Blaze._InOuterTemplateScope(view, function () { return ' + includeCode + '; })';
          }

          return BlazeTools.EmitCode(includeCode);
        }
      } else if (tag.type === 'ESCAPE') {
        return tag.value;
      } else {
        // Can't get here; TemplateTag validation should catch any
        // inappropriate tag types that might come out of the parser.
        throw new Error("Unexpected template tag type: " + tag.type);
      }
    }
  },
  // `path` is an array of at least one string.
  //
  // If `path.length > 1`, the generated code may be reactive
  // (i.e. it may invalidate the current computation).
  //
  // No code is generated to call the result if it's a function.
  //
  // Options:
  //
  // - lookupTemplate {Boolean} If true, generated code also looks in
  //   the list of templates. (After helpers, before data context).
  //   Used when generating code for `{{> foo}}` or `{{#foo}}`. Only
  //   used for non-dotted paths.
  codeGenPath: function (path, opts) {
    if (builtInBlockHelpers.hasOwnProperty(path[0])) throw new Error("Can't use the built-in '" + path[0] + "' here"); // Let `{{#if Template.contentBlock}}` check whether this template was
    // invoked via inclusion or as a block helper, in addition to supporting
    // `{{> Template.contentBlock}}`.
    // XXX BACK COMPAT - UI is the old name, Template is the new

    if (path.length >= 2 && (path[0] === 'UI' || path[0] === 'Template') && builtInTemplateMacros.hasOwnProperty(path[1])) {
      if (path.length > 2) throw new Error("Unexpected dotted path beginning with " + path[0] + '.' + path[1]);
      return builtInTemplateMacros[path[1]];
    }

    var firstPathItem = BlazeTools.toJSLiteral(path[0]);
    var lookupMethod = 'lookup';
    if (opts && opts.lookupTemplate && path.length === 1) lookupMethod = 'lookupTemplate';
    var code = 'view.' + lookupMethod + '(' + firstPathItem + ')';

    if (path.length > 1) {
      code = 'Spacebars.dot(' + code + ', ' + path.slice(1).map(BlazeTools.toJSLiteral).join(', ') + ')';
    }

    return code;
  },
  // Generates code for an `[argType, argValue]` argument spec,
  // ignoring the third element (keyword argument name) if present.
  //
  // The resulting code may be reactive (in the case of a PATH of
  // more than one element) and is not wrapped in a closure.
  codeGenArgValue: function (arg) {
    var self = this;
    var argType = arg[0];
    var argValue = arg[1];
    var argCode;

    switch (argType) {
      case 'STRING':
      case 'NUMBER':
      case 'BOOLEAN':
      case 'NULL':
        argCode = BlazeTools.toJSLiteral(argValue);
        break;

      case 'PATH':
        argCode = self.codeGenPath(argValue);
        break;

      case 'EXPR':
        // The format of EXPR is ['EXPR', { type: 'EXPR', path: [...], args: { ... } }]
        argCode = self.codeGenMustache(argValue.path, argValue.args, 'dataMustache');
        break;

      default:
        // can't get here
        throw new Error("Unexpected arg type: " + argType);
    }

    return argCode;
  },
  // Generates a call to `Spacebars.fooMustache` on evaluated arguments.
  // The resulting code has no function literals and must be wrapped in
  // one for fine-grained reactivity.
  codeGenMustache: function (path, args, mustacheType) {
    var self = this;
    var nameCode = self.codeGenPath(path);
    var argCode = self.codeGenMustacheArgs(args);
    var mustache = mustacheType || 'mustache';
    return 'Spacebars.' + mustache + '(' + nameCode + (argCode ? ', ' + argCode.join(', ') : '') + ')';
  },
  // returns: array of source strings, or null if no
  // args at all.
  codeGenMustacheArgs: function (tagArgs) {
    var self = this;
    var kwArgs = null; // source -> source

    var args = null; // [source]
    // tagArgs may be null

    tagArgs.forEach(function (arg) {
      var argCode = self.codeGenArgValue(arg);

      if (arg.length > 2) {
        // keyword argument (represented as [type, value, name])
        kwArgs = kwArgs || {};
        kwArgs[arg[2]] = argCode;
      } else {
        // positional argument
        args = args || [];
        args.push(argCode);
      }
    }); // put kwArgs in options dictionary at end of args

    if (kwArgs) {
      args = args || [];
      args.push('Spacebars.kw(' + makeObjectLiteral(kwArgs) + ')');
    }

    return args;
  },
  codeGenBlock: function (content) {
    return codeGen(content);
  },
  codeGenInclusionData: function (args) {
    var self = this;

    if (!args.length) {
      // e.g. `{{#foo}}`
      return null;
    } else if (args[0].length === 3) {
      // keyword arguments only, e.g. `{{> point x=1 y=2}}`
      var dataProps = {};
      args.forEach(function (arg) {
        var argKey = arg[2];
        dataProps[argKey] = 'Spacebars.call(' + self.codeGenArgValue(arg) + ')';
      });
      return makeObjectLiteral(dataProps);
    } else if (args[0][0] !== 'PATH') {
      // literal first argument, e.g. `{{> foo "blah"}}`
      //
      // tag validation has confirmed, in this case, that there is only
      // one argument (`args.length === 1`)
      return self.codeGenArgValue(args[0]);
    } else if (args.length === 1) {
      // one argument, must be a PATH
      return 'Spacebars.call(' + self.codeGenPath(args[0][1]) + ')';
    } else {
      // Multiple positional arguments; treat them as a nested
      // "data mustache"
      return self.codeGenMustache(args[0][1], args.slice(1), 'dataMustache');
    }
  },
  codeGenInclusionDataFunc: function (args) {
    var self = this;
    var dataCode = self.codeGenInclusionData(args);

    if (dataCode) {
      return 'function () { return ' + dataCode + '; }';
    } else {
      return null;
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"compiler.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/compiler.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  parse: () => parse,
  compile: () => compile,
  TemplateTagReplacer: () => TemplateTagReplacer,
  codeGen: () => codeGen,
  beautify: () => beautify
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTMLTools;
module.link("meteor/html-tools", {
  HTMLTools(v) {
    HTMLTools = v;
  }

}, 1);
let HTML;
module.link("meteor/htmljs", {
  HTML(v) {
    HTML = v;
  }

}, 2);
let BlazeTools;
module.link("meteor/blaze-tools", {
  BlazeTools(v) {
    BlazeTools = v;
  }

}, 3);
let CodeGen;
module.link("./codegen", {
  CodeGen(v) {
    CodeGen = v;
  }

}, 4);
let optimize;
module.link("./optimizer", {
  optimize(v) {
    optimize = v;
  }

}, 5);
let ReactComponentSiblingForbidder;
module.link("./react", {
  ReactComponentSiblingForbidder(v) {
    ReactComponentSiblingForbidder = v;
  }

}, 6);
let TemplateTag;
module.link("./templatetag", {
  TemplateTag(v) {
    TemplateTag = v;
  }

}, 7);
let removeWhitespace;
module.link("./whitespace", {
  removeWhitespace(v) {
    removeWhitespace = v;
  }

}, 8);
var UglifyJSMinify = null;

if (Meteor.isServer) {
  UglifyJSMinify = Npm.require('uglify-js').minify;
}

function parse(input) {
  return HTMLTools.parseFragment(input, {
    getTemplateTag: TemplateTag.parseCompleteTag
  });
}

function compile(input, options) {
  var tree = parse(input);
  return codeGen(tree, options);
}

const TemplateTagReplacer = HTML.TransformingVisitor.extend();
TemplateTagReplacer.def({
  visitObject: function (x) {
    if (x instanceof HTMLTools.TemplateTag) {
      // Make sure all TemplateTags in attributes have the right
      // `.position` set on them.  This is a bit of a hack
      // (we shouldn't be mutating that here), but it allows
      // cleaner codegen of "synthetic" attributes like TEXTAREA's
      // "value", where the template tags were originally not
      // in an attribute.
      if (this.inAttributeValue) x.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;
      return this.codegen.codeGenTemplateTag(x);
    }

    return HTML.TransformingVisitor.prototype.visitObject.call(this, x);
  },
  visitAttributes: function (attrs) {
    if (attrs instanceof HTMLTools.TemplateTag) return this.codegen.codeGenTemplateTag(attrs); // call super (e.g. for case where `attrs` is an array)

    return HTML.TransformingVisitor.prototype.visitAttributes.call(this, attrs);
  },
  visitAttribute: function (name, value, tag) {
    this.inAttributeValue = true;
    var result = this.visit(value);
    this.inAttributeValue = false;

    if (result !== value) {
      // some template tags must have been replaced, because otherwise
      // we try to keep things `===` when transforming.  Wrap the code
      // in a function as per the rules.  You can't have
      // `{id: Blaze.View(...)}` as an attributes dict because the View
      // would be rendered more than once; you need to wrap it in a function
      // so that it's a different View each time.
      return BlazeTools.EmitCode(this.codegen.codeGenBlock(result));
    }

    return result;
  }
});

function codeGen(parseTree, options) {
  // is this a template, rather than a block passed to
  // a block helper, say
  var isTemplate = options && options.isTemplate;
  var isBody = options && options.isBody;
  var whitespace = options && options.whitespace;
  var sourceName = options && options.sourceName;
  var tree = parseTree; // The flags `isTemplate` and `isBody` are kind of a hack.

  if (isTemplate || isBody) {
    if (typeof whitespace === 'string' && whitespace.toLowerCase() === 'strip') {
      tree = removeWhitespace(tree);
    } // optimizing fragments would require being smarter about whether we are
    // in a TEXTAREA, say.


    tree = optimize(tree);
  } // throws an error if using `{{> React}}` with siblings


  new ReactComponentSiblingForbidder({
    sourceName: sourceName
  }).visit(tree);
  var codegen = new CodeGen();
  tree = new TemplateTagReplacer({
    codegen: codegen
  }).visit(tree);
  var code = '(function () { ';

  if (isTemplate || isBody) {
    code += 'var view = this; ';
  }

  code += 'return ';
  code += BlazeTools.toJS(tree);
  code += '; })';
  code = beautify(code);
  return code;
}

function beautify(code) {
  if (!UglifyJSMinify) {
    return code;
  }

  var result = UglifyJSMinify(code, {
    fromString: true,
    mangle: false,
    compress: false,
    output: {
      beautify: true,
      indent_level: 2,
      width: 80
    }
  });
  var output = result.code; // Uglify interprets our expression as a statement and may add a semicolon.
  // Strip trailing semicolon.

  output = output.replace(/;$/, '');
  return output;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"optimizer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/optimizer.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  toRaw: () => toRaw,
  TreeTransformer: () => TreeTransformer,
  optimize: () => optimize
});
let HTMLTools;
module.link("meteor/html-tools", {
  HTMLTools(v) {
    HTMLTools = v;
  }

}, 0);
let HTML;
module.link("meteor/htmljs", {
  HTML(v) {
    HTML = v;
  }

}, 1);

// Optimize parts of an HTMLjs tree into raw HTML strings when they don't
// contain template tags.
var constant = function (value) {
  return function () {
    return value;
  };
};

var OPTIMIZABLE = {
  NONE: 0,
  PARTS: 1,
  FULL: 2
}; // We can only turn content into an HTML string if it contains no template
// tags and no "tricky" HTML tags.  If we can optimize the entire content
// into a string, we return OPTIMIZABLE.FULL.  If the we are given an
// unoptimizable node, we return OPTIMIZABLE.NONE.  If we are given a tree
// that contains an unoptimizable node somewhere, we return OPTIMIZABLE.PARTS.
//
// For example, we always create SVG elements programmatically, since SVG
// doesn't have innerHTML.  If we are given an SVG element, we return NONE.
// However, if we are given a big tree that contains SVG somewhere, we
// return PARTS so that the optimizer can descend into the tree and optimize
// other parts of it.

var CanOptimizeVisitor = HTML.Visitor.extend();
CanOptimizeVisitor.def({
  visitNull: constant(OPTIMIZABLE.FULL),
  visitPrimitive: constant(OPTIMIZABLE.FULL),
  visitComment: constant(OPTIMIZABLE.FULL),
  visitCharRef: constant(OPTIMIZABLE.FULL),
  visitRaw: constant(OPTIMIZABLE.FULL),
  visitObject: constant(OPTIMIZABLE.NONE),
  visitFunction: constant(OPTIMIZABLE.NONE),
  visitArray: function (x) {
    for (var i = 0; i < x.length; i++) if (this.visit(x[i]) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;

    return OPTIMIZABLE.FULL;
  },
  visitTag: function (tag) {
    var tagName = tag.tagName;

    if (tagName === 'textarea') {
      // optimizing into a TEXTAREA's RCDATA would require being a little
      // more clever.
      return OPTIMIZABLE.NONE;
    } else if (tagName === 'script') {
      // script tags don't work when rendered from strings
      return OPTIMIZABLE.NONE;
    } else if (!(HTML.isKnownElement(tagName) && !HTML.isKnownSVGElement(tagName))) {
      // foreign elements like SVG can't be stringified for innerHTML.
      return OPTIMIZABLE.NONE;
    } else if (tagName === 'table') {
      // Avoid ever producing HTML containing `<table><tr>...`, because the
      // browser will insert a TBODY.  If we just `createElement("table")` and
      // `createElement("tr")`, on the other hand, no TBODY is necessary
      // (assuming IE 8+).
      return OPTIMIZABLE.PARTS;
    } else if (tagName === 'tr') {
      return OPTIMIZABLE.PARTS;
    }

    var children = tag.children;

    for (var i = 0; i < children.length; i++) if (this.visit(children[i]) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;

    if (this.visitAttributes(tag.attrs) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;
    return OPTIMIZABLE.FULL;
  },
  visitAttributes: function (attrs) {
    if (attrs) {
      var isArray = HTML.isArray(attrs);

      for (var i = 0; i < (isArray ? attrs.length : 1); i++) {
        var a = isArray ? attrs[i] : attrs;
        if (typeof a !== 'object' || a instanceof HTMLTools.TemplateTag) return OPTIMIZABLE.PARTS;

        for (var k in a) if (this.visit(a[k]) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;
      }
    }

    return OPTIMIZABLE.FULL;
  }
});

var getOptimizability = function (content) {
  return new CanOptimizeVisitor().visit(content);
};

function toRaw(x) {
  return HTML.Raw(HTML.toHTML(x));
}

const TreeTransformer = HTML.TransformingVisitor.extend();
TreeTransformer.def({
  visitAttributes: function (attrs
  /*, ...*/
  ) {
    // pass template tags through by default
    if (attrs instanceof HTMLTools.TemplateTag) return attrs;
    return HTML.TransformingVisitor.prototype.visitAttributes.apply(this, arguments);
  }
}); // Replace parts of the HTMLjs tree that have no template tags (or
// tricky HTML tags) with HTML.Raw objects containing raw HTML.

var OptimizingVisitor = TreeTransformer.extend();
OptimizingVisitor.def({
  visitNull: toRaw,
  visitPrimitive: toRaw,
  visitComment: toRaw,
  visitCharRef: toRaw,
  visitArray: function (array) {
    var optimizability = getOptimizability(array);

    if (optimizability === OPTIMIZABLE.FULL) {
      return toRaw(array);
    } else if (optimizability === OPTIMIZABLE.PARTS) {
      return TreeTransformer.prototype.visitArray.call(this, array);
    } else {
      return array;
    }
  },
  visitTag: function (tag) {
    var optimizability = getOptimizability(tag);

    if (optimizability === OPTIMIZABLE.FULL) {
      return toRaw(tag);
    } else if (optimizability === OPTIMIZABLE.PARTS) {
      return TreeTransformer.prototype.visitTag.call(this, tag);
    } else {
      return tag;
    }
  },
  visitChildren: function (children) {
    // don't optimize the children array into a Raw object!
    return TreeTransformer.prototype.visitArray.call(this, children);
  },
  visitAttributes: function (attrs) {
    return attrs;
  }
}); // Combine consecutive HTML.Raws.  Remove empty ones.

var RawCompactingVisitor = TreeTransformer.extend();
RawCompactingVisitor.def({
  visitArray: function (array) {
    var result = [];

    for (var i = 0; i < array.length; i++) {
      var item = array[i];

      if (item instanceof HTML.Raw && (!item.value || result.length && result[result.length - 1] instanceof HTML.Raw)) {
        // two cases: item is an empty Raw, or previous item is
        // a Raw as well.  In the latter case, replace the previous
        // Raw with a longer one that includes the new Raw.
        if (item.value) {
          result[result.length - 1] = HTML.Raw(result[result.length - 1].value + item.value);
        }
      } else {
        result.push(this.visit(item));
      }
    }

    return result;
  }
}); // Replace pointless Raws like `HTMl.Raw('foo')` that contain no special
// characters with simple strings.

var RawReplacingVisitor = TreeTransformer.extend();
RawReplacingVisitor.def({
  visitRaw: function (raw) {
    var html = raw.value;

    if (html.indexOf('&') < 0 && html.indexOf('<') < 0) {
      return html;
    } else {
      return raw;
    }
  }
});

function optimize(tree) {
  tree = new OptimizingVisitor().visit(tree);
  tree = new RawCompactingVisitor().visit(tree);
  tree = new RawReplacingVisitor().visit(tree);
  return tree;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"react.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/react.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ReactComponentSiblingForbidder: () => ReactComponentSiblingForbidder
});
let HTMLTools;
module.link("meteor/html-tools", {
  HTMLTools(v) {
    HTMLTools = v;
  }

}, 0);
let HTML;
module.link("meteor/htmljs", {
  HTML(v) {
    HTML = v;
  }

}, 1);
let BlazeTools;
module.link("meteor/blaze-tools", {
  BlazeTools(v) {
    BlazeTools = v;
  }

}, 2);
const ReactComponentSiblingForbidder = HTML.Visitor.extend();
ReactComponentSiblingForbidder.def({
  visitArray: function (array, parentTag) {
    for (var i = 0; i < array.length; i++) {
      this.visit(array[i], parentTag);
    }
  },
  visitObject: function (obj, parentTag) {
    if (obj.type === "INCLUSION" && obj.path.length === 1 && obj.path[0] === "React") {
      if (!parentTag) {
        throw new Error("{{> React}} must be used in a container element" + (this.sourceName ? " in " + this.sourceName : "") + ". Learn more at https://github.com/meteor/meteor/wiki/React-components-must-be-the-only-thing-in-their-wrapper-element");
      }

      var numSiblings = 0;

      for (var i = 0; i < parentTag.children.length; i++) {
        var child = parentTag.children[i];

        if (child !== obj && !(typeof child === "string" && child.match(/^\s*$/))) {
          numSiblings++;
        }
      }

      if (numSiblings > 0) {
        throw new Error("{{> React}} must be used as the only child in a container element" + (this.sourceName ? " in " + this.sourceName : "") + ". Learn more at https://github.com/meteor/meteor/wiki/React-components-must-be-the-only-thing-in-their-wrapper-element");
      }
    }
  },
  visitTag: function (tag) {
    this.visitArray(tag.children, tag
    /*parentTag*/
    );
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"templatetag.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/templatetag.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  TemplateTag: () => TemplateTag
});
let HTMLTools;
module.link("meteor/html-tools", {
  HTMLTools(v) {
    HTMLTools = v;
  }

}, 0);
let HTML;
module.link("meteor/htmljs", {
  HTML(v) {
    HTML = v;
  }

}, 1);
let BlazeTools;
module.link("meteor/blaze-tools", {
  BlazeTools(v) {
    BlazeTools = v;
  }

}, 2);
// A TemplateTag is the result of parsing a single `{{...}}` tag.
//
// The `.type` of a TemplateTag is one of:
//
// - `"DOUBLE"` - `{{foo}}`
// - `"TRIPLE"` - `{{{foo}}}`
// - `"EXPR"` - `(foo)`
// - `"COMMENT"` - `{{! foo}}`
// - `"BLOCKCOMMENT" - `{{!-- foo--}}`
// - `"INCLUSION"` - `{{> foo}}`
// - `"BLOCKOPEN"` - `{{#foo}}`
// - `"BLOCKCLOSE"` - `{{/foo}}`
// - `"ELSE"` - `{{else}}`
// - `"ESCAPE"` - `{{|`, `{{{|`, `{{{{|` and so on
//
// Besides `type`, the mandatory properties of a TemplateTag are:
//
// - `path` - An array of one or more strings.  The path of `{{foo.bar}}`
//   is `["foo", "bar"]`.  Applies to DOUBLE, TRIPLE, INCLUSION, BLOCKOPEN,
//   BLOCKCLOSE, and ELSE.
//
// - `args` - An array of zero or more argument specs.  An argument spec
//   is a two or three element array, consisting of a type, value, and
//   optional keyword name.  For example, the `args` of `{{foo "bar" x=3}}`
//   are `[["STRING", "bar"], ["NUMBER", 3, "x"]]`.  Applies to DOUBLE,
//   TRIPLE, INCLUSION, BLOCKOPEN, and ELSE.
//
// - `value` - A string of the comment's text. Applies to COMMENT and
//   BLOCKCOMMENT.
//
// These additional are typically set during parsing:
//
// - `position` - The HTMLTools.TEMPLATE_TAG_POSITION specifying at what sort
//   of site the TemplateTag was encountered (e.g. at element level or as
//   part of an attribute value). Its absence implies
//   TEMPLATE_TAG_POSITION.ELEMENT.
//
// - `content` and `elseContent` - When a BLOCKOPEN tag's contents are
//   parsed, they are put here.  `elseContent` will only be present if
//   an `{{else}}` was found.
var TEMPLATE_TAG_POSITION = HTMLTools.TEMPLATE_TAG_POSITION;

function TemplateTag() {
  HTMLTools.TemplateTag.apply(this, arguments);
}

TemplateTag.prototype = new HTMLTools.TemplateTag();
TemplateTag.prototype.constructorName = 'SpacebarsCompiler.TemplateTag';

var makeStacheTagStartRegex = function (r) {
  return new RegExp(r.source + /(?![{>!#/])/.source, r.ignoreCase ? 'i' : '');
}; // "starts" regexes are used to see what type of template
// tag the parser is looking at.  They must match a non-empty
// result, but not the interesting part of the tag.


var starts = {
  ESCAPE: /^\{\{(?=\{*\|)/,
  ELSE: makeStacheTagStartRegex(/^\{\{\s*else(\s+(?!\s)|(?=[}]))/i),
  DOUBLE: makeStacheTagStartRegex(/^\{\{\s*(?!\s)/),
  TRIPLE: makeStacheTagStartRegex(/^\{\{\{\s*(?!\s)/),
  BLOCKCOMMENT: makeStacheTagStartRegex(/^\{\{\s*!--/),
  COMMENT: makeStacheTagStartRegex(/^\{\{\s*!/),
  INCLUSION: makeStacheTagStartRegex(/^\{\{\s*>\s*(?!\s)/),
  BLOCKOPEN: makeStacheTagStartRegex(/^\{\{\s*#\s*(?!\s)/),
  BLOCKCLOSE: makeStacheTagStartRegex(/^\{\{\s*\/\s*(?!\s)/)
};
var ends = {
  DOUBLE: /^\s*\}\}/,
  TRIPLE: /^\s*\}\}\}/,
  EXPR: /^\s*\)/
};
var endsString = {
  DOUBLE: '}}',
  TRIPLE: '}}}',
  EXPR: ')'
}; // Parse a tag from the provided scanner or string.  If the input
// doesn't start with `{{`, returns null.  Otherwise, either succeeds
// and returns a SpacebarsCompiler.TemplateTag, or throws an error (using
// `scanner.fatal` if a scanner is provided).

TemplateTag.parse = function (scannerOrString) {
  var scanner = scannerOrString;
  if (typeof scanner === 'string') scanner = new HTMLTools.Scanner(scannerOrString);
  if (!(scanner.peek() === '{' && scanner.rest().slice(0, 2) === '{{')) return null;

  var run = function (regex) {
    // regex is assumed to start with `^`
    var result = regex.exec(scanner.rest());
    if (!result) return null;
    var ret = result[0];
    scanner.pos += ret.length;
    return ret;
  };

  var advance = function (amount) {
    scanner.pos += amount;
  };

  var scanIdentifier = function (isFirstInPath) {
    var id = BlazeTools.parseExtendedIdentifierName(scanner);

    if (!id) {
      expected('IDENTIFIER');
    }

    if (isFirstInPath && (id === 'null' || id === 'true' || id === 'false')) scanner.fatal("Can't use null, true, or false, as an identifier at start of path");
    return id;
  };

  var scanPath = function () {
    var segments = []; // handle initial `.`, `..`, `./`, `../`, `../..`, `../../`, etc

    var dots;

    if (dots = run(/^[\.\/]+/)) {
      var ancestorStr = '.'; // eg `../../..` maps to `....`

      var endsWithSlash = /\/$/.test(dots);
      if (endsWithSlash) dots = dots.slice(0, -1);
      dots.split('/').forEach(function (dotClause, index) {
        if (index === 0) {
          if (dotClause !== '.' && dotClause !== '..') expected("`.`, `..`, `./` or `../`");
        } else {
          if (dotClause !== '..') expected("`..` or `../`");
        }

        if (dotClause === '..') ancestorStr += '.';
      });
      segments.push(ancestorStr);
      if (!endsWithSlash) return segments;
    }

    while (true) {
      // scan a path segment
      if (run(/^\[/)) {
        var seg = run(/^[\s\S]*?\]/);
        if (!seg) error("Unterminated path segment");
        seg = seg.slice(0, -1);
        if (!seg && !segments.length) error("Path can't start with empty string");
        segments.push(seg);
      } else {
        var id = scanIdentifier(!segments.length);

        if (id === 'this') {
          if (!segments.length) {
            // initial `this`
            segments.push('.');
          } else {
            error("Can only use `this` at the beginning of a path.\nInstead of `foo.this` or `../this`, just write `foo` or `..`.");
          }
        } else {
          segments.push(id);
        }
      }

      var sep = run(/^[\.\/]/);
      if (!sep) break;
    }

    return segments;
  }; // scan the keyword portion of a keyword argument
  // (the "foo" portion in "foo=bar").
  // Result is either the keyword matched, or null
  // if we're not at a keyword argument position.


  var scanArgKeyword = function () {
    var match = /^([^\{\}\(\)\>#=\s"'\[\]]+)\s*=\s*/.exec(scanner.rest());

    if (match) {
      scanner.pos += match[0].length;
      return match[1];
    } else {
      return null;
    }
  }; // scan an argument; succeeds or errors.
  // Result is an array of two or three items:
  // type , value, and (indicating a keyword argument)
  // keyword name.


  var scanArg = function () {
    var keyword = scanArgKeyword(); // null if not parsing a kwarg

    var value = scanArgValue();
    return keyword ? value.concat(keyword) : value;
  }; // scan an argument value (for keyword or positional arguments);
  // succeeds or errors.  Result is an array of type, value.


  var scanArgValue = function () {
    var startPos = scanner.pos;
    var result;

    if (result = BlazeTools.parseNumber(scanner)) {
      return ['NUMBER', result.value];
    } else if (result = BlazeTools.parseStringLiteral(scanner)) {
      return ['STRING', result.value];
    } else if (/^[\.\[]/.test(scanner.peek())) {
      return ['PATH', scanPath()];
    } else if (run(/^\(/)) {
      return ['EXPR', scanExpr('EXPR')];
    } else if (result = BlazeTools.parseExtendedIdentifierName(scanner)) {
      var id = result;

      if (id === 'null') {
        return ['NULL', null];
      } else if (id === 'true' || id === 'false') {
        return ['BOOLEAN', id === 'true'];
      } else {
        scanner.pos = startPos; // unconsume `id`

        return ['PATH', scanPath()];
      }
    } else {
      expected('identifier, number, string, boolean, null, or a sub expression enclosed in "(", ")"');
    }
  };

  var scanExpr = function (type) {
    var endType = type;
    if (type === 'INCLUSION' || type === 'BLOCKOPEN' || type === 'ELSE') endType = 'DOUBLE';
    var tag = new TemplateTag();
    tag.type = type;
    tag.path = scanPath();
    tag.args = [];
    var foundKwArg = false;

    while (true) {
      run(/^\s*/);
      if (run(ends[endType])) break;else if (/^[})]/.test(scanner.peek())) {
        expected('`' + endsString[endType] + '`');
      }
      var newArg = scanArg();

      if (newArg.length === 3) {
        foundKwArg = true;
      } else {
        if (foundKwArg) error("Can't have a non-keyword argument after a keyword argument");
      }

      tag.args.push(newArg); // expect a whitespace or a closing ')' or '}'

      if (run(/^(?=[\s})])/) !== '') expected('space');
    }

    return tag;
  };

  var type;

  var error = function (msg) {
    scanner.fatal(msg);
  };

  var expected = function (what) {
    error('Expected ' + what);
  }; // must do ESCAPE first, immediately followed by ELSE
  // order of others doesn't matter


  if (run(starts.ESCAPE)) type = 'ESCAPE';else if (run(starts.ELSE)) type = 'ELSE';else if (run(starts.DOUBLE)) type = 'DOUBLE';else if (run(starts.TRIPLE)) type = 'TRIPLE';else if (run(starts.BLOCKCOMMENT)) type = 'BLOCKCOMMENT';else if (run(starts.COMMENT)) type = 'COMMENT';else if (run(starts.INCLUSION)) type = 'INCLUSION';else if (run(starts.BLOCKOPEN)) type = 'BLOCKOPEN';else if (run(starts.BLOCKCLOSE)) type = 'BLOCKCLOSE';else error('Unknown stache tag');
  var tag = new TemplateTag();
  tag.type = type;

  if (type === 'BLOCKCOMMENT') {
    var result = run(/^[\s\S]*?--\s*?\}\}/);
    if (!result) error("Unclosed block comment");
    tag.value = result.slice(0, result.lastIndexOf('--'));
  } else if (type === 'COMMENT') {
    var result = run(/^[\s\S]*?\}\}/);
    if (!result) error("Unclosed comment");
    tag.value = result.slice(0, -2);
  } else if (type === 'BLOCKCLOSE') {
    tag.path = scanPath();
    if (!run(ends.DOUBLE)) expected('`}}`');
  } else if (type === 'ELSE') {
    if (!run(ends.DOUBLE)) {
      tag = scanExpr(type);
    }
  } else if (type === 'ESCAPE') {
    var result = run(/^\{*\|/);
    tag.value = '{{' + result.slice(0, -1);
  } else {
    // DOUBLE, TRIPLE, BLOCKOPEN, INCLUSION
    tag = scanExpr(type);
  }

  return tag;
}; // Returns a SpacebarsCompiler.TemplateTag parsed from `scanner`, leaving scanner
// at its original position.
//
// An error will still be thrown if there is not a valid template tag at
// the current position.


TemplateTag.peek = function (scanner) {
  var startPos = scanner.pos;
  var result = TemplateTag.parse(scanner);
  scanner.pos = startPos;
  return result;
}; // Like `TemplateTag.parse`, but in the case of blocks, parse the complete
// `{{#foo}}...{{/foo}}` with `content` and possible `elseContent`, rather
// than just the BLOCKOPEN tag.
//
// In addition:
//
// - Throws an error if `{{else}}` or `{{/foo}}` tag is encountered.
//
// - Returns `null` for a COMMENT.  (This case is distinguishable from
//   parsing no tag by the fact that the scanner is advanced.)
//
// - Takes an HTMLTools.TEMPLATE_TAG_POSITION `position` and sets it as the
//   TemplateTag's `.position` property.
//
// - Validates the tag's well-formedness and legality at in its position.


TemplateTag.parseCompleteTag = function (scannerOrString, position) {
  var scanner = scannerOrString;
  if (typeof scanner === 'string') scanner = new HTMLTools.Scanner(scannerOrString);
  var startPos = scanner.pos; // for error messages

  var result = TemplateTag.parse(scannerOrString);
  if (!result) return result;
  if (result.type === 'BLOCKCOMMENT') return null;
  if (result.type === 'COMMENT') return null;
  if (result.type === 'ELSE') scanner.fatal("Unexpected {{else}}");
  if (result.type === 'BLOCKCLOSE') scanner.fatal("Unexpected closing template tag");
  position = position || TEMPLATE_TAG_POSITION.ELEMENT;
  if (position !== TEMPLATE_TAG_POSITION.ELEMENT) result.position = position;

  if (result.type === 'BLOCKOPEN') {
    // parse block contents
    // Construct a string version of `.path` for comparing start and
    // end tags.  For example, `foo/[0]` was parsed into `["foo", "0"]`
    // and now becomes `foo,0`.  This form may also show up in error
    // messages.
    var blockName = result.path.join(',');
    var textMode = null;

    if (blockName === 'markdown' || position === TEMPLATE_TAG_POSITION.IN_RAWTEXT) {
      textMode = HTML.TEXTMODE.STRING;
    } else if (position === TEMPLATE_TAG_POSITION.IN_RCDATA || position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
      textMode = HTML.TEXTMODE.RCDATA;
    }

    var parserOptions = {
      getTemplateTag: TemplateTag.parseCompleteTag,
      shouldStop: isAtBlockCloseOrElse,
      textMode: textMode
    };
    result.textMode = textMode;
    result.content = HTMLTools.parseFragment(scanner, parserOptions);
    if (scanner.rest().slice(0, 2) !== '{{') scanner.fatal("Expected {{else}} or block close for " + blockName);
    var lastPos = scanner.pos; // save for error messages

    var tmplTag = TemplateTag.parse(scanner); // {{else}} or {{/foo}}

    var lastElseContentTag = result;

    while (tmplTag.type === 'ELSE') {
      if (lastElseContentTag === null) {
        scanner.fatal("Unexpected else after {{else}}");
      }

      if (tmplTag.path) {
        lastElseContentTag.elseContent = new TemplateTag();
        lastElseContentTag.elseContent.type = 'BLOCKOPEN';
        lastElseContentTag.elseContent.path = tmplTag.path;
        lastElseContentTag.elseContent.args = tmplTag.args;
        lastElseContentTag.elseContent.textMode = textMode;
        lastElseContentTag.elseContent.content = HTMLTools.parseFragment(scanner, parserOptions);
        lastElseContentTag = lastElseContentTag.elseContent;
      } else {
        // parse {{else}} and content up to close tag
        lastElseContentTag.elseContent = HTMLTools.parseFragment(scanner, parserOptions);
        lastElseContentTag = null;
      }

      if (scanner.rest().slice(0, 2) !== '{{') scanner.fatal("Expected block close for " + blockName);
      lastPos = scanner.pos;
      tmplTag = TemplateTag.parse(scanner);
    }

    if (tmplTag.type === 'BLOCKCLOSE') {
      var blockName2 = tmplTag.path.join(',');

      if (blockName !== blockName2) {
        scanner.pos = lastPos;
        scanner.fatal('Expected tag to close ' + blockName + ', found ' + blockName2);
      }
    } else {
      scanner.pos = lastPos;
      scanner.fatal('Expected tag to close ' + blockName + ', found ' + tmplTag.type);
    }
  }

  var finalPos = scanner.pos;
  scanner.pos = startPos;
  validateTag(result, scanner);
  scanner.pos = finalPos;
  return result;
};

var isAtBlockCloseOrElse = function (scanner) {
  // Detect `{{else}}` or `{{/foo}}`.
  //
  // We do as much work ourselves before deferring to `TemplateTag.peek`,
  // for efficiency (we're called for every input token) and to be
  // less obtrusive, because `TemplateTag.peek` will throw an error if it
  // sees `{{` followed by a malformed tag.
  var rest, type;
  return scanner.peek() === '{' && (rest = scanner.rest()).slice(0, 2) === '{{' && /^\{\{\s*(\/|else\b)/.test(rest) && (type = TemplateTag.peek(scanner).type) && (type === 'BLOCKCLOSE' || type === 'ELSE');
}; // Validate that `templateTag` is correctly formed and legal for its
// HTML position.  Use `scanner` to report errors. On success, does
// nothing.


var validateTag = function (ttag, scanner) {
  if (ttag.type === 'INCLUSION' || ttag.type === 'BLOCKOPEN') {
    var args = ttag.args;

    if (ttag.path[0] === 'each' && args[1] && args[1][0] === 'PATH' && args[1][1][0] === 'in') {// For slightly better error messages, we detect the each-in case
      // here in order not to complain if the user writes `{{#each 3 in x}}`
      // that "3 is not a function"
    } else {
      if (args.length > 1 && args[0].length === 2 && args[0][0] !== 'PATH') {
        // we have a positional argument that is not a PATH followed by
        // other arguments
        scanner.fatal("First argument must be a function, to be called on " + "the rest of the arguments; found " + args[0][0]);
      }
    }
  }

  var position = ttag.position || TEMPLATE_TAG_POSITION.ELEMENT;

  if (position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
    if (ttag.type === 'DOUBLE' || ttag.type === 'ESCAPE') {
      return;
    } else if (ttag.type === 'BLOCKOPEN') {
      var path = ttag.path;
      var path0 = path[0];

      if (!(path.length === 1 && (path0 === 'if' || path0 === 'unless' || path0 === 'with' || path0 === 'each'))) {
        scanner.fatal("Custom block helpers are not allowed in an HTML attribute, only built-in ones like #each and #if");
      }
    } else {
      scanner.fatal(ttag.type + " template tag is not allowed in an HTML attribute");
    }
  } else if (position === TEMPLATE_TAG_POSITION.IN_START_TAG) {
    if (!(ttag.type === 'DOUBLE')) {
      scanner.fatal("Reactive HTML attributes must either have a constant name or consist of a single {{helper}} providing a dictionary of names and values.  A template tag of type " + ttag.type + " is not allowed here.");
    }

    if (scanner.peek() === '=') {
      scanner.fatal("Template tags are not allowed in attribute names, only in attribute values or in the form of a single {{helper}} that evaluates to a dictionary of name=value pairs.");
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"whitespace.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/spacebars-compiler/whitespace.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  removeWhitespace: () => removeWhitespace
});
let HTML;
module.link("meteor/htmljs", {
  HTML(v) {
    HTML = v;
  }

}, 0);
let TreeTransformer, toRaw;
module.link("./optimizer", {
  TreeTransformer(v) {
    TreeTransformer = v;
  },

  toRaw(v) {
    toRaw = v;
  }

}, 1);

function compactRaw(array) {
  var result = [];

  for (var i = 0; i < array.length; i++) {
    var item = array[i];

    if (item instanceof HTML.Raw) {
      if (!item.value) {
        continue;
      }

      if (result.length && result[result.length - 1] instanceof HTML.Raw) {
        result[result.length - 1] = HTML.Raw(result[result.length - 1].value + item.value);
        continue;
      }
    }

    result.push(item);
  }

  return result;
}

function replaceIfContainsNewline(match) {
  if (match.indexOf('\n') >= 0) {
    return '';
  }

  return match;
}

function stripWhitespace(array) {
  var result = [];

  for (var i = 0; i < array.length; i++) {
    var item = array[i];

    if (item instanceof HTML.Raw) {
      // remove nodes that contain only whitespace & a newline
      if (item.value.indexOf('\n') !== -1 && !/\S/.test(item.value)) {
        continue;
      } // Trim any preceding whitespace, if it contains a newline


      var newStr = item.value;
      newStr = newStr.replace(/^\s+/, replaceIfContainsNewline);
      newStr = newStr.replace(/\s+$/, replaceIfContainsNewline);
      item.value = newStr;
    }

    result.push(item);
  }

  return result;
}

var WhitespaceRemovingVisitor = TreeTransformer.extend();
WhitespaceRemovingVisitor.def({
  visitNull: toRaw,
  visitPrimitive: toRaw,
  visitCharRef: toRaw,
  visitArray: function (array) {
    // this.super(array)
    var result = TreeTransformer.prototype.visitArray.call(this, array);
    result = compactRaw(result);
    result = stripWhitespace(result);
    return result;
  },
  visitTag: function (tag) {
    var tagName = tag.tagName; // TODO - List tags that we don't want to strip whitespace for.

    if (tagName === 'textarea' || tagName === 'script' || tagName === 'pre' || !HTML.isKnownElement(tagName) || HTML.isKnownSVGElement(tagName)) {
      return tag;
    }

    return TreeTransformer.prototype.visitTag.call(this, tag);
  },
  visitAttributes: function (attrs) {
    return attrs;
  }
});

function removeWhitespace(tree) {
  tree = new WhitespaceRemovingVisitor().visit(tree);
  return tree;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/spacebars-compiler/preamble.js");

/* Exports */
Package._define("spacebars-compiler", exports, {
  SpacebarsCompiler: SpacebarsCompiler
});

})();

//# sourceURL=meteor://💻app/packages/spacebars-compiler.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3BhY2ViYXJzLWNvbXBpbGVyL3ByZWFtYmxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zcGFjZWJhcnMtY29tcGlsZXIvY29kZWdlbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3BhY2ViYXJzLWNvbXBpbGVyL2NvbXBpbGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zcGFjZWJhcnMtY29tcGlsZXIvb3B0aW1pemVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zcGFjZWJhcnMtY29tcGlsZXIvcmVhY3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NwYWNlYmFycy1jb21waWxlci90ZW1wbGF0ZXRhZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3BhY2ViYXJzLWNvbXBpbGVyL3doaXRlc3BhY2UuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiU3BhY2ViYXJzQ29tcGlsZXIiLCJDb2RlR2VuIiwiYnVpbHRJbkJsb2NrSGVscGVycyIsImlzUmVzZXJ2ZWROYW1lIiwibGluayIsInYiLCJvcHRpbWl6ZSIsInBhcnNlIiwiY29tcGlsZSIsImNvZGVHZW4iLCJUZW1wbGF0ZVRhZ1JlcGxhY2VyIiwiYmVhdXRpZnkiLCJUZW1wbGF0ZVRhZyIsIl9idWlsdEluQmxvY2tIZWxwZXJzIiwiX1RlbXBsYXRlVGFnUmVwbGFjZXIiLCJfYmVhdXRpZnkiLCJIVE1MVG9vbHMiLCJIVE1MIiwiQmxhemVUb29scyIsImJ1aWx0SW5UZW1wbGF0ZU1hY3JvcyIsImFkZGl0aW9uYWxSZXNlcnZlZE5hbWVzIiwibmFtZSIsImhhc093blByb3BlcnR5IiwiaW5jbHVkZXMiLCJtYWtlT2JqZWN0TGl0ZXJhbCIsIm9iaiIsInBhcnRzIiwiayIsInB1c2giLCJ0b09iamVjdExpdGVyYWxLZXkiLCJqb2luIiwiT2JqZWN0IiwiYXNzaWduIiwicHJvdG90eXBlIiwiY29kZUdlblRlbXBsYXRlVGFnIiwidGFnIiwic2VsZiIsInBvc2l0aW9uIiwiVEVNUExBVEVfVEFHX1BPU0lUSU9OIiwiSU5fU1RBUlRfVEFHIiwiRW1pdENvZGUiLCJjb2RlR2VuTXVzdGFjaGUiLCJwYXRoIiwiYXJncyIsInR5cGUiLCJjb2RlIiwiSU5fQVRUUklCVVRFIiwidG9KU0xpdGVyYWwiLCJsZW5ndGgiLCJFcnJvciIsImRhdGFDb2RlIiwiZWFjaFVzYWdlIiwiaW5BcmciLCJ2YXJpYWJsZUFyZyIsInJlcGxhY2UiLCJ2YXJpYWJsZSIsImNvZGVHZW5JbmNsdXNpb25EYXRhIiwic2xpY2UiLCJkYXRhUHJvcHMiLCJmb3JFYWNoIiwiYXJnIiwiYXJnS2V5IiwiY29kZUdlbkFyZ1ZhbHVlIiwiY29kZUdlbkluY2x1c2lvbkRhdGFGdW5jIiwiY29udGVudEJsb2NrIiwiY29kZUdlbkJsb2NrIiwiY29udGVudCIsImVsc2VDb250ZW50QmxvY2siLCJlbHNlQ29udGVudCIsImNhbGxBcmdzIiwiY29tcENvZGUiLCJjb2RlR2VuUGF0aCIsImxvb2t1cFRlbXBsYXRlIiwiaW5jbHVkZUFyZ3MiLCJpbmNsdWRlQ29kZSIsInZhbHVlIiwib3B0cyIsImZpcnN0UGF0aEl0ZW0iLCJsb29rdXBNZXRob2QiLCJtYXAiLCJhcmdUeXBlIiwiYXJnVmFsdWUiLCJhcmdDb2RlIiwibXVzdGFjaGVUeXBlIiwibmFtZUNvZGUiLCJjb2RlR2VuTXVzdGFjaGVBcmdzIiwibXVzdGFjaGUiLCJ0YWdBcmdzIiwia3dBcmdzIiwiTWV0ZW9yIiwiUmVhY3RDb21wb25lbnRTaWJsaW5nRm9yYmlkZGVyIiwicmVtb3ZlV2hpdGVzcGFjZSIsIlVnbGlmeUpTTWluaWZ5IiwiaXNTZXJ2ZXIiLCJOcG0iLCJyZXF1aXJlIiwibWluaWZ5IiwiaW5wdXQiLCJwYXJzZUZyYWdtZW50IiwiZ2V0VGVtcGxhdGVUYWciLCJwYXJzZUNvbXBsZXRlVGFnIiwib3B0aW9ucyIsInRyZWUiLCJUcmFuc2Zvcm1pbmdWaXNpdG9yIiwiZXh0ZW5kIiwiZGVmIiwidmlzaXRPYmplY3QiLCJ4IiwiaW5BdHRyaWJ1dGVWYWx1ZSIsImNvZGVnZW4iLCJjYWxsIiwidmlzaXRBdHRyaWJ1dGVzIiwiYXR0cnMiLCJ2aXNpdEF0dHJpYnV0ZSIsInJlc3VsdCIsInZpc2l0IiwicGFyc2VUcmVlIiwiaXNUZW1wbGF0ZSIsImlzQm9keSIsIndoaXRlc3BhY2UiLCJzb3VyY2VOYW1lIiwidG9Mb3dlckNhc2UiLCJ0b0pTIiwiZnJvbVN0cmluZyIsIm1hbmdsZSIsImNvbXByZXNzIiwib3V0cHV0IiwiaW5kZW50X2xldmVsIiwid2lkdGgiLCJ0b1JhdyIsIlRyZWVUcmFuc2Zvcm1lciIsImNvbnN0YW50IiwiT1BUSU1JWkFCTEUiLCJOT05FIiwiUEFSVFMiLCJGVUxMIiwiQ2FuT3B0aW1pemVWaXNpdG9yIiwiVmlzaXRvciIsInZpc2l0TnVsbCIsInZpc2l0UHJpbWl0aXZlIiwidmlzaXRDb21tZW50IiwidmlzaXRDaGFyUmVmIiwidmlzaXRSYXciLCJ2aXNpdEZ1bmN0aW9uIiwidmlzaXRBcnJheSIsImkiLCJ2aXNpdFRhZyIsInRhZ05hbWUiLCJpc0tub3duRWxlbWVudCIsImlzS25vd25TVkdFbGVtZW50IiwiY2hpbGRyZW4iLCJpc0FycmF5IiwiYSIsImdldE9wdGltaXphYmlsaXR5IiwiUmF3IiwidG9IVE1MIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJPcHRpbWl6aW5nVmlzaXRvciIsImFycmF5Iiwib3B0aW1pemFiaWxpdHkiLCJ2aXNpdENoaWxkcmVuIiwiUmF3Q29tcGFjdGluZ1Zpc2l0b3IiLCJpdGVtIiwiUmF3UmVwbGFjaW5nVmlzaXRvciIsInJhdyIsImh0bWwiLCJpbmRleE9mIiwicGFyZW50VGFnIiwibnVtU2libGluZ3MiLCJjaGlsZCIsIm1hdGNoIiwiY29uc3RydWN0b3JOYW1lIiwibWFrZVN0YWNoZVRhZ1N0YXJ0UmVnZXgiLCJyIiwiUmVnRXhwIiwic291cmNlIiwiaWdub3JlQ2FzZSIsInN0YXJ0cyIsIkVTQ0FQRSIsIkVMU0UiLCJET1VCTEUiLCJUUklQTEUiLCJCTE9DS0NPTU1FTlQiLCJDT01NRU5UIiwiSU5DTFVTSU9OIiwiQkxPQ0tPUEVOIiwiQkxPQ0tDTE9TRSIsImVuZHMiLCJFWFBSIiwiZW5kc1N0cmluZyIsInNjYW5uZXJPclN0cmluZyIsInNjYW5uZXIiLCJTY2FubmVyIiwicGVlayIsInJlc3QiLCJydW4iLCJyZWdleCIsImV4ZWMiLCJyZXQiLCJwb3MiLCJhZHZhbmNlIiwiYW1vdW50Iiwic2NhbklkZW50aWZpZXIiLCJpc0ZpcnN0SW5QYXRoIiwiaWQiLCJwYXJzZUV4dGVuZGVkSWRlbnRpZmllck5hbWUiLCJleHBlY3RlZCIsImZhdGFsIiwic2NhblBhdGgiLCJzZWdtZW50cyIsImRvdHMiLCJhbmNlc3RvclN0ciIsImVuZHNXaXRoU2xhc2giLCJ0ZXN0Iiwic3BsaXQiLCJkb3RDbGF1c2UiLCJpbmRleCIsInNlZyIsImVycm9yIiwic2VwIiwic2NhbkFyZ0tleXdvcmQiLCJzY2FuQXJnIiwia2V5d29yZCIsInNjYW5BcmdWYWx1ZSIsImNvbmNhdCIsInN0YXJ0UG9zIiwicGFyc2VOdW1iZXIiLCJwYXJzZVN0cmluZ0xpdGVyYWwiLCJzY2FuRXhwciIsImVuZFR5cGUiLCJmb3VuZEt3QXJnIiwibmV3QXJnIiwibXNnIiwid2hhdCIsImxhc3RJbmRleE9mIiwiRUxFTUVOVCIsImJsb2NrTmFtZSIsInRleHRNb2RlIiwiSU5fUkFXVEVYVCIsIlRFWFRNT0RFIiwiU1RSSU5HIiwiSU5fUkNEQVRBIiwiUkNEQVRBIiwicGFyc2VyT3B0aW9ucyIsInNob3VsZFN0b3AiLCJpc0F0QmxvY2tDbG9zZU9yRWxzZSIsImxhc3RQb3MiLCJ0bXBsVGFnIiwibGFzdEVsc2VDb250ZW50VGFnIiwiYmxvY2tOYW1lMiIsImZpbmFsUG9zIiwidmFsaWRhdGVUYWciLCJ0dGFnIiwicGF0aDAiLCJjb21wYWN0UmF3IiwicmVwbGFjZUlmQ29udGFpbnNOZXdsaW5lIiwic3RyaXBXaGl0ZXNwYWNlIiwibmV3U3RyIiwiV2hp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LEdBQVYsRUFBZTtBQUN2QixRQUFJZ0gsT0FBTyxHQUFHaEgsR0FBRyxDQUFDZ0gsT0FBbEIsQ0FEdUIsQ0FFdkI7O0FBQ0EsUUFBSUEsT0FBTyxLQUFLLFVBQVosSUFBMEJBLE9BQU8sS0FBSyxRQUF0QyxJQUFrREEsT0FBTyxLQUFLLEtBQTlELElBQ0MsQ0FBQ2xJLElBQUksQ0FBQ21JLGNBQUwsQ0FBb0JELE9BQXBCLENBREYsSUFDa0NsSSxJQUFJLENBQUNvSSxpQkFBTCxDQUF1QkYsT0FBdkIsQ0FEdEMsRUFDdUU7QUFDckUsYUFBT2hILEdBQVA7QUFDRDs7QUFDRCxXQUFPK0YsZUFBZSxDQUFDakcsU0FBaEIsQ0FBMEJpSCxRQUExQixDQUFtQ3BDLElBQW5DLENBQXdDLElBQXhDLEVBQThDM0UsR0FBOUMsQ0FBUDtBQUNELEdBbkIyQjtBQW9CNUI0RSxpQkFBZSxFQUFFLFVBQVVDLEtBQVYsRUFBaUI7QUFDaEMsV0FBT0EsS0FBUDtBQUNEO0FBdEIyQixDQUE5Qjs7QUEwQk8sU0FBU3JCLGdCQUFULENBQTBCVyxJQUExQixFQUFnQztBQUNyQ0EsTUFBSSxHQUFJLElBQUk2Six5QkFBSixFQUFELENBQWdDaEosS0FBaEMsQ0FBc0NiLElBQXRDLENBQVA7QUFDQSxTQUFPQSxJQUFQO0FBQ0QsQyIsImZpbGUiOiIvcGFja2FnZXMvc3BhY2ViYXJzLWNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29kZUdlbiwgYnVpbHRJbkJsb2NrSGVscGVycywgaXNSZXNlcnZlZE5hbWUgfSBmcm9tICcuL2NvZGVnZW4nO1xuaW1wb3J0IHsgb3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplcic7XG5pbXBvcnQgeyBwYXJzZSwgY29tcGlsZSwgY29kZUdlbiwgVGVtcGxhdGVUYWdSZXBsYWNlciwgYmVhdXRpZnkgfSBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCB7IFRlbXBsYXRlVGFnIH0gZnJvbSAnLi90ZW1wbGF0ZXRhZyc7XG5cblNwYWNlYmFyc0NvbXBpbGVyID0ge1xuICBDb2RlR2VuLFxuICBfYnVpbHRJbkJsb2NrSGVscGVyczogYnVpbHRJbkJsb2NrSGVscGVycyxcbiAgaXNSZXNlcnZlZE5hbWUsXG4gIG9wdGltaXplLFxuICBwYXJzZSxcbiAgY29tcGlsZSxcbiAgY29kZUdlbixcbiAgX1RlbXBsYXRlVGFnUmVwbGFjZXI6IFRlbXBsYXRlVGFnUmVwbGFjZXIsXG4gIF9iZWF1dGlmeTogYmVhdXRpZnksXG4gIFRlbXBsYXRlVGFnLFxufTtcblxuZXhwb3J0IHsgU3BhY2ViYXJzQ29tcGlsZXIgfTtcbiIsImltcG9ydCB7IEhUTUxUb29scyB9IGZyb20gJ21ldGVvci9odG1sLXRvb2xzJztcbmltcG9ydCB7IEhUTUwgfSBmcm9tICdtZXRlb3IvaHRtbGpzJztcbmltcG9ydCB7IEJsYXplVG9vbHMgfSBmcm9tICdtZXRlb3IvYmxhemUtdG9vbHMnO1xuaW1wb3J0IHsgY29kZUdlbiB9IGZyb20gJy4vY29tcGlsZXInO1xuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gQ29kZS1nZW5lcmF0aW9uIG9mIHRlbXBsYXRlIHRhZ3NcblxuLy8gVGhlIGBDb2RlR2VuYCBjbGFzcyBjdXJyZW50bHkgaGFzIG5vIGluc3RhbmNlIHN0YXRlLCBidXQgaW4gdGhlb3J5XG4vLyBpdCBjb3VsZCBiZSB1c2VmdWwgdG8gdHJhY2sgcGVyLWZ1bmN0aW9uIHN0YXRlLCBsaWtlIHdoZXRoZXIgd2Vcbi8vIG5lZWQgdG8gZW1pdCBgdmFyIHNlbGYgPSB0aGlzYCBvciBub3QuXG5leHBvcnQgZnVuY3Rpb24gQ29kZUdlbigpIHt9XG5cbmV4cG9ydCBjb25zdCBidWlsdEluQmxvY2tIZWxwZXJzID0ge1xuICAnaWYnOiAnQmxhemUuSWYnLFxuICAndW5sZXNzJzogJ0JsYXplLlVubGVzcycsXG4gICd3aXRoJzogJ1NwYWNlYmFycy5XaXRoJyxcbiAgJ2VhY2gnOiAnQmxhemUuRWFjaCcsXG4gICdsZXQnOiAnQmxhemUuTGV0J1xufTtcblxuXG4vLyBNYXBwaW5nIG9mIFwibWFjcm9zXCIgd2hpY2gsIHdoZW4gcHJlY2VkZWQgYnkgYFRlbXBsYXRlLmAsIGV4cGFuZFxuLy8gdG8gc3BlY2lhbCBjb2RlIHJhdGhlciB0aGFuIGZvbGxvd2luZyB0aGUgbG9va3VwIHJ1bGVzIGZvciBkb3R0ZWRcbi8vIHN5bWJvbHMuXG52YXIgYnVpbHRJblRlbXBsYXRlTWFjcm9zID0ge1xuICAvLyBgdmlld2AgaXMgYSBsb2NhbCB2YXJpYWJsZSBkZWZpbmVkIGluIHRoZSBnZW5lcmF0ZWQgcmVuZGVyXG4gIC8vIGZ1bmN0aW9uIGZvciB0aGUgdGVtcGxhdGUgaW4gd2hpY2ggYFRlbXBsYXRlLmNvbnRlbnRCbG9ja2Agb3JcbiAgLy8gYFRlbXBsYXRlLmVsc2VCbG9ja2AgaXMgaW52b2tlZC5cbiAgJ2NvbnRlbnRCbG9jayc6ICd2aWV3LnRlbXBsYXRlQ29udGVudEJsb2NrJyxcbiAgJ2Vsc2VCbG9jayc6ICd2aWV3LnRlbXBsYXRlRWxzZUJsb2NrJyxcblxuICAvLyBDb25mdXNpbmdseSwgdGhpcyBtYWtlcyBge3s+IFRlbXBsYXRlLmR5bmFtaWN9fWAgYW4gYWxpYXNcbiAgLy8gZm9yIGB7ez4gX19keW5hbWljfX1gLCB3aGVyZSBcIl9fZHluYW1pY1wiIGlzIHRoZSB0ZW1wbGF0ZSB0aGF0XG4gIC8vIGltcGxlbWVudHMgdGhlIGR5bmFtaWMgdGVtcGxhdGUgZmVhdHVyZS5cbiAgJ2R5bmFtaWMnOiAnVGVtcGxhdGUuX19keW5hbWljJyxcblxuICAnc3Vic2NyaXB0aW9uc1JlYWR5JzogJ3ZpZXcudGVtcGxhdGVJbnN0YW5jZSgpLnN1YnNjcmlwdGlvbnNSZWFkeSgpJ1xufTtcblxudmFyIGFkZGl0aW9uYWxSZXNlcnZlZE5hbWVzID0gW1wiYm9keVwiLCBcInRvU3RyaW5nXCIsIFwiaW5zdGFuY2VcIiwgIFwiY29uc3RydWN0b3JcIixcbiAgXCJ0b1N0cmluZ1wiLCBcInRvTG9jYWxlU3RyaW5nXCIsIFwidmFsdWVPZlwiLCBcImhhc093blByb3BlcnR5XCIsIFwiaXNQcm90b3R5cGVPZlwiLFxuICBcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsIFwiX19kZWZpbmVHZXR0ZXJfX1wiLCBcIl9fbG9va3VwR2V0dGVyX19cIixcbiAgXCJfX2RlZmluZVNldHRlcl9fXCIsIFwiX19sb29rdXBTZXR0ZXJfX1wiLCBcIl9fcHJvdG9fX1wiLCBcImR5bmFtaWNcIixcbiAgXCJyZWdpc3RlckhlbHBlclwiLCBcImN1cnJlbnREYXRhXCIsIFwicGFyZW50RGF0YVwiLCBcIl9taWdyYXRlVGVtcGxhdGVcIixcbiAgXCJfYXBwbHlIbXJDaGFuZ2VzXCIsIFwiX19wZW5kaW5nUmVwbGFjZW1lbnRcIlxuXTtcblxuLy8gQSBcInJlc2VydmVkIG5hbWVcIiBjYW4ndCBiZSB1c2VkIGFzIGEgPHRlbXBsYXRlPiBuYW1lLiAgVGhpc1xuLy8gZnVuY3Rpb24gaXMgdXNlZCBieSB0aGUgdGVtcGxhdGUgZmlsZSBzY2FubmVyLlxuLy9cbi8vIE5vdGUgdGhhdCB0aGUgcnVudGltZSBpbXBvc2VzIGFkZGl0aW9uYWwgcmVzdHJpY3Rpb25zLCBmb3IgZXhhbXBsZVxuLy8gYmFubmluZyB0aGUgbmFtZSBcImJvZHlcIiBhbmQgbmFtZXMgb2YgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXNcbi8vIGxpa2UgXCJ0b1N0cmluZ1wiLlxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVzZXJ2ZWROYW1lKG5hbWUpIHtcbiAgcmV0dXJuIGJ1aWx0SW5CbG9ja0hlbHBlcnMuaGFzT3duUHJvcGVydHkobmFtZSkgfHxcbiAgICBidWlsdEluVGVtcGxhdGVNYWNyb3MuaGFzT3duUHJvcGVydHkobmFtZSkgfHxcbiAgICBhZGRpdGlvbmFsUmVzZXJ2ZWROYW1lcy5pbmNsdWRlcyhuYW1lKTtcbn1cblxudmFyIG1ha2VPYmplY3RMaXRlcmFsID0gZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcGFydHMgPSBbXTtcbiAgZm9yICh2YXIgayBpbiBvYmopXG4gICAgcGFydHMucHVzaChCbGF6ZVRvb2xzLnRvT2JqZWN0TGl0ZXJhbEtleShrKSArICc6ICcgKyBvYmpba10pO1xuICByZXR1cm4gJ3snICsgcGFydHMuam9pbignLCAnKSArICd9Jztcbn07XG5cbk9iamVjdC5hc3NpZ24oQ29kZUdlbi5wcm90b3R5cGUsIHtcbiAgY29kZUdlblRlbXBsYXRlVGFnOiBmdW5jdGlvbiAodGFnKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICh0YWcucG9zaXRpb24gPT09IEhUTUxUb29scy5URU1QTEFURV9UQUdfUE9TSVRJT04uSU5fU1RBUlRfVEFHKSB7XG4gICAgICAvLyBTcGVjaWFsIGR5bmFtaWMgYXR0cmlidXRlczogYDxkaXYge3thdHRyc319Pi4uLmBcbiAgICAgIC8vIG9ubHkgYHRhZy50eXBlID09PSAnRE9VQkxFJ2AgYWxsb3dlZCAoYnkgZWFybGllciB2YWxpZGF0aW9uKVxuICAgICAgcmV0dXJuIEJsYXplVG9vbHMuRW1pdENvZGUoJ2Z1bmN0aW9uICgpIHsgcmV0dXJuICcgK1xuICAgICAgICAgIHNlbGYuY29kZUdlbk11c3RhY2hlKHRhZy5wYXRoLCB0YWcuYXJncywgJ2F0dHJNdXN0YWNoZScpXG4gICAgICAgICAgKyAnOyB9Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0YWcudHlwZSA9PT0gJ0RPVUJMRScgfHwgdGFnLnR5cGUgPT09ICdUUklQTEUnKSB7XG4gICAgICAgIHZhciBjb2RlID0gc2VsZi5jb2RlR2VuTXVzdGFjaGUodGFnLnBhdGgsIHRhZy5hcmdzKTtcbiAgICAgICAgaWYgKHRhZy50eXBlID09PSAnVFJJUExFJykge1xuICAgICAgICAgIGNvZGUgPSAnU3BhY2ViYXJzLm1ha2VSYXcoJyArIGNvZGUgKyAnKSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhZy5wb3NpdGlvbiAhPT0gSFRNTFRvb2xzLlRFTVBMQVRFX1RBR19QT1NJVElPTi5JTl9BVFRSSUJVVEUpIHtcbiAgICAgICAgICAvLyBSZWFjdGl2ZSBhdHRyaWJ1dGVzIGFyZSBhbHJlYWR5IHdyYXBwZWQgaW4gYSBmdW5jdGlvbixcbiAgICAgICAgICAvLyBhbmQgdGhlcmUncyBubyBmaW5lLWdyYWluZWQgcmVhY3Rpdml0eS5cbiAgICAgICAgICAvLyBBbnl3aGVyZSBlbHNlLCB3ZSBuZWVkIHRvIGNyZWF0ZSBhIFZpZXcuXG4gICAgICAgICAgY29kZSA9ICdCbGF6ZS5WaWV3KCcgK1xuICAgICAgICAgICAgQmxhemVUb29scy50b0pTTGl0ZXJhbCgnbG9va3VwOicgKyB0YWcucGF0aC5qb2luKCcuJykpICsgJywgJyArXG4gICAgICAgICAgICAnZnVuY3Rpb24gKCkgeyByZXR1cm4gJyArIGNvZGUgKyAnOyB9KSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEJsYXplVG9vbHMuRW1pdENvZGUoY29kZSk7XG4gICAgICB9IGVsc2UgaWYgKHRhZy50eXBlID09PSAnSU5DTFVTSU9OJyB8fCB0YWcudHlwZSA9PT0gJ0JMT0NLT1BFTicpIHtcbiAgICAgICAgdmFyIHBhdGggPSB0YWcucGF0aDtcbiAgICAgICAgdmFyIGFyZ3MgPSB0YWcuYXJncztcblxuICAgICAgICBpZiAodGFnLnR5cGUgPT09ICdCTE9DS09QRU4nICYmXG4gICAgICAgICAgICBidWlsdEluQmxvY2tIZWxwZXJzLmhhc093blByb3BlcnR5KHBhdGhbMF0pKSB7XG4gICAgICAgICAgLy8gaWYsIHVubGVzcywgd2l0aCwgZWFjaC5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIElmIHNvbWVvbmUgdHJpZXMgdG8gZG8gYHt7PiBpZn19YCwgd2UgZG9uJ3RcbiAgICAgICAgICAvLyBnZXQgaGVyZSwgYnV0IGFuIGVycm9yIGlzIHRocm93biB3aGVuIHdlIHRyeSB0byBjb2RlZ2VuIHRoZSBwYXRoLlxuXG4gICAgICAgICAgLy8gTm90ZTogSWYgd2UgY2F1Z2h0IHRoZXNlIGVycm9ycyBlYXJsaWVyLCB3aGlsZSBzY2FubmluZywgd2UnZCBiZSBhYmxlIHRvXG4gICAgICAgICAgLy8gcHJvdmlkZSBuaWNlIGxpbmUgbnVtYmVycy5cbiAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBkb3R0ZWQgcGF0aCBiZWdpbm5pbmcgd2l0aCBcIiArIHBhdGhbMF0pO1xuICAgICAgICAgIGlmICghIGFyZ3MubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiI1wiICsgcGF0aFswXSArIFwiIHJlcXVpcmVzIGFuIGFyZ3VtZW50XCIpO1xuXG4gICAgICAgICAgdmFyIGRhdGFDb2RlID0gbnVsbDtcbiAgICAgICAgICAvLyAjZWFjaCBoYXMgYSBzcGVjaWFsIHRyZWF0bWVudCBhcyBpdCBmZWF0dXJlcyB0d28gZGlmZmVyZW50IGZvcm1zOlxuICAgICAgICAgIC8vIC0ge3sjZWFjaCBwZW9wbGV9fVxuICAgICAgICAgIC8vIC0ge3sjZWFjaCBwZXJzb24gaW4gcGVvcGxlfX1cbiAgICAgICAgICBpZiAocGF0aFswXSA9PT0gJ2VhY2gnICYmIGFyZ3MubGVuZ3RoID49IDIgJiYgYXJnc1sxXVswXSA9PT0gJ1BBVEgnICYmXG4gICAgICAgICAgICAgIGFyZ3NbMV1bMV0ubGVuZ3RoICYmIGFyZ3NbMV1bMV1bMF0gPT09ICdpbicpIHtcbiAgICAgICAgICAgIC8vIG1pbmltdW0gY29uZGl0aW9ucyBhcmUgbWV0IGZvciBlYWNoLWluLiAgbm93IHZhbGlkYXRlIHRoaXNcbiAgICAgICAgICAgIC8vIGlzbid0IHNvbWUgd2VpcmQgY2FzZS5cbiAgICAgICAgICAgIHZhciBlYWNoVXNhZ2UgPSBcIlVzZSBlaXRoZXIge3sjZWFjaCBpdGVtc319IG9yIFwiICtcbiAgICAgICAgICAgICAgICAgIFwie3sjZWFjaCBpdGVtIGluIGl0ZW1zfX0gZm9ybSBvZiAjZWFjaC5cIjtcbiAgICAgICAgICAgIHZhciBpbkFyZyA9IGFyZ3NbMV07XG4gICAgICAgICAgICBpZiAoISAoYXJncy5sZW5ndGggPj0gMyAmJiBpbkFyZ1sxXS5sZW5ndGggPT09IDEpKSB7XG4gICAgICAgICAgICAgIC8vIHdlIGRvbid0IGhhdmUgYXQgbGVhc3QgMyBzcGFjZS1zZXBhcmF0ZWQgcGFydHMgYWZ0ZXIgI2VhY2gsIG9yXG4gICAgICAgICAgICAgIC8vIGluQXJnIGRvZXNuJ3QgbG9vayBsaWtlIFsnUEFUSCcsWydpbiddXVxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYWxmb3JtZWQgI2VhY2guIFwiICsgZWFjaFVzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNwbGl0IG91dCB0aGUgdmFyaWFibGUgbmFtZSBhbmQgc2VxdWVuY2UgYXJndW1lbnRzXG4gICAgICAgICAgICB2YXIgdmFyaWFibGVBcmcgPSBhcmdzWzBdO1xuICAgICAgICAgICAgaWYgKCEgKHZhcmlhYmxlQXJnWzBdID09PSBcIlBBVEhcIiAmJiB2YXJpYWJsZUFyZ1sxXS5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUFyZ1sxXVswXS5yZXBsYWNlKC9cXC4vZywgJycpKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgdmFyaWFibGUgbmFtZSBpbiAjZWFjaFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB2YXJpYWJsZSA9IHZhcmlhYmxlQXJnWzFdWzBdO1xuICAgICAgICAgICAgZGF0YUNvZGUgPSAnZnVuY3Rpb24gKCkgeyByZXR1cm4geyBfc2VxdWVuY2U6ICcgK1xuICAgICAgICAgICAgICBzZWxmLmNvZGVHZW5JbmNsdXNpb25EYXRhKGFyZ3Muc2xpY2UoMikpICtcbiAgICAgICAgICAgICAgJywgX3ZhcmlhYmxlOiAnICsgQmxhemVUb29scy50b0pTTGl0ZXJhbCh2YXJpYWJsZSkgKyAnIH07IH0nO1xuICAgICAgICAgIH0gZWxzZSBpZiAocGF0aFswXSA9PT0gJ2xldCcpIHtcbiAgICAgICAgICAgIHZhciBkYXRhUHJvcHMgPSB7fTtcbiAgICAgICAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgICAgICAgIGlmIChhcmcubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgLy8gbm90IGEga2V5d29yZCBhcmcgKHg9eSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbmNvcnJlY3QgZm9ybSBvZiAjbGV0XCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBhcmdLZXkgPSBhcmdbMl07XG4gICAgICAgICAgICAgIGRhdGFQcm9wc1thcmdLZXldID1cbiAgICAgICAgICAgICAgICAnZnVuY3Rpb24gKCkgeyByZXR1cm4gU3BhY2ViYXJzLmNhbGwoJyArXG4gICAgICAgICAgICAgICAgc2VsZi5jb2RlR2VuQXJnVmFsdWUoYXJnKSArICcpOyB9JztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGF0YUNvZGUgPSBtYWtlT2JqZWN0TGl0ZXJhbChkYXRhUHJvcHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghIGRhdGFDb2RlKSB7XG4gICAgICAgICAgICAvLyBgYXJnc2AgbXVzdCBleGlzdCAodGFnLmFyZ3MubGVuZ3RoID4gMClcbiAgICAgICAgICAgIGRhdGFDb2RlID0gc2VsZi5jb2RlR2VuSW5jbHVzaW9uRGF0YUZ1bmMoYXJncykgfHwgJ251bGwnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGBjb250ZW50YCBtdXN0IGV4aXN0XG4gICAgICAgICAgdmFyIGNvbnRlbnRCbG9jayA9ICgoJ2NvbnRlbnQnIGluIHRhZykgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb2RlR2VuQmxvY2sodGFnLmNvbnRlbnQpIDogbnVsbCk7XG4gICAgICAgICAgLy8gYGVsc2VDb250ZW50YCBtYXkgbm90IGV4aXN0XG4gICAgICAgICAgdmFyIGVsc2VDb250ZW50QmxvY2sgPSAoKCdlbHNlQ29udGVudCcgaW4gdGFnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb2RlR2VuQmxvY2sodGFnLmVsc2VDb250ZW50KSA6IG51bGwpO1xuXG4gICAgICAgICAgdmFyIGNhbGxBcmdzID0gW2RhdGFDb2RlLCBjb250ZW50QmxvY2tdO1xuICAgICAgICAgIGlmIChlbHNlQ29udGVudEJsb2NrKVxuICAgICAgICAgICAgY2FsbEFyZ3MucHVzaChlbHNlQ29udGVudEJsb2NrKTtcblxuICAgICAgICAgIHJldHVybiBCbGF6ZVRvb2xzLkVtaXRDb2RlKFxuICAgICAgICAgICAgYnVpbHRJbkJsb2NrSGVscGVyc1twYXRoWzBdXSArICcoJyArIGNhbGxBcmdzLmpvaW4oJywgJykgKyAnKScpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGNvbXBDb2RlID0gc2VsZi5jb2RlR2VuUGF0aChwYXRoLCB7bG9va3VwVGVtcGxhdGU6IHRydWV9KTtcbiAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAvLyBjYXB0dXJlIHJlYWN0aXZpdHlcbiAgICAgICAgICAgIGNvbXBDb2RlID0gJ2Z1bmN0aW9uICgpIHsgcmV0dXJuIFNwYWNlYmFycy5jYWxsKCcgKyBjb21wQ29kZSArXG4gICAgICAgICAgICAgICcpOyB9JztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZGF0YUNvZGUgPSBzZWxmLmNvZGVHZW5JbmNsdXNpb25EYXRhRnVuYyh0YWcuYXJncyk7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSAoKCdjb250ZW50JyBpbiB0YWcpID9cbiAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvZGVHZW5CbG9jayh0YWcuY29udGVudCkgOiBudWxsKTtcbiAgICAgICAgICB2YXIgZWxzZUNvbnRlbnQgPSAoKCdlbHNlQ29udGVudCcgaW4gdGFnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29kZUdlbkJsb2NrKHRhZy5lbHNlQ29udGVudCkgOiBudWxsKTtcblxuICAgICAgICAgIHZhciBpbmNsdWRlQXJncyA9IFtjb21wQ29kZV07XG4gICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgIGluY2x1ZGVBcmdzLnB1c2goY29udGVudCk7XG4gICAgICAgICAgICBpZiAoZWxzZUNvbnRlbnQpXG4gICAgICAgICAgICAgIGluY2x1ZGVBcmdzLnB1c2goZWxzZUNvbnRlbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBpbmNsdWRlQ29kZSA9XG4gICAgICAgICAgICAgICAgJ1NwYWNlYmFycy5pbmNsdWRlKCcgKyBpbmNsdWRlQXJncy5qb2luKCcsICcpICsgJyknO1xuXG4gICAgICAgICAgLy8gY2FsbGluZyBjb252ZW50aW9uIGNvbXBhdCAtLSBzZXQgdGhlIGRhdGEgY29udGV4dCBhcm91bmQgdGhlXG4gICAgICAgICAgLy8gZW50aXJlIGluY2x1c2lvbiwgc28gdGhhdCBpZiB0aGUgbmFtZSBvZiB0aGUgaW5jbHVzaW9uIGlzXG4gICAgICAgICAgLy8gYSBoZWxwZXIgZnVuY3Rpb24sIGl0IGdldHMgdGhlIGRhdGEgY29udGV4dCBpbiBgdGhpc2AuXG4gICAgICAgICAgLy8gVGhpcyBtYWtlcyBmb3IgYSBwcmV0dHkgY29uZnVzaW5nIGNhbGxpbmcgY29udmVudGlvbiAtLVxuICAgICAgICAgIC8vIEluIGB7eyNmb28gYmFyfX1gLCBgZm9vYCBpcyBldmFsdWF0ZWQgaW4gdGhlIGNvbnRleHQgb2YgYGJhcmBcbiAgICAgICAgICAvLyAtLSBidXQgaXQncyB3aGF0IHdlIHNoaXBwZWQgZm9yIDAuOC4wLiAgVGhlIHJhdGlvbmFsZSBpcyB0aGF0XG4gICAgICAgICAgLy8gYHt7I2ZvbyBiYXJ9fWAgaXMgc3VnYXIgZm9yIGB7eyN3aXRoIGJhcn19e3sjZm9vfX0uLi5gLlxuICAgICAgICAgIGlmIChkYXRhQ29kZSkge1xuICAgICAgICAgICAgaW5jbHVkZUNvZGUgPVxuICAgICAgICAgICAgICAnQmxhemUuX1RlbXBsYXRlV2l0aCgnICsgZGF0YUNvZGUgKyAnLCBmdW5jdGlvbiAoKSB7IHJldHVybiAnICtcbiAgICAgICAgICAgICAgaW5jbHVkZUNvZGUgKyAnOyB9KSc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gWFhYIEJBQ0sgQ09NUEFUIC0gVUkgaXMgdGhlIG9sZCBuYW1lLCBUZW1wbGF0ZSBpcyB0aGUgbmV3XG4gICAgICAgICAgaWYgKChwYXRoWzBdID09PSAnVUknIHx8IHBhdGhbMF0gPT09ICdUZW1wbGF0ZScpICYmXG4gICAgICAgICAgICAgIChwYXRoWzFdID09PSAnY29udGVudEJsb2NrJyB8fCBwYXRoWzFdID09PSAnZWxzZUJsb2NrJykpIHtcbiAgICAgICAgICAgIC8vIENhbGwgY29udGVudEJsb2NrIGFuZCBlbHNlQmxvY2sgaW4gdGhlIGFwcHJvcHJpYXRlIHNjb3BlXG4gICAgICAgICAgICBpbmNsdWRlQ29kZSA9ICdCbGF6ZS5fSW5PdXRlclRlbXBsYXRlU2NvcGUodmlldywgZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1xuICAgICAgICAgICAgICArIGluY2x1ZGVDb2RlICsgJzsgfSknO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBCbGF6ZVRvb2xzLkVtaXRDb2RlKGluY2x1ZGVDb2RlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YWcudHlwZSA9PT0gJ0VTQ0FQRScpIHtcbiAgICAgICAgcmV0dXJuIHRhZy52YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENhbid0IGdldCBoZXJlOyBUZW1wbGF0ZVRhZyB2YWxpZGF0aW9uIHNob3VsZCBjYXRjaCBhbnlcbiAgICAgICAgLy8gaW5hcHByb3ByaWF0ZSB0YWcgdHlwZXMgdGhhdCBtaWdodCBjb21lIG91dCBvZiB0aGUgcGFyc2VyLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIHRlbXBsYXRlIHRhZyB0eXBlOiBcIiArIHRhZy50eXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gYHBhdGhgIGlzIGFuIGFycmF5IG9mIGF0IGxlYXN0IG9uZSBzdHJpbmcuXG4gIC8vXG4gIC8vIElmIGBwYXRoLmxlbmd0aCA+IDFgLCB0aGUgZ2VuZXJhdGVkIGNvZGUgbWF5IGJlIHJlYWN0aXZlXG4gIC8vIChpLmUuIGl0IG1heSBpbnZhbGlkYXRlIHRoZSBjdXJyZW50IGNvbXB1dGF0aW9uKS5cbiAgLy9cbiAgLy8gTm8gY29kZSBpcyBnZW5lcmF0ZWQgdG8gY2FsbCB0aGUgcmVzdWx0IGlmIGl0J3MgYSBmdW5jdGlvbi5cbiAgLy9cbiAgLy8gT3B0aW9uczpcbiAgLy9cbiAgLy8gLSBsb29rdXBUZW1wbGF0ZSB7Qm9vbGVhbn0gSWYgdHJ1ZSwgZ2VuZXJhdGVkIGNvZGUgYWxzbyBsb29rcyBpblxuICAvLyAgIHRoZSBsaXN0IG9mIHRlbXBsYXRlcy4gKEFmdGVyIGhlbHBlcnMsIGJlZm9yZSBkYXRhIGNvbnRleHQpLlxuICAvLyAgIFVzZWQgd2hlbiBnZW5lcmF0aW5nIGNvZGUgZm9yIGB7ez4gZm9vfX1gIG9yIGB7eyNmb299fWAuIE9ubHlcbiAgLy8gICB1c2VkIGZvciBub24tZG90dGVkIHBhdGhzLlxuICBjb2RlR2VuUGF0aDogZnVuY3Rpb24gKHBhdGgsIG9wdHMpIHtcbiAgICBpZiAoYnVpbHRJbkJsb2NrSGVscGVycy5oYXNPd25Qcm9wZXJ0eShwYXRoWzBdKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHVzZSB0aGUgYnVpbHQtaW4gJ1wiICsgcGF0aFswXSArIFwiJyBoZXJlXCIpO1xuICAgIC8vIExldCBge3sjaWYgVGVtcGxhdGUuY29udGVudEJsb2NrfX1gIGNoZWNrIHdoZXRoZXIgdGhpcyB0ZW1wbGF0ZSB3YXNcbiAgICAvLyBpbnZva2VkIHZpYSBpbmNsdXNpb24gb3IgYXMgYSBibG9jayBoZWxwZXIsIGluIGFkZGl0aW9uIHRvIHN1cHBvcnRpbmdcbiAgICAvLyBge3s+IFRlbXBsYXRlLmNvbnRlbnRCbG9ja319YC5cbiAgICAvLyBYWFggQkFDSyBDT01QQVQgLSBVSSBpcyB0aGUgb2xkIG5hbWUsIFRlbXBsYXRlIGlzIHRoZSBuZXdcbiAgICBpZiAocGF0aC5sZW5ndGggPj0gMiAmJlxuICAgICAgICAocGF0aFswXSA9PT0gJ1VJJyB8fCBwYXRoWzBdID09PSAnVGVtcGxhdGUnKVxuICAgICAgICAmJiBidWlsdEluVGVtcGxhdGVNYWNyb3MuaGFzT3duUHJvcGVydHkocGF0aFsxXSkpIHtcbiAgICAgIGlmIChwYXRoLmxlbmd0aCA+IDIpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgZG90dGVkIHBhdGggYmVnaW5uaW5nIHdpdGggXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aFswXSArICcuJyArIHBhdGhbMV0pO1xuICAgICAgcmV0dXJuIGJ1aWx0SW5UZW1wbGF0ZU1hY3Jvc1twYXRoWzFdXTtcbiAgICB9XG5cbiAgICB2YXIgZmlyc3RQYXRoSXRlbSA9IEJsYXplVG9vbHMudG9KU0xpdGVyYWwocGF0aFswXSk7XG4gICAgdmFyIGxvb2t1cE1ldGhvZCA9ICdsb29rdXAnO1xuICAgIGlmIChvcHRzICYmIG9wdHMubG9va3VwVGVtcGxhdGUgJiYgcGF0aC5sZW5ndGggPT09IDEpXG4gICAgICBsb29rdXBNZXRob2QgPSAnbG9va3VwVGVtcGxhdGUnO1xuICAgIHZhciBjb2RlID0gJ3ZpZXcuJyArIGxvb2t1cE1ldGhvZCArICcoJyArIGZpcnN0UGF0aEl0ZW0gKyAnKSc7XG5cbiAgICBpZiAocGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICBjb2RlID0gJ1NwYWNlYmFycy5kb3QoJyArIGNvZGUgKyAnLCAnICtcbiAgICAgIHBhdGguc2xpY2UoMSkubWFwKEJsYXplVG9vbHMudG9KU0xpdGVyYWwpLmpvaW4oJywgJykgKyAnKSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZGU7XG4gIH0sXG5cbiAgLy8gR2VuZXJhdGVzIGNvZGUgZm9yIGFuIGBbYXJnVHlwZSwgYXJnVmFsdWVdYCBhcmd1bWVudCBzcGVjLFxuICAvLyBpZ25vcmluZyB0aGUgdGhpcmQgZWxlbWVudCAoa2V5d29yZCBhcmd1bWVudCBuYW1lKSBpZiBwcmVzZW50LlxuICAvL1xuICAvLyBUaGUgcmVzdWx0aW5nIGNvZGUgbWF5IGJlIHJlYWN0aXZlIChpbiB0aGUgY2FzZSBvZiBhIFBBVEggb2ZcbiAgLy8gbW9yZSB0aGFuIG9uZSBlbGVtZW50KSBhbmQgaXMgbm90IHdyYXBwZWQgaW4gYSBjbG9zdXJlLlxuICBjb2RlR2VuQXJnVmFsdWU6IGZ1bmN0aW9uIChhcmcpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgYXJnVHlwZSA9IGFyZ1swXTtcbiAgICB2YXIgYXJnVmFsdWUgPSBhcmdbMV07XG5cbiAgICB2YXIgYXJnQ29kZTtcbiAgICBzd2l0Y2ggKGFyZ1R5cGUpIHtcbiAgICBjYXNlICdTVFJJTkcnOlxuICAgIGNhc2UgJ05VTUJFUic6XG4gICAgY2FzZSAnQk9PTEVBTic6XG4gICAgY2FzZSAnTlVMTCc6XG4gICAgICBhcmdDb2RlID0gQmxhemVUb29scy50b0pTTGl0ZXJhbChhcmdWYWx1ZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdQQVRIJzpcbiAgICAgIGFyZ0NvZGUgPSBzZWxmLmNvZGVHZW5QYXRoKGFyZ1ZhbHVlKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0VYUFInOlxuICAgICAgLy8gVGhlIGZvcm1hdCBvZiBFWFBSIGlzIFsnRVhQUicsIHsgdHlwZTogJ0VYUFInLCBwYXRoOiBbLi4uXSwgYXJnczogeyAuLi4gfSB9XVxuICAgICAgYXJnQ29kZSA9IHNlbGYuY29kZUdlbk11c3RhY2hlKGFyZ1ZhbHVlLnBhdGgsIGFyZ1ZhbHVlLmFyZ3MsICdkYXRhTXVzdGFjaGUnKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBjYW4ndCBnZXQgaGVyZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBhcmcgdHlwZTogXCIgKyBhcmdUeXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJnQ29kZTtcbiAgfSxcblxuICAvLyBHZW5lcmF0ZXMgYSBjYWxsIHRvIGBTcGFjZWJhcnMuZm9vTXVzdGFjaGVgIG9uIGV2YWx1YXRlZCBhcmd1bWVudHMuXG4gIC8vIFRoZSByZXN1bHRpbmcgY29kZSBoYXMgbm8gZnVuY3Rpb24gbGl0ZXJhbHMgYW5kIG11c3QgYmUgd3JhcHBlZCBpblxuICAvLyBvbmUgZm9yIGZpbmUtZ3JhaW5lZCByZWFjdGl2aXR5LlxuICBjb2RlR2VuTXVzdGFjaGU6IGZ1bmN0aW9uIChwYXRoLCBhcmdzLCBtdXN0YWNoZVR5cGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgbmFtZUNvZGUgPSBzZWxmLmNvZGVHZW5QYXRoKHBhdGgpO1xuICAgIHZhciBhcmdDb2RlID0gc2VsZi5jb2RlR2VuTXVzdGFjaGVBcmdzKGFyZ3MpO1xuICAgIHZhciBtdXN0YWNoZSA9IChtdXN0YWNoZVR5cGUgfHwgJ211c3RhY2hlJyk7XG5cbiAgICByZXR1cm4gJ1NwYWNlYmFycy4nICsgbXVzdGFjaGUgKyAnKCcgKyBuYW1lQ29kZSArXG4gICAgICAoYXJnQ29kZSA/ICcsICcgKyBhcmdDb2RlLmpvaW4oJywgJykgOiAnJykgKyAnKSc7XG4gIH0sXG5cbiAgLy8gcmV0dXJuczogYXJyYXkgb2Ygc291cmNlIHN0cmluZ3MsIG9yIG51bGwgaWYgbm9cbiAgLy8gYXJncyBhdCBhbGwuXG4gIGNvZGVHZW5NdXN0YWNoZUFyZ3M6IGZ1bmN0aW9uICh0YWdBcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGt3QXJncyA9IG51bGw7IC8vIHNvdXJjZSAtPiBzb3VyY2VcbiAgICB2YXIgYXJncyA9IG51bGw7IC8vIFtzb3VyY2VdXG5cbiAgICAvLyB0YWdBcmdzIG1heSBiZSBudWxsXG4gICAgdGFnQXJncy5mb3JFYWNoKGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgIHZhciBhcmdDb2RlID0gc2VsZi5jb2RlR2VuQXJnVmFsdWUoYXJnKTtcblxuICAgICAgaWYgKGFyZy5sZW5ndGggPiAyKSB7XG4gICAgICAgIC8vIGtleXdvcmQgYXJndW1lbnQgKHJlcHJlc2VudGVkIGFzIFt0eXBlLCB2YWx1ZSwgbmFtZV0pXG4gICAgICAgIGt3QXJncyA9IChrd0FyZ3MgfHwge30pO1xuICAgICAgICBrd0FyZ3NbYXJnWzJdXSA9IGFyZ0NvZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50XG4gICAgICAgIGFyZ3MgPSAoYXJncyB8fCBbXSk7XG4gICAgICAgIGFyZ3MucHVzaChhcmdDb2RlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHB1dCBrd0FyZ3MgaW4gb3B0aW9ucyBkaWN0aW9uYXJ5IGF0IGVuZCBvZiBhcmdzXG4gICAgaWYgKGt3QXJncykge1xuICAgICAgYXJncyA9IChhcmdzIHx8IFtdKTtcbiAgICAgIGFyZ3MucHVzaCgnU3BhY2ViYXJzLmt3KCcgKyBtYWtlT2JqZWN0TGl0ZXJhbChrd0FyZ3MpICsgJyknKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJncztcbiAgfSxcblxuICBjb2RlR2VuQmxvY2s6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgcmV0dXJuIGNvZGVHZW4oY29udGVudCk7XG4gIH0sXG5cbiAgY29kZUdlbkluY2x1c2lvbkRhdGE6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKCEgYXJncy5sZW5ndGgpIHtcbiAgICAgIC8vIGUuZy4gYHt7I2Zvb319YFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChhcmdzWzBdLmxlbmd0aCA9PT0gMykge1xuICAgICAgLy8ga2V5d29yZCBhcmd1bWVudHMgb25seSwgZS5nLiBge3s+IHBvaW50IHg9MSB5PTJ9fWBcbiAgICAgIHZhciBkYXRhUHJvcHMgPSB7fTtcbiAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgIHZhciBhcmdLZXkgPSBhcmdbMl07XG4gICAgICAgIGRhdGFQcm9wc1thcmdLZXldID0gJ1NwYWNlYmFycy5jYWxsKCcgKyBzZWxmLmNvZGVHZW5BcmdWYWx1ZShhcmcpICsgJyknO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFrZU9iamVjdExpdGVyYWwoZGF0YVByb3BzKTtcbiAgICB9IGVsc2UgaWYgKGFyZ3NbMF1bMF0gIT09ICdQQVRIJykge1xuICAgICAgLy8gbGl0ZXJhbCBmaXJzdCBhcmd1bWVudCwgZS5nLiBge3s+IGZvbyBcImJsYWhcIn19YFxuICAgICAgLy9cbiAgICAgIC8vIHRhZyB2YWxpZGF0aW9uIGhhcyBjb25maXJtZWQsIGluIHRoaXMgY2FzZSwgdGhhdCB0aGVyZSBpcyBvbmx5XG4gICAgICAvLyBvbmUgYXJndW1lbnQgKGBhcmdzLmxlbmd0aCA9PT0gMWApXG4gICAgICByZXR1cm4gc2VsZi5jb2RlR2VuQXJnVmFsdWUoYXJnc1swXSk7XG4gICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gb25lIGFyZ3VtZW50LCBtdXN0IGJlIGEgUEFUSFxuICAgICAgcmV0dXJuICdTcGFjZWJhcnMuY2FsbCgnICsgc2VsZi5jb2RlR2VuUGF0aChhcmdzWzBdWzFdKSArICcpJztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTXVsdGlwbGUgcG9zaXRpb25hbCBhcmd1bWVudHM7IHRyZWF0IHRoZW0gYXMgYSBuZXN0ZWRcbiAgICAgIC8vIFwiZGF0YSBtdXN0YWNoZVwiXG4gICAgICByZXR1cm4gc2VsZi5jb2RlR2VuTXVzdGFjaGUoYXJnc1swXVsxXSwgYXJncy5zbGljZSgxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YU11c3RhY2hlJyk7XG4gICAgfVxuXG4gIH0sXG5cbiAgY29kZUdlbkluY2x1c2lvbkRhdGFGdW5jOiBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGF0YUNvZGUgPSBzZWxmLmNvZGVHZW5JbmNsdXNpb25EYXRhKGFyZ3MpO1xuICAgIGlmIChkYXRhQ29kZSkge1xuICAgICAgcmV0dXJuICdmdW5jdGlvbiAoKSB7IHJldHVybiAnICsgZGF0YUNvZGUgKyAnOyB9JztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbn0pO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVE1MVG9vbHMgfSBmcm9tICdtZXRlb3IvaHRtbC10b29scyc7XG5pbXBvcnQgeyBIVE1MIH0gZnJvbSAnbWV0ZW9yL2h0bWxqcyc7XG5pbXBvcnQgeyBCbGF6ZVRvb2xzIH0gZnJvbSAnbWV0ZW9yL2JsYXplLXRvb2xzJztcbmltcG9ydCB7IENvZGVHZW4gfSBmcm9tICcuL2NvZGVnZW4nO1xuaW1wb3J0IHsgb3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplcic7XG5pbXBvcnQgeyBSZWFjdENvbXBvbmVudFNpYmxpbmdGb3JiaWRkZXJ9IGZyb20gJy4vcmVhY3QnO1xuaW1wb3J0IHsgVGVtcGxhdGVUYWcgfSBmcm9tICcuL3RlbXBsYXRldGFnJztcbmltcG9ydCB7IHJlbW92ZVdoaXRlc3BhY2UgfSBmcm9tICcuL3doaXRlc3BhY2UnO1xuXG52YXIgVWdsaWZ5SlNNaW5pZnkgPSBudWxsO1xuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBVZ2xpZnlKU01pbmlmeSA9IE5wbS5yZXF1aXJlKCd1Z2xpZnktanMnKS5taW5pZnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShpbnB1dCkge1xuICByZXR1cm4gSFRNTFRvb2xzLnBhcnNlRnJhZ21lbnQoXG4gICAgaW5wdXQsXG4gICAgeyBnZXRUZW1wbGF0ZVRhZzogVGVtcGxhdGVUYWcucGFyc2VDb21wbGV0ZVRhZyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGUoaW5wdXQsIG9wdGlvbnMpIHtcbiAgdmFyIHRyZWUgPSBwYXJzZShpbnB1dCk7XG4gIHJldHVybiBjb2RlR2VuKHRyZWUsIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgY29uc3QgVGVtcGxhdGVUYWdSZXBsYWNlciA9IEhUTUwuVHJhbnNmb3JtaW5nVmlzaXRvci5leHRlbmQoKTtcblRlbXBsYXRlVGFnUmVwbGFjZXIuZGVmKHtcbiAgdmlzaXRPYmplY3Q6IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBIVE1MVG9vbHMuVGVtcGxhdGVUYWcpIHtcblxuICAgICAgLy8gTWFrZSBzdXJlIGFsbCBUZW1wbGF0ZVRhZ3MgaW4gYXR0cmlidXRlcyBoYXZlIHRoZSByaWdodFxuICAgICAgLy8gYC5wb3NpdGlvbmAgc2V0IG9uIHRoZW0uICBUaGlzIGlzIGEgYml0IG9mIGEgaGFja1xuICAgICAgLy8gKHdlIHNob3VsZG4ndCBiZSBtdXRhdGluZyB0aGF0IGhlcmUpLCBidXQgaXQgYWxsb3dzXG4gICAgICAvLyBjbGVhbmVyIGNvZGVnZW4gb2YgXCJzeW50aGV0aWNcIiBhdHRyaWJ1dGVzIGxpa2UgVEVYVEFSRUEnc1xuICAgICAgLy8gXCJ2YWx1ZVwiLCB3aGVyZSB0aGUgdGVtcGxhdGUgdGFncyB3ZXJlIG9yaWdpbmFsbHkgbm90XG4gICAgICAvLyBpbiBhbiBhdHRyaWJ1dGUuXG4gICAgICBpZiAodGhpcy5pbkF0dHJpYnV0ZVZhbHVlKVxuICAgICAgICB4LnBvc2l0aW9uID0gSFRNTFRvb2xzLlRFTVBMQVRFX1RBR19QT1NJVElPTi5JTl9BVFRSSUJVVEU7XG5cbiAgICAgIHJldHVybiB0aGlzLmNvZGVnZW4uY29kZUdlblRlbXBsYXRlVGFnKHgpO1xuICAgIH1cblxuICAgIHJldHVybiBIVE1MLlRyYW5zZm9ybWluZ1Zpc2l0b3IucHJvdG90eXBlLnZpc2l0T2JqZWN0LmNhbGwodGhpcywgeCk7XG4gIH0sXG4gIHZpc2l0QXR0cmlidXRlczogZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgaWYgKGF0dHJzIGluc3RhbmNlb2YgSFRNTFRvb2xzLlRlbXBsYXRlVGFnKVxuICAgICAgcmV0dXJuIHRoaXMuY29kZWdlbi5jb2RlR2VuVGVtcGxhdGVUYWcoYXR0cnMpO1xuXG4gICAgLy8gY2FsbCBzdXBlciAoZS5nLiBmb3IgY2FzZSB3aGVyZSBgYXR0cnNgIGlzIGFuIGFycmF5KVxuICAgIHJldHVybiBIVE1MLlRyYW5zZm9ybWluZ1Zpc2l0b3IucHJvdG90eXBlLnZpc2l0QXR0cmlidXRlcy5jYWxsKHRoaXMsIGF0dHJzKTtcbiAgfSxcbiAgdmlzaXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSwgdGFnKSB7XG4gICAgdGhpcy5pbkF0dHJpYnV0ZVZhbHVlID0gdHJ1ZTtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy52aXNpdCh2YWx1ZSk7XG4gICAgdGhpcy5pbkF0dHJpYnV0ZVZhbHVlID0gZmFsc2U7XG5cbiAgICBpZiAocmVzdWx0ICE9PSB2YWx1ZSkge1xuICAgICAgLy8gc29tZSB0ZW1wbGF0ZSB0YWdzIG11c3QgaGF2ZSBiZWVuIHJlcGxhY2VkLCBiZWNhdXNlIG90aGVyd2lzZVxuICAgICAgLy8gd2UgdHJ5IHRvIGtlZXAgdGhpbmdzIGA9PT1gIHdoZW4gdHJhbnNmb3JtaW5nLiAgV3JhcCB0aGUgY29kZVxuICAgICAgLy8gaW4gYSBmdW5jdGlvbiBhcyBwZXIgdGhlIHJ1bGVzLiAgWW91IGNhbid0IGhhdmVcbiAgICAgIC8vIGB7aWQ6IEJsYXplLlZpZXcoLi4uKX1gIGFzIGFuIGF0dHJpYnV0ZXMgZGljdCBiZWNhdXNlIHRoZSBWaWV3XG4gICAgICAvLyB3b3VsZCBiZSByZW5kZXJlZCBtb3JlIHRoYW4gb25jZTsgeW91IG5lZWQgdG8gd3JhcCBpdCBpbiBhIGZ1bmN0aW9uXG4gICAgICAvLyBzbyB0aGF0IGl0J3MgYSBkaWZmZXJlbnQgVmlldyBlYWNoIHRpbWUuXG4gICAgICByZXR1cm4gQmxhemVUb29scy5FbWl0Q29kZSh0aGlzLmNvZGVnZW4uY29kZUdlbkJsb2NrKHJlc3VsdCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvZGVHZW4gKHBhcnNlVHJlZSwgb3B0aW9ucykge1xuICAvLyBpcyB0aGlzIGEgdGVtcGxhdGUsIHJhdGhlciB0aGFuIGEgYmxvY2sgcGFzc2VkIHRvXG4gIC8vIGEgYmxvY2sgaGVscGVyLCBzYXlcbiAgdmFyIGlzVGVtcGxhdGUgPSAob3B0aW9ucyAmJiBvcHRpb25zLmlzVGVtcGxhdGUpO1xuICB2YXIgaXNCb2R5ID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5pc0JvZHkpO1xuICB2YXIgd2hpdGVzcGFjZSA9IChvcHRpb25zICYmIG9wdGlvbnMud2hpdGVzcGFjZSlcbiAgdmFyIHNvdXJjZU5hbWUgPSAob3B0aW9ucyAmJiBvcHRpb25zLnNvdXJjZU5hbWUpO1xuXG4gIHZhciB0cmVlID0gcGFyc2VUcmVlO1xuXG4gIC8vIFRoZSBmbGFncyBgaXNUZW1wbGF0ZWAgYW5kIGBpc0JvZHlgIGFyZSBraW5kIG9mIGEgaGFjay5cbiAgaWYgKGlzVGVtcGxhdGUgfHwgaXNCb2R5KSB7XG4gICAgaWYgKHR5cGVvZiB3aGl0ZXNwYWNlID09PSAnc3RyaW5nJyAmJiB3aGl0ZXNwYWNlLnRvTG93ZXJDYXNlKCkgPT09ICdzdHJpcCcpIHtcbiAgICAgIHRyZWUgPSByZW1vdmVXaGl0ZXNwYWNlKHRyZWUpO1xuICAgIH1cbiAgICAvLyBvcHRpbWl6aW5nIGZyYWdtZW50cyB3b3VsZCByZXF1aXJlIGJlaW5nIHNtYXJ0ZXIgYWJvdXQgd2hldGhlciB3ZSBhcmVcbiAgICAvLyBpbiBhIFRFWFRBUkVBLCBzYXkuXG4gICAgdHJlZSA9IG9wdGltaXplKHRyZWUpO1xuICB9XG5cbiAgLy8gdGhyb3dzIGFuIGVycm9yIGlmIHVzaW5nIGB7ez4gUmVhY3R9fWAgd2l0aCBzaWJsaW5nc1xuICBuZXcgUmVhY3RDb21wb25lbnRTaWJsaW5nRm9yYmlkZGVyKHtzb3VyY2VOYW1lOiBzb3VyY2VOYW1lfSlcbiAgICAudmlzaXQodHJlZSk7XG5cbiAgdmFyIGNvZGVnZW4gPSBuZXcgQ29kZUdlbjtcbiAgdHJlZSA9IChuZXcgVGVtcGxhdGVUYWdSZXBsYWNlcihcbiAgICB7Y29kZWdlbjogY29kZWdlbn0pKS52aXNpdCh0cmVlKTtcblxuICB2YXIgY29kZSA9ICcoZnVuY3Rpb24gKCkgeyAnO1xuICBpZiAoaXNUZW1wbGF0ZSB8fCBpc0JvZHkpIHtcbiAgICBjb2RlICs9ICd2YXIgdmlldyA9IHRoaXM7ICc7XG4gIH1cbiAgY29kZSArPSAncmV0dXJuICc7XG4gIGNvZGUgKz0gQmxhemVUb29scy50b0pTKHRyZWUpO1xuICBjb2RlICs9ICc7IH0pJztcblxuICBjb2RlID0gYmVhdXRpZnkoY29kZSk7XG5cbiAgcmV0dXJuIGNvZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZWF1dGlmeSAoY29kZSkge1xuICBpZiAoIVVnbGlmeUpTTWluaWZ5KSB7XG4gICAgcmV0dXJuIGNvZGU7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gVWdsaWZ5SlNNaW5pZnkoY29kZSwge1xuICAgIGZyb21TdHJpbmc6IHRydWUsXG4gICAgbWFuZ2xlOiBmYWxzZSxcbiAgICBjb21wcmVzczogZmFsc2UsXG4gICAgb3V0cHV0OiB7XG4gICAgICBiZWF1dGlmeTogdHJ1ZSxcbiAgICAgIGluZGVudF9sZXZlbDogMixcbiAgICAgIHdpZHRoOiA4MFxuICAgIH1cbiAgfSk7XG5cbiAgdmFyIG91dHB1dCA9IHJlc3VsdC5jb2RlO1xuICAvLyBVZ2xpZnkgaW50ZXJwcmV0cyBvdXIgZXhwcmVzc2lvbiBhcyBhIHN0YXRlbWVudCBhbmQgbWF5IGFkZCBhIHNlbWljb2xvbi5cbiAgLy8gU3RyaXAgdHJhaWxpbmcgc2VtaWNvbG9uLlxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvOyQvLCAnJyk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG4iLCJpbXBvcnQgeyBIVE1MVG9vbHMgfSBmcm9tICdtZXRlb3IvaHRtbC10b29scyc7XG5pbXBvcnQgeyBIVE1MIH0gZnJvbSAnbWV0ZW9yL2h0bWxqcyc7XG5cbi8vIE9wdGltaXplIHBhcnRzIG9mIGFuIEhUTUxqcyB0cmVlIGludG8gcmF3IEhUTUwgc3RyaW5ncyB3aGVuIHRoZXkgZG9uJ3Rcbi8vIGNvbnRhaW4gdGVtcGxhdGUgdGFncy5cblxudmFyIGNvbnN0YW50ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfTtcbn07XG5cbnZhciBPUFRJTUlaQUJMRSA9IHtcbiAgTk9ORTogMCxcbiAgUEFSVFM6IDEsXG4gIEZVTEw6IDJcbn07XG5cbi8vIFdlIGNhbiBvbmx5IHR1cm4gY29udGVudCBpbnRvIGFuIEhUTUwgc3RyaW5nIGlmIGl0IGNvbnRhaW5zIG5vIHRlbXBsYXRlXG4vLyB0YWdzIGFuZCBubyBcInRyaWNreVwiIEhUTUwgdGFncy4gIElmIHdlIGNhbiBvcHRpbWl6ZSB0aGUgZW50aXJlIGNvbnRlbnRcbi8vIGludG8gYSBzdHJpbmcsIHdlIHJldHVybiBPUFRJTUlaQUJMRS5GVUxMLiAgSWYgdGhlIHdlIGFyZSBnaXZlbiBhblxuLy8gdW5vcHRpbWl6YWJsZSBub2RlLCB3ZSByZXR1cm4gT1BUSU1JWkFCTEUuTk9ORS4gIElmIHdlIGFyZSBnaXZlbiBhIHRyZWVcbi8vIHRoYXQgY29udGFpbnMgYW4gdW5vcHRpbWl6YWJsZSBub2RlIHNvbWV3aGVyZSwgd2UgcmV0dXJuIE9QVElNSVpBQkxFLlBBUlRTLlxuLy9cbi8vIEZvciBleGFtcGxlLCB3ZSBhbHdheXMgY3JlYXRlIFNWRyBlbGVtZW50cyBwcm9ncmFtbWF0aWNhbGx5LCBzaW5jZSBTVkdcbi8vIGRvZXNuJ3QgaGF2ZSBpbm5lckhUTUwuICBJZiB3ZSBhcmUgZ2l2ZW4gYW4gU1ZHIGVsZW1lbnQsIHdlIHJldHVybiBOT05FLlxuLy8gSG93ZXZlciwgaWYgd2UgYXJlIGdpdmVuIGEgYmlnIHRyZWUgdGhhdCBjb250YWlucyBTVkcgc29tZXdoZXJlLCB3ZVxuLy8gcmV0dXJuIFBBUlRTIHNvIHRoYXQgdGhlIG9wdGltaXplciBjYW4gZGVzY2VuZCBpbnRvIHRoZSB0cmVlIGFuZCBvcHRpbWl6ZVxuLy8gb3RoZXIgcGFydHMgb2YgaXQuXG52YXIgQ2FuT3B0aW1pemVWaXNpdG9yID0gSFRNTC5WaXNpdG9yLmV4dGVuZCgpO1xuQ2FuT3B0aW1pemVWaXNpdG9yLmRlZih7XG4gIHZpc2l0TnVsbDogY29uc3RhbnQoT1BUSU1JWkFCTEUuRlVMTCksXG4gIHZpc2l0UHJpbWl0aXZlOiBjb25zdGFudChPUFRJTUlaQUJMRS5GVUxMKSxcbiAgdmlzaXRDb21tZW50OiBjb25zdGFudChPUFRJTUlaQUJMRS5GVUxMKSxcbiAgdmlzaXRDaGFyUmVmOiBjb25zdGFudChPUFRJTUlaQUJMRS5GVUxMKSxcbiAgdmlzaXRSYXc6IGNvbnN0YW50KE9QVElNSVpBQkxFLkZVTEwpLFxuICB2aXNpdE9iamVjdDogY29uc3RhbnQoT1BUSU1JWkFCTEUuTk9ORSksXG4gIHZpc2l0RnVuY3Rpb246IGNvbnN0YW50KE9QVElNSVpBQkxFLk5PTkUpLFxuICB2aXNpdEFycmF5OiBmdW5jdGlvbiAoeCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKylcbiAgICAgIGlmICh0aGlzLnZpc2l0KHhbaV0pICE9PSBPUFRJTUlaQUJMRS5GVUxMKVxuICAgICAgICByZXR1cm4gT1BUSU1JWkFCTEUuUEFSVFM7XG4gICAgcmV0dXJuIE9QVElNSVpBQkxFLkZVTEw7XG4gIH0sXG4gIHZpc2l0VGFnOiBmdW5jdGlvbiAodGFnKSB7XG4gICAgdmFyIHRhZ05hbWUgPSB0YWcudGFnTmFtZTtcbiAgICBpZiAodGFnTmFtZSA9PT0gJ3RleHRhcmVhJykge1xuICAgICAgLy8gb3B0aW1pemluZyBpbnRvIGEgVEVYVEFSRUEncyBSQ0RBVEEgd291bGQgcmVxdWlyZSBiZWluZyBhIGxpdHRsZVxuICAgICAgLy8gbW9yZSBjbGV2ZXIuXG4gICAgICByZXR1cm4gT1BUSU1JWkFCTEUuTk9ORTtcbiAgICB9IGVsc2UgaWYgKHRhZ05hbWUgPT09ICdzY3JpcHQnKSB7XG4gICAgICAvLyBzY3JpcHQgdGFncyBkb24ndCB3b3JrIHdoZW4gcmVuZGVyZWQgZnJvbSBzdHJpbmdzXG4gICAgICByZXR1cm4gT1BUSU1JWkFCTEUuTk9ORTtcbiAgICB9IGVsc2UgaWYgKCEgKEhUTUwuaXNLbm93bkVsZW1lbnQodGFnTmFtZSkgJiZcbiAgICAgICAgICAgICAgICAgICEgSFRNTC5pc0tub3duU1ZHRWxlbWVudCh0YWdOYW1lKSkpIHtcbiAgICAgIC8vIGZvcmVpZ24gZWxlbWVudHMgbGlrZSBTVkcgY2FuJ3QgYmUgc3RyaW5naWZpZWQgZm9yIGlubmVySFRNTC5cbiAgICAgIHJldHVybiBPUFRJTUlaQUJMRS5OT05FO1xuICAgIH0gZWxzZSBpZiAodGFnTmFtZSA9PT0gJ3RhYmxlJykge1xuICAgICAgLy8gQXZvaWQgZXZlciBwcm9kdWNpbmcgSFRNTCBjb250YWluaW5nIGA8dGFibGU+PHRyPi4uLmAsIGJlY2F1c2UgdGhlXG4gICAgICAvLyBicm93c2VyIHdpbGwgaW5zZXJ0IGEgVEJPRFkuICBJZiB3ZSBqdXN0IGBjcmVhdGVFbGVtZW50KFwidGFibGVcIilgIGFuZFxuICAgICAgLy8gYGNyZWF0ZUVsZW1lbnQoXCJ0clwiKWAsIG9uIHRoZSBvdGhlciBoYW5kLCBubyBUQk9EWSBpcyBuZWNlc3NhcnlcbiAgICAgIC8vIChhc3N1bWluZyBJRSA4KykuXG4gICAgICByZXR1cm4gT1BUSU1JWkFCTEUuUEFSVFM7XG4gICAgfSBlbHNlIGlmICh0YWdOYW1lID09PSAndHInKXtcbiAgICAgIHJldHVybiBPUFRJTUlaQUJMRS5QQVJUUztcbiAgICB9XG5cbiAgICB2YXIgY2hpbGRyZW4gPSB0YWcuY2hpbGRyZW47XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKylcbiAgICAgIGlmICh0aGlzLnZpc2l0KGNoaWxkcmVuW2ldKSAhPT0gT1BUSU1JWkFCTEUuRlVMTClcbiAgICAgICAgcmV0dXJuIE9QVElNSVpBQkxFLlBBUlRTO1xuXG4gICAgaWYgKHRoaXMudmlzaXRBdHRyaWJ1dGVzKHRhZy5hdHRycykgIT09IE9QVElNSVpBQkxFLkZVTEwpXG4gICAgICByZXR1cm4gT1BUSU1JWkFCTEUuUEFSVFM7XG5cbiAgICByZXR1cm4gT1BUSU1JWkFCTEUuRlVMTDtcbiAgfSxcbiAgdmlzaXRBdHRyaWJ1dGVzOiBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgICBpZiAoYXR0cnMpIHtcbiAgICAgIHZhciBpc0FycmF5ID0gSFRNTC5pc0FycmF5KGF0dHJzKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgKGlzQXJyYXkgPyBhdHRycy5sZW5ndGggOiAxKTsgaSsrKSB7XG4gICAgICAgIHZhciBhID0gKGlzQXJyYXkgPyBhdHRyc1tpXSA6IGF0dHJzKTtcbiAgICAgICAgaWYgKCh0eXBlb2YgYSAhPT0gJ29iamVjdCcpIHx8IChhIGluc3RhbmNlb2YgSFRNTFRvb2xzLlRlbXBsYXRlVGFnKSlcbiAgICAgICAgICByZXR1cm4gT1BUSU1JWkFCTEUuUEFSVFM7XG4gICAgICAgIGZvciAodmFyIGsgaW4gYSlcbiAgICAgICAgICBpZiAodGhpcy52aXNpdChhW2tdKSAhPT0gT1BUSU1JWkFCTEUuRlVMTClcbiAgICAgICAgICAgIHJldHVybiBPUFRJTUlaQUJMRS5QQVJUUztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIE9QVElNSVpBQkxFLkZVTEw7XG4gIH1cbn0pO1xuXG52YXIgZ2V0T3B0aW1pemFiaWxpdHkgPSBmdW5jdGlvbiAoY29udGVudCkge1xuICByZXR1cm4gKG5ldyBDYW5PcHRpbWl6ZVZpc2l0b3IpLnZpc2l0KGNvbnRlbnQpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvUmF3KHgpIHtcbiAgcmV0dXJuIEhUTUwuUmF3KEhUTUwudG9IVE1MKHgpKTtcbn1cblxuZXhwb3J0IGNvbnN0IFRyZWVUcmFuc2Zvcm1lciA9IEhUTUwuVHJhbnNmb3JtaW5nVmlzaXRvci5leHRlbmQoKTtcblRyZWVUcmFuc2Zvcm1lci5kZWYoe1xuICB2aXNpdEF0dHJpYnV0ZXM6IGZ1bmN0aW9uIChhdHRycy8qLCAuLi4qLykge1xuICAgIC8vIHBhc3MgdGVtcGxhdGUgdGFncyB0aHJvdWdoIGJ5IGRlZmF1bHRcbiAgICBpZiAoYXR0cnMgaW5zdGFuY2VvZiBIVE1MVG9vbHMuVGVtcGxhdGVUYWcpXG4gICAgICByZXR1cm4gYXR0cnM7XG5cbiAgICByZXR1cm4gSFRNTC5UcmFuc2Zvcm1pbmdWaXNpdG9yLnByb3RvdHlwZS52aXNpdEF0dHJpYnV0ZXMuYXBwbHkoXG4gICAgICB0aGlzLCBhcmd1bWVudHMpO1xuICB9XG59KTtcblxuLy8gUmVwbGFjZSBwYXJ0cyBvZiB0aGUgSFRNTGpzIHRyZWUgdGhhdCBoYXZlIG5vIHRlbXBsYXRlIHRhZ3MgKG9yXG4vLyB0cmlja3kgSFRNTCB0YWdzKSB3aXRoIEhUTUwuUmF3IG9iamVjdHMgY29udGFpbmluZyByYXcgSFRNTC5cbnZhciBPcHRpbWl6aW5nVmlzaXRvciA9IFRyZWVUcmFuc2Zvcm1lci5leHRlbmQoKTtcbk9wdGltaXppbmdWaXNpdG9yLmRlZih7XG4gIHZpc2l0TnVsbDogdG9SYXcsXG4gIHZpc2l0UHJpbWl0aXZlOiB0b1JhdyxcbiAgdmlzaXRDb21tZW50OiB0b1JhdyxcbiAgdmlzaXRDaGFyUmVmOiB0b1JhdyxcbiAgdmlzaXRBcnJheTogZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgdmFyIG9wdGltaXphYmlsaXR5ID0gZ2V0T3B0aW1pemFiaWxpdHkoYXJyYXkpO1xuICAgIGlmIChvcHRpbWl6YWJpbGl0eSA9PT0gT1BUSU1JWkFCTEUuRlVMTCkge1xuICAgICAgcmV0dXJuIHRvUmF3KGFycmF5KTtcbiAgICB9IGVsc2UgaWYgKG9wdGltaXphYmlsaXR5ID09PSBPUFRJTUlaQUJMRS5QQVJUUykge1xuICAgICAgcmV0dXJuIFRyZWVUcmFuc2Zvcm1lci5wcm90b3R5cGUudmlzaXRBcnJheS5jYWxsKHRoaXMsIGFycmF5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgfSxcbiAgdmlzaXRUYWc6IGZ1bmN0aW9uICh0YWcpIHtcbiAgICB2YXIgb3B0aW1pemFiaWxpdHkgPSBnZXRPcHRpbWl6YWJpbGl0eSh0YWcpO1xuICAgIGlmIChvcHRpbWl6YWJpbGl0eSA9PT0gT1BUSU1JWkFCTEUuRlVMTCkge1xuICAgICAgcmV0dXJuIHRvUmF3KHRhZyk7XG4gICAgfSBlbHNlIGlmIChvcHRpbWl6YWJpbGl0eSA9PT0gT1BUSU1JWkFCTEUuUEFSVFMpIHtcbiAgICAgIHJldHVybiBUcmVlVHJhbnNmb3JtZXIucHJvdG90eXBlLnZpc2l0VGFnLmNhbGwodGhpcywgdGFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRhZztcbiAgICB9XG4gIH0sXG4gIHZpc2l0Q2hpbGRyZW46IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIC8vIGRvbid0IG9wdGltaXplIHRoZSBjaGlsZHJlbiBhcnJheSBpbnRvIGEgUmF3IG9iamVjdCFcbiAgICByZXR1cm4gVHJlZVRyYW5zZm9ybWVyLnByb3RvdHlwZS52aXNpdEFycmF5LmNhbGwodGhpcywgY2hpbGRyZW4pO1xuICB9LFxuICB2aXNpdEF0dHJpYnV0ZXM6IGZ1bmN0aW9uIChhdHRycykge1xuICAgIHJldHVybiBhdHRycztcbiAgfVxufSk7XG5cbi8vIENvbWJpbmUgY29uc2VjdXRpdmUgSFRNTC5SYXdzLiAgUmVtb3ZlIGVtcHR5IG9uZXMuXG52YXIgUmF3Q29tcGFjdGluZ1Zpc2l0b3IgPSBUcmVlVHJhbnNmb3JtZXIuZXh0ZW5kKCk7XG5SYXdDb21wYWN0aW5nVmlzaXRvci5kZWYoe1xuICB2aXNpdEFycmF5OiBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBhcnJheVtpXTtcbiAgICAgIGlmICgoaXRlbSBpbnN0YW5jZW9mIEhUTUwuUmF3KSAmJlxuICAgICAgICAgICgoISBpdGVtLnZhbHVlKSB8fFxuICAgICAgICAgICAocmVzdWx0Lmxlbmd0aCAmJlxuICAgICAgICAgICAgKHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0gaW5zdGFuY2VvZiBIVE1MLlJhdykpKSkge1xuICAgICAgICAvLyB0d28gY2FzZXM6IGl0ZW0gaXMgYW4gZW1wdHkgUmF3LCBvciBwcmV2aW91cyBpdGVtIGlzXG4gICAgICAgIC8vIGEgUmF3IGFzIHdlbGwuICBJbiB0aGUgbGF0dGVyIGNhc2UsIHJlcGxhY2UgdGhlIHByZXZpb3VzXG4gICAgICAgIC8vIFJhdyB3aXRoIGEgbG9uZ2VyIG9uZSB0aGF0IGluY2x1ZGVzIHRoZSBuZXcgUmF3LlxuICAgICAgICBpZiAoaXRlbS52YWx1ZSkge1xuICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0gPSBIVE1MLlJhdyhcbiAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0udmFsdWUgKyBpdGVtLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy52aXNpdChpdGVtKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn0pO1xuXG4vLyBSZXBsYWNlIHBvaW50bGVzcyBSYXdzIGxpa2UgYEhUTWwuUmF3KCdmb28nKWAgdGhhdCBjb250YWluIG5vIHNwZWNpYWxcbi8vIGNoYXJhY3RlcnMgd2l0aCBzaW1wbGUgc3RyaW5ncy5cbnZhciBSYXdSZXBsYWNpbmdWaXNpdG9yID0gVHJlZVRyYW5zZm9ybWVyLmV4dGVuZCgpO1xuUmF3UmVwbGFjaW5nVmlzaXRvci5kZWYoe1xuICB2aXNpdFJhdzogZnVuY3Rpb24gKHJhdykge1xuICAgIHZhciBodG1sID0gcmF3LnZhbHVlO1xuICAgIGlmIChodG1sLmluZGV4T2YoJyYnKSA8IDAgJiYgaHRtbC5pbmRleE9mKCc8JykgPCAwKSB7XG4gICAgICByZXR1cm4gaHRtbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJhdztcbiAgICB9XG4gIH1cbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW1pemUgKHRyZWUpIHtcbiAgdHJlZSA9IChuZXcgT3B0aW1pemluZ1Zpc2l0b3IpLnZpc2l0KHRyZWUpO1xuICB0cmVlID0gKG5ldyBSYXdDb21wYWN0aW5nVmlzaXRvcikudmlzaXQodHJlZSk7XG4gIHRyZWUgPSAobmV3IFJhd1JlcGxhY2luZ1Zpc2l0b3IpLnZpc2l0KHRyZWUpO1xuICByZXR1cm4gdHJlZTtcbn1cbiIsImltcG9ydCB7IEhUTUxUb29scyB9IGZyb20gJ21ldGVvci9odG1sLXRvb2xzJztcbmltcG9ydCB7IEhUTUwgfSBmcm9tICdtZXRlb3IvaHRtbGpzJztcbmltcG9ydCB7IEJsYXplVG9vbHMgfSBmcm9tICdtZXRlb3IvYmxhemUtdG9vbHMnO1xuXG4vLyBBIHZpc2l0b3IgdG8gZW5zdXJlIHRoYXQgUmVhY3QgY29tcG9uZW50cyBpbmNsdWRlZCB2aWEgdGhlIGB7ez5cbi8vIFJlYWN0fX1gIHRlbXBsYXRlIGRlZmluZWQgaW4gdGhlIHJlYWN0LXRlbXBsYXRlLWhlbHBlciBwYWNrYWdlIGFyZVxuLy8gdGhlIG9ubHkgY2hpbGQgaW4gdGhlaXIgcGFyZW50IGNvbXBvbmVudC4gT3RoZXJ3aXNlIGBSZWFjdC5yZW5kZXJgXG4vLyB3b3VsZCBlbGltaW5hdGUgYWxsIG9mIHRoZWlyIHNpYmxpbmcgbm9kZXMuXG4vL1xuLy8gSXQncyBhIGxpdHRsZSBzdHJhbmdlIHRoYXQgdGhpcyBsb2dpYyBpcyBpbiBzcGFjZWJhcnMtY29tcGlsZXIgaWZcbi8vIGl0J3Mgb25seSByZWxldmFudCB0byBhIHNwZWNpZmljIHBhY2thZ2UgYnV0IHRoZXJlJ3Mgbm8gd2F5IHRvIGhhdmVcbi8vIGEgcGFja2FnZSBob29rIGludG8gYSBidWlsZCBwbHVnaW4uXG5leHBvcnQgY29uc3QgUmVhY3RDb21wb25lbnRTaWJsaW5nRm9yYmlkZGVyID0gSFRNTC5WaXNpdG9yLmV4dGVuZCgpO1xuUmVhY3RDb21wb25lbnRTaWJsaW5nRm9yYmlkZGVyLmRlZih7XG4gIHZpc2l0QXJyYXk6IGZ1bmN0aW9uIChhcnJheSwgcGFyZW50VGFnKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy52aXNpdChhcnJheVtpXSwgcGFyZW50VGFnKTtcbiAgICB9XG4gIH0sXG4gIHZpc2l0T2JqZWN0OiBmdW5jdGlvbiAob2JqLCBwYXJlbnRUYWcpIHtcbiAgICBpZiAob2JqLnR5cGUgPT09IFwiSU5DTFVTSU9OXCIgJiYgb2JqLnBhdGgubGVuZ3RoID09PSAxICYmIG9iai5wYXRoWzBdID09PSBcIlJlYWN0XCIpIHtcbiAgICAgIGlmICghcGFyZW50VGFnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcInt7PiBSZWFjdH19IG11c3QgYmUgdXNlZCBpbiBhIGNvbnRhaW5lciBlbGVtZW50XCJcbiAgICAgICAgICAgICsgKHRoaXMuc291cmNlTmFtZSA/IChcIiBpbiBcIiArIHRoaXMuc291cmNlTmFtZSkgOiBcIlwiKVxuICAgICAgICAgICAgICAgKyBcIi4gTGVhcm4gbW9yZSBhdCBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci93aWtpL1JlYWN0LWNvbXBvbmVudHMtbXVzdC1iZS10aGUtb25seS10aGluZy1pbi10aGVpci13cmFwcGVyLWVsZW1lbnRcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciBudW1TaWJsaW5ncyA9IDA7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmVudFRhZy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBwYXJlbnRUYWcuY2hpbGRyZW5baV07XG4gICAgICAgIGlmIChjaGlsZCAhPT0gb2JqICYmICEodHlwZW9mIGNoaWxkID09PSBcInN0cmluZ1wiICYmIGNoaWxkLm1hdGNoKC9eXFxzKiQvKSkpIHtcbiAgICAgICAgICBudW1TaWJsaW5ncysrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChudW1TaWJsaW5ncyA+IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIFwie3s+IFJlYWN0fX0gbXVzdCBiZSB1c2VkIGFzIHRoZSBvbmx5IGNoaWxkIGluIGEgY29udGFpbmVyIGVsZW1lbnRcIlxuICAgICAgICAgICAgKyAodGhpcy5zb3VyY2VOYW1lID8gKFwiIGluIFwiICsgdGhpcy5zb3VyY2VOYW1lKSA6IFwiXCIpXG4gICAgICAgICAgICAgICArIFwiLiBMZWFybiBtb3JlIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3dpa2kvUmVhY3QtY29tcG9uZW50cy1tdXN0LWJlLXRoZS1vbmx5LXRoaW5nLWluLXRoZWlyLXdyYXBwZXItZWxlbWVudFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHZpc2l0VGFnOiBmdW5jdGlvbiAodGFnKSB7XG4gICAgdGhpcy52aXNpdEFycmF5KHRhZy5jaGlsZHJlbiwgdGFnIC8qcGFyZW50VGFnKi8pO1xuICB9XG59KTtcbiIsImltcG9ydCB7IEhUTUxUb29scyB9IGZyb20gJ21ldGVvci9odG1sLXRvb2xzJztcbmltcG9ydCB7IEhUTUwgfSBmcm9tICdtZXRlb3IvaHRtbGpzJztcbmltcG9ydCB7IEJsYXplVG9vbHMgfSBmcm9tICdtZXRlb3IvYmxhemUtdG9vbHMnO1xuXG4vLyBBIFRlbXBsYXRlVGFnIGlzIHRoZSByZXN1bHQgb2YgcGFyc2luZyBhIHNpbmdsZSBge3suLi59fWAgdGFnLlxuLy9cbi8vIFRoZSBgLnR5cGVgIG9mIGEgVGVtcGxhdGVUYWcgaXMgb25lIG9mOlxuLy9cbi8vIC0gYFwiRE9VQkxFXCJgIC0gYHt7Zm9vfX1gXG4vLyAtIGBcIlRSSVBMRVwiYCAtIGB7e3tmb299fX1gXG4vLyAtIGBcIkVYUFJcImAgLSBgKGZvbylgXG4vLyAtIGBcIkNPTU1FTlRcImAgLSBge3shIGZvb319YFxuLy8gLSBgXCJCTE9DS0NPTU1FTlRcIiAtIGB7eyEtLSBmb28tLX19YFxuLy8gLSBgXCJJTkNMVVNJT05cImAgLSBge3s+IGZvb319YFxuLy8gLSBgXCJCTE9DS09QRU5cImAgLSBge3sjZm9vfX1gXG4vLyAtIGBcIkJMT0NLQ0xPU0VcImAgLSBge3svZm9vfX1gXG4vLyAtIGBcIkVMU0VcImAgLSBge3tlbHNlfX1gXG4vLyAtIGBcIkVTQ0FQRVwiYCAtIGB7e3xgLCBge3t7fGAsIGB7e3t7fGAgYW5kIHNvIG9uXG4vL1xuLy8gQmVzaWRlcyBgdHlwZWAsIHRoZSBtYW5kYXRvcnkgcHJvcGVydGllcyBvZiBhIFRlbXBsYXRlVGFnIGFyZTpcbi8vXG4vLyAtIGBwYXRoYCAtIEFuIGFycmF5IG9mIG9uZSBvciBtb3JlIHN0cmluZ3MuICBUaGUgcGF0aCBvZiBge3tmb28uYmFyfX1gXG4vLyAgIGlzIGBbXCJmb29cIiwgXCJiYXJcIl1gLiAgQXBwbGllcyB0byBET1VCTEUsIFRSSVBMRSwgSU5DTFVTSU9OLCBCTE9DS09QRU4sXG4vLyAgIEJMT0NLQ0xPU0UsIGFuZCBFTFNFLlxuLy9cbi8vIC0gYGFyZ3NgIC0gQW4gYXJyYXkgb2YgemVybyBvciBtb3JlIGFyZ3VtZW50IHNwZWNzLiAgQW4gYXJndW1lbnQgc3BlY1xuLy8gICBpcyBhIHR3byBvciB0aHJlZSBlbGVtZW50IGFycmF5LCBjb25zaXN0aW5nIG9mIGEgdHlwZSwgdmFsdWUsIGFuZFxuLy8gICBvcHRpb25hbCBrZXl3b3JkIG5hbWUuICBGb3IgZXhhbXBsZSwgdGhlIGBhcmdzYCBvZiBge3tmb28gXCJiYXJcIiB4PTN9fWBcbi8vICAgYXJlIGBbW1wiU1RSSU5HXCIsIFwiYmFyXCJdLCBbXCJOVU1CRVJcIiwgMywgXCJ4XCJdXWAuICBBcHBsaWVzIHRvIERPVUJMRSxcbi8vICAgVFJJUExFLCBJTkNMVVNJT04sIEJMT0NLT1BFTiwgYW5kIEVMU0UuXG4vL1xuLy8gLSBgdmFsdWVgIC0gQSBzdHJpbmcgb2YgdGhlIGNvbW1lbnQncyB0ZXh0LiBBcHBsaWVzIHRvIENPTU1FTlQgYW5kXG4vLyAgIEJMT0NLQ09NTUVOVC5cbi8vXG4vLyBUaGVzZSBhZGRpdGlvbmFsIGFyZSB0eXBpY2FsbHkgc2V0IGR1cmluZyBwYXJzaW5nOlxuLy9cbi8vIC0gYHBvc2l0aW9uYCAtIFRoZSBIVE1MVG9vbHMuVEVNUExBVEVfVEFHX1BPU0lUSU9OIHNwZWNpZnlpbmcgYXQgd2hhdCBzb3J0XG4vLyAgIG9mIHNpdGUgdGhlIFRlbXBsYXRlVGFnIHdhcyBlbmNvdW50ZXJlZCAoZS5nLiBhdCBlbGVtZW50IGxldmVsIG9yIGFzXG4vLyAgIHBhcnQgb2YgYW4gYXR0cmlidXRlIHZhbHVlKS4gSXRzIGFic2VuY2UgaW1wbGllc1xuLy8gICBURU1QTEFURV9UQUdfUE9TSVRJT04uRUxFTUVOVC5cbi8vXG4vLyAtIGBjb250ZW50YCBhbmQgYGVsc2VDb250ZW50YCAtIFdoZW4gYSBCTE9DS09QRU4gdGFnJ3MgY29udGVudHMgYXJlXG4vLyAgIHBhcnNlZCwgdGhleSBhcmUgcHV0IGhlcmUuICBgZWxzZUNvbnRlbnRgIHdpbGwgb25seSBiZSBwcmVzZW50IGlmXG4vLyAgIGFuIGB7e2Vsc2V9fWAgd2FzIGZvdW5kLlxuXG52YXIgVEVNUExBVEVfVEFHX1BPU0lUSU9OID0gSFRNTFRvb2xzLlRFTVBMQVRFX1RBR19QT1NJVElPTjtcblxuZXhwb3J0IGZ1bmN0aW9uIFRlbXBsYXRlVGFnICgpIHtcbiAgSFRNTFRvb2xzLlRlbXBsYXRlVGFnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cblRlbXBsYXRlVGFnLnByb3RvdHlwZSA9IG5ldyBIVE1MVG9vbHMuVGVtcGxhdGVUYWc7XG5UZW1wbGF0ZVRhZy5wcm90b3R5cGUuY29uc3RydWN0b3JOYW1lID0gJ1NwYWNlYmFyc0NvbXBpbGVyLlRlbXBsYXRlVGFnJztcblxudmFyIG1ha2VTdGFjaGVUYWdTdGFydFJlZ2V4ID0gZnVuY3Rpb24gKHIpIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoci5zb3VyY2UgKyAvKD8hW3s+ISMvXSkvLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgci5pZ25vcmVDYXNlID8gJ2knIDogJycpO1xufTtcblxuLy8gXCJzdGFydHNcIiByZWdleGVzIGFyZSB1c2VkIHRvIHNlZSB3aGF0IHR5cGUgb2YgdGVtcGxhdGVcbi8vIHRhZyB0aGUgcGFyc2VyIGlzIGxvb2tpbmcgYXQuICBUaGV5IG11c3QgbWF0Y2ggYSBub24tZW1wdHlcbi8vIHJlc3VsdCwgYnV0IG5vdCB0aGUgaW50ZXJlc3RpbmcgcGFydCBvZiB0aGUgdGFnLlxudmFyIHN0YXJ0cyA9IHtcbiAgRVNDQVBFOiAvXlxce1xceyg/PVxceypcXHwpLyxcbiAgRUxTRTogbWFrZVN0YWNoZVRhZ1N0YXJ0UmVnZXgoL15cXHtcXHtcXHMqZWxzZShcXHMrKD8hXFxzKXwoPz1bfV0pKS9pKSxcbiAgRE9VQkxFOiBtYWtlU3RhY2hlVGFnU3RhcnRSZWdleCgvXlxce1xce1xccyooPyFcXHMpLyksXG4gIFRSSVBMRTogbWFrZVN0YWNoZVRhZ1N0YXJ0UmVnZXgoL15cXHtcXHtcXHtcXHMqKD8hXFxzKS8pLFxuICBCTE9DS0NPTU1FTlQ6IG1ha2VTdGFjaGVUYWdTdGFydFJlZ2V4KC9eXFx7XFx7XFxzKiEtLS8pLFxuICBDT01NRU5UOiBtYWtlU3RhY2hlVGFnU3RhcnRSZWdleCgvXlxce1xce1xccyohLyksXG4gIElOQ0xVU0lPTjogbWFrZVN0YWNoZVRhZ1N0YXJ0UmVnZXgoL15cXHtcXHtcXHMqPlxccyooPyFcXHMpLyksXG4gIEJMT0NLT1BFTjogbWFrZVN0YWNoZVRhZ1N0YXJ0UmVnZXgoL15cXHtcXHtcXHMqI1xccyooPyFcXHMpLyksXG4gIEJMT0NLQ0xPU0U6IG1ha2VTdGFjaGVUYWdTdGFydFJlZ2V4KC9eXFx7XFx7XFxzKlxcL1xccyooPyFcXHMpLylcbn07XG5cbnZhciBlbmRzID0ge1xuICBET1VCTEU6IC9eXFxzKlxcfVxcfS8sXG4gIFRSSVBMRTogL15cXHMqXFx9XFx9XFx9LyxcbiAgRVhQUjogL15cXHMqXFwpL1xufTtcblxudmFyIGVuZHNTdHJpbmcgPSB7XG4gIERPVUJMRTogJ319JyxcbiAgVFJJUExFOiAnfX19JyxcbiAgRVhQUjogJyknXG59O1xuXG4vLyBQYXJzZSBhIHRhZyBmcm9tIHRoZSBwcm92aWRlZCBzY2FubmVyIG9yIHN0cmluZy4gIElmIHRoZSBpbnB1dFxuLy8gZG9lc24ndCBzdGFydCB3aXRoIGB7e2AsIHJldHVybnMgbnVsbC4gIE90aGVyd2lzZSwgZWl0aGVyIHN1Y2NlZWRzXG4vLyBhbmQgcmV0dXJucyBhIFNwYWNlYmFyc0NvbXBpbGVyLlRlbXBsYXRlVGFnLCBvciB0aHJvd3MgYW4gZXJyb3IgKHVzaW5nXG4vLyBgc2Nhbm5lci5mYXRhbGAgaWYgYSBzY2FubmVyIGlzIHByb3ZpZGVkKS5cblRlbXBsYXRlVGFnLnBhcnNlID0gZnVuY3Rpb24gKHNjYW5uZXJPclN0cmluZykge1xuICB2YXIgc2Nhbm5lciA9IHNjYW5uZXJPclN0cmluZztcbiAgaWYgKHR5cGVvZiBzY2FubmVyID09PSAnc3RyaW5nJylcbiAgICBzY2FubmVyID0gbmV3IEhUTUxUb29scy5TY2FubmVyKHNjYW5uZXJPclN0cmluZyk7XG5cbiAgaWYgKCEgKHNjYW5uZXIucGVlaygpID09PSAneycgJiZcbiAgICAgICAgIChzY2FubmVyLnJlc3QoKSkuc2xpY2UoMCwgMikgPT09ICd7eycpKVxuICAgIHJldHVybiBudWxsO1xuXG4gIHZhciBydW4gPSBmdW5jdGlvbiAocmVnZXgpIHtcbiAgICAvLyByZWdleCBpcyBhc3N1bWVkIHRvIHN0YXJ0IHdpdGggYF5gXG4gICAgdmFyIHJlc3VsdCA9IHJlZ2V4LmV4ZWMoc2Nhbm5lci5yZXN0KCkpO1xuICAgIGlmICghIHJlc3VsdClcbiAgICAgIHJldHVybiBudWxsO1xuICAgIHZhciByZXQgPSByZXN1bHRbMF07XG4gICAgc2Nhbm5lci5wb3MgKz0gcmV0Lmxlbmd0aDtcbiAgICByZXR1cm4gcmV0O1xuICB9O1xuXG4gIHZhciBhZHZhbmNlID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgIHNjYW5uZXIucG9zICs9IGFtb3VudDtcbiAgfTtcblxuICB2YXIgc2NhbklkZW50aWZpZXIgPSBmdW5jdGlvbiAoaXNGaXJzdEluUGF0aCkge1xuICAgIHZhciBpZCA9IEJsYXplVG9vbHMucGFyc2VFeHRlbmRlZElkZW50aWZpZXJOYW1lKHNjYW5uZXIpO1xuICAgIGlmICghIGlkKSB7XG4gICAgICBleHBlY3RlZCgnSURFTlRJRklFUicpO1xuICAgIH1cbiAgICBpZiAoaXNGaXJzdEluUGF0aCAmJlxuICAgICAgICAoaWQgPT09ICdudWxsJyB8fCBpZCA9PT0gJ3RydWUnIHx8IGlkID09PSAnZmFsc2UnKSlcbiAgICAgIHNjYW5uZXIuZmF0YWwoXCJDYW4ndCB1c2UgbnVsbCwgdHJ1ZSwgb3IgZmFsc2UsIGFzIGFuIGlkZW50aWZpZXIgYXQgc3RhcnQgb2YgcGF0aFwiKTtcblxuICAgIHJldHVybiBpZDtcbiAgfTtcblxuICB2YXIgc2NhblBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlZ21lbnRzID0gW107XG5cbiAgICAvLyBoYW5kbGUgaW5pdGlhbCBgLmAsIGAuLmAsIGAuL2AsIGAuLi9gLCBgLi4vLi5gLCBgLi4vLi4vYCwgZXRjXG4gICAgdmFyIGRvdHM7XG4gICAgaWYgKChkb3RzID0gcnVuKC9eW1xcLlxcL10rLykpKSB7XG4gICAgICB2YXIgYW5jZXN0b3JTdHIgPSAnLic7IC8vIGVnIGAuLi8uLi8uLmAgbWFwcyB0byBgLi4uLmBcbiAgICAgIHZhciBlbmRzV2l0aFNsYXNoID0gL1xcLyQvLnRlc3QoZG90cyk7XG5cbiAgICAgIGlmIChlbmRzV2l0aFNsYXNoKVxuICAgICAgICBkb3RzID0gZG90cy5zbGljZSgwLCAtMSk7XG5cbiAgICAgIGRvdHMuc3BsaXQoJy8nKS5mb3JFYWNoKGZ1bmN0aW9uKGRvdENsYXVzZSwgaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgaWYgKGRvdENsYXVzZSAhPT0gJy4nICYmIGRvdENsYXVzZSAhPT0gJy4uJylcbiAgICAgICAgICAgIGV4cGVjdGVkKFwiYC5gLCBgLi5gLCBgLi9gIG9yIGAuLi9gXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChkb3RDbGF1c2UgIT09ICcuLicpXG4gICAgICAgICAgICBleHBlY3RlZChcImAuLmAgb3IgYC4uL2BcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG90Q2xhdXNlID09PSAnLi4nKVxuICAgICAgICAgIGFuY2VzdG9yU3RyICs9ICcuJztcbiAgICAgIH0pO1xuXG4gICAgICBzZWdtZW50cy5wdXNoKGFuY2VzdG9yU3RyKTtcblxuICAgICAgaWYgKCFlbmRzV2l0aFNsYXNoKVxuICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgfVxuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIC8vIHNjYW4gYSBwYXRoIHNlZ21lbnRcblxuICAgICAgaWYgKHJ1bigvXlxcWy8pKSB7XG4gICAgICAgIHZhciBzZWcgPSBydW4oL15bXFxzXFxTXSo/XFxdLyk7XG4gICAgICAgIGlmICghIHNlZylcbiAgICAgICAgICBlcnJvcihcIlVudGVybWluYXRlZCBwYXRoIHNlZ21lbnRcIik7XG4gICAgICAgIHNlZyA9IHNlZy5zbGljZSgwLCAtMSk7XG4gICAgICAgIGlmICghIHNlZyAmJiAhIHNlZ21lbnRzLmxlbmd0aClcbiAgICAgICAgICBlcnJvcihcIlBhdGggY2FuJ3Qgc3RhcnQgd2l0aCBlbXB0eSBzdHJpbmdcIik7XG4gICAgICAgIHNlZ21lbnRzLnB1c2goc2VnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpZCA9IHNjYW5JZGVudGlmaWVyKCEgc2VnbWVudHMubGVuZ3RoKTtcbiAgICAgICAgaWYgKGlkID09PSAndGhpcycpIHtcbiAgICAgICAgICBpZiAoISBzZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIGluaXRpYWwgYHRoaXNgXG4gICAgICAgICAgICBzZWdtZW50cy5wdXNoKCcuJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9yKFwiQ2FuIG9ubHkgdXNlIGB0aGlzYCBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgcGF0aC5cXG5JbnN0ZWFkIG9mIGBmb28udGhpc2Agb3IgYC4uL3RoaXNgLCBqdXN0IHdyaXRlIGBmb29gIG9yIGAuLmAuXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgc2VwID0gcnVuKC9eW1xcLlxcL10vKTtcbiAgICAgIGlmICghIHNlcClcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlZ21lbnRzO1xuICB9O1xuXG4gIC8vIHNjYW4gdGhlIGtleXdvcmQgcG9ydGlvbiBvZiBhIGtleXdvcmQgYXJndW1lbnRcbiAgLy8gKHRoZSBcImZvb1wiIHBvcnRpb24gaW4gXCJmb289YmFyXCIpLlxuICAvLyBSZXN1bHQgaXMgZWl0aGVyIHRoZSBrZXl3b3JkIG1hdGNoZWQsIG9yIG51bGxcbiAgLy8gaWYgd2UncmUgbm90IGF0IGEga2V5d29yZCBhcmd1bWVudCBwb3NpdGlvbi5cbiAgdmFyIHNjYW5BcmdLZXl3b3JkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtYXRjaCA9IC9eKFteXFx7XFx9XFwoXFwpXFw+Iz1cXHNcIidcXFtcXF1dKylcXHMqPVxccyovLmV4ZWMoc2Nhbm5lci5yZXN0KCkpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgc2Nhbm5lci5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgLy8gc2NhbiBhbiBhcmd1bWVudDsgc3VjY2VlZHMgb3IgZXJyb3JzLlxuICAvLyBSZXN1bHQgaXMgYW4gYXJyYXkgb2YgdHdvIG9yIHRocmVlIGl0ZW1zOlxuICAvLyB0eXBlICwgdmFsdWUsIGFuZCAoaW5kaWNhdGluZyBhIGtleXdvcmQgYXJndW1lbnQpXG4gIC8vIGtleXdvcmQgbmFtZS5cbiAgdmFyIHNjYW5BcmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGtleXdvcmQgPSBzY2FuQXJnS2V5d29yZCgpOyAvLyBudWxsIGlmIG5vdCBwYXJzaW5nIGEga3dhcmdcbiAgICB2YXIgdmFsdWUgPSBzY2FuQXJnVmFsdWUoKTtcbiAgICByZXR1cm4ga2V5d29yZCA/IHZhbHVlLmNvbmNhdChrZXl3b3JkKSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIHNjYW4gYW4gYXJndW1lbnQgdmFsdWUgKGZvciBrZXl3b3JkIG9yIHBvc2l0aW9uYWwgYXJndW1lbnRzKTtcbiAgLy8gc3VjY2VlZHMgb3IgZXJyb3JzLiAgUmVzdWx0IGlzIGFuIGFycmF5IG9mIHR5cGUsIHZhbHVlLlxuICB2YXIgc2NhbkFyZ1ZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzdGFydFBvcyA9IHNjYW5uZXIucG9zO1xuICAgIHZhciByZXN1bHQ7XG4gICAgaWYgKChyZXN1bHQgPSBCbGF6ZVRvb2xzLnBhcnNlTnVtYmVyKHNjYW5uZXIpKSkge1xuICAgICAgcmV0dXJuIFsnTlVNQkVSJywgcmVzdWx0LnZhbHVlXTtcbiAgICB9IGVsc2UgaWYgKChyZXN1bHQgPSBCbGF6ZVRvb2xzLnBhcnNlU3RyaW5nTGl0ZXJhbChzY2FubmVyKSkpIHtcbiAgICAgIHJldHVybiBbJ1NUUklORycsIHJlc3VsdC52YWx1ZV07XG4gICAgfSBlbHNlIGlmICgvXltcXC5cXFtdLy50ZXN0KHNjYW5uZXIucGVlaygpKSkge1xuICAgICAgcmV0dXJuIFsnUEFUSCcsIHNjYW5QYXRoKCldO1xuICAgIH0gZWxzZSBpZiAocnVuKC9eXFwoLykpIHtcbiAgICAgIHJldHVybiBbJ0VYUFInLCBzY2FuRXhwcignRVhQUicpXTtcbiAgICB9IGVsc2UgaWYgKChyZXN1bHQgPSBCbGF6ZVRvb2xzLnBhcnNlRXh0ZW5kZWRJZGVudGlmaWVyTmFtZShzY2FubmVyKSkpIHtcbiAgICAgIHZhciBpZCA9IHJlc3VsdDtcbiAgICAgIGlmIChpZCA9PT0gJ251bGwnKSB7XG4gICAgICAgIHJldHVybiBbJ05VTEwnLCBudWxsXTtcbiAgICAgIH0gZWxzZSBpZiAoaWQgPT09ICd0cnVlJyB8fCBpZCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICByZXR1cm4gWydCT09MRUFOJywgaWQgPT09ICd0cnVlJ107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2FubmVyLnBvcyA9IHN0YXJ0UG9zOyAvLyB1bmNvbnN1bWUgYGlkYFxuICAgICAgICByZXR1cm4gWydQQVRIJywgc2NhblBhdGgoKV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cGVjdGVkKCdpZGVudGlmaWVyLCBudW1iZXIsIHN0cmluZywgYm9vbGVhbiwgbnVsbCwgb3IgYSBzdWIgZXhwcmVzc2lvbiBlbmNsb3NlZCBpbiBcIihcIiwgXCIpXCInKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIHNjYW5FeHByID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB2YXIgZW5kVHlwZSA9IHR5cGU7XG4gICAgaWYgKHR5cGUgPT09ICdJTkNMVVNJT04nIHx8IHR5cGUgPT09ICdCTE9DS09QRU4nIHx8IHR5cGUgPT09ICdFTFNFJylcbiAgICAgIGVuZFR5cGUgPSAnRE9VQkxFJztcblxuICAgIHZhciB0YWcgPSBuZXcgVGVtcGxhdGVUYWc7XG4gICAgdGFnLnR5cGUgPSB0eXBlO1xuICAgIHRhZy5wYXRoID0gc2NhblBhdGgoKTtcbiAgICB0YWcuYXJncyA9IFtdO1xuICAgIHZhciBmb3VuZEt3QXJnID0gZmFsc2U7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHJ1bigvXlxccyovKTtcbiAgICAgIGlmIChydW4oZW5kc1tlbmRUeXBlXSkpXG4gICAgICAgIGJyZWFrO1xuICAgICAgZWxzZSBpZiAoL15bfSldLy50ZXN0KHNjYW5uZXIucGVlaygpKSkge1xuICAgICAgICBleHBlY3RlZCgnYCcgKyBlbmRzU3RyaW5nW2VuZFR5cGVdICsgJ2AnKTtcbiAgICAgIH1cbiAgICAgIHZhciBuZXdBcmcgPSBzY2FuQXJnKCk7XG4gICAgICBpZiAobmV3QXJnLmxlbmd0aCA9PT0gMykge1xuICAgICAgICBmb3VuZEt3QXJnID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEt3QXJnKVxuICAgICAgICAgIGVycm9yKFwiQ2FuJ3QgaGF2ZSBhIG5vbi1rZXl3b3JkIGFyZ3VtZW50IGFmdGVyIGEga2V5d29yZCBhcmd1bWVudFwiKTtcbiAgICAgIH1cbiAgICAgIHRhZy5hcmdzLnB1c2gobmV3QXJnKTtcblxuICAgICAgLy8gZXhwZWN0IGEgd2hpdGVzcGFjZSBvciBhIGNsb3NpbmcgJyknIG9yICd9J1xuICAgICAgaWYgKHJ1bigvXig/PVtcXHN9KV0pLykgIT09ICcnKVxuICAgICAgICBleHBlY3RlZCgnc3BhY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFnO1xuICB9O1xuXG4gIHZhciB0eXBlO1xuXG4gIHZhciBlcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICBzY2FubmVyLmZhdGFsKG1zZyk7XG4gIH07XG5cbiAgdmFyIGV4cGVjdGVkID0gZnVuY3Rpb24gKHdoYXQpIHtcbiAgICBlcnJvcignRXhwZWN0ZWQgJyArIHdoYXQpO1xuICB9O1xuXG4gIC8vIG11c3QgZG8gRVNDQVBFIGZpcnN0LCBpbW1lZGlhdGVseSBmb2xsb3dlZCBieSBFTFNFXG4gIC8vIG9yZGVyIG9mIG90aGVycyBkb2Vzbid0IG1hdHRlclxuICBpZiAocnVuKHN0YXJ0cy5FU0NBUEUpKSB0eXBlID0gJ0VTQ0FQRSc7XG4gIGVsc2UgaWYgKHJ1bihzdGFydHMuRUxTRSkpIHR5cGUgPSAnRUxTRSc7XG4gIGVsc2UgaWYgKHJ1bihzdGFydHMuRE9VQkxFKSkgdHlwZSA9ICdET1VCTEUnO1xuICBlbHNlIGlmIChydW4oc3RhcnRzLlRSSVBMRSkpIHR5cGUgPSAnVFJJUExFJztcbiAgZWxzZSBpZiAocnVuKHN0YXJ0cy5CTE9DS0NPTU1FTlQpKSB0eXBlID0gJ0JMT0NLQ09NTUVOVCc7XG4gIGVsc2UgaWYgKHJ1bihzdGFydHMuQ09NTUVOVCkpIHR5cGUgPSAnQ09NTUVOVCc7XG4gIGVsc2UgaWYgKHJ1bihzdGFydHMuSU5DTFVTSU9OKSkgdHlwZSA9ICdJTkNMVVNJT04nO1xuICBlbHNlIGlmIChydW4oc3RhcnRzLkJMT0NLT1BFTikpIHR5cGUgPSAnQkxPQ0tPUEVOJztcbiAgZWxzZSBpZiAocnVuKHN0YXJ0cy5CTE9DS0NMT1NFKSkgdHlwZSA9ICdCTE9DS0NMT1NFJztcbiAgZWxzZVxuICAgIGVycm9yKCdVbmtub3duIHN0YWNoZSB0YWcnKTtcblxuICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlVGFnO1xuICB0YWcudHlwZSA9IHR5cGU7XG5cbiAgaWYgKHR5cGUgPT09ICdCTE9DS0NPTU1FTlQnKSB7XG4gICAgdmFyIHJlc3VsdCA9IHJ1bigvXltcXHNcXFNdKj8tLVxccyo/XFx9XFx9Lyk7XG4gICAgaWYgKCEgcmVzdWx0KVxuICAgICAgZXJyb3IoXCJVbmNsb3NlZCBibG9jayBjb21tZW50XCIpO1xuICAgIHRhZy52YWx1ZSA9IHJlc3VsdC5zbGljZSgwLCByZXN1bHQubGFzdEluZGV4T2YoJy0tJykpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdDT01NRU5UJykge1xuICAgIHZhciByZXN1bHQgPSBydW4oL15bXFxzXFxTXSo/XFx9XFx9Lyk7XG4gICAgaWYgKCEgcmVzdWx0KVxuICAgICAgZXJyb3IoXCJVbmNsb3NlZCBjb21tZW50XCIpO1xuICAgIHRhZy52YWx1ZSA9IHJlc3VsdC5zbGljZSgwLCAtMik7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ0JMT0NLQ0xPU0UnKSB7XG4gICAgdGFnLnBhdGggPSBzY2FuUGF0aCgpO1xuICAgIGlmICghIHJ1bihlbmRzLkRPVUJMRSkpXG4gICAgICBleHBlY3RlZCgnYH19YCcpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdFTFNFJykge1xuICAgIGlmICghIHJ1bihlbmRzLkRPVUJMRSkpIHtcbiAgICAgIHRhZyA9IHNjYW5FeHByKHR5cGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnRVNDQVBFJykge1xuICAgIHZhciByZXN1bHQgPSBydW4oL15cXHsqXFx8Lyk7XG4gICAgdGFnLnZhbHVlID0gJ3t7JyArIHJlc3VsdC5zbGljZSgwLCAtMSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gRE9VQkxFLCBUUklQTEUsIEJMT0NLT1BFTiwgSU5DTFVTSU9OXG4gICAgdGFnID0gc2NhbkV4cHIodHlwZSk7XG4gIH1cblxuICByZXR1cm4gdGFnO1xufTtcblxuLy8gUmV0dXJucyBhIFNwYWNlYmFyc0NvbXBpbGVyLlRlbXBsYXRlVGFnIHBhcnNlZCBmcm9tIGBzY2FubmVyYCwgbGVhdmluZyBzY2FubmVyXG4vLyBhdCBpdHMgb3JpZ2luYWwgcG9zaXRpb24uXG4vL1xuLy8gQW4gZXJyb3Igd2lsbCBzdGlsbCBiZSB0aHJvd24gaWYgdGhlcmUgaXMgbm90IGEgdmFsaWQgdGVtcGxhdGUgdGFnIGF0XG4vLyB0aGUgY3VycmVudCBwb3NpdGlvbi5cblRlbXBsYXRlVGFnLnBlZWsgPSBmdW5jdGlvbiAoc2Nhbm5lcikge1xuICB2YXIgc3RhcnRQb3MgPSBzY2FubmVyLnBvcztcbiAgdmFyIHJlc3VsdCA9IFRlbXBsYXRlVGFnLnBhcnNlKHNjYW5uZXIpO1xuICBzY2FubmVyLnBvcyA9IHN0YXJ0UG9zO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLy8gTGlrZSBgVGVtcGxhdGVUYWcucGFyc2VgLCBidXQgaW4gdGhlIGNhc2Ugb2YgYmxvY2tzLCBwYXJzZSB0aGUgY29tcGxldGVcbi8vIGB7eyNmb299fS4uLnt7L2Zvb319YCB3aXRoIGBjb250ZW50YCBhbmQgcG9zc2libGUgYGVsc2VDb250ZW50YCwgcmF0aGVyXG4vLyB0aGFuIGp1c3QgdGhlIEJMT0NLT1BFTiB0YWcuXG4vL1xuLy8gSW4gYWRkaXRpb246XG4vL1xuLy8gLSBUaHJvd3MgYW4gZXJyb3IgaWYgYHt7ZWxzZX19YCBvciBge3svZm9vfX1gIHRhZyBpcyBlbmNvdW50ZXJlZC5cbi8vXG4vLyAtIFJldHVybnMgYG51bGxgIGZvciBhIENPTU1FTlQuICAoVGhpcyBjYXNlIGlzIGRpc3Rpbmd1aXNoYWJsZSBmcm9tXG4vLyAgIHBhcnNpbmcgbm8gdGFnIGJ5IHRoZSBmYWN0IHRoYXQgdGhlIHNjYW5uZXIgaXMgYWR2YW5jZWQuKVxuLy9cbi8vIC0gVGFrZXMgYW4gSFRNTFRvb2xzLlRFTVBMQVRFX1RBR19QT1NJVElPTiBgcG9zaXRpb25gIGFuZCBzZXRzIGl0IGFzIHRoZVxuLy8gICBUZW1wbGF0ZVRhZydzIGAucG9zaXRpb25gIHByb3BlcnR5LlxuLy9cbi8vIC0gVmFsaWRhdGVzIHRoZSB0YWcncyB3ZWxsLWZvcm1lZG5lc3MgYW5kIGxlZ2FsaXR5IGF0IGluIGl0cyBwb3NpdGlvbi5cblRlbXBsYXRlVGFnLnBhcnNlQ29tcGxldGVUYWcgPSBmdW5jdGlvbiAoc2Nhbm5lck9yU3RyaW5nLCBwb3NpdGlvbikge1xuICB2YXIgc2Nhbm5lciA9IHNjYW5uZXJPclN0cmluZztcbiAgaWYgKHR5cGVvZiBzY2FubmVyID09PSAnc3RyaW5nJylcbiAgICBzY2FubmVyID0gbmV3IEhUTUxUb29scy5TY2FubmVyKHNjYW5uZXJPclN0cmluZyk7XG5cbiAgdmFyIHN0YXJ0UG9zID0gc2Nhbm5lci5wb3M7IC8vIGZvciBlcnJvciBtZXNzYWdlc1xuICB2YXIgcmVzdWx0ID0gVGVtcGxhdGVUYWcucGFyc2Uoc2Nhbm5lck9yU3RyaW5nKTtcbiAgaWYgKCEgcmVzdWx0KVxuICAgIHJldHVybiByZXN1bHQ7XG5cbiAgaWYgKHJlc3VsdC50eXBlID09PSAnQkxPQ0tDT01NRU5UJylcbiAgICByZXR1cm4gbnVsbDtcblxuICBpZiAocmVzdWx0LnR5cGUgPT09ICdDT01NRU5UJylcbiAgICByZXR1cm4gbnVsbDtcblxuICBpZiAocmVzdWx0LnR5cGUgPT09ICdFTFNFJylcbiAgICBzY2FubmVyLmZhdGFsKFwiVW5leHBlY3RlZCB7e2Vsc2V9fVwiKTtcblxuICBpZiAocmVzdWx0LnR5cGUgPT09ICdCTE9DS0NMT1NFJylcbiAgICBzY2FubmVyLmZhdGFsKFwiVW5leHBlY3RlZCBjbG9zaW5nIHRlbXBsYXRlIHRhZ1wiKTtcblxuICBwb3NpdGlvbiA9IChwb3NpdGlvbiB8fCBURU1QTEFURV9UQUdfUE9TSVRJT04uRUxFTUVOVCk7XG4gIGlmIChwb3NpdGlvbiAhPT0gVEVNUExBVEVfVEFHX1BPU0lUSU9OLkVMRU1FTlQpXG4gICAgcmVzdWx0LnBvc2l0aW9uID0gcG9zaXRpb247XG5cbiAgaWYgKHJlc3VsdC50eXBlID09PSAnQkxPQ0tPUEVOJykge1xuICAgIC8vIHBhcnNlIGJsb2NrIGNvbnRlbnRzXG5cbiAgICAvLyBDb25zdHJ1Y3QgYSBzdHJpbmcgdmVyc2lvbiBvZiBgLnBhdGhgIGZvciBjb21wYXJpbmcgc3RhcnQgYW5kXG4gICAgLy8gZW5kIHRhZ3MuICBGb3IgZXhhbXBsZSwgYGZvby9bMF1gIHdhcyBwYXJzZWQgaW50byBgW1wiZm9vXCIsIFwiMFwiXWBcbiAgICAvLyBhbmQgbm93IGJlY29tZXMgYGZvbywwYC4gIFRoaXMgZm9ybSBtYXkgYWxzbyBzaG93IHVwIGluIGVycm9yXG4gICAgLy8gbWVzc2FnZXMuXG4gICAgdmFyIGJsb2NrTmFtZSA9IHJlc3VsdC5wYXRoLmpvaW4oJywnKTtcblxuICAgIHZhciB0ZXh0TW9kZSA9IG51bGw7XG4gICAgICBpZiAoYmxvY2tOYW1lID09PSAnbWFya2Rvd24nIHx8XG4gICAgICAgICAgcG9zaXRpb24gPT09IFRFTVBMQVRFX1RBR19QT1NJVElPTi5JTl9SQVdURVhUKSB7XG4gICAgICAgIHRleHRNb2RlID0gSFRNTC5URVhUTU9ERS5TVFJJTkc7XG4gICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSBURU1QTEFURV9UQUdfUE9TSVRJT04uSU5fUkNEQVRBIHx8XG4gICAgICAgICAgICAgICAgIHBvc2l0aW9uID09PSBURU1QTEFURV9UQUdfUE9TSVRJT04uSU5fQVRUUklCVVRFKSB7XG4gICAgICAgIHRleHRNb2RlID0gSFRNTC5URVhUTU9ERS5SQ0RBVEE7XG4gICAgICB9XG4gICAgICB2YXIgcGFyc2VyT3B0aW9ucyA9IHtcbiAgICAgICAgZ2V0VGVtcGxhdGVUYWc6IFRlbXBsYXRlVGFnLnBhcnNlQ29tcGxldGVUYWcsXG4gICAgICAgIHNob3VsZFN0b3A6IGlzQXRCbG9ja0Nsb3NlT3JFbHNlLFxuICAgICAgICB0ZXh0TW9kZTogdGV4dE1vZGVcbiAgICAgIH07XG4gICAgcmVzdWx0LnRleHRNb2RlID0gdGV4dE1vZGU7XG4gICAgcmVzdWx0LmNvbnRlbnQgPSBIVE1MVG9vbHMucGFyc2VGcmFnbWVudChzY2FubmVyLCBwYXJzZXJPcHRpb25zKTtcblxuICAgIGlmIChzY2FubmVyLnJlc3QoKS5zbGljZSgwLCAyKSAhPT0gJ3t7JylcbiAgICAgIHNjYW5uZXIuZmF0YWwoXCJFeHBlY3RlZCB7e2Vsc2V9fSBvciBibG9jayBjbG9zZSBmb3IgXCIgKyBibG9ja05hbWUpO1xuXG4gICAgdmFyIGxhc3RQb3MgPSBzY2FubmVyLnBvczsgLy8gc2F2ZSBmb3IgZXJyb3IgbWVzc2FnZXNcbiAgICB2YXIgdG1wbFRhZyA9IFRlbXBsYXRlVGFnLnBhcnNlKHNjYW5uZXIpOyAvLyB7e2Vsc2V9fSBvciB7ey9mb299fVxuXG4gICAgdmFyIGxhc3RFbHNlQ29udGVudFRhZyA9IHJlc3VsdDtcbiAgICB3aGlsZSAodG1wbFRhZy50eXBlID09PSAnRUxTRScpIHtcbiAgICAgIGlmIChsYXN0RWxzZUNvbnRlbnRUYWcgPT09IG51bGwpIHtcbiAgICAgICAgc2Nhbm5lci5mYXRhbChcIlVuZXhwZWN0ZWQgZWxzZSBhZnRlciB7e2Vsc2V9fVwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRtcGxUYWcucGF0aCkge1xuICAgICAgICBsYXN0RWxzZUNvbnRlbnRUYWcuZWxzZUNvbnRlbnQgPSBuZXcgVGVtcGxhdGVUYWc7XG4gICAgICAgIGxhc3RFbHNlQ29udGVudFRhZy5lbHNlQ29udGVudC50eXBlID0gJ0JMT0NLT1BFTic7XG4gICAgICAgIGxhc3RFbHNlQ29udGVudFRhZy5lbHNlQ29udGVudC5wYXRoID0gdG1wbFRhZy5wYXRoO1xuICAgICAgICBsYXN0RWxzZUNvbnRlbnRUYWcuZWxzZUNvbnRlbnQuYXJncyA9IHRtcGxUYWcuYXJncztcbiAgICAgICAgbGFzdEVsc2VDb250ZW50VGFnLmVsc2VDb250ZW50LnRleHRNb2RlID0gdGV4dE1vZGU7XG4gICAgICAgIGxhc3RFbHNlQ29udGVudFRhZy5lbHNlQ29udGVudC5jb250ZW50ID0gSFRNTFRvb2xzLnBhcnNlRnJhZ21lbnQoc2Nhbm5lciwgcGFyc2VyT3B0aW9ucyk7XG5cbiAgICAgICAgbGFzdEVsc2VDb250ZW50VGFnID0gbGFzdEVsc2VDb250ZW50VGFnLmVsc2VDb250ZW50O1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIHBhcnNlIHt7ZWxzZX19IGFuZCBjb250ZW50IHVwIHRvIGNsb3NlIHRhZ1xuICAgICAgICBsYXN0RWxzZUNvbnRlbnRUYWcuZWxzZUNvbnRlbnQgPSBIVE1MVG9vbHMucGFyc2VGcmFnbWVudChzY2FubmVyLCBwYXJzZXJPcHRpb25zKTtcblxuICAgICAgICBsYXN0RWxzZUNvbnRlbnRUYWcgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2Nhbm5lci5yZXN0KCkuc2xpY2UoMCwgMikgIT09ICd7eycpXG4gICAgICAgIHNjYW5uZXIuZmF0YWwoXCJFeHBlY3RlZCBibG9jayBjbG9zZSBmb3IgXCIgKyBibG9ja05hbWUpO1xuXG4gICAgICBsYXN0UG9zID0gc2Nhbm5lci5wb3M7XG4gICAgICB0bXBsVGFnID0gVGVtcGxhdGVUYWcucGFyc2Uoc2Nhbm5lcik7XG4gICAgfVxuXG4gICAgaWYgKHRtcGxUYWcudHlwZSA9PT0gJ0JMT0NLQ0xPU0UnKSB7XG4gICAgICB2YXIgYmxvY2tOYW1lMiA9IHRtcGxUYWcucGF0aC5qb2luKCcsJyk7XG4gICAgICBpZiAoYmxvY2tOYW1lICE9PSBibG9ja05hbWUyKSB7XG4gICAgICAgIHNjYW5uZXIucG9zID0gbGFzdFBvcztcbiAgICAgICAgc2Nhbm5lci5mYXRhbCgnRXhwZWN0ZWQgdGFnIHRvIGNsb3NlICcgKyBibG9ja05hbWUgKyAnLCBmb3VuZCAnICtcbiAgICAgICAgICAgICAgICAgICAgICBibG9ja05hbWUyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2Nhbm5lci5wb3MgPSBsYXN0UG9zO1xuICAgICAgc2Nhbm5lci5mYXRhbCgnRXhwZWN0ZWQgdGFnIHRvIGNsb3NlICcgKyBibG9ja05hbWUgKyAnLCBmb3VuZCAnICtcbiAgICAgICAgICAgICAgICAgICAgdG1wbFRhZy50eXBlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgZmluYWxQb3MgPSBzY2FubmVyLnBvcztcbiAgc2Nhbm5lci5wb3MgPSBzdGFydFBvcztcbiAgdmFsaWRhdGVUYWcocmVzdWx0LCBzY2FubmVyKTtcbiAgc2Nhbm5lci5wb3MgPSBmaW5hbFBvcztcblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxudmFyIGlzQXRCbG9ja0Nsb3NlT3JFbHNlID0gZnVuY3Rpb24gKHNjYW5uZXIpIHtcbiAgLy8gRGV0ZWN0IGB7e2Vsc2V9fWAgb3IgYHt7L2Zvb319YC5cbiAgLy9cbiAgLy8gV2UgZG8gYXMgbXVjaCB3b3JrIG91cnNlbHZlcyBiZWZvcmUgZGVmZXJyaW5nIHRvIGBUZW1wbGF0ZVRhZy5wZWVrYCxcbiAgLy8gZm9yIGVmZmljaWVuY3kgKHdlJ3JlIGNhbGxlZCBmb3IgZXZlcnkgaW5wdXQgdG9rZW4pIGFuZCB0byBiZVxuICAvLyBsZXNzIG9idHJ1c2l2ZSwgYmVjYXVzZSBgVGVtcGxhdGVUYWcucGVla2Agd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBpdFxuICAvLyBzZWVzIGB7e2AgZm9sbG93ZWQgYnkgYSBtYWxmb3JtZWQgdGFnLlxuICB2YXIgcmVzdCwgdHlwZTtcbiAgcmV0dXJuIChzY2FubmVyLnBlZWsoKSA9PT0gJ3snICYmXG4gICAgICAgICAgKHJlc3QgPSBzY2FubmVyLnJlc3QoKSkuc2xpY2UoMCwgMikgPT09ICd7eycgJiZcbiAgICAgICAgICAvXlxce1xce1xccyooXFwvfGVsc2VcXGIpLy50ZXN0KHJlc3QpICYmXG4gICAgICAgICAgKHR5cGUgPSBUZW1wbGF0ZVRhZy5wZWVrKHNjYW5uZXIpLnR5cGUpICYmXG4gICAgICAgICAgKHR5cGUgPT09ICdCTE9DS0NMT1NFJyB8fCB0eXBlID09PSAnRUxTRScpKTtcbn07XG5cbi8vIFZhbGlkYXRlIHRoYXQgYHRlbXBsYXRlVGFnYCBpcyBjb3JyZWN0bHkgZm9ybWVkIGFuZCBsZWdhbCBmb3IgaXRzXG4vLyBIVE1MIHBvc2l0aW9uLiAgVXNlIGBzY2FubmVyYCB0byByZXBvcnQgZXJyb3JzLiBPbiBzdWNjZXNzLCBkb2VzXG4vLyBub3RoaW5nLlxudmFyIHZhbGlkYXRlVGFnID0gZnVuY3Rpb24gKHR0YWcsIHNjYW5uZXIpIHtcblxuICBpZiAodHRhZy50eXBlID09PSAnSU5DTFVTSU9OJyB8fCB0dGFnLnR5cGUgPT09ICdCTE9DS09QRU4nKSB7XG4gICAgdmFyIGFyZ3MgPSB0dGFnLmFyZ3M7XG4gICAgaWYgKHR0YWcucGF0aFswXSA9PT0gJ2VhY2gnICYmIGFyZ3NbMV0gJiYgYXJnc1sxXVswXSA9PT0gJ1BBVEgnICYmXG4gICAgICAgIGFyZ3NbMV1bMV1bMF0gPT09ICdpbicpIHtcbiAgICAgIC8vIEZvciBzbGlnaHRseSBiZXR0ZXIgZXJyb3IgbWVzc2FnZXMsIHdlIGRldGVjdCB0aGUgZWFjaC1pbiBjYXNlXG4gICAgICAvLyBoZXJlIGluIG9yZGVyIG5vdCB0byBjb21wbGFpbiBpZiB0aGUgdXNlciB3cml0ZXMgYHt7I2VhY2ggMyBpbiB4fX1gXG4gICAgICAvLyB0aGF0IFwiMyBpcyBub3QgYSBmdW5jdGlvblwiXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDEgJiYgYXJnc1swXS5sZW5ndGggPT09IDIgJiYgYXJnc1swXVswXSAhPT0gJ1BBVEgnKSB7XG4gICAgICAgIC8vIHdlIGhhdmUgYSBwb3NpdGlvbmFsIGFyZ3VtZW50IHRoYXQgaXMgbm90IGEgUEFUSCBmb2xsb3dlZCBieVxuICAgICAgICAvLyBvdGhlciBhcmd1bWVudHNcbiAgICAgICAgc2Nhbm5lci5mYXRhbChcIkZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbiwgdG8gYmUgY2FsbGVkIG9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICBcInRoZSByZXN0IG9mIHRoZSBhcmd1bWVudHM7IGZvdW5kIFwiICsgYXJnc1swXVswXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdmFyIHBvc2l0aW9uID0gdHRhZy5wb3NpdGlvbiB8fCBURU1QTEFURV9UQUdfUE9TSVRJT04uRUxFTUVOVDtcbiAgaWYgKHBvc2l0aW9uID09PSBURU1QTEFURV9UQUdfUE9TSVRJT04uSU5fQVRUUklCVVRFKSB7XG4gICAgaWYgKHR0YWcudHlwZSA9PT0gJ0RPVUJMRScgfHwgdHRhZy50eXBlID09PSAnRVNDQVBFJykge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAodHRhZy50eXBlID09PSAnQkxPQ0tPUEVOJykge1xuICAgICAgdmFyIHBhdGggPSB0dGFnLnBhdGg7XG4gICAgICB2YXIgcGF0aDAgPSBwYXRoWzBdO1xuICAgICAgaWYgKCEgKHBhdGgubGVuZ3RoID09PSAxICYmIChwYXRoMCA9PT0gJ2lmJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoMCA9PT0gJ3VubGVzcycgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDAgPT09ICd3aXRoJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoMCA9PT0gJ2VhY2gnKSkpIHtcbiAgICAgICAgc2Nhbm5lci5mYXRhbChcIkN1c3RvbSBibG9jayBoZWxwZXJzIGFyZSBub3QgYWxsb3dlZCBpbiBhbiBIVE1MIGF0dHJpYnV0ZSwgb25seSBidWlsdC1pbiBvbmVzIGxpa2UgI2VhY2ggYW5kICNpZlwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2Nhbm5lci5mYXRhbCh0dGFnLnR5cGUgKyBcIiB0ZW1wbGF0ZSB0YWcgaXMgbm90IGFsbG93ZWQgaW4gYW4gSFRNTCBhdHRyaWJ1dGVcIik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSBURU1QTEFURV9UQUdfUE9TSVRJT04uSU5fU1RBUlRfVEFHKSB7XG4gICAgaWYgKCEgKHR0YWcudHlwZSA9PT0gJ0RPVUJMRScpKSB7XG4gICAgICBzY2FubmVyLmZhdGFsKFwiUmVhY3RpdmUgSFRNTCBhdHRyaWJ1dGVzIG11c3QgZWl0aGVyIGhhdmUgYSBjb25zdGFudCBuYW1lIG9yIGNvbnNpc3Qgb2YgYSBzaW5nbGUge3toZWxwZXJ9fSBwcm92aWRpbmcgYSBkaWN0aW9uYXJ5IG9mIG5hbWVzIGFuZCB2YWx1ZXMuICBBIHRlbXBsYXRlIHRhZyBvZiB0eXBlIFwiICsgdHRhZy50eXBlICsgXCIgaXMgbm90IGFsbG93ZWQgaGVyZS5cIik7XG4gICAgfVxuICAgIGlmIChzY2FubmVyLnBlZWsoKSA9PT0gJz0nKSB7XG4gICAgICBzY2FubmVyLmZhdGFsKFwiVGVtcGxhdGUgdGFncyBhcmUgbm90IGFsbG93ZWQgaW4gYXR0cmlidXRlIG5hbWVzLCBvbmx5IGluIGF0dHJpYnV0ZSB2YWx1ZXMgb3IgaW4gdGhlIGZvcm0gb2YgYSBzaW5nbGUge3toZWxwZXJ9fSB0aGF0IGV2YWx1YXRlcyB0byBhIGRpY3Rpb25hcnkgb2YgbmFtZT12YWx1ZSBwYWlycy5cIik7XG4gICAgfVxuICB9XG5cbn07XG4iLCJpbXBvcnQgeyBIVE1MIH0gZnJvbSAnbWV0ZW9yL2h0bWxqcyc7XG5pbXBvcnQgeyBUcmVlVHJhbnNmb3JtZXIsIHRvUmF3IH0gZnJvbSAnLi9vcHRpbWl6ZXInO1xuXG5mdW5jdGlvbiBjb21wYWN0UmF3KGFycmF5KXtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBhcnJheVtpXTtcbiAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIEhUTUwuUmF3KSB7XG4gICAgICBpZiAoIWl0ZW0udmFsdWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCAmJlxuICAgICAgICAgIChyZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdIGluc3RhbmNlb2YgSFRNTC5SYXcpKXtcbiAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSA9IEhUTUwuUmF3KFxuICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0udmFsdWUgKyBpdGVtLnZhbHVlKTtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUlmQ29udGFpbnNOZXdsaW5lKG1hdGNoKSB7XG4gIGlmIChtYXRjaC5pbmRleE9mKCdcXG4nKSA+PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgcmV0dXJuIG1hdGNoO1xufVxuXG5mdW5jdGlvbiBzdHJpcFdoaXRlc3BhY2UoYXJyYXkpe1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgIGlmIChpdGVtIGluc3RhbmNlb2YgSFRNTC5SYXcpIHtcbiAgICAgIC8vIHJlbW92ZSBub2RlcyB0aGF0IGNvbnRhaW4gb25seSB3aGl0ZXNwYWNlICYgYSBuZXdsaW5lXG4gICAgICBpZiAoaXRlbS52YWx1ZS5pbmRleE9mKCdcXG4nKSAhPT0gLTEgJiYgIS9cXFMvLnRlc3QoaXRlbS52YWx1ZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBUcmltIGFueSBwcmVjZWRpbmcgd2hpdGVzcGFjZSwgaWYgaXQgY29udGFpbnMgYSBuZXdsaW5lXG4gICAgICB2YXIgbmV3U3RyID0gaXRlbS52YWx1ZTtcbiAgICAgIG5ld1N0ciA9IG5ld1N0ci5yZXBsYWNlKC9eXFxzKy8sIHJlcGxhY2VJZkNvbnRhaW5zTmV3bGluZSk7XG4gICAgICBuZXdTdHIgPSBuZXdTdHIucmVwbGFjZSgvXFxzKyQvLCByZXBsYWNlSWZDb250YWluc05ld2xpbmUpO1xuICAgICAgaXRlbS52YWx1ZSA9IG5ld1N0cjtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goaXRlbSlcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIgV2hpdGVzcGFjZVJlbW92aW5nVmlzaXRvciA9IFRyZWVUcmFuc2Zvcm1lci5leHRlbmQoKTtcbldoaXRlc3BhY2VSZW1vdmluZ1Zpc2l0b3IuZGVmKHtcbiAgdmlzaXROdWxsOiB0b1JhdyxcbiAgdmlzaXRQcmltaXRpdmU6IHRvUmF3LFxuICB2aXNpdENoYXJSZWY6IHRvUmF3LFxuICB2aXNpdEFycmF5OiBmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gdGhpcy5zdXBlcihhcnJheSlcbiAgICB2YXIgcmVzdWx0ID0gVHJlZVRyYW5zZm9ybWVyLnByb3RvdHlwZS52aXNpdEFycmF5LmNhbGwodGhpcywgYXJyYXkpO1xuICAgIHJlc3VsdCA9IGNvbXBhY3RSYXcocmVzdWx0KTtcbiAgICByZXN1bHQgPSBzdHJpcFdoaXRlc3BhY2UocmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuICB2aXNpdFRhZzogZnVuY3Rpb24gKHRhZykge1xuICAgIHZhciB0YWdOYW1lID0gdGFnLnRhZ05hbWU7XG4gICAgLy8gVE9ETyAtIExpc3QgdGFncyB0aGF0IHdlIGRvbid0IHdhbnQgdG8gc3RyaXAgd2hpdGVzcGFjZSBmb3IuXG4gICAgaWYgKHRhZ05hbWUgPT09ICd0ZXh0YXJlYScgfHwgdGFnTmFtZSA9PT0gJ3NjcmlwdCcgfHwgdGFnTmFtZSA9PT0gJ3ByZSdcbiAgICAgIHx8ICFIVE1MLmlzS25vd25FbGVtZW50KHRhZ05hbWUpIHx8IEhUTUwuaXNLbm93blNWR0VsZW1lbnQodGFnTmFtZSkpIHtcbiAgICAgIHJldHVybiB0YWc7XG4gICAgfVxuICAgIHJldHVybiBUcmVlVHJhbnNmb3JtZXIucHJvdG90eXBlLnZpc2l0VGFnLmNhbGwodGhpcywgdGFnKVxuICB9LFxuICB2aXNpdEF0dHJpYnV0ZXM6IGZ1bmN0aW9uIChhdHRycykge1xuICAgIHJldHVybiBhdHRycztcbiAgfVxufSk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVdoaXRlc3BhY2UodHJlZSkge1xuICB0cmVlID0gKG5ldyBXaGl0ZXNwYWNlUmVtb3ZpbmdWaXNpdG9yKS52aXNpdCh0cmVlKTtcbiAgcmV0dXJuIHRyZWU7XG59XG4iXX0=
