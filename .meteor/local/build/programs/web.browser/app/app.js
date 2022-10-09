var require = meteorInstall({"lib":{"template.animation.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/template.animation.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("animation");
Template["animation"] = new Template("Template.animation", (function() {
  var view = this;
  return HTML.SVG({
    version: "1.1",
    viewBox: "0 0 1024 1024",
    xmlns: "http://www.w3.org/2000/svg"
  }, "\n    ", HTML.G({
    stroke: "lightgray",
    "stroke-dasharray": "1,1",
    "stroke-width": "1",
    transform: "scale(4, 4)"
  }, "\n      ", HTML.LINE({
    x1: "0",
    y1: "0",
    x2: "256",
    y2: "256"
  }), "\n      ", HTML.LINE({
    x1: "256",
    y1: "0",
    x2: "0",
    y2: "256"
  }), "\n      ", HTML.LINE({
    x1: "128",
    y1: "0",
    x2: "128",
    y2: "256"
  }), "\n      ", HTML.LINE({
    x1: "0",
    y1: "128",
    x2: "256",
    y2: "128"
  }), "\n    "), "\n    ", HTML.G({
    transform: "scale(1, -1) translate(0, -900)"
  }, "\n      ", HTML.STYLE({
    type: "text/css"
  }, "\n        ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("animations"));
  }, function() {
    return [ "\n          @keyframes ", Blaze.View("lookup:keyframes", function() {
      return Spacebars.mustache(view.lookup("keyframes"));
    }), " {\n            from {\n              stroke: blue;\n              stroke-dashoffset: ", Blaze.View("lookup:offset", function() {
      return Spacebars.mustache(view.lookup("offset"));
    }), ";\n              stroke-width: ", Blaze.View("lookup:width", function() {
      return Spacebars.mustache(view.lookup("width"));
    }), ";\n            }\n            ", Blaze.View("lookup:fraction", function() {
      return Spacebars.mustache(view.lookup("fraction"));
    }), " {\n              animation-timing-function: step-end;\n              stroke: blue;\n              stroke-dashoffset: 0;\n              stroke-width: ", Blaze.View("lookup:width", function() {
      return Spacebars.mustache(view.lookup("width"));
    }), ";\n            }\n            to {\n              stroke: black;\n              stroke-width: 1024;\n            }\n          }\n          #", Blaze.View("lookup:animation_id", function() {
      return Spacebars.mustache(view.lookup("animation_id"));
    }), " {\n            animation: ", Blaze.View("lookup:keyframes", function() {
      return Spacebars.mustache(view.lookup("keyframes"));
    }), " ", Blaze.View("lookup:duration", function() {
      return Spacebars.mustache(view.lookup("duration"));
    }), " both;\n            animation-delay: ", Blaze.View("lookup:delay", function() {
      return Spacebars.mustache(view.lookup("delay"));
    }), ";\n            animation-timing-function: linear;\n          }\n        " ];
  }), "\n      "), "\n      ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("strokes"));
  }, function() {
    return [ "\n        ", HTML.PATH({
      d: function() {
        return Spacebars.mustache(view.lookup("."));
      },
      fill: "lightgray"
    }), "\n      " ];
  }), "\n      ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("animations"));
  }, function() {
    return [ "\n        ", HTML.CLIPPATH({
      id: function() {
        return Spacebars.mustache(view.lookup("clip_id"));
      }
    }, "\n          ", HTML.PATH({
      d: function() {
        return Spacebars.mustache(view.lookup("stroke"));
      }
    }), "\n        "), "\n        ", HTML.PATH({
      "clip-path": function() {
        return [ "url(#", Spacebars.mustache(view.lookup("clip_id")), ")" ];
      },
      d: function() {
        return Spacebars.mustache(view.lookup("d"));
      },
      fill: "none",
      id: function() {
        return Spacebars.mustache(view.lookup("animation_id"));
      },
      "stroke-dasharray": function() {
        return [ Spacebars.mustache(view.lookup("length")), " ", Spacebars.mustache(view.lookup("spacing")) ];
      },
      "stroke-linecap": "round"
    }), "\n      " ];
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"external":{"convnet":{"1.1.0":{"convnet.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/external/convnet/1.1.0/convnet.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var convnetjs = convnetjs || {
  REVISION: 'ALPHA'
};

(function (global) {
  "use strict"; // Random number utilities

  var return_v = false;
  var v_val = 0.0;

  var gaussRandom = function () {
    if (return_v) {
      return_v = false;
      return v_val;
    }

    var u = 2 * Math.random() - 1;
    var v = 2 * Math.random() - 1;
    var r = u * u + v * v;
    if (r == 0 || r > 1) return gaussRandom();
    var c = Math.sqrt(-2 * Math.log(r) / r);
    v_val = v * c; // cache this

    return_v = true;
    return u * c;
  };

  var randf = function (a, b) {
    return Math.random() * (b - a) + a;
  };

  var randi = function (a, b) {
    return Math.floor(Math.random() * (b - a) + a);
  };

  var randn = function (mu, std) {
    return mu + gaussRandom() * std;
  }; // Array utilities


  var zeros = function (n) {
    if (typeof n === 'undefined' || isNaN(n)) {
      return [];
    }

    if (typeof ArrayBuffer === 'undefined') {
      // lacking browser support
      var arr = new Array(n);

      for (var i = 0; i < n; i++) {
        arr[i] = 0;
      }

      return arr;
    } else {
      return new Float64Array(n);
    }
  };

  var arrContains = function (arr, elt) {
    for (var i = 0, n = arr.length; i < n; i++) {
      if (arr[i] === elt) return true;
    }

    return false;
  };

  var arrUnique = function (arr) {
    var b = [];

    for (var i = 0, n = arr.length; i < n; i++) {
      if (!arrContains(b, arr[i])) {
        b.push(arr[i]);
      }
    }

    return b;
  }; // return max and min of a given non-empty array.


  var maxmin = function (w) {
    if (w.length === 0) {
      return {};
    } // ... ;s


    var maxv = w[0];
    var minv = w[0];
    var maxi = 0;
    var mini = 0;
    var n = w.length;

    for (var i = 1; i < n; i++) {
      if (w[i] > maxv) {
        maxv = w[i];
        maxi = i;
      }

      if (w[i] < minv) {
        minv = w[i];
        mini = i;
      }
    }

    return {
      maxi: maxi,
      maxv: maxv,
      mini: mini,
      minv: minv,
      dv: maxv - minv
    };
  }; // create random permutation of numbers, in range [0...n-1]


  var randperm = function (n) {
    var i = n,
        j = 0,
        temp;
    var array = [];

    for (var q = 0; q < n; q++) array[q] = q;

    while (i--) {
      j = Math.floor(Math.random() * (i + 1));
      temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    return array;
  }; // sample from list lst according to probabilities in list probs
  // the two lists are of same size, and probs adds up to 1


  var weightedSample = function (lst, probs) {
    var p = randf(0, 1.0);
    var cumprob = 0.0;

    for (var k = 0, n = lst.length; k < n; k++) {
      cumprob += probs[k];

      if (p < cumprob) {
        return lst[k];
      }
    }
  }; // syntactic sugar function for getting default parameter values


  var getopt = function (opt, field_name, default_value) {
    return typeof opt[field_name] !== 'undefined' ? opt[field_name] : default_value;
  };

  global.randf = randf;
  global.randi = randi;
  global.randn = randn;
  global.zeros = zeros;
  global.maxmin = maxmin;
  global.randperm = randperm;
  global.weightedSample = weightedSample;
  global.arrUnique = arrUnique;
  global.arrContains = arrContains;
  global.getopt = getopt;
})(convnetjs);

(function (global) {
  "use strict"; // Vol is the basic building block of all data in a net.
  // it is essentially just a 3D volume of numbers, with a
  // width (sx), height (sy), and depth (depth).
  // it is used to hold data for all filters, all volumes,
  // all weights, and also stores all gradients w.r.t. 
  // the data. c is optionally a value to initialize the volume
  // with. If c is missing, fills the Vol with random numbers.

  var Vol = function (sx, sy, depth, c) {
    // this is how you check if a variable is an array. Oh, Javascript :)
    if (Object.prototype.toString.call(sx) === '[object Array]') {
      // we were given a list in sx, assume 1D volume and fill it up
      this.sx = 1;
      this.sy = 1;
      this.depth = sx.length; // we have to do the following copy because we want to use
      // fast typed arrays, not an ordinary javascript array

      this.w = global.zeros(this.depth);
      this.dw = global.zeros(this.depth);

      for (var i = 0; i < this.depth; i++) {
        this.w[i] = sx[i];
      }
    } else {
      // we were given dimensions of the vol
      this.sx = sx;
      this.sy = sy;
      this.depth = depth;
      var n = sx * sy * depth;
      this.w = global.zeros(n);
      this.dw = global.zeros(n);

      if (typeof c === 'undefined') {
        // weight normalization is done to equalize the output
        // variance of every neuron, otherwise neurons with a lot
        // of incoming connections have outputs of larger variance
        var scale = Math.sqrt(1.0 / (sx * sy * depth));

        for (var i = 0; i < n; i++) {
          this.w[i] = global.randn(0.0, scale);
        }
      } else {
        for (var i = 0; i < n; i++) {
          this.w[i] = c;
        }
      }
    }
  };

  Vol.prototype = {
    get: function (x, y, d) {
      var ix = (this.sx * y + x) * this.depth + d;
      return this.w[ix];
    },
    set: function (x, y, d, v) {
      var ix = (this.sx * y + x) * this.depth + d;
      this.w[ix] = v;
    },
    add: function (x, y, d, v) {
      var ix = (this.sx * y + x) * this.depth + d;
      this.w[ix] += v;
    },
    get_grad: function (x, y, d) {
      var ix = (this.sx * y + x) * this.depth + d;
      return this.dw[ix];
    },
    set_grad: function (x, y, d, v) {
      var ix = (this.sx * y + x) * this.depth + d;
      this.dw[ix] = v;
    },
    add_grad: function (x, y, d, v) {
      var ix = (this.sx * y + x) * this.depth + d;
      this.dw[ix] += v;
    },
    cloneAndZero: function () {
      return new Vol(this.sx, this.sy, this.depth, 0.0);
    },
    clone: function () {
      var V = new Vol(this.sx, this.sy, this.depth, 0.0);
      var n = this.w.length;

      for (var i = 0; i < n; i++) {
        V.w[i] = this.w[i];
      }

      return V;
    },
    addFrom: function (V) {
      for (var k = 0; k < this.w.length; k++) {
        this.w[k] += V.w[k];
      }
    },
    addFromScaled: function (V, a) {
      for (var k = 0; k < this.w.length; k++) {
        this.w[k] += a * V.w[k];
      }
    },
    setConst: function (a) {
      for (var k = 0; k < this.w.length; k++) {
        this.w[k] = a;
      }
    },
    toJSON: function () {
      // todo: we may want to only save d most significant digits to save space
      var json = {};
      json.sx = this.sx;
      json.sy = this.sy;
      json.depth = this.depth;
      json.w = this.w;
      return json; // we wont back up gradients to save space
    },
    fromJSON: function (json) {
      this.sx = json.sx;
      this.sy = json.sy;
      this.depth = json.depth;
      var n = this.sx * this.sy * this.depth;
      this.w = global.zeros(n);
      this.dw = global.zeros(n); // copy over the elements.

      for (var i = 0; i < n; i++) {
        this.w[i] = json.w[i];
      }
    }
  };
  global.Vol = Vol;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // Volume utilities
  // intended for use with data augmentation
  // crop is the size of output
  // dx,dy are offset wrt incoming volume, of the shift
  // fliplr is boolean on whether we also want to flip left<->right

  var augment = function (V, crop, dx, dy, fliplr) {
    // note assumes square outputs of size crop x crop
    if (typeof fliplr === 'undefined') var fliplr = false;
    if (typeof dx === 'undefined') var dx = global.randi(0, V.sx - crop);
    if (typeof dy === 'undefined') var dy = global.randi(0, V.sy - crop); // randomly sample a crop in the input volume

    var W;

    if (crop !== V.sx || dx !== 0 || dy !== 0) {
      W = new Vol(crop, crop, V.depth, 0.0);

      for (var x = 0; x < crop; x++) {
        for (var y = 0; y < crop; y++) {
          if (x + dx < 0 || x + dx >= V.sx || y + dy < 0 || y + dy >= V.sy) continue; // oob

          for (var d = 0; d < V.depth; d++) {
            W.set(x, y, d, V.get(x + dx, y + dy, d)); // copy data over
          }
        }
      }
    } else {
      W = V;
    }

    if (fliplr) {
      // flip volume horziontally
      var W2 = W.cloneAndZero();

      for (var x = 0; x < W.sx; x++) {
        for (var y = 0; y < W.sy; y++) {
          for (var d = 0; d < W.depth; d++) {
            W2.set(x, y, d, W.get(W.sx - x - 1, y, d)); // copy data over
          }
        }
      }

      W = W2; //swap
    }

    return W;
  }; // img is a DOM element that contains a loaded image
  // returns a Vol of size (W, H, 4). 4 is for RGBA


  var img_to_vol = function (img, convert_grayscale) {
    if (typeof convert_grayscale === 'undefined') var convert_grayscale = false;
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d"); // due to a Firefox bug

    try {
      ctx.drawImage(img, 0, 0);
    } catch (e) {
      if (e.name === "NS_ERROR_NOT_AVAILABLE") {
        // sometimes happens, lets just abort
        return false;
      } else {
        throw e;
      }
    }

    try {
      var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      if (e.name === 'IndexSizeError') {
        return false; // not sure what causes this sometimes but okay abort
      } else {
        throw e;
      }
    } // prepare the input: get pixels and normalize them


    var p = img_data.data;
    var W = img.width;
    var H = img.height;
    var pv = [];

    for (var i = 0; i < p.length; i++) {
      pv.push(p[i] / 255.0 - 0.5); // normalize image pixels to [-0.5, 0.5]
    }

    var x = new Vol(W, H, 4, 0.0); //input volume (image)

    x.w = pv;

    if (convert_grayscale) {
      // flatten into depth=1 array
      var x1 = new Vol(W, H, 1, 0.0);

      for (var i = 0; i < W; i++) {
        for (var j = 0; j < H; j++) {
          x1.set(i, j, 0, x.get(i, j, 0));
        }
      }

      x = x1;
    }

    return x;
  };

  global.augment = augment;
  global.img_to_vol = img_to_vol;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // This file contains all layers that do dot products with input,
  // but usually in a different connectivity pattern and weight sharing
  // schemes: 
  // - FullyConn is fully connected dot products 
  // - ConvLayer does convolutions (so weight sharing spatially)
  // putting them together in one file because they are very similar

  var ConvLayer = function (opt) {
    var opt = opt || {}; // required

    this.out_depth = opt.filters;
    this.sx = opt.sx; // filter size. Should be odd if possible, it's cleaner.

    this.in_depth = opt.in_depth;
    this.in_sx = opt.in_sx;
    this.in_sy = opt.in_sy; // optional

    this.sy = typeof opt.sy !== 'undefined' ? opt.sy : this.sx;
    this.stride = typeof opt.stride !== 'undefined' ? opt.stride : 1; // stride at which we apply filters to input volume

    this.pad = typeof opt.pad !== 'undefined' ? opt.pad : 0; // amount of 0 padding to add around borders of input volume

    this.l1_decay_mul = typeof opt.l1_decay_mul !== 'undefined' ? opt.l1_decay_mul : 0.0;
    this.l2_decay_mul = typeof opt.l2_decay_mul !== 'undefined' ? opt.l2_decay_mul : 1.0; // computed
    // note we are doing floor, so if the strided convolution of the filter doesnt fit into the input
    // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
    // final application.

    this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
    this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);
    this.layer_type = 'conv'; // initializations

    var bias = typeof opt.bias_pref !== 'undefined' ? opt.bias_pref : 0.0;
    this.filters = [];

    for (var i = 0; i < this.out_depth; i++) {
      this.filters.push(new Vol(this.sx, this.sy, this.in_depth));
    }

    this.biases = new Vol(1, 1, this.out_depth, bias);
  };

  ConvLayer.prototype = {
    forward: function (V, is_training) {
      // optimized code by @mdda that achieves 2x speedup over previous version
      this.in_act = V;
      var A = new Vol(this.out_sx | 0, this.out_sy | 0, this.out_depth | 0, 0.0);
      var V_sx = V.sx | 0;
      var V_sy = V.sy | 0;
      var xy_stride = this.stride | 0;

      for (var d = 0; d < this.out_depth; d++) {
        var f = this.filters[d];
        var x = -this.pad | 0;
        var y = -this.pad | 0;

        for (var ay = 0; ay < this.out_sy; y += xy_stride, ay++) {
          // xy_stride
          x = -this.pad | 0;

          for (var ax = 0; ax < this.out_sx; x += xy_stride, ax++) {
            // xy_stride
            // convolve centered at this particular location
            var a = 0.0;

            for (var fy = 0; fy < f.sy; fy++) {
              var oy = y + fy; // coordinates in the original input array coordinates

              for (var fx = 0; fx < f.sx; fx++) {
                var ox = x + fx;

                if (oy >= 0 && oy < V_sy && ox >= 0 && ox < V_sx) {
                  for (var fd = 0; fd < f.depth; fd++) {
                    // avoid function call overhead (x2) for efficiency, compromise modularity :(
                    a += f.w[(f.sx * fy + fx) * f.depth + fd] * V.w[(V_sx * oy + ox) * V.depth + fd];
                  }
                }
              }
            }

            a += this.biases.w[d];
            A.set(ax, ay, d, a);
          }
        }
      }

      this.out_act = A;
      return this.out_act;
    },
    backward: function () {
      var V = this.in_act;
      V.dw = global.zeros(V.w.length); // zero out gradient wrt bottom data, we're about to fill it

      var V_sx = V.sx | 0;
      var V_sy = V.sy | 0;
      var xy_stride = this.stride | 0;

      for (var d = 0; d < this.out_depth; d++) {
        var f = this.filters[d];
        var x = -this.pad | 0;
        var y = -this.pad | 0;

        for (var ay = 0; ay < this.out_sy; y += xy_stride, ay++) {
          // xy_stride
          x = -this.pad | 0;

          for (var ax = 0; ax < this.out_sx; x += xy_stride, ax++) {
            // xy_stride
            // convolve centered at this particular location
            var chain_grad = this.out_act.get_grad(ax, ay, d); // gradient from above, from chain rule

            for (var fy = 0; fy < f.sy; fy++) {
              var oy = y + fy; // coordinates in the original input array coordinates

              for (var fx = 0; fx < f.sx; fx++) {
                var ox = x + fx;

                if (oy >= 0 && oy < V_sy && ox >= 0 && ox < V_sx) {
                  for (var fd = 0; fd < f.depth; fd++) {
                    // avoid function call overhead (x2) for efficiency, compromise modularity :(
                    var ix1 = (V_sx * oy + ox) * V.depth + fd;
                    var ix2 = (f.sx * fy + fx) * f.depth + fd;
                    f.dw[ix2] += V.w[ix1] * chain_grad;
                    V.dw[ix1] += f.w[ix2] * chain_grad;
                  }
                }
              }
            }

            this.biases.dw[d] += chain_grad;
          }
        }
      }
    },
    getParamsAndGrads: function () {
      var response = [];

      for (var i = 0; i < this.out_depth; i++) {
        response.push({
          params: this.filters[i].w,
          grads: this.filters[i].dw,
          l2_decay_mul: this.l2_decay_mul,
          l1_decay_mul: this.l1_decay_mul
        });
      }

      response.push({
        params: this.biases.w,
        grads: this.biases.dw,
        l1_decay_mul: 0.0,
        l2_decay_mul: 0.0
      });
      return response;
    },
    toJSON: function () {
      var json = {};
      json.sx = this.sx; // filter size in x, y dims

      json.sy = this.sy;
      json.stride = this.stride;
      json.in_depth = this.in_depth;
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.l1_decay_mul = this.l1_decay_mul;
      json.l2_decay_mul = this.l2_decay_mul;
      json.pad = this.pad;
      json.filters = [];

      for (var i = 0; i < this.filters.length; i++) {
        json.filters.push(this.filters[i].toJSON());
      }

      json.biases = this.biases.toJSON();
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.sx = json.sx; // filter size in x, y dims

      this.sy = json.sy;
      this.stride = json.stride;
      this.in_depth = json.in_depth; // depth of input volume

      this.filters = [];
      this.l1_decay_mul = typeof json.l1_decay_mul !== 'undefined' ? json.l1_decay_mul : 1.0;
      this.l2_decay_mul = typeof json.l2_decay_mul !== 'undefined' ? json.l2_decay_mul : 1.0;
      this.pad = typeof json.pad !== 'undefined' ? json.pad : 0;

      for (var i = 0; i < json.filters.length; i++) {
        var v = new Vol(0, 0, 0, 0);
        v.fromJSON(json.filters[i]);
        this.filters.push(v);
      }

      this.biases = new Vol(0, 0, 0, 0);
      this.biases.fromJSON(json.biases);
    }
  };

  var FullyConnLayer = function (opt) {
    var opt = opt || {}; // required
    // ok fine we will allow 'filters' as the word as well

    this.out_depth = typeof opt.num_neurons !== 'undefined' ? opt.num_neurons : opt.filters; // optional 

    this.l1_decay_mul = typeof opt.l1_decay_mul !== 'undefined' ? opt.l1_decay_mul : 0.0;
    this.l2_decay_mul = typeof opt.l2_decay_mul !== 'undefined' ? opt.l2_decay_mul : 1.0; // computed

    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'fc'; // initializations

    var bias = typeof opt.bias_pref !== 'undefined' ? opt.bias_pref : 0.0;
    this.filters = [];

    for (var i = 0; i < this.out_depth; i++) {
      this.filters.push(new Vol(1, 1, this.num_inputs));
    }

    this.biases = new Vol(1, 1, this.out_depth, bias);
  };

  FullyConnLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var A = new Vol(1, 1, this.out_depth, 0.0);
      var Vw = V.w;

      for (var i = 0; i < this.out_depth; i++) {
        var a = 0.0;
        var wi = this.filters[i].w;

        for (var d = 0; d < this.num_inputs; d++) {
          a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
        }

        a += this.biases.w[i];
        A.w[i] = a;
      }

      this.out_act = A;
      return this.out_act;
    },
    backward: function () {
      var V = this.in_act;
      V.dw = global.zeros(V.w.length); // zero out the gradient in input Vol
      // compute gradient wrt weights and data

      for (var i = 0; i < this.out_depth; i++) {
        var tfi = this.filters[i];
        var chain_grad = this.out_act.dw[i];

        for (var d = 0; d < this.num_inputs; d++) {
          V.dw[d] += tfi.w[d] * chain_grad; // grad wrt input data

          tfi.dw[d] += V.w[d] * chain_grad; // grad wrt params
        }

        this.biases.dw[i] += chain_grad;
      }
    },
    getParamsAndGrads: function () {
      var response = [];

      for (var i = 0; i < this.out_depth; i++) {
        response.push({
          params: this.filters[i].w,
          grads: this.filters[i].dw,
          l1_decay_mul: this.l1_decay_mul,
          l2_decay_mul: this.l2_decay_mul
        });
      }

      response.push({
        params: this.biases.w,
        grads: this.biases.dw,
        l1_decay_mul: 0.0,
        l2_decay_mul: 0.0
      });
      return response;
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      json.l1_decay_mul = this.l1_decay_mul;
      json.l2_decay_mul = this.l2_decay_mul;
      json.filters = [];

      for (var i = 0; i < this.filters.length; i++) {
        json.filters.push(this.filters[i].toJSON());
      }

      json.biases = this.biases.toJSON();
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
      this.l1_decay_mul = typeof json.l1_decay_mul !== 'undefined' ? json.l1_decay_mul : 1.0;
      this.l2_decay_mul = typeof json.l2_decay_mul !== 'undefined' ? json.l2_decay_mul : 1.0;
      this.filters = [];

      for (var i = 0; i < json.filters.length; i++) {
        var v = new Vol(0, 0, 0, 0);
        v.fromJSON(json.filters[i]);
        this.filters.push(v);
      }

      this.biases = new Vol(0, 0, 0, 0);
      this.biases.fromJSON(json.biases);
    }
  };
  global.ConvLayer = ConvLayer;
  global.FullyConnLayer = FullyConnLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience

  var PoolLayer = function (opt) {
    var opt = opt || {}; // required

    this.sx = opt.sx; // filter size

    this.in_depth = opt.in_depth;
    this.in_sx = opt.in_sx;
    this.in_sy = opt.in_sy; // optional

    this.sy = typeof opt.sy !== 'undefined' ? opt.sy : this.sx;
    this.stride = typeof opt.stride !== 'undefined' ? opt.stride : 2;
    this.pad = typeof opt.pad !== 'undefined' ? opt.pad : 0; // amount of 0 padding to add around borders of input volume
    // computed

    this.out_depth = this.in_depth;
    this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
    this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);
    this.layer_type = 'pool'; // store switches for x,y coordinates for where the max comes from, for each output neuron

    this.switchx = global.zeros(this.out_sx * this.out_sy * this.out_depth);
    this.switchy = global.zeros(this.out_sx * this.out_sy * this.out_depth);
  };

  PoolLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var A = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
      var n = 0; // a counter for switches

      for (var d = 0; d < this.out_depth; d++) {
        var x = -this.pad;
        var y = -this.pad;

        for (var ax = 0; ax < this.out_sx; x += this.stride, ax++) {
          y = -this.pad;

          for (var ay = 0; ay < this.out_sy; y += this.stride, ay++) {
            // convolve centered at this particular location
            var a = -99999; // hopefully small enough ;\

            var winx = -1,
                winy = -1;

            for (var fx = 0; fx < this.sx; fx++) {
              for (var fy = 0; fy < this.sy; fy++) {
                var oy = y + fy;
                var ox = x + fx;

                if (oy >= 0 && oy < V.sy && ox >= 0 && ox < V.sx) {
                  var v = V.get(ox, oy, d); // perform max pooling and store pointers to where
                  // the max came from. This will speed up backprop 
                  // and can help make nice visualizations in future

                  if (v > a) {
                    a = v;
                    winx = ox;
                    winy = oy;
                  }
                }
              }
            }

            this.switchx[n] = winx;
            this.switchy[n] = winy;
            n++;
            A.set(ax, ay, d, a);
          }
        }
      }

      this.out_act = A;
      return this.out_act;
    },
    backward: function () {
      // pooling layers have no parameters, so simply compute 
      // gradient wrt data here
      var V = this.in_act;
      V.dw = global.zeros(V.w.length); // zero out gradient wrt data

      var A = this.out_act; // computed in forward pass 

      var n = 0;

      for (var d = 0; d < this.out_depth; d++) {
        var x = -this.pad;
        var y = -this.pad;

        for (var ax = 0; ax < this.out_sx; x += this.stride, ax++) {
          y = -this.pad;

          for (var ay = 0; ay < this.out_sy; y += this.stride, ay++) {
            var chain_grad = this.out_act.get_grad(ax, ay, d);
            V.add_grad(this.switchx[n], this.switchy[n], d, chain_grad);
            n++;
          }
        }
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.sx = this.sx;
      json.sy = this.sy;
      json.stride = this.stride;
      json.in_depth = this.in_depth;
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.pad = this.pad;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.sx = json.sx;
      this.sy = json.sy;
      this.stride = json.stride;
      this.in_depth = json.in_depth;
      this.pad = typeof json.pad !== 'undefined' ? json.pad : 0; // backwards compatibility

      this.switchx = global.zeros(this.out_sx * this.out_sy * this.out_depth); // need to re-init these appropriately

      this.switchy = global.zeros(this.out_sx * this.out_sy * this.out_depth);
    }
  };
  global.PoolLayer = PoolLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience

  var InputLayer = function (opt) {
    var opt = opt || {}; // this is a bit silly but lets allow people to specify either ins or outs

    this.out_sx = typeof opt.out_sx !== 'undefined' ? opt.out_sx : opt.in_sx;
    this.out_sy = typeof opt.out_sy !== 'undefined' ? opt.out_sy : opt.in_sy;
    this.out_depth = typeof opt.out_depth !== 'undefined' ? opt.out_depth : opt.in_depth;
    this.layer_type = 'input';
  };

  InputLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      this.out_act = V;
      return this.out_act; // dummy identity function for now
    },
    backward: function () {},
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
    }
  };
  global.InputLayer = InputLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // Layers that implement a loss. Currently these are the layers that 
  // can initiate a backward() pass. In future we probably want a more 
  // flexible system that can accomodate multiple losses to do multi-task
  // learning, and stuff like that. But for now, one of the layers in this
  // file must be the final layer in a Net.
  // This is a classifier, with N discrete classes from 0 to N-1
  // it gets a stream of N incoming numbers and computes the softmax
  // function (exponentiate and normalize to sum to 1 as probabilities should)

  var SoftmaxLayer = function (opt) {
    var opt = opt || {}; // computed

    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'softmax';
  };

  SoftmaxLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var A = new Vol(1, 1, this.out_depth, 0.0); // compute max activation

      var as = V.w;
      var amax = V.w[0];

      for (var i = 1; i < this.out_depth; i++) {
        if (as[i] > amax) amax = as[i];
      } // compute exponentials (carefully to not blow up)


      var es = global.zeros(this.out_depth);
      var esum = 0.0;

      for (var i = 0; i < this.out_depth; i++) {
        var e = Math.exp(as[i] - amax);
        esum += e;
        es[i] = e;
      } // normalize and output to sum to one


      for (var i = 0; i < this.out_depth; i++) {
        es[i] /= esum;
        A.w[i] = es[i];
      }

      this.es = es; // save these for backprop

      this.out_act = A;
      return this.out_act;
    },
    backward: function (y) {
      // compute and accumulate gradient wrt weights and bias of this layer
      var x = this.in_act;
      x.dw = global.zeros(x.w.length); // zero out the gradient of input Vol

      for (var i = 0; i < this.out_depth; i++) {
        var indicator = i === y ? 1.0 : 0.0;
        var mul = -(indicator - this.es[i]);
        x.dw[i] = mul;
      } // loss is the class negative log likelihood


      return -Math.log(this.es[y]);
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
    }
  }; // implements an L2 regression cost layer,
  // so penalizes \sum_i(||x_i - y_i||^2), where x is its input
  // and y is the user-provided array of "correct" values.

  var RegressionLayer = function (opt) {
    var opt = opt || {}; // computed

    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'regression';
  };

  RegressionLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      this.out_act = V;
      return V; // identity function
    },
    // y is a list here of size num_inputs
    backward: function (y) {
      // compute and accumulate gradient wrt weights and bias of this layer
      var x = this.in_act;
      x.dw = global.zeros(x.w.length); // zero out the gradient of input Vol

      var loss = 0.0;

      if (y instanceof Array || y instanceof Float64Array) {
        for (var i = 0; i < this.out_depth; i++) {
          var dy = x.w[i] - y[i];
          x.dw[i] = dy;
          loss += 2 * dy * dy;
        }
      } else {
        // assume it is a struct with entries .dim and .val
        // and we pass gradient only along dimension dim to be equal to val
        var i = y.dim;
        var yi = y.val;
        var dy = x.w[i] - yi;
        x.dw[i] = dy;
        loss += 2 * dy * dy;
      }

      return loss;
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
    }
  };

  var SVMLayer = function (opt) {
    var opt = opt || {}; // computed

    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'svm';
  };

  SVMLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      this.out_act = V; // nothing to do, output raw scores

      return V;
    },
    backward: function (y) {
      // compute and accumulate gradient wrt weights and bias of this layer
      var x = this.in_act;
      x.dw = global.zeros(x.w.length); // zero out the gradient of input Vol

      var yscore = x.w[y]; // score of ground truth

      var margin = 1.0;
      var loss = 0.0;

      for (var i = 0; i < this.out_depth; i++) {
        if (-yscore + x.w[i] + margin > 0) {
          // violating example, apply loss
          // I love hinge loss, by the way. Truly.
          // Seriously, compare this SVM code with Softmax forward AND backprop code above
          // it's clear which one is superior, not only in code, simplicity
          // and beauty, but also in practice.
          x.dw[i] += 1;
          x.dw[y] -= 1;
          loss += -yscore + x.w[i] + margin;
        }
      }

      return loss;
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
    }
  };
  global.RegressionLayer = RegressionLayer;
  global.SoftmaxLayer = SoftmaxLayer;
  global.SVMLayer = SVMLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // Implements ReLU nonlinearity elementwise
  // x -> max(0, x)
  // the output is in [0, inf)

  var ReluLayer = function (opt) {
    var opt = opt || {}; // computed

    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'relu';
  };

  ReluLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var V2 = V.clone();
      var N = V.w.length;
      var V2w = V2.w;

      for (var i = 0; i < N; i++) {
        if (V2w[i] < 0) V2w[i] = 0; // threshold at 0
      }

      this.out_act = V2;
      return this.out_act;
    },
    backward: function () {
      var V = this.in_act; // we need to set dw of this

      var V2 = this.out_act;
      var N = V.w.length;
      V.dw = global.zeros(N); // zero out gradient wrt data

      for (var i = 0; i < N; i++) {
        if (V2.w[i] <= 0) V.dw[i] = 0; // threshold
        else V.dw[i] = V2.dw[i];
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
    }
  }; // Implements Sigmoid nnonlinearity elementwise
  // x -> 1/(1+e^(-x))
  // so the output is between 0 and 1.

  var SigmoidLayer = function (opt) {
    var opt = opt || {}; // computed

    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'sigmoid';
  };

  SigmoidLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var V2 = V.cloneAndZero();
      var N = V.w.length;
      var V2w = V2.w;
      var Vw = V.w;

      for (var i = 0; i < N; i++) {
        V2w[i] = 1.0 / (1.0 + Math.exp(-Vw[i]));
      }

      this.out_act = V2;
      return this.out_act;
    },
    backward: function () {
      var V = this.in_act; // we need to set dw of this

      var V2 = this.out_act;
      var N = V.w.length;
      V.dw = global.zeros(N); // zero out gradient wrt data

      for (var i = 0; i < N; i++) {
        var v2wi = V2.w[i];
        V.dw[i] = v2wi * (1.0 - v2wi) * V2.dw[i];
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
    }
  }; // Implements Maxout nnonlinearity that computes
  // x -> max(x)
  // where x is a vector of size group_size. Ideally of course,
  // the input size should be exactly divisible by group_size

  var MaxoutLayer = function (opt) {
    var opt = opt || {}; // required

    this.group_size = typeof opt.group_size !== 'undefined' ? opt.group_size : 2; // computed

    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = Math.floor(opt.in_depth / this.group_size);
    this.layer_type = 'maxout';
    this.switches = global.zeros(this.out_sx * this.out_sy * this.out_depth); // useful for backprop
  };

  MaxoutLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var N = this.out_depth;
      var V2 = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0); // optimization branch. If we're operating on 1D arrays we dont have
      // to worry about keeping track of x,y,d coordinates inside
      // input volumes. In convnets we do :(

      if (this.out_sx === 1 && this.out_sy === 1) {
        for (var i = 0; i < N; i++) {
          var ix = i * this.group_size; // base index offset

          var a = V.w[ix];
          var ai = 0;

          for (var j = 1; j < this.group_size; j++) {
            var a2 = V.w[ix + j];

            if (a2 > a) {
              a = a2;
              ai = j;
            }
          }

          V2.w[i] = a;
          this.switches[i] = ix + ai;
        }
      } else {
        var n = 0; // counter for switches

        for (var x = 0; x < V.sx; x++) {
          for (var y = 0; y < V.sy; y++) {
            for (var i = 0; i < N; i++) {
              var ix = i * this.group_size;
              var a = V.get(x, y, ix);
              var ai = 0;

              for (var j = 1; j < this.group_size; j++) {
                var a2 = V.get(x, y, ix + j);

                if (a2 > a) {
                  a = a2;
                  ai = j;
                }
              }

              V2.set(x, y, i, a);
              this.switches[n] = ix + ai;
              n++;
            }
          }
        }
      }

      this.out_act = V2;
      return this.out_act;
    },
    backward: function () {
      var V = this.in_act; // we need to set dw of this

      var V2 = this.out_act;
      var N = this.out_depth;
      V.dw = global.zeros(V.w.length); // zero out gradient wrt data
      // pass the gradient through the appropriate switch

      if (this.out_sx === 1 && this.out_sy === 1) {
        for (var i = 0; i < N; i++) {
          var chain_grad = V2.dw[i];
          V.dw[this.switches[i]] = chain_grad;
        }
      } else {
        // bleh okay, lets do this the hard way
        var n = 0; // counter for switches

        for (var x = 0; x < V2.sx; x++) {
          for (var y = 0; y < V2.sy; y++) {
            for (var i = 0; i < N; i++) {
              var chain_grad = V2.get_grad(x, y, i);
              V.set_grad(x, y, this.switches[n], chain_grad);
              n++;
            }
          }
        }
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.group_size = this.group_size;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.group_size = json.group_size;
      this.switches = global.zeros(this.group_size);
    }
  }; // a helper function, since tanh is not yet part of ECMAScript. Will be in v6.

  function tanh(x) {
    var y = Math.exp(2 * x);
    return (y - 1) / (y + 1);
  } // Implements Tanh nnonlinearity elementwise
  // x -> tanh(x) 
  // so the output is between -1 and 1.


  var TanhLayer = function (opt) {
    var opt = opt || {}; // computed

    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'tanh';
  };

  TanhLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var V2 = V.cloneAndZero();
      var N = V.w.length;

      for (var i = 0; i < N; i++) {
        V2.w[i] = tanh(V.w[i]);
      }

      this.out_act = V2;
      return this.out_act;
    },
    backward: function () {
      var V = this.in_act; // we need to set dw of this

      var V2 = this.out_act;
      var N = V.w.length;
      V.dw = global.zeros(N); // zero out gradient wrt data

      for (var i = 0; i < N; i++) {
        var v2wi = V2.w[i];
        V.dw[i] = (1.0 - v2wi * v2wi) * V2.dw[i];
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
    }
  };
  global.TanhLayer = TanhLayer;
  global.MaxoutLayer = MaxoutLayer;
  global.ReluLayer = ReluLayer;
  global.SigmoidLayer = SigmoidLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // An inefficient dropout layer
  // Note this is not most efficient implementation since the layer before
  // computed all these activations and now we're just going to drop them :(
  // same goes for backward pass. Also, if we wanted to be efficient at test time
  // we could equivalently be clever and upscale during train and copy pointers during test
  // todo: make more efficient.

  var DropoutLayer = function (opt) {
    var opt = opt || {}; // computed

    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'dropout';
    this.drop_prob = typeof opt.drop_prob !== 'undefined' ? opt.drop_prob : 0.5;
    this.dropped = global.zeros(this.out_sx * this.out_sy * this.out_depth);
  };

  DropoutLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;

      if (typeof is_training === 'undefined') {
        is_training = false;
      } // default is prediction mode


      var V2 = V.clone();
      var N = V.w.length;

      if (is_training) {
        // do dropout
        for (var i = 0; i < N; i++) {
          if (Math.random() < this.drop_prob) {
            V2.w[i] = 0;
            this.dropped[i] = true;
          } // drop!
          else {
            this.dropped[i] = false;
          }
        }
      } else {
        // scale the activations during prediction
        for (var i = 0; i < N; i++) {
          V2.w[i] *= this.drop_prob;
        }
      }

      this.out_act = V2;
      return this.out_act; // dummy identity function for now
    },
    backward: function () {
      var V = this.in_act; // we need to set dw of this

      var chain_grad = this.out_act;
      var N = V.w.length;
      V.dw = global.zeros(N); // zero out gradient wrt data

      for (var i = 0; i < N; i++) {
        if (!this.dropped[i]) {
          V.dw[i] = chain_grad.dw[i]; // copy over the gradient
        }
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.drop_prob = this.drop_prob;
      return json;
    },
    fromJSON: function (json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.drop_prob = json.drop_prob;
    }
  };
  global.DropoutLayer = DropoutLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // a bit experimental layer for now. I think it works but I'm not 100%
  // the gradient check is a bit funky. I'll look into this a bit later.
  // Local Response Normalization in window, along depths of volumes

  var LocalResponseNormalizationLayer = function (opt) {
    var opt = opt || {}; // required

    this.k = opt.k;
    this.n = opt.n;
    this.alpha = opt.alpha;
    this.beta = opt.beta; // computed

    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'lrn'; // checks

    if (this.n % 2 === 0) {
      console.log('WARNING n should be odd for LRN layer');
    }
  };

  LocalResponseNormalizationLayer.prototype = {
    forward: function (V, is_training) {
      this.in_act = V;
      var A = V.cloneAndZero();
      this.S_cache_ = V.cloneAndZero();
      var n2 = Math.floor(this.n / 2);

      for (var x = 0; x < V.sx; x++) {
        for (var y = 0; y < V.sy; y++) {
          for (var i = 0; i < V.depth; i++) {
            var ai = V.get(x, y, i); // normalize in a window of size n

            var den = 0.0;

            for (var j = Math.max(0, i - n2); j <= Math.min(i + n2, V.depth - 1); j++) {
              var aa = V.get(x, y, j);
              den += aa * aa;
            }

            den *= this.alpha / this.n;
            den += this.k;
            this.S_cache_.set(x, y, i, den); // will be useful for backprop

            den = Math.pow(den, this.beta);
            A.set(x, y, i, ai / den);
          }
        }
      }

      this.out_act = A;
      return this.out_act; // dummy identity function for now
    },
    backward: function () {
      // evaluate gradient wrt data
      var V = this.in_act; // we need to set dw of this

      V.dw = global.zeros(V.w.length); // zero out gradient wrt data

      var A = this.out_act; // computed in forward pass 

      var n2 = Math.floor(this.n / 2);

      for (var x = 0; x < V.sx; x++) {
        for (var y = 0; y < V.sy; y++) {
          for (var i = 0; i < V.depth; i++) {
            var chain_grad = this.out_act.get_grad(x, y, i);
            var S = this.S_cache_.get(x, y, i);
            var SB = Math.pow(S, this.beta);
            var SB2 = SB * SB; // normalize in a window of size n

            for (var j = Math.max(0, i - n2); j <= Math.min(i + n2, V.depth - 1); j++) {
              var aj = V.get(x, y, j);
              var g = -aj * this.beta * Math.pow(S, this.beta - 1) * this.alpha / this.n * 2 * aj;
              if (j === i) g += SB;
              g /= SB2;
              g *= chain_grad;
              V.add_grad(x, y, j, g);
            }
          }
        }
      }
    },
    getParamsAndGrads: function () {
      return [];
    },
    toJSON: function () {
      var json = {};
      json.k = this.k;
      json.n = this.n;
      json.alpha = this.alpha; // normalize by size

      json.beta = this.beta;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.out_depth = this.out_depth;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function (json) {
      this.k = json.k;
      this.n = json.n;
      this.alpha = json.alpha; // normalize by size

      this.beta = json.beta;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.out_depth = json.out_depth;
      this.layer_type = json.layer_type;
    }
  };
  global.LocalResponseNormalizationLayer = LocalResponseNormalizationLayer;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience
  // Net manages a set of layers
  // For now constraints: Simple linear order of layers, first layer input last layer a cost layer

  var Net = function (options) {
    this.layers = [];
  };

  Net.prototype = {
    // takes a list of layer definitions and creates the network layer objects
    makeLayers: function (defs) {
      // few checks for now
      if (defs.length < 2) {
        console.log('ERROR! For now at least have input and softmax layers.');
      }

      if (defs[0].type !== 'input') {
        console.log('ERROR! For now first layer should be input.');
      } // desugar syntactic for adding activations and dropouts


      var desugar = function () {
        var new_defs = [];

        for (var i = 0; i < defs.length; i++) {
          var def = defs[i];

          if (def.type === 'softmax' || def.type === 'svm') {
            // add an fc layer here, there is no reason the user should
            // have to worry about this and we almost always want to
            new_defs.push({
              type: 'fc',
              num_neurons: def.num_classes
            });
          }

          if (def.type === 'regression') {
            // add an fc layer here, there is no reason the user should
            // have to worry about this and we almost always want to
            new_defs.push({
              type: 'fc',
              num_neurons: def.num_neurons
            });
          }

          if ((def.type === 'fc' || def.type === 'conv') && typeof def.bias_pref === 'undefined') {
            def.bias_pref = 0.0;

            if (typeof def.activation !== 'undefined' && def.activation === 'relu') {
              def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
              // otherwise it's technically possible that a relu unit will never turn on (by chance)
              // and will never get any gradient and never contribute any computation. Dead relu.
            }
          }

          if (typeof def.tensor !== 'undefined') {
            // apply quadratic transform so that the upcoming multiply will include
            // quadratic terms, equivalent to doing a tensor product
            if (def.tensor) {
              new_defs.push({
                type: 'quadtransform'
              });
            }
          }

          new_defs.push(def);

          if (typeof def.activation !== 'undefined') {
            if (def.activation === 'relu') {
              new_defs.push({
                type: 'relu'
              });
            } else if (def.activation === 'sigmoid') {
              new_defs.push({
                type: 'sigmoid'
              });
            } else if (def.activation === 'tanh') {
              new_defs.push({
                type: 'tanh'
              });
            } else if (def.activation === 'maxout') {
              // create maxout activation, and pass along group size, if provided
              var gs = def.group_size !== 'undefined' ? def.group_size : 2;
              new_defs.push({
                type: 'maxout',
                group_size: gs
              });
            } else {
              console.log('ERROR unsupported activation ' + def.activation);
            }
          }

          if (typeof def.drop_prob !== 'undefined' && def.type !== 'dropout') {
            new_defs.push({
              type: 'dropout',
              drop_prob: def.drop_prob
            });
          }
        }

        return new_defs;
      };

      defs = desugar(defs); // create the layers

      this.layers = [];

      for (var i = 0; i < defs.length; i++) {
        var def = defs[i];

        if (i > 0) {
          var prev = this.layers[i - 1];
          def.in_sx = prev.out_sx;
          def.in_sy = prev.out_sy;
          def.in_depth = prev.out_depth;
        }

        switch (def.type) {
          case 'fc':
            this.layers.push(new global.FullyConnLayer(def));
            break;

          case 'lrn':
            this.layers.push(new global.LocalResponseNormalizationLayer(def));
            break;

          case 'dropout':
            this.layers.push(new global.DropoutLayer(def));
            break;

          case 'input':
            this.layers.push(new global.InputLayer(def));
            break;

          case 'softmax':
            this.layers.push(new global.SoftmaxLayer(def));
            break;

          case 'regression':
            this.layers.push(new global.RegressionLayer(def));
            break;

          case 'conv':
            this.layers.push(new global.ConvLayer(def));
            break;

          case 'pool':
            this.layers.push(new global.PoolLayer(def));
            break;

          case 'relu':
            this.layers.push(new global.ReluLayer(def));
            break;

          case 'sigmoid':
            this.layers.push(new global.SigmoidLayer(def));
            break;

          case 'tanh':
            this.layers.push(new global.TanhLayer(def));
            break;

          case 'maxout':
            this.layers.push(new global.MaxoutLayer(def));
            break;

          case 'quadtransform':
            this.layers.push(new global.QuadTransformLayer(def));
            break;

          case 'svm':
            this.layers.push(new global.SVMLayer(def));
            break;

          default:
            console.log('ERROR: UNRECOGNIZED LAYER TYPE!');
        }
      }
    },
    // forward prop the network. A trainer will pass in is_training = true
    forward: function (V, is_training) {
      if (typeof is_training === 'undefined') is_training = false;
      var act = this.layers[0].forward(V, is_training);

      for (var i = 1; i < this.layers.length; i++) {
        act = this.layers[i].forward(act, is_training);
      }

      return act;
    },
    getCostLoss: function (V, y) {
      this.forward(V, false);
      var N = this.layers.length;
      var loss = this.layers[N - 1].backward(y);
      return loss;
    },
    // backprop: compute gradients wrt all parameters
    backward: function (y) {
      var N = this.layers.length;
      var loss = this.layers[N - 1].backward(y); // last layer assumed softmax

      for (var i = N - 2; i >= 0; i--) {
        // first layer assumed input
        this.layers[i].backward();
      }

      return loss;
    },
    getParamsAndGrads: function () {
      // accumulate parameters and gradients for the entire network
      var response = [];

      for (var i = 0; i < this.layers.length; i++) {
        var layer_reponse = this.layers[i].getParamsAndGrads();

        for (var j = 0; j < layer_reponse.length; j++) {
          response.push(layer_reponse[j]);
        }
      }

      return response;
    },
    getPrediction: function () {
      var S = this.layers[this.layers.length - 1]; // softmax layer

      var p = S.out_act.w;
      var maxv = p[0];
      var maxi = 0;

      for (var i = 1; i < p.length; i++) {
        if (p[i] > maxv) {
          maxv = p[i];
          maxi = i;
        }
      }

      return maxi;
    },
    toJSON: function () {
      var json = {};
      json.layers = [];

      for (var i = 0; i < this.layers.length; i++) {
        json.layers.push(this.layers[i].toJSON());
      }

      return json;
    },
    fromJSON: function (json) {
      this.layers = [];

      for (var i = 0; i < json.layers.length; i++) {
        var Lj = json.layers[i];
        var t = Lj.layer_type;
        var L;

        if (t === 'input') {
          L = new global.InputLayer();
        }

        if (t === 'relu') {
          L = new global.ReluLayer();
        }

        if (t === 'sigmoid') {
          L = new global.SigmoidLayer();
        }

        if (t === 'tanh') {
          L = new global.TanhLayer();
        }

        if (t === 'dropout') {
          L = new global.DropoutLayer();
        }

        if (t === 'conv') {
          L = new global.ConvLayer();
        }

        if (t === 'pool') {
          L = new global.PoolLayer();
        }

        if (t === 'lrn') {
          L = new global.LocalResponseNormalizationLayer();
        }

        if (t === 'softmax') {
          L = new global.SoftmaxLayer();
        }

        if (t === 'regression') {
          L = new global.RegressionLayer();
        }

        if (t === 'fc') {
          L = new global.FullyConnLayer();
        }

        if (t === 'maxout') {
          L = new global.MaxoutLayer();
        }

        if (t === 'quadtransform') {
          L = new global.QuadTransformLayer();
        }

        if (t === 'svm') {
          L = new global.SVMLayer();
        }

        L.fromJSON(Lj);
        this.layers.push(L);
      }
    }
  };
  global.Net = Net;
})(convnetjs);

(function (global) {
  "use strict";

  var Vol = global.Vol; // convenience

  var Trainer = function (net, options) {
    this.net = net;
    var options = options || {};
    this.learning_rate = typeof options.learning_rate !== 'undefined' ? options.learning_rate : 0.01;
    this.l1_decay = typeof options.l1_decay !== 'undefined' ? options.l1_decay : 0.0;
    this.l2_decay = typeof options.l2_decay !== 'undefined' ? options.l2_decay : 0.0;
    this.batch_size = typeof options.batch_size !== 'undefined' ? options.batch_size : 1;
    this.method = typeof options.method !== 'undefined' ? options.method : 'sgd'; // sgd/adagrad/adadelta/windowgrad

    this.momentum = typeof options.momentum !== 'undefined' ? options.momentum : 0.9;
    this.ro = typeof options.ro !== 'undefined' ? options.ro : 0.95; // used in adadelta

    this.eps = typeof options.eps !== 'undefined' ? options.eps : 1e-6; // used in adadelta

    this.k = 0; // iteration counter

    this.gsum = []; // last iteration gradients (used for momentum calculations)

    this.xsum = []; // used in adadelta
  };

  Trainer.prototype = {
    train: function (x, y) {
      var start = new Date().getTime();
      this.net.forward(x, true); // also set the flag that lets the net know we're just training

      var end = new Date().getTime();
      var fwd_time = end - start;
      var start = new Date().getTime();
      var cost_loss = this.net.backward(y);
      var l2_decay_loss = 0.0;
      var l1_decay_loss = 0.0;
      var end = new Date().getTime();
      var bwd_time = end - start;
      this.k++;

      if (this.k % this.batch_size === 0) {
        var pglist = this.net.getParamsAndGrads(); // initialize lists for accumulators. Will only be done once on first iteration

        if (this.gsum.length === 0 && (this.method !== 'sgd' || this.momentum > 0.0)) {
          // only vanilla sgd doesnt need either lists
          // momentum needs gsum
          // adagrad needs gsum
          // adadelta needs gsum and xsum
          for (var i = 0; i < pglist.length; i++) {
            this.gsum.push(global.zeros(pglist[i].params.length));

            if (this.method === 'adadelta') {
              this.xsum.push(global.zeros(pglist[i].params.length));
            } else {
              this.xsum.push([]); // conserve memory
            }
          }
        } // perform an update for all sets of weights


        for (var i = 0; i < pglist.length; i++) {
          var pg = pglist[i]; // param, gradient, other options in future (custom learning rate etc)

          var p = pg.params;
          var g = pg.grads; // learning rate for some parameters.

          var l2_decay_mul = typeof pg.l2_decay_mul !== 'undefined' ? pg.l2_decay_mul : 1.0;
          var l1_decay_mul = typeof pg.l1_decay_mul !== 'undefined' ? pg.l1_decay_mul : 1.0;
          var l2_decay = this.l2_decay * l2_decay_mul;
          var l1_decay = this.l1_decay * l1_decay_mul;
          var plen = p.length;

          for (var j = 0; j < plen; j++) {
            l2_decay_loss += l2_decay * p[j] * p[j] / 2; // accumulate weight decay loss

            l1_decay_loss += l1_decay * Math.abs(p[j]);
            var l1grad = l1_decay * (p[j] > 0 ? 1 : -1);
            var l2grad = l2_decay * p[j];
            var gij = (l2grad + l1grad + g[j]) / this.batch_size; // raw batch gradient

            var gsumi = this.gsum[i];
            var xsumi = this.xsum[i];

            if (this.method === 'adagrad') {
              // adagrad update
              gsumi[j] = gsumi[j] + gij * gij;
              var dx = -this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij;
              p[j] += dx;
            } else if (this.method === 'windowgrad') {
              // this is adagrad but with a moving window weighted average
              // so the gradient is not accumulated over the entire history of the run. 
              // it's also referred to as Idea #1 in Zeiler paper on Adadelta. Seems reasonable to me!
              gsumi[j] = this.ro * gsumi[j] + (1 - this.ro) * gij * gij;
              var dx = -this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij; // eps added for better conditioning

              p[j] += dx;
            } else if (this.method === 'adadelta') {
              // assume adadelta if not sgd or adagrad
              gsumi[j] = this.ro * gsumi[j] + (1 - this.ro) * gij * gij;
              var dx = -Math.sqrt((xsumi[j] + this.eps) / (gsumi[j] + this.eps)) * gij;
              xsumi[j] = this.ro * xsumi[j] + (1 - this.ro) * dx * dx; // yes, xsum lags behind gsum by 1.

              p[j] += dx;
            } else {
              // assume SGD
              if (this.momentum > 0.0) {
                // momentum update
                var dx = this.momentum * gsumi[j] - this.learning_rate * gij; // step

                gsumi[j] = dx; // back this up for next iteration of momentum

                p[j] += dx; // apply corrected gradient
              } else {
                // vanilla sgd
                p[j] += -this.learning_rate * gij;
              }
            }

            g[j] = 0.0; // zero out gradient so that we can begin accumulating anew
          }
        }
      } // appending softmax_loss for backwards compatibility, but from now on we will always use cost_loss
      // in future, TODO: have to completely redo the way loss is done around the network as currently 
      // loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
      // and it should all be computed correctly and automatically. 


      return {
        fwd_time: fwd_time,
        bwd_time: bwd_time,
        l2_decay_loss: l2_decay_loss,
        l1_decay_loss: l1_decay_loss,
        cost_loss: cost_loss,
        softmax_loss: cost_loss,
        loss: cost_loss + l1_decay_loss + l2_decay_loss
      };
    }
  };
  global.Trainer = Trainer;
  global.SGDTrainer = Trainer; // backwards compatibility
})(convnetjs);

(function (global) {
  "use strict"; // used utilities, make explicit local references

  var randf = global.randf;
  var randi = global.randi;
  var Net = global.Net;
  var Trainer = global.Trainer;
  var maxmin = global.maxmin;
  var randperm = global.randperm;
  var weightedSample = global.weightedSample;
  var getopt = global.getopt;
  var arrUnique = global.arrUnique;
  /*
  A MagicNet takes data: a list of convnetjs.Vol(), and labels
  which for now are assumed to be class indeces 0..K. MagicNet then:
  - creates data folds for cross-validation
  - samples candidate networks
  - evaluates candidate networks on all data folds
  - produces predictions by model-averaging the best networks
  */

  var MagicNet = function (data, labels, opt) {
    var opt = opt || {};

    if (typeof data === 'undefined') {
      data = [];
    }

    if (typeof labels === 'undefined') {
      labels = [];
    } // required inputs


    this.data = data; // store these pointers to data

    this.labels = labels; // optional inputs

    this.train_ratio = getopt(opt, 'train_ratio', 0.7);
    this.num_folds = getopt(opt, 'num_folds', 10);
    this.num_candidates = getopt(opt, 'num_candidates', 50); // we evaluate several in parallel
    // how many epochs of data to train every network? for every fold?
    // higher values mean higher accuracy in final results, but more expensive

    this.num_epochs = getopt(opt, 'num_epochs', 50); // number of best models to average during prediction. Usually higher = better

    this.ensemble_size = getopt(opt, 'ensemble_size', 10); // candidate parameters

    this.batch_size_min = getopt(opt, 'batch_size_min', 10);
    this.batch_size_max = getopt(opt, 'batch_size_max', 300);
    this.l2_decay_min = getopt(opt, 'l2_decay_min', -4);
    this.l2_decay_max = getopt(opt, 'l2_decay_max', 2);
    this.learning_rate_min = getopt(opt, 'learning_rate_min', -4);
    this.learning_rate_max = getopt(opt, 'learning_rate_max', 0);
    this.momentum_min = getopt(opt, 'momentum_min', 0.9);
    this.momentum_max = getopt(opt, 'momentum_max', 0.9);
    this.neurons_min = getopt(opt, 'neurons_min', 5);
    this.neurons_max = getopt(opt, 'neurons_max', 30); // computed

    this.folds = []; // data fold indices, gets filled by sampleFolds()

    this.candidates = []; // candidate networks that are being currently evaluated

    this.evaluated_candidates = []; // history of all candidates that were fully evaluated on all folds

    this.unique_labels = arrUnique(labels);
    this.iter = 0; // iteration counter, goes from 0 -> num_epochs * num_training_data

    this.foldix = 0; // index of active fold
    // callbacks

    this.finish_fold_callback = null;
    this.finish_batch_callback = null; // initializations

    if (this.data.length > 0) {
      this.sampleFolds();
      this.sampleCandidates();
    }
  };

  MagicNet.prototype = {
    // sets this.folds to a sampling of this.num_folds folds
    sampleFolds: function () {
      var N = this.data.length;
      var num_train = Math.floor(this.train_ratio * N);
      this.folds = []; // flush folds, if any

      for (var i = 0; i < this.num_folds; i++) {
        var p = randperm(N);
        this.folds.push({
          train_ix: p.slice(0, num_train),
          test_ix: p.slice(num_train, N)
        });
      }
    },
    // returns a random candidate network
    sampleCandidate: function () {
      var input_depth = this.data[0].w.length;
      var num_classes = this.unique_labels.length; // sample network topology and hyperparameters

      var layer_defs = [];
      layer_defs.push({
        type: 'input',
        out_sx: 1,
        out_sy: 1,
        out_depth: input_depth
      });
      var nl = weightedSample([0, 1, 2, 3], [0.2, 0.3, 0.3, 0.2]); // prefer nets with 1,2 hidden layers

      for (var q = 0; q < nl; q++) {
        var ni = randi(this.neurons_min, this.neurons_max);
        var act = ['tanh', 'maxout', 'relu'][randi(0, 3)];

        if (randf(0, 1) < 0.5) {
          var dp = Math.random();
          layer_defs.push({
            type: 'fc',
            num_neurons: ni,
            activation: act,
            drop_prob: dp
          });
        } else {
          layer_defs.push({
            type: 'fc',
            num_neurons: ni,
            activation: act
          });
        }
      }

      layer_defs.push({
        type: 'softmax',
        num_classes: num_classes
      });
      var net = new Net();
      net.makeLayers(layer_defs); // sample training hyperparameters

      var bs = randi(this.batch_size_min, this.batch_size_max); // batch size

      var l2 = Math.pow(10, randf(this.l2_decay_min, this.l2_decay_max)); // l2 weight decay

      var lr = Math.pow(10, randf(this.learning_rate_min, this.learning_rate_max)); // learning rate

      var mom = randf(this.momentum_min, this.momentum_max); // momentum. Lets just use 0.9, works okay usually ;p

      var tp = randf(0, 1); // trainer type

      var trainer_def;

      if (tp < 0.33) {
        trainer_def = {
          method: 'adadelta',
          batch_size: bs,
          l2_decay: l2
        };
      } else if (tp < 0.66) {
        trainer_def = {
          method: 'adagrad',
          learning_rate: lr,
          batch_size: bs,
          l2_decay: l2
        };
      } else {
        trainer_def = {
          method: 'sgd',
          learning_rate: lr,
          momentum: mom,
          batch_size: bs,
          l2_decay: l2
        };
      }

      var trainer = new Trainer(net, trainer_def);
      var cand = {};
      cand.acc = [];
      cand.accv = 0; // this will maintained as sum(acc) for convenience

      cand.layer_defs = layer_defs;
      cand.trainer_def = trainer_def;
      cand.net = net;
      cand.trainer = trainer;
      return cand;
    },
    // sets this.candidates with this.num_candidates candidate nets
    sampleCandidates: function () {
      this.candidates = []; // flush, if any

      for (var i = 0; i < this.num_candidates; i++) {
        var cand = this.sampleCandidate();
        this.candidates.push(cand);
      }
    },
    step: function () {
      // run an example through current candidate
      this.iter++; // step all candidates on a random data point

      var fold = this.folds[this.foldix]; // active fold

      var dataix = fold.train_ix[randi(0, fold.train_ix.length)];

      for (var k = 0; k < this.candidates.length; k++) {
        var x = this.data[dataix];
        var l = this.labels[dataix];
        this.candidates[k].trainer.train(x, l);
      } // process consequences: sample new folds, or candidates


      var lastiter = this.num_epochs * fold.train_ix.length;

      if (this.iter >= lastiter) {
        // finished evaluation of this fold. Get final validation
        // accuracies, record them, and go on to next fold.
        var val_acc = this.evalValErrors();

        for (var k = 0; k < this.candidates.length; k++) {
          var c = this.candidates[k];
          c.acc.push(val_acc[k]);
          c.accv += val_acc[k];
        }

        this.iter = 0; // reset step number

        this.foldix++; // increment fold

        if (this.finish_fold_callback !== null) {
          this.finish_fold_callback();
        }

        if (this.foldix >= this.folds.length) {
          // we finished all folds as well! Record these candidates
          // and sample new ones to evaluate.
          for (var k = 0; k < this.candidates.length; k++) {
            this.evaluated_candidates.push(this.candidates[k]);
          } // sort evaluated candidates according to accuracy achieved


          this.evaluated_candidates.sort(function (a, b) {
            return a.accv / a.acc.length > b.accv / b.acc.length ? -1 : 1;
          }); // and clip only to the top few ones (lets place limit at 3*ensemble_size)
          // otherwise there are concerns with keeping these all in memory 
          // if MagicNet is being evaluated for a very long time

          if (this.evaluated_candidates.length > 3 * this.ensemble_size) {
            this.evaluated_candidates = this.evaluated_candidates.slice(0, 3 * this.ensemble_size);
          }

          if (this.finish_batch_callback !== null) {
            this.finish_batch_callback();
          }

          this.sampleCandidates(); // begin with new candidates

          this.foldix = 0; // reset this
        } else {
          // we will go on to another fold. reset all candidates nets
          for (var k = 0; k < this.candidates.length; k++) {
            var c = this.candidates[k];
            var net = new Net();
            net.makeLayers(c.layer_defs);
            var trainer = new Trainer(net, c.trainer_def);
            c.net = net;
            c.trainer = trainer;
          }
        }
      }
    },
    evalValErrors: function () {
      // evaluate candidates on validation data and return performance of current networks
      // as simple list
      var vals = [];
      var fold = this.folds[this.foldix]; // active fold

      for (var k = 0; k < this.candidates.length; k++) {
        var net = this.candidates[k].net;
        var v = 0.0;

        for (var q = 0; q < fold.test_ix.length; q++) {
          var x = this.data[fold.test_ix[q]];
          var l = this.labels[fold.test_ix[q]];
          net.forward(x);
          var yhat = net.getPrediction();
          v += yhat === l ? 1.0 : 0.0; // 0 1 loss
        }

        v /= fold.test_ix.length; // normalize

        vals.push(v);
      }

      return vals;
    },
    // returns prediction scores for given test data point, as Vol
    // uses an averaged prediction from the best ensemble_size models
    // x is a Vol.
    predict_soft: function (data) {
      // forward prop the best networks
      // and accumulate probabilities at last layer into a an output Vol
      var nv = Math.min(this.ensemble_size, this.evaluated_candidates.length);

      if (nv === 0) {
        return new convnetjs.Vol(0, 0, 0);
      } // not sure what to do here? we're not ready yet


      var xout, n;

      for (var j = 0; j < nv; j++) {
        var net = this.evaluated_candidates[j].net;
        var x = net.forward(data);

        if (j === 0) {
          xout = x;
          n = x.w.length;
        } else {
          // add it on
          for (var d = 0; d < n; d++) {
            xout.w[d] += x.w[d];
          }
        }
      } // produce average


      for (var d = 0; d < n; d++) {
        xout.w[d] /= n;
      }

      return xout;
    },
    predict: function (data) {
      var xout = this.predict_soft(data);

      if (xout.w.length !== 0) {
        var stats = maxmin(xout.w);
        var predicted_label = stats.maxi;
      } else {
        var predicted_label = -1; // error out
      }

      return predicted_label;
    },
    toJSON: function () {
      // dump the top ensemble_size networks as a list
      var nv = Math.min(this.ensemble_size, this.evaluated_candidates.length);
      var json = {};
      json.nets = [];

      for (var i = 0; i < nv; i++) {
        json.nets.push(this.evaluated_candidates[i].net.toJSON());
      }

      return json;
    },
    fromJSON: function (json) {
      this.ensemble_size = json.nets.length;
      this.evaluated_candidates = [];

      for (var i = 0; i < this.ensemble_size; i++) {
        var net = new Net();
        net.fromJSON(json.nets[i]);
        var dummy_candidate = {};
        dummy_candidate.net = net;
        this.evaluated_candidates.push(dummy_candidate);
      }
    },
    // callback functions
    // called when a fold is finished, while evaluating a batch
    onFinishFold: function (f) {
      this.finish_fold_callback = f;
    },
    // called when a batch of candidates has finished evaluating
    onFinishBatch: function (f) {
      this.finish_batch_callback = f;
    }
  };
  global.MagicNet = MagicNet;
})(convnetjs);

this.convnetjs = convnetjs;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"simplify":{"1.2.2":{"simplify.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/external/simplify/1.2.2/simplify.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  /*
   (c) 2013, Vladimir Agafonkin
   Simplify.js, a high-performance JS polyline simplification library
   mourner.github.io/simplify-js
  */
  this.simplify = function () {
    'use strict'; // to suit your point format, run search/replace for '.x' and '.y';
    // for 3D version, see 3d branch (configurability would draw significant performance overhead)
    // square distance between 2 points

    function getSqDist(p1, p2) {
      var dx = p1.x - p2.x,
          dy = p1.y - p2.y;
      return dx * dx + dy * dy;
    } // square distance from a point to a segment


    function getSqSegDist(p, p1, p2) {
      var x = p1.x,
          y = p1.y,
          dx = p2.x - x,
          dy = p2.y - y;

      if (dx !== 0 || dy !== 0) {
        var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
          x = p2.x;
          y = p2.y;
        } else if (t > 0) {
          x += dx * t;
          y += dy * t;
        }
      }

      dx = p.x - x;
      dy = p.y - y;
      return dx * dx + dy * dy;
    } // rest of the code doesn't care about point format
    // basic distance-based simplification


    function simplifyRadialDist(points, sqTolerance) {
      var prevPoint = points[0],
          newPoints = [prevPoint],
          point;

      for (var i = 1, len = points.length; i < len; i++) {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance) {
          newPoints.push(point);
          prevPoint = point;
        }
      }

      if (prevPoint !== point) newPoints.push(point);
      return newPoints;
    }

    function simplifyDPStep(points, first, last, sqTolerance, simplified) {
      var maxSqDist = sqTolerance,
          index;

      for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
      }
    } // simplification using Ramer-Douglas-Peucker algorithm


    function simplifyDouglasPeucker(points, sqTolerance) {
      var last = points.length - 1;
      var simplified = [points[0]];
      simplifyDPStep(points, 0, last, sqTolerance, simplified);
      simplified.push(points[last]);
      return simplified;
    } // both algorithms combined for awesome performance


    function simplify(points, tolerance, highestQuality) {
      if (points.length <= 2) return points;
      var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
      points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
      points = simplifyDouglasPeucker(points, sqTolerance);
      return points;
    } // export as AMD module / Node module / browser or worker variable


    if (typeof define === 'function' && define.amd) define(function () {
      return simplify;
    });else if (typeof module !== 'undefined') module.exports = simplify;else return simplify;
  }();
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"voronoi":{"0.98":{"rhill-voronoi-core.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/external/voronoi/0.98/rhill-voronoi-core.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  /*!
  Copyright (C) 2010-2013 Raymond Hill: https://github.com/gorhill/Javascript-Voronoi
  MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
  */

  /*
  Author: Raymond Hill (rhill@raymondhill.net)
  Contributor: Jesse Morgan (morgajel@gmail.com)
  File: rhill-voronoi-core.js
  Version: 0.98
  Date: January 21, 2013
  Description: This is my personal Javascript implementation of
  Steven Fortune's algorithm to compute Voronoi diagrams.
  
  License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
  Credits: See https://github.com/gorhill/Javascript-Voronoi/CREDITS.md
  History: See https://github.com/gorhill/Javascript-Voronoi/CHANGELOG.md
  
  ## Usage:
  
    var sites = [{x:300,y:300}, {x:100,y:100}, {x:200,y:500}, {x:250,y:450}, {x:600,y:150}];
    // xl, xr means x left, x right
    // yt, yb means y top, y bottom
    var bbox = {xl:0, xr:800, yt:0, yb:600};
    var voronoi = new Voronoi();
    // pass an object which exhibits xl, xr, yt, yb properties. The bounding
    // box will be used to connect unbound edges, and to close open cells
    result = voronoi.compute(sites, bbox);
    // render, further analyze, etc.
  
  Return value:
    An object with the following properties:
  
    result.vertices = an array of unordered, unique Voronoi.Vertex objects making
      up the Voronoi diagram.
    result.edges = an array of unordered, unique Voronoi.Edge objects making up
      the Voronoi diagram.
    result.cells = an array of Voronoi.Cell object making up the Voronoi diagram.
      A Cell object might have an empty array of halfedges, meaning no Voronoi
      cell could be computed for a particular cell.
    result.execTime = the time it took to compute the Voronoi diagram, in
      milliseconds.
  
  Voronoi.Vertex object:
    x: The x position of the vertex.
    y: The y position of the vertex.
  
  Voronoi.Edge object:
    lSite: the Voronoi site object at the left of this Voronoi.Edge object.
    rSite: the Voronoi site object at the right of this Voronoi.Edge object (can
      be null).
    va: an object with an 'x' and a 'y' property defining the start point
      (relative to the Voronoi site on the left) of this Voronoi.Edge object.
    vb: an object with an 'x' and a 'y' property defining the end point
      (relative to Voronoi site on the left) of this Voronoi.Edge object.
  
    For edges which are used to close open cells (using the supplied bounding
    box), the rSite property will be null.
  
  Voronoi.Cell object:
    site: the Voronoi site object associated with the Voronoi cell.
    halfedges: an array of Voronoi.Halfedge objects, ordered counterclockwise,
      defining the polygon for this Voronoi cell.
  
  Voronoi.Halfedge object:
    site: the Voronoi site object owning this Voronoi.Halfedge object.
    edge: a reference to the unique Voronoi.Edge object underlying this
      Voronoi.Halfedge object.
    getStartpoint(): a method returning an object with an 'x' and a 'y' property
      for the start point of this halfedge. Keep in mind halfedges are always
      countercockwise.
    getEndpoint(): a method returning an object with an 'x' and a 'y' property
      for the end point of this halfedge. Keep in mind halfedges are always
      countercockwise.
  
  TODO: Identify opportunities for performance improvement.
  
  TODO: Let the user close the Voronoi cells, do not do it automatically. Not only let
        him close the cells, but also allow him to close more than once using a different
        bounding box for the same Voronoi diagram.
  */

  /*global Math */
  // ---------------------------------------------------------------------------
  function Voronoi() {
    this.vertices = null;
    this.edges = null;
    this.cells = null;
    this.toRecycle = null;
    this.beachsectionJunkyard = [];
    this.circleEventJunkyard = [];
    this.vertexJunkyard = [];
    this.edgeJunkyard = [];
    this.cellJunkyard = [];
  } // ---------------------------------------------------------------------------


  Voronoi.prototype.reset = function () {
    if (!this.beachline) {
      this.beachline = new this.RBTree();
    } // Move leftover beachsections to the beachsection junkyard.


    if (this.beachline.root) {
      var beachsection = this.beachline.getFirst(this.beachline.root);

      while (beachsection) {
        this.beachsectionJunkyard.push(beachsection); // mark for reuse

        beachsection = beachsection.rbNext;
      }
    }

    this.beachline.root = null;

    if (!this.circleEvents) {
      this.circleEvents = new this.RBTree();
    }

    this.circleEvents.root = this.firstCircleEvent = null;
    this.vertices = [];
    this.edges = [];
    this.cells = [];
  };

  Voronoi.prototype.sqrt = Math.sqrt;
  Voronoi.prototype.abs = Math.abs;
  Voronoi.prototype.ε = Voronoi.ε = 1e-9;
  Voronoi.prototype.invε = Voronoi.invε = 1.0 / Voronoi.ε;

  Voronoi.prototype.equalWithEpsilon = function (a, b) {
    return this.abs(a - b) < 1e-9;
  };

  Voronoi.prototype.greaterThanWithEpsilon = function (a, b) {
    return a - b > 1e-9;
  };

  Voronoi.prototype.greaterThanOrEqualWithEpsilon = function (a, b) {
    return b - a < 1e-9;
  };

  Voronoi.prototype.lessThanWithEpsilon = function (a, b) {
    return b - a > 1e-9;
  };

  Voronoi.prototype.lessThanOrEqualWithEpsilon = function (a, b) {
    return a - b < 1e-9;
  }; // ---------------------------------------------------------------------------
  // Red-Black tree code (based on C version of "rbtree" by Franck Bui-Huu
  // https://github.com/fbuihuu/libtree/blob/master/rb.c


  Voronoi.prototype.RBTree = function () {
    this.root = null;
  };

  Voronoi.prototype.RBTree.prototype.rbInsertSuccessor = function (node, successor) {
    var parent;

    if (node) {
      // >>> rhill 2011-05-27: Performance: cache previous/next nodes
      successor.rbPrevious = node;
      successor.rbNext = node.rbNext;

      if (node.rbNext) {
        node.rbNext.rbPrevious = successor;
      }

      node.rbNext = successor; // <<<

      if (node.rbRight) {
        // in-place expansion of node.rbRight.getFirst();
        node = node.rbRight;

        while (node.rbLeft) {
          node = node.rbLeft;
        }

        node.rbLeft = successor;
      } else {
        node.rbRight = successor;
      }

      parent = node;
    } // rhill 2011-06-07: if node is null, successor must be inserted
    // to the left-most part of the tree
    else if (this.root) {
      node = this.getFirst(this.root); // >>> Performance: cache previous/next nodes

      successor.rbPrevious = null;
      successor.rbNext = node;
      node.rbPrevious = successor; // <<<

      node.rbLeft = successor;
      parent = node;
    } else {
      // >>> Performance: cache previous/next nodes
      successor.rbPrevious = successor.rbNext = null; // <<<

      this.root = successor;
      parent = null;
    }

    successor.rbLeft = successor.rbRight = null;
    successor.rbParent = parent;
    successor.rbRed = true; // Fixup the modified tree by recoloring nodes and performing
    // rotations (2 at most) hence the red-black tree properties are
    // preserved.

    var grandpa, uncle;
    node = successor;

    while (parent && parent.rbRed) {
      grandpa = parent.rbParent;

      if (parent === grandpa.rbLeft) {
        uncle = grandpa.rbRight;

        if (uncle && uncle.rbRed) {
          parent.rbRed = uncle.rbRed = false;
          grandpa.rbRed = true;
          node = grandpa;
        } else {
          if (node === parent.rbRight) {
            this.rbRotateLeft(parent);
            node = parent;
            parent = node.rbParent;
          }

          parent.rbRed = false;
          grandpa.rbRed = true;
          this.rbRotateRight(grandpa);
        }
      } else {
        uncle = grandpa.rbLeft;

        if (uncle && uncle.rbRed) {
          parent.rbRed = uncle.rbRed = false;
          grandpa.rbRed = true;
          node = grandpa;
        } else {
          if (node === parent.rbLeft) {
            this.rbRotateRight(parent);
            node = parent;
            parent = node.rbParent;
          }

          parent.rbRed = false;
          grandpa.rbRed = true;
          this.rbRotateLeft(grandpa);
        }
      }

      parent = node.rbParent;
    }

    this.root.rbRed = false;
  };

  Voronoi.prototype.RBTree.prototype.rbRemoveNode = function (node) {
    // >>> rhill 2011-05-27: Performance: cache previous/next nodes
    if (node.rbNext) {
      node.rbNext.rbPrevious = node.rbPrevious;
    }

    if (node.rbPrevious) {
      node.rbPrevious.rbNext = node.rbNext;
    }

    node.rbNext = node.rbPrevious = null; // <<<

    var parent = node.rbParent,
        left = node.rbLeft,
        right = node.rbRight,
        next;

    if (!left) {
      next = right;
    } else if (!right) {
      next = left;
    } else {
      next = this.getFirst(right);
    }

    if (parent) {
      if (parent.rbLeft === node) {
        parent.rbLeft = next;
      } else {
        parent.rbRight = next;
      }
    } else {
      this.root = next;
    } // enforce red-black rules


    var isRed;

    if (left && right) {
      isRed = next.rbRed;
      next.rbRed = node.rbRed;
      next.rbLeft = left;
      left.rbParent = next;

      if (next !== right) {
        parent = next.rbParent;
        next.rbParent = node.rbParent;
        node = next.rbRight;
        parent.rbLeft = node;
        next.rbRight = right;
        right.rbParent = next;
      } else {
        next.rbParent = parent;
        parent = next;
        node = next.rbRight;
      }
    } else {
      isRed = node.rbRed;
      node = next;
    } // 'node' is now the sole successor's child and 'parent' its
    // new parent (since the successor can have been moved)


    if (node) {
      node.rbParent = parent;
    } // the 'easy' cases


    if (isRed) {
      return;
    }

    if (node && node.rbRed) {
      node.rbRed = false;
      return;
    } // the other cases


    var sibling;

    do {
      if (node === this.root) {
        break;
      }

      if (node === parent.rbLeft) {
        sibling = parent.rbRight;

        if (sibling.rbRed) {
          sibling.rbRed = false;
          parent.rbRed = true;
          this.rbRotateLeft(parent);
          sibling = parent.rbRight;
        }

        if (sibling.rbLeft && sibling.rbLeft.rbRed || sibling.rbRight && sibling.rbRight.rbRed) {
          if (!sibling.rbRight || !sibling.rbRight.rbRed) {
            sibling.rbLeft.rbRed = false;
            sibling.rbRed = true;
            this.rbRotateRight(sibling);
            sibling = parent.rbRight;
          }

          sibling.rbRed = parent.rbRed;
          parent.rbRed = sibling.rbRight.rbRed = false;
          this.rbRotateLeft(parent);
          node = this.root;
          break;
        }
      } else {
        sibling = parent.rbLeft;

        if (sibling.rbRed) {
          sibling.rbRed = false;
          parent.rbRed = true;
          this.rbRotateRight(parent);
          sibling = parent.rbLeft;
        }

        if (sibling.rbLeft && sibling.rbLeft.rbRed || sibling.rbRight && sibling.rbRight.rbRed) {
          if (!sibling.rbLeft || !sibling.rbLeft.rbRed) {
            sibling.rbRight.rbRed = false;
            sibling.rbRed = true;
            this.rbRotateLeft(sibling);
            sibling = parent.rbLeft;
          }

          sibling.rbRed = parent.rbRed;
          parent.rbRed = sibling.rbLeft.rbRed = false;
          this.rbRotateRight(parent);
          node = this.root;
          break;
        }
      }

      sibling.rbRed = true;
      node = parent;
      parent = parent.rbParent;
    } while (!node.rbRed);

    if (node) {
      node.rbRed = false;
    }
  };

  Voronoi.prototype.RBTree.prototype.rbRotateLeft = function (node) {
    var p = node,
        q = node.rbRight,
        // can't be null
    parent = p.rbParent;

    if (parent) {
      if (parent.rbLeft === p) {
        parent.rbLeft = q;
      } else {
        parent.rbRight = q;
      }
    } else {
      this.root = q;
    }

    q.rbParent = parent;
    p.rbParent = q;
    p.rbRight = q.rbLeft;

    if (p.rbRight) {
      p.rbRight.rbParent = p;
    }

    q.rbLeft = p;
  };

  Voronoi.prototype.RBTree.prototype.rbRotateRight = function (node) {
    var p = node,
        q = node.rbLeft,
        // can't be null
    parent = p.rbParent;

    if (parent) {
      if (parent.rbLeft === p) {
        parent.rbLeft = q;
      } else {
        parent.rbRight = q;
      }
    } else {
      this.root = q;
    }

    q.rbParent = parent;
    p.rbParent = q;
    p.rbLeft = q.rbRight;

    if (p.rbLeft) {
      p.rbLeft.rbParent = p;
    }

    q.rbRight = p;
  };

  Voronoi.prototype.RBTree.prototype.getFirst = function (node) {
    while (node.rbLeft) {
      node = node.rbLeft;
    }

    return node;
  };

  Voronoi.prototype.RBTree.prototype.getLast = function (node) {
    while (node.rbRight) {
      node = node.rbRight;
    }

    return node;
  }; // ---------------------------------------------------------------------------
  // Diagram methods


  Voronoi.prototype.Diagram = function (site) {
    this.site = site;
  }; // ---------------------------------------------------------------------------
  // Cell methods


  Voronoi.prototype.Cell = function (site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
  };

  Voronoi.prototype.Cell.prototype.init = function (site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    return this;
  };

  Voronoi.prototype.createCell = function (site) {
    var cell = this.cellJunkyard.pop();

    if (cell) {
      return cell.init(site);
    }

    return new this.Cell(site);
  };

  Voronoi.prototype.Cell.prototype.prepareHalfedges = function () {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        edge; // get rid of unused halfedges
    // rhill 2011-05-27: Keep it simple, no point here in trying
    // to be fancy: dangling edges are a typically a minority.

    while (iHalfedge--) {
      edge = halfedges[iHalfedge].edge;

      if (!edge.vb || !edge.va) {
        halfedges.splice(iHalfedge, 1);
      }
    } // rhill 2011-05-26: I tried to use a binary search at insertion
    // time to keep the array sorted on-the-fly (in Cell.addHalfedge()).
    // There was no real benefits in doing so, performance on
    // Firefox 3.6 was improved marginally, while performance on
    // Opera 11 was penalized marginally.


    halfedges.sort(function (a, b) {
      return b.angle - a.angle;
    });
    return halfedges.length;
  }; // Return a list of the neighbor Ids


  Voronoi.prototype.Cell.prototype.getNeighborIds = function () {
    var neighbors = [],
        iHalfedge = this.halfedges.length,
        edge;

    while (iHalfedge--) {
      edge = this.halfedges[iHalfedge].edge;

      if (edge.lSite !== null && edge.lSite.voronoiId != this.site.voronoiId) {
        neighbors.push(edge.lSite.voronoiId);
      } else if (edge.rSite !== null && edge.rSite.voronoiId != this.site.voronoiId) {
        neighbors.push(edge.rSite.voronoiId);
      }
    }

    return neighbors;
  }; // Compute bounding box
  //


  Voronoi.prototype.Cell.prototype.getBbox = function () {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity,
        v,
        vx,
        vy;

    while (iHalfedge--) {
      v = halfedges[iHalfedge].getStartpoint();
      vx = v.x;
      vy = v.y;

      if (vx < xmin) {
        xmin = vx;
      }

      if (vy < ymin) {
        ymin = vy;
      }

      if (vx > xmax) {
        xmax = vx;
      }

      if (vy > ymax) {
        ymax = vy;
      } // we dont need to take into account end point,
      // since each end point matches a start point

    }

    return {
      x: xmin,
      y: ymin,
      width: xmax - xmin,
      height: ymax - ymin
    };
  }; // Return whether a point is inside, on, or outside the cell:
  //   -1: point is outside the perimeter of the cell
  //    0: point is on the perimeter of the cell
  //    1: point is inside the perimeter of the cell
  //


  Voronoi.prototype.Cell.prototype.pointIntersection = function (x, y) {
    // Check if point in polygon. Since all polygons of a Voronoi
    // diagram are convex, then:
    // http://paulbourke.net/geometry/polygonmesh/
    // Solution 3 (2D):
    //   "If the polygon is convex then one can consider the polygon
    //   "as a 'path' from the first vertex. A point is on the interior
    //   "of this polygons if it is always on the same side of all the
    //   "line segments making up the path. ...
    //   "(y - y0) (x1 - x0) - (x - x0) (y1 - y0)
    //   "if it is less than 0 then P is to the right of the line segment,
    //   "if greater than 0 it is to the left, if equal to 0 then it lies
    //   "on the line segment"
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        halfedge,
        p0,
        p1,
        r;

    while (iHalfedge--) {
      halfedge = halfedges[iHalfedge];
      p0 = halfedge.getStartpoint();
      p1 = halfedge.getEndpoint();
      r = (y - p0.y) * (p1.x - p0.x) - (x - p0.x) * (p1.y - p0.y);

      if (!r) {
        return 0;
      }

      if (r > 0) {
        return -1;
      }
    }

    return 1;
  }; // ---------------------------------------------------------------------------
  // Edge methods
  //


  Voronoi.prototype.Vertex = function (x, y) {
    this.x = x;
    this.y = y;
  };

  Voronoi.prototype.Edge = function (lSite, rSite) {
    this.lSite = lSite;
    this.rSite = rSite;
    this.va = this.vb = null;
  };

  Voronoi.prototype.Halfedge = function (edge, lSite, rSite) {
    this.site = lSite;
    this.edge = edge; // 'angle' is a value to be used for properly sorting the
    // halfsegments counterclockwise. By convention, we will
    // use the angle of the line defined by the 'site to the left'
    // to the 'site to the right'.
    // However, border edges have no 'site to the right': thus we
    // use the angle of line perpendicular to the halfsegment (the
    // edge should have both end points defined in such case.)

    if (rSite) {
      this.angle = Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x);
    } else {
      var va = edge.va,
          vb = edge.vb; // rhill 2011-05-31: used to call getStartpoint()/getEndpoint(),
      // but for performance purpose, these are expanded in place here.

      this.angle = edge.lSite === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
    }
  };

  Voronoi.prototype.createHalfedge = function (edge, lSite, rSite) {
    return new this.Halfedge(edge, lSite, rSite);
  };

  Voronoi.prototype.Halfedge.prototype.getStartpoint = function () {
    return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
  };

  Voronoi.prototype.Halfedge.prototype.getEndpoint = function () {
    return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
  }; // this create and add a vertex to the internal collection


  Voronoi.prototype.createVertex = function (x, y) {
    var v = this.vertexJunkyard.pop();

    if (!v) {
      v = new this.Vertex(x, y);
    } else {
      v.x = x;
      v.y = y;
    }

    this.vertices.push(v);
    return v;
  }; // this create and add an edge to internal collection, and also create
  // two halfedges which are added to each site's counterclockwise array
  // of halfedges.


  Voronoi.prototype.createEdge = function (lSite, rSite, va, vb) {
    var edge = this.edgeJunkyard.pop();

    if (!edge) {
      edge = new this.Edge(lSite, rSite);
    } else {
      edge.lSite = lSite;
      edge.rSite = rSite;
      edge.va = edge.vb = null;
    }

    this.edges.push(edge);

    if (va) {
      this.setEdgeStartpoint(edge, lSite, rSite, va);
    }

    if (vb) {
      this.setEdgeEndpoint(edge, lSite, rSite, vb);
    }

    this.cells[lSite.voronoiId].halfedges.push(this.createHalfedge(edge, lSite, rSite));
    this.cells[rSite.voronoiId].halfedges.push(this.createHalfedge(edge, rSite, lSite));
    return edge;
  };

  Voronoi.prototype.createBorderEdge = function (lSite, va, vb) {
    var edge = this.edgeJunkyard.pop();

    if (!edge) {
      edge = new this.Edge(lSite, null);
    } else {
      edge.lSite = lSite;
      edge.rSite = null;
    }

    edge.va = va;
    edge.vb = vb;
    this.edges.push(edge);
    return edge;
  };

  Voronoi.prototype.setEdgeStartpoint = function (edge, lSite, rSite, vertex) {
    if (!edge.va && !edge.vb) {
      edge.va = vertex;
      edge.lSite = lSite;
      edge.rSite = rSite;
    } else if (edge.lSite === rSite) {
      edge.vb = vertex;
    } else {
      edge.va = vertex;
    }
  };

  Voronoi.prototype.setEdgeEndpoint = function (edge, lSite, rSite, vertex) {
    this.setEdgeStartpoint(edge, rSite, lSite, vertex);
  }; // ---------------------------------------------------------------------------
  // Beachline methods
  // rhill 2011-06-07: For some reasons, performance suffers significantly
  // when instanciating a literal object instead of an empty ctor


  Voronoi.prototype.Beachsection = function () {}; // rhill 2011-06-02: A lot of Beachsection instanciations
  // occur during the computation of the Voronoi diagram,
  // somewhere between the number of sites and twice the
  // number of sites, while the number of Beachsections on the
  // beachline at any given time is comparatively low. For this
  // reason, we reuse already created Beachsections, in order
  // to avoid new memory allocation. This resulted in a measurable
  // performance gain.


  Voronoi.prototype.createBeachsection = function (site) {
    var beachsection = this.beachsectionJunkyard.pop();

    if (!beachsection) {
      beachsection = new this.Beachsection();
    }

    beachsection.site = site;
    return beachsection;
  }; // calculate the left break point of a particular beach section,
  // given a particular sweep line


  Voronoi.prototype.leftBreakPoint = function (arc, directrix) {
    // http://en.wikipedia.org/wiki/Parabola
    // http://en.wikipedia.org/wiki/Quadratic_equation
    // h1 = x1,
    // k1 = (y1+directrix)/2,
    // h2 = x2,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = -h1/(2*p1),
    // c1 = h1*h1/(4*p1)+k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
    // When x1 become the x-origin:
    // h1 = 0,
    // k1 = (y1+directrix)/2,
    // h2 = x2-x1,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = 0,
    // c1 = k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1
    // change code below at your own risk: care has been taken to
    // reduce errors due to computers' finite arithmetic precision.
    // Maybe can still be improved, will see if any more of this
    // kind of errors pop up again.
    var site = arc.site,
        rfocx = site.x,
        rfocy = site.y,
        pby2 = rfocy - directrix; // parabola in degenerate case where focus is on directrix

    if (!pby2) {
      return rfocx;
    }

    var lArc = arc.rbPrevious;

    if (!lArc) {
      return -Infinity;
    }

    site = lArc.site;
    var lfocx = site.x,
        lfocy = site.y,
        plby2 = lfocy - directrix; // parabola in degenerate case where focus is on directrix

    if (!plby2) {
      return lfocx;
    }

    var hl = lfocx - rfocx,
        aby2 = 1 / pby2 - 1 / plby2,
        b = hl / plby2;

    if (aby2) {
      return (-b + this.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    } // both parabolas have same distance to directrix, thus break point is midway


    return (rfocx + lfocx) / 2;
  }; // calculate the right break point of a particular beach section,
  // given a particular directrix


  Voronoi.prototype.rightBreakPoint = function (arc, directrix) {
    var rArc = arc.rbNext;

    if (rArc) {
      return this.leftBreakPoint(rArc, directrix);
    }

    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  };

  Voronoi.prototype.detachBeachsection = function (beachsection) {
    this.detachCircleEvent(beachsection); // detach potentially attached circle event

    this.beachline.rbRemoveNode(beachsection); // remove from RB-tree

    this.beachsectionJunkyard.push(beachsection); // mark for reuse
  };

  Voronoi.prototype.removeBeachsection = function (beachsection) {
    var circle = beachsection.circleEvent,
        x = circle.x,
        y = circle.ycenter,
        vertex = this.createVertex(x, y),
        previous = beachsection.rbPrevious,
        next = beachsection.rbNext,
        disappearingTransitions = [beachsection],
        abs_fn = Math.abs; // remove collapsed beachsection from beachline

    this.detachBeachsection(beachsection); // there could be more than one empty arc at the deletion point, this
    // happens when more than two edges are linked by the same vertex,
    // so we will collect all those edges by looking up both sides of
    // the deletion point.
    // by the way, there is *always* a predecessor/successor to any collapsed
    // beach section, it's just impossible to have a collapsing first/last
    // beach sections on the beachline, since they obviously are unconstrained
    // on their left/right side.
    // look left

    var lArc = previous;

    while (lArc.circleEvent && abs_fn(x - lArc.circleEvent.x) < 1e-9 && abs_fn(y - lArc.circleEvent.ycenter) < 1e-9) {
      previous = lArc.rbPrevious;
      disappearingTransitions.unshift(lArc);
      this.detachBeachsection(lArc); // mark for reuse

      lArc = previous;
    } // even though it is not disappearing, I will also add the beach section
    // immediately to the left of the left-most collapsed beach section, for
    // convenience, since we need to refer to it later as this beach section
    // is the 'left' site of an edge for which a start point is set.


    disappearingTransitions.unshift(lArc);
    this.detachCircleEvent(lArc); // look right

    var rArc = next;

    while (rArc.circleEvent && abs_fn(x - rArc.circleEvent.x) < 1e-9 && abs_fn(y - rArc.circleEvent.ycenter) < 1e-9) {
      next = rArc.rbNext;
      disappearingTransitions.push(rArc);
      this.detachBeachsection(rArc); // mark for reuse

      rArc = next;
    } // we also have to add the beach section immediately to the right of the
    // right-most collapsed beach section, since there is also a disappearing
    // transition representing an edge's start point on its left.


    disappearingTransitions.push(rArc);
    this.detachCircleEvent(rArc); // walk through all the disappearing transitions between beach sections and
    // set the start point of their (implied) edge.

    var nArcs = disappearingTransitions.length,
        iArc;

    for (iArc = 1; iArc < nArcs; iArc++) {
      rArc = disappearingTransitions[iArc];
      lArc = disappearingTransitions[iArc - 1];
      this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
    } // create a new edge as we have now a new transition between
    // two beach sections which were previously not adjacent.
    // since this edge appears as a new vertex is defined, the vertex
    // actually define an end point of the edge (relative to the site
    // on the left)


    lArc = disappearingTransitions[0];
    rArc = disappearingTransitions[nArcs - 1];
    rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex); // create circle events if any for beach sections left in the beachline
    // adjacent to collapsed sections

    this.attachCircleEvent(lArc);
    this.attachCircleEvent(rArc);
  };

  Voronoi.prototype.addBeachsection = function (site) {
    var x = site.x,
        directrix = site.y; // find the left and right beach sections which will surround the newly
    // created beach section.
    // rhill 2011-06-01: This loop is one of the most often executed,
    // hence we expand in-place the comparison-against-epsilon calls.

    var lArc,
        rArc,
        dxl,
        dxr,
        node = this.beachline.root;

    while (node) {
      dxl = this.leftBreakPoint(node, directrix) - x; // x lessThanWithEpsilon xl => falls somewhere before the left edge of the beachsection

      if (dxl > 1e-9) {
        // this case should never happen
        // if (!node.rbLeft) {
        //    rArc = node.rbLeft;
        //    break;
        //    }
        node = node.rbLeft;
      } else {
        dxr = x - this.rightBreakPoint(node, directrix); // x greaterThanWithEpsilon xr => falls somewhere after the right edge of the beachsection

        if (dxr > 1e-9) {
          if (!node.rbRight) {
            lArc = node;
            break;
          }

          node = node.rbRight;
        } else {
          // x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
          if (dxl > -1e-9) {
            lArc = node.rbPrevious;
            rArc = node;
          } // x equalWithEpsilon xr => falls exactly on the right edge of the beachsection
          else if (dxr > -1e-9) {
            lArc = node;
            rArc = node.rbNext;
          } // falls exactly somewhere in the middle of the beachsection
          else {
            lArc = rArc = node;
          }

          break;
        }
      }
    } // at this point, keep in mind that lArc and/or rArc could be
    // undefined or null.
    // create a new beach section object for the site and add it to RB-tree


    var newArc = this.createBeachsection(site);
    this.beachline.rbInsertSuccessor(lArc, newArc); // cases:
    //
    // [null,null]
    // least likely case: new beach section is the first beach section on the
    // beachline.
    // This case means:
    //   no new transition appears
    //   no collapsing beach section
    //   new beachsection become root of the RB-tree

    if (!lArc && !rArc) {
      return;
    } // [lArc,rArc] where lArc == rArc
    // most likely case: new beach section split an existing beach
    // section.
    // This case means:
    //   one new transition appears
    //   the left and right beach section might be collapsing as a result
    //   two new nodes added to the RB-tree


    if (lArc === rArc) {
      // invalidate circle event of split beach section
      this.detachCircleEvent(lArc); // split the beach section into two separate beach sections

      rArc = this.createBeachsection(lArc.site);
      this.beachline.rbInsertSuccessor(newArc, rArc); // since we have a new transition between two beach sections,
      // a new edge is born

      newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site); // check whether the left and right beach sections are collapsing
      // and if so create circle events, to be notified when the point of
      // collapse is reached.

      this.attachCircleEvent(lArc);
      this.attachCircleEvent(rArc);
      return;
    } // [lArc,null]
    // even less likely case: new beach section is the *last* beach section
    // on the beachline -- this can happen *only* if *all* the previous beach
    // sections currently on the beachline share the same y value as
    // the new beach section.
    // This case means:
    //   one new transition appears
    //   no collapsing beach section as a result
    //   new beach section become right-most node of the RB-tree


    if (lArc && !rArc) {
      newArc.edge = this.createEdge(lArc.site, newArc.site);
      return;
    } // [null,rArc]
    // impossible case: because sites are strictly processed from top to bottom,
    // and left to right, which guarantees that there will always be a beach section
    // on the left -- except of course when there are no beach section at all on
    // the beach line, which case was handled above.
    // rhill 2011-06-02: No point testing in non-debug version
    //if (!lArc && rArc) {
    //    throw "Voronoi.addBeachsection(): What is this I don't even";
    //    }
    // [lArc,rArc] where lArc != rArc
    // somewhat less likely case: new beach section falls *exactly* in between two
    // existing beach sections
    // This case means:
    //   one transition disappears
    //   two new transitions appear
    //   the left and right beach section might be collapsing as a result
    //   only one new node added to the RB-tree


    if (lArc !== rArc) {
      // invalidate circle events of left and right sites
      this.detachCircleEvent(lArc);
      this.detachCircleEvent(rArc); // an existing transition disappears, meaning a vertex is defined at
      // the disappearance point.
      // since the disappearance is caused by the new beachsection, the
      // vertex is at the center of the circumscribed circle of the left,
      // new and right beachsections.
      // http://mathforum.org/library/drmath/view/55002.html
      // Except that I bring the origin at A to simplify
      // calculation

      var lSite = lArc.site,
          ax = lSite.x,
          ay = lSite.y,
          bx = site.x - ax,
          by = site.y - ay,
          rSite = rArc.site,
          cx = rSite.x - ax,
          cy = rSite.y - ay,
          d = 2 * (bx * cy - by * cx),
          hb = bx * bx + by * by,
          hc = cx * cx + cy * cy,
          vertex = this.createVertex((cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay); // one transition disappear

      this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex); // two new transitions appear at the new vertex location

      newArc.edge = this.createEdge(lSite, site, undefined, vertex);
      rArc.edge = this.createEdge(site, rSite, undefined, vertex); // check whether the left and right beach sections are collapsing
      // and if so create circle events, to handle the point of collapse.

      this.attachCircleEvent(lArc);
      this.attachCircleEvent(rArc);
      return;
    }
  }; // ---------------------------------------------------------------------------
  // Circle event methods
  // rhill 2011-06-07: For some reasons, performance suffers significantly
  // when instanciating a literal object instead of an empty ctor


  Voronoi.prototype.CircleEvent = function () {
    // rhill 2013-10-12: it helps to state exactly what we are at ctor time.
    this.arc = null;
    this.rbLeft = null;
    this.rbNext = null;
    this.rbParent = null;
    this.rbPrevious = null;
    this.rbRed = false;
    this.rbRight = null;
    this.site = null;
    this.x = this.y = this.ycenter = 0;
  };

  Voronoi.prototype.attachCircleEvent = function (arc) {
    var lArc = arc.rbPrevious,
        rArc = arc.rbNext;

    if (!lArc || !rArc) {
      return;
    } // does that ever happen?


    var lSite = lArc.site,
        cSite = arc.site,
        rSite = rArc.site; // If site of left beachsection is same as site of
    // right beachsection, there can't be convergence

    if (lSite === rSite) {
      return;
    } // Find the circumscribed circle for the three sites associated
    // with the beachsection triplet.
    // rhill 2011-05-26: It is more efficient to calculate in-place
    // rather than getting the resulting circumscribed circle from an
    // object returned by calling Voronoi.circumcircle()
    // http://mathforum.org/library/drmath/view/55002.html
    // Except that I bring the origin at cSite to simplify calculations.
    // The bottom-most part of the circumcircle is our Fortune 'circle
    // event', and its center is a vertex potentially part of the final
    // Voronoi diagram.


    var bx = cSite.x,
        by = cSite.y,
        ax = lSite.x - bx,
        ay = lSite.y - by,
        cx = rSite.x - bx,
        cy = rSite.y - by; // If points l->c->r are clockwise, then center beach section does not
    // collapse, hence it can't end up as a vertex (we reuse 'd' here, which
    // sign is reverse of the orientation, hence we reverse the test.
    // http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
    // rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
    // return infinites: 1e-12 seems to fix the problem.

    var d = 2 * (ax * cy - ay * cx);

    if (d >= -2e-12) {
      return;
    }

    var ha = ax * ax + ay * ay,
        hc = cx * cx + cy * cy,
        x = (cy * ha - ay * hc) / d,
        y = (ax * hc - cx * ha) / d,
        ycenter = y + by; // Important: ybottom should always be under or at sweep, so no need
    // to waste CPU cycles by checking
    // recycle circle event object if possible

    var circleEvent = this.circleEventJunkyard.pop();

    if (!circleEvent) {
      circleEvent = new this.CircleEvent();
    }

    circleEvent.arc = arc;
    circleEvent.site = cSite;
    circleEvent.x = x + bx;
    circleEvent.y = ycenter + this.sqrt(x * x + y * y); // y bottom

    circleEvent.ycenter = ycenter;
    arc.circleEvent = circleEvent; // find insertion point in RB-tree: circle events are ordered from
    // smallest to largest

    var predecessor = null,
        node = this.circleEvents.root;

    while (node) {
      if (circleEvent.y < node.y || circleEvent.y === node.y && circleEvent.x <= node.x) {
        if (node.rbLeft) {
          node = node.rbLeft;
        } else {
          predecessor = node.rbPrevious;
          break;
        }
      } else {
        if (node.rbRight) {
          node = node.rbRight;
        } else {
          predecessor = node;
          break;
        }
      }
    }

    this.circleEvents.rbInsertSuccessor(predecessor, circleEvent);

    if (!predecessor) {
      this.firstCircleEvent = circleEvent;
    }
  };

  Voronoi.prototype.detachCircleEvent = function (arc) {
    var circleEvent = arc.circleEvent;

    if (circleEvent) {
      if (!circleEvent.rbPrevious) {
        this.firstCircleEvent = circleEvent.rbNext;
      }

      this.circleEvents.rbRemoveNode(circleEvent); // remove from RB-tree

      this.circleEventJunkyard.push(circleEvent);
      arc.circleEvent = null;
    }
  }; // ---------------------------------------------------------------------------
  // Diagram completion methods
  // connect dangling edges (not if a cursory test tells us
  // it is not going to be visible.
  // return value:
  //   false: the dangling endpoint couldn't be connected
  //   true: the dangling endpoint could be connected


  Voronoi.prototype.connectEdge = function (edge, bbox) {
    // skip if end point already connected
    var vb = edge.vb;

    if (!!vb) {
      return true;
    } // make local copy for performance purpose


    var va = edge.va,
        xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        lSite = edge.lSite,
        rSite = edge.rSite,
        lx = lSite.x,
        ly = lSite.y,
        rx = rSite.x,
        ry = rSite.y,
        fx = (lx + rx) / 2,
        fy = (ly + ry) / 2,
        fm,
        fb; // if we reach here, this means cells which use this edge will need
    // to be closed, whether because the edge was removed, or because it
    // was connected to the bounding box.

    this.cells[lSite.voronoiId].closeMe = true;
    this.cells[rSite.voronoiId].closeMe = true; // get the line equation of the bisector if line is not vertical

    if (ry !== ly) {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
    } // remember, direction of line (relative to left site):
    // upward: left.x < right.x
    // downward: left.x > right.x
    // horizontal: left.x == right.x
    // upward: left.x < right.x
    // rightward: left.y < right.y
    // leftward: left.y > right.y
    // vertical: left.y == right.y
    // depending on the direction, find the best side of the
    // bounding box to use to determine a reasonable start point
    // rhill 2013-12-02:
    // While at it, since we have the values which define the line,
    // clip the end of va if it is outside the bbox.
    // https://github.com/gorhill/Javascript-Voronoi/issues/15
    // TODO: Do all the clipping here rather than rely on Liang-Barsky
    // which does not do well sometimes due to loss of arithmetic
    // precision. The code here doesn't degrade if one of the vertex is
    // at a huge distance.
    // special case: vertical line


    if (fm === undefined) {
      // doesn't intersect with viewport
      if (fx < xl || fx >= xr) {
        return false;
      } // downward


      if (lx > rx) {
        if (!va || va.y < yt) {
          va = this.createVertex(fx, yt);
        } else if (va.y >= yb) {
          return false;
        }

        vb = this.createVertex(fx, yb);
      } // upward
      else {
        if (!va || va.y > yb) {
          va = this.createVertex(fx, yb);
        } else if (va.y < yt) {
          return false;
        }

        vb = this.createVertex(fx, yt);
      }
    } // closer to vertical than horizontal, connect start point to the
    // top or bottom side of the bounding box
    else if (fm < -1 || fm > 1) {
      // downward
      if (lx > rx) {
        if (!va || va.y < yt) {
          va = this.createVertex((yt - fb) / fm, yt);
        } else if (va.y >= yb) {
          return false;
        }

        vb = this.createVertex((yb - fb) / fm, yb);
      } // upward
      else {
        if (!va || va.y > yb) {
          va = this.createVertex((yb - fb) / fm, yb);
        } else if (va.y < yt) {
          return false;
        }

        vb = this.createVertex((yt - fb) / fm, yt);
      }
    } // closer to horizontal than vertical, connect start point to the
    // left or right side of the bounding box
    else {
      // rightward
      if (ly < ry) {
        if (!va || va.x < xl) {
          va = this.createVertex(xl, fm * xl + fb);
        } else if (va.x >= xr) {
          return false;
        }

        vb = this.createVertex(xr, fm * xr + fb);
      } // leftward
      else {
        if (!va || va.x > xr) {
          va = this.createVertex(xr, fm * xr + fb);
        } else if (va.x < xl) {
          return false;
        }

        vb = this.createVertex(xl, fm * xl + fb);
      }
    }

    edge.va = va;
    edge.vb = vb;
    return true;
  }; // line-clipping code taken from:
  //   Liang-Barsky function by Daniel White
  //   http://www.skytopia.com/project/articles/compsci/clipping.html
  // Thanks!
  // A bit modified to minimize code paths


  Voronoi.prototype.clipEdge = function (edge, bbox) {
    var ax = edge.va.x,
        ay = edge.va.y,
        bx = edge.vb.x,
        by = edge.vb.y,
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay; // left

    var q = ax - bbox.xl;

    if (dx === 0 && q < 0) {
      return false;
    }

    var r = -q / dx;

    if (dx < 0) {
      if (r < t0) {
        return false;
      }

      if (r < t1) {
        t1 = r;
      }
    } else if (dx > 0) {
      if (r > t1) {
        return false;
      }

      if (r > t0) {
        t0 = r;
      }
    } // right


    q = bbox.xr - ax;

    if (dx === 0 && q < 0) {
      return false;
    }

    r = q / dx;

    if (dx < 0) {
      if (r > t1) {
        return false;
      }

      if (r > t0) {
        t0 = r;
      }
    } else if (dx > 0) {
      if (r < t0) {
        return false;
      }

      if (r < t1) {
        t1 = r;
      }
    } // top


    q = ay - bbox.yt;

    if (dy === 0 && q < 0) {
      return false;
    }

    r = -q / dy;

    if (dy < 0) {
      if (r < t0) {
        return false;
      }

      if (r < t1) {
        t1 = r;
      }
    } else if (dy > 0) {
      if (r > t1) {
        return false;
      }

      if (r > t0) {
        t0 = r;
      }
    } // bottom        


    q = bbox.yb - ay;

    if (dy === 0 && q < 0) {
      return false;
    }

    r = q / dy;

    if (dy < 0) {
      if (r > t1) {
        return false;
      }

      if (r > t0) {
        t0 = r;
      }
    } else if (dy > 0) {
      if (r < t0) {
        return false;
      }

      if (r < t1) {
        t1 = r;
      }
    } // if we reach this point, Voronoi edge is within bbox
    // if t0 > 0, va needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge


    if (t0 > 0) {
      edge.va = this.createVertex(ax + t0 * dx, ay + t0 * dy);
    } // if t1 < 1, vb needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge


    if (t1 < 1) {
      edge.vb = this.createVertex(ax + t1 * dx, ay + t1 * dy);
    } // va and/or vb were clipped, thus we will need to close
    // cells which use this edge.


    if (t0 > 0 || t1 < 1) {
      this.cells[edge.lSite.voronoiId].closeMe = true;
      this.cells[edge.rSite.voronoiId].closeMe = true;
    }

    return true;
  }; // Connect/cut edges at bounding box


  Voronoi.prototype.clipEdges = function (bbox) {
    // connect all dangling edges to bounding box
    // or get rid of them if it can't be done
    var edges = this.edges,
        iEdge = edges.length,
        edge,
        abs_fn = Math.abs; // iterate backward so we can splice safely

    while (iEdge--) {
      edge = edges[iEdge]; // edge is removed if:
      //   it is wholly outside the bounding box
      //   it is looking more like a point than a line

      if (!this.connectEdge(edge, bbox) || !this.clipEdge(edge, bbox) || abs_fn(edge.va.x - edge.vb.x) < 1e-9 && abs_fn(edge.va.y - edge.vb.y) < 1e-9) {
        edge.va = edge.vb = null;
        edges.splice(iEdge, 1);
      }
    }
  }; // Close the cells.
  // The cells are bound by the supplied bounding box.
  // Each cell refers to its associated site, and a list
  // of halfedges ordered counterclockwise.


  Voronoi.prototype.closeCells = function (bbox) {
    var xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        cells = this.cells,
        iCell = cells.length,
        cell,
        iLeft,
        halfedges,
        nHalfedges,
        edge,
        va,
        vb,
        vz,
        lastBorderSegment,
        abs_fn = Math.abs;

    while (iCell--) {
      cell = cells[iCell]; // prune, order halfedges counterclockwise, then add missing ones
      // required to close cells

      if (!cell.prepareHalfedges()) {
        continue;
      }

      if (!cell.closeMe) {
        continue;
      } // find first 'unclosed' point.
      // an 'unclosed' point will be the end point of a halfedge which
      // does not match the start point of the following halfedge


      halfedges = cell.halfedges;
      nHalfedges = halfedges.length; // special case: only one site, in which case, the viewport is the cell
      // ...
      // all other cases

      iLeft = 0;

      while (iLeft < nHalfedges) {
        va = halfedges[iLeft].getEndpoint();
        vz = halfedges[(iLeft + 1) % nHalfedges].getStartpoint(); // if end point is not equal to start point, we need to add the missing
        // halfedge(s) up to vz

        if (abs_fn(va.x - vz.x) >= 1e-9 || abs_fn(va.y - vz.y) >= 1e-9) {
          // rhill 2013-12-02:
          // "Holes" in the halfedges are not necessarily always adjacent.
          // https://github.com/gorhill/Javascript-Voronoi/issues/16
          // find entry point:
          switch (true) {
            // walk downward along left side
            case this.equalWithEpsilon(va.x, xl) && this.lessThanWithEpsilon(va.y, yb):
              lastBorderSegment = this.equalWithEpsilon(vz.x, xl);
              vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

              va = vb;
            // fall through
            // walk rightward along bottom side

            case this.equalWithEpsilon(va.y, yb) && this.lessThanWithEpsilon(va.x, xr):
              lastBorderSegment = this.equalWithEpsilon(vz.y, yb);
              vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

              va = vb;
            // fall through
            // walk upward along right side

            case this.equalWithEpsilon(va.x, xr) && this.greaterThanWithEpsilon(va.y, yt):
              lastBorderSegment = this.equalWithEpsilon(vz.x, xr);
              vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

              va = vb;
            // fall through
            // walk leftward along top side

            case this.equalWithEpsilon(va.y, yt) && this.greaterThanWithEpsilon(va.x, xl):
              lastBorderSegment = this.equalWithEpsilon(vz.y, yt);
              vb = this.createVertex(lastBorderSegment ? vz.x : xl, yt);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

              va = vb; // fall through
              // walk downward along left side

              lastBorderSegment = this.equalWithEpsilon(vz.x, xl);
              vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

              va = vb; // fall through
              // walk rightward along bottom side

              lastBorderSegment = this.equalWithEpsilon(vz.y, yb);
              vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

              va = vb; // fall through
              // walk upward along right side

              lastBorderSegment = this.equalWithEpsilon(vz.x, xr);
              vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;

              if (lastBorderSegment) {
                break;
              }

            // fall through

            default:
              throw "Voronoi.closeCells() > this makes no sense!";
          }
        }

        iLeft++;
      }

      cell.closeMe = false;
    }
  }; // ---------------------------------------------------------------------------
  // Debugging helper

  /*
  Voronoi.prototype.dumpBeachline = function(y) {
      console.log('Voronoi.dumpBeachline(%f) > Beachsections, from left to right:', y);
      if ( !this.beachline ) {
          console.log('  None');
          }
      else {
          var bs = this.beachline.getFirst(this.beachline.root);
          while ( bs ) {
              console.log('  site %d: xl: %f, xr: %f', bs.site.voronoiId, this.leftBreakPoint(bs, y), this.rightBreakPoint(bs, y));
              bs = bs.rbNext;
              }
          }
      };
  */
  // ---------------------------------------------------------------------------
  // Helper: Quantize sites
  // rhill 2013-10-12:
  // This is to solve https://github.com/gorhill/Javascript-Voronoi/issues/15
  // Since not all users will end up using the kind of coord values which would
  // cause the issue to arise, I chose to let the user decide whether or not
  // he should sanitize his coord values through this helper. This way, for
  // those users who uses coord values which are known to be fine, no overhead is
  // added.


  Voronoi.prototype.quantizeSites = function (sites) {
    var ε = this.ε,
        n = sites.length,
        site;

    while (n--) {
      site = sites[n];
      site.x = Math.floor(site.x / ε) * ε;
      site.y = Math.floor(site.y / ε) * ε;
    }
  }; // ---------------------------------------------------------------------------
  // Helper: Recycle diagram: all vertex, edge and cell objects are
  // "surrendered" to the Voronoi object for reuse.
  // TODO: rhill-voronoi-core v2: more performance to be gained
  // when I change the semantic of what is returned.


  Voronoi.prototype.recycle = function (diagram) {
    if (diagram) {
      if (diagram instanceof this.Diagram) {
        this.toRecycle = diagram;
      } else {
        throw 'Voronoi.recycleDiagram() > Need a Diagram object.';
      }
    }
  }; // ---------------------------------------------------------------------------
  // Top-level Fortune loop
  // rhill 2011-05-19:
  //   Voronoi sites are kept client-side now, to allow
  //   user to freely modify content. At compute time,
  //   *references* to sites are copied locally.


  Voronoi.prototype.compute = function (sites, bbox) {
    // to measure execution time
    var startTime = new Date(); // init internal state

    this.reset(); // any diagram data available for recycling?
    // I do that here so that this is included in execution time

    if (this.toRecycle) {
      this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
      this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
      this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
      this.toRecycle = null;
    } // Initialize site event queue


    var siteEvents = sites.slice(0);
    siteEvents.sort(function (a, b) {
      var r = b.y - a.y;

      if (r) {
        return r;
      }

      return b.x - a.x;
    }); // process queue

    var site = siteEvents.pop(),
        siteid = 0,
        xsitex,
        // to avoid duplicate sites
    xsitey,
        cells = this.cells,
        circle; // main loop

    for (;;) {
      // we need to figure whether we handle a site or circle event
      // for this we find out if there is a site event and it is
      // 'earlier' than the circle event
      circle = this.firstCircleEvent; // add beach section

      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        // only if site is not a duplicate
        if (site.x !== xsitex || site.y !== xsitey) {
          // first create cell for new site
          cells[siteid] = this.createCell(site);
          site.voronoiId = siteid++; // then create a beachsection for that site

          this.addBeachsection(site); // remember last site coords to detect duplicate

          xsitey = site.y;
          xsitex = site.x;
        }

        site = siteEvents.pop();
      } // remove beach section
      else if (circle) {
        this.removeBeachsection(circle.arc);
      } // all done, quit
      else {
        break;
      }
    } // wrapping-up:
    //   connect dangling edges to bounding box
    //   cut edges as per bounding box
    //   discard edges completely outside bounding box
    //   discard edges which are point-like


    this.clipEdges(bbox); //   add missing edges in order to close opened cells

    this.closeCells(bbox); // to measure execution time

    var stopTime = new Date(); // prepare return values

    var diagram = new this.Diagram();
    diagram.cells = this.cells;
    diagram.edges = this.edges;
    diagram.vertices = this.vertices;
    diagram.execTime = stopTime.getTime() - startTime.getTime(); // clean up

    this.reset();
    return diagram;
  };
  /******************************************************************************/


  if (typeof module !== 'undefined') {
    module.exports = Voronoi;
  }

  this.Voronoi = Voronoi;
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"stroke_caps":{"fixStrokes.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/stroke_caps/fixStrokes.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  const {
    distToPath,
    getCosSimAroundPoint,
    getLinesIntersectPoint,
    getOutlinePoints,
    extendPointOnLine,
    estimateTanPoints,
    roundPathPoints,
    ptEq,
    dist
  } = require('./utils');

  CLIP_THRESH = 2;
  LOWER_COS_SIM_THRESH = 0.89;
  UPPER_COS_SIM_THRESH = 0.97; // A bridge is a place in the pathstring where 2 strokes intersect. It can either be 1 stroke clipping
  // another, or it can be strokes passing through each other. In the pathstring from makemeahanzi, any
  // L # # in the pathstring is a

  class Bridge {
    constructor(points, pointString, stroke) {
      this.points = points;
      this.pointString = pointString;
      this.stroke = stroke;
      this.estTanPoints = estimateTanPoints(stroke.outline, points);
    }

    getClips() {
      // this clip point is super tiny, it's probably just a glitch, skip it
      if (dist(this.points[0], this.points[1]) < 3.1) return [];
      const cosSim0 = getCosSimAroundPoint(this.points[0], this.stroke.outline);
      const cosSim1 = getCosSimAroundPoint(this.points[1], this.stroke.outline); // If the angle around the bridge points looks flat, it's probably an intersection.

      if (Math.min(cosSim0, cosSim1) > LOWER_COS_SIM_THRESH && Math.max(cosSim0, cosSim1) > UPPER_COS_SIM_THRESH) {
        return [];
      }

      return this.stroke.character.strokes.filter(stroke => {
        if (stroke === this.stroke) return false;
        const dist0 = distToPath(this.points[0], stroke.outline);
        const dist1 = distToPath(this.points[1], stroke.outline);
        return dist0 <= CLIP_THRESH && dist1 <= CLIP_THRESH;
      }).map(clippingStroke => new Clip(this, clippingStroke));
    }

  }

  class Clip {
    constructor(bridge, clippingStroke) {
      this.points = bridge.points;
      this.estTanPoints = bridge.estTanPoints;
      this.pointString = bridge.pointString;
      this.clippedBy = [clippingStroke];
      this.isDouble = false;
    }

    canMerge(otherClip) {
      return ptEq(this.points[1], otherClip.points[0]);
    }

    mergeIntoDouble(otherClip) {
      this.isDouble = true;
      this.clippedBy = this.clippedBy.concat(otherClip.clippedBy);
      this.middlePoint = otherClip.points[0];
      this.points[1] = otherClip.points[1];
      this.estTanPoints[1] = otherClip.estTanPoints[1];
      this.pointString += otherClip.pointString.replace(/.*L/, ' L');
    }

    getNewStrokeTip() {
      const maxControlPoint = getLinesIntersectPoint(this.estTanPoints[0], this.points[0], this.estTanPoints[1], this.points[1]);
      const maxDistControl0 = dist(maxControlPoint, this.points[0]);
      const maxDistControl1 = dist(maxControlPoint, this.points[1]);
      let distControl0 = Math.min(maxDistControl0, 30);
      let distControl1 = Math.min(maxDistControl1, 30); // if the 2 lines are parallel, there will be no intersection point. Just use 30 in that case.

      if (isNaN(distControl0)) distControl0 = 30;
      if (isNaN(distControl1)) distControl1 = 30;

      if (this.isDouble) {
        const midDist0 = dist(this.middlePoint, this.points[0]);
        const midDist1 = dist(this.middlePoint, this.points[1]);
        distControl0 = Math.max(midDist0 * 1.4, distControl0);
        distControl1 = Math.max(midDist1 * 1.4, distControl1);
      }

      const controlPoint0 = extendPointOnLine(this.estTanPoints[0], this.points[0], distControl0);
      const controlPoint1 = extendPointOnLine(this.estTanPoints[1], this.points[1], distControl1);

      const pString = point => "".concat(Math.round(point.x), " ").concat(Math.round(point.y));

      return "".concat(pString(this.points[0]), " C ").concat(pString(controlPoint0), " ").concat(pString(controlPoint1), " ").concat(pString(this.points[1]));
    }

  }

  class Stroke {
    constructor(pathString, character, strokeNum) {
      this.pathString = pathString;
      this.outline = getOutlinePoints(pathString);
      this.character = character;
      this.strokeNum = strokeNum;
    }

    getBridges() {
      const pointStringParts = this.pathString.match(/-?\d+(?:\.\d+)? -?\d+(?:\.\d+)? L/ig);
      if (!pointStringParts) return [];
      return pointStringParts.map(pointStringPart => {
        const fullPointStringRegex = new RegExp("".concat(pointStringPart, " -?\\d+(?:\\.\\d+)? -?\\d+(?:\\.\\d+)?"));
        const pointString = this.pathString.match(fullPointStringRegex)[0];
        const parts = pointString.split(/\sL?\s?/).map(num => parseFloat(num));
        const points = [{
          x: parts[0],
          y: parts[1]
        }, {
          x: parts[2],
          y: parts[3]
        }];
        return new Bridge(points, pointString, this);
      });
    }

    fixPathString() {
      const bridges = this.getBridges();
      let clips = [];
      bridges.forEach(bridge => {
        bridge.getClips().forEach(clip => {
          const lastClip = clips[clips.length - 1];

          if (lastClip && lastClip.canMerge(clip)) {
            lastClip.mergeIntoDouble(clip);
          } else {
            clips.push(clip);
          }
        });
      });
      let modifiedPathString = this.pathString;
      clips.forEach(clip => {
        const newTip = clip.getNewStrokeTip();
        modifiedPathString = roundPathPoints(modifiedPathString.replace(clip.pointString, newTip));
      });
      return {
        isModified: clips.length > 0,
        isDoubleClipped: !!clips.find(clip => clip.isDouble),
        pathString: modifiedPathString,
        strokeNum: this.strokeNum
      };
    }

  }

  class Character {
    constructor(pathStrings) {
      this.strokes = pathStrings.map((path, i) => new Stroke(path, this, i));
    }

  }

  const fixStrokesWithDetails = strokePathStrings => {
    const character = new Character(strokePathStrings);
    const fixedStrokesInfo = character.strokes.map(stroke => stroke.fixPathString());
    return {
      modified: !!fixedStrokesInfo.find(summary => summary.isModified),
      hasDoubleClippedStroke: !!fixedStrokesInfo.find(summary => summary.isDoubleClipped),
      modifiedStrokes: fixedStrokesInfo.filter(summary => summary.isModified).map(summary => summary.strokeNum),
      strokes: fixedStrokesInfo.map(summary => summary.pathString)
    };
  };

  const fixStrokesOnce = strokes => {
    const corrected = fixStrokesWithDetails(strokes);
    return corrected.modified ? corrected.strokes : strokes;
  };

  const fixStrokes = strokes => fixStrokesOnce(fixStrokesOnce(strokes));

  module.exports = {
    fixStrokes
  };
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/stroke_caps/utils.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  const svgPathUtils = require('point-at-length');

  const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const norm = vect => dist(vect, {
    x: 0,
    y: 0
  });

  const subtract = (p1, p2) => ({
    x: p1.x - p2.x,
    y: p1.y - p2.y
  });

  const ptEq = (p1, p2) => p1.x === p2.x && p1.y === p2.y;

  const getOutlinePoints = function (pathString) {
    let count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
    const path = svgPathUtils(pathString);
    const delta = path.length() / count;
    const outline = [];

    for (let i = 0; i < count; i += 1) {
      const svgPoint = path.at(i * delta);
      outline.push({
        x: svgPoint[0],
        y: svgPoint[1]
      });
    }

    return outline;
  }; // get the intersection point of 2 lines defined by 2 points each
  // from https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection


  const getLinesIntersectPoint = (l1p1, l1p2, l2p1, l2p2) => {
    const x1 = l1p1.x;
    const x2 = l1p2.x;
    const x3 = l2p1.x;
    const x4 = l2p2.x;
    const y1 = l1p1.y;
    const y2 = l1p2.y;
    const y3 = l2p1.y;
    const y4 = l2p2.y;
    const xNumerator = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
    const yNumerator = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    return {
      x: xNumerator / denominator,
      y: yNumerator / denominator
    };
  };

  const getPointIndex = (point, pathOutline) => {
    const dists = pathOutline.map(outlinePoint => dist(point, outlinePoint));
    const min = Math.min(...dists);
    return dists.indexOf(min);
  };

  const getIndexAtDelta = (index, delta, pathOutline) => {
    return (pathOutline.length + index + delta) % pathOutline.length;
  };

  const getCosSimAroundPoint = (point, pathOutline) => {
    // if this is 1, the point is on a flat line.
    const pointIndex = getPointIndex(point, pathOutline);
    const preIndex = getIndexAtDelta(pointIndex, -3, pathOutline);
    const postIndex = getIndexAtDelta(pointIndex, 3, pathOutline);
    const vect1 = subtract(pathOutline[pointIndex], pathOutline[preIndex]);
    const vect2 = subtract(pathOutline[postIndex], pathOutline[pointIndex]);
    return (vect1.x * vect2.x + vect1.y * vect2.y) / (norm(vect1) * norm(vect2));
  }; // return a new point, p3, which is on the same line as p1 and p2, but distance away
  // from p2. p1, p2, p3 will always lie on the line in that order


  const extendPointOnLine = (p1, p2, distance) => {
    const vect = subtract(p2, p1);
    const mag = distance / norm(vect);
    return {
      x: p2.x + mag * vect.x,
      y: p2.y + mag * vect.y
    };
  };

  const distToPath = (point, pathOutline) => {
    const dists = pathOutline.map(outlinePoint => dist(point, outlinePoint));
    return Math.min(...dists);
  };

  const roundPathPoints = pathString => {
    const floats = pathString.match(/\d+\.\d+/ig);
    if (!floats) return pathString;
    let fixedPathString = pathString;
    floats.forEach(float => {
      fixedPathString = fixedPathString.replace(float, Math.round(parseFloat(float)));
    });
    return fixedPathString;
  };

  const estimateTanPoints = (pathOutline, clipPoints) => {
    const cpIndex0 = getPointIndex(clipPoints[0], pathOutline);
    const cpIndex1 = getPointIndex(clipPoints[1], pathOutline);
    return [pathOutline[getIndexAtDelta(cpIndex0, -15, pathOutline)], pathOutline[getIndexAtDelta(cpIndex1, 15, pathOutline)]];
  };

  module.exports = {
    distToPath,
    getCosSimAroundPoint,
    getOutlinePoints,
    getLinesIntersectPoint,
    extendPointOnLine,
    estimateTanPoints,
    dist,
    ptEq,
    roundPathPoints
  };
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"animation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/animation.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  getAnimationData: () => getAnimationData
});
const kIdPrefix = 'make-me-a-hanzi';
const kWidth = 128;

const distance2 = (point1, point2) => {
  const diff = [point1[0] - point2[0], point1[1] - point2[1]];
  return diff[0] * diff[0] + diff[1] * diff[1];
};

const getMedianLength = median => {
  let result = 0;

  for (let i = 0; i < median.length - 1; i++) {
    result += Math.sqrt(distance2(median[i], median[i + 1]));
  }

  return result;
};

const getMedianPath = median => {
  const result = [];

  for (let point of median) {
    result.push(result.length === 0 ? 'M' : 'L');
    result.push('' + point[0]);
    result.push('' + point[1]);
  }

  return result.join(' ');
};

const getAnimationData = (strokes, medians, options) => {
  options = options || {};
  const delay = 1024 * (options.delay || 0.3);
  const speed = 1024 * (options.speed || 0.02);
  const lengths = medians.map(x => getMedianLength(x) + kWidth).map(Math.round);
  const paths = medians.map(getMedianPath);
  const animations = [];
  let total_duration = 0;

  for (let i = 0; i < strokes.length; i++) {
    const offset = lengths[i] + kWidth;
    const duration = (delay + offset) / speed / 60;
    const fraction = Math.round(100 * offset / (delay + offset));
    animations.push({
      animation_id: "".concat(kIdPrefix, "-animation-").concat(i),
      clip_id: "".concat(kIdPrefix, "-clip-").concat(i),
      d: paths[i],
      delay: "".concat(total_duration, "s"),
      duration: "".concat(duration, "s"),
      fraction: "".concat(fraction, "%"),
      keyframes: "keyframes".concat(i),
      length: lengths[i],
      offset: offset,
      spacing: 2 * lengths[i],
      stroke: strokes[i],
      width: kWidth
    });
    total_duration += duration;
  }

  return {
    animations: animations,
    strokes: strokes
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"base.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/base.js                                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  module1.export({
    assert: () => assert,
    getPWD: () => getPWD,
    maybeRequire: () => maybeRequire,
    Angle: () => Angle,
    Point: () => Point
  });

  // Prints the message and throws an error if the conditionis false.
  const assert = (condition, message) => {
    if (!condition) {
      console.error(message);
      throw new Error();
    }
  };

  const isNumber = x => Number.isFinite(x) && !Number.isNaN(x);

  const maybeRequire = module => Meteor.isServer ? Npm.require(module) : null;

  let getPWD = null;

  if (Meteor.isServer) {
    Meteor.npmRequire('es6-shim');

    const path = Npm.require('path');

    module1.runSetters(getPWD = () => {
      // TODO(skishore): The next line makes assumptions about the Meteor build
      // directory's structure. We should replace it with a Meteor-provided API.
      return process.env && process.env.PWD ? process.env.PWD : path.join(process.cwd(), '../../../..');
    }, ["getPWD"]);
  } // Returns a list of the unique values in the given array, ordered by their
  // first appearance in the array.


  Array.prototype.unique = function () {
    const result = [];
    const seen = {};
    this.map(x => {
      if (!seen[x]) {
        result.push(x);
        seen[x] = true;
      }
    });
    return result;
  }; // Given a string and a dict mapping characters to other characters, return a
  // string with that mapping applied to each of its characters.


  String.prototype.applyMapping = function (mapping) {
    let result = '';

    for (let i = 0; i < this.length; i++) {
      result += mapping[this[i]] ? mapping[this[i]] : this[i];
    }

    return result;
  }; // Helper methods for use with angles, which are floats in [-pi, pi).


  const Angle = {
    subtract: (angle1, angle2) => {
      var result = angle1 - angle2;

      if (result < -Math.PI) {
        result += 2 * Math.PI;
      }

      if (result >= Math.PI) {
        result -= 2 * Math.PI;
      }

      return result;
    },
    penalty: diff => diff * diff
  }; // Helper methods for use with "points", which are pairs of integers.

  const Point = {
    add: (point1, point2) => [point1[0] + point2[0], point1[1] + point2[1]],
    angle: point => Math.atan2(point[1], point[0]),
    clone: point => [point[0], point[1]],

    distance2(point1, point2) {
      var diff = Point.subtract(point1, point2);
      return Math.pow(diff[0], 2) + Math.pow(diff[1], 2);
    },

    dot: (point1, point2) => point1[0] * point2[0] + point1[1] * point2[1],
    equal: (point1, point2) => point1[0] === point2[0] && point1[1] === point2[1],
    key: point => point.join(','),
    midpoint: (point1, point2) => {
      return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
    },
    subtract: (point1, point2) => [point1[0] - point2[0], point1[1] - point2[1]],
    valid: point => isNumber(point[0]) && isNumber(point[1])
  };
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cjklib.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/cjklib.js                                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  cjklib: () => cjklib
});
let assert, getPWD, maybeRequire;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  getPWD(v) {
    getPWD = v;
  },

  maybeRequire(v) {
    maybeRequire = v;
  }

}, 0);
const fs = maybeRequire('fs');
const path = maybeRequire('path');
const CHARACTER_FIELDS = ['character', 'decomposition', 'definition', 'frequency', 'kangxi_index', 'pinyin', 'simplified', 'strokes', 'traditional'];
const cjklib = {
  characters: {},
  gb2312: {},
  promise: undefined,
  radicals: {
    primary_radical: {},
    index_to_radical_map: {},
    radical_to_index_map: {},
    radical_to_character_map: {}
  },

  getCharacterData(character) {
    const result = {};
    CHARACTER_FIELDS.map(field => result[field] = cjklib.characters[field][character]);
    result.character = character;
    result.traditional = result.traditional || [];
    return result;
  }

};
CHARACTER_FIELDS.map(field => cjklib.characters[field] = {}); // Input: String contents of a cjklib data file.
// Output: a list of rows, each of which is a list of String columns.

const getCJKLibRows = data => {
  const lines = data.split('\n');
  return lines.filter(line => line.length > 0 && line[0] !== '#').map(line => line.split(',').map(entry => entry.replace(/["']/g, '')));
}; // Input: String contents of a TSV data file.
// Output: a list of rows, each of which is a list of String columns.


const getFrequencyRows = data => {
  const lines = data.split('\n');
  return lines.filter(line => line.length > 0 && line[0] !== '#').map(line => line.split('\t'));
}; // Input: String contents of a Unihan data file.
// Output: a list of rows, each of which is a list of String columns.


const getUnihanRows = data => {
  const lines = data.split('\n');
  return lines.filter(line => line.length > 0 && line[0] !== '#').map(line => line.split('\t'));
}; // Input: a String of the form 'U+<hex>' representing a Unicode codepoint.
// Output: the character at that codepoint


const parseUnicodeStr = str => String.fromCodePoint(parseInt(str.substr(2), 16)); // Input: the path to a Unihan data file, starting from the public directory.
// Output: Promise that resolves to the String contents of that file.


const readFile = filename => new Promise((resolve, reject) => {
  if (Meteor.isServer) {
    const filepath = path.join(getPWD(), 'public', filename);
    fs.readFile(filepath, 'utf8', (error, data) => {
      if (error) throw error;
      resolve(data);
    });
  } else {
    $.get(filename, (data, code) => {
      if (code !== 'success') throw new Error(code);
      resolve(data);
    });
  }
}); // Promises that fill data from specific tables.
// Output: Promise that fills result with a mapping character -> decomposition.
// The decompositions are formatted using Ideographic Description Sequence
// symbols - see the Unicode standard for more details.


const fillDecompositions = (decompositions, glyphs, result) => {
  return Promise.all([decompositions, glyphs]).then(_ref => {
    let [rows, glyphs] = _ref;
    rows.filter(row => parseInt(row[2], 10) === (glyphs[row[0]] || 0)).map(row => result[row[0]] = row[1]);
  });
}; // Output: Promise that fills result with a mapping character -> Pinyin.


const fillDefinitions = (readings, result) => {
  return readings.then(rows => {
    rows.filter(row => row[1] === 'kDefinition').map(row => result[parseUnicodeStr(row[0])] = row[2]);
  });
}; // Output: Promise that fills result with a mapping character -> frequency rank.


const fillFrequencies = (readings, result) => {
  return readings.then(rows => {
    rows.map(row => result[row[1]] = parseInt(row[0], 10));
  });
}; // Output: Promise that fills result with a mapping character -> Kangxi radical-
// stroke count, which is a pair of integers [radical, extra_strokes].


const fillKangxiIndex = (readings, result) => {
  return readings.then(rows => {
    const getIndex = adotb => adotb.split('.').map(x => parseInt(x, 10));

    rows.filter(row => row[1] === 'kRSKangXi').map(row => result[parseUnicodeStr(row[0])] = getIndex(row[2]));
  });
}; // Output: Promise that fills result with a mapping character -> Pinyin.


const fillPinyin = (readings, result) => {
  return readings.then(rows => {
    rows.filter(row => row[1] === 'kMandarin').map(row => result[parseUnicodeStr(row[0])] = row[2]);
  });
}; // Output: Promise that fills result with a mapping character -> stroke count.


const fillStrokeCounts = (dictionary_like_data, result) => {
  return dictionary_like_data.then(rows => {
    rows.filter(row => row[1] === 'kTotalStrokes').map(row => result[parseUnicodeStr(row[0])] = parseInt(row[2], 10));
  });
}; // Output: Promise that fills multiple dictionaries in the result:
//   - index_to_radical_map: Map from index -> list of radicals at that index
//   - radical_to_index_map: Map from radical -> index of that radical
//   - primary_radical: Map from index -> primary radical at that index


const fillRadicalData = (locale, radicals, result) => {
  return radicals.then(rows => {
    rows.map(row => {
      if (!result.index_to_radical_map.hasOwnProperty(row[0])) {
        result.index_to_radical_map[row[0]] = [];
      }

      result.index_to_radical_map[row[0]].push(row[1]);
      result.radical_to_index_map[row[1]] = row[0];

      if (row[2] === 'R' && row[3].indexOf(locale) >= 0) {
        result.primary_radical[row[0]] = row[1];
      }
    });
  });
}; // Output: Promise that fills result with a map from Unicode radical-codeblock
// character -> equivalent Unicode CJK-codeblock (hopefully, GB2312) character.
// There may be Unicode radical characters without a CJK equivalent.


const fillRadicalToCharacterMap = (locale, radical_equivalent_characters, result) => {
  return radical_equivalent_characters.then(rows => {
    rows.filter(row => row[2].indexOf(locale) >= 0).map(row => result[row[0]] = row[1]);
  });
}; // Output: Promise that fills the two maps with pointers from a given character
// to its simplified and traditional variants.


const fillVariants = (simplified, traditional, variants) => {
  return variants.then(rows => {
    rows.map(row => {
      if (row[1] !== 'kSimplifiedVariant' && row[1] !== 'kTraditionalVariant' || row[0] === row[2] || row[0] === 'U+2B5B8') {
        // Unicode introduced an extra character U+2B5B8 matching U+613F.
        return;
      }

      let source = parseUnicodeStr(row[0]);
      let target = parseUnicodeStr(row[2]);
      const split = row[2].split(' '); // A number of characters have multiple simplified variants. Of these,
      // we should only use one of them, usually the first, but in three cases,
      // the second.

      if (split.length === 2 && ['U+937E', 'U+949F', 'U+9918'].indexOf(row[0]) >= 0) {
        target = parseUnicodeStr(split[1]);
      }

      if (source === target) {
        return;
      } else if (row[1] === 'kTraditionalVariant') {
        const swap = target;
        target = source;
        source = swap;
      } // The mapping from traditional characters to simplified characters is
      // many to one, so we can only assert that simplified[source] is unique.


      assert(!simplified[source] || simplified[source] === target);
      simplified[source] = target;
      traditional[target] = _.unique((traditional[target] || []).concat([source]));
    });
  });
}; // Given the data from the GB2312 data file, fills the GB2312 result map.


const fillGB2312 = (data, result) => {
  Array.from(data).map(character => {
    if (character === '\n') return;
    assert(character.length === 1);
    const codepoint = character.codePointAt(0);
    assert(0x4e00 <= codepoint && codepoint <= 0x9fff);
    result[character] = true;
  });
  assert(Object.keys(result).length === 6763);
}; // Given the rows of the locale-character map from the cjklib data, returns a
// mapping from characters to the appropriate glyph in that locale.


const parseLocaleGlyphMap = (locale, rows) => {
  const result = {};
  rows.filter(row => row[2].indexOf(locale) >= 0).map(row => result[row[0]] = parseInt(row[1], 10));
  return result;
}; // Methods used for final post-processing of the loaded datasets.


const cleanupCJKLibData = () => {
  const characters = cjklib.characters;
  const radicals = cjklib.radicals;

  const convert_astral_characters = x => x.length === 1 ? x : '？';

  const radical_to_character = x => radicals.radical_to_character_map[x] || x;

  Object.keys(characters.decomposition).map(character => {
    // Convert any 'astral characters' - that is, characters outside the Basic
    // Multilingual Plane - to wide question marks and replace radicals with an
    // equivalent character with that character.
    const decomposition = characters.decomposition[character];
    characters.decomposition[character] = Array.from(decomposition).map(convert_astral_characters).map(radical_to_character).join('');
  });

  for (let i = 1; i <= 214; i++) {
    // All primary radicals should have an equivalent character form.
    const primary = radicals.primary_radical[i];
    assert(radicals.radical_to_character_map.hasOwnProperty(primary));
    radicals.primary_radical[i] = radicals.radical_to_character_map[primary];
    radicals.index_to_radical_map[i] = radicals.index_to_radical_map[i].map(radical_to_character).unique();
  }

  Object.keys(radicals.radical_to_index_map).map(radical => {
    const character = radical_to_character(radical);

    if (character !== radical) {
      radicals.radical_to_index_map[character] = radicals.radical_to_index_map[radical];
      delete radicals.radical_to_index_map[radical];
    }
  });
  delete radicals.radical_to_character_map;
};

Meteor.startup(() => {
  // cjklib database data.
  const locale = 'C';
  const decomposition = readFile('cjklib/characterdecomposition.csv').then(getCJKLibRows);
  const glyphs = readFile('cjklib/localecharacterglyph.csv').then(getCJKLibRows).then(parseLocaleGlyphMap.bind(null, locale));
  const radicals = readFile('cjklib/kangxiradical.csv').then(getCJKLibRows);
  const radical_equivalent_characters = readFile('cjklib/radicalequivalentcharacter.csv').then(getCJKLibRows);
  const radical_isolated_characters = readFile('cjklib/kangxiradicalisolatedcharacter.csv').then(getCJKLibRows); // Jun Da's character frequency data, used only for prioritization.

  const frequencies = readFile('junda/character_frequency.tsv').then(getFrequencyRows); // Unihan database data.

  const dictionary_like_data = readFile('unihan/Unihan_DictionaryLikeData.txt').then(getUnihanRows);
  const radical_stroke_counts = readFile('unihan/Unihan_RadicalStrokeCounts.txt').then(getUnihanRows);
  const readings = readFile('unihan/Unihan_Readings.txt').then(getUnihanRows);
  const variants = readFile('unihan/Unihan_Variants.txt').then(getUnihanRows);
  cjklib.promise = Promise.all([// Per-character data.
  fillDecompositions(decomposition, glyphs, cjklib.characters.decomposition), fillDefinitions(readings, cjklib.characters.definition), fillFrequencies(frequencies, cjklib.characters.frequency), fillKangxiIndex(radical_stroke_counts, cjklib.characters.kangxi_index), fillPinyin(readings, cjklib.characters.pinyin), fillStrokeCounts(dictionary_like_data, cjklib.characters.strokes), // Per-radical data.
  fillRadicalData(locale, radicals, cjklib.radicals), fillRadicalData(locale, radical_isolated_characters, cjklib.radicals), fillRadicalToCharacterMap(locale, radical_equivalent_characters, cjklib.radicals.radical_to_character_map), fillVariants(cjklib.characters.simplified, cjklib.characters.traditional, variants), // Extract the list of characters in the GB2312 character set.
  readFile('gb2312').then(data => fillGB2312(data, cjklib.gb2312))]).then(cleanupCJKLibData);
  cjklib.promise.catch(console.error.bind(console));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"classifier.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/classifier.js                                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION;
module.link("/lib/net", {
  NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION(v) {
    NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION = v;
  }

}, 0);
let stroke_extractor;
module.link("/lib/stroke_extractor", {
  stroke_extractor(v) {
    stroke_extractor = v;
  }

}, 1);
Meteor.startup(() => {
  const input = new convnetjs.Vol(1, 1, 8
  /* feature vector dimensions */
  );
  const net = new convnetjs.Net();
  net.fromJSON(NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION);
  const weight = 0.8;

  const trainedClassifier = features => {
    input.w = features;
    const softmax = net.forward(input).w;
    return softmax[1] - softmax[0];
  };

  stroke_extractor.combinedClassifier = features => {
    return stroke_extractor.handTunedClassifier(features) + weight * trainedClassifier(features);
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"decomposition_util.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/decomposition_util.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  decomposition_util: () => decomposition_util
});
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 0);
const decomposition_util = {};
decomposition_util.ids_data = {
  '⿰': {
    label: 'Left-to-right',
    arity: 2
  },
  '⿱': {
    label: 'Top-to-bottom',
    arity: 2
  },
  '⿴': {
    label: 'Surround',
    arity: 2
  },
  '⿵': {
    label: 'Surround-from-above',
    arity: 2
  },
  '⿶': {
    label: 'Surround-from-below',
    arity: 2
  },
  '⿷': {
    label: 'Surround-from-left',
    arity: 2
  },
  '⿸': {
    label: 'Surround-from-upper-left',
    arity: 2
  },
  '⿹': {
    label: 'Surround-from-upper-right',
    arity: 2
  },
  '⿺': {
    label: 'Surround-from-lower-left',
    arity: 2
  },
  '⿻': {
    label: 'Overlaid',
    arity: 2
  },
  '⿳': {
    label: 'Top-to-middle-to-bottom',
    arity: 3
  },
  '⿲': {
    label: 'Left-to-middle-to-right',
    arity: 3
  }
};
decomposition_util.ideograph_description_characters = Object.keys(decomposition_util.ids_data);
const UNKNOWN_COMPONENT = '？';

const augmentTreeWithPathData = (tree, path) => {
  tree.path = path;
  const children = (tree.children || []).length;

  for (let i = 0; i < children; i++) {
    augmentTreeWithPathData(tree.children[i], path.concat([i]));
  }

  return tree;
};

const parseSubtree = (decomposition, index) => {
  assert(index[0] < decomposition.length, "Not enough characters in ".concat(decomposition, "."));
  const current = decomposition[index[0]];
  index[0] += 1;

  if (decomposition_util.ids_data.hasOwnProperty(current)) {
    const result = {
      type: 'compound',
      value: current,
      children: []
    };

    for (let i = 0; i < decomposition_util.ids_data[current].arity; i++) {
      result.children.push(parseSubtree(decomposition, index));
    }

    return result;
  } else if (current === UNKNOWN_COMPONENT) {
    return {
      type: 'character',
      value: '?'
    };
  } // Characters may be followed by a [x] annotation that records which variant
  // of the character to use at that position. We ignore these annotations.


  if (decomposition[index[0]] === '[') {
    assert('0123456789'.indexOf(decomposition[index[0] + 1]) >= 0);
    assert(decomposition[index[0] + 2] === ']');
    index[0] += 3;
  }

  return {
    type: 'character',
    value: current
  };
};

const serializeSubtree = (subtree, result) => {
  result[0] += subtree.value === '?' ? UNKNOWN_COMPONENT : subtree.value;
  const children = subtree.children ? subtree.children.length : 0;

  for (let i = 0; i < children; i++) {
    serializeSubtree(subtree.children[i], result);
  }
};

decomposition_util.collectComponents = (tree, result) => {
  result = result || [];

  if (tree.type === 'character' && tree.value !== '?') {
    result.push(tree.value);
  }

  for (let child of tree.children || []) {
    decomposition_util.collectComponents(child, result);
  }

  return result;
};

decomposition_util.convertDecompositionToTree = decomposition => {
  const index = [0];
  decomposition = decomposition || UNKNOWN_COMPONENT;
  const result = parseSubtree(decomposition, index);
  assert(index[0] === decomposition.length, "Too many characters in ".concat(decomposition, "."));
  return augmentTreeWithPathData(result, []);
};

decomposition_util.convertTreeToDecomposition = tree => {
  const result = [''];
  serializeSubtree(tree, result);
  return result[0];
};

decomposition_util.getSubtree = (tree, path) => {
  let subtree = tree;

  for (let index of path) {
    assert(0 <= index && index < subtree.children.length);
    subtree = subtree.children[index];
  }

  return subtree;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"glyphs.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/glyphs.js                                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Glyphs: () => Glyphs,
  Progress: () => Progress
});
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 0);
let cjklib;
module.link("/lib/cjklib", {
  cjklib(v) {
    cjklib = v;
  }

}, 1);

const defaultGlyph = character => {
  if (!character) return;
  assert(character.length === 1);
  const data = cjklib.getCharacterData(character);
  const result = {
    character: character,
    codepoint: character.codePointAt(0),
    metadata: {
      frequency: data.frequency,
      kangxi_index: data.kangxi_index
    },
    stages: {},
    simplified: data.simplified,
    traditional: data.traditional
  };

  if (data.simplified) {
    const glyph = Glyphs.get(data.simplified);
    const base = cjklib.getCharacterData(data.simplified);

    if (glyph.stages.verified) {
      const metadata = glyph.metadata;
      result.metadata.definition = metadata.definition || base.definition;
      result.metadata.pinyin = metadata.pinyin || base.pinyin;
    }
  }

  return result;
};

const Glyphs = new Mongo.Collection('glyphs');
const Progress = new Mongo.Collection('progress');

Glyphs.clearDependencies = character => {
  const stack = [character];
  const visited = {};
  visited[character] = true;

  while (stack.length > 0) {
    const current = stack.pop();
    const dependencies = Glyphs.find({
      'stages.analysis.decomposition': {
        $regex: ".*".concat(current, ".*")
      },
      'stages.order': {
        $ne: null
      }
    }, {
      character: 1
    }).fetch();
    dependencies.map(x => x.character).filter(x => !visited[x]).map(x => {
      stack.push(x);
      visited[x] = true;
    });
  }

  delete visited[character];
  Glyphs.update({
    character: {
      $in: Object.keys(visited)
    }
  }, {
    $set: {
      'stages.order': null,
      'stages.verified': null
    }
  }, {
    multi: true
  });
};

Glyphs.get = character => Glyphs.findOne({
  character: character
}) || defaultGlyph(character);

Glyphs.getAll = characters => Glyphs.find({
  character: {
    $in: characters
  }
});

Glyphs.getNext = (glyph, clause) => {
  clause = clause || {};
  const codepoint = glyph ? glyph.codepoint : undefined;

  const condition = _.extend({
    codepoint: {
      $gt: codepoint
    }
  }, clause);

  const next = Glyphs.findOne(condition, {
    sort: {
      codepoint: 1
    }
  });
  return next ? next : Glyphs.findOne(clause, {
    sort: {
      codepoint: 1
    }
  });
};

Glyphs.getNextUnverified = glyph => {
  return Glyphs.getNext(glyph, {
    'stages.verified': null
  });
};

Glyphs.getNextVerified = glyph => {
  return Glyphs.getNext(glyph, {
    'stages.verified': {
      $ne: null
    }
  });
};

Glyphs.getPrevious = (glyph, clause) => {
  clause = clause || {};
  const codepoint = glyph ? glyph.codepoint : undefined;

  const condition = _.extend({
    codepoint: {
      $lt: codepoint
    }
  }, clause);

  const previous = Glyphs.findOne(condition, {
    sort: {
      codepoint: -1
    }
  });
  return previous ? previous : Glyphs.findOne(clause, {
    sort: {
      codepoint: -1
    }
  });
};

Glyphs.getPreviousUnverified = glyph => {
  return Glyphs.getPrevious(glyph, {
    'stages.verified': null
  });
};

Glyphs.getPreviousVerified = glyph => {
  return Glyphs.getPrevious(glyph, {
    'stages.verified': {
      $ne: null
    }
  });
};

Glyphs.loadAll = characters => {
  for (let character of characters) {
    const glyph = Glyphs.get(character);

    if (!glyph.stages.verified) {
      Glyphs.upsert({
        character: glyph.character
      }, glyph);
    }
  }

  Progress.refresh();
};

Glyphs.save = glyph => {
  check(glyph.character, String);
  assert(glyph.character.length === 1);
  const current = Glyphs.get(glyph.character);

  if (current && current.stages.verified && !glyph.stages.verified) {
    Glyphs.clearDependencies(glyph.character);
  }

  Glyphs.syncDefinitionAndPinyin(glyph);

  if (glyph.stages.path && !glyph.stages.path.sentinel) {
    Glyphs.upsert({
      character: glyph.character
    }, glyph);
  } else {
    Glyphs.remove({
      character: glyph.character
    });
  }

  Progress.refresh();
};

Glyphs.syncDefinitionAndPinyin = glyph => {
  const data = cjklib.getCharacterData(glyph.character);
  const base = cjklib.getCharacterData(data.simplified || glyph.character);
  const targets = [base.character].concat(base.traditional);

  if (targets.length === 1 || '干么着复'.indexOf(targets[0]) >= 0) {
    return;
  }

  const definition = glyph.metadata.definition || data.definition;
  const pinyin = glyph.metadata.pinyin || data.pinyin;
  Glyphs.update({
    character: {
      $in: targets
    }
  }, {
    $set: {
      'metadata.definition': definition,
      'metadata.pinyin': pinyin
    }
  }, {
    multi: true
  });
};

Progress.refresh = () => {
  const total = Glyphs.find().count();
  const complete = Glyphs.find({
    'stages.verified': {
      $ne: null
    }
  }).count();
  Progress.upsert({}, {
    total: total,
    complete: complete,
    backup: false
  });
};

if (Meteor.isServer) {
  // Construct indices on the Glyphs table.
  Glyphs._ensureIndex({
    character: 1
  }, {
    unique: true
  });

  Glyphs._ensureIndex({
    codepoint: 1
  }, {
    unique: true
  });

  Glyphs._ensureIndex({
    'stages.verified': 1
  }); // Refresh the Progress counter.


  Progress.refresh(); // Register the methods above so they are available to the client.

  const methods = {};
  const method_names = ['get', 'getNext', 'getNextUnverified', 'getNextVerified', 'getPrevious', 'getPreviousUnverified', 'getPreviousVerified', 'save'];
  method_names.map(name => methods["".concat(name, "Glyph")] = Glyphs[name]);
  methods.loadAllGlyphs = Glyphs.loadAll;

  methods.saveGlyphs = glyphs => glyphs.map(Glyphs.save);

  Meteor.methods(methods); // Publish accessors that will get all glyphs in a list and get the progress.

  Meteor.publish('getAllGlyphs', Glyphs.getAll);
  Meteor.publish('getProgress', Progress.find.bind(Progress));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hungarian.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/hungarian.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Hungarian: () => Hungarian
});

// This algorithm was pulled from another one of my projects. -skishore
//   https://github.com/skishore/tesseract/blob/master/coffee/hungarian.coffee
var bind = function (fn, me) {
  return function () {
    return fn.apply(me, arguments);
  };
};

const Hungarian = function () {
  function Hungarian(cost_matrix) {
    var i, j, last_matched, len, ref, ref1, results, row, x, y;
    this.cost_matrix = cost_matrix;
    this.get_final_score = bind(this.get_final_score, this);
    this.update_labels = bind(this.update_labels, this);
    this.find_root_and_slacks = bind(this.find_root_and_slacks, this);
    this.augment = bind(this.augment, this);
    this.match = bind(this.match, this);
    this.cost = bind(this.cost, this);
    this.find_greedy_solution = bind(this.find_greedy_solution, this);
    this.reduce_cost_matrix = bind(this.reduce_cost_matrix, this);
    this.n = this.cost_matrix.length;
    ref = this.cost_matrix;

    for (i = 0, len = ref.length; i < len; i++) {
      row = ref[i];

      if (row.length !== this.n) {
        throw new Error("Malforrmed cost_matrix: " + this.cost_matrix);
      }
    }

    this.range = function () {
      results = [];

      for (var j = 0, ref1 = this.n; 0 <= ref1 ? j < ref1 : j > ref1; 0 <= ref1 ? j++ : j--) {
        results.push(j);
      }

      return results;
    }.apply(this);

    this.matched = 0;

    this.x_label = function () {
      var k, len1, ref2, results1;
      ref2 = this.range;
      results1 = [];

      for (k = 0, len1 = ref2.length; k < len1; k++) {
        x = ref2[k];
        results1.push(0);
      }

      return results1;
    }.call(this);

    this.y_label = function () {
      var k, len1, ref2, results1;
      ref2 = this.range;
      results1 = [];

      for (k = 0, len1 = ref2.length; k < len1; k++) {
        y = ref2[k];
        results1.push(0);
      }

      return results1;
    }.call(this);

    this.x_match = function () {
      var k, len1, ref2, results1;
      ref2 = this.range;
      results1 = [];

      for (k = 0, len1 = ref2.length; k < len1; k++) {
        x = ref2[k];
        results1.push(-1);
      }

      return results1;
    }.call(this);

    this.y_match = function () {
      var k, len1, ref2, results1;
      ref2 = this.range;
      results1 = [];

      for (k = 0, len1 = ref2.length; k < len1; k++) {
        y = ref2[k];
        results1.push(-1);
      }

      return results1;
    }.call(this);

    this.reduce_cost_matrix();
    this.find_greedy_solution();

    while (this.matched < this.n) {
      last_matched = this.matched;
      this.augment();

      if (this.matched <= last_matched) {
        throw new Error("Augmentation round did not increase matched!");
      }
    }
  }

  Hungarian.prototype.reduce_cost_matrix = function () {
    var i, j, k, l, len, len1, len2, len3, max_cost, ref, ref1, ref2, ref3, row, x, y;

    this.cost_matrix = function () {
      var i, len, ref, results;
      ref = this.cost_matrix;
      results = [];

      for (i = 0, len = ref.length; i < len; i++) {
        row = ref[i];
        results.push(row.slice());
      }

      return results;
    }.call(this);

    ref = this.range;

    for (i = 0, len = ref.length; i < len; i++) {
      x = ref[i];
      max_cost = Math.max.apply(0, function () {
        var j, len1, ref1, results;
        ref1 = this.range;
        results = [];

        for (j = 0, len1 = ref1.length; j < len1; j++) {
          y = ref1[j];
          results.push(this.cost_matrix[x][y]);
        }

        return results;
      }.call(this));
      ref1 = this.range;

      for (j = 0, len1 = ref1.length; j < len1; j++) {
        y = ref1[j];
        this.cost_matrix[x][y] -= max_cost;
      }

      this.x_label[x] = 0;
    }

    ref2 = this.range;

    for (k = 0, len2 = ref2.length; k < len2; k++) {
      y = ref2[k];
      max_cost = Math.max.apply(0, function () {
        var l, len3, ref3, results;
        ref3 = this.range;
        results = [];

        for (l = 0, len3 = ref3.length; l < len3; l++) {
          x = ref3[l];
          results.push(this.cost_matrix[x][y]);
        }

        return results;
      }.call(this));
      ref3 = this.range;

      for (l = 0, len3 = ref3.length; l < len3; l++) {
        x = ref3[l];
        this.cost_matrix[x][y] -= max_cost;
      }

      this.y_label[y] = 0;
    }
  };

  Hungarian.prototype.find_greedy_solution = function () {
    var i, len, ref, results, x, y;
    ref = this.range;
    results = [];

    for (i = 0, len = ref.length; i < len; i++) {
      x = ref[i];
      results.push(function () {
        var j, len1, ref1, results1;
        ref1 = this.range;
        results1 = [];

        for (j = 0, len1 = ref1.length; j < len1; j++) {
          y = ref1[j];

          if (this.x_match[x] === -1 && this.y_match[y] === -1 && this.cost(x, y) === 0) {
            this.match(x, y);
            results1.push(this.matched += 1);
          } else {
            results1.push(void 0);
          }
        }

        return results1;
      }.call(this));
    }

    return results;
  };

  Hungarian.prototype.cost = function (x, y) {
    return this.cost_matrix[x][y] - this.x_label[x] - this.y_label[y];
  };

  Hungarian.prototype.match = function (x, y) {
    this.x_match[x] = y;
    return this.y_match[y] = x;
  };

  Hungarian.prototype.augment = function () {
    var cur_x, cur_y, delta, delta_x, delta_y, i, j, len, len1, new_slack, next_y, ref, ref1, ref2, root, slack, slack_x, x, x_in_tree, y, y_parent;

    x_in_tree = function () {
      var i, len, ref, results;
      ref = this.range;
      results = [];

      for (i = 0, len = ref.length; i < len; i++) {
        x = ref[i];
        results.push(false);
      }

      return results;
    }.call(this);

    y_parent = function () {
      var i, len, ref, results;
      ref = this.range;
      results = [];

      for (i = 0, len = ref.length; i < len; i++) {
        y = ref[i];
        results.push(-1);
      }

      return results;
    }.call(this);

    ref = this.find_root_and_slacks(), root = ref[0], slack = ref[1], slack_x = ref[2];
    x_in_tree[root] = true;

    while (true) {
      delta = Infinity;
      ref1 = this.range;

      for (i = 0, len = ref1.length; i < len; i++) {
        y = ref1[i];

        if (y_parent[y] < 0 && slack[y] < delta) {
          delta = slack[y];
          delta_x = slack_x[y];
          delta_y = y;
        }
      }

      this.update_labels(delta, x_in_tree, y_parent, slack);
      y_parent[delta_y] = delta_x;

      if (this.y_match[delta_y] < 0) {
        cur_y = delta_y;

        while (cur_y >= 0) {
          cur_x = y_parent[cur_y];
          next_y = this.x_match[cur_x];
          this.match(cur_x, cur_y);
          cur_y = next_y;
        }

        this.matched += 1;
        return;
      }

      x = this.y_match[delta_y];
      x_in_tree[x] = true;
      ref2 = this.range;

      for (j = 0, len1 = ref2.length; j < len1; j++) {
        y = ref2[j];

        if (y_parent[y] < 0) {
          new_slack = -this.cost(x, y);

          if (slack[y] > new_slack) {
            slack[y] = new_slack;
            slack_x[y] = x;
          }
        }
      }
    }
  };

  Hungarian.prototype.find_root_and_slacks = function () {
    var i, len, ref, x, y;
    ref = this.range;

    for (i = 0, len = ref.length; i < len; i++) {
      x = ref[i];

      if (this.x_match[x] < 0) {
        return [x, function () {
          var j, len1, ref1, results;
          ref1 = this.range;
          results = [];

          for (j = 0, len1 = ref1.length; j < len1; j++) {
            y = ref1[j];
            results.push(-this.cost(x, y));
          }

          return results;
        }.call(this), function () {
          var j, len1, ref1, results;
          ref1 = this.range;
          results = [];

          for (j = 0, len1 = ref1.length; j < len1; j++) {
            y = ref1[j];
            results.push(x);
          }

          return results;
        }.call(this)];
      }
    }
  };

  Hungarian.prototype.update_labels = function (delta, x_in_tree, y_parent, slack) {
    var i, j, len, len1, ref, ref1, results, x, y;
    ref = this.range;

    for (i = 0, len = ref.length; i < len; i++) {
      x = ref[i];

      if (x_in_tree[x]) {
        this.x_label[x] -= delta;
      }
    }

    ref1 = this.range;
    results = [];

    for (j = 0, len1 = ref1.length; j < len1; j++) {
      y = ref1[j];

      if (y_parent[y] < 0) {
        results.push(slack[y] -= delta);
      } else {
        results.push(this.y_label[y] += delta);
      }
    }

    return results;
  };

  Hungarian.prototype.get_final_score = function (original_matrix) {
    var x;
    return Util.sum(function () {
      var i, len, ref, results;
      ref = this.range;
      results = [];

      for (i = 0, len = ref.length; i < len; i++) {
        x = ref[i];
        results.push(original_matrix[x][this.x_match[x]]);
      }

      return results;
    }.call(this));
  };

  return Hungarian;
}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"median_util.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/median_util.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  median_util: () => median_util
});
let simplify;
module.link("/lib/external/simplify/1.2.2/simplify", {
  default(v) {
    simplify = v;
  }

}, 0);
let assert, Point;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  Point(v) {
    Point = v;
  }

}, 1);
let svg;
module.link("/lib/svg", {
  svg(v) {
    svg = v;
  }

}, 2);
const size = 1024;
const rise = 900;
const num_to_match = 8;
let voronoi = undefined;

const filterMedian = (median, n) => {
  const distances = _.range(median.length - 1).map(i => Math.sqrt(Point.distance2(median[i], median[i + 1])));

  let total = 0;
  distances.map(x => total += x);
  const result = [];
  let index = 0;
  let position = median[0];
  let total_so_far = 0;

  for (let i of _.range(n - 1)) {
    const target = i * total / (n - 1);

    while (total_so_far < target) {
      const step = Math.sqrt(Point.distance2(position, median[index + 1]));

      if (total_so_far + step < target) {
        index += 1;
        position = median[index];
        total_so_far += step;
      } else {
        const t = (target - total_so_far) / step;
        position = [(1 - t) * position[0] + t * median[index + 1][0], (1 - t) * position[1] + t * median[index + 1][1]];
        total_so_far = target;
      }
    }

    result.push(Point.clone(position));
  }

  result.push(median[median.length - 1]);
  return result;
};

const findLongestShortestPath = (adjacency, vertices, node) => {
  const path = findPathFromFurthestNode(adjacency, vertices, node);
  return findPathFromFurthestNode(adjacency, vertices, path[0]);
};

const findPathFromFurthestNode = (adjacency, vertices, node, visited) => {
  visited = visited || {};
  visited[node] = true;
  let result = [];
  result.distance = 0;

  for (let neighbor of adjacency[node] || []) {
    if (!visited[neighbor]) {
      const candidate = findPathFromFurthestNode(adjacency, vertices, neighbor, visited);
      candidate.distance += Math.sqrt(Point.distance2(vertices[node], vertices[neighbor]));

      if (candidate.distance > result.distance) {
        result = candidate;
      }
    }
  }

  result.push(node);
  return result;
};

const findStrokeMedian = stroke => {
  const paths = svg.convertSVGPathToPaths(stroke);
  assert(paths.length === 1, "Got stroke with multiple loops: ".concat(stroke));
  let polygon = undefined;
  let diagram = undefined;

  for (let approximation of [16, 64]) {
    polygon = svg.getPolygonApproximation(paths[0], approximation);
    voronoi = voronoi || new Voronoi();
    const sites = polygon.map(point => ({
      x: point[0],
      y: point[1]
    }));
    const bounding_box = {
      xl: -size,
      xr: size,
      yt: -size,
      yb: size
    };

    try {
      diagram = voronoi.compute(sites, bounding_box);
      break;
    } catch (error) {
      console.error("WARNING: Voronoi computation failed at ".concat(approximation, "."));
    }
  }

  assert(diagram, 'Voronoi computation failed completely!');
  diagram.vertices.map((x, i) => {
    x.include = svg.polygonContainsPoint(polygon, [x.x, x.y]);
    x.index = i;
  });
  const vertices = diagram.vertices.map(x => [x.x, x.y].map(Math.round));
  const edges = diagram.edges.map(x => [x.va.index, x.vb.index]).filter(x => diagram.vertices[x[0]].include && diagram.vertices[x[1]].include);
  voronoi.recycle(diagram);
  assert(edges.length > 0);
  const adjacency = {};

  for (let edge of edges) {
    adjacency[edge[0]] = adjacency[edge[0]] || [];
    adjacency[edge[0]].push(edge[1]);
    adjacency[edge[1]] = adjacency[edge[1]] || [];
    adjacency[edge[1]].push(edge[0]);
  }

  const root = edges[0][0];
  const path = findLongestShortestPath(adjacency, vertices, root);
  const points = path.map(i => vertices[i]);
  const tolerance = 4;
  const simple = simplify(points.map(x => ({
    x: x[0],
    y: x[1]
  })), tolerance);
  return simple.map(x => [x.x, x.y]);
};

const normalizeForMatch = median => {
  return filterMedian(median, num_to_match).map(x => [x[0] / size, (rise - x[1]) / size]);
};

const median_util = {
  findStrokeMedian: findStrokeMedian,
  normalizeForMatch: normalizeForMatch
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"net.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/net.js                                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION: () => NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION
});
const NEURAL_NET_TRAINED_FOR_STROKE_EXTRACTION = {
  "layers": [{
    "out_depth": 8,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "input"
  }, {
    "out_depth": 8,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "fc",
    "num_inputs": 8,
    "l1_decay_mul": 0,
    "l2_decay_mul": 1,
    "filters": [{
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.3044261605666167,
        "1": -0.14834922423083324,
        "2": 0.20219401661574177,
        "3": 0.5503522616459873,
        "4": 0.45502127328350234,
        "5": 0.2625745186594936,
        "6": 0.012889731022695689,
        "7": -0.2675923800252626,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 183,
          "1": 140,
          "2": 235,
          "3": 220,
          "4": 183,
          "5": 123,
          "6": 211,
          "7": 191,
          "8": 214,
          "9": 172,
          "10": 58,
          "11": 125,
          "12": 27,
          "13": 253,
          "14": 194,
          "15": 191,
          "16": 244,
          "17": 222,
          "18": 103,
          "19": 88,
          "20": 126,
          "21": 225,
          "22": 201,
          "23": 63,
          "24": 164,
          "25": 146,
          "26": 161,
          "27": 88,
          "28": 124,
          "29": 156,
          "30": 225,
          "31": 63,
          "32": 183,
          "33": 41,
          "34": 239,
          "35": 139,
          "36": 17,
          "37": 31,
          "38": 221,
          "39": 63,
          "40": 43,
          "41": 243,
          "42": 153,
          "43": 90,
          "44": 5,
          "45": 206,
          "46": 208,
          "47": 63,
          "48": 29,
          "49": 223,
          "50": 146,
          "51": 105,
          "52": 238,
          "53": 101,
          "54": 138,
          "55": 63,
          "56": 243,
          "57": 129,
          "58": 55,
          "59": 202,
          "60": 59,
          "61": 32,
          "62": 209,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.5596639882456166,
        "1": -0.2794084096442046,
        "2": -0.1125698422524117,
        "3": -0.08850676702777903,
        "4": 0.06317601682543969,
        "5": -0.18247248453514878,
        "6": 0.2940108272454184,
        "7": 0.9861821092760742,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 121,
          "1": 113,
          "2": 200,
          "3": 115,
          "4": 196,
          "5": 232,
          "6": 225,
          "7": 191,
          "8": 251,
          "9": 140,
          "10": 105,
          "11": 207,
          "12": 211,
          "13": 225,
          "14": 209,
          "15": 191,
          "16": 206,
          "17": 111,
          "18": 253,
          "19": 142,
          "20": 96,
          "21": 209,
          "22": 188,
          "23": 191,
          "24": 143,
          "25": 231,
          "26": 219,
          "27": 37,
          "28": 97,
          "29": 168,
          "30": 182,
          "31": 191,
          "32": 166,
          "33": 36,
          "34": 40,
          "35": 174,
          "36": 77,
          "37": 44,
          "38": 176,
          "39": 63,
          "40": 69,
          "41": 201,
          "42": 191,
          "43": 36,
          "44": 66,
          "45": 91,
          "46": 199,
          "47": 191,
          "48": 54,
          "49": 24,
          "50": 236,
          "51": 201,
          "52": 18,
          "53": 209,
          "54": 210,
          "55": 63,
          "56": 147,
          "57": 182,
          "58": 103,
          "59": 200,
          "60": 205,
          "61": 142,
          "62": 239,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.4293240703659736,
        "1": 0.48799666353430715,
        "2": -0.011221411170891243,
        "3": 0.016759551491042825,
        "4": -0.10178241490300455,
        "5": -0.05938636975897821,
        "6": -0.7140555216543757,
        "7": -0.13033896328056724,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 157,
          "1": 224,
          "2": 102,
          "3": 170,
          "4": 11,
          "5": 122,
          "6": 219,
          "7": 191,
          "8": 60,
          "9": 247,
          "10": 155,
          "11": 91,
          "12": 86,
          "13": 59,
          "14": 223,
          "15": 63,
          "16": 118,
          "17": 154,
          "18": 243,
          "19": 79,
          "20": 64,
          "21": 251,
          "22": 134,
          "23": 191,
          "24": 71,
          "25": 217,
          "26": 50,
          "27": 118,
          "28": 106,
          "29": 41,
          "30": 145,
          "31": 63,
          "32": 136,
          "33": 249,
          "34": 80,
          "35": 143,
          "36": 105,
          "37": 14,
          "38": 186,
          "39": 191,
          "40": 152,
          "41": 205,
          "42": 226,
          "43": 231,
          "44": 227,
          "45": 103,
          "46": 174,
          "47": 191,
          "48": 151,
          "49": 20,
          "50": 33,
          "51": 247,
          "52": 138,
          "53": 217,
          "54": 230,
          "55": 191,
          "56": 91,
          "57": 160,
          "58": 87,
          "59": 120,
          "60": 242,
          "61": 174,
          "62": 192,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.004132243204399921,
        "1": 0.31644328046013015,
        "2": -0.4246219644532225,
        "3": 0.021888719524958525,
        "4": -0.5736499683744954,
        "5": -0.1285778687631867,
        "6": -0.17633637428199953,
        "7": -0.09184800562849475,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 192,
          "1": 147,
          "2": 192,
          "3": 150,
          "4": 248,
          "5": 236,
          "6": 112,
          "7": 63,
          "8": 174,
          "9": 95,
          "10": 39,
          "11": 81,
          "12": 155,
          "13": 64,
          "14": 212,
          "15": 63,
          "16": 243,
          "17": 89,
          "18": 159,
          "19": 154,
          "20": 1,
          "21": 45,
          "22": 219,
          "23": 191,
          "24": 33,
          "25": 71,
          "26": 11,
          "27": 26,
          "28": 255,
          "29": 105,
          "30": 150,
          "31": 63,
          "32": 245,
          "33": 162,
          "34": 176,
          "35": 45,
          "36": 87,
          "37": 91,
          "38": 226,
          "39": 191,
          "40": 225,
          "41": 227,
          "42": 169,
          "43": 86,
          "44": 61,
          "45": 117,
          "46": 192,
          "47": 191,
          "48": 171,
          "49": 117,
          "50": 81,
          "51": 184,
          "52": 48,
          "53": 146,
          "54": 198,
          "55": 191,
          "56": 195,
          "57": 144,
          "58": 96,
          "59": 212,
          "60": 89,
          "61": 131,
          "62": 183,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.09461892805990832,
        "1": -0.6329745552844204,
        "2": -0.7923676394624737,
        "3": -0.08606445900172546,
        "4": 0.11603124920286288,
        "5": 0.029252054814320392,
        "6": -0.03747907757038657,
        "7": -0.6005289047981558,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 238,
          "1": 145,
          "2": 153,
          "3": 49,
          "4": 242,
          "5": 56,
          "6": 184,
          "7": 63,
          "8": 2,
          "9": 178,
          "10": 196,
          "11": 218,
          "12": 83,
          "13": 65,
          "14": 228,
          "15": 191,
          "16": 40,
          "17": 205,
          "18": 60,
          "19": 97,
          "20": 19,
          "21": 91,
          "22": 233,
          "23": 191,
          "24": 226,
          "25": 165,
          "26": 194,
          "27": 4,
          "28": 82,
          "29": 8,
          "30": 182,
          "31": 191,
          "32": 39,
          "33": 236,
          "34": 163,
          "35": 84,
          "36": 57,
          "37": 180,
          "38": 189,
          "39": 63,
          "40": 169,
          "41": 190,
          "42": 18,
          "43": 43,
          "44": 64,
          "45": 244,
          "46": 157,
          "47": 63,
          "48": 220,
          "49": 234,
          "50": 229,
          "51": 40,
          "52": 117,
          "53": 48,
          "54": 163,
          "55": 191,
          "56": 21,
          "57": 37,
          "58": 205,
          "59": 100,
          "60": 136,
          "61": 55,
          "62": 227,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.42277438855180405,
        "1": 1.4138688143060145,
        "2": -0.3778547415032166,
        "3": -0.012023049493322651,
        "4": 0.11825224526479829,
        "5": -0.4434819918251306,
        "6": -0.6772974432572635,
        "7": -0.14741163123927092,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 56,
          "1": 166,
          "2": 26,
          "3": 79,
          "4": 188,
          "5": 14,
          "6": 219,
          "7": 63,
          "8": 68,
          "9": 117,
          "10": 228,
          "11": 231,
          "12": 52,
          "13": 159,
          "14": 246,
          "15": 63,
          "16": 53,
          "17": 69,
          "18": 89,
          "19": 167,
          "20": 197,
          "21": 46,
          "22": 216,
          "23": 191,
          "24": 118,
          "25": 224,
          "26": 249,
          "27": 98,
          "28": 138,
          "29": 159,
          "30": 136,
          "31": 191,
          "32": 225,
          "33": 67,
          "34": 23,
          "35": 118,
          "36": 199,
          "37": 69,
          "38": 190,
          "39": 63,
          "40": 126,
          "41": 63,
          "42": 208,
          "43": 74,
          "44": 2,
          "45": 98,
          "46": 220,
          "47": 191,
          "48": 35,
          "49": 138,
          "50": 14,
          "51": 176,
          "52": 107,
          "53": 172,
          "54": 229,
          "55": 191,
          "56": 204,
          "57": 128,
          "58": 156,
          "59": 99,
          "60": 98,
          "61": 222,
          "62": 194,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 1.1993670420146874,
        "1": 0.3223431096192715,
        "2": -0.36861400047798204,
        "3": -0.08038294233717612,
        "4": 0.2711210775205418,
        "5": 0.42879169827918595,
        "6": 0.6376085656983045,
        "7": 0.03756028253259824,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 72,
          "1": 167,
          "2": 213,
          "3": 126,
          "4": 155,
          "5": 48,
          "6": 243,
          "7": 63,
          "8": 56,
          "9": 247,
          "10": 121,
          "11": 254,
          "12": 68,
          "13": 161,
          "14": 212,
          "15": 63,
          "16": 111,
          "17": 164,
          "18": 57,
          "19": 45,
          "20": 95,
          "21": 151,
          "22": 215,
          "23": 191,
          "24": 167,
          "25": 146,
          "26": 126,
          "27": 252,
          "28": 249,
          "29": 147,
          "30": 180,
          "31": 191,
          "32": 158,
          "33": 63,
          "34": 77,
          "35": 56,
          "36": 12,
          "37": 90,
          "38": 209,
          "39": 63,
          "40": 32,
          "41": 242,
          "42": 57,
          "43": 188,
          "44": 82,
          "45": 113,
          "46": 219,
          "47": 63,
          "48": 161,
          "49": 91,
          "50": 42,
          "51": 20,
          "52": 74,
          "53": 103,
          "54": 228,
          "55": 63,
          "56": 127,
          "57": 73,
          "58": 54,
          "59": 242,
          "60": 25,
          "61": 59,
          "62": 163,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.13967402583430144,
        "1": -0.11357850366802424,
        "2": -0.5746610827627967,
        "3": -0.5717582875884522,
        "4": -0.1898576928922138,
        "5": -0.18657398702306335,
        "6": 0.7165884005339106,
        "7": -0.6224249593531741,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 200,
          "1": 140,
          "2": 135,
          "3": 166,
          "4": 214,
          "5": 224,
          "6": 193,
          "7": 63,
          "8": 72,
          "9": 100,
          "10": 200,
          "11": 22,
          "12": 123,
          "13": 19,
          "14": 189,
          "15": 191,
          "16": 82,
          "17": 1,
          "18": 152,
          "19": 163,
          "20": 159,
          "21": 99,
          "22": 226,
          "23": 191,
          "24": 132,
          "25": 25,
          "26": 77,
          "27": 9,
          "28": 216,
          "29": 75,
          "30": 226,
          "31": 191,
          "32": 97,
          "33": 219,
          "34": 238,
          "35": 194,
          "36": 65,
          "37": 77,
          "38": 200,
          "39": 191,
          "40": 127,
          "41": 49,
          "42": 70,
          "43": 10,
          "44": 168,
          "45": 225,
          "46": 199,
          "47": 191,
          "48": 23,
          "49": 142,
          "50": 31,
          "51": 204,
          "52": 74,
          "53": 238,
          "54": 230,
          "55": 63,
          "56": 54,
          "57": 90,
          "58": 148,
          "59": 191,
          "60": 231,
          "61": 234,
          "62": 227,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }],
    "biases": {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.2562049254190115,
        "1": -0.5455393081802729,
        "2": 0.10903726980643962,
        "3": -0.16355954769541572,
        "4": 0.08992117884673975,
        "5": 0.5185622512844232,
        "6": -0.46073562437071663,
        "7": 0.38509647559811017,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 232,
          "1": 235,
          "2": 239,
          "3": 87,
          "4": 169,
          "5": 101,
          "6": 208,
          "7": 63,
          "8": 182,
          "9": 34,
          "10": 234,
          "11": 217,
          "12": 14,
          "13": 117,
          "14": 225,
          "15": 191,
          "16": 27,
          "17": 33,
          "18": 221,
          "19": 211,
          "20": 221,
          "21": 233,
          "22": 187,
          "23": 63,
          "24": 73,
          "25": 114,
          "26": 38,
          "27": 238,
          "28": 132,
          "29": 239,
          "30": 196,
          "31": 191,
          "32": 206,
          "33": 80,
          "34": 93,
          "35": 10,
          "36": 19,
          "37": 5,
          "38": 183,
          "39": 63,
          "40": 140,
          "41": 157,
          "42": 198,
          "43": 220,
          "44": 15,
          "45": 152,
          "46": 224,
          "47": 63,
          "48": 65,
          "49": 143,
          "50": 177,
          "51": 69,
          "52": 177,
          "53": 124,
          "54": 221,
          "55": 191,
          "56": 113,
          "57": 235,
          "58": 31,
          "59": 176,
          "60": 107,
          "61": 165,
          "62": 216,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }
  }, {
    "out_depth": 8,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "tanh"
  }, {
    "out_depth": 8,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "fc",
    "num_inputs": 8,
    "l1_decay_mul": 0,
    "l2_decay_mul": 1,
    "filters": [{
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.38832824611419614,
        "1": 0.5331207710690121,
        "2": -0.16958013252471874,
        "3": -0.03763800230330026,
        "4": -0.30277152771651167,
        "5": -0.03899235791753754,
        "6": 0.4840579241426027,
        "7": -0.5416342032769544,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 208,
          "1": 26,
          "2": 75,
          "3": 183,
          "4": 94,
          "5": 218,
          "6": 216,
          "7": 191,
          "8": 37,
          "9": 233,
          "10": 145,
          "11": 74,
          "12": 83,
          "13": 15,
          "14": 225,
          "15": 63,
          "16": 149,
          "17": 92,
          "18": 159,
          "19": 65,
          "20": 205,
          "21": 180,
          "22": 197,
          "23": 191,
          "24": 29,
          "25": 122,
          "26": 245,
          "27": 201,
          "28": 73,
          "29": 69,
          "30": 163,
          "31": 191,
          "32": 183,
          "33": 243,
          "34": 108,
          "35": 212,
          "36": 155,
          "37": 96,
          "38": 211,
          "39": 191,
          "40": 226,
          "41": 120,
          "42": 25,
          "43": 108,
          "44": 206,
          "45": 246,
          "46": 163,
          "47": 191,
          "48": 229,
          "49": 249,
          "50": 99,
          "51": 22,
          "52": 206,
          "53": 250,
          "54": 222,
          "55": 63,
          "56": 111,
          "57": 6,
          "58": 175,
          "59": 64,
          "60": 17,
          "61": 85,
          "62": 225,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.11439407632270632,
        "1": -1.2819890886327963,
        "2": 0.14634106395136273,
        "3": 0.14304395032875164,
        "4": 0.2297327647600765,
        "5": 0.4348725634157742,
        "6": -0.26416425812412686,
        "7": 0.058453811796899485,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 196,
          "1": 130,
          "2": 169,
          "3": 32,
          "4": 238,
          "5": 72,
          "6": 189,
          "7": 191,
          "8": 119,
          "9": 27,
          "10": 152,
          "11": 253,
          "12": 6,
          "13": 131,
          "14": 244,
          "15": 191,
          "16": 57,
          "17": 209,
          "18": 221,
          "19": 209,
          "20": 77,
          "21": 187,
          "22": 194,
          "23": 63,
          "24": 205,
          "25": 188,
          "26": 70,
          "27": 160,
          "28": 67,
          "29": 79,
          "30": 194,
          "31": 63,
          "32": 147,
          "33": 106,
          "34": 187,
          "35": 27,
          "36": 226,
          "37": 103,
          "38": 205,
          "39": 63,
          "40": 148,
          "41": 25,
          "42": 115,
          "43": 187,
          "44": 243,
          "45": 212,
          "46": 219,
          "47": 63,
          "48": 21,
          "49": 147,
          "50": 90,
          "51": 52,
          "52": 17,
          "53": 232,
          "54": 208,
          "55": 191,
          "56": 180,
          "57": 10,
          "58": 253,
          "59": 115,
          "60": 168,
          "61": 237,
          "62": 173,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.1406881916489247,
        "1": 0.9405578660965507,
        "2": 0.004901858025518234,
        "3": -0.2326645372062353,
        "4": -0.21448421502002576,
        "5": -1.0893898213683164,
        "6": -0.3778283066766321,
        "7": -0.37747385299064595,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 178,
          "1": 98,
          "2": 8,
          "3": 23,
          "4": 18,
          "5": 2,
          "6": 194,
          "7": 191,
          "8": 221,
          "9": 42,
          "10": 92,
          "11": 207,
          "12": 12,
          "13": 25,
          "14": 238,
          "15": 63,
          "16": 254,
          "17": 58,
          "18": 140,
          "19": 126,
          "20": 248,
          "21": 19,
          "22": 116,
          "23": 63,
          "24": 82,
          "25": 176,
          "26": 30,
          "27": 153,
          "28": 243,
          "29": 199,
          "30": 205,
          "31": 191,
          "32": 139,
          "33": 118,
          "34": 130,
          "35": 0,
          "36": 56,
          "37": 116,
          "38": 203,
          "39": 191,
          "40": 137,
          "41": 244,
          "42": 117,
          "43": 5,
          "44": 36,
          "45": 110,
          "46": 241,
          "47": 191,
          "48": 231,
          "49": 119,
          "50": 43,
          "51": 199,
          "52": 86,
          "53": 46,
          "54": 216,
          "55": 191,
          "56": 234,
          "57": 39,
          "58": 108,
          "59": 23,
          "60": 136,
          "61": 40,
          "62": 216,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.3710384010689571,
        "1": -0.6190881680177,
        "2": 0.41162941225861827,
        "3": -0.543618129725223,
        "4": 0.6163330090258718,
        "5": 0.7949110806898168,
        "6": -0.7884090007104152,
        "7": 0.38478012561877223,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 239,
          "1": 174,
          "2": 137,
          "3": 217,
          "4": 23,
          "5": 191,
          "6": 215,
          "7": 63,
          "8": 25,
          "9": 64,
          "10": 95,
          "11": 253,
          "12": 145,
          "13": 207,
          "14": 227,
          "15": 191,
          "16": 230,
          "17": 60,
          "18": 238,
          "19": 227,
          "20": 34,
          "21": 88,
          "22": 218,
          "23": 63,
          "24": 49,
          "25": 215,
          "26": 21,
          "27": 217,
          "28": 81,
          "29": 101,
          "30": 225,
          "31": 191,
          "32": 186,
          "33": 195,
          "34": 166,
          "35": 0,
          "36": 0,
          "37": 185,
          "38": 227,
          "39": 63,
          "40": 18,
          "41": 78,
          "42": 217,
          "43": 92,
          "44": 233,
          "45": 111,
          "46": 233,
          "47": 63,
          "48": 118,
          "49": 139,
          "50": 61,
          "51": 131,
          "52": 165,
          "53": 58,
          "54": 233,
          "55": 191,
          "56": 205,
          "57": 188,
          "58": 235,
          "59": 209,
          "60": 60,
          "61": 160,
          "62": 216,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.2740006754893999,
        "1": -0.8544168596508195,
        "2": 0.07387149782516346,
        "3": -0.18854684467760982,
        "4": 0.5306163852118577,
        "5": 0.5217519355682549,
        "6": -0.16672917486486497,
        "7": 0.23335567893271977,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 182,
          "1": 196,
          "2": 19,
          "3": 33,
          "4": 58,
          "5": 137,
          "6": 209,
          "7": 63,
          "8": 200,
          "9": 61,
          "10": 171,
          "11": 6,
          "12": 98,
          "13": 87,
          "14": 235,
          "15": 191,
          "16": 41,
          "17": 255,
          "18": 67,
          "19": 19,
          "20": 62,
          "21": 233,
          "22": 178,
          "23": 63,
          "24": 243,
          "25": 192,
          "26": 211,
          "27": 145,
          "28": 77,
          "29": 34,
          "30": 200,
          "31": 191,
          "32": 4,
          "33": 157,
          "34": 166,
          "35": 54,
          "36": 207,
          "37": 250,
          "38": 224,
          "39": 63,
          "40": 200,
          "41": 125,
          "42": 124,
          "43": 29,
          "44": 49,
          "45": 178,
          "46": 224,
          "47": 63,
          "48": 97,
          "49": 181,
          "50": 170,
          "51": 176,
          "52": 97,
          "53": 87,
          "54": 197,
          "55": 191,
          "56": 79,
          "57": 11,
          "58": 173,
          "59": 80,
          "60": 153,
          "61": 222,
          "62": 205,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.1906626781357325,
        "1": 0.4709381707241033,
        "2": 0.24160919622692853,
        "3": 0.6311757769867091,
        "4": -0.3203913931138507,
        "5": -0.5879387228046364,
        "6": 0.39346084678734317,
        "7": -0.3561015790308374,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 78,
          "1": 147,
          "2": 148,
          "3": 119,
          "4": 162,
          "5": 103,
          "6": 200,
          "7": 191,
          "8": 123,
          "9": 173,
          "10": 108,
          "11": 218,
          "12": 217,
          "13": 35,
          "14": 222,
          "15": 63,
          "16": 131,
          "17": 143,
          "18": 26,
          "19": 214,
          "20": 12,
          "21": 237,
          "22": 206,
          "23": 63,
          "24": 5,
          "25": 238,
          "26": 5,
          "27": 139,
          "28": 151,
          "29": 50,
          "30": 228,
          "31": 63,
          "32": 240,
          "33": 1,
          "34": 214,
          "35": 230,
          "36": 74,
          "37": 129,
          "38": 212,
          "39": 191,
          "40": 252,
          "41": 238,
          "42": 79,
          "43": 222,
          "44": 100,
          "45": 208,
          "46": 226,
          "47": 191,
          "48": 154,
          "49": 81,
          "50": 77,
          "51": 103,
          "52": 118,
          "53": 46,
          "54": 217,
          "55": 63,
          "56": 50,
          "57": 115,
          "58": 255,
          "59": 70,
          "60": 94,
          "61": 202,
          "62": 214,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -0.052332119821916476,
        "1": 0.5000167096781711,
        "2": 0.26266568911062693,
        "3": 0.26506535297601835,
        "4": -0.25463287277049923,
        "5": 0.08282611179305391,
        "6": 0.9396179911813585,
        "7": -0.5542899781400487,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 102,
          "1": 186,
          "2": 84,
          "3": 142,
          "4": 70,
          "5": 203,
          "6": 170,
          "7": 191,
          "8": 66,
          "9": 174,
          "10": 240,
          "11": 10,
          "12": 35,
          "13": 0,
          "14": 224,
          "15": 63,
          "16": 136,
          "17": 187,
          "18": 32,
          "19": 192,
          "20": 131,
          "21": 207,
          "22": 208,
          "23": 63,
          "24": 165,
          "25": 107,
          "26": 149,
          "27": 171,
          "28": 212,
          "29": 246,
          "30": 208,
          "31": 63,
          "32": 237,
          "33": 74,
          "34": 66,
          "35": 173,
          "36": 231,
          "37": 75,
          "38": 208,
          "39": 191,
          "40": 10,
          "41": 240,
          "42": 103,
          "43": 145,
          "44": 23,
          "45": 52,
          "46": 181,
          "47": 63,
          "48": 200,
          "49": 109,
          "50": 219,
          "51": 191,
          "52": 89,
          "53": 17,
          "54": 238,
          "55": 63,
          "56": 7,
          "57": 150,
          "58": 19,
          "59": 86,
          "60": 190,
          "61": 188,
          "62": 225,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.5183573300646674,
        "1": -0.8084279309930922,
        "2": 0.17564116878772115,
        "3": -0.4120839198806116,
        "4": 0.5760434856452349,
        "5": 0.35578634913953205,
        "6": -0.3705548599822078,
        "7": 0.44300177295886806,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 195,
          "1": 160,
          "2": 136,
          "3": 28,
          "4": 98,
          "5": 150,
          "6": 224,
          "7": 63,
          "8": 142,
          "9": 57,
          "10": 153,
          "11": 64,
          "12": 164,
          "13": 222,
          "14": 233,
          "15": 191,
          "16": 27,
          "17": 34,
          "18": 227,
          "19": 233,
          "20": 104,
          "21": 123,
          "22": 198,
          "23": 63,
          "24": 191,
          "25": 15,
          "26": 198,
          "27": 59,
          "28": 149,
          "29": 95,
          "30": 218,
          "31": 191,
          "32": 179,
          "33": 113,
          "34": 125,
          "35": 191,
          "36": 242,
          "37": 110,
          "38": 226,
          "39": 63,
          "40": 199,
          "41": 184,
          "42": 122,
          "43": 27,
          "44": 52,
          "45": 197,
          "46": 214,
          "47": 63,
          "48": 21,
          "49": 214,
          "50": 63,
          "51": 187,
          "52": 43,
          "53": 183,
          "54": 215,
          "55": 191,
          "56": 45,
          "57": 106,
          "58": 187,
          "59": 27,
          "60": 36,
          "61": 90,
          "62": 220,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }],
    "biases": {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 0.013187463476726313,
        "1": -0.007630520124428615,
        "2": -0.27144190488489406,
        "3": -0.30429595726968894,
        "4": -0.05004981783245224,
        "5": 0.07003641753819947,
        "6": -0.09093686693747323,
        "7": 0.05757614475366814,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 83,
          "1": 65,
          "2": 204,
          "3": 98,
          "4": 7,
          "5": 2,
          "6": 139,
          "7": 63,
          "8": 200,
          "9": 155,
          "10": 44,
          "11": 38,
          "12": 46,
          "13": 65,
          "14": 127,
          "15": 191,
          "16": 234,
          "17": 166,
          "18": 15,
          "19": 222,
          "20": 77,
          "21": 95,
          "22": 209,
          "23": 191,
          "24": 30,
          "25": 208,
          "26": 49,
          "27": 192,
          "28": 149,
          "29": 121,
          "30": 211,
          "31": 191,
          "32": 36,
          "33": 180,
          "34": 133,
          "35": 53,
          "36": 33,
          "37": 160,
          "38": 169,
          "39": 191,
          "40": 122,
          "41": 6,
          "42": 219,
          "43": 26,
          "44": 232,
          "45": 237,
          "46": 177,
          "47": 63,
          "48": 77,
          "49": 69,
          "50": 127,
          "51": 117,
          "52": 163,
          "53": 71,
          "54": 183,
          "55": 191,
          "56": 50,
          "57": 88,
          "58": 126,
          "59": 213,
          "60": 158,
          "61": 122,
          "62": 173,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }
  }, {
    "out_depth": 8,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "tanh"
  }, {
    "out_depth": 2,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "fc",
    "num_inputs": 8,
    "l1_decay_mul": 0,
    "l2_decay_mul": 1,
    "filters": [{
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": 1.0172730016739508,
        "1": -0.13221137581570833,
        "2": 0.9395466221657038,
        "3": -1.6251860610880569,
        "4": -1.2388309137808013,
        "5": 0.8533890654636394,
        "6": 0.7649152131278658,
        "7": -1.7907313802649556,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 167,
          "1": 177,
          "2": 20,
          "3": 14,
          "4": 192,
          "5": 70,
          "6": 240,
          "7": 63,
          "8": 37,
          "9": 209,
          "10": 164,
          "11": 103,
          "12": 77,
          "13": 236,
          "14": 192,
          "15": 191,
          "16": 96,
          "17": 155,
          "18": 232,
          "19": 19,
          "20": 196,
          "21": 16,
          "22": 238,
          "23": 63,
          "24": 185,
          "25": 156,
          "26": 100,
          "27": 25,
          "28": 195,
          "29": 0,
          "30": 250,
          "31": 191,
          "32": 188,
          "33": 101,
          "34": 63,
          "35": 93,
          "36": 64,
          "37": 210,
          "38": 243,
          "39": 191,
          "40": 76,
          "41": 197,
          "42": 221,
          "43": 149,
          "44": 246,
          "45": 78,
          "46": 235,
          "47": 63,
          "48": 16,
          "49": 27,
          "50": 19,
          "51": 120,
          "52": 47,
          "53": 122,
          "54": 232,
          "55": 63,
          "56": 244,
          "57": 138,
          "58": 162,
          "59": 242,
          "60": 213,
          "61": 166,
          "62": 252,
          "63": 191,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }, {
      "sx": 1,
      "sy": 1,
      "depth": 8,
      "w": {
        "0": -1.252270530582403,
        "1": 0.7285270999976606,
        "2": 0.023798576828390303,
        "3": 1.064484519454345,
        "4": 0.246286754788085,
        "5": -1.2474340354253382,
        "6": -0.3051491951725839,
        "7": 1.4177785201450572,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 43,
          "1": 137,
          "2": 233,
          "3": 210,
          "4": 76,
          "5": 9,
          "6": 244,
          "7": 191,
          "8": 105,
          "9": 171,
          "10": 151,
          "11": 16,
          "12": 24,
          "13": 80,
          "14": 231,
          "15": 63,
          "16": 172,
          "17": 87,
          "18": 173,
          "19": 116,
          "20": 167,
          "21": 94,
          "22": 152,
          "23": 63,
          "24": 154,
          "25": 121,
          "26": 98,
          "27": 235,
          "28": 32,
          "29": 8,
          "30": 241,
          "31": 63,
          "32": 163,
          "33": 91,
          "34": 160,
          "35": 10,
          "36": 83,
          "37": 134,
          "38": 207,
          "39": 63,
          "40": 43,
          "41": 27,
          "42": 33,
          "43": 100,
          "44": 125,
          "45": 245,
          "46": 243,
          "47": 191,
          "48": 158,
          "49": 175,
          "50": 106,
          "51": 125,
          "52": 144,
          "53": 135,
          "54": 211,
          "55": 191,
          "56": 165,
          "57": 232,
          "58": 143,
          "59": 135,
          "60": 56,
          "61": 175,
          "62": 246,
          "63": 63,
          "byteLength": 64
        },
        "length": 8,
        "byteOffset": 0,
        "byteLength": 64
      }
    }],
    "biases": {
      "sx": 1,
      "sy": 1,
      "depth": 2,
      "w": {
        "0": -0.008745691297802017,
        "1": 0.00874569129780175,
        "BYTES_PER_ELEMENT": 8,
        "buffer": {
          "0": 71,
          "1": 251,
          "2": 214,
          "3": 208,
          "4": 66,
          "5": 233,
          "6": 129,
          "7": 191,
          "8": 173,
          "9": 250,
          "10": 214,
          "11": 208,
          "12": 66,
          "13": 233,
          "14": 129,
          "15": 63,
          "byteLength": 16
        },
        "length": 2,
        "byteOffset": 0,
        "byteLength": 16
      }
    }
  }, {
    "out_depth": 2,
    "out_sx": 1,
    "out_sy": 1,
    "layer_type": "softmax",
    "num_inputs": 2
  }]
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pinyin_util.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/pinyin_util.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  pinyin_util: () => pinyin_util
});
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 0);
const vowel_to_tone = {
  0: "aeiouü",
  1: "āēīōūǖ",
  2: "áéíóúǘ",
  3: "ǎěǐǒǔǚ",
  4: "àèìòùǜ"
};

const tokenSet = tokens => {
  const result = {};
  tokens.split(' ').map(x => result[x] = true);
  return result;
};

const consonants = tokenSet('b p m f d t n l g k h j q x zh ch sh r z c s y w');
const vowels = tokenSet('a ai an ang ao e ei en eng er i ia ian iang iao ie ' + 'in ing io iong iu o ong ou u ua uai uan uang ue ui ' + 'un uo v van vn');
const two_syllables = tokenSet('ia ian iang iao ie io iong iu ua uai uan ' + 'uang ue ui uo van');
const pinyin_util = {};

pinyin_util.dropTones = (pinyin, append_number) => {
  for (let i = 0; i < pinyin.length; i++) {
    for (let option = 1; option <= 4; option++) {
      const index = vowel_to_tone[option].indexOf(pinyin[i]);

      if (index >= 0) {
        const toneless = 'aeiouv'[index];
        pinyin = pinyin.substr(0, i) + toneless + pinyin.substr(i + 1);

        if (append_number) {
          return "".concat(pinyin).concat(option);
        }
      }
    }
  }

  return pinyin;
};

pinyin_util.numberedPinyinToTonePinyin = numbered => {
  assert(numbered && numbered === numbered.toLowerCase());
  let tone = 0;

  if ('01234'.indexOf(numbered[numbered.length - 1]) >= 0) {
    tone = parseInt(numbered[numbered.length - 1], 10);
    numbered = numbered.substr(0, numbered.length - 1);
  }

  for (let i = 0; i < numbered.length; i++) {
    for (let option = 1; option <= 4; option++) {
      const index = vowel_to_tone[option].indexOf(numbered[i]);

      if (index >= 0) {
        tone = option;
        const toneless = 'aeiouv'[index];
        numbered = numbered.substr(0, i) + toneless + numbered.substr(i + 1);
      }
    }
  }

  let consonant = '';

  for (let i = 1; i < numbered.length; i++) {
    const candidate = numbered.substr(0, i);

    if (consonants[candidate]) {
      consonant = candidate;
    } else {
      break;
    }
  }

  let vowel = numbered.substr(consonant.length);
  assert((!consonant || consonants[consonant]) && vowels[vowel]);

  if (two_syllables[vowel]) {
    const index = 'aeiouv'.indexOf(vowel[1]);
    vowel = vowel[0] + vowel_to_tone[tone][index] + vowel.substr(2);
  } else {
    const index = 'aeiouv'.indexOf(vowel[0]);
    assert(index >= 0);
    vowel = vowel_to_tone[tone][index] + vowel.substr(1);
  }

  return consonant + vowel.replace('v', 'ü');
};

pinyin_util.tonePinyinToNumberedPinyin = tone => {
  return pinyin_util.dropTones(tone, true
  /* append_number */
  );
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stroke_extractor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/stroke_extractor.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  stroke_extractor: () => stroke_extractor
});
let assert, Angle, Point;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  Angle(v) {
    Angle = v;
  },

  Point(v) {
    Point = v;
  }

}, 0);
let Hungarian;
module.link("/lib/hungarian", {
  Hungarian(v) {
    Hungarian = v;
  }

}, 1);
let svg;
module.link("/lib/svg", {
  svg(v) {
    svg = v;
  }

}, 2);
const MAX_BRIDGE_DISTANCE = 64;
const MIN_CORNER_ANGLE = 0.1 * Math.PI;
const MIN_CORNER_TANGENT_DISTANCE = 4;
const REVERSAL_PENALTY = 0.5; // Errors out if the bridges are invalid in some gross way.

const checkBridge = bridge => {
  assert(Point.valid(bridge[0]) && Point.valid(bridge[1]));
  assert(!Point.equal(bridge[0], bridge[1]));
}; // Returns the list of bridges on the path with the given endpoints. We strip
// nearly all of the metadata out of this list to make it easy to hand-correct.
// The list that we return is simply a list of pairs of points.


const getBridges = (endpoints, classifier) => {
  const result = [];
  const corners = endpoints.filter(x => x.corner);
  const matching = matchCorners(corners, classifier);

  for (let i = 0; i < corners.length; i++) {
    const j = matching[i];

    if (j <= i && matching[j] === i) {
      continue;
    }

    result.push([Point.clone(corners[i].point), Point.clone(corners[j].point)]);
  }

  result.map(checkBridge);
  return result;
}; // Returns a list of angle and distance features between two corners.


const getFeatures = (ins, out) => {
  const diff = Point.subtract(out.point, ins.point);
  const trivial = Point.equal(diff, [0, 0]);
  const angle = Math.atan2(diff[1], diff[0]);
  const distance = Math.sqrt(Point.distance2(out.point, ins.point));
  return [Angle.subtract(angle, ins.angles[0]), Angle.subtract(out.angles[1], angle), Angle.subtract(ins.angles[1], angle), Angle.subtract(angle, out.angles[0]), Angle.subtract(ins.angles[1], ins.angles[0]), Angle.subtract(out.angles[1], out.angles[0]), trivial ? 1 : 0, distance / MAX_BRIDGE_DISTANCE];
}; // A hand-tuned classifier that uses the features above to return a score for
// connecting two corners by a bridge. This classifier throws out most data.


const handTunedClassifier = features => {
  if (features[6] > 0) {
    return -Angle.penalty(features[4]);
  }

  let angle_penalty = Angle.penalty(features[0]) + Angle.penalty(features[1]);
  const distance_penalty = features[7];

  if (features[0] > 0 && features[1] > 0 && features[2] + features[3] < -0.5 * Math.PI) {
    angle_penalty = angle_penalty / 16;
  }

  return -(angle_penalty + distance_penalty);
}; // Takes a list of corners and returns a bipartite matching between them.
// If matching[i] === j, then corners[i] is matched with corners[j] - that is,
// we should construct a bridge from corners[i].point to corners[j].point.


const matchCorners = (corners, classifier) => {
  const matrix = [];

  for (let i = 0; i < corners.length; i++) {
    matrix.push([]);

    for (let j = 0; j < corners.length; j++) {
      matrix[i].push(scoreCorners(corners[i], corners[j], classifier));
    }
  }

  for (let i = 0; i < corners.length; i++) {
    for (let j = 0; j < corners.length; j++) {
      const reversed_score = matrix[j][i] - REVERSAL_PENALTY;

      if (reversed_score > matrix[i][j]) {
        matrix[i][j] = reversed_score;
      }
    }
  }

  return new Hungarian(matrix).x_match;
}; // Takes two corners and returns the score assigned to constructing a bridge
// from one corner to the other. The score is directed: the bridge from ins to
// out may be weighted higher than from out to ins.


const scoreCorners = (ins, out, classifier) => {
  return classifier(getFeatures(ins, out));
}; // Stores angle and distance metadata around an SVG path segment's start point.
// This endpoint may be a 'corner', which is true if the path bends sharply in
// the negative (clockwise) direction at that point.


function Endpoint(paths, index) {
  this.index = index;
  const path = paths[index[0]];
  const n = path.length;
  this.indices = [[index[0], (index[1] + n - 1) % n], index];
  this.segments = [path[(index[1] + n - 1) % n], path[index[1]]];
  this.point = this.segments[0].end;
  assert(Point.valid(this.point), this.point);
  assert(Point.equal(this.point, this.segments[1].start), path);
  this.tangents = [Point.subtract(this.segments[0].end, this.segments[0].start), Point.subtract(this.segments[1].end, this.segments[1].start)];
  const threshold = Math.pow(MIN_CORNER_TANGENT_DISTANCE, 2);

  if (this.segments[0].control !== undefined && Point.distance2(this.point, this.segments[0].control) > threshold) {
    this.tangents[0] = Point.subtract(this.point, this.segments[0].control);
  }

  if (this.segments[1].control !== undefined && Point.distance2(this.point, this.segments[1].control) > threshold) {
    this.tangents[1] = Point.subtract(this.segments[1].control, this.point);
  }

  this.angles = this.tangents.map(Point.angle);
  const diff = Angle.subtract(this.angles[1], this.angles[0]);
  this.corner = diff < -MIN_CORNER_ANGLE;
  return this;
} // Code for the stroke extraction step follows.


const addEdgeToAdjacency = (edge, adjacency) => {
  assert(edge.length === 2);
  adjacency[edge[0]] = adjacency[edge[0]] || [];

  if (adjacency[edge[0]].indexOf(edge[1]) < 0) {
    adjacency[edge[0]].push(edge[1]);
  }
};

const extractStroke = (paths, endpoint_map, bridge_adjacency, log, extracted_indices, start, attempt_one) => {
  const result = [];
  const visited = {};
  let current = start; // A list of line segments that were added to the path but that were not
  // part of the original stroke data. None of these should intersect.

  const line_segments = [];
  let self_intersecting = false;

  const advance = index => [index[0], (index[1] + 1) % paths[index[0]].length];

  const angle = (index1, index2) => {
    const diff = Point.subtract(endpoint_map[Point.key(index2)].point, endpoint_map[Point.key(index1)].point);
    assert(diff[0] !== 0 || diff[1] !== 0);
    const angle = Math.atan2(diff[1], diff[0]);
    return Angle.subtract(angle, endpoint.angles[0]);
  };

  const getIntersection = (segment1, segment2) => {
    const diff1 = Point.subtract(segment1[1], segment1[0]);
    const diff2 = Point.subtract(segment2[1], segment2[0]);
    const cross = diff1[0] * diff2[1] - diff1[1] * diff2[0];

    if (cross === 0) {
      return undefined;
    }

    const v = Point.subtract(segment1[0], segment2[0]);
    const s = (diff1[0] * v[1] - diff1[1] * v[0]) / cross;
    const t = (diff2[0] * v[1] - diff2[1] * v[0]) / cross;

    if (0 < s && s < 1 && 0 < t && t < 1) {
      return [segment1[0][0] + t * diff1[0], segment1[0][1] + t * diff1[1]];
    }

    return undefined;
  };

  const indexToPoint = index => endpoint_map[Point.key(index)].point;

  const pushLineSegments = points => {
    const old_lines = line_segments.length;

    for (let i = 0; i < points.length - 1; i++) {
      line_segments.push([points[i], points[i + 1]]);
      result.push({
        start: Point.clone(points[i]),
        end: Point.clone(points[i + 1]),
        control: undefined
      });
    } // Log an error if this stroke is self-intersecting.


    if (!self_intersecting) {
      for (let i = 0; i < old_lines; i++) {
        for (let j = old_lines; j < line_segments.length; j++) {
          if (getIntersection(line_segments[i], line_segments[j])) {
            self_intersecting = true;
            return;
          }
        }
      }
    }
  }; // Here there be dragons!
  // TODO(skishore): Document the point of the geometry in this function.


  const selectBridge = (endpoint, options) => {
    if (options.length === 1 && extracted_indices[Point.key(options[0])]) {
      // Handle star-shaped strokes where one stroke ends at the intersection
      // of the bridges used by two other strokes.
      const indices1 = [endpoint.index, options[0]];
      const segment1 = indices1.map(indexToPoint);

      for (let key in bridge_adjacency) {
        if (Point.equal(endpoint_map[key].index, indices1[0])) {
          continue;
        }

        for (let i = 0; i < bridge_adjacency[key].length; i++) {
          if (Point.equal(bridge_adjacency[key][i], segment1[0])) {
            continue;
          } // Compute the other bridge segment and check if it intersects.


          const indices2 = [endpoint_map[key].index, bridge_adjacency[key][i]];
          const segment2 = indices2.map(indexToPoint);

          if (Point.equal(indices2[0], indices1[1]) && !extracted_indices[Point.key(indices2[1])]) {
            pushLineSegments([segment1[0], segment1[1], segment2[1]]);
            return indices2[1];
          } else if (Point.equal(indices2[1], indices1[1]) && !extracted_indices[Point.key(indices2[0])]) {
            pushLineSegments([segment1[0], segment1[1], segment2[0]]);
            return indices2[0];
          }

          const intersection = getIntersection(segment1, segment2);

          if (intersection !== undefined) {
            const angle1 = angle(indices1[0], indices1[1]);
            const angle2 = angle(indices2[0], indices2[1]);

            if (Angle.subtract(angle2, angle1) < 0) {
              indices2.reverse();
              segment2.reverse();
            }

            pushLineSegments([segment1[0], intersection, segment2[1]]);
            return indices2[1];
          }
        }
      }
    } else {
      // Handle segments where the correct path is to follow a dead-end bridge,
      // even if there is another bridge that is more aligned with the stroke.
      for (let i = 0; i < options.length; i++) {
        const key = Point.key(options[i]);

        if (!extracted_indices[key]) {
          return options[i];
        }
      }
    }

    return options[0];
  };

  while (true) {
    // Add the current path segment to the path.
    result.push(paths[current[0]][current[1]]);
    visited[Point.key(current)] = true;
    current = advance(current); // If there are bridges at the start of the next path segment, follow the
    // one that makes the largest angle with the current path. The ordering
    // criterion enforce that we try to cross aligned bridges.

    const key = Point.key(current);

    if (bridge_adjacency.hasOwnProperty(key)) {
      var endpoint = endpoint_map[key];
      const options = bridge_adjacency[key].sort((a, b) => angle(endpoint.index, a) - angle(endpoint.index, b)); // HACK(skishore): The call to selectBridge may update the result.
      // When a stroke is formed by computing a bridge intersection, then the
      // two bridge fragments are added in selectBridge.

      const result_length = result.length;
      const next = attempt_one ? options[0] : selectBridge(endpoint, options);

      if (result.length === result_length) {
        pushLineSegments([endpoint.point, endpoint_map[Point.key(next)].point]);
      }

      current = next;
    } // Check if we have either closed the loop or hit an extracted segment.


    const new_key = Point.key(current);

    if (Point.equal(current, start)) {
      if (self_intersecting) {
        log.push({
          cls: 'error',
          message: 'Extracted a self-intersecting stroke.'
        });
      }

      let num_segments_on_path = 0;

      for (let index in visited) {
        extracted_indices[index] = true;
        num_segments_on_path += 1;
      } // Single-segment strokes may be due to graphical artifacts in the font.
      // We drop them to remove these artifacts.


      if (num_segments_on_path === 1) {
        log.push({
          cls: 'success',
          message: 'Dropping single-segment stroke.'
        });
        return undefined;
      }

      return result;
    } else if (extracted_indices[new_key] || visited[new_key]) {
      return undefined;
    }
  }
};

const extractStrokes = (paths, endpoints, bridges, log) => {
  // Build up the necessary hash tables and adjacency lists needed to run the
  // stroke extraction loop.
  const endpoint_map = {};
  const endpoint_position_map = {};

  for (let endpoint of endpoints) {
    endpoint_map[Point.key(endpoint.index)] = endpoint;
    endpoint_position_map[Point.key(endpoint.point)] = endpoint;
  }

  bridges.map(checkBridge);
  const bridge_adjacency = {};

  for (let bridge of bridges) {
    const keys = bridge.map(Point.key);
    assert(endpoint_position_map.hasOwnProperty(keys[0]));
    assert(endpoint_position_map.hasOwnProperty(keys[1]));
    const xs = keys.map(x => endpoint_position_map[x].index);
    addEdgeToAdjacency([Point.key(xs[0]), xs[1]], bridge_adjacency);
    addEdgeToAdjacency([Point.key(xs[1]), xs[0]], bridge_adjacency);
  } // Actually extract strokes. Any given path segment index should appear on
  // exactly one stroke; if it is not on a stroke, we log a warning.


  const extracted_indices = {};
  const strokes = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    let missed = false;

    for (var i = 0; i < paths.length; i++) {
      for (var j = 0; j < paths[i].length; j++) {
        const index = [i, j];

        if (extracted_indices[Point.key(index)]) {
          continue;
        }

        const attempt_one = attempt === 0;
        const stroke = extractStroke(paths, endpoint_map, bridge_adjacency, log, extracted_indices, index, attempt_one);

        if (stroke === undefined) {
          missed = true;
          continue;
        }

        strokes.push(stroke);
      }
    }

    if (!missed) {
      return strokes;
    }
  }

  log.push({
    cls: 'error',
    message: 'Stroke extraction missed some path segments.'
  });
  return strokes;
}; // Exports go below this fold.


const stroke_extractor = {};

stroke_extractor.getBridges = (path, classifier) => {
  const paths = svg.convertSVGPathToPaths(path);
  const endpoints = [];

  for (let i = 0; i < paths.length; i++) {
    for (let j = 0; j < paths[i].length; j++) {
      endpoints.push(new Endpoint(paths, [i, j]));
    }
  }

  classifier = classifier || stroke_extractor.combinedClassifier;
  const bridges = getBridges(endpoints, classifier);
  return {
    endpoints: endpoints,
    bridges: bridges
  };
};

stroke_extractor.getStrokes = (path, bridges) => {
  const paths = svg.convertSVGPathToPaths(path);
  const endpoints = [];

  for (let i = 0; i < paths.length; i++) {
    for (let j = 0; j < paths[i].length; j++) {
      endpoints.push(new Endpoint(paths, [i, j]));
    }
  }

  const log = [];
  const stroke_paths = extractStrokes(paths, endpoints, bridges, log);
  const strokes = stroke_paths.map(x => svg.convertPathsToSVGPath([x]));
  return {
    log: log,
    strokes: strokes
  };
};

stroke_extractor.handTunedClassifier = handTunedClassifier;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"svg.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/svg.js                                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  svg: () => svg
});
let assert, Point;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  Point(v) {
    Point = v;
  }

}, 0);
const svg = {}; // A normal-form SVG path string is a data string with the following properties:
//   - Every command in the path is in ['L', 'M', 'Q', 'Z'].
//   - Adjacent tokens in the path are separated by exactly one space.
//   - There is exactly one 'Z', and it is the last command.
//
// A segment is a section of a path, represented as an object that has a start,
// an end, and possibly a control, all of which are valid Points (that is, pairs
// of Numbers).
//
// A path is a list of segments which is non-empty and closed - that is, the end
// of the last segment on the path is the start of the first.
// Returns twice the area contained in the polygon. The result is positive iff
// the polygon winds in the counter-clockwise direction.

const get2xArea = polygon => {
  let area = 0;

  for (var i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    area += (p2[0] + p1[0]) * (p2[1] - p1[1]);
  }

  return area;
}; // Takes a list of paths and orients them so that exterior contours are oriented
// counter-clockwise and interior contours clockwise.


const orientPaths = (paths, approximation_error) => {
  const polygons = paths.map(svg.getPolygonApproximation);

  for (var i = 0; i < paths.length; i++) {
    const path = paths[i];
    let contains = 0;

    for (let j = 0; j < paths.length; j++) {
      if (j === i) {
        continue;
      } else if (svg.polygonContainsPoint(polygons[j], path[0].start)) {
        contains += 1;
      }
    }

    const area = get2xArea(polygons[i]); // The path is an external path iff it is contained in an even number of
    // other paths. It is counter-clockwise iff its area is positive. The path
    // should be reversed if (CCW && internal) || (CW && external).

    const should_reverse = area > 0 !== (contains % 2 === 0);

    if (should_reverse) {
      for (let segment of path) {
        [segment.start, segment.end] = [segment.end, segment.start];
      }

      path.reverse();
    }
  }

  return paths;
}; // Takes a normal-form SVG path string and converts it to a list of paths.


const splitPath = path => {
  assert(path.length > 0);
  assert(path[0] === 'M', "Path did not start with M: ".concat(path));
  assert(path[path.length - 1] === 'Z', "Path did not end with Z: ".concat(path));
  const terms = path.split(' ');
  const result = [];
  let start = undefined;
  let current = undefined;

  for (let i = 0; i < terms.length; i++) {
    const command = terms[i];
    assert(command.length > 0, "Path includes empty command: ".concat(path));
    assert('LMQZ'.indexOf(command) >= 0, command);

    if (command === 'M' || command === 'Z') {
      if (current !== undefined) {
        assert(Point.equal(current, start), "Path has open contour: ".concat(path));
        assert(result[result.length - 1].length > 0, "Path has empty contour: ".concat(path));

        if (command === 'Z') {
          assert(i === terms.length - 1, "Path ended early: ".concat(path));
          return result;
        }
      }

      result.push([]);
      assert(i < terms.length - 2, "Missing point on path: ".concat(path));
      start = [parseFloat(terms[i + 1], 10), parseFloat(terms[i + 2], 10)];
      assert(Point.valid(start));
      i += 2;
      current = Point.clone(start);
      continue;
    }

    let control = undefined;

    if (command === 'Q') {
      assert(i < terms.length - 2, "Missing point on path: ".concat(path));
      control = [parseFloat(terms[i + 1], 10), parseFloat(terms[i + 2], 10)];
      assert(Point.valid(control));
      i += 2;
    }

    assert(i < terms.length - 2, "Missing point on path: ".concat(path));
    const end = [parseFloat(terms[i + 1], 10), parseFloat(terms[i + 2], 10)];
    assert(Point.valid(end));
    i += 2;

    if (Point.equal(current, end)) {
      continue;
    }

    if (control !== undefined && (Point.equal(control, current) || Point.equal(control, end))) {
      control = undefined;
    }

    result[result.length - 1].push({
      start: Point.clone(current),
      control: control,
      end: end
    });
    current = Point.clone(end);
  }
}; // Takes a TrueType font command list (as provided by opentype.js) and returns
// a normal-form SVG path string as defined above.


svg.convertCommandsToPath = commands => {
  const terms = [];

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    assert('LMQZ'.indexOf(command.type) >= 0, command.type);

    if (command.type === 'Z') {
      assert(i === commands.length - 1);
      break;
    }

    terms.push(command.type);
    assert(command.x1 !== undefined === (command.type === 'Q'));

    if (command.x1 !== undefined) {
      terms.push(command.x1);
      terms.push(command.y1);
    }

    assert(command.x !== undefined);
    terms.push(command.x);
    terms.push(command.y);
  }

  terms.push('Z');
  return terms.join(' ');
}; // Converts a normal-form SVG path string to a list of paths. The paths obey an
// orientation constraint: the external paths are oriented counter-clockwise,
// while the internal paths are oriented clockwise.


svg.convertSVGPathToPaths = path => {
  return orientPaths(splitPath(path));
}; // Takes the given list of paths and returns a normal-form SVG path string.


svg.convertPathsToSVGPath = paths => {
  const terms = [];

  for (let path of paths) {
    assert(path.length > 0);
    terms.push('M');
    terms.push(path[0].start[0]);
    terms.push(path[0].start[1]);

    for (let segment of path) {
      if (segment.control === undefined) {
        terms.push('L');
      } else {
        terms.push('Q');
        terms.push(segment.control[0]);
        terms.push(segment.control[1]);
      }

      terms.push(segment.end[0]);
      terms.push(segment.end[1]);
    }
  }

  terms.push('Z');
  return terms.join(' ');
}; // Takes a path (a list of segments) and returns a polygon approximation to it.
// The polygon is given as a list of pairs of points.
//
// The approximation error is an upper-bound on the distance between consecutive
// points in the polygon approximation used to compute the area. The default
// error of 64 is chosen because the glyphs have a total size of 1024x1024.


svg.getPolygonApproximation = (path, approximation_error) => {
  const result = [];
  approximation_error = approximation_error || 64;

  for (let x of path) {
    const control = x.control || Point.midpoint(x.start, x.end);
    const distance = Math.sqrt(Point.distance2(x.start, x.end));
    const num_points = Math.floor(distance / approximation_error);

    for (let i = 0; i < num_points; i++) {
      const t = (i + 1) / (num_points + 1);
      const s = 1 - t;
      result.push([s * s * x.start[0] + 2 * s * t * control[0] + t * t * x.end[0], s * s * x.start[1] + 2 * s * t * control[1] + t * t * x.end[1]]);
    }

    result.push(x.end);
  }

  return result;
}; // Returns true if the given point is contained inside the given polygon.


svg.polygonContainsPoint = (polygon, point) => {
  const x = point[0];
  const y = point[1];
  let crossings = 0;

  for (let i = 0; i < polygon.length; i++) {
    const segment = {
      start: polygon[i],
      end: polygon[(i + 1) % polygon.length]
    };

    if (segment.start[0] < x && x < segment.end[0] || segment.start[0] > x && x > segment.end[0]) {
      const t = (x - segment.end[0]) / (segment.start[0] - segment.end[0]);
      const cy = t * segment.start[1] + (1 - t) * segment.end[1];

      if (y > cy) {
        crossings += 1;
      }
    } else if (segment.start[0] === x && segment.start[1] <= y) {
      if (segment.end[0] > x) {
        crossings += 1;
      }

      const last = polygon[(i + polygon.length - 1) % polygon.length];

      if (last[0] > x) {
        crossings += 1;
      }
    }
  }

  return crossings % 2 === 1;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"client":{"template.index.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/template.index.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.body.addContent((function() {
  var view = this;
  return [ Spacebars.include(view.lookupTemplate("navbar")), "\n  ", Spacebars.include(view.lookupTemplate("modal")), "\n  ", Spacebars.include(view.lookupTemplate("editor")) ];
}));
Meteor.startup(Template.body.renderToDocument);

Template.__checkName("navbar");
Template["navbar"] = new Template("Template.navbar", (function() {
  var view = this;
  return HTML.DIV({
    id: "navbar",
    class: "navbar navbar-default navbar-static-top"
  }, "\n    ", HTML.DIV({
    class: "container-fluid"
  }, HTML.Raw('\n      <div class="navbar-header">\n        <div class="navbar-brand">Hanzi decomposition</div>\n      </div>\n      '), HTML.DIV({
    class: "progress"
  }, "\n        ", HTML.DIV({
    class: "progress-bar progress-bar-warning active",
    role: "progressbar",
    style: function() {
      return [ "width: ", Spacebars.mustache(view.lookup("percent")), "%" ];
    },
    "aria-valuenow": function() {
      return Spacebars.mustache(view.lookup("percent"));
    },
    "aria-valuemin": "0",
    "aria-valuemax": "100"
  }, "\n          ", HTML.SPAN(Blaze.View("lookup:complete", function() {
    return Spacebars.mustache(view.lookup("complete"));
  }), "/", Blaze.View("lookup:total", function() {
    return Spacebars.mustache(view.lookup("total"));
  })), "\n        "), "\n      "), "\n      ", HTML.DIV({
    class: "navbar-right"
  }, "\n        ", HTML.DIV({
    class: function() {
      return [ "backup navbar-brand ", Spacebars.mustache(view.lookup("backup")) ];
    }
  }, HTML.Raw("&#x270e;")), "\n      "), "\n    "), "\n  ");
}));

Template.__checkName("modal");
Template["modal"] = new Template("Template.modal", (function() {
  var view = this;
  return HTML.DIV({
    id: "modal",
    class: "modal fade",
    tabindex: "2",
    "data-backdrop": "static",
    "data-keyboard": "false"
  }, "\n    ", HTML.DIV({
    class: "modal-dialog"
  }, "\n      ", HTML.DIV({
    class: "modal-content"
  }, "\n        ", HTML.DIV({
    class: "modal-body"
  }, Blaze.View("lookup:text", function() {
    return Spacebars.mustache(view.lookup("text"));
  })), "\n        ", HTML.DIV({
    class: "modal-footer"
  }, "\n          ", HTML.DIV({
    class: "progress"
  }, "\n            ", HTML.DIV({
    class: "progress-bar progress-bar-striped active",
    role: "progressbar",
    style: function() {
      return [ "width: ", Spacebars.mustache(view.lookup("percent")), "%" ];
    },
    "aria-valuenow": function() {
      return Spacebars.mustache(view.lookup("percent"));
    },
    "aria-valuemin": "0",
    "aria-valuemax": "100"
  }), "\n          "), "\n        "), "\n      "), "\n    "), "\n  ");
}));

Template.__checkName("editor");
Template["editor"] = new Template("Template.editor", (function() {
  var view = this;
  return HTML.DIV({
    id: "editor"
  }, "\n    ", HTML.DIV({
    class: "left-pane"
  }, "\n      ", Spacebars.include(view.lookupTemplate("metadata")), "\n      ", Spacebars.include(view.lookupTemplate("status")), "\n    "), "\n    ", HTML.SVG({
    viewBox: "0 0 1024 1024"
  }, "\n      ", HTML.G({
    transform: "scale(1, -1) translate(0, -900)"
  }, "\n        ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("paths"));
  }, function() {
    return [ "\n          ", HTML.PATH({
      class: function() {
        return Spacebars.mustache(view.lookup("cls"));
      },
      fill: function() {
        return Spacebars.mustache(view.lookup("fill"));
      },
      stroke: function() {
        return Spacebars.mustache(view.lookup("stroke"));
      },
      d: function() {
        return Spacebars.mustache(view.lookup("d"));
      }
    }), "\n        " ];
  }), "\n        ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("lines"));
  }, function() {
    return [ "\n          ", HTML.LINE({
      class: function() {
        return Spacebars.mustache(view.lookup("cls"));
      },
      stroke: function() {
        return Spacebars.mustache(view.lookup("stroke"));
      },
      "stroke-width": "8",
      x1: function() {
        return Spacebars.mustache(view.lookup("x1"));
      },
      y1: function() {
        return Spacebars.mustache(view.lookup("y1"));
      },
      x2: function() {
        return Spacebars.mustache(view.lookup("x2"));
      },
      y2: function() {
        return Spacebars.mustache(view.lookup("y2"));
      }
    }), "\n        " ];
  }), "\n        ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("points"));
  }, function() {
    return [ "\n          ", HTML.CIRCLE({
      class: function() {
        return Spacebars.mustache(view.lookup("cls"));
      },
      fill: function() {
        return Spacebars.mustache(view.lookup("fill"));
      },
      stroke: function() {
        return Spacebars.mustache(view.lookup("stroke"));
      },
      cx: function() {
        return Spacebars.mustache(view.lookup("cx"));
      },
      cy: function() {
        return Spacebars.mustache(view.lookup("cy"));
      },
      r: "8"
    }), "\n        " ];
  }), "\n        ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("animations"));
  }, function() {
    return [ "\n          ", HTML.CLIPPATH({
      id: function() {
        return Spacebars.mustache(view.lookup("clip"));
      }
    }, "\n            ", HTML.PATH({
      d: function() {
        return Spacebars.mustache(view.lookup("stroke"));
      }
    }), "\n          "), "\n          ", HTML.PATH({
      class: "animation",
      "clip-path": function() {
        return [ "url(#", Spacebars.mustache(view.lookup("clip")), ")" ];
      },
      d: function() {
        return Spacebars.mustache(view.lookup("median"));
      },
      "stroke-dasharray": function() {
        return [ Spacebars.mustache(view.lookup("length")), " ", Spacebars.mustache(view.lookup("spacing")) ];
      },
      "stroke-dashoffset": function() {
        return Spacebars.mustache(view.lookup("advance"));
      }
    }), "\n        " ];
  }), "\n      "), "\n    "), "\n  ");
}));

Template.__checkName("metadata");
Template["metadata"] = new Template("Template.metadata", (function() {
  var view = this;
  return HTML.DIV({
    class: "panel panel-primary metadata",
    style: function() {
      return [ "display: ", Spacebars.mustache(view.lookup("display")), ";" ];
    }
  }, "\n    ", HTML.DIV({
    class: "panel-heading"
  }, "\n      ", HTML.H3({
    class: "panel-title"
  }, "\n        Metadata for ", Blaze.View("lookup:rank", function() {
    return Spacebars.mustache(view.lookup("rank"));
  }), " - ", Blaze.View("lookup:character", function() {
    return Spacebars.mustache(view.lookup("character"));
  }), "\n        ", Blaze.If(function() {
    return Spacebars.call(view.lookup("simplified"));
  }, function() {
    return [ "\n          - ", HTML.A({
      href: function() {
        return [ "#", Spacebars.mustache(view.lookup("simplified")) ];
      }
    }, "(simplified: ", Blaze.View("lookup:simplified", function() {
      return Spacebars.mustache(view.lookup("simplified"));
    }), ")"), "\n        " ];
  }), "\n      "), "\n    "), "\n    ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("items"));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "field"
    }, "\n        ", HTML.LABEL({
      class: "control-label"
    }, Blaze.View("lookup:label", function() {
      return Spacebars.mustache(view.lookup("label"));
    })), "\n        ", Blaze.View("lookup:editable", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), view.lookup("field"), view.lookup("value")));
    }), Blaze.View("lookup:separator", function() {
      return Spacebars.mustache(view.lookup("separator"));
    }), Blaze.View("lookup:extra", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("extra")));
    }), "\n      "), "\n    " ];
  }), "\n    ", HTML.DIV({
    class: "field"
  }, HTML.Raw('\n      <label class="control-label">References:</label>\n        '), Blaze.Each(function() {
    return Spacebars.call(view.lookup("references"));
  }, function() {
    return [ "\n          ", HTML.A({
      class: "reference",
      href: function() {
        return Spacebars.mustache(view.lookup("href"));
      },
      target: "_blank"
    }, Blaze.View("lookup:label", function() {
      return Spacebars.mustache(view.lookup("label"));
    })), HTML.Raw('\n          <div class="separator">•</div>\n        ') ];
  }), "\n    "), "\n  ");
}));

Template.__checkName("status");
Template["status"] = new Template("Template.status", (function() {
  var view = this;
  return HTML.DIV({
    class: "panel panel-primary status"
  }, "\n    ", HTML.DIV({
    class: "panel-heading"
  }, "\n      ", HTML.H3({
    class: "panel-title"
  }, "Edit ", Blaze.View("lookup:stage", function() {
    return Spacebars.mustache(view.lookup("stage"));
  })), "\n    "), "\n    ", HTML.DIV({
    class: function() {
      return [ "template ", Spacebars.mustache(view.lookup("template")) ];
    }
  }, "\n      ", Blaze._TemplateWith(function() {
    return {
      template: Spacebars.call(view.lookup("template"))
    };
  }, function() {
    return Spacebars.include(function() {
      return Spacebars.call(Template.__dynamic);
    });
  }), "\n    "), "\n    ", HTML.UL({
    class: "log"
  }, "\n      ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("lines"));
  }, function() {
    return [ "\n        ", HTML.LI({
      class: function() {
        return [ "line ", Spacebars.mustache(view.lookup("cls")) ];
      }
    }, Blaze.View("lookup:message", function() {
      return Spacebars.mustache(view.lookup("message"));
    })), "\n      " ];
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template.templates.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/template.templates.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("path_stage");
Template["path_stage"] = new Template("Template.path_stage", (function() {
  var view = this;
  return [ "Choose a source for glyph path data for this character:\n  ", HTML.DIV({
    class: "options"
  }, "\n    ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("options"));
  }, function() {
    return [ "\n      ", HTML.A({
      class: "option"
    }, Blaze.View("lookup:label", function() {
      return Spacebars.mustache(view.lookup("label"));
    })), HTML.Raw('\n      <div class="separator">•</div>\n    ') ];
  }), "\n  "), "\n  ", HTML.DIV({
    class: "alternative"
  }, "\n    Alternatively, use part of a glyph from another character:\n    ", Blaze.View("lookup:editable", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "alternative", view.lookup("alternative")));
  }), "\n  ") ];
}));

Template.__checkName("bridges_stage");
Template["bridges_stage"] = new Template("Template.bridges_stage", (function() {
  var view = this;
  return "Connect each pair of path points such that the segment between those points\n  is part of some stroke outline. Click on two points to connect them by a\n  bridge, or click on a bridge to drop it.";
}));

Template.__checkName("strokes_stage");
Template["strokes_stage"] = new Template("Template.strokes_stage", (function() {
  var view = this;
  return "Select paths to include in the glyph by clicking on them. The final number of\n  strokes must agree with the stroke count in the character metadata.";
}));

Template.__checkName("analysis_stage");
Template["analysis_stage"] = new Template("Template.analysis_stage", (function() {
  var view = this;
  return [ "Decompose the character into components, if possible. Additionally, if the\n  character is a phonetic-semantic compound, mark the components that play each\n  of those roles.\n\n  ", HTML.DIV({
    class: "decomposition"
  }, "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("decomposition_data"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("tree"));
  }), "\n  "), "\n  ", HTML.DIV({
    class: "radical"
  }, HTML.Raw('\n    <label class="control-label">Radical:</label>\n    '), Blaze.View("lookup:editable", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "radical", view.lookup("radical")));
  }), "\n  "), "\n  ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("etymology_data"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("etymology"));
  }) ];
}));

Template.__checkName("tree");
Template["tree"] = new Template("Template.tree", (function() {
  var view = this;
  return [ HTML.DIV({
    class: "tree",
    style: function() {
      return [ "margin-left: ", Spacebars.mustache(Spacebars.dot(view.lookup("path"), "length")), "em;" ];
    }
  }, "\n    ", HTML.SELECT({
    class: "form-control subtree-type"
  }, "\n      ", HTML.OPTION(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("selected"), view.lookup("type"), "character");
  }), "Character"), "\n      ", HTML.OPTION(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("selected"), view.lookup("type"), "compound");
  }), "Compound"), "\n    "), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("equals"), view.lookup("type"), "character");
  }, function() {
    return [ "\n      ", Blaze.View("lookup:editable", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "character", view.lookup("value")));
    }), "\n      ", Blaze.If(function() {
      return Spacebars.dataMustache(view.lookup("equals"), view.lookup("value"), "?");
    }, function() {
      return "\n        (unknown)\n      ";
    }, function() {
      return [ "\n        ", HTML.A({
        class: "link",
        href: function() {
          return [ "#", Spacebars.mustache(view.lookup("value")) ];
        }
      }, Blaze.View("lookup:details", function() {
        return Spacebars.mustache(view.lookup("details"), view.lookup("value"));
      })), "\n      " ];
    }), "\n    " ];
  }), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("equals"), view.lookup("type"), "compound");
  }, function() {
    return [ "\n      ", HTML.SELECT({
      class: "form-control compound-type"
    }, "\n        ", Blaze.Each(function() {
      return Spacebars.dataMustache(view.lookup("compounds"), view.lookup("value"));
    }, function() {
      return [ "\n          ", HTML.OPTION(HTML.Attrs(function() {
        return Spacebars.attrMustache(view.lookup("selected"), view.lookup("value"), view.lookup("compound"));
      }), Blaze.View("lookup:label", function() {
        return Spacebars.mustache(view.lookup("label"));
      })), "\n        " ];
    }), "\n      "), "\n    " ];
  }), "\n  "), "\n  ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("children"));
  }, function() {
    return [ "\n    ", Blaze._TemplateWith(function() {
      return Spacebars.call(view.lookup("."));
    }, function() {
      return Spacebars.include(view.lookupTemplate("tree"));
    }), "\n  " ];
  }) ];
}));

Template.__checkName("etymology");
Template["etymology"] = new Template("Template.etymology", (function() {
  var view = this;
  return HTML.DIV({
    class: "etymology"
  }, HTML.Raw('\n    <label class="control-label">Etymology:</label>\n    '), HTML.SELECT({
    class: "form-control etymology-type"
  }, "\n      ", HTML.OPTION(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("selected"), view.lookup("type"), "ideographic");
  }), "Ideographic"), "\n      ", HTML.OPTION(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("selected"), view.lookup("type"), "pictographic");
  }), "Pictographic"), "\n      ", HTML.OPTION(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("selected"), view.lookup("type"), "pictophonetic");
  }), "Pictophonetic"), "\n    "), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("equals"), view.lookup("type"), "pictophonetic");
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "component"
    }, "\n        ", Blaze.View("lookup:editable", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "semantic", view.lookup("semantic")));
    }), "\n        (", Blaze.View("lookup:editable", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "hint", view.lookup("hint")));
    }), ") provides the meaning while\n        ", Blaze.View("lookup:editable", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "phonetic", view.lookup("phonetic")));
    }), " provides the pronunciation.\n      "), "\n    " ];
  }, function() {
    return [ "\n      ", Blaze.View("lookup:editable", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editable"), "hint", view.lookup("hint")));
    }), "\n    " ];
  }), "\n  ");
}));

Template.__checkName("order_stage");
Template["order_stage"] = new Template("Template.order_stage", (function() {
  var view = this;
  return [ "Click on the strokes to the right to set the component they belong to.\n  Then reorder the strokes by clicking and dragging elements in the list below.\n  ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("components"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "component",
      style: function() {
        return [ "top: ", Spacebars.mustache(view.lookup("top")), ";" ];
      }
    }, "\n      ", Blaze._TemplateWith(function() {
      return Spacebars.call(view.lookup("glyph"));
    }, function() {
      return Spacebars.include(view.lookupTemplate("glyph"));
    }), HTML.Raw('\n      <div class="clear"></div>\n    ')), "\n  " ];
  }), "\n  ", HTML.DIV({
    class: "character"
  }, "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("character"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("glyph"));
  }), "\n  "), "\n  ", HTML.DIV({
    class: "permutation"
  }, "\n    ", Blaze._TemplateWith(function() {
    return {
      items: Spacebars.call(view.lookup("items")),
      options: Spacebars.call(view.lookup("options")),
      sortField: Spacebars.call("index")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("sortable"), function() {
      return [ "\n      ", HTML.DIV({
        class: "entry",
        style: function() {
          return [ "background-color: ", Spacebars.mustache(view.lookup("background")), ";\n                                border-color: ", Spacebars.mustache(view.lookup("color")), ";" ];
        }
      }, HTML.Raw('\n        <a class="reverse">Reverse</a>\n        '), HTML.DIV({
        class: "small"
      }, Blaze._TemplateWith(function() {
        return Spacebars.call(view.lookup("glyph"));
      }, function() {
        return Spacebars.include(view.lookupTemplate("glyph"));
      })), HTML.Raw('\n        <div class="clear"></div>\n        '), HTML.DIV({
        class: "character"
      }, Blaze._TemplateWith(function() {
        return Spacebars.call(view.lookup("glyph"));
      }, function() {
        return Spacebars.include(view.lookupTemplate("glyph"));
      })), "\n      "), "\n    " ];
    });
  }), "\n  ") ];
}));

Template.__checkName("glyph");
Template["glyph"] = new Template("Template.glyph", (function() {
  var view = this;
  return HTML.SVG({
    viewBox: "0 0 1024 1024"
  }, "\n    ", HTML.DEFS("\n      ", HTML.MARKER({
    id: "arrow",
    markerWidth: "4",
    markerHeight: "4",
    orient: "auto",
    refX: "3",
    refY: "2"
  }, "\n        ", HTML.PATH({
    d: "M0,0 L0,4 L4,2 L0,0",
    style: "fill: red;"
  }), "\n      "), "\n    "), "\n    ", HTML.G({
    transform: "scale(1, -1) translate(0, -900)"
  }, "\n      ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("paths"));
  }, function() {
    return [ "\n        ", HTML.PATH({
      class: function() {
        return Spacebars.mustache(view.lookup("cls"));
      },
      fill: function() {
        return Spacebars.mustache(view.lookup("fill"));
      },
      stroke: function() {
        return Spacebars.mustache(view.lookup("stroke"));
      },
      d: function() {
        return Spacebars.mustache(view.lookup("d"));
      }
    }), "\n      " ];
  }), "\n      ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("lines"));
  }, function() {
    return [ "\n        ", HTML.LINE({
      x1: function() {
        return Spacebars.mustache(view.lookup("x1"));
      },
      y1: function() {
        return Spacebars.mustache(view.lookup("y1"));
      },
      x2: function() {
        return Spacebars.mustache(view.lookup("x2"));
      },
      y2: function() {
        return Spacebars.mustache(view.lookup("y2"));
      }
    }), "\n      " ];
  }), "\n    "), "\n  ");
}));

Template.__checkName("verified_stage");
Template["verified_stage"] = new Template("Template.verified_stage", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("data"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("animation"));
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"abstract.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/abstract.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AbstractStage: () => AbstractStage
});
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 0);

// Each stage is supposed to compute a particular field for the glyph.
// It computes an initial value for this field based only on previous stages,
// then exposes a UI for manual correction of its output.
//
// NOTE: No stage methods should update the glyph. The framework will do so by
// calling getStageOutput when appropriate.
class AbstractStage {
  // Initialize this stage's values based only off previous stages. Then, if the
  // glyph already has a value for this stage's field and it is possible to set
  // up the internal state of this stage to achieve that value, set that state.
  // This piece allows the user to resume editing a glyph.
  //
  // Typically, a stage will maintain a 'this.original' variable containing the
  // value without any manual edits and a 'this.adjusted' variable containing
  // the value with manual edits.
  constructor(glyph) {
    // The super constructor should be passed a type, but subclass constructors
    // will be passed a glyph instead, hence the variable name discrepancy.
    this.type = glyph;
    this.colors = ['#0074D9', '#2ECC40', '#FFDC00', '#FF4136', '#7FDBFF', '#001F3F', '#39CCCC', '#3D9970', '#01FF70', '#FF851B']; // Session variables the interface by which the stage interacts with UI:
    //   - type - String type of this stage.
    //   - paths - list of dicts with keys in [cls, d, fill, stroke].
    //   - lines - list of dicts with keys in [cls, stroke, x1, y1, x2, y2].
    //   - points - list of dicts with keys in [cls, cx, cy, fill, stroke].
    //   - status - list of dicts with keys in [cls, message] to log.
    //
    // The class name 'selectable' is special for paths, lines, and points.
    // Including this class in cls for those objects will make them interactive
    // and will trigger the onClick callback when they are clicked.

    Session.set('stage.type', this.type);
    Session.set('stage.paths', undefined);
    Session.set('stage.lines', undefined);
    Session.set('stage.points', undefined);
    Session.set('stage.status', undefined); // Only used for the verified stage. This variable should be a list of
    // objects with the following keys:
    //   - clip - a unique id for the given stroke.
    //   - stroke - the actual stroke path.
    //   - median - the path along just the median.
    //   - length - the total length of the median.
    //   - advance - the length left along the median. 0 when complete.

    Session.set('stage.animations', undefined);
  } // Returns true if the difference between the two outputs is significant
  // enough that the output from all later stages must be erased. By default,
  // we return true to be safe. We should be very careful when returning false.


  clearLaterStages(output1, output2) {
    return true;
  } // Return this stage's value based on current internal state. The default
  // implementation works for stages that follow the 'original/adjusted'
  // convention described in the constructor.


  getStageOutput() {
    return this.adjusted;
  } // Update the stage's internal state based on the event.


  handleEvent(event, template) {
    assert(false, 'handleEvent was not implemented!');
  } // Refresh the stage UI based on the current state of this stage and the
  // glyph's character and current metadata.


  refreshUI(character, metadata) {
    assert(false, 'refresh was not implemented!');
  } // Throws an error if there is an issue with this stage's output. The default
  // implementation simply checks that none of the log lines are errors.


  validate() {
    const log = Session.get('stage.status');
    assert(log && log.filter(x => x.cls === 'error').length === 0);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"analysis.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/analysis.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AnalysisStage: () => AnalysisStage
});
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 0);
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 1);
let cjklib;
module.link("/lib/cjklib", {
  cjklib(v) {
    cjklib = v;
  }

}, 2);
let decomposition_util;
module.link("/lib/decomposition_util", {
  decomposition_util(v) {
    decomposition_util = v;
  }

}, 3);
let Glyphs;
module.link("/lib/glyphs", {
  Glyphs(v) {
    Glyphs = v;
  }

}, 4);
let pinyin_util;
module.link("/lib/pinyin_util", {
  pinyin_util(v) {
    pinyin_util = v;
  }

}, 5);
let stage = undefined;
const etymology_fields = ['hint', 'phonetic', 'semantic']; // Methods for querying and modifying decomposition trees.

const collectComponents = subtree => {
  return subtree ? decomposition_util.collectComponents(subtree) : [];
};

const fixSubtreeChildrenLength = subtree => {
  const data = decomposition_util.ids_data[subtree.value];
  assert(data, "Invalid ideograph description character: ".concat(subtree.value));
  subtree.children.length = data.arity;

  for (let i = 0; i < subtree.children.length; i++) {
    subtree.children[i] = subtree.children[i] || {
      type: 'character',
      value: '?'
    };
    subtree.children[i].path = subtree.path.concat([i]);
  }
};

const setSubtreeType = (subtree, type) => {
  if (subtree.type === type) {
    return;
  }

  if (type === 'character') {
    subtree.value = '?';
    delete subtree.children;
  } else if (type === 'compound') {
    subtree.value = decomposition_util.ideograph_description_characters[0];
    subtree.children = [];
    fixSubtreeChildrenLength(subtree);
  } else {
    assert(false, "Unexpected subtree type: ".concat(type));
  }

  subtree.type = type;
}; // Methods for handling updates to various non-decomposition analysis fields.


const updateCharacterValue = (target, text, path) => {
  const subtree = decomposition_util.getSubtree(stage.tree, path);

  if (text === subtree.value || subtree.type !== 'character') {
    return;
  }

  const value = text.length === 1 ? text : '?';

  if (value === subtree.value) {
    target.text(value);
  } else {
    subtree.value = text.length === 1 ? text : '?';
    stage.forceRefresh();
  }
};

const updateEtymology = (target, text, type) => {
  let value = text && text !== '?' ? text : undefined;
  const expansion = ' aptp';

  if (type === 'hint' && value && value.endsWith(expansion)) {
    const suffix = 'also provides the pronunciation';
    value = "".concat(value.substr(0, value.length - expansion.length), " ").concat(suffix);
  }

  if (value === stage.etymology[type]) {
    target.text(value || '?');
  } else {
    stage.etymology[type] = value;
    stage.forceRefresh();
  }
};

const updateRadicalValue = (target, text) => {
  const value = text && text !== '?' ? text : undefined;

  if (value === stage.radical) {
    target.text(value || '?');
  } else {
    stage.radical = value;
    stage.forceRefresh();
  }
}; // Methods for initializing different fields of the analysis.


const initializeDecompositionTree = (analysis, character) => {
  const data = cjklib.getCharacterData(character);
  return decomposition_util.convertDecompositionToTree(analysis.decomposition || data.decomposition);
};

const initializeRadical = (character, components) => {
  if (cjklib.radicals.radical_to_index_map.hasOwnProperty(character)) {
    return character;
  }

  const data = cjklib.getCharacterData(character);

  if (data.kangxi_index) {
    const index = data.kangxi_index[0];
    const radicals = cjklib.radicals.index_to_radical_map[index];
    const included = radicals.filter(x => components.indexOf(x) >= 0);
    return included.length === 1 ? included[0] : radicals.join('');
  }

  return undefined;
};

const initializeEtymology = (glyph, components) => {
  const data = cjklib.getCharacterData(glyph.character);
  const target = pinyin_util.dropTones(glyph.metadata.pinyin || data.pinyin || '');

  const phonetic_match = component => {
    const component_data = cjklib.getCharacterData(component);
    const attempt = pinyin_util.dropTones(component_data.pinyin || '');
    return attempt && attempt === target;
  };

  const phonetic = components.filter(phonetic_match);

  if (phonetic.length === 1) {
    const result = {
      type: 'pictophonetic',
      phonetic: phonetic[0]
    };
    const semantic = components.filter(x => !phonetic_match(x));

    if (semantic.length === 1) {
      result.semantic = semantic[0];
    }

    return result;
  }

  return {
    type: 'ideographic'
  };
}; // Methods for automatically inferring a phonetic-semantic decomposition.


const doubleAlphabeticCharacters = pinyin => {
  const numbered = pinyin_util.tonePinyinToNumberedPinyin(pinyin);
  return Array.from(numbered).map(x => /[a-z]/.test(x) ? x + x : x).join('');
};

const guessPhoneticAndSemanticComponents = (glyph, components) => {
  const data = cjklib.getCharacterData(glyph.character);
  const target = doubleAlphabeticCharacters(glyph.metadata.pinyin || data.pinyin || '');

  const distance = component => {
    const component_data = cjklib.getCharacterData(component);
    const attempt = doubleAlphabeticCharacters(component_data.pinyin || '');
    return s.levenshtein(attempt, target);
  };

  const pairs = components.map(x => [x, distance(x)]);
  const sorted = pairs.sort((a, b) => a[1] - b[1]).map(x => x[0]);
  const result = {};

  if (sorted.length > 0) {
    result.phonetic = sorted[0];

    if (sorted.length === 2) {
      result.semantic = sorted[1];
    }
  }

  return result;
};

class AnalysisStage extends AbstractStage {
  constructor(glyph) {
    super('analysis');
    this.strokes = glyph.stages.strokes.corrected;
    const analysis = glyph.stages.analysis || {};
    this.tree = initializeDecompositionTree(analysis, glyph.character);
    const components = collectComponents(this.tree);
    this.radical = analysis.radical || initializeRadical(glyph.character, components);
    this.etymology = analysis.etymology || initializeEtymology(glyph, components);
    this.simplified = cjklib.getCharacterData(glyph.character).simplified;
    stage = this;
    updateStatus();
  }

  clearLaterStages(output1, output2) {
    return output1.decomposition !== output2.decomposition;
  }

  getStageOutput() {
    return {
      decomposition: decomposition_util.convertTreeToDecomposition(this.tree),
      etymology: _.extend({}, this.etymology),
      radical: this.radical
    };
  }

  refreshUI() {
    const to_path = x => ({
      d: x,
      fill: 'gray',
      stroke: 'gray'
    });

    Session.set('stage.paths', this.strokes.map(to_path));
    Session.set('stages.analysis.tree', this.tree);
    Session.set('stages.analysis.radical', this.radical);
    Session.set('stages.analysis.etymology', this.etymology);
    Session.set('stages.analysis.simplified', this.simplified);
  }

}

Template.analysis_stage.events({
  'blur .value': function (event) {
    // This line is not needed for correctness, so we ignore any errors in it.
    try {
      window.getSelection().removeAllRanges();
    } catch (e) {}

    const target = $(event.target);
    const field = target.attr('data-field');
    const text = target.text();

    if (field === 'character') {
      updateCharacterValue(target, text, this.path);
    } else if (field === 'radical') {
      updateRadicalValue(target, text);
    } else if (etymology_fields.indexOf(field) >= 0) {
      updateEtymology(target, text, field);
    } else {
      assert(false, "Unexpected editable field: ".concat(field));
    }
  },
  'change .compound-type': function (event) {
    const type = $(event.target).val();
    const subtree = decomposition_util.getSubtree(stage.tree, this.path);

    if (type === subtree.value || subtree.type != 'compound') {
      return;
    }

    subtree.value = type;
    fixSubtreeChildrenLength(subtree);
    stage.forceRefresh();
  },
  'change .etymology-type': function (event) {
    const type = $(event.target).val();
    etymology_fields.map(x => {
      if (x !== 'hint') delete stage.etymology[x];
    });

    if (type === 'pictophonetic' !== (stage.etymology.type === 'pictophonetic')) {
      delete stage.etymology.hint;
    }

    stage.etymology.type = type;

    if (type === 'pictophonetic') {
      _.extend(stage.etymology, guessPhoneticAndSemanticComponents(Session.get('editor.glyph'), collectComponents(stage.tree)));
    }

    stage.forceRefresh();
  },
  'change .subtree-type': function (event) {
    const type = $(event.target).val();
    const subtree = decomposition_util.getSubtree(stage.tree, this.path);
    setSubtreeType(subtree, type);
    stage.forceRefresh();
  }
});
Template.analysis_stage.helpers({
  decomposition_data: () => {
    return Session.get('stages.analysis.tree');
  },
  etymology_data: () => {
    const result = Session.get('stages.analysis.etymology') || {};
    result.hint = result.hint || '?';

    if (result.type === 'pictophonetic') {
      result.phonetic = result.phonetic || '?';
      result.semantic = result.semantic || '?';
    }

    return result;
  },
  radical: () => {
    return Session.get('stages.analysis.radical') || '?';
  }
});
Template.tree.helpers({
  compounds: value => {
    return decomposition_util.ideograph_description_characters.map(x => ({
      compound: x,
      label: "".concat(x, " - ").concat(decomposition_util.ids_data[x].label),
      value: value
    }));
  },
  details: character => {
    const glyph = Glyphs.get(character);
    const data = cjklib.getCharacterData(character);
    let definition = glyph.metadata.definition || data.definition;
    let pinyin = glyph.metadata.pinyin || data.pinyin;
    let radical = '';

    if (cjklib.radicals.radical_to_index_map.hasOwnProperty(character)) {
      const index = cjklib.radicals.radical_to_index_map[character];
      const primary = cjklib.radicals.primary_radical[index];
      const variant = primary !== character;
      radical = "; ".concat(variant ? 'variant of ' : '') + "Kangxi radical ".concat(index, " ").concat(variant ? primary : '');

      if (variant && Glyphs.get(primary)) {
        const glyph = Glyphs.get(primary);
        const data = cjklib.getCharacterData(primary);
        definition = definition || glyph.definition || data.definition;
        pinyin = pinyin || glyph.pinyin || data.pinyin;
      }
    }

    definition = definition || '(unknown)';
    return "".concat(pinyin ? pinyin + ' - ' : '').concat(definition).concat(radical);
  }
});

const traditionalEtymologyHack = () => {
  // Only compute the traditional etymology based on simplified once, and only
  // if this character does not already have an etymology computed.
  if (!stage || !stage.simplified || stage.inferred_etymology_from_simplified_form) {
    return;
  }

  const glyph = Session.get('editor.glyph');
  const simplified = Glyphs.findOne({
    character: stage.simplified
  });

  if (!glyph || !simplified) {
    return;
  }

  stage.inferred_etymology_from_simplified_form = true;

  if (glyph.stages.analysis && glyph.stages.analysis.etymology && glyph.stages.analysis.etymology.hint || !(simplified.stages.analysis && simplified.stages.analysis.etymology && simplified.stages.analysis.etymology.hint)) {
    return;
  } // Try to pull components for the simplified character up to components for
  // the traditional character.


  const mapping = {};
  const analysis = simplified.stages.analysis;
  const decomposition = decomposition_util.convertTreeToDecomposition(stage.tree);

  if (decomposition.length === analysis.decomposition.length && decomposition[0] === analysis.decomposition[0]) {
    for (let i = 0; i < decomposition.length; i++) {
      mapping[analysis.decomposition[i]] = decomposition[i];
    }
  } else {
    return;
  } // Pull the actual etymology.


  stage.etymology = {};

  for (let key of _.keys(analysis.etymology)) {
    const value = analysis.etymology[key];
    stage.etymology[key] = key === 'type' ? value : value.applyMapping(mapping);
  }

  stage.forceRefresh();
};

const updateStatus = () => {
  const components = collectComponents(Session.get('stages.analysis.tree'));

  if (Session.get('stages.analysis.simplified')) {
    components.push(Session.get('stages.analysis.simplified'));
  }

  const radical = Session.get('stages.analysis.radical');
  const missing = components.filter(x => {
    const glyph = Glyphs.findOne({
      character: x
    });
    return !glyph || !glyph.stages.verified;
  });
  const log = [];

  if (missing.length === 0) {
    log.push({
      cls: 'success',
      message: 'All components ready.'
    });
    Meteor.setTimeout(traditionalEtymologyHack, 0);
  } else {
    const error = "Incomplete components: ".concat(missing.join(' '));
    log.push({
      cls: 'error',
      message: error
    });
  }

  if (!radical || radical.length === 0) {
    log.push({
      cls: 'error',
      message: 'No radical selected.'
    });
  } else if (radical.length > 1) {
    log.push({
      cls: 'error',
      message: 'Multiple radicals selected.'
    });
  } else if (components.indexOf(radical) >= 0) {
    log.push({
      cls: 'success',
      message: "Radical ".concat(radical, " found in decomposition.")
    });
  }

  const nonradicals = Array.from(radical || '').filter(x => !cjklib.radicals.radical_to_index_map.hasOwnProperty(x));

  if (nonradicals.length > 0) {
    log.push({
      cls: 'error',
      message: 'Radical field includes non-radicals: ' + nonradicals.join(' ')
    });
  }

  if (Session.get('stage.type') === 'analysis') {
    Session.set('stage.status', log);
  }
}; // We need to add the setTimeout here because client/lib is loaded before lib.
// TODO(skishore): Find a better way to handle this load-order issue.


Meteor.startup(() => Meteor.setTimeout(() => {
  Tracker.autorun(updateStatus);
  cjklib.promise.then(() => Tracker.autorun(() => {
    const components = collectComponents(Session.get('stages.analysis.tree'));

    if (Session.get('stages.analysis.simplified')) {
      components.push(Session.get('stages.analysis.simplified'));
    }

    for (let component of [].concat(components)) {
      if (cjklib.radicals.radical_to_index_map.hasOwnProperty(component)) {
        const index = cjklib.radicals.radical_to_index_map[component];
        const primary = cjklib.radicals.primary_radical[index];

        if (primary !== component) {
          components.push(primary);
        }
      }
    }

    Meteor.subscribe('getAllGlyphs', components);
  })).catch(console.error.bind(console));
}, 0));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bridges.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/bridges.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  BridgesStage: () => BridgesStage
});
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 0);
let Point;
module.link("/lib/base", {
  Point(v) {
    Point = v;
  }

}, 1);
let stroke_extractor;
module.link("/lib/stroke_extractor", {
  stroke_extractor(v) {
    stroke_extractor = v;
  }

}, 2);

const bridgeKey = bridge => bridge.map(Point.key).join('-');

const removeBridge = (bridges, bridge) => {
  const keys = {};
  keys[bridgeKey(bridge)] = true;
  keys[bridgeKey([bridge[1], bridge[0]])] = true;
  return bridges.filter(bridge => !keys[bridgeKey(bridge)]);
};

class BridgesStage extends AbstractStage {
  constructor(glyph) {
    super('bridges');
    const bridges = stroke_extractor.getBridges(glyph.stages.path);
    this.original = bridges.bridges;
    this.adjusted = glyph.stages.bridges || this.original;
    this.endpoints = bridges.endpoints.reduce((x, y) => x.concat(y), []);
    this.path = glyph.stages.path;
    this.selected_point = undefined;
  }

  handleClickOnBridge(bridge) {
    this.adjusted = removeBridge(this.adjusted, bridge);
  }

  handleClickOnPoint(point) {
    if (this.selected_point === undefined) {
      this.selected_point = point;
      return;
    } else if (Point.equal(point, this.selected_point)) {
      this.selected_point = undefined;
      return;
    }

    const bridge = [point, this.selected_point];
    this.selected_point = undefined;
    const without = removeBridge(this.adjusted, bridge);

    if (without.length < this.adjusted.length) {
      return;
    }

    this.adjusted.push(bridge);
  }

  handleEvent(event, template) {
    if (template.x1 !== undefined) {
      const bridge = [[template.x1, template.y1], [template.x2, template.y2]];
      this.handleClickOnBridge(bridge);
    } else if (template.cx !== undefined) {
      this.handleClickOnPoint([template.cx, template.cy]);
    }
  }

  refreshUI() {
    Session.set('stage.paths', [{
      d: this.path,
      fill: 'gray',
      stroke: 'gray'
    }]);
    const keys = {};
    this.original.map(bridge => {
      keys[bridgeKey(bridge)] = true;
      keys[bridgeKey([bridge[1], bridge[0]])] = true;
    });
    Session.set('stage.lines', this.adjusted.map(bridge => ({
      cls: 'selectable',
      stroke: keys[bridgeKey(bridge)] ? 'red' : 'purple',
      x1: bridge[0][0],
      y1: bridge[0][1],
      x2: bridge[1][0],
      y2: bridge[1][1]
    })));
    Session.set('stage.points', this.endpoints.map(endpoint => {
      let color = endpoint.corner ? 'red' : 'black';

      if (this.selected_point && Point.equal(endpoint.point, this.selected_point)) {
        color = 'purple';
      }

      return {
        cls: 'selectable',
        cx: endpoint.point[0],
        cy: endpoint.point[1],
        fill: color,
        stroke: color
      };
    }));
    const strokes = stroke_extractor.getStrokes(this.path, this.adjusted);
    const n = strokes.strokes.length;
    const message = "Extracted ".concat(n, " stroke").concat(n == 1 ? '' : 's', ".");
    const entry = {
      cls: 'success',
      message: message
    };
    Session.set('stage.status', strokes.log.concat([entry]));
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"order.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/order.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  OrderStage: () => OrderStage
});
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 0);
let assert, Point;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  Point(v) {
    Point = v;
  }

}, 1);
let decomposition_util;
module.link("/lib/decomposition_util", {
  decomposition_util(v) {
    decomposition_util = v;
  }

}, 2);
let Glyphs;
module.link("/lib/glyphs", {
  Glyphs(v) {
    Glyphs = v;
  }

}, 3);
let Hungarian;
module.link("/lib/hungarian", {
  Hungarian(v) {
    Hungarian = v;
  }

}, 4);
let median_util;
module.link("/lib/median_util", {
  median_util(v) {
    median_util = v;
  }

}, 5);
let stage = undefined;
const Order = new Mongo.Collection('order')._collection; // TODO(skishore): Consider using sqrt(1/2) in place of 1/2 here. This constant
// is used to compute bounds for components that are surrounded.

const rad2 = 1 / 2;
const compound_bounds = {
  '⿰': [[[0, 0], [1 / 2, 1]], [[1 / 2, 0], [1 / 2, 1]]],
  '⿱': [[[0, 0], [1, 1 / 2]], [[0, 1 / 2], [1, 1 / 2]]],
  '⿴': [[[0, 0], [1, 1]], [[(1 - rad2) / 2, (1 - rad2) / 2], [rad2, rad2]]],
  '⿵': [[[0, 0], [1, 1]], [[(1 - rad2) / 2, 1 - rad2], [rad2, rad2]]],
  '⿶': [[[0, 0], [1, 1]], [[(1 - rad2) / 2, 0], [rad2, rad2]]],
  '⿷': [[[0, 0], [1, 1]], [[1 - rad2, (1 - rad2) / 2], [rad2, rad2]]],
  '⿸': [[[0, 0], [1, 1 - rad2]], [[1 - rad2, 1 - rad2], [rad2, rad2]]],
  '⿹': [[[0, 0], [1, 1]], [[0, 1 - rad2], [rad2, rad2]]],
  '⿺': [[[0, 0], [1, 1]], [[1 - rad2, 0], [rad2, rad2]]],
  '⿻': [[[0, 0], [1, 1]], [[0, 0], [1, 1]]],
  '⿳': [[[0, 0], [1, 1 / 3]], [[0, 1 / 3], [1, 1 / 3]], [[0, 2 / 3], [1, 1 / 3]]],
  '⿲': [[[0, 0], [1 / 3, 1]], [[1 / 3, 0], [1 / 3, 1]], [[2 / 3, 0], [1 / 3, 1]]]
};

const augmentTreeWithBoundsData = (tree, bounds) => {
  tree.bounds = bounds;

  if (tree.type === 'compound') {
    const diff = Point.subtract(bounds[1], bounds[0]);
    const targets = compound_bounds[tree.value];
    assert(targets && targets.length === tree.children.length);

    for (let i = 0; i < targets.length; i++) {
      const target = [targets[i][0], Point.add(targets[i][0], targets[i][1])];
      const child_bounds = target.map(x => [x[0] * diff[0] + bounds[0][0], x[1] * diff[1] + bounds[0][1]]);
      augmentTreeWithBoundsData(tree.children[i], child_bounds);
    }
  } else {
    assert(!tree.children);
  }

  return tree;
};

const buildStrokeOrder = (tree, log) => {
  if (tree.type === 'character') {
    if (!tree.medians) {
      log.push("Missing component: ".concat(tree.value));
      return [];
    }

    return tree.medians.map(x => ({
      median: x,
      node: tree
    }));
  }

  const parts = tree.children.map(x => buildStrokeOrder(x, log));
  const child = tree.children[0].value;

  if (tree.value === '⿻') {
    log.push('Cannot infer stroke order for compound ⿻.');
  } else if (tree.value === '⿴') {
    assert(parts.length === 2);

    if (parts[0].length !== 3) {
      log.push('Compound ⿴ requires first component 囗. ' + "Got ".concat(child, " instead."));
    } else {
      return parts[0].slice(0, 2).concat(parts[1]).concat([parts[0][2]]);
    }
  } else if (tree.value === '⿷') {
    assert(parts.length === 2);

    if (parts[0].length !== 2) {
      log.push('Compound ⿷ requires first component ⼕ or ⼖. ' + "Got ".concat(child, " instead."));
    } else {
      return parts[0].slice(0, 1).concat(parts[1]).concat([parts[0][1]]);
    }
  } else if (tree.value === '⿶' || tree.value === '⿺' && '辶廴乙'.indexOf(child) >= 0) {
    assert(parts.length === 2);
    return parts[1].concat(parts[0]);
  }

  const result = [];
  parts.map(x => x.map(y => result.push(y)));
  return result;
};

const collectComponentNodes = (tree, result) => {
  result = result || [];

  if (tree.type === 'character' && tree.value !== '?') {
    result.push(tree);
  }

  for (let child of tree.children || []) {
    collectComponentNodes(child, result);
  }

  return result;
};

const getAffineTransform = (source, target) => {
  const sdiff = Point.subtract(source[1], source[0]);
  const tdiff = Point.subtract(target[1], target[0]);
  const ratio = [tdiff[0] / sdiff[0], tdiff[1] / sdiff[1]];
  return point => [ratio[0] * (point[0] - source[0][0]) + target[0][0], ratio[1] * (point[1] - source[0][1]) + target[0][1]];
};

const matchStrokes = (character, components) => {
  const normalize = median_util.normalizeForMatch;
  const sources = character.map(normalize);
  const targets = [];
  components.map(x => {
    const transform = getAffineTransform([[0, 0], [1, 1]], x.node.bounds);
    const target = normalize(x.median).map(transform);
    targets.push(target);
  });
  const matrix = [];
  const missing_penalty = 1024;
  const n = Math.max(sources.length, targets.length);

  for (let i = 0; i < n; i++) {
    matrix.push([]);

    for (let j = 0; j < n; j++) {
      if (i < sources.length && j < targets.length) {
        matrix[i].push(scoreStrokes(sources[i], targets[j]));
      } else {
        let top_left_penalty = 0;

        if (j >= targets.length) {
          // We want strokes that are not matched with components to be sorted
          // by their proximity to the top-left corner of the glyph. We compute
          // a penalty which is smaller for strokes closer to this corner,
          // then multiply the penalty by j so that those strokes come first.
          const direction = [0.01, 0.02];
          top_left_penalty = -j * Math.min(Point.dot(direction, sources[i][0]), Point.dot(direction, sources[i][sources[i].length - 1]));
        }

        matrix[i].push(-missing_penalty - top_left_penalty);
      }
    }
  }

  return new Hungarian(matrix).x_match;
};

const maybeReverse = (median, match) => {
  const diff1 = Point.subtract(median[median.length - 1], median[0]);
  let diff2 = [1, -2];

  if (match) {
    const target = match.median;
    diff2 = Point.subtract(target[target.length - 1], target[0]);
  }

  if (Point.dot(diff1, diff2) < 0) {
    median.reverse();
  }

  return median;
};

const scoreStrokes = (stroke1, stroke2) => {
  assert(stroke1.length === stroke2.length);
  let option1 = 0;
  let option2 = 0;

  _.range(stroke1.length).map(i => {
    option1 -= Point.distance2(stroke1[i], stroke2[i]);
    option2 -= Point.distance2(stroke1[i], stroke2[stroke2.length - i - 1]);
  });

  return Math.max(option1, option2);
};

class OrderStage extends AbstractStage {
  constructor(glyph) {
    super('order');
    this.adjusted = glyph.stages.order;
    this.medians = glyph.stages.strokes.raw.map(median_util.findStrokeMedian);
    this.strokes = glyph.stages.strokes.corrected;
    const tree = decomposition_util.convertDecompositionToTree(glyph.stages.analysis.decomposition);
    this.tree = augmentTreeWithBoundsData(tree, [[0, 0], [1, 1]]);
    this.indices = {
      null: -1
    };
    this.components = [];
    this.paths = [];
    collectComponentNodes(this.tree).map((x, i) => {
      this.indices[JSON.stringify(x.path)] = i;
      this.components.push(x.value);
      this.paths.push(x.path);
    });
    stage = this;
  }

  handleEvent(event, template) {
    const element = this.adjusted.filter(x => x.stroke === template.stroke_index)[0];
    const old_index = this.indices[JSON.stringify(element.match || null)];
    const new_index = (old_index + 2) % (this.components.length + 1) - 1;
    element.match = this.paths[new_index];
  }

  onAllComponentsReady() {
    if (this.adjusted) {
      return;
    }

    const nodes = collectComponentNodes(this.tree);
    nodes.map(node => {
      const glyph = Glyphs.findOne({
        character: node.value
      });
      node.medians = glyph.stages.order.map(x => x.median);
    });
    const log = [];
    const order = buildStrokeOrder(this.tree, log);
    const matching = matchStrokes(this.medians, order);

    const indices = _.range(this.medians.length).sort((a, b) => matching[a] - matching[b]);

    this.adjusted = indices.map(x => {
      const match = order[matching[x]];
      return {
        match: match ? match.node.path : undefined,
        median: maybeReverse(this.medians[x], match),
        stroke: x
      };
    });
    this.forceRefresh(true
    /* from_construct_stage */
    );
  }

  onReverseStroke(stroke) {
    const element = this.adjusted.filter(x => x.stroke === stroke)[0];
    element.median.reverse();
    this.forceRefresh();
  }

  onSort(old_index, new_index) {
    const elements = this.adjusted.splice(old_index, 1);
    assert(elements.length === 1);
    this.adjusted.splice(new_index, 0, elements[0]);
    this.forceRefresh();
  }

  refreshUI() {
    Session.set('stage.status', this.adjusted ? [] : [{
      cls: 'error',
      message: 'Loading component data...'
    }]);
    Session.set('stages.order.colors', this.colors);
    Session.set('stages.order.components', this.components);
    Session.set('stages.order.indices', this.indices);
    Session.set('stages.order.order', this.adjusted);
    Order.remove({});
    (this.adjusted || []).map((x, i) => {
      const key = JSON.stringify(x.match || null);
      const color = this.colors[this.indices[key]] || 'lightgray';
      const glyph = {
        lines: [{
          x1: x.median[0][0],
          y1: x.median[0][1],
          x2: x.median[x.median.length - 1][0],
          y2: x.median[x.median.length - 1][1]
        }],
        paths: [{
          d: this.strokes[x.stroke]
        }]
      };

      const lighten = (color, alpha) => {
        const c = parseInt(color.substr(1), 16);
        return "rgba(".concat(c >> 16, ", ").concat(c >> 8 & 0xFF, ", ").concat(c & 0xFF, ", ").concat(alpha, ")");
      };

      Order.insert({
        background: lighten(color, 0.1),
        color: color,
        glyph: glyph,
        index: i,
        stroke_index: x.stroke
      });
    });
  }

}

Template.order_stage.events({
  'click .permutation .entry .reverse': function (event) {
    stage && stage.onReverseStroke(this.stroke_index);
  }
});
Template.order_stage.helpers({
  character: () => {
    const colors = Session.get('stages.order.colors');
    const indices = Session.get('stages.order.indices');
    const order = Session.get('stages.order.order');
    const character = Session.get('editor.glyph');
    const result = {
      paths: []
    };

    if (!colors || !indices || !order || !character) {
      return result;
    }

    for (let element of order) {
      const index = indices[JSON.stringify(element.match || null)];
      const color = colors[index % colors.length];
      result.paths.push({
        cls: 'selectable',
        d: character.stages.strokes.corrected[element.stroke],
        fill: index < 0 ? 'lightgray' : color,
        stroke: index < 0 ? 'lightgray' : 'black',
        stroke_index: element.stroke
      });
    }

    return result;
  },
  components: () => {
    const colors = Session.get('stages.order.colors');
    const components = Session.get('stages.order.components');
    const result = [];

    if (!colors || !components) {
      return result;
    }

    for (let index = 0; index < components.length; index++) {
      const color = colors[index % colors.length];
      const glyph = Glyphs.findOne({
        character: components[index]
      });

      if (!glyph) {
        continue;
      }

      const component = [];

      for (let stroke of glyph.stages.strokes.corrected) {
        component.push({
          d: stroke,
          fill: color,
          stroke: 'black'
        });
      }

      result.push({
        glyph: {
          paths: component
        },
        top: "".concat(138 * index + 8, "px")
      });
    }

    return result;
  },
  items: () => {
    const order = Session.get('stages.order.order');
    return Order.find({}, {
      limit: (order || []).length
    });
  },
  options: () => {
    return {
      onSort: event => {
        // Suppress the two errors that will be printed when the Sortable
        // plugin tries to persist the sort result to the server.
        Meteor._suppress_log(2);

        stage && stage.onSort(event.oldIndex, event.newIndex);
      }
    };
  }
});
Meteor.startup(() => {
  Tracker.autorun(() => {
    const components = Session.get('stages.order.components') || [];
    Meteor.subscribe('getAllGlyphs', components);
  });
  Tracker.autorun(() => {
    const components = Session.get('stages.order.components') || [];
    const found = components.filter(x => Glyphs.findOne({
      character: x
    }));

    if (found.length === components.length && Session.get('stage.type') === 'order') {
      stage.onAllComponentsReady();
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"path.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/path.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  PathStage: () => PathStage
});
let opentype;
module.link("/client/external/opentype/0.4.10/opentype", {
  default(v) {
    opentype = v;
  }

}, 0);
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 1);
let assert, Point;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  Point(v) {
    Point = v;
  }

}, 2);
let Glyphs;
module.link("/lib/glyphs", {
  Glyphs(v) {
    Glyphs = v;
  }

}, 3);
let svg;
module.link("/lib/svg", {
  svg(v) {
    svg = v;
  }

}, 4);
let stage = undefined;

class PathStage extends AbstractStage {
  constructor(glyph) {
    super('path');
    this.adjusted = glyph.stages.path;
    this.character = glyph.character;
    this.alternative = undefined;
    this.error = 'No path data.';
    stage = this;
  }

  onGetPath(error, path) {
    Session.set('modal.value', undefined);
    this.adjusted = path;
    this.error = error;
    this.forceRefresh();
  }

  refreshUI() {
    const d = this.adjusted;
    Session.set('stage.paths', [{
      d: d,
      fill: 'gray',
      stroke: 'gray'
    }]);
    Session.set('stage.status', d ? [{
      cls: 'success',
      message: 'Got path data.'
    }] : [{
      cls: 'error',
      message: this.error
    }]);
    Session.set('stages.path.alternative', this.alternative);
  }

} // We avoid arrow functions in this map so that this is bound to the template.


Template.path_stage.events({
  'blur .value': function (event) {
    const text = $(event.target).text();
    const value = text.length === 1 && text !== '?' ? text : undefined;

    if (value === stage.alternative) {
      $(event.target).text(value || '?');
    } else {
      stage.alternative = value;
      stage.forceRefresh();
    }
  },
  'click .option': function (event) {
    const label = this.label;
    const character = stage.character;
    assert(character.length === 1);
    Session.set('modal.text', "Loading ".concat(label, "..."));
    Session.set('modal.value', 0);
    opentype.load(this.font, (error, font) => {
      stage.alternative = undefined;

      if (error) {
        stage.onGetPath("Error loading ".concat(label, ": ").concat(error));
        return;
      }

      Session.set('modal.text', "Extracting ".concat(character, " from ").concat(label, "..."));
      Session.set('modal.value', 0.5);
      const index = font.charToGlyphIndex(character);
      const glyph = font.glyphs.get(index);

      if (glyph.unicode !== character.codePointAt(0)) {
        stage.onGetPath("".concat(character, " is not present in ").concat(label, "."));
        return;
      } // TODO(skishore): We may want a try/catch around this call.


      const path = svg.convertCommandsToPath(glyph.path.commands);
      stage.onGetPath(undefined, path);
    });
  }
});
Template.path_stage.helpers({
  alternative: () => Session.get('stages.path.alternative') || '?',
  options: () => [{
    font: 'arphic/gkai00mp.ttf',
    label: 'AR PL KaitiM GB'
  }, {
    font: 'arphic/UKaiCN.ttf',
    label: 'AR PL UKai'
  }]
});
Meteor.startup(() => {
  Tracker.autorun(() => {
    const alternative = Session.get('stages.path.alternative');

    if (alternative) {
      Meteor.subscribe('getAllGlyphs', [alternative]);
      const glyph = Glyphs.findOne({
        character: alternative
      });

      if (!glyph) {
        stage.onGetPath("Could not find glyph for ".concat(alternative, "."));
      } else if (!glyph.stages.path) {
        stage.onGetPath("No available path for ".concat(alternative, "."));
      } else {
        stage.onGetPath(undefined, glyph.stages.path);
      }
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"strokes.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/strokes.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  StrokesStage: () => StrokesStage
});
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 0);
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 1);
let cjklib;
module.link("/lib/cjklib", {
  cjklib(v) {
    cjklib = v;
  }

}, 2);
let fixStrokes;
module.link("/lib/stroke_caps/fixStrokes", {
  fixStrokes(v) {
    fixStrokes = v;
  }

}, 3);
let stroke_extractor;
module.link("/lib/stroke_extractor", {
  stroke_extractor(v) {
    stroke_extractor = v;
  }

}, 4);

const getStatusLine = (actual, expected) => {
  const actual_text = "Selected ".concat(actual, " stroke").concat(actual === 1 ? '' : 's');

  if (!expected) {
    return {
      cls: 'error',
      message: "".concat(actual_text, ". True number unknown.")
    };
  } else if (actual !== expected) {
    return {
      cls: 'error',
      message: "".concat(actual_text, ", but need ").concat(expected, ".")
    };
  }

  return {
    cls: 'success',
    message: "".concat(actual_text, ".")
  };
};

const getStrokePaths = (strokes, include, colors) => {
  const result = [];

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    const color = include[stroke] ? colors[i % colors.length] : 'gray';
    result.push({
      cls: 'selectable',
      d: stroke,
      fill: color,
      stroke: 'black'
    });
  }

  return result;
};

class StrokesStage extends AbstractStage {
  constructor(glyph) {
    super('strokes');
    const raw = stroke_extractor.getStrokes(glyph.stages.path, glyph.stages.bridges).strokes;
    this.include = {};
    this.original = {
      corrected: fixStrokes(raw),
      raw
    };
    this.original.corrected.map(x => this.include[x] = true);

    if (glyph.stages.strokes) {
      this.original.corrected.map(x => this.include[x] = false);
      glyph.stages.strokes.corrected.map(x => this.include[x] = true);
    }
  }

  getStageOutput() {
    const fn = (_, i) => this.include[this.original.corrected[i]];

    return {
      raw: this.original.raw.filter(fn),
      corrected: this.original.corrected.filter(fn)
    };
  }

  handleEvent(event, template) {
    assert(this.include.hasOwnProperty(template.d));
    this.include[template.d] = !this.include[template.d];
  }

  refreshUI(character, metadata) {
    const strokes = this.original.corrected;
    Session.set('stage.paths', getStrokePaths(strokes, this.include, this.colors));
    const data = cjklib.getCharacterData(character);
    const actual = this.getStageOutput().corrected.length;
    const expected = metadata.strokes || data.strokes;
    Session.set('stage.status', [getStatusLine(actual, expected)]);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"verified.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/lib/verified.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  VerifiedStage: () => VerifiedStage
});
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 0);
let getAnimationData;
module.link("/lib/animation", {
  getAnimationData(v) {
    getAnimationData = v;
  }

}, 1);

class VerifiedStage extends AbstractStage {
  constructor(glyph) {
    super('verified');
    const strokes = glyph.stages.order.map(x => glyph.stages.strokes.corrected[x.stroke]);
    const medians = glyph.stages.order.map(x => x.median);
    this.data = getAnimationData(strokes, medians);
  }

  refreshUI() {
    Session.set('stage.status', [{
      cls: 'success',
      message: 'Character analysis complete.'
    }]);
    Session.set('stages.verified.data', this.data);
  }

}

Template.verified_stage.helpers({
  data: () => Session.get('stages.verified.data')
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"external":{"bootstrap":{"3.1.1":{"bootstrap.min.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/external/bootstrap/3.1.1/bootstrap.min.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*!
 * Bootstrap v3.1.1 (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */
if("undefined"==typeof jQuery)throw new Error("Bootstrap's JavaScript requires jQuery");+function(a){"use strict";function b(){var a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var c in b)if(void 0!==a.style[c])return{end:b[c]};return!1}a.fn.emulateTransitionEnd=function(b){var c=!1,d=this;a(this).one(a.support.transition.end,function(){c=!0});var e=function(){c||a(d).trigger(a.support.transition.end)};return setTimeout(e,b),this},a(function(){a.support.transition=b()})}(jQuery),+function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype.close=function(b){function c(){f.trigger("closed.bs.alert").remove()}var d=a(this),e=d.attr("data-target");e||(e=d.attr("href"),e=e&&e.replace(/.*(?=#[^\s]*$)/,""));var f=a(e);b&&b.preventDefault(),f.length||(f=d.hasClass("alert")?d:d.parent()),f.trigger(b=a.Event("close.bs.alert")),b.isDefaultPrevented()||(f.removeClass("in"),a.support.transition&&f.hasClass("fade")?f.one(a.support.transition.end,c).emulateTransitionEnd(150):c())};var d=a.fn.alert;a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("bs.alert");e||d.data("bs.alert",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.alert.Constructor=c,a.fn.alert.noConflict=function(){return a.fn.alert=d,this},a(document).on("click.bs.alert.data-api",b,c.prototype.close)}(jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.isLoading=!1};b.DEFAULTS={loadingText:"loading..."},b.prototype.setState=function(b){var c="disabled",d=this.$element,e=d.is("input")?"val":"html",f=d.data();b+="Text",f.resetText||d.data("resetText",d[e]()),d[e](f[b]||this.options[b]),setTimeout(a.proxy(function(){"loadingText"==b?(this.isLoading=!0,d.addClass(c).attr(c,c)):this.isLoading&&(this.isLoading=!1,d.removeClass(c).removeAttr(c))},this),0)},b.prototype.toggle=function(){var a=!0,b=this.$element.closest('[data-toggle="buttons"]');if(b.length){var c=this.$element.find("input");"radio"==c.prop("type")&&(c.prop("checked")&&this.$element.hasClass("active")?a=!1:b.find(".active").removeClass("active")),a&&c.prop("checked",!this.$element.hasClass("active")).trigger("change")}a&&this.$element.toggleClass("active")};var c=a.fn.button;a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("bs.button"),f="object"==typeof c&&c;e||d.data("bs.button",e=new b(this,f)),"toggle"==c?e.toggle():c&&e.setState(c)})},a.fn.button.Constructor=b,a.fn.button.noConflict=function(){return a.fn.button=c,this},a(document).on("click.bs.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle"),b.preventDefault()})}(jQuery),+function(a){"use strict";var b=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,this.paused=this.sliding=this.interval=this.$active=this.$items=null,"hover"==this.options.pause&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.DEFAULTS={interval:5e3,pause:"hover",wrap:!0},b.prototype.cycle=function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},b.prototype.getActiveIndex=function(){return this.$active=this.$element.find(".item.active"),this.$items=this.$active.parent().children(),this.$items.index(this.$active)},b.prototype.to=function(b){var c=this,d=this.getActiveIndex();return b>this.$items.length-1||0>b?void 0:this.sliding?this.$element.one("slid.bs.carousel",function(){c.to(b)}):d==b?this.pause().cycle():this.slide(b>d?"next":"prev",a(this.$items[b]))},b.prototype.pause=function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},b.prototype.next=function(){return this.sliding?void 0:this.slide("next")},b.prototype.prev=function(){return this.sliding?void 0:this.slide("prev")},b.prototype.slide=function(b,c){var d=this.$element.find(".item.active"),e=c||d[b](),f=this.interval,g="next"==b?"left":"right",h="next"==b?"first":"last",i=this;if(!e.length){if(!this.options.wrap)return;e=this.$element.find(".item")[h]()}if(e.hasClass("active"))return this.sliding=!1;var j=a.Event("slide.bs.carousel",{relatedTarget:e[0],direction:g});return this.$element.trigger(j),j.isDefaultPrevented()?void 0:(this.sliding=!0,f&&this.pause(),this.$indicators.length&&(this.$indicators.find(".active").removeClass("active"),this.$element.one("slid.bs.carousel",function(){var b=a(i.$indicators.children()[i.getActiveIndex()]);b&&b.addClass("active")})),a.support.transition&&this.$element.hasClass("slide")?(e.addClass(b),e[0].offsetWidth,d.addClass(g),e.addClass(g),d.one(a.support.transition.end,function(){e.removeClass([b,g].join(" ")).addClass("active"),d.removeClass(["active",g].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger("slid.bs.carousel")},0)}).emulateTransitionEnd(1e3*d.css("transition-duration").slice(0,-1))):(d.removeClass("active"),e.addClass("active"),this.sliding=!1,this.$element.trigger("slid.bs.carousel")),f&&this.cycle(),this)};var c=a.fn.carousel;a.fn.carousel=function(c){return this.each(function(){var d=a(this),e=d.data("bs.carousel"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c),g="string"==typeof c?c:f.slide;e||d.data("bs.carousel",e=new b(this,f)),"number"==typeof c?e.to(c):g?e[g]():f.interval&&e.pause().cycle()})},a.fn.carousel.Constructor=b,a.fn.carousel.noConflict=function(){return a.fn.carousel=c,this},a(document).on("click.bs.carousel.data-api","[data-slide], [data-slide-to]",function(b){var c,d=a(this),e=a(d.attr("data-target")||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,"")),f=a.extend({},e.data(),d.data()),g=d.attr("data-slide-to");g&&(f.interval=!1),e.carousel(f),(g=d.attr("data-slide-to"))&&e.data("bs.carousel").to(g),b.preventDefault()}),a(window).on("load",function(){a('[data-ride="carousel"]').each(function(){var b=a(this);b.carousel(b.data())})})}(jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.transitioning=null,this.options.parent&&(this.$parent=a(this.options.parent)),this.options.toggle&&this.toggle()};b.DEFAULTS={toggle:!0},b.prototype.dimension=function(){var a=this.$element.hasClass("width");return a?"width":"height"},b.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var b=a.Event("show.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.$parent&&this.$parent.find("> .panel > .in");if(c&&c.length){var d=c.data("bs.collapse");if(d&&d.transitioning)return;c.collapse("hide"),d||c.data("bs.collapse",null)}var e=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[e](0),this.transitioning=1;var f=function(){this.$element.removeClass("collapsing").addClass("collapse in")[e]("auto"),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return f.call(this);var g=a.camelCase(["scroll",e].join("-"));this.$element.one(a.support.transition.end,a.proxy(f,this)).emulateTransitionEnd(350)[e](this.$element[0][g])}}},b.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var b=a.Event("hide.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse").removeClass("in"),this.transitioning=1;var d=function(){this.transitioning=0,this.$element.trigger("hidden.bs.collapse").removeClass("collapsing").addClass("collapse")};return a.support.transition?void this.$element[c](0).one(a.support.transition.end,a.proxy(d,this)).emulateTransitionEnd(350):d.call(this)}}},b.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()};var c=a.fn.collapse;a.fn.collapse=function(c){return this.each(function(){var d=a(this),e=d.data("bs.collapse"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c);!e&&f.toggle&&"show"==c&&(c=!c),e||d.data("bs.collapse",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.collapse.Constructor=b,a.fn.collapse.noConflict=function(){return a.fn.collapse=c,this},a(document).on("click.bs.collapse.data-api","[data-toggle=collapse]",function(b){var c,d=a(this),e=d.attr("data-target")||b.preventDefault()||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,""),f=a(e),g=f.data("bs.collapse"),h=g?"toggle":d.data(),i=d.attr("data-parent"),j=i&&a(i);g&&g.transitioning||(j&&j.find('[data-toggle=collapse][data-parent="'+i+'"]').not(d).addClass("collapsed"),d[f.hasClass("in")?"addClass":"removeClass"]("collapsed")),f.collapse(h)})}(jQuery),+function(a){"use strict";function b(b){a(d).remove(),a(e).each(function(){var d=c(a(this)),e={relatedTarget:this};d.hasClass("open")&&(d.trigger(b=a.Event("hide.bs.dropdown",e)),b.isDefaultPrevented()||d.removeClass("open").trigger("hidden.bs.dropdown",e))})}function c(b){var c=b.attr("data-target");c||(c=b.attr("href"),c=c&&/#[A-Za-z]/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,""));var d=c&&a(c);return d&&d.length?d:b.parent()}var d=".dropdown-backdrop",e="[data-toggle=dropdown]",f=function(b){a(b).on("click.bs.dropdown",this.toggle)};f.prototype.toggle=function(d){var e=a(this);if(!e.is(".disabled, :disabled")){var f=c(e),g=f.hasClass("open");if(b(),!g){"ontouchstart"in document.documentElement&&!f.closest(".navbar-nav").length&&a('<div class="dropdown-backdrop"/>').insertAfter(a(this)).on("click",b);var h={relatedTarget:this};if(f.trigger(d=a.Event("show.bs.dropdown",h)),d.isDefaultPrevented())return;f.toggleClass("open").trigger("shown.bs.dropdown",h),e.focus()}return!1}},f.prototype.keydown=function(b){if(/(38|40|27)/.test(b.keyCode)){var d=a(this);if(b.preventDefault(),b.stopPropagation(),!d.is(".disabled, :disabled")){var f=c(d),g=f.hasClass("open");if(!g||g&&27==b.keyCode)return 27==b.which&&f.find(e).focus(),d.click();var h=" li:not(.divider):visible a",i=f.find("[role=menu]"+h+", [role=listbox]"+h);if(i.length){var j=i.index(i.filter(":focus"));38==b.keyCode&&j>0&&j--,40==b.keyCode&&j<i.length-1&&j++,~j||(j=0),i.eq(j).focus()}}}};var g=a.fn.dropdown;a.fn.dropdown=function(b){return this.each(function(){var c=a(this),d=c.data("bs.dropdown");d||c.data("bs.dropdown",d=new f(this)),"string"==typeof b&&d[b].call(c)})},a.fn.dropdown.Constructor=f,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=g,this},a(document).on("click.bs.dropdown.data-api",b).on("click.bs.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.bs.dropdown.data-api",e,f.prototype.toggle).on("keydown.bs.dropdown.data-api",e+", [role=menu], [role=listbox]",f.prototype.keydown)}(jQuery),+function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b),this.$backdrop=this.isShown=null,this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};b.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},b.prototype.toggle=function(a){return this[this.isShown?"hide":"show"](a)},b.prototype.show=function(b){var c=this,d=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(d),this.isShown||d.isDefaultPrevented()||(this.isShown=!0,this.escape(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.backdrop(function(){var d=a.support.transition&&c.$element.hasClass("fade");c.$element.parent().length||c.$element.appendTo(document.body),c.$element.show().scrollTop(0),d&&c.$element[0].offsetWidth,c.$element.addClass("in").attr("aria-hidden",!1),c.enforceFocus();var e=a.Event("shown.bs.modal",{relatedTarget:b});d?c.$element.find(".modal-dialog").one(a.support.transition.end,function(){c.$element.focus().trigger(e)}).emulateTransitionEnd(300):c.$element.focus().trigger(e)}))},b.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one(a.support.transition.end,a.proxy(this.hideModal,this)).emulateTransitionEnd(300):this.hideModal())},b.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){this.$element[0]===a.target||this.$element.has(a.target).length||this.$element.focus()},this))},b.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.bs.modal",a.proxy(function(a){27==a.which&&this.hide()},this)):this.isShown||this.$element.off("keyup.dismiss.bs.modal")},b.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden.bs.modal")})},b.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},b.prototype.backdrop=function(b){var c=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var d=a.support.transition&&c;if(this.$backdrop=a('<div class="modal-backdrop '+c+'" />').appendTo(document.body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(a){a.target===a.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus.call(this.$element[0]):this.hide.call(this))},this)),d&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;d?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()):b&&b()};var c=a.fn.modal;a.fn.modal=function(c,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},b.DEFAULTS,e.data(),"object"==typeof c&&c);f||e.data("bs.modal",f=new b(this,g)),"string"==typeof c?f[c](d):g.show&&f.show(d)})},a.fn.modal.Constructor=b,a.fn.modal.noConflict=function(){return a.fn.modal=c,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());c.is("a")&&b.preventDefault(),e.modal(f,this).one("hide",function(){c.is(":visible")&&c.focus()})}),a(document).on("show.bs.modal",".modal",function(){a(document.body).addClass("modal-open")}).on("hidden.bs.modal",".modal",function(){a(document.body).removeClass("modal-open")})}(jQuery),+function(a){"use strict";var b=function(a,b){this.type=this.options=this.enabled=this.timeout=this.hoverState=this.$element=null,this.init("tooltip",a,b)};b.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1},b.prototype.init=function(b,c,d){this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d);for(var e=this.options.trigger.split(" "),f=e.length;f--;){var g=e[f];if("click"==g)this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if("manual"!=g){var h="hover"==g?"mouseenter":"focusin",i="hover"==g?"mouseleave":"focusout";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},b.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},b.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="in",c.options.delay&&c.options.delay.show?void(c.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show)):c.show()},b.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="out",c.options.delay&&c.options.delay.hide?void(c.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide)):c.hide()},b.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){if(this.$element.trigger(b),b.isDefaultPrevented())return;var c=this,d=this.tip();this.setContent(),this.options.animation&&d.addClass("fade");var e="function"==typeof this.options.placement?this.options.placement.call(this,d[0],this.$element[0]):this.options.placement,f=/\s?auto?\s?/i,g=f.test(e);g&&(e=e.replace(f,"")||"top"),d.detach().css({top:0,left:0,display:"block"}).addClass(e),this.options.container?d.appendTo(this.options.container):d.insertAfter(this.$element);var h=this.getPosition(),i=d[0].offsetWidth,j=d[0].offsetHeight;if(g){var k=this.$element.parent(),l=e,m=document.documentElement.scrollTop||document.body.scrollTop,n="body"==this.options.container?window.innerWidth:k.outerWidth(),o="body"==this.options.container?window.innerHeight:k.outerHeight(),p="body"==this.options.container?0:k.offset().left;e="bottom"==e&&h.top+h.height+j-m>o?"top":"top"==e&&h.top-m-j<0?"bottom":"right"==e&&h.right+i>n?"left":"left"==e&&h.left-i<p?"right":e,d.removeClass(l).addClass(e)}var q=this.getCalculatedOffset(e,h,i,j);this.applyPlacement(q,e),this.hoverState=null;var r=function(){c.$element.trigger("shown.bs."+c.type)};a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,r).emulateTransitionEnd(150):r()}},b.prototype.applyPlacement=function(b,c){var d,e=this.tip(),f=e[0].offsetWidth,g=e[0].offsetHeight,h=parseInt(e.css("margin-top"),10),i=parseInt(e.css("margin-left"),10);isNaN(h)&&(h=0),isNaN(i)&&(i=0),b.top=b.top+h,b.left=b.left+i,a.offset.setOffset(e[0],a.extend({using:function(a){e.css({top:Math.round(a.top),left:Math.round(a.left)})}},b),0),e.addClass("in");var j=e[0].offsetWidth,k=e[0].offsetHeight;if("top"==c&&k!=g&&(d=!0,b.top=b.top+g-k),/bottom|top/.test(c)){var l=0;b.left<0&&(l=-2*b.left,b.left=0,e.offset(b),j=e[0].offsetWidth,k=e[0].offsetHeight),this.replaceArrow(l-f+j,j,"left")}else this.replaceArrow(k-g,k,"top");d&&e.offset(b)},b.prototype.replaceArrow=function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},b.prototype.hide=function(){function b(){"in"!=c.hoverState&&d.detach(),c.$element.trigger("hidden.bs."+c.type)}var c=this,d=this.tip(),e=a.Event("hide.bs."+this.type);return this.$element.trigger(e),e.isDefaultPrevented()?void 0:(d.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,b).emulateTransitionEnd(150):b(),this.hoverState=null,this)},b.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},b.prototype.hasContent=function(){return this.getTitle()},b.prototype.getPosition=function(){var b=this.$element[0];return a.extend({},"function"==typeof b.getBoundingClientRect?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},b.prototype.getCalculatedOffset=function(a,b,c,d){return"bottom"==a?{top:b.top+b.height,left:b.left+b.width/2-c/2}:"top"==a?{top:b.top-d,left:b.left+b.width/2-c/2}:"left"==a?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},b.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},b.prototype.tip=function(){return this.$tip=this.$tip||a(this.options.template)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},b.prototype.validate=function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},b.prototype.enable=function(){this.enabled=!0},b.prototype.disable=function(){this.enabled=!1},b.prototype.toggleEnabled=function(){this.enabled=!this.enabled},b.prototype.toggle=function(b){var c=b?a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type):this;c.tip().hasClass("in")?c.leave(c):c.enter(c)},b.prototype.destroy=function(){clearTimeout(this.timeout),this.hide().$element.off("."+this.type).removeData("bs."+this.type)};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f="object"==typeof c&&c;(e||"destroy"!=c)&&(e||d.data("bs.tooltip",e=new b(this,f)),"string"==typeof c&&e[c]())})},a.fn.tooltip.Constructor=b,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}(jQuery),+function(a){"use strict";var b=function(a,b){this.init("popover",a,b)};if(!a.fn.tooltip)throw new Error("Popover requires tooltip.js");b.DEFAULTS=a.extend({},a.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype),b.prototype.constructor=b,b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content")[this.options.html?"string"==typeof c?"html":"append":"text"](c),a.removeClass("fade top bottom left right in"),a.find(".popover-title").html()||a.find(".popover-title").hide()},b.prototype.hasContent=function(){return this.getTitle()||this.getContent()},b.prototype.getContent=function(){var a=this.$element,b=this.options;return a.attr("data-content")||("function"==typeof b.content?b.content.call(a[0]):b.content)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")},b.prototype.tip=function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip};var c=a.fn.popover;a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("bs.popover"),f="object"==typeof c&&c;(e||"destroy"!=c)&&(e||d.data("bs.popover",e=new b(this,f)),"string"==typeof c&&e[c]())})},a.fn.popover.Constructor=b,a.fn.popover.noConflict=function(){return a.fn.popover=c,this}}(jQuery),+function(a){"use strict";function b(c,d){var e,f=a.proxy(this.process,this);this.$element=a(a(c).is("body")?window:c),this.$body=a("body"),this.$scrollElement=this.$element.on("scroll.bs.scroll-spy.data-api",f),this.options=a.extend({},b.DEFAULTS,d),this.selector=(this.options.target||(e=a(c).attr("href"))&&e.replace(/.*(?=#[^\s]+$)/,"")||"")+" .nav li > a",this.offsets=a([]),this.targets=a([]),this.activeTarget=null,this.refresh(),this.process()}b.DEFAULTS={offset:10},b.prototype.refresh=function(){var b=this.$element[0]==window?"offset":"position";this.offsets=a([]),this.targets=a([]);{var c=this;this.$body.find(this.selector).map(function(){var d=a(this),e=d.data("target")||d.attr("href"),f=/^#./.test(e)&&a(e);return f&&f.length&&f.is(":visible")&&[[f[b]().top+(!a.isWindow(c.$scrollElement.get(0))&&c.$scrollElement.scrollTop()),e]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){c.offsets.push(this[0]),c.targets.push(this[1])})}},b.prototype.process=function(){var a,b=this.$scrollElement.scrollTop()+this.options.offset,c=this.$scrollElement[0].scrollHeight||this.$body[0].scrollHeight,d=c-this.$scrollElement.height(),e=this.offsets,f=this.targets,g=this.activeTarget;if(b>=d)return g!=(a=f.last()[0])&&this.activate(a);if(g&&b<=e[0])return g!=(a=f[0])&&this.activate(a);for(a=e.length;a--;)g!=f[a]&&b>=e[a]&&(!e[a+1]||b<=e[a+1])&&this.activate(f[a])},b.prototype.activate=function(b){this.activeTarget=b,a(this.selector).parentsUntil(this.options.target,".active").removeClass("active");var c=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',d=a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length&&(d=d.closest("li.dropdown").addClass("active")),d.trigger("activate.bs.scrollspy")};var c=a.fn.scrollspy;a.fn.scrollspy=function(c){return this.each(function(){var d=a(this),e=d.data("bs.scrollspy"),f="object"==typeof c&&c;e||d.data("bs.scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.scrollspy.Constructor=b,a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=c,this},a(window).on("load",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);b.scrollspy(b.data())})})}(jQuery),+function(a){"use strict";var b=function(b){this.element=a(b)};b.prototype.show=function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.data("target");if(d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),!b.parent("li").hasClass("active")){var e=c.find(".active:last a")[0],f=a.Event("show.bs.tab",{relatedTarget:e});if(b.trigger(f),!f.isDefaultPrevented()){var g=a(d);this.activate(b.parent("li"),c),this.activate(g,g.parent(),function(){b.trigger({type:"shown.bs.tab",relatedTarget:e})})}}},b.prototype.activate=function(b,c,d){function e(){f.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"),b.addClass("active"),g?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active"),d&&d()}var f=c.find("> .active"),g=d&&a.support.transition&&f.hasClass("fade");g?f.one(a.support.transition.end,e).emulateTransitionEnd(150):e(),f.removeClass("in")};var c=a.fn.tab;a.fn.tab=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tab");e||d.data("bs.tab",e=new b(this)),"string"==typeof c&&e[c]()})},a.fn.tab.Constructor=b,a.fn.tab.noConflict=function(){return a.fn.tab=c,this},a(document).on("click.bs.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(b){b.preventDefault(),a(this).tab("show")})}(jQuery),+function(a){"use strict";var b=function(c,d){this.options=a.extend({},b.DEFAULTS,d),this.$window=a(window).on("scroll.bs.affix.data-api",a.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",a.proxy(this.checkPositionWithEventLoop,this)),this.$element=a(c),this.affixed=this.unpin=this.pinnedOffset=null,this.checkPosition()};b.RESET="affix affix-top affix-bottom",b.DEFAULTS={offset:0},b.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset;this.$element.removeClass(b.RESET).addClass("affix");var a=this.$window.scrollTop(),c=this.$element.offset();return this.pinnedOffset=c.top-a},b.prototype.checkPositionWithEventLoop=function(){setTimeout(a.proxy(this.checkPosition,this),1)},b.prototype.checkPosition=function(){if(this.$element.is(":visible")){var c=a(document).height(),d=this.$window.scrollTop(),e=this.$element.offset(),f=this.options.offset,g=f.top,h=f.bottom;"top"==this.affixed&&(e.top+=d),"object"!=typeof f&&(h=g=f),"function"==typeof g&&(g=f.top(this.$element)),"function"==typeof h&&(h=f.bottom(this.$element));var i=null!=this.unpin&&d+this.unpin<=e.top?!1:null!=h&&e.top+this.$element.height()>=c-h?"bottom":null!=g&&g>=d?"top":!1;if(this.affixed!==i){this.unpin&&this.$element.css("top","");var j="affix"+(i?"-"+i:""),k=a.Event(j+".bs.affix");this.$element.trigger(k),k.isDefaultPrevented()||(this.affixed=i,this.unpin="bottom"==i?this.getPinnedOffset():null,this.$element.removeClass(b.RESET).addClass(j).trigger(a.Event(j.replace("affix","affixed"))),"bottom"==i&&this.$element.offset({top:c-h-this.$element.height()}))}}};var c=a.fn.affix;a.fn.affix=function(c){return this.each(function(){var d=a(this),e=d.data("bs.affix"),f="object"==typeof c&&c;e||d.data("bs.affix",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.affix.Constructor=b,a.fn.affix.noConflict=function(){return a.fn.affix=c,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var b=a(this),c=b.data();c.offset=c.offset||{},c.offsetBottom&&(c.offset.bottom=c.offsetBottom),c.offsetTop&&(c.offset.top=c.offsetTop),b.affix(c)})})}(jQuery);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"opentype":{"0.4.10":{"opentype.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/external/opentype/0.4.10/opentype.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  (function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = f();
    } else if (typeof define === "function" && define.amd) {
      define([], f);
    } else {
      var g;

      if (typeof window !== "undefined") {
        g = window;
      } else if (typeof global !== "undefined") {
        g = global;
      } else if (typeof self !== "undefined") {
        g = self;
      } else {
        g = this;
      }

      g.opentype = f();
    }
  })(function () {
    var define, module, exports;
    return function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a) return a(o, !0);
            if (i) return i(o, !0);
            var f = new Error("Cannot find module '" + o + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }

          var l = n[o] = {
            exports: {}
          };
          t[o][0].call(l.exports, function (e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, l, l.exports, e, t, n, r);
        }

        return n[o].exports;
      }

      var i = typeof require == "function" && require;

      for (var o = 0; o < r.length; o++) s(r[o]);

      return s;
    }({
      1: [function (require, module, exports) {
        // Run-time checking of preconditions.
        'use strict'; // Precondition function that checks if the given predicate is true.
        // If not, it will throw an error.

        exports.argument = function (predicate, message) {
          if (!predicate) {
            throw new Error(message);
          }
        }; // Precondition function that checks if the given assertion is true.
        // If not, it will throw an error.


        exports.assert = exports.argument;
      }, {}],
      2: [function (require, module, exports) {
        // Drawing utility functions.
        'use strict'; // Draw a line on the given context from point `x1,y1` to point `x2,y2`.

        function line(ctx, x1, y1, x2, y2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        exports.line = line;
      }, {}],
      3: [function (require, module, exports) {
        // Glyph encoding
        'use strict';

        var cffStandardStrings = ['.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore', 'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl', 'periodcentered', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand', 'questiondown', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', 'ring', 'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'emdash', 'AE', 'ordfeminine', 'Lslash', 'Oslash', 'OE', 'ordmasculine', 'ae', 'dotlessi', 'lslash', 'oslash', 'oe', 'germandbls', 'onesuperior', 'logicalnot', 'mu', 'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn', 'onequarter', 'divide', 'brokenbar', 'degree', 'thorn', 'threequarters', 'twosuperior', 'registered', 'minus', 'eth', 'multiply', 'threesuperior', 'copyright', 'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring', 'Atilde', 'Ccedilla', 'Eacute', 'Ecircumflex', 'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute', 'Ocircumflex', 'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute', 'Ucircumflex', 'Udieresis', 'Ugrave', 'Yacute', 'Ydieresis', 'Zcaron', 'aacute', 'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde', 'ccedilla', 'eacute', 'ecircumflex', 'edieresis', 'egrave', 'iacute', 'icircumflex', 'idieresis', 'igrave', 'ntilde', 'oacute', 'ocircumflex', 'odieresis', 'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex', 'udieresis', 'ugrave', 'yacute', 'ydieresis', 'zcaron', 'exclamsmall', 'Hungarumlautsmall', 'dollaroldstyle', 'dollarsuperior', 'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', '266 ff', 'onedotenleader', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior', 'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior', 'tsuperior', 'ff', 'ffi', 'ffl', 'parenleftinferior', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall', 'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall', 'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall', 'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', 'exclamdownsmall', 'centoldstyle', 'Lslashsmall', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall', 'Dotaccentsmall', 'Macronsmall', 'figuredash', 'hypheninferior', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', 'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', 'zerosuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall', '001.000', '001.001', '001.002', '001.003', 'Black', 'Bold', 'Book', 'Light', 'Medium', 'Regular', 'Roman', 'Semibold'];
        var cffStandardEncoding = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore', 'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', '', 'endash', 'dagger', 'daggerdbl', 'periodcentered', '', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand', '', 'questiondown', '', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', '', 'ring', 'cedilla', '', 'hungarumlaut', 'ogonek', 'caron', 'emdash', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'AE', '', 'ordfeminine', '', '', '', '', 'Lslash', 'Oslash', 'OE', 'ordmasculine', '', '', '', '', '', 'ae', '', '', '', 'dotlessi', '', '', 'lslash', 'oslash', 'oe', 'germandbls'];
        var cffExpertEncoding = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'space', 'exclamsmall', 'Hungarumlautsmall', '', 'dollaroldstyle', 'dollarsuperior', 'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', 'twodotenleader', 'onedotenleader', 'comma', 'hyphen', 'period', 'fraction', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'colon', 'semicolon', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', '', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', '', '', 'isuperior', '', '', 'lsuperior', 'msuperior', 'nsuperior', 'osuperior', '', '', 'rsuperior', 'ssuperior', 'tsuperior', '', 'ff', 'fi', 'fl', 'ffi', 'ffl', 'parenleftinferior', '', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall', 'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall', 'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall', 'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'exclamdownsmall', 'centoldstyle', 'Lslashsmall', '', '', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall', '', 'Dotaccentsmall', '', '', 'Macronsmall', '', '', 'figuredash', 'hypheninferior', '', '', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', '', '', '', 'onequarter', 'onehalf', 'threequarters', 'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', '', '', 'zerosuperior', 'onesuperior', 'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall'];
        var standardNames = ['.notdef', '.null', 'nonmarkingreturn', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quotesingle', 'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore', 'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'Adieresis', 'Aring', 'Ccedilla', 'Eacute', 'Ntilde', 'Odieresis', 'Udieresis', 'aacute', 'agrave', 'acircumflex', 'adieresis', 'atilde', 'aring', 'ccedilla', 'eacute', 'egrave', 'ecircumflex', 'edieresis', 'iacute', 'igrave', 'icircumflex', 'idieresis', 'ntilde', 'oacute', 'ograve', 'ocircumflex', 'odieresis', 'otilde', 'uacute', 'ugrave', 'ucircumflex', 'udieresis', 'dagger', 'degree', 'cent', 'sterling', 'section', 'bullet', 'paragraph', 'germandbls', 'registered', 'copyright', 'trademark', 'acute', 'dieresis', 'notequal', 'AE', 'Oslash', 'infinity', 'plusminus', 'lessequal', 'greaterequal', 'yen', 'mu', 'partialdiff', 'summation', 'product', 'pi', 'integral', 'ordfeminine', 'ordmasculine', 'Omega', 'ae', 'oslash', 'questiondown', 'exclamdown', 'logicalnot', 'radical', 'florin', 'approxequal', 'Delta', 'guillemotleft', 'guillemotright', 'ellipsis', 'nonbreakingspace', 'Agrave', 'Atilde', 'Otilde', 'OE', 'oe', 'endash', 'emdash', 'quotedblleft', 'quotedblright', 'quoteleft', 'quoteright', 'divide', 'lozenge', 'ydieresis', 'Ydieresis', 'fraction', 'currency', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'daggerdbl', 'periodcentered', 'quotesinglbase', 'quotedblbase', 'perthousand', 'Acircumflex', 'Ecircumflex', 'Aacute', 'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Oacute', 'Ocircumflex', 'apple', 'Ograve', 'Uacute', 'Ucircumflex', 'Ugrave', 'dotlessi', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'ring', 'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'Lslash', 'lslash', 'Scaron', 'scaron', 'Zcaron', 'zcaron', 'brokenbar', 'Eth', 'eth', 'Yacute', 'yacute', 'Thorn', 'thorn', 'minus', 'multiply', 'onesuperior', 'twosuperior', 'threesuperior', 'onehalf', 'onequarter', 'threequarters', 'franc', 'Gbreve', 'gbreve', 'Idotaccent', 'Scedilla', 'scedilla', 'Cacute', 'cacute', 'Ccaron', 'ccaron', 'dcroat']; // This is the encoding used for fonts created from scratch.
        // It loops through all glyphs and finds the appropriate unicode value.
        // Since it's linear time, other encodings will be faster.

        function DefaultEncoding(font) {
          this.font = font;
        }

        DefaultEncoding.prototype.charToGlyphIndex = function (c) {
          var code = c.charCodeAt(0);
          var glyphs = this.font.glyphs;

          if (glyphs) {
            for (var i = 0; i < glyphs.length; i += 1) {
              var glyph = glyphs.get(i);

              for (var j = 0; j < glyph.unicodes.length; j += 1) {
                if (glyph.unicodes[j] === code) {
                  return i;
                }
              }
            }
          } else {
            return null;
          }
        };

        function CmapEncoding(cmap) {
          this.cmap = cmap;
        }

        CmapEncoding.prototype.charToGlyphIndex = function (c) {
          return this.cmap.glyphIndexMap[c.charCodeAt(0)] || 0;
        };

        function CffEncoding(encoding, charset) {
          this.encoding = encoding;
          this.charset = charset;
        }

        CffEncoding.prototype.charToGlyphIndex = function (s) {
          var code = s.charCodeAt(0);
          var charName = this.encoding[code];
          return this.charset.indexOf(charName);
        };

        function GlyphNames(post) {
          var i;

          switch (post.version) {
            case 1:
              this.names = exports.standardNames.slice();
              break;

            case 2:
              this.names = new Array(post.numberOfGlyphs);

              for (i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] < exports.standardNames.length) {
                  this.names[i] = exports.standardNames[post.glyphNameIndex[i]];
                } else {
                  this.names[i] = post.names[post.glyphNameIndex[i] - exports.standardNames.length];
                }
              }

              break;

            case 2.5:
              this.names = new Array(post.numberOfGlyphs);

              for (i = 0; i < post.numberOfGlyphs; i++) {
                this.names[i] = exports.standardNames[i + post.glyphNameIndex[i]];
              }

              break;

            case 3:
              this.names = [];
              break;
          }
        }

        GlyphNames.prototype.nameToGlyphIndex = function (name) {
          return this.names.indexOf(name);
        };

        GlyphNames.prototype.glyphIndexToName = function (gid) {
          return this.names[gid];
        };

        function addGlyphNames(font) {
          var glyph;
          var glyphIndexMap = font.tables.cmap.glyphIndexMap;
          var charCodes = Object.keys(glyphIndexMap);

          for (var i = 0; i < charCodes.length; i += 1) {
            var c = charCodes[i];
            var glyphIndex = glyphIndexMap[c];
            glyph = font.glyphs.get(glyphIndex);
            glyph.addUnicode(parseInt(c));
          }

          for (i = 0; i < font.glyphs.length; i += 1) {
            glyph = font.glyphs.get(i);

            if (font.cffEncoding) {
              glyph.name = font.cffEncoding.charset[i];
            } else {
              glyph.name = font.glyphNames.glyphIndexToName(i);
            }
          }
        }

        exports.cffStandardStrings = cffStandardStrings;
        exports.cffStandardEncoding = cffStandardEncoding;
        exports.cffExpertEncoding = cffExpertEncoding;
        exports.standardNames = standardNames;
        exports.DefaultEncoding = DefaultEncoding;
        exports.CmapEncoding = CmapEncoding;
        exports.CffEncoding = CffEncoding;
        exports.GlyphNames = GlyphNames;
        exports.addGlyphNames = addGlyphNames;
      }, {}],
      4: [function (require, module, exports) {
        // The Font object
        'use strict';

        var path = require('./path');

        var sfnt = require('./tables/sfnt');

        var encoding = require('./encoding');

        var glyphset = require('./glyphset'); // A Font represents a loaded OpenType font file.
        // It contains a set of glyphs and methods to draw text on a drawing context,
        // or to get a path representing the text.


        function Font(options) {
          options = options || {}; // OS X will complain if the names are empty, so we put a single space everywhere by default.

          this.familyName = options.familyName || ' ';
          this.styleName = options.styleName || ' ';
          this.designer = options.designer || ' ';
          this.designerURL = options.designerURL || ' ';
          this.manufacturer = options.manufacturer || ' ';
          this.manufacturerURL = options.manufacturerURL || ' ';
          this.license = options.license || ' ';
          this.licenseURL = options.licenseURL || ' ';
          this.version = options.version || 'Version 0.1';
          this.description = options.description || ' ';
          this.copyright = options.copyright || ' ';
          this.trademark = options.trademark || ' ';
          this.unitsPerEm = options.unitsPerEm || 1000;
          this.ascender = options.ascender;
          this.descender = options.descender;
          this.supported = true; // Deprecated: parseBuffer will throw an error if font is not supported.

          this.glyphs = new glyphset.GlyphSet(this, options.glyphs || []);
          this.encoding = new encoding.DefaultEncoding(this);
          this.tables = {};
        } // Check if the font has a glyph for the given character.


        Font.prototype.hasChar = function (c) {
          return this.encoding.charToGlyphIndex(c) !== null;
        }; // Convert the given character to a single glyph index.
        // Note that this function assumes that there is a one-to-one mapping between
        // the given character and a glyph; for complex scripts this might not be the case.


        Font.prototype.charToGlyphIndex = function (s) {
          return this.encoding.charToGlyphIndex(s);
        }; // Convert the given character to a single Glyph object.
        // Note that this function assumes that there is a one-to-one mapping between
        // the given character and a glyph; for complex scripts this might not be the case.


        Font.prototype.charToGlyph = function (c) {
          var glyphIndex = this.charToGlyphIndex(c);
          var glyph = this.glyphs.get(glyphIndex);

          if (!glyph) {
            // .notdef
            glyph = this.glyphs.get(0);
          }

          return glyph;
        }; // Convert the given text to a list of Glyph objects.
        // Note that there is no strict one-to-one mapping between characters and
        // glyphs, so the list of returned glyphs can be larger or smaller than the
        // length of the given string.


        Font.prototype.stringToGlyphs = function (s) {
          var glyphs = [];

          for (var i = 0; i < s.length; i += 1) {
            var c = s[i];
            glyphs.push(this.charToGlyph(c));
          }

          return glyphs;
        };

        Font.prototype.nameToGlyphIndex = function (name) {
          return this.glyphNames.nameToGlyphIndex(name);
        };

        Font.prototype.nameToGlyph = function (name) {
          var glyphIndex = this.nametoGlyphIndex(name);
          var glyph = this.glyphs.get(glyphIndex);

          if (!glyph) {
            // .notdef
            glyph = this.glyphs.get(0);
          }

          return glyph;
        };

        Font.prototype.glyphIndexToName = function (gid) {
          if (!this.glyphNames.glyphIndexToName) {
            return '';
          }

          return this.glyphNames.glyphIndexToName(gid);
        }; // Retrieve the value of the kerning pair between the left glyph (or its index)
        // and the right glyph (or its index). If no kerning pair is found, return 0.
        // The kerning value gets added to the advance width when calculating the spacing
        // between glyphs.


        Font.prototype.getKerningValue = function (leftGlyph, rightGlyph) {
          leftGlyph = leftGlyph.index || leftGlyph;
          rightGlyph = rightGlyph.index || rightGlyph;
          var gposKerning = this.getGposKerningValue;
          return gposKerning ? gposKerning(leftGlyph, rightGlyph) : this.kerningPairs[leftGlyph + ',' + rightGlyph] || 0;
        }; // Helper function that invokes the given callback for each glyph in the given text.
        // The callback gets `(glyph, x, y, fontSize, options)`.


        Font.prototype.forEachGlyph = function (text, x, y, fontSize, options, callback) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 72;
          options = options || {};
          var kerning = options.kerning === undefined ? true : options.kerning;
          var fontScale = 1 / this.unitsPerEm * fontSize;
          var glyphs = this.stringToGlyphs(text);

          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs[i];
            callback(glyph, x, y, fontSize, options);

            if (glyph.advanceWidth) {
              x += glyph.advanceWidth * fontScale;
            }

            if (kerning && i < glyphs.length - 1) {
              var kerningValue = this.getKerningValue(glyph, glyphs[i + 1]);
              x += kerningValue * fontScale;
            }
          }
        }; // Create a Path object that represents the given text.
        //
        // text - The text to create.
        // x - Horizontal position of the beginning of the text. (default: 0)
        // y - Vertical position of the *baseline* of the text. (default: 0)
        // fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
        // Options is an optional object that contains:
        // - kerning - Whether to take kerning information into account. (default: true)
        //
        // Returns a Path object.


        Font.prototype.getPath = function (text, x, y, fontSize, options) {
          var fullPath = new path.Path();
          this.forEachGlyph(text, x, y, fontSize, options, function (glyph, gX, gY, gFontSize) {
            var glyphPath = glyph.getPath(gX, gY, gFontSize);
            fullPath.extend(glyphPath);
          });
          return fullPath;
        }; // Draw the text on the given drawing context.
        //
        // ctx - A 2D drawing context, like Canvas.
        // text - The text to create.
        // x - Horizontal position of the beginning of the text. (default: 0)
        // y - Vertical position of the *baseline* of the text. (default: 0)
        // fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
        // Options is an optional object that contains:
        // - kerning - Whether to take kerning information into account. (default: true)


        Font.prototype.draw = function (ctx, text, x, y, fontSize, options) {
          this.getPath(text, x, y, fontSize, options).draw(ctx);
        }; // Draw the points of all glyphs in the text.
        // On-curve points will be drawn in blue, off-curve points will be drawn in red.
        //
        // ctx - A 2D drawing context, like Canvas.
        // text - The text to create.
        // x - Horizontal position of the beginning of the text. (default: 0)
        // y - Vertical position of the *baseline* of the text. (default: 0)
        // fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
        // Options is an optional object that contains:
        // - kerning - Whether to take kerning information into account. (default: true)


        Font.prototype.drawPoints = function (ctx, text, x, y, fontSize, options) {
          this.forEachGlyph(text, x, y, fontSize, options, function (glyph, gX, gY, gFontSize) {
            glyph.drawPoints(ctx, gX, gY, gFontSize);
          });
        }; // Draw lines indicating important font measurements for all glyphs in the text.
        // Black lines indicate the origin of the coordinate system (point 0,0).
        // Blue lines indicate the glyph bounding box.
        // Green line indicates the advance width of the glyph.
        //
        // ctx - A 2D drawing context, like Canvas.
        // text - The text to create.
        // x - Horizontal position of the beginning of the text. (default: 0)
        // y - Vertical position of the *baseline* of the text. (default: 0)
        // fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
        // Options is an optional object that contains:
        // - kerning - Whether to take kerning information into account. (default: true)


        Font.prototype.drawMetrics = function (ctx, text, x, y, fontSize, options) {
          this.forEachGlyph(text, x, y, fontSize, options, function (glyph, gX, gY, gFontSize) {
            glyph.drawMetrics(ctx, gX, gY, gFontSize);
          });
        }; // Validate


        Font.prototype.validate = function () {
          var warnings = [];

          var _this = this;

          function assert(predicate, message) {
            if (!predicate) {
              warnings.push(message);
            }
          }

          function assertStringAttribute(attrName) {
            assert(_this[attrName] && _this[attrName].trim().length > 0, 'No ' + attrName + ' specified.');
          } // Identification information


          assertStringAttribute('familyName');
          assertStringAttribute('weightName');
          assertStringAttribute('manufacturer');
          assertStringAttribute('copyright');
          assertStringAttribute('version'); // Dimension information

          assert(this.unitsPerEm > 0, 'No unitsPerEm specified.');
        }; // Convert the font object to a SFNT data structure.
        // This structure contains all the necessary tables and metadata to create a binary OTF file.


        Font.prototype.toTables = function () {
          return sfnt.fontToTable(this);
        };

        Font.prototype.toBuffer = function () {
          var sfntTable = this.toTables();
          var bytes = sfntTable.encode();
          var buffer = new ArrayBuffer(bytes.length);
          var intArray = new Uint8Array(buffer);

          for (var i = 0; i < bytes.length; i++) {
            intArray[i] = bytes[i];
          }

          return buffer;
        }; // Initiate a download of the OpenType font.


        Font.prototype.download = function () {
          var fileName = this.familyName.replace(/\s/g, '') + '-' + this.styleName + '.otf';
          var buffer = this.toBuffer();
          window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
          window.requestFileSystem(window.TEMPORARY, buffer.byteLength, function (fs) {
            fs.root.getFile(fileName, {
              create: true
            }, function (fileEntry) {
              fileEntry.createWriter(function (writer) {
                var dataView = new DataView(buffer);
                var blob = new Blob([dataView], {
                  type: 'font/opentype'
                });
                writer.write(blob);
                writer.addEventListener('writeend', function () {
                  // Navigating to the file will download it.
                  location.href = fileEntry.toURL();
                }, false);
              });
            });
          }, function (err) {
            throw err;
          });
        };

        exports.Font = Font;
      }, {
        "./encoding": 3,
        "./glyphset": 6,
        "./path": 9,
        "./tables/sfnt": 24
      }],
      5: [function (require, module, exports) {
        // The Glyph object
        'use strict';

        var check = require('./check');

        var draw = require('./draw');

        var path = require('./path');

        function getPathDefinition(glyph, path) {
          var _path = path || {
            commands: []
          };

          return {
            configurable: true,
            get: function () {
              if (typeof _path === 'function') {
                _path = _path();
              }

              return _path;
            },
            set: function (p) {
              _path = p;
            }
          };
        } // A Glyph is an individual mark that often corresponds to a character.
        // Some glyphs, such as ligatures, are a combination of many characters.
        // Glyphs are the basic building blocks of a font.
        //
        // The `Glyph` class contains utility methods for drawing the path and its points.


        function Glyph(options) {
          // By putting all the code on a prototype function (which is only declared once)
          // we reduce the memory requirements for larger fonts by some 2%
          this.bindConstructorValues(options);
        }

        Glyph.prototype.bindConstructorValues = function (options) {
          this.index = options.index || 0; // These three values cannnot be deferred for memory optimization:

          this.name = options.name || null;
          this.unicode = options.unicode || undefined;
          this.unicodes = options.unicodes || options.unicode !== undefined ? [options.unicode] : []; // But by binding these values only when necessary, we reduce can
          // the memory requirements by almost 3% for larger fonts.

          if (options.xMin) {
            this.xMin = options.xMin;
          }

          if (options.yMin) {
            this.yMin = options.yMin;
          }

          if (options.xMax) {
            this.xMax = options.xMax;
          }

          if (options.yMax) {
            this.yMax = options.yMax;
          }

          if (options.advanceWidth) {
            this.advanceWidth = options.advanceWidth;
          } // The path for a glyph is the most memory intensive, and is bound as a value
          // with a getter/setter to ensure we actually do path parsing only once the
          // path is actually needed by anything.


          Object.defineProperty(this, 'path', getPathDefinition(this, options.path));
        };

        Glyph.prototype.addUnicode = function (unicode) {
          if (this.unicodes.length === 0) {
            this.unicode = unicode;
          }

          this.unicodes.push(unicode);
        }; // Convert the glyph to a Path we can draw on a drawing context.
        //
        // x - Horizontal position of the glyph. (default: 0)
        // y - Vertical position of the *baseline* of the glyph. (default: 0)
        // fontSize - Font size, in pixels (default: 72).


        Glyph.prototype.getPath = function (x, y, fontSize) {
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 72;
          var scale = 1 / this.path.unitsPerEm * fontSize;
          var p = new path.Path();
          var commands = this.path.commands;

          for (var i = 0; i < commands.length; i += 1) {
            var cmd = commands[i];

            if (cmd.type === 'M') {
              p.moveTo(x + cmd.x * scale, y + -cmd.y * scale);
            } else if (cmd.type === 'L') {
              p.lineTo(x + cmd.x * scale, y + -cmd.y * scale);
            } else if (cmd.type === 'Q') {
              p.quadraticCurveTo(x + cmd.x1 * scale, y + -cmd.y1 * scale, x + cmd.x * scale, y + -cmd.y * scale);
            } else if (cmd.type === 'C') {
              p.curveTo(x + cmd.x1 * scale, y + -cmd.y1 * scale, x + cmd.x2 * scale, y + -cmd.y2 * scale, x + cmd.x * scale, y + -cmd.y * scale);
            } else if (cmd.type === 'Z') {
              p.closePath();
            }
          }

          return p;
        }; // Split the glyph into contours.
        // This function is here for backwards compatibility, and to
        // provide raw access to the TrueType glyph outlines.


        Glyph.prototype.getContours = function () {
          if (this.points === undefined) {
            return [];
          }

          var contours = [];
          var currentContour = [];

          for (var i = 0; i < this.points.length; i += 1) {
            var pt = this.points[i];
            currentContour.push(pt);

            if (pt.lastPointOfContour) {
              contours.push(currentContour);
              currentContour = [];
            }
          }

          check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
          return contours;
        }; // Calculate the xMin/yMin/xMax/yMax/lsb/rsb for a Glyph.


        Glyph.prototype.getMetrics = function () {
          var commands = this.path.commands;
          var xCoords = [];
          var yCoords = [];

          for (var i = 0; i < commands.length; i += 1) {
            var cmd = commands[i];

            if (cmd.type !== 'Z') {
              xCoords.push(cmd.x);
              yCoords.push(cmd.y);
            }

            if (cmd.type === 'Q' || cmd.type === 'C') {
              xCoords.push(cmd.x1);
              yCoords.push(cmd.y1);
            }

            if (cmd.type === 'C') {
              xCoords.push(cmd.x2);
              yCoords.push(cmd.y2);
            }
          }

          var metrics = {
            xMin: Math.min.apply(null, xCoords),
            yMin: Math.min.apply(null, yCoords),
            xMax: Math.max.apply(null, xCoords),
            yMax: Math.max.apply(null, yCoords),
            leftSideBearing: 0
          };
          metrics.rightSideBearing = this.advanceWidth - metrics.leftSideBearing - (metrics.xMax - metrics.xMin);
          return metrics;
        }; // Draw the glyph on the given context.
        //
        // ctx - The drawing context.
        // x - Horizontal position of the glyph. (default: 0)
        // y - Vertical position of the *baseline* of the glyph. (default: 0)
        // fontSize - Font size, in pixels (default: 72).


        Glyph.prototype.draw = function (ctx, x, y, fontSize) {
          this.getPath(x, y, fontSize).draw(ctx);
        }; // Draw the points of the glyph.
        // On-curve points will be drawn in blue, off-curve points will be drawn in red.
        //
        // ctx - The drawing context.
        // x - Horizontal position of the glyph. (default: 0)
        // y - Vertical position of the *baseline* of the glyph. (default: 0)
        // fontSize - Font size, in pixels (default: 72).


        Glyph.prototype.drawPoints = function (ctx, x, y, fontSize) {
          function drawCircles(l, x, y, scale) {
            var PI_SQ = Math.PI * 2;
            ctx.beginPath();

            for (var j = 0; j < l.length; j += 1) {
              ctx.moveTo(x + l[j].x * scale, y + l[j].y * scale);
              ctx.arc(x + l[j].x * scale, y + l[j].y * scale, 2, 0, PI_SQ, false);
            }

            ctx.closePath();
            ctx.fill();
          }

          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 24;
          var scale = 1 / this.path.unitsPerEm * fontSize;
          var blueCircles = [];
          var redCircles = [];
          var path = this.path;

          for (var i = 0; i < path.commands.length; i += 1) {
            var cmd = path.commands[i];

            if (cmd.x !== undefined) {
              blueCircles.push({
                x: cmd.x,
                y: -cmd.y
              });
            }

            if (cmd.x1 !== undefined) {
              redCircles.push({
                x: cmd.x1,
                y: -cmd.y1
              });
            }

            if (cmd.x2 !== undefined) {
              redCircles.push({
                x: cmd.x2,
                y: -cmd.y2
              });
            }
          }

          ctx.fillStyle = 'blue';
          drawCircles(blueCircles, x, y, scale);
          ctx.fillStyle = 'red';
          drawCircles(redCircles, x, y, scale);
        }; // Draw lines indicating important font measurements.
        // Black lines indicate the origin of the coordinate system (point 0,0).
        // Blue lines indicate the glyph bounding box.
        // Green line indicates the advance width of the glyph.
        //
        // ctx - The drawing context.
        // x - Horizontal position of the glyph. (default: 0)
        // y - Vertical position of the *baseline* of the glyph. (default: 0)
        // fontSize - Font size, in pixels (default: 72).


        Glyph.prototype.drawMetrics = function (ctx, x, y, fontSize) {
          var scale;
          x = x !== undefined ? x : 0;
          y = y !== undefined ? y : 0;
          fontSize = fontSize !== undefined ? fontSize : 24;
          scale = 1 / this.path.unitsPerEm * fontSize;
          ctx.lineWidth = 1; // Draw the origin

          ctx.strokeStyle = 'black';
          draw.line(ctx, x, -10000, x, 10000);
          draw.line(ctx, -10000, y, 10000, y); // This code is here due to memory optimization: by not using
          // defaults in the constructor, we save a notable amount of memory.

          var xMin = this.xMin || 0;
          var yMin = this.yMin || 0;
          var xMax = this.xMax || 0;
          var yMax = this.yMax || 0;
          var advanceWidth = this.advanceWidth || 0; // Draw the glyph box

          ctx.strokeStyle = 'blue';
          draw.line(ctx, x + xMin * scale, -10000, x + xMin * scale, 10000);
          draw.line(ctx, x + xMax * scale, -10000, x + xMax * scale, 10000);
          draw.line(ctx, -10000, y + -yMin * scale, 10000, y + -yMin * scale);
          draw.line(ctx, -10000, y + -yMax * scale, 10000, y + -yMax * scale); // Draw the advance width

          ctx.strokeStyle = 'green';
          draw.line(ctx, x + advanceWidth * scale, -10000, x + advanceWidth * scale, 10000);
        };

        exports.Glyph = Glyph;
      }, {
        "./check": 1,
        "./draw": 2,
        "./path": 9
      }],
      6: [function (require, module, exports) {
        // The GlyphSet object
        'use strict';

        var _glyph = require('./glyph'); // A GlyphSet represents all glyphs available in the font, but modelled using
        // a deferred glyph loader, for retrieving glyphs only once they are absolutely
        // necessary, to keep the memory footprint down.


        function GlyphSet(font, glyphs) {
          this.font = font;
          this.glyphs = {};

          if (Array.isArray(glyphs)) {
            for (var i = 0; i < glyphs.length; i++) {
              this.glyphs[i] = glyphs[i];
            }
          }

          this.length = glyphs && glyphs.length || 0;
        }

        GlyphSet.prototype.get = function (index) {
          if (typeof this.glyphs[index] === 'function') {
            this.glyphs[index] = this.glyphs[index]();
          }

          return this.glyphs[index];
        };

        GlyphSet.prototype.push = function (index, loader) {
          this.glyphs[index] = loader;
          this.length++;
        };

        function glyphLoader(font, index) {
          return new _glyph.Glyph({
            index: index,
            font: font
          });
        }
        /**
         * Generate a stub glyph that can be filled with all metadata *except*
         * the "points" and "path" properties, which must be loaded only once
         * the glyph's path is actually requested for text shaping.
         */


        function ttfGlyphLoader(font, index, parseGlyph, data, position, buildPath) {
          return function () {
            var glyph = new _glyph.Glyph({
              index: index,
              font: font
            });

            glyph.path = function () {
              parseGlyph(glyph, data, position);
              var path = buildPath(font.glyphs, glyph);
              path.unitsPerEm = font.unitsPerEm;
              return path;
            };

            return glyph;
          };
        }

        function cffGlyphLoader(font, index, parseCFFCharstring, charstring) {
          return function () {
            var glyph = new _glyph.Glyph({
              index: index,
              font: font
            });

            glyph.path = function () {
              var path = parseCFFCharstring(font, glyph, charstring);
              path.unitsPerEm = font.unitsPerEm;
              return path;
            };

            return glyph;
          };
        }

        exports.GlyphSet = GlyphSet;
        exports.glyphLoader = glyphLoader;
        exports.ttfGlyphLoader = ttfGlyphLoader;
        exports.cffGlyphLoader = cffGlyphLoader;
      }, {
        "./glyph": 5
      }],
      7: [function (require, module, exports) {
        // opentype.js
        // https://github.com/nodebox/opentype.js
        // (c) 2015 Frederik De Bleser
        // opentype.js may be freely distributed under the MIT license.

        /* global ArrayBuffer, DataView, Uint8Array, XMLHttpRequest  */
        'use strict';

        var encoding = require('./encoding');

        var _font = require('./font');

        var glyph = require('./glyph');

        var parse = require('./parse');

        var path = require('./path');

        var cmap = require('./tables/cmap');

        var cff = require('./tables/cff');

        var glyf = require('./tables/glyf');

        var gpos = require('./tables/gpos');

        var head = require('./tables/head');

        var hhea = require('./tables/hhea');

        var hmtx = require('./tables/hmtx');

        var kern = require('./tables/kern');

        var loca = require('./tables/loca');

        var maxp = require('./tables/maxp');

        var _name = require('./tables/name');

        var os2 = require('./tables/os2');

        var post = require('./tables/post'); // File loaders /////////////////////////////////////////////////////////
        // Convert a Node.js Buffer to an ArrayBuffer


        function toArrayBuffer(buffer) {
          var arrayBuffer = new ArrayBuffer(buffer.length);
          var data = new Uint8Array(arrayBuffer);

          for (var i = 0; i < buffer.length; i += 1) {
            data[i] = buffer[i];
          }

          return arrayBuffer;
        }

        function loadFromFile(path, callback) {
          var fs = require('fs');

          fs.readFile(path, function (err, buffer) {
            if (err) {
              return callback(err.message);
            }

            callback(null, toArrayBuffer(buffer));
          });
        }

        function loadFromUrl(url, callback) {
          var request = new XMLHttpRequest();
          request.open('get', url, true);
          request.responseType = 'arraybuffer';

          request.onload = function () {
            if (request.status !== 200) {
              return callback('Font could not be loaded: ' + request.statusText);
            }

            return callback(null, request.response);
          };

          request.send();
        } // Public API ///////////////////////////////////////////////////////////
        // Parse the OpenType file data (as an ArrayBuffer) and return a Font object.
        // Throws an error if the font could not be parsed.


        function parseBuffer(buffer) {
          var indexToLocFormat;
          var hmtxOffset;
          var glyfOffset;
          var locaOffset;
          var cffOffset;
          var kernOffset;
          var gposOffset; // OpenType fonts use big endian byte ordering.
          // We can't rely on typed array view types, because they operate with the endianness of the host computer.
          // Instead we use DataViews where we can specify endianness.

          var font = new _font.Font();
          var data = new DataView(buffer, 0);
          var version = parse.getFixed(data, 0);

          if (version === 1.0) {
            font.outlinesFormat = 'truetype';
          } else {
            version = parse.getTag(data, 0);

            if (version === 'OTTO') {
              font.outlinesFormat = 'cff';
            } else {
              throw new Error('Unsupported OpenType version ' + version);
            }
          }

          var numTables = parse.getUShort(data, 4); // Offset into the table records.

          var p = 12;

          for (var i = 0; i < numTables; i += 1) {
            var tag = parse.getTag(data, p);
            var offset = parse.getULong(data, p + 8);

            switch (tag) {
              case 'cmap':
                font.tables.cmap = cmap.parse(data, offset);
                font.encoding = new encoding.CmapEncoding(font.tables.cmap);
                break;

              case 'head':
                font.tables.head = head.parse(data, offset);
                font.unitsPerEm = font.tables.head.unitsPerEm;
                indexToLocFormat = font.tables.head.indexToLocFormat;
                break;

              case 'hhea':
                font.tables.hhea = hhea.parse(data, offset);
                font.ascender = font.tables.hhea.ascender;
                font.descender = font.tables.hhea.descender;
                font.numberOfHMetrics = font.tables.hhea.numberOfHMetrics;
                break;

              case 'hmtx':
                hmtxOffset = offset;
                break;

              case 'maxp':
                font.tables.maxp = maxp.parse(data, offset);
                font.numGlyphs = font.tables.maxp.numGlyphs;
                break;

              case 'name':
                font.tables.name = _name.parse(data, offset);
                font.familyName = font.tables.name.fontFamily;
                font.styleName = font.tables.name.fontSubfamily;
                break;

              case 'OS/2':
                font.tables.os2 = os2.parse(data, offset);
                break;

              case 'post':
                font.tables.post = post.parse(data, offset);
                font.glyphNames = new encoding.GlyphNames(font.tables.post);
                break;

              case 'glyf':
                glyfOffset = offset;
                break;

              case 'loca':
                locaOffset = offset;
                break;

              case 'CFF ':
                cffOffset = offset;
                break;

              case 'kern':
                kernOffset = offset;
                break;

              case 'GPOS':
                gposOffset = offset;
                break;
            }

            p += 16;
          }

          if (glyfOffset && locaOffset) {
            var shortVersion = indexToLocFormat === 0;
            var locaTable = loca.parse(data, locaOffset, font.numGlyphs, shortVersion);
            font.glyphs = glyf.parse(data, glyfOffset, locaTable, font);
            hmtx.parse(data, hmtxOffset, font.numberOfHMetrics, font.numGlyphs, font.glyphs);
            encoding.addGlyphNames(font);
          } else if (cffOffset) {
            cff.parse(data, cffOffset, font);
            encoding.addGlyphNames(font);
          } else {
            throw new Error('Font doesn\'t contain TrueType or CFF outlines.');
          }

          if (kernOffset) {
            font.kerningPairs = kern.parse(data, kernOffset);
          } else {
            font.kerningPairs = {};
          }

          if (gposOffset) {
            gpos.parse(data, gposOffset, font);
          }

          return font;
        } // Asynchronously load the font from a URL or a filesystem. When done, call the callback
        // with two arguments `(err, font)`. The `err` will be null on success,
        // the `font` is a Font object.
        //
        // We use the node.js callback convention so that
        // opentype.js can integrate with frameworks like async.js.


        function load(url, callback) {
          var isNode = typeof window === 'undefined';
          var loadFn = isNode ? loadFromFile : loadFromUrl;
          loadFn(url, function (err, arrayBuffer) {
            if (err) {
              return callback(err);
            }

            var font = parseBuffer(arrayBuffer);
            return callback(null, font);
          });
        } // Syncronously load the font from a URL or file.
        // When done, return the font object or throw an error.


        function loadSync(url) {
          var fs = require('fs');

          var buffer = fs.readFileSync(url);
          return parseBuffer(toArrayBuffer(buffer));
        }

        exports._parse = parse;
        exports.Font = _font.Font;
        exports.Glyph = glyph.Glyph;
        exports.Path = path.Path;
        exports.parse = parseBuffer;
        exports.load = load;
        exports.loadSync = loadSync;
      }, {
        "./encoding": 3,
        "./font": 4,
        "./glyph": 5,
        "./parse": 8,
        "./path": 9,
        "./tables/cff": 11,
        "./tables/cmap": 12,
        "./tables/glyf": 13,
        "./tables/gpos": 14,
        "./tables/head": 15,
        "./tables/hhea": 16,
        "./tables/hmtx": 17,
        "./tables/kern": 18,
        "./tables/loca": 19,
        "./tables/maxp": 20,
        "./tables/name": 21,
        "./tables/os2": 22,
        "./tables/post": 23,
        "fs": undefined
      }],
      8: [function (require, module, exports) {
        // Parsing utility functions
        'use strict'; // Retrieve an unsigned byte from the DataView.

        exports.getByte = function getByte(dataView, offset) {
          return dataView.getUint8(offset);
        };

        exports.getCard8 = exports.getByte; // Retrieve an unsigned 16-bit short from the DataView.
        // The value is stored in big endian.

        exports.getUShort = function (dataView, offset) {
          return dataView.getUint16(offset, false);
        };

        exports.getCard16 = exports.getUShort; // Retrieve a signed 16-bit short from the DataView.
        // The value is stored in big endian.

        exports.getShort = function (dataView, offset) {
          return dataView.getInt16(offset, false);
        }; // Retrieve an unsigned 32-bit long from the DataView.
        // The value is stored in big endian.


        exports.getULong = function (dataView, offset) {
          return dataView.getUint32(offset, false);
        }; // Retrieve a 32-bit signed fixed-point number (16.16) from the DataView.
        // The value is stored in big endian.


        exports.getFixed = function (dataView, offset) {
          var decimal = dataView.getInt16(offset, false);
          var fraction = dataView.getUint16(offset + 2, false);
          return decimal + fraction / 65535;
        }; // Retrieve a 4-character tag from the DataView.
        // Tags are used to identify tables.


        exports.getTag = function (dataView, offset) {
          var tag = '';

          for (var i = offset; i < offset + 4; i += 1) {
            tag += String.fromCharCode(dataView.getInt8(i));
          }

          return tag;
        }; // Retrieve an offset from the DataView.
        // Offsets are 1 to 4 bytes in length, depending on the offSize argument.


        exports.getOffset = function (dataView, offset, offSize) {
          var v = 0;

          for (var i = 0; i < offSize; i += 1) {
            v <<= 8;
            v += dataView.getUint8(offset + i);
          }

          return v;
        }; // Retrieve a number of bytes from start offset to the end offset from the DataView.


        exports.getBytes = function (dataView, startOffset, endOffset) {
          var bytes = [];

          for (var i = startOffset; i < endOffset; i += 1) {
            bytes.push(dataView.getUint8(i));
          }

          return bytes;
        }; // Convert the list of bytes to a string.


        exports.bytesToString = function (bytes) {
          var s = '';

          for (var i = 0; i < bytes.length; i += 1) {
            s += String.fromCharCode(bytes[i]);
          }

          return s;
        };

        var typeOffsets = {
          byte: 1,
          uShort: 2,
          short: 2,
          uLong: 4,
          fixed: 4,
          longDateTime: 8,
          tag: 4
        }; // A stateful parser that changes the offset whenever a value is retrieved.
        // The data is a DataView.

        function Parser(data, offset) {
          this.data = data;
          this.offset = offset;
          this.relativeOffset = 0;
        }

        Parser.prototype.parseByte = function () {
          var v = this.data.getUint8(this.offset + this.relativeOffset);
          this.relativeOffset += 1;
          return v;
        };

        Parser.prototype.parseChar = function () {
          var v = this.data.getInt8(this.offset + this.relativeOffset);
          this.relativeOffset += 1;
          return v;
        };

        Parser.prototype.parseCard8 = Parser.prototype.parseByte;

        Parser.prototype.parseUShort = function () {
          var v = this.data.getUint16(this.offset + this.relativeOffset);
          this.relativeOffset += 2;
          return v;
        };

        Parser.prototype.parseCard16 = Parser.prototype.parseUShort;
        Parser.prototype.parseSID = Parser.prototype.parseUShort;
        Parser.prototype.parseOffset16 = Parser.prototype.parseUShort;

        Parser.prototype.parseShort = function () {
          var v = this.data.getInt16(this.offset + this.relativeOffset);
          this.relativeOffset += 2;
          return v;
        };

        Parser.prototype.parseF2Dot14 = function () {
          var v = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
          this.relativeOffset += 2;
          return v;
        };

        Parser.prototype.parseULong = function () {
          var v = exports.getULong(this.data, this.offset + this.relativeOffset);
          this.relativeOffset += 4;
          return v;
        };

        Parser.prototype.parseFixed = function () {
          var v = exports.getFixed(this.data, this.offset + this.relativeOffset);
          this.relativeOffset += 4;
          return v;
        };

        Parser.prototype.parseOffset16List = Parser.prototype.parseUShortList = function (count) {
          var offsets = new Array(count);
          var dataView = this.data;
          var offset = this.offset + this.relativeOffset;

          for (var i = 0; i < count; i++) {
            offsets[i] = exports.getUShort(dataView, offset);
            offset += 2;
          }

          this.relativeOffset += count * 2;
          return offsets;
        };

        Parser.prototype.parseString = function (length) {
          var dataView = this.data;
          var offset = this.offset + this.relativeOffset;
          var string = '';
          this.relativeOffset += length;

          for (var i = 0; i < length; i++) {
            string += String.fromCharCode(dataView.getUint8(offset + i));
          }

          return string;
        };

        Parser.prototype.parseTag = function () {
          return this.parseString(4);
        }; // LONGDATETIME is a 64-bit integer.
        // JavaScript and unix timestamps traditionally use 32 bits, so we
        // only take the last 32 bits.


        Parser.prototype.parseLongDateTime = function () {
          var v = exports.getULong(this.data, this.offset + this.relativeOffset + 4);
          this.relativeOffset += 8;
          return v;
        };

        Parser.prototype.parseFixed = function () {
          var v = exports.getULong(this.data, this.offset + this.relativeOffset);
          this.relativeOffset += 4;
          return v / 65536;
        };

        Parser.prototype.parseVersion = function () {
          var major = exports.getUShort(this.data, this.offset + this.relativeOffset); // How to interpret the minor version is very vague in the spec. 0x5000 is 5, 0x1000 is 1
          // This returns the correct number if minor = 0xN000 where N is 0-9

          var minor = exports.getUShort(this.data, this.offset + this.relativeOffset + 2);
          this.relativeOffset += 4;
          return major + minor / 0x1000 / 10;
        };

        Parser.prototype.skip = function (type, amount) {
          if (amount === undefined) {
            amount = 1;
          }

          this.relativeOffset += typeOffsets[type] * amount;
        };

        exports.Parser = Parser;
      }, {}],
      9: [function (require, module, exports) {
        // Geometric objects
        'use strict'; // A bézier path containing a set of path commands similar to a SVG path.
        // Paths can be drawn on a context using `draw`.

        function Path() {
          this.commands = [];
          this.fill = 'black';
          this.stroke = null;
          this.strokeWidth = 1;
        }

        Path.prototype.moveTo = function (x, y) {
          this.commands.push({
            type: 'M',
            x: x,
            y: y
          });
        };

        Path.prototype.lineTo = function (x, y) {
          this.commands.push({
            type: 'L',
            x: x,
            y: y
          });
        };

        Path.prototype.curveTo = Path.prototype.bezierCurveTo = function (x1, y1, x2, y2, x, y) {
          this.commands.push({
            type: 'C',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            x: x,
            y: y
          });
        };

        Path.prototype.quadTo = Path.prototype.quadraticCurveTo = function (x1, y1, x, y) {
          this.commands.push({
            type: 'Q',
            x1: x1,
            y1: y1,
            x: x,
            y: y
          });
        };

        Path.prototype.close = Path.prototype.closePath = function () {
          this.commands.push({
            type: 'Z'
          });
        }; // Add the given path or list of commands to the commands of this path.


        Path.prototype.extend = function (pathOrCommands) {
          if (pathOrCommands.commands) {
            pathOrCommands = pathOrCommands.commands;
          }

          Array.prototype.push.apply(this.commands, pathOrCommands);
        }; // Draw the path to a 2D context.


        Path.prototype.draw = function (ctx) {
          ctx.beginPath();

          for (var i = 0; i < this.commands.length; i += 1) {
            var cmd = this.commands[i];

            if (cmd.type === 'M') {
              ctx.moveTo(cmd.x, cmd.y);
            } else if (cmd.type === 'L') {
              ctx.lineTo(cmd.x, cmd.y);
            } else if (cmd.type === 'C') {
              ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            } else if (cmd.type === 'Q') {
              ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
            } else if (cmd.type === 'Z') {
              ctx.closePath();
            }
          }

          if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill();
          }

          if (this.stroke) {
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = this.strokeWidth;
            ctx.stroke();
          }
        }; // Convert the Path to a string of path data instructions
        // See http://www.w3.org/TR/SVG/paths.html#PathData
        // Parameters:
        // - decimalPlaces: The amount of decimal places for floating-point values (default: 2)


        Path.prototype.toPathData = function (decimalPlaces) {
          decimalPlaces = decimalPlaces !== undefined ? decimalPlaces : 2;

          function floatToString(v) {
            if (Math.round(v) === v) {
              return '' + Math.round(v);
            } else {
              return v.toFixed(decimalPlaces);
            }
          }

          function packValues() {
            var s = '';

            for (var i = 0; i < arguments.length; i += 1) {
              var v = arguments[i];

              if (v >= 0 && i > 0) {
                s += ' ';
              }

              s += floatToString(v);
            }

            return s;
          }

          var d = '';

          for (var i = 0; i < this.commands.length; i += 1) {
            var cmd = this.commands[i];

            if (cmd.type === 'M') {
              d += 'M' + packValues(cmd.x, cmd.y);
            } else if (cmd.type === 'L') {
              d += 'L' + packValues(cmd.x, cmd.y);
            } else if (cmd.type === 'C') {
              d += 'C' + packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            } else if (cmd.type === 'Q') {
              d += 'Q' + packValues(cmd.x1, cmd.y1, cmd.x, cmd.y);
            } else if (cmd.type === 'Z') {
              d += 'Z';
            }
          }

          return d;
        }; // Convert the path to a SVG <path> element, as a string.
        // Parameters:
        // - decimalPlaces: The amount of decimal places for floating-point values (default: 2)


        Path.prototype.toSVG = function (decimalPlaces) {
          var svg = '<path d="';
          svg += this.toPathData(decimalPlaces);
          svg += '"';

          if (this.fill & this.fill !== 'black') {
            if (this.fill === null) {
              svg += ' fill="none"';
            } else {
              svg += ' fill="' + this.fill + '"';
            }
          }

          if (this.stroke) {
            svg += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"';
          }

          svg += '/>';
          return svg;
        };

        exports.Path = Path;
      }, {}],
      10: [function (require, module, exports) {
        // Table metadata
        'use strict';

        var check = require('./check');

        var encode = require('./types').encode;

        var sizeOf = require('./types').sizeOf;

        function Table(tableName, fields, options) {
          var i;

          for (i = 0; i < fields.length; i += 1) {
            var field = fields[i];
            this[field.name] = field.value;
          }

          this.tableName = tableName;
          this.fields = fields;

          if (options) {
            var optionKeys = Object.keys(options);

            for (i = 0; i < optionKeys.length; i += 1) {
              var k = optionKeys[i];
              var v = options[k];

              if (this[k] !== undefined) {
                this[k] = v;
              }
            }
          }
        }

        Table.prototype.sizeOf = function () {
          var v = 0;

          for (var i = 0; i < this.fields.length; i += 1) {
            var field = this.fields[i];
            var value = this[field.name];

            if (value === undefined) {
              value = field.value;
            }

            if (typeof value.sizeOf === 'function') {
              v += value.sizeOf();
            } else {
              var sizeOfFunction = sizeOf[field.type];
              check.assert(typeof sizeOfFunction === 'function', 'Could not find sizeOf function for field' + field.name);
              v += sizeOfFunction(value);
            }
          }

          return v;
        };

        Table.prototype.encode = function () {
          return encode.TABLE(this);
        };

        exports.Table = Table;
      }, {
        "./check": 1,
        "./types": 25
      }],
      11: [function (require, module, exports) {
        // The `CFF` table contains the glyph outlines in PostScript format.
        // https://www.microsoft.com/typography/OTSPEC/cff.htm
        // http://download.microsoft.com/download/8/0/1/801a191c-029d-4af3-9642-555f6fe514ee/cff.pdf
        // http://download.microsoft.com/download/8/0/1/801a191c-029d-4af3-9642-555f6fe514ee/type2.pdf
        'use strict';

        var encoding = require('../encoding');

        var glyphset = require('../glyphset');

        var parse = require('../parse');

        var path = require('../path');

        var table = require('../table'); // Custom equals function that can also check lists.


        function equals(a, b) {
          if (a === b) {
            return true;
          } else if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
              return false;
            }

            for (var i = 0; i < a.length; i += 1) {
              if (!equals(a[i], b[i])) {
                return false;
              }
            }

            return true;
          } else {
            return false;
          }
        } // Parse a `CFF` INDEX array.
        // An index array consists of a list of offsets, then a list of objects at those offsets.


        function parseCFFIndex(data, start, conversionFn) {
          //var i, objectOffset, endOffset;
          var offsets = [];
          var objects = [];
          var count = parse.getCard16(data, start);
          var i;
          var objectOffset;
          var endOffset;

          if (count !== 0) {
            var offsetSize = parse.getByte(data, start + 2);
            objectOffset = start + (count + 1) * offsetSize + 2;
            var pos = start + 3;

            for (i = 0; i < count + 1; i += 1) {
              offsets.push(parse.getOffset(data, pos, offsetSize));
              pos += offsetSize;
            } // The total size of the index array is 4 header bytes + the value of the last offset.


            endOffset = objectOffset + offsets[count];
          } else {
            endOffset = start + 2;
          }

          for (i = 0; i < offsets.length - 1; i += 1) {
            var value = parse.getBytes(data, objectOffset + offsets[i], objectOffset + offsets[i + 1]);

            if (conversionFn) {
              value = conversionFn(value);
            }

            objects.push(value);
          }

          return {
            objects: objects,
            startOffset: start,
            endOffset: endOffset
          };
        } // Parse a `CFF` DICT real value.


        function parseFloatOperand(parser) {
          var s = '';
          var eof = 15;
          var lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'E', 'E-', null, '-'];

          while (true) {
            var b = parser.parseByte();
            var n1 = b >> 4;
            var n2 = b & 15;

            if (n1 === eof) {
              break;
            }

            s += lookup[n1];

            if (n2 === eof) {
              break;
            }

            s += lookup[n2];
          }

          return parseFloat(s);
        } // Parse a `CFF` DICT operand.


        function parseOperand(parser, b0) {
          var b1;
          var b2;
          var b3;
          var b4;

          if (b0 === 28) {
            b1 = parser.parseByte();
            b2 = parser.parseByte();
            return b1 << 8 | b2;
          }

          if (b0 === 29) {
            b1 = parser.parseByte();
            b2 = parser.parseByte();
            b3 = parser.parseByte();
            b4 = parser.parseByte();
            return b1 << 24 | b2 << 16 | b3 << 8 | b4;
          }

          if (b0 === 30) {
            return parseFloatOperand(parser);
          }

          if (b0 >= 32 && b0 <= 246) {
            return b0 - 139;
          }

          if (b0 >= 247 && b0 <= 250) {
            b1 = parser.parseByte();
            return (b0 - 247) * 256 + b1 + 108;
          }

          if (b0 >= 251 && b0 <= 254) {
            b1 = parser.parseByte();
            return -(b0 - 251) * 256 - b1 - 108;
          }

          throw new Error('Invalid b0 ' + b0);
        } // Convert the entries returned by `parseDict` to a proper dictionary.
        // If a value is a list of one, it is unpacked.


        function entriesToObject(entries) {
          var o = {};

          for (var i = 0; i < entries.length; i += 1) {
            var key = entries[i][0];
            var values = entries[i][1];
            var value;

            if (values.length === 1) {
              value = values[0];
            } else {
              value = values;
            }

            if (o.hasOwnProperty(key)) {
              throw new Error('Object ' + o + ' already has key ' + key);
            }

            o[key] = value;
          }

          return o;
        } // Parse a `CFF` DICT object.
        // A dictionary contains key-value pairs in a compact tokenized format.


        function parseCFFDict(data, start, size) {
          start = start !== undefined ? start : 0;
          var parser = new parse.Parser(data, start);
          var entries = [];
          var operands = [];
          size = size !== undefined ? size : data.length;

          while (parser.relativeOffset < size) {
            var op = parser.parseByte(); // The first byte for each dict item distinguishes between operator (key) and operand (value).
            // Values <= 21 are operators.

            if (op <= 21) {
              // Two-byte operators have an initial escape byte of 12.
              if (op === 12) {
                op = 1200 + parser.parseByte();
              }

              entries.push([op, operands]);
              operands = [];
            } else {
              // Since the operands (values) come before the operators (keys), we store all operands in a list
              // until we encounter an operator.
              operands.push(parseOperand(parser, op));
            }
          }

          return entriesToObject(entries);
        } // Given a String Index (SID), return the value of the string.
        // Strings below index 392 are standard CFF strings and are not encoded in the font.


        function getCFFString(strings, index) {
          if (index <= 390) {
            index = encoding.cffStandardStrings[index];
          } else {
            index = strings[index - 391];
          }

          return index;
        } // Interpret a dictionary and return a new dictionary with readable keys and values for missing entries.
        // This function takes `meta` which is a list of objects containing `operand`, `name` and `default`.


        function interpretDict(dict, meta, strings) {
          var newDict = {}; // Because we also want to include missing values, we start out from the meta list
          // and lookup values in the dict.

          for (var i = 0; i < meta.length; i += 1) {
            var m = meta[i];
            var value = dict[m.op];

            if (value === undefined) {
              value = m.value !== undefined ? m.value : null;
            }

            if (m.type === 'SID') {
              value = getCFFString(strings, value);
            }

            newDict[m.name] = value;
          }

          return newDict;
        } // Parse the CFF header.


        function parseCFFHeader(data, start) {
          var header = {};
          header.formatMajor = parse.getCard8(data, start);
          header.formatMinor = parse.getCard8(data, start + 1);
          header.size = parse.getCard8(data, start + 2);
          header.offsetSize = parse.getCard8(data, start + 3);
          header.startOffset = start;
          header.endOffset = start + 4;
          return header;
        }

        var TOP_DICT_META = [{
          name: 'version',
          op: 0,
          type: 'SID'
        }, {
          name: 'notice',
          op: 1,
          type: 'SID'
        }, {
          name: 'copyright',
          op: 1200,
          type: 'SID'
        }, {
          name: 'fullName',
          op: 2,
          type: 'SID'
        }, {
          name: 'familyName',
          op: 3,
          type: 'SID'
        }, {
          name: 'weight',
          op: 4,
          type: 'SID'
        }, {
          name: 'isFixedPitch',
          op: 1201,
          type: 'number',
          value: 0
        }, {
          name: 'italicAngle',
          op: 1202,
          type: 'number',
          value: 0
        }, {
          name: 'underlinePosition',
          op: 1203,
          type: 'number',
          value: -100
        }, {
          name: 'underlineThickness',
          op: 1204,
          type: 'number',
          value: 50
        }, {
          name: 'paintType',
          op: 1205,
          type: 'number',
          value: 0
        }, {
          name: 'charstringType',
          op: 1206,
          type: 'number',
          value: 2
        }, {
          name: 'fontMatrix',
          op: 1207,
          type: ['real', 'real', 'real', 'real', 'real', 'real'],
          value: [0.001, 0, 0, 0.001, 0, 0]
        }, {
          name: 'uniqueId',
          op: 13,
          type: 'number'
        }, {
          name: 'fontBBox',
          op: 5,
          type: ['number', 'number', 'number', 'number'],
          value: [0, 0, 0, 0]
        }, {
          name: 'strokeWidth',
          op: 1208,
          type: 'number',
          value: 0
        }, {
          name: 'xuid',
          op: 14,
          type: [],
          value: null
        }, {
          name: 'charset',
          op: 15,
          type: 'offset',
          value: 0
        }, {
          name: 'encoding',
          op: 16,
          type: 'offset',
          value: 0
        }, {
          name: 'charStrings',
          op: 17,
          type: 'offset',
          value: 0
        }, {
          name: 'private',
          op: 18,
          type: ['number', 'offset'],
          value: [0, 0]
        }];
        var PRIVATE_DICT_META = [{
          name: 'subrs',
          op: 19,
          type: 'offset',
          value: 0
        }, {
          name: 'defaultWidthX',
          op: 20,
          type: 'number',
          value: 0
        }, {
          name: 'nominalWidthX',
          op: 21,
          type: 'number',
          value: 0
        }]; // Parse the CFF top dictionary. A CFF table can contain multiple fonts, each with their own top dictionary.
        // The top dictionary contains the essential metadata for the font, together with the private dictionary.

        function parseCFFTopDict(data, strings) {
          var dict = parseCFFDict(data, 0, data.byteLength);
          return interpretDict(dict, TOP_DICT_META, strings);
        } // Parse the CFF private dictionary. We don't fully parse out all the values, only the ones we need.


        function parseCFFPrivateDict(data, start, size, strings) {
          var dict = parseCFFDict(data, start, size);
          return interpretDict(dict, PRIVATE_DICT_META, strings);
        } // Parse the CFF charset table, which contains internal names for all the glyphs.
        // This function will return a list of glyph names.
        // See Adobe TN #5176 chapter 13, "Charsets".


        function parseCFFCharset(data, start, nGlyphs, strings) {
          var i;
          var sid;
          var count;
          var parser = new parse.Parser(data, start); // The .notdef glyph is not included, so subtract 1.

          nGlyphs -= 1;
          var charset = ['.notdef'];
          var format = parser.parseCard8();

          if (format === 0) {
            for (i = 0; i < nGlyphs; i += 1) {
              sid = parser.parseSID();
              charset.push(getCFFString(strings, sid));
            }
          } else if (format === 1) {
            while (charset.length <= nGlyphs) {
              sid = parser.parseSID();
              count = parser.parseCard8();

              for (i = 0; i <= count; i += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
              }
            }
          } else if (format === 2) {
            while (charset.length <= nGlyphs) {
              sid = parser.parseSID();
              count = parser.parseCard16();

              for (i = 0; i <= count; i += 1) {
                charset.push(getCFFString(strings, sid));
                sid += 1;
              }
            }
          } else {
            throw new Error('Unknown charset format ' + format);
          }

          return charset;
        } // Parse the CFF encoding data. Only one encoding can be specified per font.
        // See Adobe TN #5176 chapter 12, "Encodings".


        function parseCFFEncoding(data, start, charset) {
          var i;
          var code;
          var enc = {};
          var parser = new parse.Parser(data, start);
          var format = parser.parseCard8();

          if (format === 0) {
            var nCodes = parser.parseCard8();

            for (i = 0; i < nCodes; i += 1) {
              code = parser.parseCard8();
              enc[code] = i;
            }
          } else if (format === 1) {
            var nRanges = parser.parseCard8();
            code = 1;

            for (i = 0; i < nRanges; i += 1) {
              var first = parser.parseCard8();
              var nLeft = parser.parseCard8();

              for (var j = first; j <= first + nLeft; j += 1) {
                enc[j] = code;
                code += 1;
              }
            }
          } else {
            throw new Error('Unknown encoding format ' + format);
          }

          return new encoding.CffEncoding(enc, charset);
        } // Take in charstring code and return a Glyph object.
        // The encoding is described in the Type 2 Charstring Format
        // https://www.microsoft.com/typography/OTSPEC/charstr2.htm


        function parseCFFCharstring(font, glyph, code) {
          var c1x;
          var c1y;
          var c2x;
          var c2y;
          var p = new path.Path();
          var stack = [];
          var nStems = 0;
          var haveWidth = false;
          var width = font.defaultWidthX;
          var open = false;
          var x = 0;
          var y = 0;

          function newContour(x, y) {
            if (open) {
              p.closePath();
            }

            p.moveTo(x, y);
            open = true;
          }

          function parseStems() {
            var hasWidthArg; // The number of stem operators on the stack is always even.
            // If the value is uneven, that means a width is specified.

            hasWidthArg = stack.length % 2 !== 0;

            if (hasWidthArg && !haveWidth) {
              width = stack.shift() + font.nominalWidthX;
            }

            nStems += stack.length >> 1;
            stack.length = 0;
            haveWidth = true;
          }

          function parse(code) {
            var b1;
            var b2;
            var b3;
            var b4;
            var codeIndex;
            var subrCode;
            var jpx;
            var jpy;
            var c3x;
            var c3y;
            var c4x;
            var c4y;
            var i = 0;

            while (i < code.length) {
              var v = code[i];
              i += 1;

              switch (v) {
                case 1:
                  // hstem
                  parseStems();
                  break;

                case 3:
                  // vstem
                  parseStems();
                  break;

                case 4:
                  // vmoveto
                  if (stack.length > 1 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }

                  y += stack.pop();
                  newContour(x, y);
                  break;

                case 5:
                  // rlineto
                  while (stack.length > 0) {
                    x += stack.shift();
                    y += stack.shift();
                    p.lineTo(x, y);
                  }

                  break;

                case 6:
                  // hlineto
                  while (stack.length > 0) {
                    x += stack.shift();
                    p.lineTo(x, y);

                    if (stack.length === 0) {
                      break;
                    }

                    y += stack.shift();
                    p.lineTo(x, y);
                  }

                  break;

                case 7:
                  // vlineto
                  while (stack.length > 0) {
                    y += stack.shift();
                    p.lineTo(x, y);

                    if (stack.length === 0) {
                      break;
                    }

                    x += stack.shift();
                    p.lineTo(x, y);
                  }

                  break;

                case 8:
                  // rrcurveto
                  while (stack.length > 0) {
                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }

                  break;

                case 10:
                  // callsubr
                  codeIndex = stack.pop() + font.subrsBias;
                  subrCode = font.subrs[codeIndex];

                  if (subrCode) {
                    parse(subrCode);
                  }

                  break;

                case 11:
                  // return
                  return;

                case 12:
                  // flex operators
                  v = code[i];
                  i += 1;

                  switch (v) {
                    case 35:
                      // flex
                      // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35) |-
                      c1x = x + stack.shift(); // dx1

                      c1y = y + stack.shift(); // dy1

                      c2x = c1x + stack.shift(); // dx2

                      c2y = c1y + stack.shift(); // dy2

                      jpx = c2x + stack.shift(); // dx3

                      jpy = c2y + stack.shift(); // dy3

                      c3x = jpx + stack.shift(); // dx4

                      c3y = jpy + stack.shift(); // dy4

                      c4x = c3x + stack.shift(); // dx5

                      c4y = c3y + stack.shift(); // dy5

                      x = c4x + stack.shift(); // dx6

                      y = c4y + stack.shift(); // dy6

                      stack.shift(); // flex depth

                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;

                    case 34:
                      // hflex
                      // |- dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34) |-
                      c1x = x + stack.shift(); // dx1

                      c1y = y; // dy1

                      c2x = c1x + stack.shift(); // dx2

                      c2y = c1y + stack.shift(); // dy2

                      jpx = c2x + stack.shift(); // dx3

                      jpy = c2y; // dy3

                      c3x = jpx + stack.shift(); // dx4

                      c3y = c2y; // dy4

                      c4x = c3x + stack.shift(); // dx5

                      c4y = y; // dy5

                      x = c4x + stack.shift(); // dx6

                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;

                    case 36:
                      // hflex1
                      // |- dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36) |-
                      c1x = x + stack.shift(); // dx1

                      c1y = y + stack.shift(); // dy1

                      c2x = c1x + stack.shift(); // dx2

                      c2y = c1y + stack.shift(); // dy2

                      jpx = c2x + stack.shift(); // dx3

                      jpy = c2y; // dy3

                      c3x = jpx + stack.shift(); // dx4

                      c3y = c2y; // dy4

                      c4x = c3x + stack.shift(); // dx5

                      c4y = c3y + stack.shift(); // dy5

                      x = c4x + stack.shift(); // dx6

                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;

                    case 37:
                      // flex1
                      // |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37) |-
                      c1x = x + stack.shift(); // dx1

                      c1y = y + stack.shift(); // dy1

                      c2x = c1x + stack.shift(); // dx2

                      c2y = c1y + stack.shift(); // dy2

                      jpx = c2x + stack.shift(); // dx3

                      jpy = c2y + stack.shift(); // dy3

                      c3x = jpx + stack.shift(); // dx4

                      c3y = jpy + stack.shift(); // dy4

                      c4x = c3x + stack.shift(); // dx5

                      c4y = c3y + stack.shift(); // dy5

                      if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                        x = c4x + stack.shift();
                      } else {
                        y = c4y + stack.shift();
                      }

                      p.curveTo(c1x, c1y, c2x, c2y, jpx, jpy);
                      p.curveTo(c3x, c3y, c4x, c4y, x, y);
                      break;

                    default:
                      console.log('Glyph ' + glyph.index + ': unknown operator ' + 1200 + v);
                      stack.length = 0;
                  }

                  break;

                case 14:
                  // endchar
                  if (stack.length > 0 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }

                  if (open) {
                    p.closePath();
                    open = false;
                  }

                  break;

                case 18:
                  // hstemhm
                  parseStems();
                  break;

                case 19: // hintmask

                case 20:
                  // cntrmask
                  parseStems();
                  i += nStems + 7 >> 3;
                  break;

                case 21:
                  // rmoveto
                  if (stack.length > 2 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }

                  y += stack.pop();
                  x += stack.pop();
                  newContour(x, y);
                  break;

                case 22:
                  // hmoveto
                  if (stack.length > 1 && !haveWidth) {
                    width = stack.shift() + font.nominalWidthX;
                    haveWidth = true;
                  }

                  x += stack.pop();
                  newContour(x, y);
                  break;

                case 23:
                  // vstemhm
                  parseStems();
                  break;

                case 24:
                  // rcurveline
                  while (stack.length > 2) {
                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }

                  x += stack.shift();
                  y += stack.shift();
                  p.lineTo(x, y);
                  break;

                case 25:
                  // rlinecurve
                  while (stack.length > 6) {
                    x += stack.shift();
                    y += stack.shift();
                    p.lineTo(x, y);
                  }

                  c1x = x + stack.shift();
                  c1y = y + stack.shift();
                  c2x = c1x + stack.shift();
                  c2y = c1y + stack.shift();
                  x = c2x + stack.shift();
                  y = c2y + stack.shift();
                  p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  break;

                case 26:
                  // vvcurveto
                  if (stack.length % 2) {
                    x += stack.shift();
                  }

                  while (stack.length > 0) {
                    c1x = x;
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x;
                    y = c2y + stack.shift();
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }

                  break;

                case 27:
                  // hhcurveto
                  if (stack.length % 2) {
                    y += stack.shift();
                  }

                  while (stack.length > 0) {
                    c1x = x + stack.shift();
                    c1y = y;
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y;
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }

                  break;

                case 28:
                  // shortint
                  b1 = code[i];
                  b2 = code[i + 1];
                  stack.push((b1 << 24 | b2 << 16) >> 16);
                  i += 2;
                  break;

                case 29:
                  // callgsubr
                  codeIndex = stack.pop() + font.gsubrsBias;
                  subrCode = font.gsubrs[codeIndex];

                  if (subrCode) {
                    parse(subrCode);
                  }

                  break;

                case 30:
                  // vhcurveto
                  while (stack.length > 0) {
                    c1x = x;
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);

                    if (stack.length === 0) {
                      break;
                    }

                    c1x = x + stack.shift();
                    c1y = y;
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    y = c2y + stack.shift();
                    x = c2x + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }

                  break;

                case 31:
                  // hvcurveto
                  while (stack.length > 0) {
                    c1x = x + stack.shift();
                    c1y = y;
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    y = c2y + stack.shift();
                    x = c2x + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);

                    if (stack.length === 0) {
                      break;
                    }

                    c1x = x;
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + (stack.length === 1 ? stack.shift() : 0);
                    p.curveTo(c1x, c1y, c2x, c2y, x, y);
                  }

                  break;

                default:
                  if (v < 32) {
                    console.log('Glyph ' + glyph.index + ': unknown operator ' + v);
                  } else if (v < 247) {
                    stack.push(v - 139);
                  } else if (v < 251) {
                    b1 = code[i];
                    i += 1;
                    stack.push((v - 247) * 256 + b1 + 108);
                  } else if (v < 255) {
                    b1 = code[i];
                    i += 1;
                    stack.push(-(v - 251) * 256 - b1 - 108);
                  } else {
                    b1 = code[i];
                    b2 = code[i + 1];
                    b3 = code[i + 2];
                    b4 = code[i + 3];
                    i += 4;
                    stack.push((b1 << 24 | b2 << 16 | b3 << 8 | b4) / 65536);
                  }

              }
            }
          }

          parse(code);
          glyph.advanceWidth = width;
          return p;
        } // Subroutines are encoded using the negative half of the number space.
        // See type 2 chapter 4.7 "Subroutine operators".


        function calcCFFSubroutineBias(subrs) {
          var bias;

          if (subrs.length < 1240) {
            bias = 107;
          } else if (subrs.length < 33900) {
            bias = 1131;
          } else {
            bias = 32768;
          }

          return bias;
        } // Parse the `CFF` table, which contains the glyph outlines in PostScript format.


        function parseCFFTable(data, start, font) {
          font.tables.cff = {};
          var header = parseCFFHeader(data, start);
          var nameIndex = parseCFFIndex(data, header.endOffset, parse.bytesToString);
          var topDictIndex = parseCFFIndex(data, nameIndex.endOffset);
          var stringIndex = parseCFFIndex(data, topDictIndex.endOffset, parse.bytesToString);
          var globalSubrIndex = parseCFFIndex(data, stringIndex.endOffset);
          font.gsubrs = globalSubrIndex.objects;
          font.gsubrsBias = calcCFFSubroutineBias(font.gsubrs);
          var topDictData = new DataView(new Uint8Array(topDictIndex.objects[0]).buffer);
          var topDict = parseCFFTopDict(topDictData, stringIndex.objects);
          font.tables.cff.topDict = topDict;
          var privateDictOffset = start + topDict['private'][1];
          var privateDict = parseCFFPrivateDict(data, privateDictOffset, topDict['private'][0], stringIndex.objects);
          font.defaultWidthX = privateDict.defaultWidthX;
          font.nominalWidthX = privateDict.nominalWidthX;

          if (privateDict.subrs !== 0) {
            var subrOffset = privateDictOffset + privateDict.subrs;
            var subrIndex = parseCFFIndex(data, subrOffset);
            font.subrs = subrIndex.objects;
            font.subrsBias = calcCFFSubroutineBias(font.subrs);
          } else {
            font.subrs = [];
            font.subrsBias = 0;
          } // Offsets in the top dict are relative to the beginning of the CFF data, so add the CFF start offset.


          var charStringsIndex = parseCFFIndex(data, start + topDict.charStrings);
          font.nGlyphs = charStringsIndex.objects.length;
          var charset = parseCFFCharset(data, start + topDict.charset, font.nGlyphs, stringIndex.objects);

          if (topDict.encoding === 0) {
            // Standard encoding
            font.cffEncoding = new encoding.CffEncoding(encoding.cffStandardEncoding, charset);
          } else if (topDict.encoding === 1) {
            // Expert encoding
            font.cffEncoding = new encoding.CffEncoding(encoding.cffExpertEncoding, charset);
          } else {
            font.cffEncoding = parseCFFEncoding(data, start + topDict.encoding, charset);
          } // Prefer the CMAP encoding to the CFF encoding.


          font.encoding = font.encoding || font.cffEncoding;
          font.glyphs = new glyphset.GlyphSet(font);

          for (var i = 0; i < font.nGlyphs; i += 1) {
            var charString = charStringsIndex.objects[i];
            font.glyphs.push(i, glyphset.cffGlyphLoader(font, i, parseCFFCharstring, charString));
          }
        } // Convert a string to a String ID (SID).
        // The list of strings is modified in place.


        function encodeString(s, strings) {
          var sid; // Is the string in the CFF standard strings?

          var i = encoding.cffStandardStrings.indexOf(s);

          if (i >= 0) {
            sid = i;
          } // Is the string already in the string index?


          i = strings.indexOf(s);

          if (i >= 0) {
            sid = i + encoding.cffStandardStrings.length;
          } else {
            sid = encoding.cffStandardStrings.length + strings.length;
            strings.push(s);
          }

          return sid;
        }

        function makeHeader() {
          return new table.Table('Header', [{
            name: 'major',
            type: 'Card8',
            value: 1
          }, {
            name: 'minor',
            type: 'Card8',
            value: 0
          }, {
            name: 'hdrSize',
            type: 'Card8',
            value: 4
          }, {
            name: 'major',
            type: 'Card8',
            value: 1
          }]);
        }

        function makeNameIndex(fontNames) {
          var t = new table.Table('Name INDEX', [{
            name: 'names',
            type: 'INDEX',
            value: []
          }]);
          t.names = [];

          for (var i = 0; i < fontNames.length; i += 1) {
            t.names.push({
              name: 'name_' + i,
              type: 'NAME',
              value: fontNames[i]
            });
          }

          return t;
        } // Given a dictionary's metadata, create a DICT structure.


        function makeDict(meta, attrs, strings) {
          var m = {};

          for (var i = 0; i < meta.length; i += 1) {
            var entry = meta[i];
            var value = attrs[entry.name];

            if (value !== undefined && !equals(value, entry.value)) {
              if (entry.type === 'SID') {
                value = encodeString(value, strings);
              }

              m[entry.op] = {
                name: entry.name,
                type: entry.type,
                value: value
              };
            }
          }

          return m;
        } // The Top DICT houses the global font attributes.


        function makeTopDict(attrs, strings) {
          var t = new table.Table('Top DICT', [{
            name: 'dict',
            type: 'DICT',
            value: {}
          }]);
          t.dict = makeDict(TOP_DICT_META, attrs, strings);
          return t;
        }

        function makeTopDictIndex(topDict) {
          var t = new table.Table('Top DICT INDEX', [{
            name: 'topDicts',
            type: 'INDEX',
            value: []
          }]);
          t.topDicts = [{
            name: 'topDict_0',
            type: 'TABLE',
            value: topDict
          }];
          return t;
        }

        function makeStringIndex(strings) {
          var t = new table.Table('String INDEX', [{
            name: 'strings',
            type: 'INDEX',
            value: []
          }]);
          t.strings = [];

          for (var i = 0; i < strings.length; i += 1) {
            t.strings.push({
              name: 'string_' + i,
              type: 'STRING',
              value: strings[i]
            });
          }

          return t;
        }

        function makeGlobalSubrIndex() {
          // Currently we don't use subroutines.
          return new table.Table('Global Subr INDEX', [{
            name: 'subrs',
            type: 'INDEX',
            value: []
          }]);
        }

        function makeCharsets(glyphNames, strings) {
          var t = new table.Table('Charsets', [{
            name: 'format',
            type: 'Card8',
            value: 0
          }]);

          for (var i = 0; i < glyphNames.length; i += 1) {
            var glyphName = glyphNames[i];
            var glyphSID = encodeString(glyphName, strings);
            t.fields.push({
              name: 'glyph_' + i,
              type: 'SID',
              value: glyphSID
            });
          }

          return t;
        }

        function glyphToOps(glyph) {
          var ops = [];
          var path = glyph.path;
          ops.push({
            name: 'width',
            type: 'NUMBER',
            value: glyph.advanceWidth
          });
          var x = 0;
          var y = 0;

          for (var i = 0; i < path.commands.length; i += 1) {
            var dx;
            var dy;
            var cmd = path.commands[i];

            if (cmd.type === 'Q') {
              // CFF only supports bézier curves, so convert the quad to a bézier.
              var _13 = 1 / 3;

              var _23 = 2 / 3; // We're going to create a new command so we don't change the original path.


              cmd = {
                type: 'C',
                x: cmd.x,
                y: cmd.y,
                x1: _13 * x + _23 * cmd.x1,
                y1: _13 * y + _23 * cmd.y1,
                x2: _13 * cmd.x + _23 * cmd.x1,
                y2: _13 * cmd.y + _23 * cmd.y1
              };
            }

            if (cmd.type === 'M') {
              dx = Math.round(cmd.x - x);
              dy = Math.round(cmd.y - y);
              ops.push({
                name: 'dx',
                type: 'NUMBER',
                value: dx
              });
              ops.push({
                name: 'dy',
                type: 'NUMBER',
                value: dy
              });
              ops.push({
                name: 'rmoveto',
                type: 'OP',
                value: 21
              });
              x = Math.round(cmd.x);
              y = Math.round(cmd.y);
            } else if (cmd.type === 'L') {
              dx = Math.round(cmd.x - x);
              dy = Math.round(cmd.y - y);
              ops.push({
                name: 'dx',
                type: 'NUMBER',
                value: dx
              });
              ops.push({
                name: 'dy',
                type: 'NUMBER',
                value: dy
              });
              ops.push({
                name: 'rlineto',
                type: 'OP',
                value: 5
              });
              x = Math.round(cmd.x);
              y = Math.round(cmd.y);
            } else if (cmd.type === 'C') {
              var dx1 = Math.round(cmd.x1 - x);
              var dy1 = Math.round(cmd.y1 - y);
              var dx2 = Math.round(cmd.x2 - cmd.x1);
              var dy2 = Math.round(cmd.y2 - cmd.y1);
              dx = Math.round(cmd.x - cmd.x2);
              dy = Math.round(cmd.y - cmd.y2);
              ops.push({
                name: 'dx1',
                type: 'NUMBER',
                value: dx1
              });
              ops.push({
                name: 'dy1',
                type: 'NUMBER',
                value: dy1
              });
              ops.push({
                name: 'dx2',
                type: 'NUMBER',
                value: dx2
              });
              ops.push({
                name: 'dy2',
                type: 'NUMBER',
                value: dy2
              });
              ops.push({
                name: 'dx',
                type: 'NUMBER',
                value: dx
              });
              ops.push({
                name: 'dy',
                type: 'NUMBER',
                value: dy
              });
              ops.push({
                name: 'rrcurveto',
                type: 'OP',
                value: 8
              });
              x = Math.round(cmd.x);
              y = Math.round(cmd.y);
            } // Contours are closed automatically.

          }

          ops.push({
            name: 'endchar',
            type: 'OP',
            value: 14
          });
          return ops;
        }

        function makeCharStringsIndex(glyphs) {
          var t = new table.Table('CharStrings INDEX', [{
            name: 'charStrings',
            type: 'INDEX',
            value: []
          }]);

          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            var ops = glyphToOps(glyph);
            t.charStrings.push({
              name: glyph.name,
              type: 'CHARSTRING',
              value: ops
            });
          }

          return t;
        }

        function makePrivateDict(attrs, strings) {
          var t = new table.Table('Private DICT', [{
            name: 'dict',
            type: 'DICT',
            value: {}
          }]);
          t.dict = makeDict(PRIVATE_DICT_META, attrs, strings);
          return t;
        }

        function makePrivateDictIndex(privateDict) {
          var t = new table.Table('Private DICT INDEX', [{
            name: 'privateDicts',
            type: 'INDEX',
            value: []
          }]);
          t.privateDicts = [{
            name: 'privateDict_0',
            type: 'TABLE',
            value: privateDict
          }];
          return t;
        }

        function makeCFFTable(glyphs, options) {
          var t = new table.Table('CFF ', [{
            name: 'header',
            type: 'TABLE'
          }, {
            name: 'nameIndex',
            type: 'TABLE'
          }, {
            name: 'topDictIndex',
            type: 'TABLE'
          }, {
            name: 'stringIndex',
            type: 'TABLE'
          }, {
            name: 'globalSubrIndex',
            type: 'TABLE'
          }, {
            name: 'charsets',
            type: 'TABLE'
          }, {
            name: 'charStringsIndex',
            type: 'TABLE'
          }, {
            name: 'privateDictIndex',
            type: 'TABLE'
          }]);
          var fontScale = 1 / options.unitsPerEm; // We use non-zero values for the offsets so that the DICT encodes them.
          // This is important because the size of the Top DICT plays a role in offset calculation,
          // and the size shouldn't change after we've written correct offsets.

          var attrs = {
            version: options.version,
            fullName: options.fullName,
            familyName: options.familyName,
            weight: options.weightName,
            fontMatrix: [fontScale, 0, 0, fontScale, 0, 0],
            charset: 999,
            encoding: 0,
            charStrings: 999,
            private: [0, 999]
          };
          var privateAttrs = {};
          var glyphNames = [];
          var glyph; // Skip first glyph (.notdef)

          for (var i = 1; i < glyphs.length; i += 1) {
            glyph = glyphs.get(i);
            glyphNames.push(glyph.name);
          }

          var strings = [];
          t.header = makeHeader();
          t.nameIndex = makeNameIndex([options.postScriptName]);
          var topDict = makeTopDict(attrs, strings);
          t.topDictIndex = makeTopDictIndex(topDict);
          t.globalSubrIndex = makeGlobalSubrIndex();
          t.charsets = makeCharsets(glyphNames, strings);
          t.charStringsIndex = makeCharStringsIndex(glyphs);
          var privateDict = makePrivateDict(privateAttrs, strings);
          t.privateDictIndex = makePrivateDictIndex(privateDict); // Needs to come at the end, to encode all custom strings used in the font.

          t.stringIndex = makeStringIndex(strings);
          var startOffset = t.header.sizeOf() + t.nameIndex.sizeOf() + t.topDictIndex.sizeOf() + t.stringIndex.sizeOf() + t.globalSubrIndex.sizeOf();
          attrs.charset = startOffset; // We use the CFF standard encoding; proper encoding will be handled in cmap.

          attrs.encoding = 0;
          attrs.charStrings = attrs.charset + t.charsets.sizeOf();
          attrs.private[1] = attrs.charStrings + t.charStringsIndex.sizeOf(); // Recreate the Top DICT INDEX with the correct offsets.

          topDict = makeTopDict(attrs, strings);
          t.topDictIndex = makeTopDictIndex(topDict);
          return t;
        }

        exports.parse = parseCFFTable;
        exports.make = makeCFFTable;
      }, {
        "../encoding": 3,
        "../glyphset": 6,
        "../parse": 8,
        "../path": 9,
        "../table": 10
      }],
      12: [function (require, module, exports) {
        // The `cmap` table stores the mappings from characters to glyphs.
        // https://www.microsoft.com/typography/OTSPEC/cmap.htm
        'use strict';

        var check = require('../check');

        var parse = require('../parse');

        var table = require('../table'); // Parse the `cmap` table. This table stores the mappings from characters to glyphs.
        // There are many available formats, but we only support the Windows format 4.
        // This function returns a `CmapEncoding` object or null if no supported format could be found.


        function parseCmapTable(data, start) {
          var i;
          var cmap = {};
          cmap.version = parse.getUShort(data, start);
          check.argument(cmap.version === 0, 'cmap table version should be 0.'); // The cmap table can contain many sub-tables, each with their own format.
          // We're only interested in a "platform 3" table. This is a Windows format.

          cmap.numTables = parse.getUShort(data, start + 2);
          var offset = -1;

          for (i = 0; i < cmap.numTables; i += 1) {
            var platformId = parse.getUShort(data, start + 4 + i * 8);
            var encodingId = parse.getUShort(data, start + 4 + i * 8 + 2);

            if (platformId === 3 && (encodingId === 1 || encodingId === 0)) {
              offset = parse.getULong(data, start + 4 + i * 8 + 4);
              break;
            }
          }

          if (offset === -1) {
            // There is no cmap table in the font that we support, so return null.
            // This font will be marked as unsupported.
            return null;
          }

          var p = new parse.Parser(data, start + offset);
          cmap.format = p.parseUShort();
          check.argument(cmap.format === 4, 'Only format 4 cmap tables are supported.'); // Length in bytes of the sub-tables.

          cmap.length = p.parseUShort();
          cmap.language = p.parseUShort(); // segCount is stored x 2.

          var segCount;
          cmap.segCount = segCount = p.parseUShort() >> 1; // Skip searchRange, entrySelector, rangeShift.

          p.skip('uShort', 3); // The "unrolled" mapping from character codes to glyph indices.

          cmap.glyphIndexMap = {};
          var endCountParser = new parse.Parser(data, start + offset + 14);
          var startCountParser = new parse.Parser(data, start + offset + 16 + segCount * 2);
          var idDeltaParser = new parse.Parser(data, start + offset + 16 + segCount * 4);
          var idRangeOffsetParser = new parse.Parser(data, start + offset + 16 + segCount * 6);
          var glyphIndexOffset = start + offset + 16 + segCount * 8;

          for (i = 0; i < segCount - 1; i += 1) {
            var glyphIndex;
            var endCount = endCountParser.parseUShort();
            var startCount = startCountParser.parseUShort();
            var idDelta = idDeltaParser.parseShort();
            var idRangeOffset = idRangeOffsetParser.parseUShort();

            for (var c = startCount; c <= endCount; c += 1) {
              if (idRangeOffset !== 0) {
                // The idRangeOffset is relative to the current position in the idRangeOffset array.
                // Take the current offset in the idRangeOffset array.
                glyphIndexOffset = idRangeOffsetParser.offset + idRangeOffsetParser.relativeOffset - 2; // Add the value of the idRangeOffset, which will move us into the glyphIndex array.

                glyphIndexOffset += idRangeOffset; // Then add the character index of the current segment, multiplied by 2 for USHORTs.

                glyphIndexOffset += (c - startCount) * 2;
                glyphIndex = parse.getUShort(data, glyphIndexOffset);

                if (glyphIndex !== 0) {
                  glyphIndex = glyphIndex + idDelta & 0xFFFF;
                }
              } else {
                glyphIndex = c + idDelta & 0xFFFF;
              }

              cmap.glyphIndexMap[c] = glyphIndex;
            }
          }

          return cmap;
        }

        function addSegment(t, code, glyphIndex) {
          t.segments.push({
            end: code,
            start: code,
            delta: -(code - glyphIndex),
            offset: 0
          });
        }

        function addTerminatorSegment(t) {
          t.segments.push({
            end: 0xFFFF,
            start: 0xFFFF,
            delta: 1,
            offset: 0
          });
        }

        function makeCmapTable(glyphs) {
          var i;
          var t = new table.Table('cmap', [{
            name: 'version',
            type: 'USHORT',
            value: 0
          }, {
            name: 'numTables',
            type: 'USHORT',
            value: 1
          }, {
            name: 'platformID',
            type: 'USHORT',
            value: 3
          }, {
            name: 'encodingID',
            type: 'USHORT',
            value: 1
          }, {
            name: 'offset',
            type: 'ULONG',
            value: 12
          }, {
            name: 'format',
            type: 'USHORT',
            value: 4
          }, {
            name: 'length',
            type: 'USHORT',
            value: 0
          }, {
            name: 'language',
            type: 'USHORT',
            value: 0
          }, {
            name: 'segCountX2',
            type: 'USHORT',
            value: 0
          }, {
            name: 'searchRange',
            type: 'USHORT',
            value: 0
          }, {
            name: 'entrySelector',
            type: 'USHORT',
            value: 0
          }, {
            name: 'rangeShift',
            type: 'USHORT',
            value: 0
          }]);
          t.segments = [];

          for (i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);

            for (var j = 0; j < glyph.unicodes.length; j += 1) {
              addSegment(t, glyph.unicodes[j], i);
            }

            t.segments = t.segments.sort(function (a, b) {
              return a.start - b.start;
            });
          }

          addTerminatorSegment(t);
          var segCount;
          segCount = t.segments.length;
          t.segCountX2 = segCount * 2;
          t.searchRange = Math.pow(2, Math.floor(Math.log(segCount) / Math.log(2))) * 2;
          t.entrySelector = Math.log(t.searchRange / 2) / Math.log(2);
          t.rangeShift = t.segCountX2 - t.searchRange; // Set up parallel segment arrays.

          var endCounts = [];
          var startCounts = [];
          var idDeltas = [];
          var idRangeOffsets = [];
          var glyphIds = [];

          for (i = 0; i < segCount; i += 1) {
            var segment = t.segments[i];
            endCounts = endCounts.concat({
              name: 'end_' + i,
              type: 'USHORT',
              value: segment.end
            });
            startCounts = startCounts.concat({
              name: 'start_' + i,
              type: 'USHORT',
              value: segment.start
            });
            idDeltas = idDeltas.concat({
              name: 'idDelta_' + i,
              type: 'SHORT',
              value: segment.delta
            });
            idRangeOffsets = idRangeOffsets.concat({
              name: 'idRangeOffset_' + i,
              type: 'USHORT',
              value: segment.offset
            });

            if (segment.glyphId !== undefined) {
              glyphIds = glyphIds.concat({
                name: 'glyph_' + i,
                type: 'USHORT',
                value: segment.glyphId
              });
            }
          }

          t.fields = t.fields.concat(endCounts);
          t.fields.push({
            name: 'reservedPad',
            type: 'USHORT',
            value: 0
          });
          t.fields = t.fields.concat(startCounts);
          t.fields = t.fields.concat(idDeltas);
          t.fields = t.fields.concat(idRangeOffsets);
          t.fields = t.fields.concat(glyphIds);
          t.length = 14 + // Subtable header
          endCounts.length * 2 + 2 + // reservedPad
          startCounts.length * 2 + idDeltas.length * 2 + idRangeOffsets.length * 2 + glyphIds.length * 2;
          return t;
        }

        exports.parse = parseCmapTable;
        exports.make = makeCmapTable;
      }, {
        "../check": 1,
        "../parse": 8,
        "../table": 10
      }],
      13: [function (require, module, exports) {
        // The `glyf` table describes the glyphs in TrueType outline format.
        // http://www.microsoft.com/typography/otspec/glyf.htm
        'use strict';

        var check = require('../check');

        var glyphset = require('../glyphset');

        var parse = require('../parse');

        var path = require('../path'); // Parse the coordinate data for a glyph.


        function parseGlyphCoordinate(p, flag, previousValue, shortVectorBitMask, sameBitMask) {
          var v;

          if ((flag & shortVectorBitMask) > 0) {
            // The coordinate is 1 byte long.
            v = p.parseByte(); // The `same` bit is re-used for short values to signify the sign of the value.

            if ((flag & sameBitMask) === 0) {
              v = -v;
            }

            v = previousValue + v;
          } else {
            //  The coordinate is 2 bytes long.
            // If the `same` bit is set, the coordinate is the same as the previous coordinate.
            if ((flag & sameBitMask) > 0) {
              v = previousValue;
            } else {
              // Parse the coordinate as a signed 16-bit delta value.
              v = previousValue + p.parseShort();
            }
          }

          return v;
        } // Parse a TrueType glyph.


        function parseGlyph(glyph, data, start) {
          var p = new parse.Parser(data, start);
          glyph.numberOfContours = p.parseShort();
          glyph.xMin = p.parseShort();
          glyph.yMin = p.parseShort();
          glyph.xMax = p.parseShort();
          glyph.yMax = p.parseShort();
          var flags;
          var flag;

          if (glyph.numberOfContours > 0) {
            var i; // This glyph is not a composite.

            var endPointIndices = glyph.endPointIndices = [];

            for (i = 0; i < glyph.numberOfContours; i += 1) {
              endPointIndices.push(p.parseUShort());
            }

            glyph.instructionLength = p.parseUShort();
            glyph.instructions = [];

            for (i = 0; i < glyph.instructionLength; i += 1) {
              glyph.instructions.push(p.parseByte());
            }

            var numberOfCoordinates = endPointIndices[endPointIndices.length - 1] + 1;
            flags = [];

            for (i = 0; i < numberOfCoordinates; i += 1) {
              flag = p.parseByte();
              flags.push(flag); // If bit 3 is set, we repeat this flag n times, where n is the next byte.

              if ((flag & 8) > 0) {
                var repeatCount = p.parseByte();

                for (var j = 0; j < repeatCount; j += 1) {
                  flags.push(flag);
                  i += 1;
                }
              }
            }

            check.argument(flags.length === numberOfCoordinates, 'Bad flags.');

            if (endPointIndices.length > 0) {
              var points = [];
              var point; // X/Y coordinates are relative to the previous point, except for the first point which is relative to 0,0.

              if (numberOfCoordinates > 0) {
                for (i = 0; i < numberOfCoordinates; i += 1) {
                  flag = flags[i];
                  point = {};
                  point.onCurve = !!(flag & 1);
                  point.lastPointOfContour = endPointIndices.indexOf(i) >= 0;
                  points.push(point);
                }

                var px = 0;

                for (i = 0; i < numberOfCoordinates; i += 1) {
                  flag = flags[i];
                  point = points[i];
                  point.x = parseGlyphCoordinate(p, flag, px, 2, 16);
                  px = point.x;
                }

                var py = 0;

                for (i = 0; i < numberOfCoordinates; i += 1) {
                  flag = flags[i];
                  point = points[i];
                  point.y = parseGlyphCoordinate(p, flag, py, 4, 32);
                  py = point.y;
                }
              }

              glyph.points = points;
            } else {
              glyph.points = [];
            }
          } else if (glyph.numberOfContours === 0) {
            glyph.points = [];
          } else {
            glyph.isComposite = true;
            glyph.points = [];
            glyph.components = [];
            var moreComponents = true;

            while (moreComponents) {
              flags = p.parseUShort();
              var component = {
                glyphIndex: p.parseUShort(),
                xScale: 1,
                scale01: 0,
                scale10: 0,
                yScale: 1,
                dx: 0,
                dy: 0
              };

              if ((flags & 1) > 0) {
                // The arguments are words
                component.dx = p.parseShort();
                component.dy = p.parseShort();
              } else {
                // The arguments are bytes
                component.dx = p.parseChar();
                component.dy = p.parseChar();
              }

              if ((flags & 8) > 0) {
                // We have a scale
                component.xScale = component.yScale = p.parseF2Dot14();
              } else if ((flags & 64) > 0) {
                // We have an X / Y scale
                component.xScale = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
              } else if ((flags & 128) > 0) {
                // We have a 2x2 transformation
                component.xScale = p.parseF2Dot14();
                component.scale01 = p.parseF2Dot14();
                component.scale10 = p.parseF2Dot14();
                component.yScale = p.parseF2Dot14();
              }

              glyph.components.push(component);
              moreComponents = !!(flags & 32);
            }
          }
        } // Transform an array of points and return a new array.


        function transformPoints(points, transform) {
          var newPoints = [];

          for (var i = 0; i < points.length; i += 1) {
            var pt = points[i];
            var newPt = {
              x: transform.xScale * pt.x + transform.scale01 * pt.y + transform.dx,
              y: transform.scale10 * pt.x + transform.yScale * pt.y + transform.dy,
              onCurve: pt.onCurve,
              lastPointOfContour: pt.lastPointOfContour
            };
            newPoints.push(newPt);
          }

          return newPoints;
        }

        function getContours(points) {
          var contours = [];
          var currentContour = [];

          for (var i = 0; i < points.length; i += 1) {
            var pt = points[i];
            currentContour.push(pt);

            if (pt.lastPointOfContour) {
              contours.push(currentContour);
              currentContour = [];
            }
          }

          check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
          return contours;
        } // Convert the TrueType glyph outline to a Path.


        function getPath(points) {
          var p = new path.Path();

          if (!points) {
            return p;
          }

          var contours = getContours(points);

          for (var i = 0; i < contours.length; i += 1) {
            var contour = contours[i];
            var firstPt = contour[0];
            var lastPt = contour[contour.length - 1];
            var curvePt;
            var realFirstPoint;

            if (firstPt.onCurve) {
              curvePt = null; // The first point will be consumed by the moveTo command,
              // so skip it in the loop.

              realFirstPoint = true;
            } else {
              if (lastPt.onCurve) {
                // If the first point is off-curve and the last point is on-curve,
                // start at the last point.
                firstPt = lastPt;
              } else {
                // If both first and last points are off-curve, start at their middle.
                firstPt = {
                  x: (firstPt.x + lastPt.x) / 2,
                  y: (firstPt.y + lastPt.y) / 2
                };
              }

              curvePt = firstPt; // The first point is synthesized, so don't skip the real first point.

              realFirstPoint = false;
            }

            p.moveTo(firstPt.x, firstPt.y);

            for (var j = realFirstPoint ? 1 : 0; j < contour.length; j += 1) {
              var pt = contour[j];
              var prevPt = j === 0 ? firstPt : contour[j - 1];

              if (prevPt.onCurve && pt.onCurve) {
                // This is a straight line.
                p.lineTo(pt.x, pt.y);
              } else if (prevPt.onCurve && !pt.onCurve) {
                curvePt = pt;
              } else if (!prevPt.onCurve && !pt.onCurve) {
                var midPt = {
                  x: (prevPt.x + pt.x) / 2,
                  y: (prevPt.y + pt.y) / 2
                };
                p.quadraticCurveTo(prevPt.x, prevPt.y, midPt.x, midPt.y);
                curvePt = pt;
              } else if (!prevPt.onCurve && pt.onCurve) {
                // Previous point off-curve, this point on-curve.
                p.quadraticCurveTo(curvePt.x, curvePt.y, pt.x, pt.y);
                curvePt = null;
              } else {
                throw new Error('Invalid state.');
              }
            }

            if (firstPt !== lastPt) {
              // Connect the last and first points
              if (curvePt) {
                p.quadraticCurveTo(curvePt.x, curvePt.y, firstPt.x, firstPt.y);
              } else {
                p.lineTo(firstPt.x, firstPt.y);
              }
            }
          }

          p.closePath();
          return p;
        }

        function buildPath(glyphs, glyph) {
          if (glyph.isComposite) {
            for (var j = 0; j < glyph.components.length; j += 1) {
              var component = glyph.components[j];
              var componentGlyph = glyphs.get(component.glyphIndex);

              if (componentGlyph.points) {
                var transformedPoints = transformPoints(componentGlyph.points, component);
                glyph.points = glyph.points.concat(transformedPoints);
              }
            }
          }

          return getPath(glyph.points);
        } // Parse all the glyphs according to the offsets from the `loca` table.


        function parseGlyfTable(data, start, loca, font) {
          var glyphs = new glyphset.GlyphSet(font);
          var i; // The last element of the loca table is invalid.

          for (i = 0; i < loca.length - 1; i += 1) {
            var offset = loca[i];
            var nextOffset = loca[i + 1];

            if (offset !== nextOffset) {
              glyphs.push(i, glyphset.ttfGlyphLoader(font, i, parseGlyph, data, start + offset, buildPath));
            } else {
              glyphs.push(i, glyphset.glyphLoader(font, i));
            }
          }

          return glyphs;
        }

        exports.parse = parseGlyfTable;
      }, {
        "../check": 1,
        "../glyphset": 6,
        "../parse": 8,
        "../path": 9
      }],
      14: [function (require, module, exports) {
        // The `GPOS` table contains kerning pairs, among other things.
        // https://www.microsoft.com/typography/OTSPEC/gpos.htm
        'use strict';

        var check = require('../check');

        var parse = require('../parse'); // Parse ScriptList and FeatureList tables of GPOS, GSUB, GDEF, BASE, JSTF tables.
        // These lists are unused by now, this function is just the basis for a real parsing.


        function parseTaggedListTable(data, start) {
          var p = new parse.Parser(data, start);
          var n = p.parseUShort();
          var list = [];

          for (var i = 0; i < n; i++) {
            list[p.parseTag()] = {
              offset: p.parseUShort()
            };
          }

          return list;
        } // Parse a coverage table in a GSUB, GPOS or GDEF table.
        // Format 1 is a simple list of glyph ids,
        // Format 2 is a list of ranges. It is expanded in a list of glyphs, maybe not the best idea.


        function parseCoverageTable(data, start) {
          var p = new parse.Parser(data, start);
          var format = p.parseUShort();
          var count = p.parseUShort();

          if (format === 1) {
            return p.parseUShortList(count);
          } else if (format === 2) {
            var coverage = [];

            for (; count--;) {
              var begin = p.parseUShort();
              var end = p.parseUShort();
              var index = p.parseUShort();

              for (var i = begin; i <= end; i++) {
                coverage[index++] = i;
              }
            }

            return coverage;
          }
        } // Parse a Class Definition Table in a GSUB, GPOS or GDEF table.
        // Returns a function that gets a class value from a glyph ID.


        function parseClassDefTable(data, start) {
          var p = new parse.Parser(data, start);
          var format = p.parseUShort();

          if (format === 1) {
            // Format 1 specifies a range of consecutive glyph indices, one class per glyph ID.
            var startGlyph = p.parseUShort();
            var glyphCount = p.parseUShort();
            var classes = p.parseUShortList(glyphCount);
            return function (glyphID) {
              return classes[glyphID - startGlyph] || 0;
            };
          } else if (format === 2) {
            // Format 2 defines multiple groups of glyph indices that belong to the same class.
            var rangeCount = p.parseUShort();
            var startGlyphs = [];
            var endGlyphs = [];
            var classValues = [];

            for (var i = 0; i < rangeCount; i++) {
              startGlyphs[i] = p.parseUShort();
              endGlyphs[i] = p.parseUShort();
              classValues[i] = p.parseUShort();
            }

            return function (glyphID) {
              var l = 0;
              var r = startGlyphs.length - 1;

              while (l < r) {
                var c = l + r + 1 >> 1;

                if (glyphID < startGlyphs[c]) {
                  r = c - 1;
                } else {
                  l = c;
                }
              }

              if (startGlyphs[l] <= glyphID && glyphID <= endGlyphs[l]) {
                return classValues[l] || 0;
              }

              return 0;
            };
          }
        } // Parse a pair adjustment positioning subtable, format 1 or format 2
        // The subtable is returned in the form of a lookup function.


        function parsePairPosSubTable(data, start) {
          var p = new parse.Parser(data, start); // This part is common to format 1 and format 2 subtables

          var format = p.parseUShort();
          var coverageOffset = p.parseUShort();
          var coverage = parseCoverageTable(data, start + coverageOffset); // valueFormat 4: XAdvance only, 1: XPlacement only, 0: no ValueRecord for second glyph
          // Only valueFormat1=4 and valueFormat2=0 is supported.

          var valueFormat1 = p.parseUShort();
          var valueFormat2 = p.parseUShort();
          var value1;
          var value2;
          if (valueFormat1 !== 4 || valueFormat2 !== 0) return;
          var sharedPairSets = {};

          if (format === 1) {
            // Pair Positioning Adjustment: Format 1
            var pairSetCount = p.parseUShort();
            var pairSet = []; // Array of offsets to PairSet tables-from beginning of PairPos subtable-ordered by Coverage Index

            var pairSetOffsets = p.parseOffset16List(pairSetCount);

            for (var firstGlyph = 0; firstGlyph < pairSetCount; firstGlyph++) {
              var pairSetOffset = pairSetOffsets[firstGlyph];
              var sharedPairSet = sharedPairSets[pairSetOffset];

              if (!sharedPairSet) {
                // Parse a pairset table in a pair adjustment subtable format 1
                sharedPairSet = {};
                p.relativeOffset = pairSetOffset;
                var pairValueCount = p.parseUShort();

                for (; pairValueCount--;) {
                  var secondGlyph = p.parseUShort();
                  if (valueFormat1) value1 = p.parseShort();
                  if (valueFormat2) value2 = p.parseShort(); // We only support valueFormat1 = 4 and valueFormat2 = 0,
                  // so value1 is the XAdvance and value2 is empty.

                  sharedPairSet[secondGlyph] = value1;
                }
              }

              pairSet[coverage[firstGlyph]] = sharedPairSet;
            }

            return function (leftGlyph, rightGlyph) {
              var pairs = pairSet[leftGlyph];
              if (pairs) return pairs[rightGlyph];
            };
          } else if (format === 2) {
            // Pair Positioning Adjustment: Format 2
            var classDef1Offset = p.parseUShort();
            var classDef2Offset = p.parseUShort();
            var class1Count = p.parseUShort();
            var class2Count = p.parseUShort();
            var getClass1 = parseClassDefTable(data, start + classDef1Offset);
            var getClass2 = parseClassDefTable(data, start + classDef2Offset); // Parse kerning values by class pair.

            var kerningMatrix = [];

            for (var i = 0; i < class1Count; i++) {
              var kerningRow = kerningMatrix[i] = [];

              for (var j = 0; j < class2Count; j++) {
                if (valueFormat1) value1 = p.parseShort();
                if (valueFormat2) value2 = p.parseShort(); // We only support valueFormat1 = 4 and valueFormat2 = 0,
                // so value1 is the XAdvance and value2 is empty.

                kerningRow[j] = value1;
              }
            } // Convert coverage list to a hash


            var covered = {};

            for (i = 0; i < coverage.length; i++) covered[coverage[i]] = 1; // Get the kerning value for a specific glyph pair.


            return function (leftGlyph, rightGlyph) {
              if (!covered[leftGlyph]) return;
              var class1 = getClass1(leftGlyph);
              var class2 = getClass2(rightGlyph);
              var kerningRow = kerningMatrix[class1];

              if (kerningRow) {
                return kerningRow[class2];
              }
            };
          }
        } // Parse a LookupTable (present in of GPOS, GSUB, GDEF, BASE, JSTF tables).


        function parseLookupTable(data, start) {
          var p = new parse.Parser(data, start);
          var lookupType = p.parseUShort();
          var lookupFlag = p.parseUShort();
          var useMarkFilteringSet = lookupFlag & 0x10;
          var subTableCount = p.parseUShort();
          var subTableOffsets = p.parseOffset16List(subTableCount);
          var table = {
            lookupType: lookupType,
            lookupFlag: lookupFlag,
            markFilteringSet: useMarkFilteringSet ? p.parseUShort() : -1
          }; // LookupType 2, Pair adjustment

          if (lookupType === 2) {
            var subtables = [];

            for (var i = 0; i < subTableCount; i++) {
              subtables.push(parsePairPosSubTable(data, start + subTableOffsets[i]));
            } // Return a function which finds the kerning values in the subtables.


            table.getKerningValue = function (leftGlyph, rightGlyph) {
              for (var i = subtables.length; i--;) {
                var value = subtables[i](leftGlyph, rightGlyph);
                if (value !== undefined) return value;
              }

              return 0;
            };
          }

          return table;
        } // Parse the `GPOS` table which contains, among other things, kerning pairs.
        // https://www.microsoft.com/typography/OTSPEC/gpos.htm


        function parseGposTable(data, start, font) {
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseFixed();
          check.argument(tableVersion === 1, 'Unsupported GPOS table version.'); // ScriptList and FeatureList - ignored for now

          parseTaggedListTable(data, start + p.parseUShort()); // 'kern' is the feature we are looking for.

          parseTaggedListTable(data, start + p.parseUShort()); // LookupList

          var lookupListOffset = p.parseUShort();
          p.relativeOffset = lookupListOffset;
          var lookupCount = p.parseUShort();
          var lookupTableOffsets = p.parseOffset16List(lookupCount);
          var lookupListAbsoluteOffset = start + lookupListOffset;

          for (var i = 0; i < lookupCount; i++) {
            var table = parseLookupTable(data, lookupListAbsoluteOffset + lookupTableOffsets[i]);
            if (table.lookupType === 2 && !font.getGposKerningValue) font.getGposKerningValue = table.getKerningValue;
          }
        }

        exports.parse = parseGposTable;
      }, {
        "../check": 1,
        "../parse": 8
      }],
      15: [function (require, module, exports) {
        // The `head` table contains global information about the font.
        // https://www.microsoft.com/typography/OTSPEC/head.htm
        'use strict';

        var check = require('../check');

        var parse = require('../parse');

        var table = require('../table'); // Parse the header `head` table


        function parseHeadTable(data, start) {
          var head = {};
          var p = new parse.Parser(data, start);
          head.version = p.parseVersion();
          head.fontRevision = Math.round(p.parseFixed() * 1000) / 1000;
          head.checkSumAdjustment = p.parseULong();
          head.magicNumber = p.parseULong();
          check.argument(head.magicNumber === 0x5F0F3CF5, 'Font header has wrong magic number.');
          head.flags = p.parseUShort();
          head.unitsPerEm = p.parseUShort();
          head.created = p.parseLongDateTime();
          head.modified = p.parseLongDateTime();
          head.xMin = p.parseShort();
          head.yMin = p.parseShort();
          head.xMax = p.parseShort();
          head.yMax = p.parseShort();
          head.macStyle = p.parseUShort();
          head.lowestRecPPEM = p.parseUShort();
          head.fontDirectionHint = p.parseShort();
          head.indexToLocFormat = p.parseShort(); // 50

          head.glyphDataFormat = p.parseShort();
          return head;
        }

        function makeHeadTable(options) {
          return new table.Table('head', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00010000
          }, {
            name: 'fontRevision',
            type: 'FIXED',
            value: 0x00010000
          }, {
            name: 'checkSumAdjustment',
            type: 'ULONG',
            value: 0
          }, {
            name: 'magicNumber',
            type: 'ULONG',
            value: 0x5F0F3CF5
          }, {
            name: 'flags',
            type: 'USHORT',
            value: 0
          }, {
            name: 'unitsPerEm',
            type: 'USHORT',
            value: 1000
          }, {
            name: 'created',
            type: 'LONGDATETIME',
            value: 0
          }, {
            name: 'modified',
            type: 'LONGDATETIME',
            value: 0
          }, {
            name: 'xMin',
            type: 'SHORT',
            value: 0
          }, {
            name: 'yMin',
            type: 'SHORT',
            value: 0
          }, {
            name: 'xMax',
            type: 'SHORT',
            value: 0
          }, {
            name: 'yMax',
            type: 'SHORT',
            value: 0
          }, {
            name: 'macStyle',
            type: 'USHORT',
            value: 0
          }, {
            name: 'lowestRecPPEM',
            type: 'USHORT',
            value: 0
          }, {
            name: 'fontDirectionHint',
            type: 'SHORT',
            value: 2
          }, {
            name: 'indexToLocFormat',
            type: 'SHORT',
            value: 0
          }, {
            name: 'glyphDataFormat',
            type: 'SHORT',
            value: 0
          }], options);
        }

        exports.parse = parseHeadTable;
        exports.make = makeHeadTable;
      }, {
        "../check": 1,
        "../parse": 8,
        "../table": 10
      }],
      16: [function (require, module, exports) {
        // The `hhea` table contains information for horizontal layout.
        // https://www.microsoft.com/typography/OTSPEC/hhea.htm
        'use strict';

        var parse = require('../parse');

        var table = require('../table'); // Parse the horizontal header `hhea` table


        function parseHheaTable(data, start) {
          var hhea = {};
          var p = new parse.Parser(data, start);
          hhea.version = p.parseVersion();
          hhea.ascender = p.parseShort();
          hhea.descender = p.parseShort();
          hhea.lineGap = p.parseShort();
          hhea.advanceWidthMax = p.parseUShort();
          hhea.minLeftSideBearing = p.parseShort();
          hhea.minRightSideBearing = p.parseShort();
          hhea.xMaxExtent = p.parseShort();
          hhea.caretSlopeRise = p.parseShort();
          hhea.caretSlopeRun = p.parseShort();
          hhea.caretOffset = p.parseShort();
          p.relativeOffset += 8;
          hhea.metricDataFormat = p.parseShort();
          hhea.numberOfHMetrics = p.parseUShort();
          return hhea;
        }

        function makeHheaTable(options) {
          return new table.Table('hhea', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00010000
          }, {
            name: 'ascender',
            type: 'FWORD',
            value: 0
          }, {
            name: 'descender',
            type: 'FWORD',
            value: 0
          }, {
            name: 'lineGap',
            type: 'FWORD',
            value: 0
          }, {
            name: 'advanceWidthMax',
            type: 'UFWORD',
            value: 0
          }, {
            name: 'minLeftSideBearing',
            type: 'FWORD',
            value: 0
          }, {
            name: 'minRightSideBearing',
            type: 'FWORD',
            value: 0
          }, {
            name: 'xMaxExtent',
            type: 'FWORD',
            value: 0
          }, {
            name: 'caretSlopeRise',
            type: 'SHORT',
            value: 1
          }, {
            name: 'caretSlopeRun',
            type: 'SHORT',
            value: 0
          }, {
            name: 'caretOffset',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved1',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved2',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved3',
            type: 'SHORT',
            value: 0
          }, {
            name: 'reserved4',
            type: 'SHORT',
            value: 0
          }, {
            name: 'metricDataFormat',
            type: 'SHORT',
            value: 0
          }, {
            name: 'numberOfHMetrics',
            type: 'USHORT',
            value: 0
          }], options);
        }

        exports.parse = parseHheaTable;
        exports.make = makeHheaTable;
      }, {
        "../parse": 8,
        "../table": 10
      }],
      17: [function (require, module, exports) {
        // The `hmtx` table contains the horizontal metrics for all glyphs.
        // https://www.microsoft.com/typography/OTSPEC/hmtx.htm
        'use strict';

        var parse = require('../parse');

        var table = require('../table'); // Parse the `hmtx` table, which contains the horizontal metrics for all glyphs.
        // This function augments the glyph array, adding the advanceWidth and leftSideBearing to each glyph.


        function parseHmtxTable(data, start, numMetrics, numGlyphs, glyphs) {
          var advanceWidth;
          var leftSideBearing;
          var p = new parse.Parser(data, start);

          for (var i = 0; i < numGlyphs; i += 1) {
            // If the font is monospaced, only one entry is needed. This last entry applies to all subsequent glyphs.
            if (i < numMetrics) {
              advanceWidth = p.parseUShort();
              leftSideBearing = p.parseShort();
            }

            var glyph = glyphs.get(i);
            glyph.advanceWidth = advanceWidth;
            glyph.leftSideBearing = leftSideBearing;
          }
        }

        function makeHmtxTable(glyphs) {
          var t = new table.Table('hmtx', []);

          for (var i = 0; i < glyphs.length; i += 1) {
            var glyph = glyphs.get(i);
            var advanceWidth = glyph.advanceWidth || 0;
            var leftSideBearing = glyph.leftSideBearing || 0;
            t.fields.push({
              name: 'advanceWidth_' + i,
              type: 'USHORT',
              value: advanceWidth
            });
            t.fields.push({
              name: 'leftSideBearing_' + i,
              type: 'SHORT',
              value: leftSideBearing
            });
          }

          return t;
        }

        exports.parse = parseHmtxTable;
        exports.make = makeHmtxTable;
      }, {
        "../parse": 8,
        "../table": 10
      }],
      18: [function (require, module, exports) {
        // The `kern` table contains kerning pairs.
        // Note that some fonts use the GPOS OpenType layout table to specify kerning.
        // https://www.microsoft.com/typography/OTSPEC/kern.htm
        'use strict';

        var check = require('../check');

        var parse = require('../parse'); // Parse the `kern` table which contains kerning pairs.


        function parseKernTable(data, start) {
          var pairs = {};
          var p = new parse.Parser(data, start);
          var tableVersion = p.parseUShort();
          check.argument(tableVersion === 0, 'Unsupported kern table version.'); // Skip nTables.

          p.skip('uShort', 1);
          var subTableVersion = p.parseUShort();
          check.argument(subTableVersion === 0, 'Unsupported kern sub-table version.'); // Skip subTableLength, subTableCoverage

          p.skip('uShort', 2);
          var nPairs = p.parseUShort(); // Skip searchRange, entrySelector, rangeShift.

          p.skip('uShort', 3);

          for (var i = 0; i < nPairs; i += 1) {
            var leftIndex = p.parseUShort();
            var rightIndex = p.parseUShort();
            var value = p.parseShort();
            pairs[leftIndex + ',' + rightIndex] = value;
          }

          return pairs;
        }

        exports.parse = parseKernTable;
      }, {
        "../check": 1,
        "../parse": 8
      }],
      19: [function (require, module, exports) {
        // The `loca` table stores the offsets to the locations of the glyphs in the font.
        // https://www.microsoft.com/typography/OTSPEC/loca.htm
        'use strict';

        var parse = require('../parse'); // Parse the `loca` table. This table stores the offsets to the locations of the glyphs in the font,
        // relative to the beginning of the glyphData table.
        // The number of glyphs stored in the `loca` table is specified in the `maxp` table (under numGlyphs)
        // The loca table has two versions: a short version where offsets are stored as uShorts, and a long
        // version where offsets are stored as uLongs. The `head` table specifies which version to use
        // (under indexToLocFormat).


        function parseLocaTable(data, start, numGlyphs, shortVersion) {
          var p = new parse.Parser(data, start);
          var parseFn = shortVersion ? p.parseUShort : p.parseULong; // There is an extra entry after the last index element to compute the length of the last glyph.
          // That's why we use numGlyphs + 1.

          var glyphOffsets = [];

          for (var i = 0; i < numGlyphs + 1; i += 1) {
            var glyphOffset = parseFn.call(p);

            if (shortVersion) {
              // The short table version stores the actual offset divided by 2.
              glyphOffset *= 2;
            }

            glyphOffsets.push(glyphOffset);
          }

          return glyphOffsets;
        }

        exports.parse = parseLocaTable;
      }, {
        "../parse": 8
      }],
      20: [function (require, module, exports) {
        // The `maxp` table establishes the memory requirements for the font.
        // We need it just to get the number of glyphs in the font.
        // https://www.microsoft.com/typography/OTSPEC/maxp.htm
        'use strict';

        var parse = require('../parse');

        var table = require('../table'); // Parse the maximum profile `maxp` table.


        function parseMaxpTable(data, start) {
          var maxp = {};
          var p = new parse.Parser(data, start);
          maxp.version = p.parseVersion();
          maxp.numGlyphs = p.parseUShort();

          if (maxp.version === 1.0) {
            maxp.maxPoints = p.parseUShort();
            maxp.maxContours = p.parseUShort();
            maxp.maxCompositePoints = p.parseUShort();
            maxp.maxCompositeContours = p.parseUShort();
            maxp.maxZones = p.parseUShort();
            maxp.maxTwilightPoints = p.parseUShort();
            maxp.maxStorage = p.parseUShort();
            maxp.maxFunctionDefs = p.parseUShort();
            maxp.maxInstructionDefs = p.parseUShort();
            maxp.maxStackElements = p.parseUShort();
            maxp.maxSizeOfInstructions = p.parseUShort();
            maxp.maxComponentElements = p.parseUShort();
            maxp.maxComponentDepth = p.parseUShort();
          }

          return maxp;
        }

        function makeMaxpTable(numGlyphs) {
          return new table.Table('maxp', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00005000
          }, {
            name: 'numGlyphs',
            type: 'USHORT',
            value: numGlyphs
          }]);
        }

        exports.parse = parseMaxpTable;
        exports.make = makeMaxpTable;
      }, {
        "../parse": 8,
        "../table": 10
      }],
      21: [function (require, module, exports) {
        // The `name` naming table.
        // https://www.microsoft.com/typography/OTSPEC/name.htm
        'use strict';

        var encode = require('../types').encode;

        var parse = require('../parse');

        var table = require('../table'); // NameIDs for the name table.


        var nameTableNames = ['copyright', // 0
        'fontFamily', // 1
        'fontSubfamily', // 2
        'uniqueID', // 3
        'fullName', // 4
        'version', // 5
        'postScriptName', // 6
        'trademark', // 7
        'manufacturer', // 8
        'designer', // 9
        'description', // 10
        'manufacturerURL', // 11
        'designerURL', // 12
        'licence', // 13
        'licenceURL', // 14
        'reserved', // 15
        'preferredFamily', // 16
        'preferredSubfamily', // 17
        'compatibleFullName', // 18
        'sampleText', // 19
        'postScriptFindFontName', // 20
        'wwsFamily', // 21
        'wwsSubfamily' // 22
        ]; // Parse the naming `name` table
        // Only Windows Unicode English names are supported.
        // Format 1 additional fields are not supported

        function parseNameTable(data, start) {
          var name = {};
          var p = new parse.Parser(data, start);
          name.format = p.parseUShort();
          var count = p.parseUShort();
          var stringOffset = p.offset + p.parseUShort();
          var unknownCount = 0;

          for (var i = 0; i < count; i++) {
            var platformID = p.parseUShort();
            var encodingID = p.parseUShort();
            var languageID = p.parseUShort();
            var nameID = p.parseUShort();
            var property = nameTableNames[nameID];
            var byteLength = p.parseUShort();
            var offset = p.parseUShort(); // platformID - encodingID - languageID standard combinations :
            // 1 - 0 - 0 : Macintosh, Roman, English
            // 3 - 1 - 0x409 : Windows, Unicode BMP (UCS-2), en-US

            if (platformID === 3 && encodingID === 1 && languageID === 0x409) {
              var codePoints = [];
              var length = byteLength / 2;

              for (var j = 0; j < length; j++, offset += 2) {
                codePoints[j] = parse.getShort(data, stringOffset + offset);
              }

              var str = String.fromCharCode.apply(null, codePoints);

              if (property) {
                name[property] = str;
              } else {
                unknownCount++;
                name['unknown' + unknownCount] = str;
              }
            }
          }

          if (name.format === 1) {
            name.langTagCount = p.parseUShort();
          }

          return name;
        }

        function makeNameRecord(platformID, encodingID, languageID, nameID, length, offset) {
          return new table.Table('NameRecord', [{
            name: 'platformID',
            type: 'USHORT',
            value: platformID
          }, {
            name: 'encodingID',
            type: 'USHORT',
            value: encodingID
          }, {
            name: 'languageID',
            type: 'USHORT',
            value: languageID
          }, {
            name: 'nameID',
            type: 'USHORT',
            value: nameID
          }, {
            name: 'length',
            type: 'USHORT',
            value: length
          }, {
            name: 'offset',
            type: 'USHORT',
            value: offset
          }]);
        }

        function addMacintoshNameRecord(t, recordID, s, offset) {
          // Macintosh, Roman, English
          var stringBytes = encode.STRING(s);
          t.records.push(makeNameRecord(1, 0, 0, recordID, stringBytes.length, offset));
          t.strings.push(stringBytes);
          offset += stringBytes.length;
          return offset;
        }

        function addWindowsNameRecord(t, recordID, s, offset) {
          // Windows, Unicode BMP (UCS-2), US English
          var utf16Bytes = encode.UTF16(s);
          t.records.push(makeNameRecord(3, 1, 0x0409, recordID, utf16Bytes.length, offset));
          t.strings.push(utf16Bytes);
          offset += utf16Bytes.length;
          return offset;
        }

        function makeNameTable(options) {
          var t = new table.Table('name', [{
            name: 'format',
            type: 'USHORT',
            value: 0
          }, {
            name: 'count',
            type: 'USHORT',
            value: 0
          }, {
            name: 'stringOffset',
            type: 'USHORT',
            value: 0
          }]);
          t.records = [];
          t.strings = [];
          var offset = 0;
          var i;
          var s; // Add Macintosh records first

          for (i = 0; i < nameTableNames.length; i += 1) {
            if (options[nameTableNames[i]] !== undefined) {
              s = options[nameTableNames[i]];
              offset = addMacintoshNameRecord(t, i, s, offset);
            }
          } // Then add Windows records


          for (i = 0; i < nameTableNames.length; i += 1) {
            if (options[nameTableNames[i]] !== undefined) {
              s = options[nameTableNames[i]];
              offset = addWindowsNameRecord(t, i, s, offset);
            }
          }

          t.count = t.records.length;
          t.stringOffset = 6 + t.count * 12;

          for (i = 0; i < t.records.length; i += 1) {
            t.fields.push({
              name: 'record_' + i,
              type: 'TABLE',
              value: t.records[i]
            });
          }

          for (i = 0; i < t.strings.length; i += 1) {
            t.fields.push({
              name: 'string_' + i,
              type: 'LITERAL',
              value: t.strings[i]
            });
          }

          return t;
        }

        exports.parse = parseNameTable;
        exports.make = makeNameTable;
      }, {
        "../parse": 8,
        "../table": 10,
        "../types": 25
      }],
      22: [function (require, module, exports) {
        // The `OS/2` table contains metrics required in OpenType fonts.
        // https://www.microsoft.com/typography/OTSPEC/os2.htm
        'use strict';

        var parse = require('../parse');

        var table = require('../table');

        var unicodeRanges = [{
          begin: 0x0000,
          end: 0x007F
        }, // Basic Latin
        {
          begin: 0x0080,
          end: 0x00FF
        }, // Latin-1 Supplement
        {
          begin: 0x0100,
          end: 0x017F
        }, // Latin Extended-A
        {
          begin: 0x0180,
          end: 0x024F
        }, // Latin Extended-B
        {
          begin: 0x0250,
          end: 0x02AF
        }, // IPA Extensions
        {
          begin: 0x02B0,
          end: 0x02FF
        }, // Spacing Modifier Letters
        {
          begin: 0x0300,
          end: 0x036F
        }, // Combining Diacritical Marks
        {
          begin: 0x0370,
          end: 0x03FF
        }, // Greek and Coptic
        {
          begin: 0x2C80,
          end: 0x2CFF
        }, // Coptic
        {
          begin: 0x0400,
          end: 0x04FF
        }, // Cyrillic
        {
          begin: 0x0530,
          end: 0x058F
        }, // Armenian
        {
          begin: 0x0590,
          end: 0x05FF
        }, // Hebrew
        {
          begin: 0xA500,
          end: 0xA63F
        }, // Vai
        {
          begin: 0x0600,
          end: 0x06FF
        }, // Arabic
        {
          begin: 0x07C0,
          end: 0x07FF
        }, // NKo
        {
          begin: 0x0900,
          end: 0x097F
        }, // Devanagari
        {
          begin: 0x0980,
          end: 0x09FF
        }, // Bengali
        {
          begin: 0x0A00,
          end: 0x0A7F
        }, // Gurmukhi
        {
          begin: 0x0A80,
          end: 0x0AFF
        }, // Gujarati
        {
          begin: 0x0B00,
          end: 0x0B7F
        }, // Oriya
        {
          begin: 0x0B80,
          end: 0x0BFF
        }, // Tamil
        {
          begin: 0x0C00,
          end: 0x0C7F
        }, // Telugu
        {
          begin: 0x0C80,
          end: 0x0CFF
        }, // Kannada
        {
          begin: 0x0D00,
          end: 0x0D7F
        }, // Malayalam
        {
          begin: 0x0E00,
          end: 0x0E7F
        }, // Thai
        {
          begin: 0x0E80,
          end: 0x0EFF
        }, // Lao
        {
          begin: 0x10A0,
          end: 0x10FF
        }, // Georgian
        {
          begin: 0x1B00,
          end: 0x1B7F
        }, // Balinese
        {
          begin: 0x1100,
          end: 0x11FF
        }, // Hangul Jamo
        {
          begin: 0x1E00,
          end: 0x1EFF
        }, // Latin Extended Additional
        {
          begin: 0x1F00,
          end: 0x1FFF
        }, // Greek Extended
        {
          begin: 0x2000,
          end: 0x206F
        }, // General Punctuation
        {
          begin: 0x2070,
          end: 0x209F
        }, // Superscripts And Subscripts
        {
          begin: 0x20A0,
          end: 0x20CF
        }, // Currency Symbol
        {
          begin: 0x20D0,
          end: 0x20FF
        }, // Combining Diacritical Marks For Symbols
        {
          begin: 0x2100,
          end: 0x214F
        }, // Letterlike Symbols
        {
          begin: 0x2150,
          end: 0x218F
        }, // Number Forms
        {
          begin: 0x2190,
          end: 0x21FF
        }, // Arrows
        {
          begin: 0x2200,
          end: 0x22FF
        }, // Mathematical Operators
        {
          begin: 0x2300,
          end: 0x23FF
        }, // Miscellaneous Technical
        {
          begin: 0x2400,
          end: 0x243F
        }, // Control Pictures
        {
          begin: 0x2440,
          end: 0x245F
        }, // Optical Character Recognition
        {
          begin: 0x2460,
          end: 0x24FF
        }, // Enclosed Alphanumerics
        {
          begin: 0x2500,
          end: 0x257F
        }, // Box Drawing
        {
          begin: 0x2580,
          end: 0x259F
        }, // Block Elements
        {
          begin: 0x25A0,
          end: 0x25FF
        }, // Geometric Shapes
        {
          begin: 0x2600,
          end: 0x26FF
        }, // Miscellaneous Symbols
        {
          begin: 0x2700,
          end: 0x27BF
        }, // Dingbats
        {
          begin: 0x3000,
          end: 0x303F
        }, // CJK Symbols And Punctuation
        {
          begin: 0x3040,
          end: 0x309F
        }, // Hiragana
        {
          begin: 0x30A0,
          end: 0x30FF
        }, // Katakana
        {
          begin: 0x3100,
          end: 0x312F
        }, // Bopomofo
        {
          begin: 0x3130,
          end: 0x318F
        }, // Hangul Compatibility Jamo
        {
          begin: 0xA840,
          end: 0xA87F
        }, // Phags-pa
        {
          begin: 0x3200,
          end: 0x32FF
        }, // Enclosed CJK Letters And Months
        {
          begin: 0x3300,
          end: 0x33FF
        }, // CJK Compatibility
        {
          begin: 0xAC00,
          end: 0xD7AF
        }, // Hangul Syllables
        {
          begin: 0xD800,
          end: 0xDFFF
        }, // Non-Plane 0 *
        {
          begin: 0x10900,
          end: 0x1091F
        }, // Phoenicia
        {
          begin: 0x4E00,
          end: 0x9FFF
        }, // CJK Unified Ideographs
        {
          begin: 0xE000,
          end: 0xF8FF
        }, // Private Use Area (plane 0)
        {
          begin: 0x31C0,
          end: 0x31EF
        }, // CJK Strokes
        {
          begin: 0xFB00,
          end: 0xFB4F
        }, // Alphabetic Presentation Forms
        {
          begin: 0xFB50,
          end: 0xFDFF
        }, // Arabic Presentation Forms-A
        {
          begin: 0xFE20,
          end: 0xFE2F
        }, // Combining Half Marks
        {
          begin: 0xFE10,
          end: 0xFE1F
        }, // Vertical Forms
        {
          begin: 0xFE50,
          end: 0xFE6F
        }, // Small Form Variants
        {
          begin: 0xFE70,
          end: 0xFEFF
        }, // Arabic Presentation Forms-B
        {
          begin: 0xFF00,
          end: 0xFFEF
        }, // Halfwidth And Fullwidth Forms
        {
          begin: 0xFFF0,
          end: 0xFFFF
        }, // Specials
        {
          begin: 0x0F00,
          end: 0x0FFF
        }, // Tibetan
        {
          begin: 0x0700,
          end: 0x074F
        }, // Syriac
        {
          begin: 0x0780,
          end: 0x07BF
        }, // Thaana
        {
          begin: 0x0D80,
          end: 0x0DFF
        }, // Sinhala
        {
          begin: 0x1000,
          end: 0x109F
        }, // Myanmar
        {
          begin: 0x1200,
          end: 0x137F
        }, // Ethiopic
        {
          begin: 0x13A0,
          end: 0x13FF
        }, // Cherokee
        {
          begin: 0x1400,
          end: 0x167F
        }, // Unified Canadian Aboriginal Syllabics
        {
          begin: 0x1680,
          end: 0x169F
        }, // Ogham
        {
          begin: 0x16A0,
          end: 0x16FF
        }, // Runic
        {
          begin: 0x1780,
          end: 0x17FF
        }, // Khmer
        {
          begin: 0x1800,
          end: 0x18AF
        }, // Mongolian
        {
          begin: 0x2800,
          end: 0x28FF
        }, // Braille Patterns
        {
          begin: 0xA000,
          end: 0xA48F
        }, // Yi Syllables
        {
          begin: 0x1700,
          end: 0x171F
        }, // Tagalog
        {
          begin: 0x10300,
          end: 0x1032F
        }, // Old Italic
        {
          begin: 0x10330,
          end: 0x1034F
        }, // Gothic
        {
          begin: 0x10400,
          end: 0x1044F
        }, // Deseret
        {
          begin: 0x1D000,
          end: 0x1D0FF
        }, // Byzantine Musical Symbols
        {
          begin: 0x1D400,
          end: 0x1D7FF
        }, // Mathematical Alphanumeric Symbols
        {
          begin: 0xFF000,
          end: 0xFFFFD
        }, // Private Use (plane 15)
        {
          begin: 0xFE00,
          end: 0xFE0F
        }, // Variation Selectors
        {
          begin: 0xE0000,
          end: 0xE007F
        }, // Tags
        {
          begin: 0x1900,
          end: 0x194F
        }, // Limbu
        {
          begin: 0x1950,
          end: 0x197F
        }, // Tai Le
        {
          begin: 0x1980,
          end: 0x19DF
        }, // New Tai Lue
        {
          begin: 0x1A00,
          end: 0x1A1F
        }, // Buginese
        {
          begin: 0x2C00,
          end: 0x2C5F
        }, // Glagolitic
        {
          begin: 0x2D30,
          end: 0x2D7F
        }, // Tifinagh
        {
          begin: 0x4DC0,
          end: 0x4DFF
        }, // Yijing Hexagram Symbols
        {
          begin: 0xA800,
          end: 0xA82F
        }, // Syloti Nagri
        {
          begin: 0x10000,
          end: 0x1007F
        }, // Linear B Syllabary
        {
          begin: 0x10140,
          end: 0x1018F
        }, // Ancient Greek Numbers
        {
          begin: 0x10380,
          end: 0x1039F
        }, // Ugaritic
        {
          begin: 0x103A0,
          end: 0x103DF
        }, // Old Persian
        {
          begin: 0x10450,
          end: 0x1047F
        }, // Shavian
        {
          begin: 0x10480,
          end: 0x104AF
        }, // Osmanya
        {
          begin: 0x10800,
          end: 0x1083F
        }, // Cypriot Syllabary
        {
          begin: 0x10A00,
          end: 0x10A5F
        }, // Kharoshthi
        {
          begin: 0x1D300,
          end: 0x1D35F
        }, // Tai Xuan Jing Symbols
        {
          begin: 0x12000,
          end: 0x123FF
        }, // Cuneiform
        {
          begin: 0x1D360,
          end: 0x1D37F
        }, // Counting Rod Numerals
        {
          begin: 0x1B80,
          end: 0x1BBF
        }, // Sundanese
        {
          begin: 0x1C00,
          end: 0x1C4F
        }, // Lepcha
        {
          begin: 0x1C50,
          end: 0x1C7F
        }, // Ol Chiki
        {
          begin: 0xA880,
          end: 0xA8DF
        }, // Saurashtra
        {
          begin: 0xA900,
          end: 0xA92F
        }, // Kayah Li
        {
          begin: 0xA930,
          end: 0xA95F
        }, // Rejang
        {
          begin: 0xAA00,
          end: 0xAA5F
        }, // Cham
        {
          begin: 0x10190,
          end: 0x101CF
        }, // Ancient Symbols
        {
          begin: 0x101D0,
          end: 0x101FF
        }, // Phaistos Disc
        {
          begin: 0x102A0,
          end: 0x102DF
        }, // Carian
        {
          begin: 0x1F030,
          end: 0x1F09F
        } // Domino Tiles
        ];

        function getUnicodeRange(unicode) {
          for (var i = 0; i < unicodeRanges.length; i += 1) {
            var range = unicodeRanges[i];

            if (unicode >= range.begin && unicode < range.end) {
              return i;
            }
          }

          return -1;
        } // Parse the OS/2 and Windows metrics `OS/2` table


        function parseOS2Table(data, start) {
          var os2 = {};
          var p = new parse.Parser(data, start);
          os2.version = p.parseUShort();
          os2.xAvgCharWidth = p.parseShort();
          os2.usWeightClass = p.parseUShort();
          os2.usWidthClass = p.parseUShort();
          os2.fsType = p.parseUShort();
          os2.ySubscriptXSize = p.parseShort();
          os2.ySubscriptYSize = p.parseShort();
          os2.ySubscriptXOffset = p.parseShort();
          os2.ySubscriptYOffset = p.parseShort();
          os2.ySuperscriptXSize = p.parseShort();
          os2.ySuperscriptYSize = p.parseShort();
          os2.ySuperscriptXOffset = p.parseShort();
          os2.ySuperscriptYOffset = p.parseShort();
          os2.yStrikeoutSize = p.parseShort();
          os2.yStrikeoutPosition = p.parseShort();
          os2.sFamilyClass = p.parseShort();
          os2.panose = [];

          for (var i = 0; i < 10; i++) {
            os2.panose[i] = p.parseByte();
          }

          os2.ulUnicodeRange1 = p.parseULong();
          os2.ulUnicodeRange2 = p.parseULong();
          os2.ulUnicodeRange3 = p.parseULong();
          os2.ulUnicodeRange4 = p.parseULong();
          os2.achVendID = String.fromCharCode(p.parseByte(), p.parseByte(), p.parseByte(), p.parseByte());
          os2.fsSelection = p.parseUShort();
          os2.usFirstCharIndex = p.parseUShort();
          os2.usLastCharIndex = p.parseUShort();
          os2.sTypoAscender = p.parseShort();
          os2.sTypoDescender = p.parseShort();
          os2.sTypoLineGap = p.parseShort();
          os2.usWinAscent = p.parseUShort();
          os2.usWinDescent = p.parseUShort();

          if (os2.version >= 1) {
            os2.ulCodePageRange1 = p.parseULong();
            os2.ulCodePageRange2 = p.parseULong();
          }

          if (os2.version >= 2) {
            os2.sxHeight = p.parseShort();
            os2.sCapHeight = p.parseShort();
            os2.usDefaultChar = p.parseUShort();
            os2.usBreakChar = p.parseUShort();
            os2.usMaxContent = p.parseUShort();
          }

          return os2;
        }

        function makeOS2Table(options) {
          return new table.Table('OS/2', [{
            name: 'version',
            type: 'USHORT',
            value: 0x0003
          }, {
            name: 'xAvgCharWidth',
            type: 'SHORT',
            value: 0
          }, {
            name: 'usWeightClass',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usWidthClass',
            type: 'USHORT',
            value: 0
          }, {
            name: 'fsType',
            type: 'USHORT',
            value: 0
          }, {
            name: 'ySubscriptXSize',
            type: 'SHORT',
            value: 650
          }, {
            name: 'ySubscriptYSize',
            type: 'SHORT',
            value: 699
          }, {
            name: 'ySubscriptXOffset',
            type: 'SHORT',
            value: 0
          }, {
            name: 'ySubscriptYOffset',
            type: 'SHORT',
            value: 140
          }, {
            name: 'ySuperscriptXSize',
            type: 'SHORT',
            value: 650
          }, {
            name: 'ySuperscriptYSize',
            type: 'SHORT',
            value: 699
          }, {
            name: 'ySuperscriptXOffset',
            type: 'SHORT',
            value: 0
          }, {
            name: 'ySuperscriptYOffset',
            type: 'SHORT',
            value: 479
          }, {
            name: 'yStrikeoutSize',
            type: 'SHORT',
            value: 49
          }, {
            name: 'yStrikeoutPosition',
            type: 'SHORT',
            value: 258
          }, {
            name: 'sFamilyClass',
            type: 'SHORT',
            value: 0
          }, {
            name: 'bFamilyType',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bSerifStyle',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bWeight',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bProportion',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bContrast',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bStrokeVariation',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bArmStyle',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bLetterform',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bMidline',
            type: 'BYTE',
            value: 0
          }, {
            name: 'bXHeight',
            type: 'BYTE',
            value: 0
          }, {
            name: 'ulUnicodeRange1',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulUnicodeRange2',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulUnicodeRange3',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulUnicodeRange4',
            type: 'ULONG',
            value: 0
          }, {
            name: 'achVendID',
            type: 'CHARARRAY',
            value: 'XXXX'
          }, {
            name: 'fsSelection',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usFirstCharIndex',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usLastCharIndex',
            type: 'USHORT',
            value: 0
          }, {
            name: 'sTypoAscender',
            type: 'SHORT',
            value: 0
          }, {
            name: 'sTypoDescender',
            type: 'SHORT',
            value: 0
          }, {
            name: 'sTypoLineGap',
            type: 'SHORT',
            value: 0
          }, {
            name: 'usWinAscent',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usWinDescent',
            type: 'USHORT',
            value: 0
          }, {
            name: 'ulCodePageRange1',
            type: 'ULONG',
            value: 0
          }, {
            name: 'ulCodePageRange2',
            type: 'ULONG',
            value: 0
          }, {
            name: 'sxHeight',
            type: 'SHORT',
            value: 0
          }, {
            name: 'sCapHeight',
            type: 'SHORT',
            value: 0
          }, {
            name: 'usDefaultChar',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usBreakChar',
            type: 'USHORT',
            value: 0
          }, {
            name: 'usMaxContext',
            type: 'USHORT',
            value: 0
          }], options);
        }

        exports.unicodeRanges = unicodeRanges;
        exports.getUnicodeRange = getUnicodeRange;
        exports.parse = parseOS2Table;
        exports.make = makeOS2Table;
      }, {
        "../parse": 8,
        "../table": 10
      }],
      23: [function (require, module, exports) {
        // The `post` table stores additional PostScript information, such as glyph names.
        // https://www.microsoft.com/typography/OTSPEC/post.htm
        'use strict';

        var encoding = require('../encoding');

        var parse = require('../parse');

        var table = require('../table'); // Parse the PostScript `post` table


        function parsePostTable(data, start) {
          var post = {};
          var p = new parse.Parser(data, start);
          var i;
          post.version = p.parseVersion();
          post.italicAngle = p.parseFixed();
          post.underlinePosition = p.parseShort();
          post.underlineThickness = p.parseShort();
          post.isFixedPitch = p.parseULong();
          post.minMemType42 = p.parseULong();
          post.maxMemType42 = p.parseULong();
          post.minMemType1 = p.parseULong();
          post.maxMemType1 = p.parseULong();

          switch (post.version) {
            case 1:
              post.names = encoding.standardNames.slice();
              break;

            case 2:
              post.numberOfGlyphs = p.parseUShort();
              post.glyphNameIndex = new Array(post.numberOfGlyphs);

              for (i = 0; i < post.numberOfGlyphs; i++) {
                post.glyphNameIndex[i] = p.parseUShort();
              }

              post.names = [];

              for (i = 0; i < post.numberOfGlyphs; i++) {
                if (post.glyphNameIndex[i] >= encoding.standardNames.length) {
                  var nameLength = p.parseChar();
                  post.names.push(p.parseString(nameLength));
                }
              }

              break;

            case 2.5:
              post.numberOfGlyphs = p.parseUShort();
              post.offset = new Array(post.numberOfGlyphs);

              for (i = 0; i < post.numberOfGlyphs; i++) {
                post.offset[i] = p.parseChar();
              }

              break;
          }

          return post;
        }

        function makePostTable() {
          return new table.Table('post', [{
            name: 'version',
            type: 'FIXED',
            value: 0x00030000
          }, {
            name: 'italicAngle',
            type: 'FIXED',
            value: 0
          }, {
            name: 'underlinePosition',
            type: 'FWORD',
            value: 0
          }, {
            name: 'underlineThickness',
            type: 'FWORD',
            value: 0
          }, {
            name: 'isFixedPitch',
            type: 'ULONG',
            value: 0
          }, {
            name: 'minMemType42',
            type: 'ULONG',
            value: 0
          }, {
            name: 'maxMemType42',
            type: 'ULONG',
            value: 0
          }, {
            name: 'minMemType1',
            type: 'ULONG',
            value: 0
          }, {
            name: 'maxMemType1',
            type: 'ULONG',
            value: 0
          }]);
        }

        exports.parse = parsePostTable;
        exports.make = makePostTable;
      }, {
        "../encoding": 3,
        "../parse": 8,
        "../table": 10
      }],
      24: [function (require, module, exports) {
        // The `sfnt` wrapper provides organization for the tables in the font.
        // It is the top-level data structure in a font.
        // https://www.microsoft.com/typography/OTSPEC/otff.htm
        // Recommendations for creating OpenType Fonts:
        // http://www.microsoft.com/typography/otspec140/recom.htm
        'use strict';

        var check = require('../check');

        var table = require('../table');

        var cmap = require('./cmap');

        var cff = require('./cff');

        var head = require('./head');

        var hhea = require('./hhea');

        var hmtx = require('./hmtx');

        var maxp = require('./maxp');

        var _name = require('./name');

        var os2 = require('./os2');

        var post = require('./post');

        function log2(v) {
          return Math.log(v) / Math.log(2) | 0;
        }

        function computeCheckSum(bytes) {
          while (bytes.length % 4 !== 0) {
            bytes.push(0);
          }

          var sum = 0;

          for (var i = 0; i < bytes.length; i += 4) {
            sum += (bytes[i] << 24) + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + bytes[i + 3];
          }

          sum %= Math.pow(2, 32);
          return sum;
        }

        function makeTableRecord(tag, checkSum, offset, length) {
          return new table.Table('Table Record', [{
            name: 'tag',
            type: 'TAG',
            value: tag !== undefined ? tag : ''
          }, {
            name: 'checkSum',
            type: 'ULONG',
            value: checkSum !== undefined ? checkSum : 0
          }, {
            name: 'offset',
            type: 'ULONG',
            value: offset !== undefined ? offset : 0
          }, {
            name: 'length',
            type: 'ULONG',
            value: length !== undefined ? length : 0
          }]);
        }

        function makeSfntTable(tables) {
          var sfnt = new table.Table('sfnt', [{
            name: 'version',
            type: 'TAG',
            value: 'OTTO'
          }, {
            name: 'numTables',
            type: 'USHORT',
            value: 0
          }, {
            name: 'searchRange',
            type: 'USHORT',
            value: 0
          }, {
            name: 'entrySelector',
            type: 'USHORT',
            value: 0
          }, {
            name: 'rangeShift',
            type: 'USHORT',
            value: 0
          }]);
          sfnt.tables = tables;
          sfnt.numTables = tables.length;
          var highestPowerOf2 = Math.pow(2, log2(sfnt.numTables));
          sfnt.searchRange = 16 * highestPowerOf2;
          sfnt.entrySelector = log2(highestPowerOf2);
          sfnt.rangeShift = sfnt.numTables * 16 - sfnt.searchRange;
          var recordFields = [];
          var tableFields = [];
          var offset = sfnt.sizeOf() + makeTableRecord().sizeOf() * sfnt.numTables;

          while (offset % 4 !== 0) {
            offset += 1;
            tableFields.push({
              name: 'padding',
              type: 'BYTE',
              value: 0
            });
          }

          for (var i = 0; i < tables.length; i += 1) {
            var t = tables[i];
            check.argument(t.tableName.length === 4, 'Table name' + t.tableName + ' is invalid.');
            var tableLength = t.sizeOf();
            var tableRecord = makeTableRecord(t.tableName, computeCheckSum(t.encode()), offset, tableLength);
            recordFields.push({
              name: tableRecord.tag + ' Table Record',
              type: 'TABLE',
              value: tableRecord
            });
            tableFields.push({
              name: t.tableName + ' table',
              type: 'TABLE',
              value: t
            });
            offset += tableLength;
            check.argument(!isNaN(offset), 'Something went wrong calculating the offset.');

            while (offset % 4 !== 0) {
              offset += 1;
              tableFields.push({
                name: 'padding',
                type: 'BYTE',
                value: 0
              });
            }
          } // Table records need to be sorted alphabetically.


          recordFields.sort(function (r1, r2) {
            if (r1.value.tag > r2.value.tag) {
              return 1;
            } else {
              return -1;
            }
          });
          sfnt.fields = sfnt.fields.concat(recordFields);
          sfnt.fields = sfnt.fields.concat(tableFields);
          return sfnt;
        } // Get the metrics for a character. If the string has more than one character
        // this function returns metrics for the first available character.
        // You can provide optional fallback metrics if no characters are available.


        function metricsForChar(font, chars, notFoundMetrics) {
          for (var i = 0; i < chars.length; i += 1) {
            var glyphIndex = font.charToGlyphIndex(chars[i]);

            if (glyphIndex > 0) {
              var glyph = font.glyphs.get(glyphIndex);
              return glyph.getMetrics();
            }
          }

          return notFoundMetrics;
        }

        function average(vs) {
          var sum = 0;

          for (var i = 0; i < vs.length; i += 1) {
            sum += vs[i];
          }

          return sum / vs.length;
        } // Convert the font object to a SFNT data structure.
        // This structure contains all the necessary tables and metadata to create a binary OTF file.


        function fontToSfntTable(font) {
          var xMins = [];
          var yMins = [];
          var xMaxs = [];
          var yMaxs = [];
          var advanceWidths = [];
          var leftSideBearings = [];
          var rightSideBearings = [];
          var firstCharIndex;
          var lastCharIndex = 0;
          var ulUnicodeRange1 = 0;
          var ulUnicodeRange2 = 0;
          var ulUnicodeRange3 = 0;
          var ulUnicodeRange4 = 0;

          for (var i = 0; i < font.glyphs.length; i += 1) {
            var glyph = font.glyphs.get(i);
            var unicode = glyph.unicode | 0;

            if (firstCharIndex > unicode || firstCharIndex === null) {
              firstCharIndex = unicode;
            }

            if (lastCharIndex < unicode) {
              lastCharIndex = unicode;
            }

            var position = os2.getUnicodeRange(unicode);

            if (position < 32) {
              ulUnicodeRange1 |= 1 << position;
            } else if (position < 64) {
              ulUnicodeRange2 |= 1 << position - 32;
            } else if (position < 96) {
              ulUnicodeRange3 |= 1 << position - 64;
            } else if (position < 123) {
              ulUnicodeRange4 |= 1 << position - 96;
            } else {
              throw new Error('Unicode ranges bits > 123 are reserved for internal usage');
            } // Skip non-important characters.


            if (glyph.name === '.notdef') continue;
            var metrics = glyph.getMetrics();
            xMins.push(metrics.xMin);
            yMins.push(metrics.yMin);
            xMaxs.push(metrics.xMax);
            yMaxs.push(metrics.yMax);
            leftSideBearings.push(metrics.leftSideBearing);
            rightSideBearings.push(metrics.rightSideBearing);
            advanceWidths.push(glyph.advanceWidth);
          }

          var globals = {
            xMin: Math.min.apply(null, xMins),
            yMin: Math.min.apply(null, yMins),
            xMax: Math.max.apply(null, xMaxs),
            yMax: Math.max.apply(null, yMaxs),
            advanceWidthMax: Math.max.apply(null, advanceWidths),
            advanceWidthAvg: average(advanceWidths),
            minLeftSideBearing: Math.min.apply(null, leftSideBearings),
            maxLeftSideBearing: Math.max.apply(null, leftSideBearings),
            minRightSideBearing: Math.min.apply(null, rightSideBearings)
          };
          globals.ascender = font.ascender !== undefined ? font.ascender : globals.yMax;
          globals.descender = font.descender !== undefined ? font.descender : globals.yMin;
          var headTable = head.make({
            unitsPerEm: font.unitsPerEm,
            xMin: globals.xMin,
            yMin: globals.yMin,
            xMax: globals.xMax,
            yMax: globals.yMax
          });
          var hheaTable = hhea.make({
            ascender: globals.ascender,
            descender: globals.descender,
            advanceWidthMax: globals.advanceWidthMax,
            minLeftSideBearing: globals.minLeftSideBearing,
            minRightSideBearing: globals.minRightSideBearing,
            xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
            numberOfHMetrics: font.glyphs.length
          });
          var maxpTable = maxp.make(font.glyphs.length);
          var os2Table = os2.make({
            xAvgCharWidth: Math.round(globals.advanceWidthAvg),
            usWeightClass: 500,
            // Medium FIXME Make this configurable
            usWidthClass: 5,
            // Medium (normal) FIXME Make this configurable
            usFirstCharIndex: firstCharIndex,
            usLastCharIndex: lastCharIndex,
            ulUnicodeRange1: ulUnicodeRange1,
            ulUnicodeRange2: ulUnicodeRange2,
            ulUnicodeRange3: ulUnicodeRange3,
            ulUnicodeRange4: ulUnicodeRange4,
            // See http://typophile.com/node/13081 for more info on vertical metrics.
            // We get metrics for typical characters (such as "x" for xHeight).
            // We provide some fallback characters if characters are unavailable: their
            // ordering was chosen experimentally.
            sTypoAscender: globals.ascender,
            sTypoDescender: globals.descender,
            sTypoLineGap: 0,
            usWinAscent: globals.ascender,
            usWinDescent: -globals.descender,
            sxHeight: metricsForChar(font, 'xyvw', {
              yMax: 0
            }).yMax,
            sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
            usBreakChar: font.hasChar(' ') ? 32 : 0 // Use space as the break character, if available.

          });
          var hmtxTable = hmtx.make(font.glyphs);
          var cmapTable = cmap.make(font.glyphs);
          var fullName = font.familyName + ' ' + font.styleName;
          var postScriptName = font.familyName.replace(/\s/g, '') + '-' + font.styleName;

          var nameTable = _name.make({
            copyright: font.copyright,
            fontFamily: font.familyName,
            fontSubfamily: font.styleName,
            uniqueID: font.manufacturer + ':' + fullName,
            fullName: fullName,
            version: font.version,
            postScriptName: postScriptName,
            trademark: font.trademark,
            manufacturer: font.manufacturer,
            designer: font.designer,
            description: font.description,
            manufacturerURL: font.manufacturerURL,
            designerURL: font.designerURL,
            license: font.license,
            licenseURL: font.licenseURL,
            preferredFamily: font.familyName,
            preferredSubfamily: font.styleName
          });

          var postTable = post.make();
          var cffTable = cff.make(font.glyphs, {
            version: font.version,
            fullName: fullName,
            familyName: font.familyName,
            weightName: font.styleName,
            postScriptName: postScriptName,
            unitsPerEm: font.unitsPerEm
          }); // Order the tables according to the the OpenType specification 1.4.

          var tables = [headTable, hheaTable, maxpTable, os2Table, nameTable, cmapTable, postTable, cffTable, hmtxTable];
          var sfntTable = makeSfntTable(tables); // Compute the font's checkSum and store it in head.checkSumAdjustment.

          var bytes = sfntTable.encode();
          var checkSum = computeCheckSum(bytes);
          var tableFields = sfntTable.fields;
          var checkSumAdjusted = false;

          for (i = 0; i < tableFields.length; i += 1) {
            if (tableFields[i].name === 'head table') {
              tableFields[i].value.checkSumAdjustment = 0xB1B0AFBA - checkSum;
              checkSumAdjusted = true;
              break;
            }
          }

          if (!checkSumAdjusted) {
            throw new Error('Could not find head table with checkSum to adjust.');
          }

          return sfntTable;
        }

        exports.computeCheckSum = computeCheckSum;
        exports.make = makeSfntTable;
        exports.fontToTable = fontToSfntTable;
      }, {
        "../check": 1,
        "../table": 10,
        "./cff": 11,
        "./cmap": 12,
        "./head": 15,
        "./hhea": 16,
        "./hmtx": 17,
        "./maxp": 20,
        "./name": 21,
        "./os2": 22,
        "./post": 23
      }],
      25: [function (require, module, exports) {
        // Data types used in the OpenType font file.
        // All OpenType fonts use Motorola-style byte ordering (Big Endian)

        /* global WeakMap */
        'use strict';

        var check = require('./check');

        var LIMIT16 = 32768; // The limit at which a 16-bit number switches signs == 2^15

        var LIMIT32 = 2147483648; // The limit at which a 32-bit number switches signs == 2 ^ 31

        var decode = {};
        var encode = {};
        var sizeOf = {}; // Return a function that always returns the same value.

        function constant(v) {
          return function () {
            return v;
          };
        } // OpenType data types //////////////////////////////////////////////////////
        // Convert an 8-bit unsigned integer to a list of 1 byte.


        encode.BYTE = function (v) {
          check.argument(v >= 0 && v <= 255, 'Byte value should be between 0 and 255.');
          return [v];
        };

        sizeOf.BYTE = constant(1); // Convert a 8-bit signed integer to a list of 1 byte.

        encode.CHAR = function (v) {
          return [v.charCodeAt(0)];
        };

        sizeOf.CHAR = constant(1); // Convert an ASCII string to a list of bytes.

        encode.CHARARRAY = function (v) {
          var b = [];

          for (var i = 0; i < v.length; i += 1) {
            b.push(v.charCodeAt(i));
          }

          return b;
        };

        sizeOf.CHARARRAY = function (v) {
          return v.length;
        }; // Convert a 16-bit unsigned integer to a list of 2 bytes.


        encode.USHORT = function (v) {
          return [v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.USHORT = constant(2); // Convert a 16-bit signed integer to a list of 2 bytes.

        encode.SHORT = function (v) {
          // Two's complement
          if (v >= LIMIT16) {
            v = -(2 * LIMIT16 - v);
          }

          return [v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.SHORT = constant(2); // Convert a 24-bit unsigned integer to a list of 3 bytes.

        encode.UINT24 = function (v) {
          return [v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.UINT24 = constant(3); // Convert a 32-bit unsigned integer to a list of 4 bytes.

        encode.ULONG = function (v) {
          return [v >> 24 & 0xFF, v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.ULONG = constant(4); // Convert a 32-bit unsigned integer to a list of 4 bytes.

        encode.LONG = function (v) {
          // Two's complement
          if (v >= LIMIT32) {
            v = -(2 * LIMIT32 - v);
          }

          return [v >> 24 & 0xFF, v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.LONG = constant(4);
        encode.FIXED = encode.ULONG;
        sizeOf.FIXED = sizeOf.ULONG;
        encode.FWORD = encode.SHORT;
        sizeOf.FWORD = sizeOf.SHORT;
        encode.UFWORD = encode.USHORT;
        sizeOf.UFWORD = sizeOf.USHORT; // FIXME Implement LONGDATETIME

        encode.LONGDATETIME = function () {
          return [0, 0, 0, 0, 0, 0, 0, 0];
        };

        sizeOf.LONGDATETIME = constant(8); // Convert a 4-char tag to a list of 4 bytes.

        encode.TAG = function (v) {
          check.argument(v.length === 4, 'Tag should be exactly 4 ASCII characters.');
          return [v.charCodeAt(0), v.charCodeAt(1), v.charCodeAt(2), v.charCodeAt(3)];
        };

        sizeOf.TAG = constant(4); // CFF data types ///////////////////////////////////////////////////////////

        encode.Card8 = encode.BYTE;
        sizeOf.Card8 = sizeOf.BYTE;
        encode.Card16 = encode.USHORT;
        sizeOf.Card16 = sizeOf.USHORT;
        encode.OffSize = encode.BYTE;
        sizeOf.OffSize = sizeOf.BYTE;
        encode.SID = encode.USHORT;
        sizeOf.SID = sizeOf.USHORT; // Convert a numeric operand or charstring number to a variable-size list of bytes.

        encode.NUMBER = function (v) {
          if (v >= -107 && v <= 107) {
            return [v + 139];
          } else if (v >= 108 && v <= 1131) {
            v = v - 108;
            return [(v >> 8) + 247, v & 0xFF];
          } else if (v >= -1131 && v <= -108) {
            v = -v - 108;
            return [(v >> 8) + 251, v & 0xFF];
          } else if (v >= -32768 && v <= 32767) {
            return encode.NUMBER16(v);
          } else {
            return encode.NUMBER32(v);
          }
        };

        sizeOf.NUMBER = function (v) {
          return encode.NUMBER(v).length;
        }; // Convert a signed number between -32768 and +32767 to a three-byte value.
        // This ensures we always use three bytes, but is not the most compact format.


        encode.NUMBER16 = function (v) {
          return [28, v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.NUMBER16 = constant(3); // Convert a signed number between -(2^31) and +(2^31-1) to a five-byte value.
        // This is useful if you want to be sure you always use four bytes,
        // at the expense of wasting a few bytes for smaller numbers.

        encode.NUMBER32 = function (v) {
          return [29, v >> 24 & 0xFF, v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF];
        };

        sizeOf.NUMBER32 = constant(5);

        encode.REAL = function (v) {
          var value = v.toString(); // Some numbers use an epsilon to encode the value. (e.g. JavaScript will store 0.0000001 as 1e-7)
          // This code converts it back to a number without the epsilon.

          var m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);

          if (m) {
            var epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length));
            value = (Math.round(v * epsilon) / epsilon).toString();
          }

          var nibbles = '';
          var i;
          var ii;

          for (i = 0, ii = value.length; i < ii; i += 1) {
            var c = value[i];

            if (c === 'e') {
              nibbles += value[++i] === '-' ? 'c' : 'b';
            } else if (c === '.') {
              nibbles += 'a';
            } else if (c === '-') {
              nibbles += 'e';
            } else {
              nibbles += c;
            }
          }

          nibbles += nibbles.length & 1 ? 'f' : 'ff';
          var out = [30];

          for (i = 0, ii = nibbles.length; i < ii; i += 2) {
            out.push(parseInt(nibbles.substr(i, 2), 16));
          }

          return out;
        };

        sizeOf.REAL = function (v) {
          return encode.REAL(v).length;
        };

        encode.NAME = encode.CHARARRAY;
        sizeOf.NAME = sizeOf.CHARARRAY;
        encode.STRING = encode.CHARARRAY;
        sizeOf.STRING = sizeOf.CHARARRAY; // Convert a JavaScript string to UTF16-BE.

        encode.UTF16 = function (v) {
          var b = [];

          for (var i = 0; i < v.length; i += 1) {
            var codepoint = v.charCodeAt(i);
            b.push(codepoint >> 8 & 0xFF);
            b.push(codepoint & 0xFF);
          }

          return b;
        };

        sizeOf.UTF16 = function (v) {
          return v.length * 2;
        }; // Convert a list of values to a CFF INDEX structure.
        // The values should be objects containing name / type / value.


        encode.INDEX = function (l) {
          var i; //var offset, offsets, offsetEncoder, encodedOffsets, encodedOffset, data,
          //    dataSize, i, v;
          // Because we have to know which data type to use to encode the offsets,
          // we have to go through the values twice: once to encode the data and
          // calculate the offets, then again to encode the offsets using the fitting data type.

          var offset = 1; // First offset is always 1.

          var offsets = [offset];
          var data = [];
          var dataSize = 0;

          for (i = 0; i < l.length; i += 1) {
            var v = encode.OBJECT(l[i]);
            Array.prototype.push.apply(data, v);
            dataSize += v.length;
            offset += v.length;
            offsets.push(offset);
          }

          if (data.length === 0) {
            return [0, 0];
          }

          var encodedOffsets = [];
          var offSize = 1 + Math.floor(Math.log(dataSize) / Math.log(2)) / 8 | 0;
          var offsetEncoder = [undefined, encode.BYTE, encode.USHORT, encode.UINT24, encode.ULONG][offSize];

          for (i = 0; i < offsets.length; i += 1) {
            var encodedOffset = offsetEncoder(offsets[i]);
            Array.prototype.push.apply(encodedOffsets, encodedOffset);
          }

          return Array.prototype.concat(encode.Card16(l.length), encode.OffSize(offSize), encodedOffsets, data);
        };

        sizeOf.INDEX = function (v) {
          return encode.INDEX(v).length;
        }; // Convert an object to a CFF DICT structure.
        // The keys should be numeric.
        // The values should be objects containing name / type / value.


        encode.DICT = function (m) {
          var d = [];
          var keys = Object.keys(m);
          var length = keys.length;

          for (var i = 0; i < length; i += 1) {
            // Object.keys() return string keys, but our keys are always numeric.
            var k = parseInt(keys[i], 0);
            var v = m[k]; // Value comes before the key.

            d = d.concat(encode.OPERAND(v.value, v.type));
            d = d.concat(encode.OPERATOR(k));
          }

          return d;
        };

        sizeOf.DICT = function (m) {
          return encode.DICT(m).length;
        };

        encode.OPERATOR = function (v) {
          if (v < 1200) {
            return [v];
          } else {
            return [12, v - 1200];
          }
        };

        encode.OPERAND = function (v, type) {
          var d = [];

          if (Array.isArray(type)) {
            for (var i = 0; i < type.length; i += 1) {
              check.argument(v.length === type.length, 'Not enough arguments given for type' + type);
              d = d.concat(encode.OPERAND(v[i], type[i]));
            }
          } else {
            if (type === 'SID') {
              d = d.concat(encode.NUMBER(v));
            } else if (type === 'offset') {
              // We make it easy for ourselves and always encode offsets as
              // 4 bytes. This makes offset calculation for the top dict easier.
              d = d.concat(encode.NUMBER32(v));
            } else if (type === 'number') {
              d = d.concat(encode.NUMBER(v));
            } else if (type === 'real') {
              d = d.concat(encode.REAL(v));
            } else {
              throw new Error('Unknown operand type ' + type); // FIXME Add support for booleans
            }
          }

          return d;
        };

        encode.OP = encode.BYTE;
        sizeOf.OP = sizeOf.BYTE; // memoize charstring encoding using WeakMap if available

        var wmm = typeof WeakMap === 'function' && new WeakMap(); // Convert a list of CharString operations to bytes.

        encode.CHARSTRING = function (ops) {
          if (wmm && wmm.has(ops)) {
            return wmm.get(ops);
          }

          var d = [];
          var length = ops.length;

          for (var i = 0; i < length; i += 1) {
            var op = ops[i];
            d = d.concat(encode[op.type](op.value));
          }

          if (wmm) {
            wmm.set(ops, d);
          }

          return d;
        };

        sizeOf.CHARSTRING = function (ops) {
          return encode.CHARSTRING(ops).length;
        }; // Utility functions ////////////////////////////////////////////////////////
        // Convert an object containing name / type / value to bytes.


        encode.OBJECT = function (v) {
          var encodingFunction = encode[v.type];
          check.argument(encodingFunction !== undefined, 'No encoding function for type ' + v.type);
          return encodingFunction(v.value);
        };

        sizeOf.OBJECT = function (v) {
          var sizeOfFunction = sizeOf[v.type];
          check.argument(sizeOfFunction !== undefined, 'No sizeOf function for type ' + v.type);
          return sizeOfFunction(v.value);
        }; // Convert a table object to bytes.
        // A table contains a list of fields containing the metadata (name, type and default value).
        // The table itself has the field values set as attributes.


        encode.TABLE = function (table) {
          var d = [];
          var length = table.fields.length;

          for (var i = 0; i < length; i += 1) {
            var field = table.fields[i];
            var encodingFunction = encode[field.type];
            check.argument(encodingFunction !== undefined, 'No encoding function for field type ' + field.type);
            var value = table[field.name];

            if (value === undefined) {
              value = field.value;
            }

            var bytes = encodingFunction(value);
            d = d.concat(bytes);
          }

          return d;
        };

        sizeOf.TABLE = function (table) {
          var numBytes = 0;
          var length = table.fields.length;

          for (var i = 0; i < length; i += 1) {
            var field = table.fields[i];
            var sizeOfFunction = sizeOf[field.type];
            check.argument(sizeOfFunction !== undefined, 'No sizeOf function for field type ' + field.type);
            var value = table[field.name];

            if (value === undefined) {
              value = field.value;
            }

            numBytes += sizeOfFunction(value);
          }

          return numBytes;
        }; // Merge in a list of bytes.


        encode.LITERAL = function (v) {
          return v;
        };

        sizeOf.LITERAL = function (v) {
          return v.length;
        };

        exports.decode = decode;
        exports.encode = encode;
        exports.sizeOf = sizeOf;
      }, {
        "./check": 1
      }]
    }, {}, [7])(7);
  });
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"editor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/editor.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let AbstractStage;
module.link("/client/lib/abstract", {
  AbstractStage(v) {
    AbstractStage = v;
  }

}, 0);
let AnalysisStage;
module.link("/client/lib/analysis", {
  AnalysisStage(v) {
    AnalysisStage = v;
  }

}, 1);
let BridgesStage;
module.link("/client/lib/bridges", {
  BridgesStage(v) {
    BridgesStage = v;
  }

}, 2);
let OrderStage;
module.link("/client/lib/order", {
  OrderStage(v) {
    OrderStage = v;
  }

}, 3);
let PathStage;
module.link("/client/lib/path", {
  PathStage(v) {
    PathStage = v;
  }

}, 4);
let StrokesStage;
module.link("/client/lib/strokes", {
  StrokesStage(v) {
    StrokesStage = v;
  }

}, 5);
let VerifiedStage;
module.link("/client/lib/verified", {
  VerifiedStage(v) {
    VerifiedStage = v;
  }

}, 6);
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 7);
let cjklib;
module.link("/lib/cjklib", {
  cjklib(v) {
    cjklib = v;
  }

}, 8);
Session.set('editor.glyph', undefined);
const stages = {
  analysis: AnalysisStage,
  bridges: BridgesStage,
  order: OrderStage,
  path: PathStage,
  strokes: StrokesStage,
  verified: VerifiedStage
};
const types = ['path', 'bridges', 'strokes', 'analysis', 'order', 'verified'];
let last_glyph = undefined;
let last_json = undefined;
let stage = new AbstractStage();

const changeGlyph = (method, argument) => {
  argument = argument || Session.get('editor.glyph');
  Meteor.call(method, argument, function (error, data) {
    assert(!error, error);
    Session.set('editor.glyph', data);
    window.location.hash = encodeURIComponent(data.character);
  });
};

const clearStageSessionKeys = type => {
  Object.keys(Session.keys).filter(x => x.startsWith("stages.".concat(type, "."))).map(x => Session.set(x, undefined));
};

const constructStage = type => {
  const glyph = Session.get('editor.glyph');
  const current = glyph.stages[type];

  if (!current || current.sentinel) {
    glyph.stages[type] = null;
  }

  clearStageSessionKeys(stage.type);
  stage = new stages[type](glyph);
  assert(stage.type === type);
  stage.forceRefresh = forceRefresh;
  stage.forceRefresh(true
  /* from_construct_stage */
  );
};

const forceRefresh = from_construct_stage => {
  const glyph = Session.get('editor.glyph');
  stage.refreshUI(glyph.character, glyph.metadata);
  let output = stage.getStageOutput();
  const current = glyph.stages[stage.type];

  if (from_construct_stage && (!current || current.sentinel)) {
    output = {
      sentinel: true
    };
  }

  if (!_.isEqual(output, current)) {
    glyph.stages[stage.type] = output;

    if (!output || !current || stage.clearLaterStages(output, current)) {
      for (let i = types.indexOf(stage.type) + 1; i < types.length; i++) {
        glyph.stages[types[i]] = null;
      }
    }

    Session.set('editor.glyph', glyph);
  }
};

const incrementStage = amount => {
  const index = types.indexOf(stage.type);
  if (index < 0) return;
  const new_index = index + amount;
  if (new_index < 0 || new_index >= types.length) return;

  if (amount > 0) {
    try {
      stage.validate();
    } catch (e) {
      // HACK(skishore): The analysis stage may be failing because some
      // dependency of the current glyph is incomplete. Switch to it. This code
      // is a terrible hack because it makes use of the string used to render
      // the incomplete-component message.
      const log = Session.get('stage.status');
      const prefix = 'Incomplete components: ';

      if (log.length > 0 && log[0].message.startsWith(prefix)) {
        changeGlyph('getGlyph', log[0].message[prefix.length]);
      }

      return;
    }

    stage.forceRefresh();
  }

  constructStage(types[new_index]);
};

const loadCharacter = () => {
  const character = decodeURIComponent(window.location.hash.slice(1));
  const glyph = Session.get('editor.glyph');

  if (!character) {
    changeGlyph('getNextGlyph');
  } else if (!glyph || glyph.character !== character) {
    changeGlyph('getGlyph', character);
  }
};

const resetStage = () => {
  const glyph = Session.get('editor.glyph');
  glyph.stages[stage.type] = null;
  Session.set('editor.glyph', glyph);
  constructStage(stage.type);
};

const bindings = {
  a: () => changeGlyph('getPreviousGlyph'),
  A: () => changeGlyph('getPreviousUnverifiedGlyph'),
  q: () => changeGlyph('getPreviousVerifiedGlyph'),
  d: () => changeGlyph('getNextGlyph'),
  D: () => changeGlyph('getNextUnverifiedGlyph'),
  e: () => changeGlyph('getNextVerifiedGlyph'),
  r: resetStage,
  s: () => incrementStage(1),
  w: () => incrementStage(-1)
}; // We avoid arrow functions in this map so that this is bound to the template.

Template.editor.events({
  'click svg .selectable': function (event) {
    stage.handleEvent(event, this);
    stage.forceRefresh();
  }
});
Template.editor.helpers({
  paths: () => Session.get('stage.paths'),
  lines: () => Session.get('stage.lines'),
  points: () => Session.get('stage.points'),
  animations: () => Session.get('stage.animations')
});
Template.status.helpers({
  stage: () => Session.get('stage.type'),
  template: () => "".concat(Session.get('stage.type'), "_stage"),
  lines: () => Session.get('stage.status')
});
Tracker.autorun(() => {
  const glyph = Session.get('editor.glyph');
  const json = JSON.stringify(glyph);

  if (!glyph || json === last_json) {
    return;
  } else if (!last_glyph || glyph.character !== last_glyph.character) {
    let last_completed_stage = types[0];
    types.map(x => {
      if (glyph.stages[x]) last_completed_stage = x;
    });
    constructStage(last_completed_stage);
  } else {
    Meteor.call('saveGlyph', glyph, (error, data) => {
      if (error) console.error(error);
    });

    if (!_.isEqual(glyph.metadata, last_glyph.metadata)) {
      stage.refreshUI(glyph.character, glyph.metadata);
    }
  }

  last_glyph = glyph;
  last_json = json;
});
Meteor.startup(() => {
  $('body').on('keypress', event => {
    const key = String.fromCharCode(event.which);

    if (bindings.hasOwnProperty(key)) {
      bindings[key]();
    } else if ('1' <= key && key <= '9') {
      const index = key.charCodeAt(0) - '1'.charCodeAt(0);
      const href = $('.metadata .reference')[index].href;
      window.open(href, '_blank').focus();
    }
  });
  $(window).on('hashchange', loadCharacter);
  cjklib.promise.then(loadCharacter).catch(console.error.bind(console));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/helpers.js                                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Handlebars.registerHelper('selected', (current, value) => ({
  value: value,
  selected: current === value ? 'selected' : undefined
}));
Handlebars.registerHelper('equals', (a, b) => a === b);
Handlebars.registerHelper('editable', (field, value) => "<div class=\"value\" contenteditable=\"true\" " + "data-field=\"".concat(field, "\">").concat(value, "</div>"));
Template.body.events({
  'click div.value[contenteditable="true"]': function (event) {
    if ($(event.target).text().length !== 1) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(event.target);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  'keypress div.value[contenteditable="true"]': function (event) {
    if (event.which === 13
    /* \n */
    ) {
      $(event.target).trigger('blur');
      event.preventDefault();
    }

    event.stopPropagation();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"metadata.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/metadata.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 0);
let cjklib;
module.link("/lib/cjklib", {
  cjklib(v) {
    cjklib = v;
  }

}, 1);
let pinyin_util;
module.link("/lib/pinyin_util", {
  pinyin_util(v) {
    pinyin_util = v;
  }

}, 2);
const unknown = '(unknown)';

const parseIntWithValidation = text => {
  const result = parseInt(text, 10);
  assert(!Number.isNaN(result));
  return result;
};

const parsePinyin = text => {
  const pinyin = text.split(',').map(x => x.trim()).filter(x => x.length);
  return pinyin.map(pinyin_util.numberedPinyinToTonePinyin).join(', ');
};

const validators = {
  pinyin: parsePinyin,
  strokes: parseIntWithValidation
}; // We avoid arrow functions in this map so that this is bound to the template.

Template.metadata.events({
  'blur .value': function (event) {
    const text = $(event.target).text();
    let value = text && text !== unknown ? text : null;

    if (value && validators.hasOwnProperty(this.field)) {
      try {
        value = validators[this.field](text);
      } catch (error) {
        console.log(error);
        value = null;
      }
    }

    const glyph = Session.get('editor.glyph');
    const defaults = cjklib.getCharacterData(glyph.character);

    if (value === defaults[this.field]) {
      value = null;
    }

    if (value !== glyph.metadata[this.field] && (value || glyph.metadata[this.field])) {
      glyph.metadata[this.field] = value;
      Session.set('editor.glyph', glyph);
    } else {
      $(event.target).text(value || defaults[this.field] || unknown);
    }
  }
});
Template.metadata.helpers({
  character() {
    const glyph = Session.get('editor.glyph');
    if (!glyph) return;
    return glyph.character;
  },

  display() {
    return Session.get('stage.type') === 'order' ? 'none' : undefined;
  },

  items() {
    const glyph = Session.get('editor.glyph');
    if (!glyph) return;
    const defaults = cjklib.getCharacterData(glyph.character);
    const fields = ['definition', 'pinyin', 'strokes'];
    const result = fields.map(x => ({
      field: x,
      label: "".concat(x[0].toUpperCase()).concat(x.substr(1), ":"),
      value: glyph.metadata[x] || defaults[x] || unknown
    }));

    if (cjklib.radicals.radical_to_index_map.hasOwnProperty(glyph.character)) {
      const index = cjklib.radicals.radical_to_index_map[glyph.character];
      const primary = cjklib.radicals.primary_radical[index];
      result[0].separator = '; ';
      result[0].extra = "Kangxi radical ".concat(index);

      if (glyph.character !== primary) {
        result[0].separator += 'variant of ';
        result[0].extra = "<a class=\"link\" href=\"#".concat(primary, "\">") + "".concat(result[0].extra, " ").concat(primary, "</a>");
      }
    }

    return result;
  },

  rank() {
    const glyph = Session.get('editor.glyph');
    return glyph && glyph.metadata.frequency || '?';
  },

  references() {
    const glyph = Session.get('editor.glyph');
    if (!glyph) return;
    const character = glyph.character;
    return [{
      href: 'http://www.archchinese.com/chinese_english_dictionary.html' + "?find=".concat(character),
      label: 'Arch Chinese'
    }, {
      href: 'http://www.mdbg.net/chindict/chindict.php?page=worddict' + "&wdrst=0&wdqb=".concat(character),
      label: 'MDBG'
    }, {
      href: "https://en.wiktionary.org/wiki/".concat(character),
      label: 'Wiktionary'
    }, {
      href: 'http://www.yellowbridge.com/chinese/character-etymology.php' + "?zi=".concat(character),
      label: 'YellowBridge'
    }];
  },

  simplified() {
    const glyph = Session.get('editor.glyph');
    return glyph && glyph.simplified;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"modal.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/modal.js                                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";

Template.modal.helpers({
  percent: () => {
    const value = Session.get('modal.value');
    return Math.round(100 * (value === undefined ? 1 : value));
  },
  text: () => Session.get('modal.text')
});
Tracker.autorun(function () {
  if (Session.get('modal.show')) {
    $('#modal').modal({
      background: 'static',
      keyboard: false
    });
  } else {
    $('#modal').modal('hide');
  }
});
Tracker.autorun(function () {
  const value = Session.get('modal.value');
  Session.set('modal.show', value !== undefined);
});
Meteor.startup(function () {
  Session.set('modal.show', false);
  Session.set('modal.value', undefined);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"navbar.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// client/navbar.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Progress;
module.link("/lib/glyphs", {
  Progress(v) {
    Progress = v;
  }

}, 0);
Template.navbar.events({
  'click .backup': () => {
    const progress = Progress.findOne();

    if (!(progress && progress.backup)) {
      Meteor.call('backup');
    }
  }
});
Template.navbar.helpers({
  backup() {
    const progress = Progress.findOne();
    return progress && progress.backup ? 'disabled' : undefined;
  },

  complete() {
    const progress = Progress.findOne();
    return progress ? progress.complete : '?';
  },

  percent() {
    const progress = Progress.findOne();
    return progress && progress.total ? Math.round(100 * progress.complete / progress.total) : 0;
  },

  total() {
    const progress = Progress.findOne();
    return progress ? progress.total : '?';
  }

});
Meteor.startup(() => Meteor.subscribe('getProgress'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".html",
    ".css",
    ".less"
  ]
});

require("/lib/template.animation.js");
require("/client/template.index.js");
require("/client/template.templates.js");
require("/lib/external/convnet/1.1.0/convnet.js");
require("/lib/external/simplify/1.2.2/simplify.js");
require("/lib/external/voronoi/0.98/rhill-voronoi-core.js");
require("/client/lib/abstract.js");
require("/client/lib/analysis.js");
require("/client/lib/bridges.js");
require("/client/lib/order.js");
require("/client/lib/path.js");
require("/client/lib/strokes.js");
require("/client/lib/verified.js");
require("/lib/stroke_caps/fixStrokes.js");
require("/lib/stroke_caps/utils.js");
require("/lib/animation.js");
require("/lib/base.js");
require("/lib/cjklib.js");
require("/lib/classifier.js");
require("/lib/decomposition_util.js");
require("/lib/glyphs.js");
require("/lib/hungarian.js");
require("/lib/median_util.js");
require("/lib/net.js");
require("/lib/pinyin_util.js");
require("/lib/stroke_extractor.js");
require("/lib/svg.js");
require("/client/external/bootstrap/3.1.1/bootstrap.min.js");
require("/client/external/opentype/0.4.10/opentype.js");
require("/client/editor.js");
require("/client/helpers.js");
require("/client/metadata.js");
require("/client/modal.js");
require("/client/navbar.js");