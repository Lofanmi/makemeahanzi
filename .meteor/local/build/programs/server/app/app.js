var require = meteorInstall({"lib":{"external":{"convnet":{"1.1.0":{"convnet.js":function module(){

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

}},"server":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/index.js                                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Glyphs;
module.link("/lib/glyphs", {
  Glyphs(v) {
    Glyphs = v;
  }

}, 0);
Meteor.publish('index', Glyphs.findGlyphsForRadical);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"migration.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/migration.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let getAnimationData;
module.link("/lib/animation", {
  getAnimationData(v) {
    getAnimationData = v;
  }

}, 0);
let assert, getPWD, Point;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  },

  getPWD(v) {
    getPWD = v;
  },

  Point(v) {
    Point = v;
  }

}, 1);
let cjklib;
module.link("/lib/cjklib", {
  cjklib(v) {
    cjklib = v;
  }

}, 2);
let Glyphs;
module.link("/lib/glyphs", {
  Glyphs(v) {
    Glyphs = v;
  }

}, 3);
let fixStrokes;
module.link("/lib/stroke_caps/fixStrokes", {
  fixStrokes(v) {
    fixStrokes = v;
  }

}, 4);
let stroke_extractor;
module.link("/lib/stroke_extractor", {
  stroke_extractor(v) {
    stroke_extractor = v;
  }

}, 5);
let svg;
module.link("/lib/svg", {
  svg(v) {
    svg = v;
  }

}, 6);

const addFrequencyField = glyph => {
  const data = cjklib.getCharacterData(glyph.character);
  glyph.metadata.frequency = data.frequency;
  Glyphs.save(glyph);
};

const addSimplifiedAndTraditionalFields = glyph => {
  const data = cjklib.getCharacterData(glyph.character);
  glyph.simplified = data.simplified;
  glyph.traditional = data.traditional;
  Glyphs.save(glyph);
};

const addStrokeCaps = glyph => {
  const raw = glyph.stages.strokes;
  if (raw.raw || raw.corrected) return;
  glyph.stages.strokes = {
    corrected: fixStrokes(raw),
    raw
  };
  Glyphs.save(glyph);
};

const checkStrokeExtractorStability = glyph => {
  const strokes = stroke_extractor.getStrokes(glyph.stages.path, glyph.stages.bridges);

  if (!_.isEqual(strokes.strokes.sort(), glyph.stages.strokes.sort())) {
    console.log("Different strokes for ".concat(glyph.character));
  }
};

const convertOldPathSchemaToSVGPath = path => {
  const terms = [];

  for (let segment of path) {
    assert('LMQZ'.indexOf(segment.type) >= 0, segment.type);
    terms.push(segment.type);

    if (segment.x1 !== undefined) {
      terms.push(segment.x1);
      terms.push(segment.y1);
    }

    if (segment.x !== undefined) {
      terms.push(segment.x);
      terms.push(segment.y);
    }
  }

  return terms.join(' ');
};

const dumpGlyph = (dictionary, graphics) => glyph => {
  if (!glyph.stages.verified) {
    return;
  }

  const analysis = glyph.stages.analysis;
  const order = glyph.stages.order;
  const data = cjklib.getCharacterData(glyph.character);
  const pinyin = (glyph.metadata.pinyin || data.pinyin || '').split(',').map(x => x.trim()).filter(x => x);
  const strokes = order.map(x => glyph.stages.strokes.corrected[x.stroke]);
  const medians = order.map(x => x.median);
  strokes.map(x => assert(x));
  medians.map(x => assert(x));
  const has_etymology = analysis.etymology.hint || analysis.etymology.type === 'pictophonetic';
  dictionary.write(JSON.stringify({
    character: glyph.character,
    definition: glyph.metadata.definition || data.definition,
    pinyin: pinyin,
    decomposition: analysis.decomposition || '？',
    etymology: has_etymology ? analysis.etymology : undefined,
    radical: analysis.radical,
    matches: order.map(x => x.match)
  }) + '\n');
  graphics.write(JSON.stringify({
    character: glyph.character,
    strokes: strokes,
    medians: medians
  }) + '\n');
};

const fixBrokenMedians = (glyph, threshold) => {
  threshold = threshold || 16;

  for (let stroke of glyph.stages.order) {
    const distance = Math.sqrt(Point.distance2(stroke.median[0], stroke.median[stroke.median.length - 1]));

    if (distance < threshold) {
      console.log("Found broken median in ".concat(glyph.character));
      const paths = svg.convertSVGPathToPaths(glyph.stages.strokes[stroke.stroke]);
      assert(paths.length === 1);
      const polygon = svg.getPolygonApproximation(paths[0], threshold);
      let best_point = null;
      let best_value = -Infinity;

      for (let point of polygon) {
        const value = Point.distance2(point, stroke.median[0]);

        if (value > best_value) {
          best_point = point;
          best_value = value;
        }
      }

      assert(best_point !== null);
      stroke.median = [best_point, stroke.median[0]];
      Glyphs.save(glyph);
    }
  }
};

const migrateOldGlyphSchemaToNew = glyph => {
  const codepoint = parseInt(glyph.name.substr(3), 16);
  const character = String.fromCodePoint(codepoint);
  const data = cjklib.getCharacterData(character);
  assert(glyph.manual && glyph.manual.verified !== undefined, "Glyph ".concat(character, " was not verified.")); // Pull definition and pinyin from simplified character, if available.

  let definition = undefined;
  let pinyin = undefined;

  if (data.simplified) {
    const simplified = Glyphs.get(data.simplified);
    const metadata = (simplified || {
      metadata: {}
    }).metadata;
    const base = cjklib.getCharacterData(data.simplified);
    definition = metadata.definition || base.definition;
    pinyin = metadata.pinyin || base.pinyin;
  }

  const result = {
    character: character,
    codepoint: codepoint,
    metadata: {
      definition: definition,
      frequency: data.frequency,
      kangxi_index: data.kangxi_index,
      pinyin: pinyin,
      strokes: undefined
    },
    stages: {
      path: convertOldPathSchemaToSVGPath(glyph.path),
      bridges: glyph.manual.bridges,
      strokes: glyph.derived.strokes,
      analysis: undefined,
      order: undefined,
      verified: undefined
    },
    simplified: data.simplified,
    traditional: data.traditional
  };
  assert(result.stages.path !== undefined);
  assert(result.stages.bridges !== undefined);
  assert(result.stages.strokes !== undefined);
  return result;
}; // Meteor methods that make use of the migration system follow.


const dumpToNewSchemaJSON = () => {
  const fs = Npm.require('fs');

  const path = Npm.require('path');

  const pwd = getPWD();
  const dictionary = fs.createWriteStream(path.join(pwd, 'dictionary.txt'));
  const graphics = fs.createWriteStream(path.join(pwd, 'graphics.txt'));
  runMigration(dumpGlyph(dictionary, graphics), () => {
    dictionary.end();
    graphics.end();
  });
};

const exportSVGs = () => {
  const fs = Npm.require('fs');

  const path = Npm.require('path');

  const pwd = getPWD();
  const directory = path.join(pwd, '.svgs');
  fs.mkdirSync(directory);
  runMigration(glyph => {
    const codepoint = glyph.character.codePointAt(0);
    const medians = glyph.stages.order.map(x => x.median);
    const strokes = glyph.stages.order.map(x => glyph.stages.strokes.corrected[x.stroke]);
    const raw = SSR.render('animation', getAnimationData(strokes, medians));
    const svg = raw.replace(/\n  /g, '\n').split('\n').slice(1, -2).join('\n');
    fs.writeFileSync(path.join(directory, "".concat(codepoint, ".svg")), svg);
  }, () => {});
};

const loadFromOldSchemaJSON = filename => {
  const fs = Npm.require('fs');

  const path = Npm.require('path');

  const filepath = path.join(getPWD(), 'public', filename);
  fs.readFile(filepath, 'utf8', Meteor.bindEnvironment((error, data) => {
    if (error) throw error;
    const lines = data.split('\n').filter(x => x.length > 0);
    console.log("Loaded ".concat(lines.length, " old-schema glyphs."));
    let migrated = 0;
    let definition = 0;
    let pinyin = 0;

    for (var line of lines) {
      try {
        const old_glyph = JSON.parse(line);
        const new_glyph = migrateOldGlyphSchemaToNew(old_glyph);
        const glyph = Glyphs.get(new_glyph.character);

        if (glyph && glyph.stages.verified) {
          console.log("Glyph already verified: ".concat(glyph.character));
          continue;
        }

        Glyphs.save(new_glyph);
        migrated += 1;
        definition += new_glyph.metadata.definition ? 1 : 0;
        pinyin += new_glyph.metadata.pinyin ? 1 : 0;
      } catch (error) {
        console.error(error);
      }
    }

    console.log("Successfully migrated ".concat(migrated, " glyphs."));
    console.log("Pulled definitions for ".concat(definition, " glyphs."));
    console.log("Pulled pinyin for ".concat(pinyin, " glyphs."));
  }));
}; // Runs the given per-glyph callback for each glyph in the database.
// When all the glyphs are migrated, runs the completion callback.


const runMigration = (per_glyph_callback, completion_callback) => {
  console.log('Running migration...');

  if (per_glyph_callback) {
    const codepoints = Glyphs.find({}, {
      fields: {
        codepoint: 1
      },
      sort: {
        codepoint: 1
      }
    }).fetch();

    for (let i = 0; i < codepoints.length; i++) {
      const glyph = Glyphs.findOne({
        codepoint: codepoints[i].codepoint
      });
      assert(glyph, 'Glyphs changed during migration!');
      per_glyph_callback(glyph);

      if ((i + 1) % 1000 === 0) {
        console.log("Migrated ".concat(i + 1, " glyphs."));
      }
    }
  }

  if (completion_callback) {
    completion_callback();
  }

  console.log('Migration complete.');
};

Meteor.methods({
  'export': () => {
    cjklib.promise.then(Meteor.bindEnvironment(dumpToNewSchemaJSON)).catch(console.error.bind(console));
  },
  'exportSVGs': exportSVGs,
  'loadFromOldSchemaJSON': filename => {
    cjklib.promise.then(Meteor.bindEnvironment(() => loadFromOldSchemaJSON(filename))).catch(console.error.bind(console));
  }
});
Meteor.startup(() => {
  SSR.compileTemplate('animation', Assets.getText('animation.html'));
  const completion_callback = undefined;
  const per_glyph_callback = undefined;

  if (!per_glyph_callback && !completion_callback) {
    return;
  }

  console.log('Preparing for migration...');

  const migration = () => runMigration(per_glyph_callback, completion_callback);

  cjklib.promise.then(Meteor.bindEnvironment(migration)).catch(console.error.bind(console));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"persistence.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/persistence.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let getPWD;
module.link("/lib/base", {
  getPWD(v) {
    getPWD = v;
  }

}, 0);
let Progress;
module.link("/lib/glyphs", {
  Progress(v) {
    Progress = v;
  }

}, 1);

const child_process = Npm.require('child_process');

const path = Npm.require('path');

const getBackupPath = () => {
  return path.join(getPWD(), 'server', 'backup');
};

Meteor.methods({
  backup() {
    const path = getBackupPath();
    child_process.spawn('mongodump', ['--port', '3001', '--out', path]);
    Progress.update({}, {
      $set: {
        backup: true
      }
    });
  },

  restore() {
    const path = getBackupPath();
    child_process.spawn('mongorestore', ['--port', '3001', '--drop', path]);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"training.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/training.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let assert;
module.link("/lib/base", {
  assert(v) {
    assert = v;
  }

}, 0);
let Glyphs;
module.link("/lib/glyphs", {
  Glyphs(v) {
    Glyphs = v;
  }

}, 1);

function evaluate(glyphs, classifier) {
  var num_correct = 0;

  for (var i = 0; i < glyphs.length; i++) {
    if (check_classifier_on_glyph(glyphs[i], classifier)) {
      num_correct += 1;
    }
  }

  return num_correct / glyphs.length;
}

function train_neural_net() {
  var glyphs = Glyphs.find({
    'manual.verified': true
  }).fetch();

  var sample = _.sample(glyphs, 400);

  console.log('Hand-tuned accuracy:', evaluate(sample, hand_tuned_classifier));
  var training_data = [];

  for (var i = 0; i < glyphs.length; i++) {
    var glyph_data = get_glyph_training_data(glyphs[i]);
    var positive_data = glyph_data.filter(function (x) {
      return x[1] > 0;
    });
    var negative_data = glyph_data.filter(function (x) {
      return x[1] === 0;
    });

    if (positive_data.length > negative_data.length) {
      positive_data = _.sample(positive_data, negative_data.length);
    } else {
      negative_data = _.sample(negative_data, positive_data.length);
    }

    glyph_data = negative_data.concat(positive_data);

    for (var j = 0; j < glyph_data.length; j++) {
      training_data.push(glyph_data[j]);
    }
  }

  console.log('Got ' + training_data.length + ' rows of training data.');
  var net = new convnetjs.Net();
  net.makeLayers([{
    type: 'input',
    out_sx: 1,
    out_sy: 1,
    out_depth: 8
  }, {
    type: 'fc',
    num_neurons: 8,
    activation: 'tanh'
  }, {
    type: 'fc',
    num_neurons: 8,
    activation: 'tanh'
  }, {
    type: 'softmax',
    num_classes: 2
  }]);
  var trainer = new convnetjs.Trainer(net, {
    method: 'adadelta',
    l2_decay: 0.001,
    batch_size: 10
  });
  var input = new convnetjs.Vol(1, 1, 8);

  for (var iteration = 0; iteration < 10; iteration++) {
    var loss = 0;

    var round_data = _.sample(training_data, 4000);

    for (var i = 0; i < round_data.length; i++) {
      assert(input.w.length === round_data[i][0].length);
      input.w = round_data[i][0];
      var stats = trainer.train(input, round_data[i][1]);
      assert(!isNaN(stats.loss));
      loss += stats.loss;
    }

    console.log('Iteration', iteration, 'mean loss:', loss / round_data.length);
  }

  console.log('Trained neural network:', JSON.stringify(net.toJSON()));

  function net_classifier(features) {
    assert(input.w.length === features.length);
    input.w = features;
    var softmax = net.forward(input).w;
    assert(softmax.length === 2);
    return softmax[1] - softmax[0];
  }

  console.log('Neural-net accuracy:', evaluate(sample, net_classifier));

  function combined_classifier(weight) {
    return function (features) {
      return hand_tuned_classifier(features) + weight * net_classifier(features);
    };
  }

  var weights = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  for (var i = 0; i < weights.length; i++) {
    console.log('Weight', weights[i], 'combined accuracy:', evaluate(sample, combined_classifier(weights[i])));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/lib/external/convnet/1.1.0/convnet.js");
require("/lib/external/simplify/1.2.2/simplify.js");
require("/lib/external/voronoi/0.98/rhill-voronoi-core.js");
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
require("/server/index.js");
require("/server/migration.js");
require("/server/persistence.js");
require("/server/training.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvbGliL2V4dGVybmFsL2NvbnZuZXQvMS4xLjAvY29udm5ldC5qcyIsIm1ldGVvcjovL/CfkrthcHAvbGliL2V4dGVybmFsL3NpbXBsaWZ5LzEuMi4yL3NpbXBsaWZ5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvZXh0ZXJuYWwvdm9yb25vaS8wLjk4L3JoaWxsLXZvcm9ub2ktY29yZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvbGliL3N0cm9rZV9jYXBzL2ZpeFN0cm9rZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9zdHJva2VfY2Fwcy91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvbGliL2FuaW1hdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvbGliL2Jhc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9jamtsaWIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9jbGFzc2lmaWVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvZGVjb21wb3NpdGlvbl91dGlsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvZ2x5cGhzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvaHVuZ2FyaWFuLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvbWVkaWFuX3V0aWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9uZXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9waW55aW5fdXRpbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvbGliL3N0cm9rZV9leHRyYWN0b3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9zdmcuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21pZ3JhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3BlcnNpc3RlbmNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvdHJhaW5pbmcuanMiXSwibmFtZXMiOlsiY29udm5ldGpzIiwiUkVWSVNJT04iLCJnbG9iYWwiLCJyZXR1cm5fdiIsInZfdmFsIiwiZ2F1c3NSYW5kb20iLCJ1IiwiTWF0aCIsInJhbmRvbSIsInYiLCJyIiwiYyIsInNxcnQiLCJsb2ciLCJyYW5kZiIsImEiLCJiIiwicmFuZGkiLCJmbG9vciIsInJhbmRuIiwibXUiLCJzdGQiLCJ6ZXJvcyIsIm4iLCJpc05hTiIsIkFycmF5QnVmZmVyIiwiYXJyIiwiQXJyYXkiLCJpIiwiRmxvYXQ2NEFycmF5IiwiYXJyQ29udGFpbnMiLCJlbHQiLCJsZW5ndGgiLCJhcnJVbmlxdWUiLCJwdXNoIiwibWF4bWluIiwidyIsIm1heHYiLCJtaW52IiwibWF4aSIsIm1pbmkiLCJkdiIsInJhbmRwZXJtIiwiaiIsInRlbXAiLCJhcnJheSIsInEiLCJ3ZWlnaHRlZFNhbXBsZSIsImxzdCIsInByb2JzIiwicCIsImN1bXByb2IiLCJrIiwiZ2V0b3B0Iiwib3B0IiwiZmllbGRfbmFtZSIsImRlZmF1bHRfdmFsdWUiLCJWb2wiLCJzeCIsInN5IiwiZGVwdGgiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJ0b1N0cmluZyIsImNhbGwiLCJkdyIsInNjYWxlIiwiZ2V0IiwieCIsInkiLCJkIiwiaXgiLCJzZXQiLCJhZGQiLCJnZXRfZ3JhZCIsInNldF9ncmFkIiwiYWRkX2dyYWQiLCJjbG9uZUFuZFplcm8iLCJjbG9uZSIsIlYiLCJhZGRGcm9tIiwiYWRkRnJvbVNjYWxlZCIsInNldENvbnN0IiwidG9KU09OIiwianNvbiIsImZyb21KU09OIiwiYXVnbWVudCIsImNyb3AiLCJkeCIsImR5IiwiZmxpcGxyIiwiVyIsIlcyIiwiaW1nX3RvX3ZvbCIsImltZyIsImNvbnZlcnRfZ3JheXNjYWxlIiwiY2FudmFzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwid2lkdGgiLCJoZWlnaHQiLCJjdHgiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwiZSIsIm5hbWUiLCJpbWdfZGF0YSIsImdldEltYWdlRGF0YSIsImRhdGEiLCJIIiwicHYiLCJ4MSIsIkNvbnZMYXllciIsIm91dF9kZXB0aCIsImZpbHRlcnMiLCJpbl9kZXB0aCIsImluX3N4IiwiaW5fc3kiLCJzdHJpZGUiLCJwYWQiLCJsMV9kZWNheV9tdWwiLCJsMl9kZWNheV9tdWwiLCJvdXRfc3giLCJvdXRfc3kiLCJsYXllcl90eXBlIiwiYmlhcyIsImJpYXNfcHJlZiIsImJpYXNlcyIsImZvcndhcmQiLCJpc190cmFpbmluZyIsImluX2FjdCIsIkEiLCJWX3N4IiwiVl9zeSIsInh5X3N0cmlkZSIsImYiLCJheSIsImF4IiwiZnkiLCJveSIsImZ4Iiwib3giLCJmZCIsIm91dF9hY3QiLCJiYWNrd2FyZCIsImNoYWluX2dyYWQiLCJpeDEiLCJpeDIiLCJnZXRQYXJhbXNBbmRHcmFkcyIsInJlc3BvbnNlIiwicGFyYW1zIiwiZ3JhZHMiLCJGdWxseUNvbm5MYXllciIsIm51bV9uZXVyb25zIiwibnVtX2lucHV0cyIsIlZ3Iiwid2kiLCJ0ZmkiLCJQb29sTGF5ZXIiLCJzd2l0Y2h4Iiwic3dpdGNoeSIsIndpbngiLCJ3aW55IiwiSW5wdXRMYXllciIsIlNvZnRtYXhMYXllciIsImFzIiwiYW1heCIsImVzIiwiZXN1bSIsImV4cCIsImluZGljYXRvciIsIm11bCIsIlJlZ3Jlc3Npb25MYXllciIsImxvc3MiLCJkaW0iLCJ5aSIsInZhbCIsIlNWTUxheWVyIiwieXNjb3JlIiwibWFyZ2luIiwiUmVsdUxheWVyIiwiVjIiLCJOIiwiVjJ3IiwiU2lnbW9pZExheWVyIiwidjJ3aSIsIk1heG91dExheWVyIiwiZ3JvdXBfc2l6ZSIsInN3aXRjaGVzIiwiYWkiLCJhMiIsInRhbmgiLCJUYW5oTGF5ZXIiLCJEcm9wb3V0TGF5ZXIiLCJkcm9wX3Byb2IiLCJkcm9wcGVkIiwiTG9jYWxSZXNwb25zZU5vcm1hbGl6YXRpb25MYXllciIsImFscGhhIiwiYmV0YSIsImNvbnNvbGUiLCJTX2NhY2hlXyIsIm4yIiwiZGVuIiwibWF4IiwibWluIiwiYWEiLCJwb3ciLCJTIiwiU0IiLCJTQjIiLCJhaiIsImciLCJOZXQiLCJvcHRpb25zIiwibGF5ZXJzIiwibWFrZUxheWVycyIsImRlZnMiLCJ0eXBlIiwiZGVzdWdhciIsIm5ld19kZWZzIiwiZGVmIiwibnVtX2NsYXNzZXMiLCJhY3RpdmF0aW9uIiwidGVuc29yIiwiZ3MiLCJwcmV2IiwiUXVhZFRyYW5zZm9ybUxheWVyIiwiYWN0IiwiZ2V0Q29zdExvc3MiLCJsYXllcl9yZXBvbnNlIiwiZ2V0UHJlZGljdGlvbiIsIkxqIiwidCIsIkwiLCJUcmFpbmVyIiwibmV0IiwibGVhcm5pbmdfcmF0ZSIsImwxX2RlY2F5IiwibDJfZGVjYXkiLCJiYXRjaF9zaXplIiwibWV0aG9kIiwibW9tZW50dW0iLCJybyIsImVwcyIsImdzdW0iLCJ4c3VtIiwidHJhaW4iLCJzdGFydCIsIkRhdGUiLCJnZXRUaW1lIiwiZW5kIiwiZndkX3RpbWUiLCJjb3N0X2xvc3MiLCJsMl9kZWNheV9sb3NzIiwibDFfZGVjYXlfbG9zcyIsImJ3ZF90aW1lIiwicGdsaXN0IiwicGciLCJwbGVuIiwiYWJzIiwibDFncmFkIiwibDJncmFkIiwiZ2lqIiwiZ3N1bWkiLCJ4c3VtaSIsInNvZnRtYXhfbG9zcyIsIlNHRFRyYWluZXIiLCJNYWdpY05ldCIsImxhYmVscyIsInRyYWluX3JhdGlvIiwibnVtX2ZvbGRzIiwibnVtX2NhbmRpZGF0ZXMiLCJudW1fZXBvY2hzIiwiZW5zZW1ibGVfc2l6ZSIsImJhdGNoX3NpemVfbWluIiwiYmF0Y2hfc2l6ZV9tYXgiLCJsMl9kZWNheV9taW4iLCJsMl9kZWNheV9tYXgiLCJsZWFybmluZ19yYXRlX21pbiIsImxlYXJuaW5nX3JhdGVfbWF4IiwibW9tZW50dW1fbWluIiwibW9tZW50dW1fbWF4IiwibmV1cm9uc19taW4iLCJuZXVyb25zX21heCIsImZvbGRzIiwiY2FuZGlkYXRlcyIsImV2YWx1YXRlZF9jYW5kaWRhdGVzIiwidW5pcXVlX2xhYmVscyIsIml0ZXIiLCJmb2xkaXgiLCJmaW5pc2hfZm9sZF9jYWxsYmFjayIsImZpbmlzaF9iYXRjaF9jYWxsYmFjayIsInNhbXBsZUZvbGRzIiwic2FtcGxlQ2FuZGlkYXRlcyIsIm51bV90cmFpbiIsInRyYWluX2l4Iiwic2xpY2UiLCJ0ZXN0X2l4Iiwic2FtcGxlQ2FuZGlkYXRlIiwiaW5wdXRfZGVwdGgiLCJsYXllcl9kZWZzIiwibmwiLCJuaSIsImRwIiwiYnMiLCJsMiIsImxyIiwibW9tIiwidHAiLCJ0cmFpbmVyX2RlZiIsInRyYWluZXIiLCJjYW5kIiwiYWNjIiwiYWNjdiIsInN0ZXAiLCJmb2xkIiwiZGF0YWl4IiwibCIsImxhc3RpdGVyIiwidmFsX2FjYyIsImV2YWxWYWxFcnJvcnMiLCJzb3J0IiwidmFscyIsInloYXQiLCJwcmVkaWN0X3NvZnQiLCJudiIsInhvdXQiLCJwcmVkaWN0Iiwic3RhdHMiLCJwcmVkaWN0ZWRfbGFiZWwiLCJuZXRzIiwiZHVtbXlfY2FuZGlkYXRlIiwib25GaW5pc2hGb2xkIiwib25GaW5pc2hCYXRjaCIsInNpbXBsaWZ5IiwiZ2V0U3FEaXN0IiwicDEiLCJwMiIsImdldFNxU2VnRGlzdCIsInNpbXBsaWZ5UmFkaWFsRGlzdCIsInBvaW50cyIsInNxVG9sZXJhbmNlIiwicHJldlBvaW50IiwibmV3UG9pbnRzIiwicG9pbnQiLCJsZW4iLCJzaW1wbGlmeURQU3RlcCIsImZpcnN0IiwibGFzdCIsInNpbXBsaWZpZWQiLCJtYXhTcURpc3QiLCJpbmRleCIsInNxRGlzdCIsInNpbXBsaWZ5RG91Z2xhc1BldWNrZXIiLCJ0b2xlcmFuY2UiLCJoaWdoZXN0UXVhbGl0eSIsInVuZGVmaW5lZCIsImRlZmluZSIsImFtZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJWb3Jvbm9pIiwidmVydGljZXMiLCJlZGdlcyIsImNlbGxzIiwidG9SZWN5Y2xlIiwiYmVhY2hzZWN0aW9uSnVua3lhcmQiLCJjaXJjbGVFdmVudEp1bmt5YXJkIiwidmVydGV4SnVua3lhcmQiLCJlZGdlSnVua3lhcmQiLCJjZWxsSnVua3lhcmQiLCJyZXNldCIsImJlYWNobGluZSIsIlJCVHJlZSIsInJvb3QiLCJiZWFjaHNlY3Rpb24iLCJnZXRGaXJzdCIsInJiTmV4dCIsImNpcmNsZUV2ZW50cyIsImZpcnN0Q2lyY2xlRXZlbnQiLCLOtSIsImluds61IiwiZXF1YWxXaXRoRXBzaWxvbiIsImdyZWF0ZXJUaGFuV2l0aEVwc2lsb24iLCJncmVhdGVyVGhhbk9yRXF1YWxXaXRoRXBzaWxvbiIsImxlc3NUaGFuV2l0aEVwc2lsb24iLCJsZXNzVGhhbk9yRXF1YWxXaXRoRXBzaWxvbiIsInJiSW5zZXJ0U3VjY2Vzc29yIiwibm9kZSIsInN1Y2Nlc3NvciIsInBhcmVudCIsInJiUHJldmlvdXMiLCJyYlJpZ2h0IiwicmJMZWZ0IiwicmJQYXJlbnQiLCJyYlJlZCIsImdyYW5kcGEiLCJ1bmNsZSIsInJiUm90YXRlTGVmdCIsInJiUm90YXRlUmlnaHQiLCJyYlJlbW92ZU5vZGUiLCJsZWZ0IiwicmlnaHQiLCJuZXh0IiwiaXNSZWQiLCJzaWJsaW5nIiwiZ2V0TGFzdCIsIkRpYWdyYW0iLCJzaXRlIiwiQ2VsbCIsImhhbGZlZGdlcyIsImNsb3NlTWUiLCJpbml0IiwiY3JlYXRlQ2VsbCIsImNlbGwiLCJwb3AiLCJwcmVwYXJlSGFsZmVkZ2VzIiwiaUhhbGZlZGdlIiwiZWRnZSIsInZiIiwidmEiLCJzcGxpY2UiLCJhbmdsZSIsImdldE5laWdoYm9ySWRzIiwibmVpZ2hib3JzIiwibFNpdGUiLCJ2b3Jvbm9pSWQiLCJyU2l0ZSIsImdldEJib3giLCJ4bWluIiwiSW5maW5pdHkiLCJ5bWluIiwieG1heCIsInltYXgiLCJ2eCIsInZ5IiwiZ2V0U3RhcnRwb2ludCIsInBvaW50SW50ZXJzZWN0aW9uIiwiaGFsZmVkZ2UiLCJwMCIsImdldEVuZHBvaW50IiwiVmVydGV4IiwiRWRnZSIsIkhhbGZlZGdlIiwiYXRhbjIiLCJjcmVhdGVIYWxmZWRnZSIsImNyZWF0ZVZlcnRleCIsImNyZWF0ZUVkZ2UiLCJzZXRFZGdlU3RhcnRwb2ludCIsInNldEVkZ2VFbmRwb2ludCIsImNyZWF0ZUJvcmRlckVkZ2UiLCJ2ZXJ0ZXgiLCJCZWFjaHNlY3Rpb24iLCJjcmVhdGVCZWFjaHNlY3Rpb24iLCJsZWZ0QnJlYWtQb2ludCIsImFyYyIsImRpcmVjdHJpeCIsInJmb2N4IiwicmZvY3kiLCJwYnkyIiwibEFyYyIsImxmb2N4IiwibGZvY3kiLCJwbGJ5MiIsImhsIiwiYWJ5MiIsInJpZ2h0QnJlYWtQb2ludCIsInJBcmMiLCJkZXRhY2hCZWFjaHNlY3Rpb24iLCJkZXRhY2hDaXJjbGVFdmVudCIsInJlbW92ZUJlYWNoc2VjdGlvbiIsImNpcmNsZSIsImNpcmNsZUV2ZW50IiwieWNlbnRlciIsInByZXZpb3VzIiwiZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMiLCJhYnNfZm4iLCJ1bnNoaWZ0IiwibkFyY3MiLCJpQXJjIiwiYXR0YWNoQ2lyY2xlRXZlbnQiLCJhZGRCZWFjaHNlY3Rpb24iLCJkeGwiLCJkeHIiLCJuZXdBcmMiLCJieCIsImJ5IiwiY3giLCJjeSIsImhiIiwiaGMiLCJDaXJjbGVFdmVudCIsImNTaXRlIiwiaGEiLCJwcmVkZWNlc3NvciIsImNvbm5lY3RFZGdlIiwiYmJveCIsInhsIiwieHIiLCJ5dCIsInliIiwibHgiLCJseSIsInJ4IiwicnkiLCJmbSIsImZiIiwiY2xpcEVkZ2UiLCJ0MCIsInQxIiwiY2xpcEVkZ2VzIiwiaUVkZ2UiLCJjbG9zZUNlbGxzIiwiaUNlbGwiLCJpTGVmdCIsIm5IYWxmZWRnZXMiLCJ2eiIsImxhc3RCb3JkZXJTZWdtZW50IiwicXVhbnRpemVTaXRlcyIsInNpdGVzIiwicmVjeWNsZSIsImRpYWdyYW0iLCJjb21wdXRlIiwic3RhcnRUaW1lIiwiY29uY2F0Iiwic2l0ZUV2ZW50cyIsInNpdGVpZCIsInhzaXRleCIsInhzaXRleSIsInN0b3BUaW1lIiwiZXhlY1RpbWUiLCJkaXN0VG9QYXRoIiwiZ2V0Q29zU2ltQXJvdW5kUG9pbnQiLCJnZXRMaW5lc0ludGVyc2VjdFBvaW50IiwiZ2V0T3V0bGluZVBvaW50cyIsImV4dGVuZFBvaW50T25MaW5lIiwiZXN0aW1hdGVUYW5Qb2ludHMiLCJyb3VuZFBhdGhQb2ludHMiLCJwdEVxIiwiZGlzdCIsInJlcXVpcmUiLCJDTElQX1RIUkVTSCIsIkxPV0VSX0NPU19TSU1fVEhSRVNIIiwiVVBQRVJfQ09TX1NJTV9USFJFU0giLCJCcmlkZ2UiLCJjb25zdHJ1Y3RvciIsInBvaW50U3RyaW5nIiwic3Ryb2tlIiwiZXN0VGFuUG9pbnRzIiwib3V0bGluZSIsImdldENsaXBzIiwiY29zU2ltMCIsImNvc1NpbTEiLCJjaGFyYWN0ZXIiLCJzdHJva2VzIiwiZmlsdGVyIiwiZGlzdDAiLCJkaXN0MSIsIm1hcCIsImNsaXBwaW5nU3Ryb2tlIiwiQ2xpcCIsImJyaWRnZSIsImNsaXBwZWRCeSIsImlzRG91YmxlIiwiY2FuTWVyZ2UiLCJvdGhlckNsaXAiLCJtZXJnZUludG9Eb3VibGUiLCJtaWRkbGVQb2ludCIsInJlcGxhY2UiLCJnZXROZXdTdHJva2VUaXAiLCJtYXhDb250cm9sUG9pbnQiLCJtYXhEaXN0Q29udHJvbDAiLCJtYXhEaXN0Q29udHJvbDEiLCJkaXN0Q29udHJvbDAiLCJkaXN0Q29udHJvbDEiLCJtaWREaXN0MCIsIm1pZERpc3QxIiwiY29udHJvbFBvaW50MCIsImNvbnRyb2xQb2ludDEiLCJwU3RyaW5nIiwicm91bmQiLCJTdHJva2UiLCJwYXRoU3RyaW5nIiwic3Ryb2tlTnVtIiwiZ2V0QnJpZGdlcyIsInBvaW50U3RyaW5nUGFydHMiLCJtYXRjaCIsInBvaW50U3RyaW5nUGFydCIsImZ1bGxQb2ludFN0cmluZ1JlZ2V4IiwiUmVnRXhwIiwicGFydHMiLCJzcGxpdCIsIm51bSIsInBhcnNlRmxvYXQiLCJmaXhQYXRoU3RyaW5nIiwiYnJpZGdlcyIsImNsaXBzIiwiZm9yRWFjaCIsImNsaXAiLCJsYXN0Q2xpcCIsIm1vZGlmaWVkUGF0aFN0cmluZyIsIm5ld1RpcCIsImlzTW9kaWZpZWQiLCJpc0RvdWJsZUNsaXBwZWQiLCJmaW5kIiwiQ2hhcmFjdGVyIiwicGF0aFN0cmluZ3MiLCJwYXRoIiwiZml4U3Ryb2tlc1dpdGhEZXRhaWxzIiwic3Ryb2tlUGF0aFN0cmluZ3MiLCJmaXhlZFN0cm9rZXNJbmZvIiwibW9kaWZpZWQiLCJzdW1tYXJ5IiwiaGFzRG91YmxlQ2xpcHBlZFN0cm9rZSIsIm1vZGlmaWVkU3Ryb2tlcyIsImZpeFN0cm9rZXNPbmNlIiwiY29ycmVjdGVkIiwiZml4U3Ryb2tlcyIsInN2Z1BhdGhVdGlscyIsIm5vcm0iLCJ2ZWN0Iiwic3VidHJhY3QiLCJjb3VudCIsImRlbHRhIiwic3ZnUG9pbnQiLCJhdCIsImwxcDEiLCJsMXAyIiwibDJwMSIsImwycDIiLCJ4MiIsIngzIiwieDQiLCJ5MSIsInkyIiwieTMiLCJ5NCIsInhOdW1lcmF0b3IiLCJ5TnVtZXJhdG9yIiwiZGVub21pbmF0b3IiLCJnZXRQb2ludEluZGV4IiwicGF0aE91dGxpbmUiLCJkaXN0cyIsIm91dGxpbmVQb2ludCIsImluZGV4T2YiLCJnZXRJbmRleEF0RGVsdGEiLCJwb2ludEluZGV4IiwicHJlSW5kZXgiLCJwb3N0SW5kZXgiLCJ2ZWN0MSIsInZlY3QyIiwiZGlzdGFuY2UiLCJtYWciLCJmbG9hdHMiLCJmaXhlZFBhdGhTdHJpbmciLCJmbG9hdCIsImNsaXBQb2ludHMiLCJjcEluZGV4MCIsImNwSW5kZXgxIiwiZXhwb3J0IiwiZ2V0QW5pbWF0aW9uRGF0YSIsImtJZFByZWZpeCIsImtXaWR0aCIsImRpc3RhbmNlMiIsInBvaW50MSIsInBvaW50MiIsImRpZmYiLCJnZXRNZWRpYW5MZW5ndGgiLCJtZWRpYW4iLCJyZXN1bHQiLCJnZXRNZWRpYW5QYXRoIiwiam9pbiIsIm1lZGlhbnMiLCJkZWxheSIsInNwZWVkIiwibGVuZ3RocyIsInBhdGhzIiwiYW5pbWF0aW9ucyIsInRvdGFsX2R1cmF0aW9uIiwib2Zmc2V0IiwiZHVyYXRpb24iLCJmcmFjdGlvbiIsImFuaW1hdGlvbl9pZCIsImNsaXBfaWQiLCJrZXlmcmFtZXMiLCJzcGFjaW5nIiwibW9kdWxlMSIsImFzc2VydCIsImdldFBXRCIsIm1heWJlUmVxdWlyZSIsIkFuZ2xlIiwiUG9pbnQiLCJjb25kaXRpb24iLCJtZXNzYWdlIiwiZXJyb3IiLCJFcnJvciIsImlzTnVtYmVyIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJNZXRlb3IiLCJpc1NlcnZlciIsIk5wbSIsIm5wbVJlcXVpcmUiLCJwcm9jZXNzIiwiZW52IiwiUFdEIiwiY3dkIiwidW5pcXVlIiwic2VlbiIsIlN0cmluZyIsImFwcGx5TWFwcGluZyIsIm1hcHBpbmciLCJhbmdsZTEiLCJhbmdsZTIiLCJQSSIsInBlbmFsdHkiLCJkb3QiLCJlcXVhbCIsImtleSIsIm1pZHBvaW50IiwidmFsaWQiLCJjamtsaWIiLCJsaW5rIiwiZnMiLCJDSEFSQUNURVJfRklFTERTIiwiY2hhcmFjdGVycyIsImdiMjMxMiIsInByb21pc2UiLCJyYWRpY2FscyIsInByaW1hcnlfcmFkaWNhbCIsImluZGV4X3RvX3JhZGljYWxfbWFwIiwicmFkaWNhbF90b19pbmRleF9tYXAiLCJyYWRpY2FsX3RvX2NoYXJhY3Rlcl9tYXAiLCJnZXRDaGFyYWN0ZXJEYXRhIiwiZmllbGQiLCJ0cmFkaXRpb25hbCIsImdldENKS0xpYlJvd3MiLCJsaW5lcyIsImxpbmUiLCJlbnRyeSIsImdldEZyZXF1ZW5jeVJvd3MiLCJnZXRVbmloYW5Sb3dzIiwicGFyc2VVbmljb2RlU3RyIiwic3RyIiwiZnJvbUNvZGVQb2ludCIsInBhcnNlSW50Iiwic3Vic3RyIiwicmVhZEZpbGUiLCJmaWxlbmFtZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZmlsZXBhdGgiLCIkIiwiY29kZSIsImZpbGxEZWNvbXBvc2l0aW9ucyIsImRlY29tcG9zaXRpb25zIiwiZ2x5cGhzIiwiYWxsIiwidGhlbiIsInJvd3MiLCJyb3ciLCJmaWxsRGVmaW5pdGlvbnMiLCJyZWFkaW5ncyIsImZpbGxGcmVxdWVuY2llcyIsImZpbGxLYW5neGlJbmRleCIsImdldEluZGV4IiwiYWRvdGIiLCJmaWxsUGlueWluIiwiZmlsbFN0cm9rZUNvdW50cyIsImRpY3Rpb25hcnlfbGlrZV9kYXRhIiwiZmlsbFJhZGljYWxEYXRhIiwibG9jYWxlIiwiaGFzT3duUHJvcGVydHkiLCJmaWxsUmFkaWNhbFRvQ2hhcmFjdGVyTWFwIiwicmFkaWNhbF9lcXVpdmFsZW50X2NoYXJhY3RlcnMiLCJmaWxsVmFyaWFudHMiLCJ2YXJpYW50cyIsInNvdXJjZSIsInRhcmdldCIsInN3YXAiLCJfIiwiZmlsbEdCMjMxMiIsImZyb20iLCJjb2RlcG9pbnQiLCJjb2RlUG9pbnRBdCIsImtleXMiLCJwYXJzZUxvY2FsZUdseXBoTWFwIiwiY2xlYW51cENKS0xpYkRhdGEiLCJjb252ZXJ0X2FzdHJhbF9jaGFyYWN0ZXJzIiwicmFkaWNhbF90b19jaGFyYWN0ZXIiLCJkZWNvbXBvc2l0aW9uIiwicHJpbWFyeSIsInJhZGljYWwiLCJzdGFydHVwIiwiYmluZCIsInJhZGljYWxfaXNvbGF0ZWRfY2hhcmFjdGVycyIsImZyZXF1ZW5jaWVzIiwicmFkaWNhbF9zdHJva2VfY291bnRzIiwiZGVmaW5pdGlvbiIsImZyZXF1ZW5jeSIsImthbmd4aV9pbmRleCIsInBpbnlpbiIsImNhdGNoIiwiTkVVUkFMX05FVF9UUkFJTkVEX0ZPUl9TVFJPS0VfRVhUUkFDVElPTiIsInN0cm9rZV9leHRyYWN0b3IiLCJpbnB1dCIsIndlaWdodCIsInRyYWluZWRDbGFzc2lmaWVyIiwiZmVhdHVyZXMiLCJzb2Z0bWF4IiwiY29tYmluZWRDbGFzc2lmaWVyIiwiaGFuZFR1bmVkQ2xhc3NpZmllciIsImRlY29tcG9zaXRpb25fdXRpbCIsImlkc19kYXRhIiwibGFiZWwiLCJhcml0eSIsImlkZW9ncmFwaF9kZXNjcmlwdGlvbl9jaGFyYWN0ZXJzIiwiVU5LTk9XTl9DT01QT05FTlQiLCJhdWdtZW50VHJlZVdpdGhQYXRoRGF0YSIsInRyZWUiLCJjaGlsZHJlbiIsInBhcnNlU3VidHJlZSIsImN1cnJlbnQiLCJ2YWx1ZSIsInNlcmlhbGl6ZVN1YnRyZWUiLCJzdWJ0cmVlIiwiY29sbGVjdENvbXBvbmVudHMiLCJjaGlsZCIsImNvbnZlcnREZWNvbXBvc2l0aW9uVG9UcmVlIiwiY29udmVydFRyZWVUb0RlY29tcG9zaXRpb24iLCJnZXRTdWJ0cmVlIiwiR2x5cGhzIiwiUHJvZ3Jlc3MiLCJkZWZhdWx0R2x5cGgiLCJtZXRhZGF0YSIsInN0YWdlcyIsImdseXBoIiwiYmFzZSIsInZlcmlmaWVkIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiY2xlYXJEZXBlbmRlbmNpZXMiLCJzdGFjayIsInZpc2l0ZWQiLCJkZXBlbmRlbmNpZXMiLCIkcmVnZXgiLCIkbmUiLCJmZXRjaCIsInVwZGF0ZSIsIiRpbiIsIiRzZXQiLCJtdWx0aSIsImZpbmRPbmUiLCJnZXRBbGwiLCJnZXROZXh0IiwiY2xhdXNlIiwiZXh0ZW5kIiwiJGd0IiwiZ2V0TmV4dFVudmVyaWZpZWQiLCJnZXROZXh0VmVyaWZpZWQiLCJnZXRQcmV2aW91cyIsIiRsdCIsImdldFByZXZpb3VzVW52ZXJpZmllZCIsImdldFByZXZpb3VzVmVyaWZpZWQiLCJsb2FkQWxsIiwidXBzZXJ0IiwicmVmcmVzaCIsInNhdmUiLCJjaGVjayIsInN5bmNEZWZpbml0aW9uQW5kUGlueWluIiwic2VudGluZWwiLCJyZW1vdmUiLCJ0YXJnZXRzIiwidG90YWwiLCJjb21wbGV0ZSIsImJhY2t1cCIsIl9lbnN1cmVJbmRleCIsIm1ldGhvZHMiLCJtZXRob2RfbmFtZXMiLCJsb2FkQWxsR2x5cGhzIiwic2F2ZUdseXBocyIsInB1Ymxpc2giLCJIdW5nYXJpYW4iLCJmbiIsIm1lIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJjb3N0X21hdHJpeCIsImxhc3RfbWF0Y2hlZCIsInJlZiIsInJlZjEiLCJyZXN1bHRzIiwiZ2V0X2ZpbmFsX3Njb3JlIiwidXBkYXRlX2xhYmVscyIsImZpbmRfcm9vdF9hbmRfc2xhY2tzIiwiY29zdCIsImZpbmRfZ3JlZWR5X3NvbHV0aW9uIiwicmVkdWNlX2Nvc3RfbWF0cml4IiwicmFuZ2UiLCJtYXRjaGVkIiwieF9sYWJlbCIsImxlbjEiLCJyZWYyIiwicmVzdWx0czEiLCJ5X2xhYmVsIiwieF9tYXRjaCIsInlfbWF0Y2giLCJsZW4yIiwibGVuMyIsIm1heF9jb3N0IiwicmVmMyIsImN1cl94IiwiY3VyX3kiLCJkZWx0YV94IiwiZGVsdGFfeSIsIm5ld19zbGFjayIsIm5leHRfeSIsInNsYWNrIiwic2xhY2tfeCIsInhfaW5fdHJlZSIsInlfcGFyZW50Iiwib3JpZ2luYWxfbWF0cml4IiwiVXRpbCIsInN1bSIsIm1lZGlhbl91dGlsIiwiZGVmYXVsdCIsInN2ZyIsInNpemUiLCJyaXNlIiwibnVtX3RvX21hdGNoIiwidm9yb25vaSIsImZpbHRlck1lZGlhbiIsImRpc3RhbmNlcyIsInBvc2l0aW9uIiwidG90YWxfc29fZmFyIiwiZmluZExvbmdlc3RTaG9ydGVzdFBhdGgiLCJhZGphY2VuY3kiLCJmaW5kUGF0aEZyb21GdXJ0aGVzdE5vZGUiLCJuZWlnaGJvciIsImNhbmRpZGF0ZSIsImZpbmRTdHJva2VNZWRpYW4iLCJjb252ZXJ0U1ZHUGF0aFRvUGF0aHMiLCJwb2x5Z29uIiwiYXBwcm94aW1hdGlvbiIsImdldFBvbHlnb25BcHByb3hpbWF0aW9uIiwiYm91bmRpbmdfYm94IiwiaW5jbHVkZSIsInBvbHlnb25Db250YWluc1BvaW50Iiwic2ltcGxlIiwibm9ybWFsaXplRm9yTWF0Y2giLCJwaW55aW5fdXRpbCIsInZvd2VsX3RvX3RvbmUiLCJ0b2tlblNldCIsInRva2VucyIsImNvbnNvbmFudHMiLCJ2b3dlbHMiLCJ0d29fc3lsbGFibGVzIiwiZHJvcFRvbmVzIiwiYXBwZW5kX251bWJlciIsIm9wdGlvbiIsInRvbmVsZXNzIiwibnVtYmVyZWRQaW55aW5Ub1RvbmVQaW55aW4iLCJudW1iZXJlZCIsInRvTG93ZXJDYXNlIiwidG9uZSIsImNvbnNvbmFudCIsInZvd2VsIiwidG9uZVBpbnlpblRvTnVtYmVyZWRQaW55aW4iLCJNQVhfQlJJREdFX0RJU1RBTkNFIiwiTUlOX0NPUk5FUl9BTkdMRSIsIk1JTl9DT1JORVJfVEFOR0VOVF9ESVNUQU5DRSIsIlJFVkVSU0FMX1BFTkFMVFkiLCJjaGVja0JyaWRnZSIsImVuZHBvaW50cyIsImNsYXNzaWZpZXIiLCJjb3JuZXJzIiwiY29ybmVyIiwibWF0Y2hpbmciLCJtYXRjaENvcm5lcnMiLCJnZXRGZWF0dXJlcyIsImlucyIsIm91dCIsInRyaXZpYWwiLCJhbmdsZXMiLCJhbmdsZV9wZW5hbHR5IiwiZGlzdGFuY2VfcGVuYWx0eSIsIm1hdHJpeCIsInNjb3JlQ29ybmVycyIsInJldmVyc2VkX3Njb3JlIiwiRW5kcG9pbnQiLCJpbmRpY2VzIiwic2VnbWVudHMiLCJ0YW5nZW50cyIsInRocmVzaG9sZCIsImNvbnRyb2wiLCJhZGRFZGdlVG9BZGphY2VuY3kiLCJleHRyYWN0U3Ryb2tlIiwiZW5kcG9pbnRfbWFwIiwiYnJpZGdlX2FkamFjZW5jeSIsImV4dHJhY3RlZF9pbmRpY2VzIiwiYXR0ZW1wdF9vbmUiLCJsaW5lX3NlZ21lbnRzIiwic2VsZl9pbnRlcnNlY3RpbmciLCJhZHZhbmNlIiwiaW5kZXgxIiwiaW5kZXgyIiwiZW5kcG9pbnQiLCJnZXRJbnRlcnNlY3Rpb24iLCJzZWdtZW50MSIsInNlZ21lbnQyIiwiZGlmZjEiLCJkaWZmMiIsImNyb3NzIiwicyIsImluZGV4VG9Qb2ludCIsInB1c2hMaW5lU2VnbWVudHMiLCJvbGRfbGluZXMiLCJzZWxlY3RCcmlkZ2UiLCJpbmRpY2VzMSIsImluZGljZXMyIiwiaW50ZXJzZWN0aW9uIiwicmV2ZXJzZSIsInJlc3VsdF9sZW5ndGgiLCJuZXdfa2V5IiwiY2xzIiwibnVtX3NlZ21lbnRzX29uX3BhdGgiLCJleHRyYWN0U3Ryb2tlcyIsImVuZHBvaW50X3Bvc2l0aW9uX21hcCIsInhzIiwiYXR0ZW1wdCIsIm1pc3NlZCIsImdldFN0cm9rZXMiLCJzdHJva2VfcGF0aHMiLCJjb252ZXJ0UGF0aHNUb1NWR1BhdGgiLCJnZXQyeEFyZWEiLCJhcmVhIiwib3JpZW50UGF0aHMiLCJhcHByb3hpbWF0aW9uX2Vycm9yIiwicG9seWdvbnMiLCJjb250YWlucyIsInNob3VsZF9yZXZlcnNlIiwic2VnbWVudCIsInNwbGl0UGF0aCIsInRlcm1zIiwiY29tbWFuZCIsImNvbnZlcnRDb21tYW5kc1RvUGF0aCIsImNvbW1hbmRzIiwibnVtX3BvaW50cyIsImNyb3NzaW5ncyIsImZpbmRHbHlwaHNGb3JSYWRpY2FsIiwiYWRkRnJlcXVlbmN5RmllbGQiLCJhZGRTaW1wbGlmaWVkQW5kVHJhZGl0aW9uYWxGaWVsZHMiLCJhZGRTdHJva2VDYXBzIiwicmF3IiwiY2hlY2tTdHJva2VFeHRyYWN0b3JTdGFiaWxpdHkiLCJpc0VxdWFsIiwiY29udmVydE9sZFBhdGhTY2hlbWFUb1NWR1BhdGgiLCJkdW1wR2x5cGgiLCJkaWN0aW9uYXJ5IiwiZ3JhcGhpY3MiLCJhbmFseXNpcyIsIm9yZGVyIiwidHJpbSIsImhhc19ldHltb2xvZ3kiLCJldHltb2xvZ3kiLCJoaW50Iiwid3JpdGUiLCJKU09OIiwic3RyaW5naWZ5IiwibWF0Y2hlcyIsImZpeEJyb2tlbk1lZGlhbnMiLCJiZXN0X3BvaW50IiwiYmVzdF92YWx1ZSIsIm1pZ3JhdGVPbGRHbHlwaFNjaGVtYVRvTmV3IiwibWFudWFsIiwiZGVyaXZlZCIsImR1bXBUb05ld1NjaGVtYUpTT04iLCJwd2QiLCJjcmVhdGVXcml0ZVN0cmVhbSIsInJ1bk1pZ3JhdGlvbiIsImV4cG9ydFNWR3MiLCJkaXJlY3RvcnkiLCJta2RpclN5bmMiLCJTU1IiLCJyZW5kZXIiLCJ3cml0ZUZpbGVTeW5jIiwibG9hZEZyb21PbGRTY2hlbWFKU09OIiwiYmluZEVudmlyb25tZW50IiwibWlncmF0ZWQiLCJvbGRfZ2x5cGgiLCJwYXJzZSIsIm5ld19nbHlwaCIsInBlcl9nbHlwaF9jYWxsYmFjayIsImNvbXBsZXRpb25fY2FsbGJhY2siLCJjb2RlcG9pbnRzIiwiZmllbGRzIiwiY29tcGlsZVRlbXBsYXRlIiwiQXNzZXRzIiwiZ2V0VGV4dCIsIm1pZ3JhdGlvbiIsImNoaWxkX3Byb2Nlc3MiLCJnZXRCYWNrdXBQYXRoIiwic3Bhd24iLCJyZXN0b3JlIiwiZXZhbHVhdGUiLCJudW1fY29ycmVjdCIsImNoZWNrX2NsYXNzaWZpZXJfb25fZ2x5cGgiLCJ0cmFpbl9uZXVyYWxfbmV0Iiwic2FtcGxlIiwiaGFuZF90dW5lZF9jbGFzc2lmaWVyIiwidHJhaW5pbmdfZGF0YSIsImdseXBoX2RhdGEiLCJnZXRfZ2x5cGhfdHJhaW5pbmdfZGF0YSIsInBvc2l0aXZlX2RhdGEiLCJuZWdhdGl2ZV9kYXRhIiwiaXRlcmF0aW9uIiwicm91bmRfZGF0YSIsIm5ldF9jbGFzc2lmaWVyIiwiY29tYmluZWRfY2xhc3NpZmllciIsIndlaWdodHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBSUEsU0FBUyxHQUFHQSxTQUFTLElBQUk7QUFBRUMsVUFBUSxFQUFFO0FBQVosQ0FBN0I7O0FBQ0EsQ0FBQyxVQUFTQyxNQUFULEVBQWlCO0FBQ2hCLGVBRGdCLENBR2hCOztBQUNBLE1BQUlDLFFBQVEsR0FBRyxLQUFmO0FBQ0EsTUFBSUMsS0FBSyxHQUFHLEdBQVo7O0FBQ0EsTUFBSUMsV0FBVyxHQUFHLFlBQVc7QUFDM0IsUUFBR0YsUUFBSCxFQUFhO0FBQ1hBLGNBQVEsR0FBRyxLQUFYO0FBQ0EsYUFBT0MsS0FBUDtBQUNEOztBQUNELFFBQUlFLENBQUMsR0FBRyxJQUFFQyxJQUFJLENBQUNDLE1BQUwsRUFBRixHQUFnQixDQUF4QjtBQUNBLFFBQUlDLENBQUMsR0FBRyxJQUFFRixJQUFJLENBQUNDLE1BQUwsRUFBRixHQUFnQixDQUF4QjtBQUNBLFFBQUlFLENBQUMsR0FBR0osQ0FBQyxHQUFDQSxDQUFGLEdBQU1HLENBQUMsR0FBQ0EsQ0FBaEI7QUFDQSxRQUFHQyxDQUFDLElBQUksQ0FBTCxJQUFVQSxDQUFDLEdBQUcsQ0FBakIsRUFBb0IsT0FBT0wsV0FBVyxFQUFsQjtBQUNwQixRQUFJTSxDQUFDLEdBQUdKLElBQUksQ0FBQ0ssSUFBTCxDQUFVLENBQUMsQ0FBRCxHQUFHTCxJQUFJLENBQUNNLEdBQUwsQ0FBU0gsQ0FBVCxDQUFILEdBQWVBLENBQXpCLENBQVI7QUFDQU4sU0FBSyxHQUFHSyxDQUFDLEdBQUNFLENBQVYsQ0FWMkIsQ0FVZDs7QUFDYlIsWUFBUSxHQUFHLElBQVg7QUFDQSxXQUFP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LEdBQWpGO0FBQXFGLGdCQUFLLEdBQTFGO0FBQThGLGdCQUFLLEVBQW5HO0FBQXNHLGdCQUFLLEVBQTNHO0FBQThHLGdCQUFLLEdBQW5IO0FBQXVILGdCQUFLLEdBQTVIO0FBQWdJLGdCQUFLLEVBQXJJO0FBQXdJLGdCQUFLLEdBQTdJO0FBQWlKLGdCQUFLLEVBQXRKO0FBQXlKLGdCQUFLLEVBQTlKO0FBQWlLLGdCQUFLLEVBQXRLO0FBQXlLLGdCQUFLLEVBQTlLO0FBQWlMLGdCQUFLLEdBQXRMO0FBQTBMLGdCQUFLLEdBQS9MO0FBQW1NLGdCQUFLLEdBQXhNO0FBQTRNLGdCQUFLLEdBQWpOO0FBQXFOLGdCQUFLLEdBQTFOO0FBQThOLGdCQUFLLENBQW5PO0FBQXFPLGdCQUFLLEVBQTFPO0FBQTZPLGdCQUFLLENBQWxQO0FBQW9QLGdCQUFLLEdBQXpQO0FBQTZQLGdCQUFLLEdBQWxRO0FBQXNRLGdCQUFLLEVBQTNRO0FBQThRLGdCQUFLLEdBQW5SO0FBQXVSLGdCQUFLLEdBQTVSO0FBQWdTLGdCQUFLLEVBQXJTO0FBQXdTLGdCQUFLLEVBQTdTO0FBQWdULGdCQUFLLEdBQXJUO0FBQXlULGdCQUFLLEdBQTlUO0FBQWtVLGdCQUFLLEVBQXZVO0FBQTBVLGdCQUFLLEdBQS9VO0FBQW1WLGdCQUFLLEdBQXhWO0FBQTRWLGdCQUFLLEVBQWpXO0FBQW9XLGdCQUFLLEVBQXpXO0FBQTRXLGdCQUFLLEVBQWpYO0FBQW9YLGdCQUFLLEdBQXpYO0FBQTZYLGdCQUFLLEdBQWxZO0FBQXNZLGdCQUFLLEVBQTNZO0FBQThZLGdCQUFLLEdBQW5aO0FBQXVaLGdCQUFLLEdBQTVaO0FBQWdhLGdCQUFLLEdBQXJhO0FBQXlhLGdCQUFLLEVBQTlhO0FBQWliLGdCQUFLLEdBQXRiO0FBQTBiLGdCQUFLLEVBQS9iO0FBQWtjLGdCQUFLLEdBQXZjO0FBQTJjLGdCQUFLLEdBQWhkO0FBQW9kLGdCQUFLLEVBQXpkO0FBQTRkLGdCQUFLLEVBQWplO0FBQW9lLGdCQUFLLEdBQXplO0FBQTZlLGdCQUFLLEdBQWxmO0FBQXNmLGdCQUFL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QkFBSyxHQUFwRjtBQUF3RixnQkFBSyxFQUE3RjtBQUFnRyxnQkFBSyxHQUFyRztBQUF5RyxnQkFBSyxFQUE5RztBQUFpSCxnQkFBSyxHQUF0SDtBQUEwSCxnQkFBSyxHQUEvSDtBQUFtSSxnQkFBSyxFQUF4STtBQUEySSxnQkFBSyxDQUFoSjtBQUFrSixnQkFBSyxHQUF2SjtBQUEySixnQkFBSyxHQUFoSztBQUFvSyxnQkFBSyxHQUF6SztBQUE2SyxnQkFBSyxFQUFsTDtBQUFxTCxnQkFBSyxHQUExTDtBQUE4TCxnQkFBSyxHQUFuTTtBQUF1TSxnQkFBSyxHQUE1TTtBQUFnTixnQkFBSyxFQUFyTjtBQUF3TixnQkFBSyxFQUE3TjtBQUFnTyxnQkFBSyxDQUFyTztBQUF1TyxnQkFBSyxHQUE1TztBQUFnUCxnQkFBSyxFQUFyUDtBQUF3UCxnQkFBSyxHQUE3UDtBQUFpUSxnQkFBSyxHQUF0UTtBQUEwUSxnQkFBSyxFQUEvUTtBQUFrUixnQkFBSyxHQUF2UjtBQUEyUixnQkFBSyxHQUFoUztBQUFvUyxnQkFBSyxHQUF6UztBQUE2UyxnQkFBSyxFQUFsVDtBQUFxVCxnQkFBSyxFQUExVDtBQUE2VCxnQkFBSyxHQUFsVTtBQUFzVSxnQkFBSyxHQUEzVTtBQUErVSxnQkFBSyxHQUFwVjtBQUF3VixnQkFBSyxFQUE3VjtBQUFnVyxnQkFBSyxFQUFyVztBQUF3VyxnQkFBSyxFQUE3VztBQUFnWCxnQkFBSyxHQUFyWDtBQUF5WCxnQkFBSyxHQUE5WDtBQUFrWSxnQkFBSyxHQUF2WTtBQUEyWSxnQkFBSyxHQUFoWjtBQUFvWixnQkFBSyxFQUF6WjtBQUE0WixnQkFBSyxHQUFqYTtBQUFxYSxnQkFBSyxFQUExYTtBQUE2YSxnQkFBSyxHQUFsYjtBQUFzYixnQkFBSyxFQUEzYjtBQUE4YixnQkFBSyxHQUFuYztBQUF1YyxnQkFBSyxHQUE1YztBQUFnZCxnQkFBSyxFQUFyZDtBQUF3ZCxnQkFBSyxFQUE3ZDtBQUFnZSxnQkFBSyxFQUFyZTtBQUF3ZSxnQkFBSyxHQUE3ZTtBQUFpZixnQkFBSyxHQUF0ZjtBQUEwZixn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Q0FBQzdTLFFBQUQsQ0FBckIsR0FBa0NGLE1BQU0sR0FBQ3VULGNBQWMsQ0FBQ3JULFFBQUQsQ0FBOUQ7QUFDRCxLQUZEO0FBR0Q7O0FBQ0QsTUFBSXVULE9BQU8sR0FBRyxDQUFDLENBQUQsRUFBSSxHQUFKLEVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsR0FBeEIsRUFBNkIsR0FBN0IsRUFBa0MsR0FBbEMsRUFBdUMsR0FBdkMsRUFBNEMsR0FBNUMsRUFBaUQsQ0FBakQsQ0FBZDs7QUFDQSxPQUFLLElBQUlwa0MsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR29rQyxPQUFPLENBQUNoa0MsTUFBNUIsRUFBb0NKLENBQUMsRUFBckMsRUFBeUM7QUFDdkMySyxXQUFPLENBQUMxTCxHQUFSLENBQVksUUFBWixFQUF1Qm1sQyxPQUFPLENBQUNwa0MsQ0FBRCxDQUE5QixFQUFtQyxvQkFBbkMsRUFDWXFqQyxRQUFRLENBQUNJLE1BQUQsRUFBU1UsbUJBQW1CLENBQUNDLE9BQU8sQ0FBQ3BrQyxDQUFELENBQVIsQ0FBNUIsQ0FEcEI7QUFFRDtBQUNGLEMiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBjb252bmV0anMgPSBjb252bmV0anMgfHwgeyBSRVZJU0lPTjogJ0FMUEhBJyB9O1xuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICAvLyBSYW5kb20gbnVtYmVyIHV0aWxpdGllc1xuICB2YXIgcmV0dXJuX3YgPSBmYWxzZTtcbiAgdmFyIHZfdmFsID0gMC4wO1xuICB2YXIgZ2F1c3NSYW5kb20gPSBmdW5jdGlvbigpIHtcbiAgICBpZihyZXR1cm5fdikgeyBcbiAgICAgIHJldHVybl92ID0gZmFsc2U7XG4gICAgICByZXR1cm4gdl92YWw7IFxuICAgIH1cbiAgICB2YXIgdSA9IDIqTWF0aC5yYW5kb20oKS0xO1xuICAgIHZhciB2ID0gMipNYXRoLnJhbmRvbSgpLTE7XG4gICAgdmFyIHIgPSB1KnUgKyB2KnY7XG4gICAgaWYociA9PSAwIHx8IHIgPiAxKSByZXR1cm4gZ2F1c3NSYW5kb20oKTtcbiAgICB2YXIgYyA9IE1hdGguc3FydCgtMipNYXRoLmxvZyhyKS9yKTtcbiAgICB2X3ZhbCA9IHYqYzsgLy8gY2FjaGUgdGhpc1xuICAgIHJldHVybl92ID0gdHJ1ZTtcbiAgICByZXR1cm4gdSpjO1xuICB9XG4gIHZhciByYW5kZiA9IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIE1hdGgucmFuZG9tKCkqKGItYSkrYTsgfVxuICB2YXIgcmFuZGkgPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKGItYSkrYSk7IH1cbiAgdmFyIHJhbmRuID0gZnVuY3Rpb24obXUsIHN0ZCl7IHJldHVybiBtdStnYXVzc1JhbmRvbSgpKnN0ZDsgfVxuXG4gIC8vIEFycmF5IHV0aWxpdGllc1xuICB2YXIgemVyb3MgPSBmdW5jdGlvbihuKSB7XG4gICAgaWYodHlwZW9mKG4pPT09J3VuZGVmaW5lZCcgfHwgaXNOYU4obikpIHsgcmV0dXJuIFtdOyB9XG4gICAgaWYodHlwZW9mIEFycmF5QnVmZmVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gbGFja2luZyBicm93c2VyIHN1cHBvcnRcbiAgICAgIHZhciBhcnIgPSBuZXcgQXJyYXkobik7XG4gICAgICBmb3IodmFyIGk9MDtpPG47aSsrKSB7IGFycltpXT0gMDsgfVxuICAgICAgcmV0dXJuIGFycjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBGbG9hdDY0QXJyYXkobik7XG4gICAgfVxuICB9XG5cbiAgdmFyIGFyckNvbnRhaW5zID0gZnVuY3Rpb24oYXJyLCBlbHQpIHtcbiAgICBmb3IodmFyIGk9MCxuPWFyci5sZW5ndGg7aTxuO2krKykge1xuICAgICAgaWYoYXJyW2ldPT09ZWx0KSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIGFyclVuaXF1ZSA9IGZ1bmN0aW9uKGFycikge1xuICAgIHZhciBiID0gW107XG4gICAgZm9yKHZhciBpPTAsbj1hcnIubGVuZ3RoO2k8bjtpKyspIHtcbiAgICAgIGlmKCFhcnJDb250YWlucyhiLCBhcnJbaV0pKSB7XG4gICAgICAgIGIucHVzaChhcnJbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYjtcbiAgfVxuXG4gIC8vIHJldHVybiBtYXggYW5kIG1pbiBvZiBhIGdpdmVuIG5vbi1lbXB0eSBhcnJheS5cbiAgdmFyIG1heG1pbiA9IGZ1bmN0aW9uKHcpIHtcbiAgICBpZih3Lmxlbmd0aCA9PT0gMCkgeyByZXR1cm4ge307IH0gLy8gLi4uIDtzXG4gICAgdmFyIG1heHYgPSB3WzBdO1xuICAgIHZhciBtaW52ID0gd1swXTtcbiAgICB2YXIgbWF4aSA9IDA7XG4gICAgdmFyIG1pbmkgPSAwO1xuICAgIHZhciBuID0gdy5sZW5ndGg7XG4gICAgZm9yKHZhciBpPTE7aTxuO2krKykge1xuICAgICAgaWYod1tpXSA+IG1heHYpIHsgbWF4diA9IHdbaV07IG1heGkgPSBpOyB9IFxuICAgICAgaWYod1tpXSA8IG1pbnYpIHsgbWludiA9IHdbaV07IG1pbmkgPSBpOyB9IFxuICAgIH1cbiAgICByZXR1cm4ge21heGk6IG1heGksIG1heHY6IG1heHYsIG1pbmk6IG1pbmksIG1pbnY6IG1pbnYsIGR2Om1heHYtbWludn07XG4gIH1cblxuICAvLyBjcmVhdGUgcmFuZG9tIHBlcm11dGF0aW9uIG9mIG51bWJlcnMsIGluIHJhbmdlIFswLi4ubi0xXVxuICB2YXIgcmFuZHBlcm0gPSBmdW5jdGlvbihuKSB7XG4gICAgdmFyIGkgPSBuLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgdGVtcDtcbiAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICBmb3IodmFyIHE9MDtxPG47cSsrKWFycmF5W3FdPXE7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkrMSkpO1xuICAgICAgICB0ZW1wID0gYXJyYXlbaV07XG4gICAgICAgIGFycmF5W2ldID0gYXJyYXlbal07XG4gICAgICAgIGFycmF5W2pdID0gdGVtcDtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xuICB9XG5cbiAgLy8gc2FtcGxlIGZyb20gbGlzdCBsc3QgYWNjb3JkaW5nIHRvIHByb2JhYmlsaXRpZXMgaW4gbGlzdCBwcm9ic1xuICAvLyB0aGUgdHdvIGxpc3RzIGFyZSBvZiBzYW1lIHNpemUsIGFuZCBwcm9icyBhZGRzIHVwIHRvIDFcbiAgdmFyIHdlaWdodGVkU2FtcGxlID0gZnVuY3Rpb24obHN0LCBwcm9icykge1xuICAgIHZhciBwID0gcmFuZGYoMCwgMS4wKTtcbiAgICB2YXIgY3VtcHJvYiA9IDAuMDtcbiAgICBmb3IodmFyIGs9MCxuPWxzdC5sZW5ndGg7azxuO2srKykge1xuICAgICAgY3VtcHJvYiArPSBwcm9ic1trXTtcbiAgICAgIGlmKHAgPCBjdW1wcm9iKSB7IHJldHVybiBsc3Rba107IH1cbiAgICB9XG4gIH1cblxuICAvLyBzeW50YWN0aWMgc3VnYXIgZnVuY3Rpb24gZm9yIGdldHRpbmcgZGVmYXVsdCBwYXJhbWV0ZXIgdmFsdWVzXG4gIHZhciBnZXRvcHQgPSBmdW5jdGlvbihvcHQsIGZpZWxkX25hbWUsIGRlZmF1bHRfdmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9wdFtmaWVsZF9uYW1lXSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRbZmllbGRfbmFtZV0gOiBkZWZhdWx0X3ZhbHVlO1xuICB9XG5cbiAgZ2xvYmFsLnJhbmRmID0gcmFuZGY7XG4gIGdsb2JhbC5yYW5kaSA9IHJhbmRpO1xuICBnbG9iYWwucmFuZG4gPSByYW5kbjtcbiAgZ2xvYmFsLnplcm9zID0gemVyb3M7XG4gIGdsb2JhbC5tYXhtaW4gPSBtYXhtaW47XG4gIGdsb2JhbC5yYW5kcGVybSA9IHJhbmRwZXJtO1xuICBnbG9iYWwud2VpZ2h0ZWRTYW1wbGUgPSB3ZWlnaHRlZFNhbXBsZTtcbiAgZ2xvYmFsLmFyclVuaXF1ZSA9IGFyclVuaXF1ZTtcbiAgZ2xvYmFsLmFyckNvbnRhaW5zID0gYXJyQ29udGFpbnM7XG4gIGdsb2JhbC5nZXRvcHQgPSBnZXRvcHQ7XG4gIFxufSkoY29udm5ldGpzKTtcbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgLy8gVm9sIGlzIHRoZSBiYXNpYyBidWlsZGluZyBibG9jayBvZiBhbGwgZGF0YSBpbiBhIG5ldC5cbiAgLy8gaXQgaXMgZXNzZW50aWFsbHkganVzdCBhIDNEIHZvbHVtZSBvZiBudW1iZXJzLCB3aXRoIGFcbiAgLy8gd2lkdGggKHN4KSwgaGVpZ2h0IChzeSksIGFuZCBkZXB0aCAoZGVwdGgpLlxuICAvLyBpdCBpcyB1c2VkIHRvIGhvbGQgZGF0YSBmb3IgYWxsIGZpbHRlcnMsIGFsbCB2b2x1bWVzLFxuICAvLyBhbGwgd2VpZ2h0cywgYW5kIGFsc28gc3RvcmVzIGFsbCBncmFkaWVudHMgdy5yLnQuIFxuICAvLyB0aGUgZGF0YS4gYyBpcyBvcHRpb25hbGx5IGEgdmFsdWUgdG8gaW5pdGlhbGl6ZSB0aGUgdm9sdW1lXG4gIC8vIHdpdGguIElmIGMgaXMgbWlzc2luZywgZmlsbHMgdGhlIFZvbCB3aXRoIHJhbmRvbSBudW1iZXJzLlxuICB2YXIgVm9sID0gZnVuY3Rpb24oc3gsIHN5LCBkZXB0aCwgYykge1xuICAgIC8vIHRoaXMgaXMgaG93IHlvdSBjaGVjayBpZiBhIHZhcmlhYmxlIGlzIGFuIGFycmF5LiBPaCwgSmF2YXNjcmlwdCA6KVxuICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzeCkgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIC8vIHdlIHdlcmUgZ2l2ZW4gYSBsaXN0IGluIHN4LCBhc3N1bWUgMUQgdm9sdW1lIGFuZCBmaWxsIGl0IHVwXG4gICAgICB0aGlzLnN4ID0gMTtcbiAgICAgIHRoaXMuc3kgPSAxO1xuICAgICAgdGhpcy5kZXB0aCA9IHN4Lmxlbmd0aDtcbiAgICAgIC8vIHdlIGhhdmUgdG8gZG8gdGhlIGZvbGxvd2luZyBjb3B5IGJlY2F1c2Ugd2Ugd2FudCB0byB1c2VcbiAgICAgIC8vIGZhc3QgdHlwZWQgYXJyYXlzLCBub3QgYW4gb3JkaW5hcnkgamF2YXNjcmlwdCBhcnJheVxuICAgICAgdGhpcy53ID0gZ2xvYmFsLnplcm9zKHRoaXMuZGVwdGgpO1xuICAgICAgdGhpcy5kdyA9IGdsb2JhbC56ZXJvcyh0aGlzLmRlcHRoKTtcbiAgICAgIGZvcih2YXIgaT0wO2k8dGhpcy5kZXB0aDtpKyspIHtcbiAgICAgICAgdGhpcy53W2ldID0gc3hbaV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHdlIHdlcmUgZ2l2ZW4gZGltZW5zaW9ucyBvZiB0aGUgdm9sXG4gICAgICB0aGlzLnN4ID0gc3g7XG4gICAgICB0aGlzLnN5ID0gc3k7XG4gICAgICB0aGlzLmRlcHRoID0gZGVwdGg7XG4gICAgICB2YXIgbiA9IHN4KnN5KmRlcHRoO1xuICAgICAgdGhpcy53ID0gZ2xvYmFsLnplcm9zKG4pO1xuICAgICAgdGhpcy5kdyA9IGdsb2JhbC56ZXJvcyhuKTtcbiAgICAgIGlmKHR5cGVvZiBjID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyB3ZWlnaHQgbm9ybWFsaXphdGlvbiBpcyBkb25lIHRvIGVxdWFsaXplIHRoZSBvdXRwdXRcbiAgICAgICAgLy8gdmFyaWFuY2Ugb2YgZXZlcnkgbmV1cm9uLCBvdGhlcndpc2UgbmV1cm9ucyB3aXRoIGEgbG90XG4gICAgICAgIC8vIG9mIGluY29taW5nIGNvbm5lY3Rpb25zIGhhdmUgb3V0cHV0cyBvZiBsYXJnZXIgdmFyaWFuY2VcbiAgICAgICAgdmFyIHNjYWxlID0gTWF0aC5zcXJ0KDEuMC8oc3gqc3kqZGVwdGgpKTtcbiAgICAgICAgZm9yKHZhciBpPTA7aTxuO2krKykgeyBcbiAgICAgICAgICB0aGlzLndbaV0gPSBnbG9iYWwucmFuZG4oMC4wLCBzY2FsZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcih2YXIgaT0wO2k8bjtpKyspIHsgXG4gICAgICAgICAgdGhpcy53W2ldID0gYztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFZvbC5wcm90b3R5cGUgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbih4LCB5LCBkKSB7IFxuICAgICAgdmFyIGl4PSgodGhpcy5zeCAqIHkpK3gpKnRoaXMuZGVwdGgrZDtcbiAgICAgIHJldHVybiB0aGlzLndbaXhdO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbih4LCB5LCBkLCB2KSB7IFxuICAgICAgdmFyIGl4PSgodGhpcy5zeCAqIHkpK3gpKnRoaXMuZGVwdGgrZDtcbiAgICAgIHRoaXMud1tpeF0gPSB2OyBcbiAgICB9LFxuICAgIGFkZDogZnVuY3Rpb24oeCwgeSwgZCwgdikgeyBcbiAgICAgIHZhciBpeD0oKHRoaXMuc3ggKiB5KSt4KSp0aGlzLmRlcHRoK2Q7XG4gICAgICB0aGlzLndbaXhdICs9IHY7IFxuICAgIH0sXG4gICAgZ2V0X2dyYWQ6IGZ1bmN0aW9uKHgsIHksIGQpIHsgXG4gICAgICB2YXIgaXggPSAoKHRoaXMuc3ggKiB5KSt4KSp0aGlzLmRlcHRoK2Q7XG4gICAgICByZXR1cm4gdGhpcy5kd1tpeF07IFxuICAgIH0sXG4gICAgc2V0X2dyYWQ6IGZ1bmN0aW9uKHgsIHksIGQsIHYpIHsgXG4gICAgICB2YXIgaXggPSAoKHRoaXMuc3ggKiB5KSt4KSp0aGlzLmRlcHRoK2Q7XG4gICAgICB0aGlzLmR3W2l4XSA9IHY7IFxuICAgIH0sXG4gICAgYWRkX2dyYWQ6IGZ1bmN0aW9uKHgsIHksIGQsIHYpIHsgXG4gICAgICB2YXIgaXggPSAoKHRoaXMuc3ggKiB5KSt4KSp0aGlzLmRlcHRoK2Q7XG4gICAgICB0aGlzLmR3W2l4XSArPSB2OyBcbiAgICB9LFxuICAgIGNsb25lQW5kWmVybzogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgVm9sKHRoaXMuc3gsIHRoaXMuc3ksIHRoaXMuZGVwdGgsIDAuMCl9LFxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBWID0gbmV3IFZvbCh0aGlzLnN4LCB0aGlzLnN5LCB0aGlzLmRlcHRoLCAwLjApO1xuICAgICAgdmFyIG4gPSB0aGlzLncubGVuZ3RoO1xuICAgICAgZm9yKHZhciBpPTA7aTxuO2krKykgeyBWLndbaV0gPSB0aGlzLndbaV07IH1cbiAgICAgIHJldHVybiBWO1xuICAgIH0sXG4gICAgYWRkRnJvbTogZnVuY3Rpb24oVikgeyBmb3IodmFyIGs9MDtrPHRoaXMudy5sZW5ndGg7aysrKSB7IHRoaXMud1trXSArPSBWLndba107IH19LFxuICAgIGFkZEZyb21TY2FsZWQ6IGZ1bmN0aW9uKFYsIGEpIHsgZm9yKHZhciBrPTA7azx0aGlzLncubGVuZ3RoO2srKykgeyB0aGlzLndba10gKz0gYSpWLndba107IH19LFxuICAgIHNldENvbnN0OiBmdW5jdGlvbihhKSB7IGZvcih2YXIgaz0wO2s8dGhpcy53Lmxlbmd0aDtrKyspIHsgdGhpcy53W2tdID0gYTsgfX0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gdG9kbzogd2UgbWF5IHdhbnQgdG8gb25seSBzYXZlIGQgbW9zdCBzaWduaWZpY2FudCBkaWdpdHMgdG8gc2F2ZSBzcGFjZVxuICAgICAgdmFyIGpzb24gPSB7fVxuICAgICAganNvbi5zeCA9IHRoaXMuc3g7IFxuICAgICAganNvbi5zeSA9IHRoaXMuc3k7XG4gICAgICBqc29uLmRlcHRoID0gdGhpcy5kZXB0aDtcbiAgICAgIGpzb24udyA9IHRoaXMudztcbiAgICAgIHJldHVybiBqc29uO1xuICAgICAgLy8gd2Ugd29udCBiYWNrIHVwIGdyYWRpZW50cyB0byBzYXZlIHNwYWNlXG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5zeCA9IGpzb24uc3g7XG4gICAgICB0aGlzLnN5ID0ganNvbi5zeTtcbiAgICAgIHRoaXMuZGVwdGggPSBqc29uLmRlcHRoO1xuXG4gICAgICB2YXIgbiA9IHRoaXMuc3gqdGhpcy5zeSp0aGlzLmRlcHRoO1xuICAgICAgdGhpcy53ID0gZ2xvYmFsLnplcm9zKG4pO1xuICAgICAgdGhpcy5kdyA9IGdsb2JhbC56ZXJvcyhuKTtcbiAgICAgIC8vIGNvcHkgb3ZlciB0aGUgZWxlbWVudHMuXG4gICAgICBmb3IodmFyIGk9MDtpPG47aSsrKSB7XG4gICAgICAgIHRoaXMud1tpXSA9IGpzb24ud1tpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnbG9iYWwuVm9sID0gVm9sO1xufSkoY29udm5ldGpzKTtcbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBWb2wgPSBnbG9iYWwuVm9sOyAvLyBjb252ZW5pZW5jZVxuXG4gIC8vIFZvbHVtZSB1dGlsaXRpZXNcbiAgLy8gaW50ZW5kZWQgZm9yIHVzZSB3aXRoIGRhdGEgYXVnbWVudGF0aW9uXG4gIC8vIGNyb3AgaXMgdGhlIHNpemUgb2Ygb3V0cHV0XG4gIC8vIGR4LGR5IGFyZSBvZmZzZXQgd3J0IGluY29taW5nIHZvbHVtZSwgb2YgdGhlIHNoaWZ0XG4gIC8vIGZsaXBsciBpcyBib29sZWFuIG9uIHdoZXRoZXIgd2UgYWxzbyB3YW50IHRvIGZsaXAgbGVmdDwtPnJpZ2h0XG4gIHZhciBhdWdtZW50ID0gZnVuY3Rpb24oViwgY3JvcCwgZHgsIGR5LCBmbGlwbHIpIHtcbiAgICAvLyBub3RlIGFzc3VtZXMgc3F1YXJlIG91dHB1dHMgb2Ygc2l6ZSBjcm9wIHggY3JvcFxuICAgIGlmKHR5cGVvZihmbGlwbHIpPT09J3VuZGVmaW5lZCcpIHZhciBmbGlwbHIgPSBmYWxzZTtcbiAgICBpZih0eXBlb2YoZHgpPT09J3VuZGVmaW5lZCcpIHZhciBkeCA9IGdsb2JhbC5yYW5kaSgwLCBWLnN4IC0gY3JvcCk7XG4gICAgaWYodHlwZW9mKGR5KT09PSd1bmRlZmluZWQnKSB2YXIgZHkgPSBnbG9iYWwucmFuZGkoMCwgVi5zeSAtIGNyb3ApO1xuICAgIFxuICAgIC8vIHJhbmRvbWx5IHNhbXBsZSBhIGNyb3AgaW4gdGhlIGlucHV0IHZvbHVtZVxuICAgIHZhciBXO1xuICAgIGlmKGNyb3AgIT09IFYuc3ggfHwgZHghPT0wIHx8IGR5IT09MCkge1xuICAgICAgVyA9IG5ldyBWb2woY3JvcCwgY3JvcCwgVi5kZXB0aCwgMC4wKTtcbiAgICAgIGZvcih2YXIgeD0wO3g8Y3JvcDt4KyspIHtcbiAgICAgICAgZm9yKHZhciB5PTA7eTxjcm9wO3krKykge1xuICAgICAgICAgIGlmKHgrZHg8MCB8fCB4K2R4Pj1WLnN4IHx8IHkrZHk8MCB8fCB5K2R5Pj1WLnN5KSBjb250aW51ZTsgLy8gb29iXG4gICAgICAgICAgZm9yKHZhciBkPTA7ZDxWLmRlcHRoO2QrKykge1xuICAgICAgICAgICBXLnNldCh4LHksZCxWLmdldCh4K2R4LHkrZHksZCkpOyAvLyBjb3B5IGRhdGEgb3ZlclxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBXID0gVjtcbiAgICB9XG5cbiAgICBpZihmbGlwbHIpIHtcbiAgICAgIC8vIGZsaXAgdm9sdW1lIGhvcnppb250YWxseVxuICAgICAgdmFyIFcyID0gVy5jbG9uZUFuZFplcm8oKTtcbiAgICAgIGZvcih2YXIgeD0wO3g8Vy5zeDt4KyspIHtcbiAgICAgICAgZm9yKHZhciB5PTA7eTxXLnN5O3krKykge1xuICAgICAgICAgIGZvcih2YXIgZD0wO2Q8Vy5kZXB0aDtkKyspIHtcbiAgICAgICAgICAgVzIuc2V0KHgseSxkLFcuZ2V0KFcuc3ggLSB4IC0gMSx5LGQpKTsgLy8gY29weSBkYXRhIG92ZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFcgPSBXMjsgLy9zd2FwXG4gICAgfVxuICAgIHJldHVybiBXO1xuICB9XG5cbiAgLy8gaW1nIGlzIGEgRE9NIGVsZW1lbnQgdGhhdCBjb250YWlucyBhIGxvYWRlZCBpbWFnZVxuICAvLyByZXR1cm5zIGEgVm9sIG9mIHNpemUgKFcsIEgsIDQpLiA0IGlzIGZvciBSR0JBXG4gIHZhciBpbWdfdG9fdm9sID0gZnVuY3Rpb24oaW1nLCBjb252ZXJ0X2dyYXlzY2FsZSkge1xuXG4gICAgaWYodHlwZW9mKGNvbnZlcnRfZ3JheXNjYWxlKT09PSd1bmRlZmluZWQnKSB2YXIgY29udmVydF9ncmF5c2NhbGUgPSBmYWxzZTtcblxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGltZy5oZWlnaHQ7XG4gICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAvLyBkdWUgdG8gYSBGaXJlZm94IGJ1Z1xuICAgIHRyeSB7XG4gICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUubmFtZSA9PT0gXCJOU19FUlJPUl9OT1RfQVZBSUxBQkxFXCIpIHtcbiAgICAgICAgLy8gc29tZXRpbWVzIGhhcHBlbnMsIGxldHMganVzdCBhYm9ydFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB2YXIgaW1nX2RhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYoZS5uYW1lID09PSAnSW5kZXhTaXplRXJyb3InKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gbm90IHN1cmUgd2hhdCBjYXVzZXMgdGhpcyBzb21ldGltZXMgYnV0IG9rYXkgYWJvcnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcHJlcGFyZSB0aGUgaW5wdXQ6IGdldCBwaXhlbHMgYW5kIG5vcm1hbGl6ZSB0aGVtXG4gICAgdmFyIHAgPSBpbWdfZGF0YS5kYXRhO1xuICAgIHZhciBXID0gaW1nLndpZHRoO1xuICAgIHZhciBIID0gaW1nLmhlaWdodDtcbiAgICB2YXIgcHYgPSBbXVxuICAgIGZvcih2YXIgaT0wO2k8cC5sZW5ndGg7aSsrKSB7XG4gICAgICBwdi5wdXNoKHBbaV0vMjU1LjAtMC41KTsgLy8gbm9ybWFsaXplIGltYWdlIHBpeGVscyB0byBbLTAuNSwgMC41XVxuICAgIH1cbiAgICB2YXIgeCA9IG5ldyBWb2woVywgSCwgNCwgMC4wKTsgLy9pbnB1dCB2b2x1bWUgKGltYWdlKVxuICAgIHgudyA9IHB2O1xuXG4gICAgaWYoY29udmVydF9ncmF5c2NhbGUpIHtcbiAgICAgIC8vIGZsYXR0ZW4gaW50byBkZXB0aD0xIGFycmF5XG4gICAgICB2YXIgeDEgPSBuZXcgVm9sKFcsIEgsIDEsIDAuMCk7XG4gICAgICBmb3IodmFyIGk9MDtpPFc7aSsrKSB7XG4gICAgICAgIGZvcih2YXIgaj0wO2o8SDtqKyspIHtcbiAgICAgICAgICB4MS5zZXQoaSxqLDAseC5nZXQoaSxqLDApKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgeCA9IHgxO1xuICAgIH1cblxuICAgIHJldHVybiB4O1xuICB9XG4gIFxuICBnbG9iYWwuYXVnbWVudCA9IGF1Z21lbnQ7XG4gIGdsb2JhbC5pbWdfdG9fdm9sID0gaW1nX3RvX3ZvbDtcblxufSkoY29udm5ldGpzKTtcbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBWb2wgPSBnbG9iYWwuVm9sOyAvLyBjb252ZW5pZW5jZVxuXG4gIC8vIFRoaXMgZmlsZSBjb250YWlucyBhbGwgbGF5ZXJzIHRoYXQgZG8gZG90IHByb2R1Y3RzIHdpdGggaW5wdXQsXG4gIC8vIGJ1dCB1c3VhbGx5IGluIGEgZGlmZmVyZW50IGNvbm5lY3Rpdml0eSBwYXR0ZXJuIGFuZCB3ZWlnaHQgc2hhcmluZ1xuICAvLyBzY2hlbWVzOiBcbiAgLy8gLSBGdWxseUNvbm4gaXMgZnVsbHkgY29ubmVjdGVkIGRvdCBwcm9kdWN0cyBcbiAgLy8gLSBDb252TGF5ZXIgZG9lcyBjb252b2x1dGlvbnMgKHNvIHdlaWdodCBzaGFyaW5nIHNwYXRpYWxseSlcbiAgLy8gcHV0dGluZyB0aGVtIHRvZ2V0aGVyIGluIG9uZSBmaWxlIGJlY2F1c2UgdGhleSBhcmUgdmVyeSBzaW1pbGFyXG4gIHZhciBDb252TGF5ZXIgPSBmdW5jdGlvbihvcHQpIHtcbiAgICB2YXIgb3B0ID0gb3B0IHx8IHt9O1xuXG4gICAgLy8gcmVxdWlyZWRcbiAgICB0aGlzLm91dF9kZXB0aCA9IG9wdC5maWx0ZXJzO1xuICAgIHRoaXMuc3ggPSBvcHQuc3g7IC8vIGZpbHRlciBzaXplLiBTaG91bGQgYmUgb2RkIGlmIHBvc3NpYmxlLCBpdCdzIGNsZWFuZXIuXG4gICAgdGhpcy5pbl9kZXB0aCA9IG9wdC5pbl9kZXB0aDtcbiAgICB0aGlzLmluX3N4ID0gb3B0LmluX3N4O1xuICAgIHRoaXMuaW5fc3kgPSBvcHQuaW5fc3k7XG4gICAgXG4gICAgLy8gb3B0aW9uYWxcbiAgICB0aGlzLnN5ID0gdHlwZW9mIG9wdC5zeSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHQuc3kgOiB0aGlzLnN4O1xuICAgIHRoaXMuc3RyaWRlID0gdHlwZW9mIG9wdC5zdHJpZGUgIT09ICd1bmRlZmluZWQnID8gb3B0LnN0cmlkZSA6IDE7IC8vIHN0cmlkZSBhdCB3aGljaCB3ZSBhcHBseSBmaWx0ZXJzIHRvIGlucHV0IHZvbHVtZVxuICAgIHRoaXMucGFkID0gdHlwZW9mIG9wdC5wYWQgIT09ICd1bmRlZmluZWQnID8gb3B0LnBhZCA6IDA7IC8vIGFtb3VudCBvZiAwIHBhZGRpbmcgdG8gYWRkIGFyb3VuZCBib3JkZXJzIG9mIGlucHV0IHZvbHVtZVxuICAgIHRoaXMubDFfZGVjYXlfbXVsID0gdHlwZW9mIG9wdC5sMV9kZWNheV9tdWwgIT09ICd1bmRlZmluZWQnID8gb3B0LmwxX2RlY2F5X211bCA6IDAuMDtcbiAgICB0aGlzLmwyX2RlY2F5X211bCA9IHR5cGVvZiBvcHQubDJfZGVjYXlfbXVsICE9PSAndW5kZWZpbmVkJyA/IG9wdC5sMl9kZWNheV9tdWwgOiAxLjA7XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIC8vIG5vdGUgd2UgYXJlIGRvaW5nIGZsb29yLCBzbyBpZiB0aGUgc3RyaWRlZCBjb252b2x1dGlvbiBvZiB0aGUgZmlsdGVyIGRvZXNudCBmaXQgaW50byB0aGUgaW5wdXRcbiAgICAvLyB2b2x1bWUgZXhhY3RseSwgdGhlIG91dHB1dCB2b2x1bWUgd2lsbCBiZSB0cmltbWVkIGFuZCBub3QgY29udGFpbiB0aGUgKGluY29tcGxldGUpIGNvbXB1dGVkXG4gICAgLy8gZmluYWwgYXBwbGljYXRpb24uXG4gICAgdGhpcy5vdXRfc3ggPSBNYXRoLmZsb29yKCh0aGlzLmluX3N4ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5zeCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuICAgIHRoaXMub3V0X3N5ID0gTWF0aC5mbG9vcigodGhpcy5pbl9zeSArIHRoaXMucGFkICogMiAtIHRoaXMuc3kpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICB0aGlzLmxheWVyX3R5cGUgPSAnY29udic7XG5cbiAgICAvLyBpbml0aWFsaXphdGlvbnNcbiAgICB2YXIgYmlhcyA9IHR5cGVvZiBvcHQuYmlhc19wcmVmICE9PSAndW5kZWZpbmVkJyA/IG9wdC5iaWFzX3ByZWYgOiAwLjA7XG4gICAgdGhpcy5maWx0ZXJzID0gW107XG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aDtpKyspIHsgdGhpcy5maWx0ZXJzLnB1c2gobmV3IFZvbCh0aGlzLnN4LCB0aGlzLnN5LCB0aGlzLmluX2RlcHRoKSk7IH1cbiAgICB0aGlzLmJpYXNlcyA9IG5ldyBWb2woMSwgMSwgdGhpcy5vdXRfZGVwdGgsIGJpYXMpO1xuICB9XG4gIENvbnZMYXllci5wcm90b3R5cGUgPSB7XG4gICAgZm9yd2FyZDogZnVuY3Rpb24oViwgaXNfdHJhaW5pbmcpIHtcbiAgICAgIC8vIG9wdGltaXplZCBjb2RlIGJ5IEBtZGRhIHRoYXQgYWNoaWV2ZXMgMnggc3BlZWR1cCBvdmVyIHByZXZpb3VzIHZlcnNpb25cblxuICAgICAgdGhpcy5pbl9hY3QgPSBWO1xuICAgICAgdmFyIEEgPSBuZXcgVm9sKHRoaXMub3V0X3N4IHwwLCB0aGlzLm91dF9zeSB8MCwgdGhpcy5vdXRfZGVwdGggfDAsIDAuMCk7XG4gICAgICBcbiAgICAgIHZhciBWX3N4ID0gVi5zeCB8MDtcbiAgICAgIHZhciBWX3N5ID0gVi5zeSB8MDtcbiAgICAgIHZhciB4eV9zdHJpZGUgPSB0aGlzLnN0cmlkZSB8MDtcblxuICAgICAgZm9yKHZhciBkPTA7ZDx0aGlzLm91dF9kZXB0aDtkKyspIHtcbiAgICAgICAgdmFyIGYgPSB0aGlzLmZpbHRlcnNbZF07XG4gICAgICAgIHZhciB4ID0gLXRoaXMucGFkIHwwO1xuICAgICAgICB2YXIgeSA9IC10aGlzLnBhZCB8MDtcbiAgICAgICAgZm9yKHZhciBheT0wOyBheTx0aGlzLm91dF9zeTsgeSs9eHlfc3RyaWRlLGF5KyspIHsgIC8vIHh5X3N0cmlkZVxuICAgICAgICAgIHggPSAtdGhpcy5wYWQgfDA7XG4gICAgICAgICAgZm9yKHZhciBheD0wOyBheDx0aGlzLm91dF9zeDsgeCs9eHlfc3RyaWRlLGF4KyspIHsgIC8vIHh5X3N0cmlkZVxuXG4gICAgICAgICAgICAvLyBjb252b2x2ZSBjZW50ZXJlZCBhdCB0aGlzIHBhcnRpY3VsYXIgbG9jYXRpb25cbiAgICAgICAgICAgIHZhciBhID0gMC4wO1xuICAgICAgICAgICAgZm9yKHZhciBmeT0wO2Z5PGYuc3k7ZnkrKykge1xuICAgICAgICAgICAgICB2YXIgb3kgPSB5K2Z5OyAvLyBjb29yZGluYXRlcyBpbiB0aGUgb3JpZ2luYWwgaW5wdXQgYXJyYXkgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgZm9yKHZhciBmeD0wO2Z4PGYuc3g7ZngrKykge1xuICAgICAgICAgICAgICAgIHZhciBveCA9IHgrZng7XG4gICAgICAgICAgICAgICAgaWYob3k+PTAgJiYgb3k8Vl9zeSAmJiBveD49MCAmJiBveDxWX3N4KSB7XG4gICAgICAgICAgICAgICAgICBmb3IodmFyIGZkPTA7ZmQ8Zi5kZXB0aDtmZCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGF2b2lkIGZ1bmN0aW9uIGNhbGwgb3ZlcmhlYWQgKHgyKSBmb3IgZWZmaWNpZW5jeSwgY29tcHJvbWlzZSBtb2R1bGFyaXR5IDooXG4gICAgICAgICAgICAgICAgICAgIGEgKz0gZi53WygoZi5zeCAqIGZ5KStmeCkqZi5kZXB0aCtmZF0gKiBWLndbKChWX3N4ICogb3kpK294KSpWLmRlcHRoK2ZkXTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEgKz0gdGhpcy5iaWFzZXMud1tkXTtcbiAgICAgICAgICAgIEEuc2V0KGF4LCBheSwgZCwgYSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLm91dF9hY3QgPSBBO1xuICAgICAgcmV0dXJuIHRoaXMub3V0X2FjdDtcbiAgICB9LFxuICAgIGJhY2t3YXJkOiBmdW5jdGlvbigpIHtcblxuICAgICAgdmFyIFYgPSB0aGlzLmluX2FjdDtcbiAgICAgIFYuZHcgPSBnbG9iYWwuemVyb3MoVi53Lmxlbmd0aCk7IC8vIHplcm8gb3V0IGdyYWRpZW50IHdydCBib3R0b20gZGF0YSwgd2UncmUgYWJvdXQgdG8gZmlsbCBpdFxuXG4gICAgICB2YXIgVl9zeCA9IFYuc3ggfDA7XG4gICAgICB2YXIgVl9zeSA9IFYuc3kgfDA7XG4gICAgICB2YXIgeHlfc3RyaWRlID0gdGhpcy5zdHJpZGUgfDA7XG5cbiAgICAgIGZvcih2YXIgZD0wO2Q8dGhpcy5vdXRfZGVwdGg7ZCsrKSB7XG4gICAgICAgIHZhciBmID0gdGhpcy5maWx0ZXJzW2RdO1xuICAgICAgICB2YXIgeCA9IC10aGlzLnBhZCB8MDtcbiAgICAgICAgdmFyIHkgPSAtdGhpcy5wYWQgfDA7XG4gICAgICAgIGZvcih2YXIgYXk9MDsgYXk8dGhpcy5vdXRfc3k7IHkrPXh5X3N0cmlkZSxheSsrKSB7ICAvLyB4eV9zdHJpZGVcbiAgICAgICAgICB4ID0gLXRoaXMucGFkIHwwO1xuICAgICAgICAgIGZvcih2YXIgYXg9MDsgYXg8dGhpcy5vdXRfc3g7IHgrPXh5X3N0cmlkZSxheCsrKSB7ICAvLyB4eV9zdHJpZGVcblxuICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBwYXJ0aWN1bGFyIGxvY2F0aW9uXG4gICAgICAgICAgICB2YXIgY2hhaW5fZ3JhZCA9IHRoaXMub3V0X2FjdC5nZXRfZ3JhZChheCxheSxkKTsgLy8gZ3JhZGllbnQgZnJvbSBhYm92ZSwgZnJvbSBjaGFpbiBydWxlXG4gICAgICAgICAgICBmb3IodmFyIGZ5PTA7Znk8Zi5zeTtmeSsrKSB7XG4gICAgICAgICAgICAgIHZhciBveSA9IHkrZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICBmb3IodmFyIGZ4PTA7Zng8Zi5zeDtmeCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG94ID0geCtmeDtcbiAgICAgICAgICAgICAgICBpZihveT49MCAmJiBveTxWX3N5ICYmIG94Pj0wICYmIG94PFZfc3gpIHtcbiAgICAgICAgICAgICAgICAgIGZvcih2YXIgZmQ9MDtmZDxmLmRlcHRoO2ZkKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXZvaWQgZnVuY3Rpb24gY2FsbCBvdmVyaGVhZCAoeDIpIGZvciBlZmZpY2llbmN5LCBjb21wcm9taXNlIG1vZHVsYXJpdHkgOihcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl4MSA9ICgoVl9zeCAqIG95KStveCkqVi5kZXB0aCtmZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl4MiA9ICgoZi5zeCAqIGZ5KStmeCkqZi5kZXB0aCtmZDtcbiAgICAgICAgICAgICAgICAgICAgZi5kd1tpeDJdICs9IFYud1tpeDFdKmNoYWluX2dyYWQ7XG4gICAgICAgICAgICAgICAgICAgIFYuZHdbaXgxXSArPSBmLndbaXgyXSpjaGFpbl9ncmFkO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5iaWFzZXMuZHdbZF0gKz0gY2hhaW5fZ3JhZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXNwb25zZSA9IFtdO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aDtpKyspIHtcbiAgICAgICAgcmVzcG9uc2UucHVzaCh7cGFyYW1zOiB0aGlzLmZpbHRlcnNbaV0udywgZ3JhZHM6IHRoaXMuZmlsdGVyc1tpXS5kdywgbDJfZGVjYXlfbXVsOiB0aGlzLmwyX2RlY2F5X211bCwgbDFfZGVjYXlfbXVsOiB0aGlzLmwxX2RlY2F5X211bH0pO1xuICAgICAgfVxuICAgICAgcmVzcG9uc2UucHVzaCh7cGFyYW1zOiB0aGlzLmJpYXNlcy53LCBncmFkczogdGhpcy5iaWFzZXMuZHcsIGwxX2RlY2F5X211bDogMC4wLCBsMl9kZWNheV9tdWw6IDAuMH0pO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBqc29uID0ge307XG4gICAgICBqc29uLnN4ID0gdGhpcy5zeDsgLy8gZmlsdGVyIHNpemUgaW4geCwgeSBkaW1zXG4gICAgICBqc29uLnN5ID0gdGhpcy5zeTtcbiAgICAgIGpzb24uc3RyaWRlID0gdGhpcy5zdHJpZGU7XG4gICAgICBqc29uLmluX2RlcHRoID0gdGhpcy5pbl9kZXB0aDtcbiAgICAgIGpzb24ub3V0X2RlcHRoID0gdGhpcy5vdXRfZGVwdGg7XG4gICAgICBqc29uLm91dF9zeCA9IHRoaXMub3V0X3N4O1xuICAgICAganNvbi5vdXRfc3kgPSB0aGlzLm91dF9zeTtcbiAgICAgIGpzb24ubGF5ZXJfdHlwZSA9IHRoaXMubGF5ZXJfdHlwZTtcbiAgICAgIGpzb24ubDFfZGVjYXlfbXVsID0gdGhpcy5sMV9kZWNheV9tdWw7XG4gICAgICBqc29uLmwyX2RlY2F5X211bCA9IHRoaXMubDJfZGVjYXlfbXVsO1xuICAgICAganNvbi5wYWQgPSB0aGlzLnBhZDtcbiAgICAgIGpzb24uZmlsdGVycyA9IFtdO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLmZpbHRlcnMubGVuZ3RoO2krKykge1xuICAgICAgICBqc29uLmZpbHRlcnMucHVzaCh0aGlzLmZpbHRlcnNbaV0udG9KU09OKCkpO1xuICAgICAgfVxuICAgICAganNvbi5iaWFzZXMgPSB0aGlzLmJpYXNlcy50b0pTT04oKTtcbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0sXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgIHRoaXMub3V0X2RlcHRoID0ganNvbi5vdXRfZGVwdGg7XG4gICAgICB0aGlzLm91dF9zeCA9IGpzb24ub3V0X3N4O1xuICAgICAgdGhpcy5vdXRfc3kgPSBqc29uLm91dF9zeTtcbiAgICAgIHRoaXMubGF5ZXJfdHlwZSA9IGpzb24ubGF5ZXJfdHlwZTtcbiAgICAgIHRoaXMuc3ggPSBqc29uLnN4OyAvLyBmaWx0ZXIgc2l6ZSBpbiB4LCB5IGRpbXNcbiAgICAgIHRoaXMuc3kgPSBqc29uLnN5O1xuICAgICAgdGhpcy5zdHJpZGUgPSBqc29uLnN0cmlkZTtcbiAgICAgIHRoaXMuaW5fZGVwdGggPSBqc29uLmluX2RlcHRoOyAvLyBkZXB0aCBvZiBpbnB1dCB2b2x1bWVcbiAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xuICAgICAgdGhpcy5sMV9kZWNheV9tdWwgPSB0eXBlb2YganNvbi5sMV9kZWNheV9tdWwgIT09ICd1bmRlZmluZWQnID8ganNvbi5sMV9kZWNheV9tdWwgOiAxLjA7XG4gICAgICB0aGlzLmwyX2RlY2F5X211bCA9IHR5cGVvZiBqc29uLmwyX2RlY2F5X211bCAhPT0gJ3VuZGVmaW5lZCcgPyBqc29uLmwyX2RlY2F5X211bCA6IDEuMDtcbiAgICAgIHRoaXMucGFkID0gdHlwZW9mIGpzb24ucGFkICE9PSAndW5kZWZpbmVkJyA/IGpzb24ucGFkIDogMDtcbiAgICAgIGZvcih2YXIgaT0wO2k8anNvbi5maWx0ZXJzLmxlbmd0aDtpKyspIHtcbiAgICAgICAgdmFyIHYgPSBuZXcgVm9sKDAsMCwwLDApO1xuICAgICAgICB2LmZyb21KU09OKGpzb24uZmlsdGVyc1tpXSk7XG4gICAgICAgIHRoaXMuZmlsdGVycy5wdXNoKHYpO1xuICAgICAgfVxuICAgICAgdGhpcy5iaWFzZXMgPSBuZXcgVm9sKDAsMCwwLDApO1xuICAgICAgdGhpcy5iaWFzZXMuZnJvbUpTT04oanNvbi5iaWFzZXMpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBGdWxseUNvbm5MYXllciA9IGZ1bmN0aW9uKG9wdCkge1xuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyByZXF1aXJlZFxuICAgIC8vIG9rIGZpbmUgd2Ugd2lsbCBhbGxvdyAnZmlsdGVycycgYXMgdGhlIHdvcmQgYXMgd2VsbFxuICAgIHRoaXMub3V0X2RlcHRoID0gdHlwZW9mIG9wdC5udW1fbmV1cm9ucyAhPT0gJ3VuZGVmaW5lZCcgPyBvcHQubnVtX25ldXJvbnMgOiBvcHQuZmlsdGVycztcblxuICAgIC8vIG9wdGlvbmFsIFxuICAgIHRoaXMubDFfZGVjYXlfbXVsID0gdHlwZW9mIG9wdC5sMV9kZWNheV9tdWwgIT09ICd1bmRlZmluZWQnID8gb3B0LmwxX2RlY2F5X211bCA6IDAuMDtcbiAgICB0aGlzLmwyX2RlY2F5X211bCA9IHR5cGVvZiBvcHQubDJfZGVjYXlfbXVsICE9PSAndW5kZWZpbmVkJyA/IG9wdC5sMl9kZWNheV9tdWwgOiAxLjA7XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIHRoaXMubnVtX2lucHV0cyA9IG9wdC5pbl9zeCAqIG9wdC5pbl9zeSAqIG9wdC5pbl9kZXB0aDtcbiAgICB0aGlzLm91dF9zeCA9IDE7XG4gICAgdGhpcy5vdXRfc3kgPSAxO1xuICAgIHRoaXMubGF5ZXJfdHlwZSA9ICdmYyc7XG5cbiAgICAvLyBpbml0aWFsaXphdGlvbnNcbiAgICB2YXIgYmlhcyA9IHR5cGVvZiBvcHQuYmlhc19wcmVmICE9PSAndW5kZWZpbmVkJyA/IG9wdC5iaWFzX3ByZWYgOiAwLjA7XG4gICAgdGhpcy5maWx0ZXJzID0gW107XG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aCA7aSsrKSB7IHRoaXMuZmlsdGVycy5wdXNoKG5ldyBWb2woMSwgMSwgdGhpcy5udW1faW5wdXRzKSk7IH1cbiAgICB0aGlzLmJpYXNlcyA9IG5ldyBWb2woMSwgMSwgdGhpcy5vdXRfZGVwdGgsIGJpYXMpO1xuICB9XG5cbiAgRnVsbHlDb25uTGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG4gICAgICB2YXIgQSA9IG5ldyBWb2woMSwgMSwgdGhpcy5vdXRfZGVwdGgsIDAuMCk7XG4gICAgICB2YXIgVncgPSBWLnc7XG4gICAgICBmb3IodmFyIGk9MDtpPHRoaXMub3V0X2RlcHRoO2krKykge1xuICAgICAgICB2YXIgYSA9IDAuMDtcbiAgICAgICAgdmFyIHdpID0gdGhpcy5maWx0ZXJzW2ldLnc7XG4gICAgICAgIGZvcih2YXIgZD0wO2Q8dGhpcy5udW1faW5wdXRzO2QrKykge1xuICAgICAgICAgIGEgKz0gVndbZF0gKiB3aVtkXTsgLy8gZm9yIGVmZmljaWVuY3kgdXNlIFZvbHMgZGlyZWN0bHkgZm9yIG5vd1xuICAgICAgICB9XG4gICAgICAgIGEgKz0gdGhpcy5iaWFzZXMud1tpXTtcbiAgICAgICAgQS53W2ldID0gYTtcbiAgICAgIH1cbiAgICAgIHRoaXMub3V0X2FjdCA9IEE7XG4gICAgICByZXR1cm4gdGhpcy5vdXRfYWN0O1xuICAgIH0sXG4gICAgYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIFYgPSB0aGlzLmluX2FjdDtcbiAgICAgIFYuZHcgPSBnbG9iYWwuemVyb3MoVi53Lmxlbmd0aCk7IC8vIHplcm8gb3V0IHRoZSBncmFkaWVudCBpbiBpbnB1dCBWb2xcbiAgICAgIFxuICAgICAgLy8gY29tcHV0ZSBncmFkaWVudCB3cnQgd2VpZ2h0cyBhbmQgZGF0YVxuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aDtpKyspIHtcbiAgICAgICAgdmFyIHRmaSA9IHRoaXMuZmlsdGVyc1tpXTtcbiAgICAgICAgdmFyIGNoYWluX2dyYWQgPSB0aGlzLm91dF9hY3QuZHdbaV07XG4gICAgICAgIGZvcih2YXIgZD0wO2Q8dGhpcy5udW1faW5wdXRzO2QrKykge1xuICAgICAgICAgIFYuZHdbZF0gKz0gdGZpLndbZF0qY2hhaW5fZ3JhZDsgLy8gZ3JhZCB3cnQgaW5wdXQgZGF0YVxuICAgICAgICAgIHRmaS5kd1tkXSArPSBWLndbZF0qY2hhaW5fZ3JhZDsgLy8gZ3JhZCB3cnQgcGFyYW1zXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iaWFzZXMuZHdbaV0gKz0gY2hhaW5fZ3JhZDtcbiAgICAgIH1cbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXNwb25zZSA9IFtdO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aDtpKyspIHtcbiAgICAgICAgcmVzcG9uc2UucHVzaCh7cGFyYW1zOiB0aGlzLmZpbHRlcnNbaV0udywgZ3JhZHM6IHRoaXMuZmlsdGVyc1tpXS5kdywgbDFfZGVjYXlfbXVsOiB0aGlzLmwxX2RlY2F5X211bCwgbDJfZGVjYXlfbXVsOiB0aGlzLmwyX2RlY2F5X211bH0pO1xuICAgICAgfVxuICAgICAgcmVzcG9uc2UucHVzaCh7cGFyYW1zOiB0aGlzLmJpYXNlcy53LCBncmFkczogdGhpcy5iaWFzZXMuZHcsIGwxX2RlY2F5X211bDogMC4wLCBsMl9kZWNheV9tdWw6IDAuMH0pO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBqc29uID0ge307XG4gICAgICBqc29uLm91dF9kZXB0aCA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAganNvbi5vdXRfc3ggPSB0aGlzLm91dF9zeDtcbiAgICAgIGpzb24ub3V0X3N5ID0gdGhpcy5vdXRfc3k7XG4gICAgICBqc29uLmxheWVyX3R5cGUgPSB0aGlzLmxheWVyX3R5cGU7XG4gICAgICBqc29uLm51bV9pbnB1dHMgPSB0aGlzLm51bV9pbnB1dHM7XG4gICAgICBqc29uLmwxX2RlY2F5X211bCA9IHRoaXMubDFfZGVjYXlfbXVsO1xuICAgICAganNvbi5sMl9kZWNheV9tdWwgPSB0aGlzLmwyX2RlY2F5X211bDtcbiAgICAgIGpzb24uZmlsdGVycyA9IFtdO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLmZpbHRlcnMubGVuZ3RoO2krKykge1xuICAgICAgICBqc29uLmZpbHRlcnMucHVzaCh0aGlzLmZpbHRlcnNbaV0udG9KU09OKCkpO1xuICAgICAgfVxuICAgICAganNvbi5iaWFzZXMgPSB0aGlzLmJpYXNlcy50b0pTT04oKTtcbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0sXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgIHRoaXMub3V0X2RlcHRoID0ganNvbi5vdXRfZGVwdGg7XG4gICAgICB0aGlzLm91dF9zeCA9IGpzb24ub3V0X3N4O1xuICAgICAgdGhpcy5vdXRfc3kgPSBqc29uLm91dF9zeTtcbiAgICAgIHRoaXMubGF5ZXJfdHlwZSA9IGpzb24ubGF5ZXJfdHlwZTtcbiAgICAgIHRoaXMubnVtX2lucHV0cyA9IGpzb24ubnVtX2lucHV0cztcbiAgICAgIHRoaXMubDFfZGVjYXlfbXVsID0gdHlwZW9mIGpzb24ubDFfZGVjYXlfbXVsICE9PSAndW5kZWZpbmVkJyA/IGpzb24ubDFfZGVjYXlfbXVsIDogMS4wO1xuICAgICAgdGhpcy5sMl9kZWNheV9tdWwgPSB0eXBlb2YganNvbi5sMl9kZWNheV9tdWwgIT09ICd1bmRlZmluZWQnID8ganNvbi5sMl9kZWNheV9tdWwgOiAxLjA7XG4gICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcbiAgICAgIGZvcih2YXIgaT0wO2k8anNvbi5maWx0ZXJzLmxlbmd0aDtpKyspIHtcbiAgICAgICAgdmFyIHYgPSBuZXcgVm9sKDAsMCwwLDApO1xuICAgICAgICB2LmZyb21KU09OKGpzb24uZmlsdGVyc1tpXSk7XG4gICAgICAgIHRoaXMuZmlsdGVycy5wdXNoKHYpO1xuICAgICAgfVxuICAgICAgdGhpcy5iaWFzZXMgPSBuZXcgVm9sKDAsMCwwLDApO1xuICAgICAgdGhpcy5iaWFzZXMuZnJvbUpTT04oanNvbi5iaWFzZXMpO1xuICAgIH1cbiAgfVxuXG4gIGdsb2JhbC5Db252TGF5ZXIgPSBDb252TGF5ZXI7XG4gIGdsb2JhbC5GdWxseUNvbm5MYXllciA9IEZ1bGx5Q29ubkxheWVyO1xuICBcbn0pKGNvbnZuZXRqcyk7XG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgVm9sID0gZ2xvYmFsLlZvbDsgLy8gY29udmVuaWVuY2VcbiAgXG4gIHZhciBQb29sTGF5ZXIgPSBmdW5jdGlvbihvcHQpIHtcblxuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyByZXF1aXJlZFxuICAgIHRoaXMuc3ggPSBvcHQuc3g7IC8vIGZpbHRlciBzaXplXG4gICAgdGhpcy5pbl9kZXB0aCA9IG9wdC5pbl9kZXB0aDtcbiAgICB0aGlzLmluX3N4ID0gb3B0LmluX3N4O1xuICAgIHRoaXMuaW5fc3kgPSBvcHQuaW5fc3k7XG5cbiAgICAvLyBvcHRpb25hbFxuICAgIHRoaXMuc3kgPSB0eXBlb2Ygb3B0LnN5ICE9PSAndW5kZWZpbmVkJyA/IG9wdC5zeSA6IHRoaXMuc3g7XG4gICAgdGhpcy5zdHJpZGUgPSB0eXBlb2Ygb3B0LnN0cmlkZSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHQuc3RyaWRlIDogMjtcbiAgICB0aGlzLnBhZCA9IHR5cGVvZiBvcHQucGFkICE9PSAndW5kZWZpbmVkJyA/IG9wdC5wYWQgOiAwOyAvLyBhbW91bnQgb2YgMCBwYWRkaW5nIHRvIGFkZCBhcm91bmQgYm9yZGVycyBvZiBpbnB1dCB2b2x1bWVcblxuICAgIC8vIGNvbXB1dGVkXG4gICAgdGhpcy5vdXRfZGVwdGggPSB0aGlzLmluX2RlcHRoO1xuICAgIHRoaXMub3V0X3N4ID0gTWF0aC5mbG9vcigodGhpcy5pbl9zeCArIHRoaXMucGFkICogMiAtIHRoaXMuc3gpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICB0aGlzLm91dF9zeSA9IE1hdGguZmxvb3IoKHRoaXMuaW5fc3kgKyB0aGlzLnBhZCAqIDIgLSB0aGlzLnN5KSAvIHRoaXMuc3RyaWRlICsgMSk7XG4gICAgdGhpcy5sYXllcl90eXBlID0gJ3Bvb2wnO1xuICAgIC8vIHN0b3JlIHN3aXRjaGVzIGZvciB4LHkgY29vcmRpbmF0ZXMgZm9yIHdoZXJlIHRoZSBtYXggY29tZXMgZnJvbSwgZm9yIGVhY2ggb3V0cHV0IG5ldXJvblxuICAgIHRoaXMuc3dpdGNoeCA9IGdsb2JhbC56ZXJvcyh0aGlzLm91dF9zeCp0aGlzLm91dF9zeSp0aGlzLm91dF9kZXB0aCk7XG4gICAgdGhpcy5zd2l0Y2h5ID0gZ2xvYmFsLnplcm9zKHRoaXMub3V0X3N4KnRoaXMub3V0X3N5KnRoaXMub3V0X2RlcHRoKTtcbiAgfVxuXG4gIFBvb2xMYXllci5wcm90b3R5cGUgPSB7XG4gICAgZm9yd2FyZDogZnVuY3Rpb24oViwgaXNfdHJhaW5pbmcpIHtcbiAgICAgIHRoaXMuaW5fYWN0ID0gVjtcblxuICAgICAgdmFyIEEgPSBuZXcgVm9sKHRoaXMub3V0X3N4LCB0aGlzLm91dF9zeSwgdGhpcy5vdXRfZGVwdGgsIDAuMCk7XG4gICAgICBcbiAgICAgIHZhciBuPTA7IC8vIGEgY291bnRlciBmb3Igc3dpdGNoZXNcbiAgICAgIGZvcih2YXIgZD0wO2Q8dGhpcy5vdXRfZGVwdGg7ZCsrKSB7XG4gICAgICAgIHZhciB4ID0gLXRoaXMucGFkO1xuICAgICAgICB2YXIgeSA9IC10aGlzLnBhZDtcbiAgICAgICAgZm9yKHZhciBheD0wOyBheDx0aGlzLm91dF9zeDsgeCs9dGhpcy5zdHJpZGUsYXgrKykge1xuICAgICAgICAgIHkgPSAtdGhpcy5wYWQ7XG4gICAgICAgICAgZm9yKHZhciBheT0wOyBheTx0aGlzLm91dF9zeTsgeSs9dGhpcy5zdHJpZGUsYXkrKykge1xuXG4gICAgICAgICAgICAvLyBjb252b2x2ZSBjZW50ZXJlZCBhdCB0aGlzIHBhcnRpY3VsYXIgbG9jYXRpb25cbiAgICAgICAgICAgIHZhciBhID0gLTk5OTk5OyAvLyBob3BlZnVsbHkgc21hbGwgZW5vdWdoIDtcXFxuICAgICAgICAgICAgdmFyIHdpbng9LTEsd2lueT0tMTtcbiAgICAgICAgICAgIGZvcih2YXIgZng9MDtmeDx0aGlzLnN4O2Z4KyspIHtcbiAgICAgICAgICAgICAgZm9yKHZhciBmeT0wO2Z5PHRoaXMuc3k7ZnkrKykge1xuICAgICAgICAgICAgICAgIHZhciBveSA9IHkrZnk7XG4gICAgICAgICAgICAgICAgdmFyIG94ID0geCtmeDtcbiAgICAgICAgICAgICAgICBpZihveT49MCAmJiBveTxWLnN5ICYmIG94Pj0wICYmIG94PFYuc3gpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB2ID0gVi5nZXQob3gsIG95LCBkKTtcbiAgICAgICAgICAgICAgICAgIC8vIHBlcmZvcm0gbWF4IHBvb2xpbmcgYW5kIHN0b3JlIHBvaW50ZXJzIHRvIHdoZXJlXG4gICAgICAgICAgICAgICAgICAvLyB0aGUgbWF4IGNhbWUgZnJvbS4gVGhpcyB3aWxsIHNwZWVkIHVwIGJhY2twcm9wIFxuICAgICAgICAgICAgICAgICAgLy8gYW5kIGNhbiBoZWxwIG1ha2UgbmljZSB2aXN1YWxpemF0aW9ucyBpbiBmdXR1cmVcbiAgICAgICAgICAgICAgICAgIGlmKHYgPiBhKSB7IGEgPSB2OyB3aW54PW94OyB3aW55PW95O31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3dpdGNoeFtuXSA9IHdpbng7XG4gICAgICAgICAgICB0aGlzLnN3aXRjaHlbbl0gPSB3aW55O1xuICAgICAgICAgICAgbisrO1xuICAgICAgICAgICAgQS5zZXQoYXgsIGF5LCBkLCBhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMub3V0X2FjdCA9IEE7XG4gICAgICByZXR1cm4gdGhpcy5vdXRfYWN0O1xuICAgIH0sXG4gICAgYmFja3dhcmQ6IGZ1bmN0aW9uKCkgeyBcbiAgICAgIC8vIHBvb2xpbmcgbGF5ZXJzIGhhdmUgbm8gcGFyYW1ldGVycywgc28gc2ltcGx5IGNvbXB1dGUgXG4gICAgICAvLyBncmFkaWVudCB3cnQgZGF0YSBoZXJlXG4gICAgICB2YXIgViA9IHRoaXMuaW5fYWN0O1xuICAgICAgVi5kdyA9IGdsb2JhbC56ZXJvcyhWLncubGVuZ3RoKTsgLy8gemVybyBvdXQgZ3JhZGllbnQgd3J0IGRhdGFcbiAgICAgIHZhciBBID0gdGhpcy5vdXRfYWN0OyAvLyBjb21wdXRlZCBpbiBmb3J3YXJkIHBhc3MgXG5cbiAgICAgIHZhciBuID0gMDtcbiAgICAgIGZvcih2YXIgZD0wO2Q8dGhpcy5vdXRfZGVwdGg7ZCsrKSB7XG4gICAgICAgIHZhciB4ID0gLXRoaXMucGFkO1xuICAgICAgICB2YXIgeSA9IC10aGlzLnBhZDtcbiAgICAgICAgZm9yKHZhciBheD0wOyBheDx0aGlzLm91dF9zeDsgeCs9dGhpcy5zdHJpZGUsYXgrKykge1xuICAgICAgICAgIHkgPSAtdGhpcy5wYWQ7XG4gICAgICAgICAgZm9yKHZhciBheT0wOyBheTx0aGlzLm91dF9zeTsgeSs9dGhpcy5zdHJpZGUsYXkrKykge1xuXG4gICAgICAgICAgICB2YXIgY2hhaW5fZ3JhZCA9IHRoaXMub3V0X2FjdC5nZXRfZ3JhZChheCxheSxkKTtcbiAgICAgICAgICAgIFYuYWRkX2dyYWQodGhpcy5zd2l0Y2h4W25dLCB0aGlzLnN3aXRjaHlbbl0sIGQsIGNoYWluX2dyYWQpO1xuICAgICAgICAgICAgbisrO1xuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXRQYXJhbXNBbmRHcmFkczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfSxcbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGpzb24gPSB7fTtcbiAgICAgIGpzb24uc3ggPSB0aGlzLnN4O1xuICAgICAganNvbi5zeSA9IHRoaXMuc3k7XG4gICAgICBqc29uLnN0cmlkZSA9IHRoaXMuc3RyaWRlO1xuICAgICAganNvbi5pbl9kZXB0aCA9IHRoaXMuaW5fZGVwdGg7XG4gICAgICBqc29uLm91dF9kZXB0aCA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAganNvbi5vdXRfc3ggPSB0aGlzLm91dF9zeDtcbiAgICAgIGpzb24ub3V0X3N5ID0gdGhpcy5vdXRfc3k7XG4gICAgICBqc29uLmxheWVyX3R5cGUgPSB0aGlzLmxheWVyX3R5cGU7XG4gICAgICBqc29uLnBhZCA9IHRoaXMucGFkO1xuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5vdXRfZGVwdGggPSBqc29uLm91dF9kZXB0aDtcbiAgICAgIHRoaXMub3V0X3N4ID0ganNvbi5vdXRfc3g7XG4gICAgICB0aGlzLm91dF9zeSA9IGpzb24ub3V0X3N5O1xuICAgICAgdGhpcy5sYXllcl90eXBlID0ganNvbi5sYXllcl90eXBlO1xuICAgICAgdGhpcy5zeCA9IGpzb24uc3g7XG4gICAgICB0aGlzLnN5ID0ganNvbi5zeTtcbiAgICAgIHRoaXMuc3RyaWRlID0ganNvbi5zdHJpZGU7XG4gICAgICB0aGlzLmluX2RlcHRoID0ganNvbi5pbl9kZXB0aDtcbiAgICAgIHRoaXMucGFkID0gdHlwZW9mIGpzb24ucGFkICE9PSAndW5kZWZpbmVkJyA/IGpzb24ucGFkIDogMDsgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICAgIHRoaXMuc3dpdGNoeCA9IGdsb2JhbC56ZXJvcyh0aGlzLm91dF9zeCp0aGlzLm91dF9zeSp0aGlzLm91dF9kZXB0aCk7IC8vIG5lZWQgdG8gcmUtaW5pdCB0aGVzZSBhcHByb3ByaWF0ZWx5XG4gICAgICB0aGlzLnN3aXRjaHkgPSBnbG9iYWwuemVyb3ModGhpcy5vdXRfc3gqdGhpcy5vdXRfc3kqdGhpcy5vdXRfZGVwdGgpO1xuICAgIH1cbiAgfVxuXG4gIGdsb2JhbC5Qb29sTGF5ZXIgPSBQb29sTGF5ZXI7XG5cbn0pKGNvbnZuZXRqcyk7XG5cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBWb2wgPSBnbG9iYWwuVm9sOyAvLyBjb252ZW5pZW5jZVxuICBcbiAgdmFyIElucHV0TGF5ZXIgPSBmdW5jdGlvbihvcHQpIHtcbiAgICB2YXIgb3B0ID0gb3B0IHx8IHt9O1xuXG4gICAgLy8gdGhpcyBpcyBhIGJpdCBzaWxseSBidXQgbGV0cyBhbGxvdyBwZW9wbGUgdG8gc3BlY2lmeSBlaXRoZXIgaW5zIG9yIG91dHNcbiAgICB0aGlzLm91dF9zeCA9IHR5cGVvZiBvcHQub3V0X3N4ICE9PSAndW5kZWZpbmVkJyA/IG9wdC5vdXRfc3ggOiBvcHQuaW5fc3g7XG4gICAgdGhpcy5vdXRfc3kgPSB0eXBlb2Ygb3B0Lm91dF9zeSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHQub3V0X3N5IDogb3B0LmluX3N5O1xuICAgIHRoaXMub3V0X2RlcHRoID0gdHlwZW9mIG9wdC5vdXRfZGVwdGggIT09ICd1bmRlZmluZWQnID8gb3B0Lm91dF9kZXB0aCA6IG9wdC5pbl9kZXB0aDtcbiAgICB0aGlzLmxheWVyX3R5cGUgPSAnaW5wdXQnO1xuICB9XG4gIElucHV0TGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG4gICAgICB0aGlzLm91dF9hY3QgPSBWO1xuICAgICAgcmV0dXJuIHRoaXMub3V0X2FjdDsgLy8gZHVtbXkgaWRlbnRpdHkgZnVuY3Rpb24gZm9yIG5vd1xuICAgIH0sXG4gICAgYmFja3dhcmQ6IGZ1bmN0aW9uKCkgeyB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuICAgIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIganNvbiA9IHt9O1xuICAgICAganNvbi5vdXRfZGVwdGggPSB0aGlzLm91dF9kZXB0aDtcbiAgICAgIGpzb24ub3V0X3N4ID0gdGhpcy5vdXRfc3g7XG4gICAgICBqc29uLm91dF9zeSA9IHRoaXMub3V0X3N5O1xuICAgICAganNvbi5sYXllcl90eXBlID0gdGhpcy5sYXllcl90eXBlO1xuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5vdXRfZGVwdGggPSBqc29uLm91dF9kZXB0aDtcbiAgICAgIHRoaXMub3V0X3N4ID0ganNvbi5vdXRfc3g7XG4gICAgICB0aGlzLm91dF9zeSA9IGpzb24ub3V0X3N5O1xuICAgICAgdGhpcy5sYXllcl90eXBlID0ganNvbi5sYXllcl90eXBlOyBcbiAgICB9XG4gIH1cblxuICBnbG9iYWwuSW5wdXRMYXllciA9IElucHV0TGF5ZXI7XG59KShjb252bmV0anMpO1xuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIFZvbCA9IGdsb2JhbC5Wb2w7IC8vIGNvbnZlbmllbmNlXG4gIFxuICAvLyBMYXllcnMgdGhhdCBpbXBsZW1lbnQgYSBsb3NzLiBDdXJyZW50bHkgdGhlc2UgYXJlIHRoZSBsYXllcnMgdGhhdCBcbiAgLy8gY2FuIGluaXRpYXRlIGEgYmFja3dhcmQoKSBwYXNzLiBJbiBmdXR1cmUgd2UgcHJvYmFibHkgd2FudCBhIG1vcmUgXG4gIC8vIGZsZXhpYmxlIHN5c3RlbSB0aGF0IGNhbiBhY2NvbW9kYXRlIG11bHRpcGxlIGxvc3NlcyB0byBkbyBtdWx0aS10YXNrXG4gIC8vIGxlYXJuaW5nLCBhbmQgc3R1ZmYgbGlrZSB0aGF0LiBCdXQgZm9yIG5vdywgb25lIG9mIHRoZSBsYXllcnMgaW4gdGhpc1xuICAvLyBmaWxlIG11c3QgYmUgdGhlIGZpbmFsIGxheWVyIGluIGEgTmV0LlxuXG4gIC8vIFRoaXMgaXMgYSBjbGFzc2lmaWVyLCB3aXRoIE4gZGlzY3JldGUgY2xhc3NlcyBmcm9tIDAgdG8gTi0xXG4gIC8vIGl0IGdldHMgYSBzdHJlYW0gb2YgTiBpbmNvbWluZyBudW1iZXJzIGFuZCBjb21wdXRlcyB0aGUgc29mdG1heFxuICAvLyBmdW5jdGlvbiAoZXhwb25lbnRpYXRlIGFuZCBub3JtYWxpemUgdG8gc3VtIHRvIDEgYXMgcHJvYmFiaWxpdGllcyBzaG91bGQpXG4gIHZhciBTb2Z0bWF4TGF5ZXIgPSBmdW5jdGlvbihvcHQpIHtcbiAgICB2YXIgb3B0ID0gb3B0IHx8IHt9O1xuXG4gICAgLy8gY29tcHV0ZWRcbiAgICB0aGlzLm51bV9pbnB1dHMgPSBvcHQuaW5fc3ggKiBvcHQuaW5fc3kgKiBvcHQuaW5fZGVwdGg7XG4gICAgdGhpcy5vdXRfZGVwdGggPSB0aGlzLm51bV9pbnB1dHM7XG4gICAgdGhpcy5vdXRfc3ggPSAxO1xuICAgIHRoaXMub3V0X3N5ID0gMTtcbiAgICB0aGlzLmxheWVyX3R5cGUgPSAnc29mdG1heCc7XG4gIH1cblxuICBTb2Z0bWF4TGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG5cbiAgICAgIHZhciBBID0gbmV3IFZvbCgxLCAxLCB0aGlzLm91dF9kZXB0aCwgMC4wKTtcblxuICAgICAgLy8gY29tcHV0ZSBtYXggYWN0aXZhdGlvblxuICAgICAgdmFyIGFzID0gVi53O1xuICAgICAgdmFyIGFtYXggPSBWLndbMF07XG4gICAgICBmb3IodmFyIGk9MTtpPHRoaXMub3V0X2RlcHRoO2krKykge1xuICAgICAgICBpZihhc1tpXSA+IGFtYXgpIGFtYXggPSBhc1tpXTtcbiAgICAgIH1cblxuICAgICAgLy8gY29tcHV0ZSBleHBvbmVudGlhbHMgKGNhcmVmdWxseSB0byBub3QgYmxvdyB1cClcbiAgICAgIHZhciBlcyA9IGdsb2JhbC56ZXJvcyh0aGlzLm91dF9kZXB0aCk7XG4gICAgICB2YXIgZXN1bSA9IDAuMDtcbiAgICAgIGZvcih2YXIgaT0wO2k8dGhpcy5vdXRfZGVwdGg7aSsrKSB7XG4gICAgICAgIHZhciBlID0gTWF0aC5leHAoYXNbaV0gLSBhbWF4KTtcbiAgICAgICAgZXN1bSArPSBlO1xuICAgICAgICBlc1tpXSA9IGU7XG4gICAgICB9XG5cbiAgICAgIC8vIG5vcm1hbGl6ZSBhbmQgb3V0cHV0IHRvIHN1bSB0byBvbmVcbiAgICAgIGZvcih2YXIgaT0wO2k8dGhpcy5vdXRfZGVwdGg7aSsrKSB7XG4gICAgICAgIGVzW2ldIC89IGVzdW07XG4gICAgICAgIEEud1tpXSA9IGVzW2ldO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmVzID0gZXM7IC8vIHNhdmUgdGhlc2UgZm9yIGJhY2twcm9wXG4gICAgICB0aGlzLm91dF9hY3QgPSBBO1xuICAgICAgcmV0dXJuIHRoaXMub3V0X2FjdDtcbiAgICB9LFxuICAgIGJhY2t3YXJkOiBmdW5jdGlvbih5KSB7XG5cbiAgICAgIC8vIGNvbXB1dGUgYW5kIGFjY3VtdWxhdGUgZ3JhZGllbnQgd3J0IHdlaWdodHMgYW5kIGJpYXMgb2YgdGhpcyBsYXllclxuICAgICAgdmFyIHggPSB0aGlzLmluX2FjdDtcbiAgICAgIHguZHcgPSBnbG9iYWwuemVyb3MoeC53Lmxlbmd0aCk7IC8vIHplcm8gb3V0IHRoZSBncmFkaWVudCBvZiBpbnB1dCBWb2xcblxuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aDtpKyspIHtcbiAgICAgICAgdmFyIGluZGljYXRvciA9IGkgPT09IHkgPyAxLjAgOiAwLjA7XG4gICAgICAgIHZhciBtdWwgPSAtKGluZGljYXRvciAtIHRoaXMuZXNbaV0pO1xuICAgICAgICB4LmR3W2ldID0gbXVsO1xuICAgICAgfVxuXG4gICAgICAvLyBsb3NzIGlzIHRoZSBjbGFzcyBuZWdhdGl2ZSBsb2cgbGlrZWxpaG9vZFxuICAgICAgcmV0dXJuIC1NYXRoLmxvZyh0aGlzLmVzW3ldKTtcbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHsgXG4gICAgICByZXR1cm4gW107XG4gICAgfSxcbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGpzb24gPSB7fTtcbiAgICAgIGpzb24ub3V0X2RlcHRoID0gdGhpcy5vdXRfZGVwdGg7XG4gICAgICBqc29uLm91dF9zeCA9IHRoaXMub3V0X3N4O1xuICAgICAganNvbi5vdXRfc3kgPSB0aGlzLm91dF9zeTtcbiAgICAgIGpzb24ubGF5ZXJfdHlwZSA9IHRoaXMubGF5ZXJfdHlwZTtcbiAgICAgIGpzb24ubnVtX2lucHV0cyA9IHRoaXMubnVtX2lucHV0cztcbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0sXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgIHRoaXMub3V0X2RlcHRoID0ganNvbi5vdXRfZGVwdGg7XG4gICAgICB0aGlzLm91dF9zeCA9IGpzb24ub3V0X3N4O1xuICAgICAgdGhpcy5vdXRfc3kgPSBqc29uLm91dF9zeTtcbiAgICAgIHRoaXMubGF5ZXJfdHlwZSA9IGpzb24ubGF5ZXJfdHlwZTtcbiAgICAgIHRoaXMubnVtX2lucHV0cyA9IGpzb24ubnVtX2lucHV0cztcbiAgICB9XG4gIH1cblxuICAvLyBpbXBsZW1lbnRzIGFuIEwyIHJlZ3Jlc3Npb24gY29zdCBsYXllcixcbiAgLy8gc28gcGVuYWxpemVzIFxcc3VtX2kofHx4X2kgLSB5X2l8fF4yKSwgd2hlcmUgeCBpcyBpdHMgaW5wdXRcbiAgLy8gYW5kIHkgaXMgdGhlIHVzZXItcHJvdmlkZWQgYXJyYXkgb2YgXCJjb3JyZWN0XCIgdmFsdWVzLlxuICB2YXIgUmVncmVzc2lvbkxheWVyID0gZnVuY3Rpb24ob3B0KSB7XG4gICAgdmFyIG9wdCA9IG9wdCB8fCB7fTtcblxuICAgIC8vIGNvbXB1dGVkXG4gICAgdGhpcy5udW1faW5wdXRzID0gb3B0LmluX3N4ICogb3B0LmluX3N5ICogb3B0LmluX2RlcHRoO1xuICAgIHRoaXMub3V0X2RlcHRoID0gdGhpcy5udW1faW5wdXRzO1xuICAgIHRoaXMub3V0X3N4ID0gMTtcbiAgICB0aGlzLm91dF9zeSA9IDE7XG4gICAgdGhpcy5sYXllcl90eXBlID0gJ3JlZ3Jlc3Npb24nO1xuICB9XG5cbiAgUmVncmVzc2lvbkxheWVyLnByb3RvdHlwZSA9IHtcbiAgICBmb3J3YXJkOiBmdW5jdGlvbihWLCBpc190cmFpbmluZykge1xuICAgICAgdGhpcy5pbl9hY3QgPSBWO1xuICAgICAgdGhpcy5vdXRfYWN0ID0gVjtcbiAgICAgIHJldHVybiBWOyAvLyBpZGVudGl0eSBmdW5jdGlvblxuICAgIH0sXG4gICAgLy8geSBpcyBhIGxpc3QgaGVyZSBvZiBzaXplIG51bV9pbnB1dHNcbiAgICBiYWNrd2FyZDogZnVuY3Rpb24oeSkgeyBcblxuICAgICAgLy8gY29tcHV0ZSBhbmQgYWNjdW11bGF0ZSBncmFkaWVudCB3cnQgd2VpZ2h0cyBhbmQgYmlhcyBvZiB0aGlzIGxheWVyXG4gICAgICB2YXIgeCA9IHRoaXMuaW5fYWN0O1xuICAgICAgeC5kdyA9IGdsb2JhbC56ZXJvcyh4LncubGVuZ3RoKTsgLy8gemVybyBvdXQgdGhlIGdyYWRpZW50IG9mIGlucHV0IFZvbFxuICAgICAgdmFyIGxvc3MgPSAwLjA7XG4gICAgICBpZih5IGluc3RhbmNlb2YgQXJyYXkgfHwgeSBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkge1xuICAgICAgICBmb3IodmFyIGk9MDtpPHRoaXMub3V0X2RlcHRoO2krKykge1xuICAgICAgICAgIHZhciBkeSA9IHgud1tpXSAtIHlbaV07XG4gICAgICAgICAgeC5kd1tpXSA9IGR5O1xuICAgICAgICAgIGxvc3MgKz0gMipkeSpkeTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYXNzdW1lIGl0IGlzIGEgc3RydWN0IHdpdGggZW50cmllcyAuZGltIGFuZCAudmFsXG4gICAgICAgIC8vIGFuZCB3ZSBwYXNzIGdyYWRpZW50IG9ubHkgYWxvbmcgZGltZW5zaW9uIGRpbSB0byBiZSBlcXVhbCB0byB2YWxcbiAgICAgICAgdmFyIGkgPSB5LmRpbTtcbiAgICAgICAgdmFyIHlpID0geS52YWw7XG4gICAgICAgIHZhciBkeSA9IHgud1tpXSAtIHlpO1xuICAgICAgICB4LmR3W2ldID0gZHk7XG4gICAgICAgIGxvc3MgKz0gMipkeSpkeTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb3NzO1xuICAgIH0sXG4gICAgZ2V0UGFyYW1zQW5kR3JhZHM6IGZ1bmN0aW9uKCkgeyBcbiAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuICAgIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIganNvbiA9IHt9O1xuICAgICAganNvbi5vdXRfZGVwdGggPSB0aGlzLm91dF9kZXB0aDtcbiAgICAgIGpzb24ub3V0X3N4ID0gdGhpcy5vdXRfc3g7XG4gICAgICBqc29uLm91dF9zeSA9IHRoaXMub3V0X3N5O1xuICAgICAganNvbi5sYXllcl90eXBlID0gdGhpcy5sYXllcl90eXBlO1xuICAgICAganNvbi5udW1faW5wdXRzID0gdGhpcy5udW1faW5wdXRzO1xuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5vdXRfZGVwdGggPSBqc29uLm91dF9kZXB0aDtcbiAgICAgIHRoaXMub3V0X3N4ID0ganNvbi5vdXRfc3g7XG4gICAgICB0aGlzLm91dF9zeSA9IGpzb24ub3V0X3N5O1xuICAgICAgdGhpcy5sYXllcl90eXBlID0ganNvbi5sYXllcl90eXBlO1xuICAgICAgdGhpcy5udW1faW5wdXRzID0ganNvbi5udW1faW5wdXRzO1xuICAgIH1cbiAgfVxuXG4gIHZhciBTVk1MYXllciA9IGZ1bmN0aW9uKG9wdCkge1xuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIHRoaXMubnVtX2lucHV0cyA9IG9wdC5pbl9zeCAqIG9wdC5pbl9zeSAqIG9wdC5pbl9kZXB0aDtcbiAgICB0aGlzLm91dF9kZXB0aCA9IHRoaXMubnVtX2lucHV0cztcbiAgICB0aGlzLm91dF9zeCA9IDE7XG4gICAgdGhpcy5vdXRfc3kgPSAxO1xuICAgIHRoaXMubGF5ZXJfdHlwZSA9ICdzdm0nO1xuICB9XG5cbiAgU1ZNTGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG4gICAgICB0aGlzLm91dF9hY3QgPSBWOyAvLyBub3RoaW5nIHRvIGRvLCBvdXRwdXQgcmF3IHNjb3Jlc1xuICAgICAgcmV0dXJuIFY7XG4gICAgfSxcbiAgICBiYWNrd2FyZDogZnVuY3Rpb24oeSkge1xuXG4gICAgICAvLyBjb21wdXRlIGFuZCBhY2N1bXVsYXRlIGdyYWRpZW50IHdydCB3ZWlnaHRzIGFuZCBiaWFzIG9mIHRoaXMgbGF5ZXJcbiAgICAgIHZhciB4ID0gdGhpcy5pbl9hY3Q7XG4gICAgICB4LmR3ID0gZ2xvYmFsLnplcm9zKHgudy5sZW5ndGgpOyAvLyB6ZXJvIG91dCB0aGUgZ3JhZGllbnQgb2YgaW5wdXQgVm9sXG5cbiAgICAgIHZhciB5c2NvcmUgPSB4LndbeV07IC8vIHNjb3JlIG9mIGdyb3VuZCB0cnV0aFxuICAgICAgdmFyIG1hcmdpbiA9IDEuMDtcbiAgICAgIHZhciBsb3NzID0gMC4wO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLm91dF9kZXB0aDtpKyspIHtcbiAgICAgICAgaWYoLXlzY29yZSArIHgud1tpXSArIG1hcmdpbiA+IDApIHtcbiAgICAgICAgICAvLyB2aW9sYXRpbmcgZXhhbXBsZSwgYXBwbHkgbG9zc1xuICAgICAgICAgIC8vIEkgbG92ZSBoaW5nZSBsb3NzLCBieSB0aGUgd2F5LiBUcnVseS5cbiAgICAgICAgICAvLyBTZXJpb3VzbHksIGNvbXBhcmUgdGhpcyBTVk0gY29kZSB3aXRoIFNvZnRtYXggZm9yd2FyZCBBTkQgYmFja3Byb3AgY29kZSBhYm92ZVxuICAgICAgICAgIC8vIGl0J3MgY2xlYXIgd2hpY2ggb25lIGlzIHN1cGVyaW9yLCBub3Qgb25seSBpbiBjb2RlLCBzaW1wbGljaXR5XG4gICAgICAgICAgLy8gYW5kIGJlYXV0eSwgYnV0IGFsc28gaW4gcHJhY3RpY2UuXG4gICAgICAgICAgeC5kd1tpXSArPSAxO1xuICAgICAgICAgIHguZHdbeV0gLT0gMTtcbiAgICAgICAgICBsb3NzICs9IC15c2NvcmUgKyB4LndbaV0gKyBtYXJnaW47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGxvc3M7XG4gICAgfSxcbiAgICBnZXRQYXJhbXNBbmRHcmFkczogZnVuY3Rpb24oKSB7IFxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0sXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBqc29uID0ge307XG4gICAgICBqc29uLm91dF9kZXB0aCA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAganNvbi5vdXRfc3ggPSB0aGlzLm91dF9zeDtcbiAgICAgIGpzb24ub3V0X3N5ID0gdGhpcy5vdXRfc3k7XG4gICAgICBqc29uLmxheWVyX3R5cGUgPSB0aGlzLmxheWVyX3R5cGU7XG4gICAgICBqc29uLm51bV9pbnB1dHMgPSB0aGlzLm51bV9pbnB1dHM7XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9LFxuICAgIGZyb21KU09OOiBmdW5jdGlvbihqc29uKSB7XG4gICAgICB0aGlzLm91dF9kZXB0aCA9IGpzb24ub3V0X2RlcHRoO1xuICAgICAgdGhpcy5vdXRfc3ggPSBqc29uLm91dF9zeDtcbiAgICAgIHRoaXMub3V0X3N5ID0ganNvbi5vdXRfc3k7XG4gICAgICB0aGlzLmxheWVyX3R5cGUgPSBqc29uLmxheWVyX3R5cGU7XG4gICAgICB0aGlzLm51bV9pbnB1dHMgPSBqc29uLm51bV9pbnB1dHM7XG4gICAgfVxuICB9XG4gIFxuICBnbG9iYWwuUmVncmVzc2lvbkxheWVyID0gUmVncmVzc2lvbkxheWVyO1xuICBnbG9iYWwuU29mdG1heExheWVyID0gU29mdG1heExheWVyO1xuICBnbG9iYWwuU1ZNTGF5ZXIgPSBTVk1MYXllcjtcblxufSkoY29udm5ldGpzKTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIFZvbCA9IGdsb2JhbC5Wb2w7IC8vIGNvbnZlbmllbmNlXG4gIFxuICAvLyBJbXBsZW1lbnRzIFJlTFUgbm9ubGluZWFyaXR5IGVsZW1lbnR3aXNlXG4gIC8vIHggLT4gbWF4KDAsIHgpXG4gIC8vIHRoZSBvdXRwdXQgaXMgaW4gWzAsIGluZilcbiAgdmFyIFJlbHVMYXllciA9IGZ1bmN0aW9uKG9wdCkge1xuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIHRoaXMub3V0X3N4ID0gb3B0LmluX3N4O1xuICAgIHRoaXMub3V0X3N5ID0gb3B0LmluX3N5O1xuICAgIHRoaXMub3V0X2RlcHRoID0gb3B0LmluX2RlcHRoO1xuICAgIHRoaXMubGF5ZXJfdHlwZSA9ICdyZWx1JztcbiAgfVxuICBSZWx1TGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG4gICAgICB2YXIgVjIgPSBWLmNsb25lKCk7XG4gICAgICB2YXIgTiA9IFYudy5sZW5ndGg7XG4gICAgICB2YXIgVjJ3ID0gVjIudztcbiAgICAgIGZvcih2YXIgaT0wO2k8TjtpKyspIHsgXG4gICAgICAgIGlmKFYyd1tpXSA8IDApIFYyd1tpXSA9IDA7IC8vIHRocmVzaG9sZCBhdCAwXG4gICAgICB9XG4gICAgICB0aGlzLm91dF9hY3QgPSBWMjtcbiAgICAgIHJldHVybiB0aGlzLm91dF9hY3Q7XG4gICAgfSxcbiAgICBiYWNrd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgViA9IHRoaXMuaW5fYWN0OyAvLyB3ZSBuZWVkIHRvIHNldCBkdyBvZiB0aGlzXG4gICAgICB2YXIgVjIgPSB0aGlzLm91dF9hY3Q7XG4gICAgICB2YXIgTiA9IFYudy5sZW5ndGg7XG4gICAgICBWLmR3ID0gZ2xvYmFsLnplcm9zKE4pOyAvLyB6ZXJvIG91dCBncmFkaWVudCB3cnQgZGF0YVxuICAgICAgZm9yKHZhciBpPTA7aTxOO2krKykge1xuICAgICAgICBpZihWMi53W2ldIDw9IDApIFYuZHdbaV0gPSAwOyAvLyB0aHJlc2hvbGRcbiAgICAgICAgZWxzZSBWLmR3W2ldID0gVjIuZHdbaV07XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXRQYXJhbXNBbmRHcmFkczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfSxcbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGpzb24gPSB7fTtcbiAgICAgIGpzb24ub3V0X2RlcHRoID0gdGhpcy5vdXRfZGVwdGg7XG4gICAgICBqc29uLm91dF9zeCA9IHRoaXMub3V0X3N4O1xuICAgICAganNvbi5vdXRfc3kgPSB0aGlzLm91dF9zeTtcbiAgICAgIGpzb24ubGF5ZXJfdHlwZSA9IHRoaXMubGF5ZXJfdHlwZTtcbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0sXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgIHRoaXMub3V0X2RlcHRoID0ganNvbi5vdXRfZGVwdGg7XG4gICAgICB0aGlzLm91dF9zeCA9IGpzb24ub3V0X3N4O1xuICAgICAgdGhpcy5vdXRfc3kgPSBqc29uLm91dF9zeTtcbiAgICAgIHRoaXMubGF5ZXJfdHlwZSA9IGpzb24ubGF5ZXJfdHlwZTsgXG4gICAgfVxuICB9XG5cbiAgLy8gSW1wbGVtZW50cyBTaWdtb2lkIG5ub25saW5lYXJpdHkgZWxlbWVudHdpc2VcbiAgLy8geCAtPiAxLygxK2VeKC14KSlcbiAgLy8gc28gdGhlIG91dHB1dCBpcyBiZXR3ZWVuIDAgYW5kIDEuXG4gIHZhciBTaWdtb2lkTGF5ZXIgPSBmdW5jdGlvbihvcHQpIHtcbiAgICB2YXIgb3B0ID0gb3B0IHx8IHt9O1xuXG4gICAgLy8gY29tcHV0ZWRcbiAgICB0aGlzLm91dF9zeCA9IG9wdC5pbl9zeDtcbiAgICB0aGlzLm91dF9zeSA9IG9wdC5pbl9zeTtcbiAgICB0aGlzLm91dF9kZXB0aCA9IG9wdC5pbl9kZXB0aDtcbiAgICB0aGlzLmxheWVyX3R5cGUgPSAnc2lnbW9pZCc7XG4gIH1cbiAgU2lnbW9pZExheWVyLnByb3RvdHlwZSA9IHtcbiAgICBmb3J3YXJkOiBmdW5jdGlvbihWLCBpc190cmFpbmluZykge1xuICAgICAgdGhpcy5pbl9hY3QgPSBWO1xuICAgICAgdmFyIFYyID0gVi5jbG9uZUFuZFplcm8oKTtcbiAgICAgIHZhciBOID0gVi53Lmxlbmd0aDtcbiAgICAgIHZhciBWMncgPSBWMi53O1xuICAgICAgdmFyIFZ3ID0gVi53O1xuICAgICAgZm9yKHZhciBpPTA7aTxOO2krKykgeyBcbiAgICAgICAgVjJ3W2ldID0gMS4wLygxLjArTWF0aC5leHAoLVZ3W2ldKSk7XG4gICAgICB9XG4gICAgICB0aGlzLm91dF9hY3QgPSBWMjtcbiAgICAgIHJldHVybiB0aGlzLm91dF9hY3Q7XG4gICAgfSxcbiAgICBiYWNrd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgViA9IHRoaXMuaW5fYWN0OyAvLyB3ZSBuZWVkIHRvIHNldCBkdyBvZiB0aGlzXG4gICAgICB2YXIgVjIgPSB0aGlzLm91dF9hY3Q7XG4gICAgICB2YXIgTiA9IFYudy5sZW5ndGg7XG4gICAgICBWLmR3ID0gZ2xvYmFsLnplcm9zKE4pOyAvLyB6ZXJvIG91dCBncmFkaWVudCB3cnQgZGF0YVxuICAgICAgZm9yKHZhciBpPTA7aTxOO2krKykge1xuICAgICAgICB2YXIgdjJ3aSA9IFYyLndbaV07XG4gICAgICAgIFYuZHdbaV0gPSAgdjJ3aSAqICgxLjAgLSB2MndpKSAqIFYyLmR3W2ldO1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0UGFyYW1zQW5kR3JhZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0sXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBqc29uID0ge307XG4gICAgICBqc29uLm91dF9kZXB0aCA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAganNvbi5vdXRfc3ggPSB0aGlzLm91dF9zeDtcbiAgICAgIGpzb24ub3V0X3N5ID0gdGhpcy5vdXRfc3k7XG4gICAgICBqc29uLmxheWVyX3R5cGUgPSB0aGlzLmxheWVyX3R5cGU7XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9LFxuICAgIGZyb21KU09OOiBmdW5jdGlvbihqc29uKSB7XG4gICAgICB0aGlzLm91dF9kZXB0aCA9IGpzb24ub3V0X2RlcHRoO1xuICAgICAgdGhpcy5vdXRfc3ggPSBqc29uLm91dF9zeDtcbiAgICAgIHRoaXMub3V0X3N5ID0ganNvbi5vdXRfc3k7XG4gICAgICB0aGlzLmxheWVyX3R5cGUgPSBqc29uLmxheWVyX3R5cGU7IFxuICAgIH1cbiAgfVxuXG4gIC8vIEltcGxlbWVudHMgTWF4b3V0IG5ub25saW5lYXJpdHkgdGhhdCBjb21wdXRlc1xuICAvLyB4IC0+IG1heCh4KVxuICAvLyB3aGVyZSB4IGlzIGEgdmVjdG9yIG9mIHNpemUgZ3JvdXBfc2l6ZS4gSWRlYWxseSBvZiBjb3Vyc2UsXG4gIC8vIHRoZSBpbnB1dCBzaXplIHNob3VsZCBiZSBleGFjdGx5IGRpdmlzaWJsZSBieSBncm91cF9zaXplXG4gIHZhciBNYXhvdXRMYXllciA9IGZ1bmN0aW9uKG9wdCkge1xuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyByZXF1aXJlZFxuICAgIHRoaXMuZ3JvdXBfc2l6ZSA9IHR5cGVvZiBvcHQuZ3JvdXBfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHQuZ3JvdXBfc2l6ZSA6IDI7XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIHRoaXMub3V0X3N4ID0gb3B0LmluX3N4O1xuICAgIHRoaXMub3V0X3N5ID0gb3B0LmluX3N5O1xuICAgIHRoaXMub3V0X2RlcHRoID0gTWF0aC5mbG9vcihvcHQuaW5fZGVwdGggLyB0aGlzLmdyb3VwX3NpemUpO1xuICAgIHRoaXMubGF5ZXJfdHlwZSA9ICdtYXhvdXQnO1xuXG4gICAgdGhpcy5zd2l0Y2hlcyA9IGdsb2JhbC56ZXJvcyh0aGlzLm91dF9zeCp0aGlzLm91dF9zeSp0aGlzLm91dF9kZXB0aCk7IC8vIHVzZWZ1bCBmb3IgYmFja3Byb3BcbiAgfVxuICBNYXhvdXRMYXllci5wcm90b3R5cGUgPSB7XG4gICAgZm9yd2FyZDogZnVuY3Rpb24oViwgaXNfdHJhaW5pbmcpIHtcbiAgICAgIHRoaXMuaW5fYWN0ID0gVjtcbiAgICAgIHZhciBOID0gdGhpcy5vdXRfZGVwdGg7IFxuICAgICAgdmFyIFYyID0gbmV3IFZvbCh0aGlzLm91dF9zeCwgdGhpcy5vdXRfc3ksIHRoaXMub3V0X2RlcHRoLCAwLjApO1xuXG4gICAgICAvLyBvcHRpbWl6YXRpb24gYnJhbmNoLiBJZiB3ZSdyZSBvcGVyYXRpbmcgb24gMUQgYXJyYXlzIHdlIGRvbnQgaGF2ZVxuICAgICAgLy8gdG8gd29ycnkgYWJvdXQga2VlcGluZyB0cmFjayBvZiB4LHksZCBjb29yZGluYXRlcyBpbnNpZGVcbiAgICAgIC8vIGlucHV0IHZvbHVtZXMuIEluIGNvbnZuZXRzIHdlIGRvIDooXG4gICAgICBpZih0aGlzLm91dF9zeCA9PT0gMSAmJiB0aGlzLm91dF9zeSA9PT0gMSkge1xuICAgICAgICBmb3IodmFyIGk9MDtpPE47aSsrKSB7XG4gICAgICAgICAgdmFyIGl4ID0gaSAqIHRoaXMuZ3JvdXBfc2l6ZTsgLy8gYmFzZSBpbmRleCBvZmZzZXRcbiAgICAgICAgICB2YXIgYSA9IFYud1tpeF07XG4gICAgICAgICAgdmFyIGFpID0gMDtcbiAgICAgICAgICBmb3IodmFyIGo9MTtqPHRoaXMuZ3JvdXBfc2l6ZTtqKyspIHtcbiAgICAgICAgICAgIHZhciBhMiA9IFYud1tpeCtqXTtcbiAgICAgICAgICAgIGlmKGEyID4gYSkge1xuICAgICAgICAgICAgICBhID0gYTI7XG4gICAgICAgICAgICAgIGFpID0gajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgVjIud1tpXSA9IGE7XG4gICAgICAgICAgdGhpcy5zd2l0Y2hlc1tpXSA9IGl4ICsgYWk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuPTA7IC8vIGNvdW50ZXIgZm9yIHN3aXRjaGVzXG4gICAgICAgIGZvcih2YXIgeD0wO3g8Vi5zeDt4KyspIHtcbiAgICAgICAgICBmb3IodmFyIHk9MDt5PFYuc3k7eSsrKSB7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPE47aSsrKSB7XG4gICAgICAgICAgICAgIHZhciBpeCA9IGkgKiB0aGlzLmdyb3VwX3NpemU7XG4gICAgICAgICAgICAgIHZhciBhID0gVi5nZXQoeCwgeSwgaXgpO1xuICAgICAgICAgICAgICB2YXIgYWkgPSAwO1xuICAgICAgICAgICAgICBmb3IodmFyIGo9MTtqPHRoaXMuZ3JvdXBfc2l6ZTtqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYTIgPSBWLmdldCh4LCB5LCBpeCtqKTtcbiAgICAgICAgICAgICAgICBpZihhMiA+IGEpIHtcbiAgICAgICAgICAgICAgICAgIGEgPSBhMjtcbiAgICAgICAgICAgICAgICAgIGFpID0gajtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgVjIuc2V0KHgseSxpLGEpO1xuICAgICAgICAgICAgICB0aGlzLnN3aXRjaGVzW25dID0gaXggKyBhaTtcbiAgICAgICAgICAgICAgbisrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgICB0aGlzLm91dF9hY3QgPSBWMjtcbiAgICAgIHJldHVybiB0aGlzLm91dF9hY3Q7XG4gICAgfSxcbiAgICBiYWNrd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgViA9IHRoaXMuaW5fYWN0OyAvLyB3ZSBuZWVkIHRvIHNldCBkdyBvZiB0aGlzXG4gICAgICB2YXIgVjIgPSB0aGlzLm91dF9hY3Q7XG4gICAgICB2YXIgTiA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAgVi5kdyA9IGdsb2JhbC56ZXJvcyhWLncubGVuZ3RoKTsgLy8gemVybyBvdXQgZ3JhZGllbnQgd3J0IGRhdGFcblxuICAgICAgLy8gcGFzcyB0aGUgZ3JhZGllbnQgdGhyb3VnaCB0aGUgYXBwcm9wcmlhdGUgc3dpdGNoXG4gICAgICBpZih0aGlzLm91dF9zeCA9PT0gMSAmJiB0aGlzLm91dF9zeSA9PT0gMSkge1xuICAgICAgICBmb3IodmFyIGk9MDtpPE47aSsrKSB7XG4gICAgICAgICAgdmFyIGNoYWluX2dyYWQgPSBWMi5kd1tpXTtcbiAgICAgICAgICBWLmR3W3RoaXMuc3dpdGNoZXNbaV1dID0gY2hhaW5fZ3JhZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYmxlaCBva2F5LCBsZXRzIGRvIHRoaXMgdGhlIGhhcmQgd2F5XG4gICAgICAgIHZhciBuPTA7IC8vIGNvdW50ZXIgZm9yIHN3aXRjaGVzXG4gICAgICAgIGZvcih2YXIgeD0wO3g8VjIuc3g7eCsrKSB7XG4gICAgICAgICAgZm9yKHZhciB5PTA7eTxWMi5zeTt5KyspIHtcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8TjtpKyspIHtcbiAgICAgICAgICAgICAgdmFyIGNoYWluX2dyYWQgPSBWMi5nZXRfZ3JhZCh4LHksaSk7XG4gICAgICAgICAgICAgIFYuc2V0X2dyYWQoeCx5LHRoaXMuc3dpdGNoZXNbbl0sY2hhaW5fZ3JhZCk7XG4gICAgICAgICAgICAgIG4rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuICAgIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIganNvbiA9IHt9O1xuICAgICAganNvbi5vdXRfZGVwdGggPSB0aGlzLm91dF9kZXB0aDtcbiAgICAgIGpzb24ub3V0X3N4ID0gdGhpcy5vdXRfc3g7XG4gICAgICBqc29uLm91dF9zeSA9IHRoaXMub3V0X3N5O1xuICAgICAganNvbi5sYXllcl90eXBlID0gdGhpcy5sYXllcl90eXBlO1xuICAgICAganNvbi5ncm91cF9zaXplID0gdGhpcy5ncm91cF9zaXplO1xuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5vdXRfZGVwdGggPSBqc29uLm91dF9kZXB0aDtcbiAgICAgIHRoaXMub3V0X3N4ID0ganNvbi5vdXRfc3g7XG4gICAgICB0aGlzLm91dF9zeSA9IGpzb24ub3V0X3N5O1xuICAgICAgdGhpcy5sYXllcl90eXBlID0ganNvbi5sYXllcl90eXBlOyBcbiAgICAgIHRoaXMuZ3JvdXBfc2l6ZSA9IGpzb24uZ3JvdXBfc2l6ZTtcbiAgICAgIHRoaXMuc3dpdGNoZXMgPSBnbG9iYWwuemVyb3ModGhpcy5ncm91cF9zaXplKTtcbiAgICB9XG4gIH1cblxuICAvLyBhIGhlbHBlciBmdW5jdGlvbiwgc2luY2UgdGFuaCBpcyBub3QgeWV0IHBhcnQgb2YgRUNNQVNjcmlwdC4gV2lsbCBiZSBpbiB2Ni5cbiAgZnVuY3Rpb24gdGFuaCh4KSB7XG4gICAgdmFyIHkgPSBNYXRoLmV4cCgyICogeCk7XG4gICAgcmV0dXJuICh5IC0gMSkgLyAoeSArIDEpO1xuICB9XG4gIC8vIEltcGxlbWVudHMgVGFuaCBubm9ubGluZWFyaXR5IGVsZW1lbnR3aXNlXG4gIC8vIHggLT4gdGFuaCh4KSBcbiAgLy8gc28gdGhlIG91dHB1dCBpcyBiZXR3ZWVuIC0xIGFuZCAxLlxuICB2YXIgVGFuaExheWVyID0gZnVuY3Rpb24ob3B0KSB7XG4gICAgdmFyIG9wdCA9IG9wdCB8fCB7fTtcblxuICAgIC8vIGNvbXB1dGVkXG4gICAgdGhpcy5vdXRfc3ggPSBvcHQuaW5fc3g7XG4gICAgdGhpcy5vdXRfc3kgPSBvcHQuaW5fc3k7XG4gICAgdGhpcy5vdXRfZGVwdGggPSBvcHQuaW5fZGVwdGg7XG4gICAgdGhpcy5sYXllcl90eXBlID0gJ3RhbmgnO1xuICB9XG4gIFRhbmhMYXllci5wcm90b3R5cGUgPSB7XG4gICAgZm9yd2FyZDogZnVuY3Rpb24oViwgaXNfdHJhaW5pbmcpIHtcbiAgICAgIHRoaXMuaW5fYWN0ID0gVjtcbiAgICAgIHZhciBWMiA9IFYuY2xvbmVBbmRaZXJvKCk7XG4gICAgICB2YXIgTiA9IFYudy5sZW5ndGg7XG4gICAgICBmb3IodmFyIGk9MDtpPE47aSsrKSB7IFxuICAgICAgICBWMi53W2ldID0gdGFuaChWLndbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5vdXRfYWN0ID0gVjI7XG4gICAgICByZXR1cm4gdGhpcy5vdXRfYWN0O1xuICAgIH0sXG4gICAgYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIFYgPSB0aGlzLmluX2FjdDsgLy8gd2UgbmVlZCB0byBzZXQgZHcgb2YgdGhpc1xuICAgICAgdmFyIFYyID0gdGhpcy5vdXRfYWN0O1xuICAgICAgdmFyIE4gPSBWLncubGVuZ3RoO1xuICAgICAgVi5kdyA9IGdsb2JhbC56ZXJvcyhOKTsgLy8gemVybyBvdXQgZ3JhZGllbnQgd3J0IGRhdGFcbiAgICAgIGZvcih2YXIgaT0wO2k8TjtpKyspIHtcbiAgICAgICAgdmFyIHYyd2kgPSBWMi53W2ldO1xuICAgICAgICBWLmR3W2ldID0gKDEuMCAtIHYyd2kgKiB2MndpKSAqIFYyLmR3W2ldO1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0UGFyYW1zQW5kR3JhZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0sXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBqc29uID0ge307XG4gICAgICBqc29uLm91dF9kZXB0aCA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAganNvbi5vdXRfc3ggPSB0aGlzLm91dF9zeDtcbiAgICAgIGpzb24ub3V0X3N5ID0gdGhpcy5vdXRfc3k7XG4gICAgICBqc29uLmxheWVyX3R5cGUgPSB0aGlzLmxheWVyX3R5cGU7XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9LFxuICAgIGZyb21KU09OOiBmdW5jdGlvbihqc29uKSB7XG4gICAgICB0aGlzLm91dF9kZXB0aCA9IGpzb24ub3V0X2RlcHRoO1xuICAgICAgdGhpcy5vdXRfc3ggPSBqc29uLm91dF9zeDtcbiAgICAgIHRoaXMub3V0X3N5ID0ganNvbi5vdXRfc3k7XG4gICAgICB0aGlzLmxheWVyX3R5cGUgPSBqc29uLmxheWVyX3R5cGU7IFxuICAgIH1cbiAgfVxuICBcbiAgZ2xvYmFsLlRhbmhMYXllciA9IFRhbmhMYXllcjtcbiAgZ2xvYmFsLk1heG91dExheWVyID0gTWF4b3V0TGF5ZXI7XG4gIGdsb2JhbC5SZWx1TGF5ZXIgPSBSZWx1TGF5ZXI7XG4gIGdsb2JhbC5TaWdtb2lkTGF5ZXIgPSBTaWdtb2lkTGF5ZXI7XG5cbn0pKGNvbnZuZXRqcyk7XG5cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBWb2wgPSBnbG9iYWwuVm9sOyAvLyBjb252ZW5pZW5jZVxuXG4gIC8vIEFuIGluZWZmaWNpZW50IGRyb3BvdXQgbGF5ZXJcbiAgLy8gTm90ZSB0aGlzIGlzIG5vdCBtb3N0IGVmZmljaWVudCBpbXBsZW1lbnRhdGlvbiBzaW5jZSB0aGUgbGF5ZXIgYmVmb3JlXG4gIC8vIGNvbXB1dGVkIGFsbCB0aGVzZSBhY3RpdmF0aW9ucyBhbmQgbm93IHdlJ3JlIGp1c3QgZ29pbmcgdG8gZHJvcCB0aGVtIDooXG4gIC8vIHNhbWUgZ29lcyBmb3IgYmFja3dhcmQgcGFzcy4gQWxzbywgaWYgd2Ugd2FudGVkIHRvIGJlIGVmZmljaWVudCBhdCB0ZXN0IHRpbWVcbiAgLy8gd2UgY291bGQgZXF1aXZhbGVudGx5IGJlIGNsZXZlciBhbmQgdXBzY2FsZSBkdXJpbmcgdHJhaW4gYW5kIGNvcHkgcG9pbnRlcnMgZHVyaW5nIHRlc3RcbiAgLy8gdG9kbzogbWFrZSBtb3JlIGVmZmljaWVudC5cbiAgdmFyIERyb3BvdXRMYXllciA9IGZ1bmN0aW9uKG9wdCkge1xuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIHRoaXMub3V0X3N4ID0gb3B0LmluX3N4O1xuICAgIHRoaXMub3V0X3N5ID0gb3B0LmluX3N5O1xuICAgIHRoaXMub3V0X2RlcHRoID0gb3B0LmluX2RlcHRoO1xuICAgIHRoaXMubGF5ZXJfdHlwZSA9ICdkcm9wb3V0JztcbiAgICB0aGlzLmRyb3BfcHJvYiA9IHR5cGVvZiBvcHQuZHJvcF9wcm9iICE9PSAndW5kZWZpbmVkJyA/IG9wdC5kcm9wX3Byb2IgOiAwLjU7XG4gICAgdGhpcy5kcm9wcGVkID0gZ2xvYmFsLnplcm9zKHRoaXMub3V0X3N4KnRoaXMub3V0X3N5KnRoaXMub3V0X2RlcHRoKTtcbiAgfVxuICBEcm9wb3V0TGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG4gICAgICBpZih0eXBlb2YoaXNfdHJhaW5pbmcpPT09J3VuZGVmaW5lZCcpIHsgaXNfdHJhaW5pbmcgPSBmYWxzZTsgfSAvLyBkZWZhdWx0IGlzIHByZWRpY3Rpb24gbW9kZVxuICAgICAgdmFyIFYyID0gVi5jbG9uZSgpO1xuICAgICAgdmFyIE4gPSBWLncubGVuZ3RoO1xuICAgICAgaWYoaXNfdHJhaW5pbmcpIHtcbiAgICAgICAgLy8gZG8gZHJvcG91dFxuICAgICAgICBmb3IodmFyIGk9MDtpPE47aSsrKSB7XG4gICAgICAgICAgaWYoTWF0aC5yYW5kb20oKTx0aGlzLmRyb3BfcHJvYikgeyBWMi53W2ldPTA7IHRoaXMuZHJvcHBlZFtpXSA9IHRydWU7IH0gLy8gZHJvcCFcbiAgICAgICAgICBlbHNlIHt0aGlzLmRyb3BwZWRbaV0gPSBmYWxzZTt9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHNjYWxlIHRoZSBhY3RpdmF0aW9ucyBkdXJpbmcgcHJlZGljdGlvblxuICAgICAgICBmb3IodmFyIGk9MDtpPE47aSsrKSB7IFYyLndbaV0qPXRoaXMuZHJvcF9wcm9iOyB9XG4gICAgICB9XG4gICAgICB0aGlzLm91dF9hY3QgPSBWMjtcbiAgICAgIHJldHVybiB0aGlzLm91dF9hY3Q7IC8vIGR1bW15IGlkZW50aXR5IGZ1bmN0aW9uIGZvciBub3dcbiAgICB9LFxuICAgIGJhY2t3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBWID0gdGhpcy5pbl9hY3Q7IC8vIHdlIG5lZWQgdG8gc2V0IGR3IG9mIHRoaXNcbiAgICAgIHZhciBjaGFpbl9ncmFkID0gdGhpcy5vdXRfYWN0O1xuICAgICAgdmFyIE4gPSBWLncubGVuZ3RoO1xuICAgICAgVi5kdyA9IGdsb2JhbC56ZXJvcyhOKTsgLy8gemVybyBvdXQgZ3JhZGllbnQgd3J0IGRhdGFcbiAgICAgIGZvcih2YXIgaT0wO2k8TjtpKyspIHtcbiAgICAgICAgaWYoISh0aGlzLmRyb3BwZWRbaV0pKSB7IFxuICAgICAgICAgIFYuZHdbaV0gPSBjaGFpbl9ncmFkLmR3W2ldOyAvLyBjb3B5IG92ZXIgdGhlIGdyYWRpZW50XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuICAgIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIganNvbiA9IHt9O1xuICAgICAganNvbi5vdXRfZGVwdGggPSB0aGlzLm91dF9kZXB0aDtcbiAgICAgIGpzb24ub3V0X3N4ID0gdGhpcy5vdXRfc3g7XG4gICAgICBqc29uLm91dF9zeSA9IHRoaXMub3V0X3N5O1xuICAgICAganNvbi5sYXllcl90eXBlID0gdGhpcy5sYXllcl90eXBlO1xuICAgICAganNvbi5kcm9wX3Byb2IgPSB0aGlzLmRyb3BfcHJvYjtcbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0sXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgIHRoaXMub3V0X2RlcHRoID0ganNvbi5vdXRfZGVwdGg7XG4gICAgICB0aGlzLm91dF9zeCA9IGpzb24ub3V0X3N4O1xuICAgICAgdGhpcy5vdXRfc3kgPSBqc29uLm91dF9zeTtcbiAgICAgIHRoaXMubGF5ZXJfdHlwZSA9IGpzb24ubGF5ZXJfdHlwZTsgXG4gICAgICB0aGlzLmRyb3BfcHJvYiA9IGpzb24uZHJvcF9wcm9iO1xuICAgIH1cbiAgfVxuICBcblxuICBnbG9iYWwuRHJvcG91dExheWVyID0gRHJvcG91dExheWVyO1xufSkoY29udm5ldGpzKTtcbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBWb2wgPSBnbG9iYWwuVm9sOyAvLyBjb252ZW5pZW5jZVxuICBcbiAgLy8gYSBiaXQgZXhwZXJpbWVudGFsIGxheWVyIGZvciBub3cuIEkgdGhpbmsgaXQgd29ya3MgYnV0IEknbSBub3QgMTAwJVxuICAvLyB0aGUgZ3JhZGllbnQgY2hlY2sgaXMgYSBiaXQgZnVua3kuIEknbGwgbG9vayBpbnRvIHRoaXMgYSBiaXQgbGF0ZXIuXG4gIC8vIExvY2FsIFJlc3BvbnNlIE5vcm1hbGl6YXRpb24gaW4gd2luZG93LCBhbG9uZyBkZXB0aHMgb2Ygdm9sdW1lc1xuICB2YXIgTG9jYWxSZXNwb25zZU5vcm1hbGl6YXRpb25MYXllciA9IGZ1bmN0aW9uKG9wdCkge1xuICAgIHZhciBvcHQgPSBvcHQgfHwge307XG5cbiAgICAvLyByZXF1aXJlZFxuICAgIHRoaXMuayA9IG9wdC5rO1xuICAgIHRoaXMubiA9IG9wdC5uO1xuICAgIHRoaXMuYWxwaGEgPSBvcHQuYWxwaGE7XG4gICAgdGhpcy5iZXRhID0gb3B0LmJldGE7XG5cbiAgICAvLyBjb21wdXRlZFxuICAgIHRoaXMub3V0X3N4ID0gb3B0LmluX3N4O1xuICAgIHRoaXMub3V0X3N5ID0gb3B0LmluX3N5O1xuICAgIHRoaXMub3V0X2RlcHRoID0gb3B0LmluX2RlcHRoO1xuICAgIHRoaXMubGF5ZXJfdHlwZSA9ICdscm4nO1xuXG4gICAgLy8gY2hlY2tzXG4gICAgaWYodGhpcy5uJTIgPT09IDApIHsgY29uc29sZS5sb2coJ1dBUk5JTkcgbiBzaG91bGQgYmUgb2RkIGZvciBMUk4gbGF5ZXInKTsgfVxuICB9XG4gIExvY2FsUmVzcG9uc2VOb3JtYWxpemF0aW9uTGF5ZXIucHJvdG90eXBlID0ge1xuICAgIGZvcndhcmQ6IGZ1bmN0aW9uKFYsIGlzX3RyYWluaW5nKSB7XG4gICAgICB0aGlzLmluX2FjdCA9IFY7XG5cbiAgICAgIHZhciBBID0gVi5jbG9uZUFuZFplcm8oKTtcbiAgICAgIHRoaXMuU19jYWNoZV8gPSBWLmNsb25lQW5kWmVybygpO1xuICAgICAgdmFyIG4yID0gTWF0aC5mbG9vcih0aGlzLm4vMik7XG4gICAgICBmb3IodmFyIHg9MDt4PFYuc3g7eCsrKSB7XG4gICAgICAgIGZvcih2YXIgeT0wO3k8Vi5zeTt5KyspIHtcbiAgICAgICAgICBmb3IodmFyIGk9MDtpPFYuZGVwdGg7aSsrKSB7XG5cbiAgICAgICAgICAgIHZhciBhaSA9IFYuZ2V0KHgseSxpKTtcblxuICAgICAgICAgICAgLy8gbm9ybWFsaXplIGluIGEgd2luZG93IG9mIHNpemUgblxuICAgICAgICAgICAgdmFyIGRlbiA9IDAuMDtcbiAgICAgICAgICAgIGZvcih2YXIgaj1NYXRoLm1heCgwLGktbjIpO2o8PU1hdGgubWluKGkrbjIsVi5kZXB0aC0xKTtqKyspIHtcbiAgICAgICAgICAgICAgdmFyIGFhID0gVi5nZXQoeCx5LGopO1xuICAgICAgICAgICAgICBkZW4gKz0gYWEqYWE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZW4gKj0gdGhpcy5hbHBoYSAvIHRoaXMubjtcbiAgICAgICAgICAgIGRlbiArPSB0aGlzLms7XG4gICAgICAgICAgICB0aGlzLlNfY2FjaGVfLnNldCh4LHksaSxkZW4pOyAvLyB3aWxsIGJlIHVzZWZ1bCBmb3IgYmFja3Byb3BcbiAgICAgICAgICAgIGRlbiA9IE1hdGgucG93KGRlbiwgdGhpcy5iZXRhKTtcbiAgICAgICAgICAgIEEuc2V0KHgseSxpLGFpL2Rlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMub3V0X2FjdCA9IEE7XG4gICAgICByZXR1cm4gdGhpcy5vdXRfYWN0OyAvLyBkdW1teSBpZGVudGl0eSBmdW5jdGlvbiBmb3Igbm93XG4gICAgfSxcbiAgICBiYWNrd2FyZDogZnVuY3Rpb24oKSB7IFxuICAgICAgLy8gZXZhbHVhdGUgZ3JhZGllbnQgd3J0IGRhdGFcbiAgICAgIHZhciBWID0gdGhpcy5pbl9hY3Q7IC8vIHdlIG5lZWQgdG8gc2V0IGR3IG9mIHRoaXNcbiAgICAgIFYuZHcgPSBnbG9iYWwuemVyb3MoVi53Lmxlbmd0aCk7IC8vIHplcm8gb3V0IGdyYWRpZW50IHdydCBkYXRhXG4gICAgICB2YXIgQSA9IHRoaXMub3V0X2FjdDsgLy8gY29tcHV0ZWQgaW4gZm9yd2FyZCBwYXNzIFxuXG4gICAgICB2YXIgbjIgPSBNYXRoLmZsb29yKHRoaXMubi8yKTtcbiAgICAgIGZvcih2YXIgeD0wO3g8Vi5zeDt4KyspIHtcbiAgICAgICAgZm9yKHZhciB5PTA7eTxWLnN5O3krKykge1xuICAgICAgICAgIGZvcih2YXIgaT0wO2k8Vi5kZXB0aDtpKyspIHtcblxuICAgICAgICAgICAgdmFyIGNoYWluX2dyYWQgPSB0aGlzLm91dF9hY3QuZ2V0X2dyYWQoeCx5LGkpO1xuICAgICAgICAgICAgdmFyIFMgPSB0aGlzLlNfY2FjaGVfLmdldCh4LHksaSk7XG4gICAgICAgICAgICB2YXIgU0IgPSBNYXRoLnBvdyhTLCB0aGlzLmJldGEpO1xuICAgICAgICAgICAgdmFyIFNCMiA9IFNCKlNCO1xuXG4gICAgICAgICAgICAvLyBub3JtYWxpemUgaW4gYSB3aW5kb3cgb2Ygc2l6ZSBuXG4gICAgICAgICAgICBmb3IodmFyIGo9TWF0aC5tYXgoMCxpLW4yKTtqPD1NYXRoLm1pbihpK24yLFYuZGVwdGgtMSk7aisrKSB7ICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgdmFyIGFqID0gVi5nZXQoeCx5LGopOyBcbiAgICAgICAgICAgICAgdmFyIGcgPSAtYWoqdGhpcy5iZXRhKk1hdGgucG93KFMsdGhpcy5iZXRhLTEpKnRoaXMuYWxwaGEvdGhpcy5uKjIqYWo7XG4gICAgICAgICAgICAgIGlmKGo9PT1pKSBnKz0gU0I7XG4gICAgICAgICAgICAgIGcgLz0gU0IyO1xuICAgICAgICAgICAgICBnICo9IGNoYWluX2dyYWQ7XG4gICAgICAgICAgICAgIFYuYWRkX2dyYWQoeCx5LGosZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHsgcmV0dXJuIFtdOyB9LFxuICAgIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIganNvbiA9IHt9O1xuICAgICAganNvbi5rID0gdGhpcy5rO1xuICAgICAganNvbi5uID0gdGhpcy5uO1xuICAgICAganNvbi5hbHBoYSA9IHRoaXMuYWxwaGE7IC8vIG5vcm1hbGl6ZSBieSBzaXplXG4gICAgICBqc29uLmJldGEgPSB0aGlzLmJldGE7XG4gICAgICBqc29uLm91dF9zeCA9IHRoaXMub3V0X3N4OyBcbiAgICAgIGpzb24ub3V0X3N5ID0gdGhpcy5vdXRfc3k7XG4gICAgICBqc29uLm91dF9kZXB0aCA9IHRoaXMub3V0X2RlcHRoO1xuICAgICAganNvbi5sYXllcl90eXBlID0gdGhpcy5sYXllcl90eXBlO1xuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5rID0ganNvbi5rO1xuICAgICAgdGhpcy5uID0ganNvbi5uO1xuICAgICAgdGhpcy5hbHBoYSA9IGpzb24uYWxwaGE7IC8vIG5vcm1hbGl6ZSBieSBzaXplXG4gICAgICB0aGlzLmJldGEgPSBqc29uLmJldGE7XG4gICAgICB0aGlzLm91dF9zeCA9IGpzb24ub3V0X3N4OyBcbiAgICAgIHRoaXMub3V0X3N5ID0ganNvbi5vdXRfc3k7XG4gICAgICB0aGlzLm91dF9kZXB0aCA9IGpzb24ub3V0X2RlcHRoO1xuICAgICAgdGhpcy5sYXllcl90eXBlID0ganNvbi5sYXllcl90eXBlO1xuICAgIH1cbiAgfVxuICBcblxuICBnbG9iYWwuTG9jYWxSZXNwb25zZU5vcm1hbGl6YXRpb25MYXllciA9IExvY2FsUmVzcG9uc2VOb3JtYWxpemF0aW9uTGF5ZXI7XG59KShjb252bmV0anMpO1xuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIFZvbCA9IGdsb2JhbC5Wb2w7IC8vIGNvbnZlbmllbmNlXG4gIFxuICAvLyBOZXQgbWFuYWdlcyBhIHNldCBvZiBsYXllcnNcbiAgLy8gRm9yIG5vdyBjb25zdHJhaW50czogU2ltcGxlIGxpbmVhciBvcmRlciBvZiBsYXllcnMsIGZpcnN0IGxheWVyIGlucHV0IGxhc3QgbGF5ZXIgYSBjb3N0IGxheWVyXG4gIHZhciBOZXQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5sYXllcnMgPSBbXTtcbiAgfVxuXG4gIE5ldC5wcm90b3R5cGUgPSB7XG4gICAgXG4gICAgLy8gdGFrZXMgYSBsaXN0IG9mIGxheWVyIGRlZmluaXRpb25zIGFuZCBjcmVhdGVzIHRoZSBuZXR3b3JrIGxheWVyIG9iamVjdHNcbiAgICBtYWtlTGF5ZXJzOiBmdW5jdGlvbihkZWZzKSB7XG5cbiAgICAgIC8vIGZldyBjaGVja3MgZm9yIG5vd1xuICAgICAgaWYoZGVmcy5sZW5ndGg8Mikge2NvbnNvbGUubG9nKCdFUlJPUiEgRm9yIG5vdyBhdCBsZWFzdCBoYXZlIGlucHV0IGFuZCBzb2Z0bWF4IGxheWVycy4nKTt9XG4gICAgICBpZihkZWZzWzBdLnR5cGUgIT09ICdpbnB1dCcpIHtjb25zb2xlLmxvZygnRVJST1IhIEZvciBub3cgZmlyc3QgbGF5ZXIgc2hvdWxkIGJlIGlucHV0LicpO31cblxuICAgICAgLy8gZGVzdWdhciBzeW50YWN0aWMgZm9yIGFkZGluZyBhY3RpdmF0aW9ucyBhbmQgZHJvcG91dHNcbiAgICAgIHZhciBkZXN1Z2FyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBuZXdfZGVmcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDtpPGRlZnMubGVuZ3RoO2krKykge1xuICAgICAgICAgIHZhciBkZWYgPSBkZWZzW2ldO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmKGRlZi50eXBlPT09J3NvZnRtYXgnIHx8IGRlZi50eXBlPT09J3N2bScpIHtcbiAgICAgICAgICAgIC8vIGFkZCBhbiBmYyBsYXllciBoZXJlLCB0aGVyZSBpcyBubyByZWFzb24gdGhlIHVzZXIgc2hvdWxkXG4gICAgICAgICAgICAvLyBoYXZlIHRvIHdvcnJ5IGFib3V0IHRoaXMgYW5kIHdlIGFsbW9zdCBhbHdheXMgd2FudCB0b1xuICAgICAgICAgICAgbmV3X2RlZnMucHVzaCh7dHlwZTonZmMnLCBudW1fbmV1cm9uczogZGVmLm51bV9jbGFzc2VzfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYoZGVmLnR5cGU9PT0ncmVncmVzc2lvbicpIHtcbiAgICAgICAgICAgIC8vIGFkZCBhbiBmYyBsYXllciBoZXJlLCB0aGVyZSBpcyBubyByZWFzb24gdGhlIHVzZXIgc2hvdWxkXG4gICAgICAgICAgICAvLyBoYXZlIHRvIHdvcnJ5IGFib3V0IHRoaXMgYW5kIHdlIGFsbW9zdCBhbHdheXMgd2FudCB0b1xuICAgICAgICAgICAgbmV3X2RlZnMucHVzaCh7dHlwZTonZmMnLCBudW1fbmV1cm9uczogZGVmLm51bV9uZXVyb25zfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYoKGRlZi50eXBlPT09J2ZjJyB8fCBkZWYudHlwZT09PSdjb252JykgXG4gICAgICAgICAgICAgICYmIHR5cGVvZihkZWYuYmlhc19wcmVmKSA9PT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICAgICAgZGVmLmJpYXNfcHJlZiA9IDAuMDtcbiAgICAgICAgICAgIGlmKHR5cGVvZiBkZWYuYWN0aXZhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmLmFjdGl2YXRpb24gPT09ICdyZWx1Jykge1xuICAgICAgICAgICAgICBkZWYuYmlhc19wcmVmID0gMC4xOyAvLyByZWx1cyBsaWtlIGEgYml0IG9mIHBvc2l0aXZlIGJpYXMgdG8gZ2V0IGdyYWRpZW50cyBlYXJseVxuICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgaXQncyB0ZWNobmljYWxseSBwb3NzaWJsZSB0aGF0IGEgcmVsdSB1bml0IHdpbGwgbmV2ZXIgdHVybiBvbiAoYnkgY2hhbmNlKVxuICAgICAgICAgICAgICAvLyBhbmQgd2lsbCBuZXZlciBnZXQgYW55IGdyYWRpZW50IGFuZCBuZXZlciBjb250cmlidXRlIGFueSBjb21wdXRhdGlvbi4gRGVhZCByZWx1LlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBpZih0eXBlb2YgZGVmLnRlbnNvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIC8vIGFwcGx5IHF1YWRyYXRpYyB0cmFuc2Zvcm0gc28gdGhhdCB0aGUgdXBjb21pbmcgbXVsdGlwbHkgd2lsbCBpbmNsdWRlXG4gICAgICAgICAgICAvLyBxdWFkcmF0aWMgdGVybXMsIGVxdWl2YWxlbnQgdG8gZG9pbmcgYSB0ZW5zb3IgcHJvZHVjdFxuICAgICAgICAgICAgaWYoZGVmLnRlbnNvcikge1xuICAgICAgICAgICAgICBuZXdfZGVmcy5wdXNoKHt0eXBlOiAncXVhZHRyYW5zZm9ybSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBuZXdfZGVmcy5wdXNoKGRlZik7XG5cbiAgICAgICAgICBpZih0eXBlb2YgZGVmLmFjdGl2YXRpb24gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZihkZWYuYWN0aXZhdGlvbj09PSdyZWx1JykgeyBuZXdfZGVmcy5wdXNoKHt0eXBlOidyZWx1J30pOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChkZWYuYWN0aXZhdGlvbj09PSdzaWdtb2lkJykgeyBuZXdfZGVmcy5wdXNoKHt0eXBlOidzaWdtb2lkJ30pOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChkZWYuYWN0aXZhdGlvbj09PSd0YW5oJykgeyBuZXdfZGVmcy5wdXNoKHt0eXBlOid0YW5oJ30pOyB9XG4gICAgICAgICAgICBlbHNlIGlmIChkZWYuYWN0aXZhdGlvbj09PSdtYXhvdXQnKSB7XG4gICAgICAgICAgICAgIC8vIGNyZWF0ZSBtYXhvdXQgYWN0aXZhdGlvbiwgYW5kIHBhc3MgYWxvbmcgZ3JvdXAgc2l6ZSwgaWYgcHJvdmlkZWRcbiAgICAgICAgICAgICAgdmFyIGdzID0gZGVmLmdyb3VwX3NpemUgIT09ICd1bmRlZmluZWQnID8gZGVmLmdyb3VwX3NpemUgOiAyO1xuICAgICAgICAgICAgICBuZXdfZGVmcy5wdXNoKHt0eXBlOidtYXhvdXQnLCBncm91cF9zaXplOmdzfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgY29uc29sZS5sb2coJ0VSUk9SIHVuc3VwcG9ydGVkIGFjdGl2YXRpb24gJyArIGRlZi5hY3RpdmF0aW9uKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0eXBlb2YgZGVmLmRyb3BfcHJvYiAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmLnR5cGUgIT09ICdkcm9wb3V0Jykge1xuICAgICAgICAgICAgbmV3X2RlZnMucHVzaCh7dHlwZTonZHJvcG91dCcsIGRyb3BfcHJvYjogZGVmLmRyb3BfcHJvYn0pO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdfZGVmcztcbiAgICAgIH1cbiAgICAgIGRlZnMgPSBkZXN1Z2FyKGRlZnMpO1xuXG4gICAgICAvLyBjcmVhdGUgdGhlIGxheWVyc1xuICAgICAgdGhpcy5sYXllcnMgPSBbXTtcbiAgICAgIGZvcih2YXIgaT0wO2k8ZGVmcy5sZW5ndGg7aSsrKSB7XG4gICAgICAgIHZhciBkZWYgPSBkZWZzW2ldO1xuICAgICAgICBpZihpPjApIHtcbiAgICAgICAgICB2YXIgcHJldiA9IHRoaXMubGF5ZXJzW2ktMV07XG4gICAgICAgICAgZGVmLmluX3N4ID0gcHJldi5vdXRfc3g7XG4gICAgICAgICAgZGVmLmluX3N5ID0gcHJldi5vdXRfc3k7XG4gICAgICAgICAgZGVmLmluX2RlcHRoID0gcHJldi5vdXRfZGVwdGg7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2goZGVmLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdmYyc6IHRoaXMubGF5ZXJzLnB1c2gobmV3IGdsb2JhbC5GdWxseUNvbm5MYXllcihkZWYpKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbHJuJzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLkxvY2FsUmVzcG9uc2VOb3JtYWxpemF0aW9uTGF5ZXIoZGVmKSk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2Ryb3BvdXQnOiB0aGlzLmxheWVycy5wdXNoKG5ldyBnbG9iYWwuRHJvcG91dExheWVyKGRlZikpOyBicmVhaztcbiAgICAgICAgICBjYXNlICdpbnB1dCc6IHRoaXMubGF5ZXJzLnB1c2gobmV3IGdsb2JhbC5JbnB1dExheWVyKGRlZikpOyBicmVhaztcbiAgICAgICAgICBjYXNlICdzb2Z0bWF4JzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLlNvZnRtYXhMYXllcihkZWYpKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmVncmVzc2lvbic6IHRoaXMubGF5ZXJzLnB1c2gobmV3IGdsb2JhbC5SZWdyZXNzaW9uTGF5ZXIoZGVmKSk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2NvbnYnOiB0aGlzLmxheWVycy5wdXNoKG5ldyBnbG9iYWwuQ29udkxheWVyKGRlZikpOyBicmVhaztcbiAgICAgICAgICBjYXNlICdwb29sJzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLlBvb2xMYXllcihkZWYpKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmVsdSc6IHRoaXMubGF5ZXJzLnB1c2gobmV3IGdsb2JhbC5SZWx1TGF5ZXIoZGVmKSk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3NpZ21vaWQnOiB0aGlzLmxheWVycy5wdXNoKG5ldyBnbG9iYWwuU2lnbW9pZExheWVyKGRlZikpOyBicmVhaztcbiAgICAgICAgICBjYXNlICd0YW5oJzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLlRhbmhMYXllcihkZWYpKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbWF4b3V0JzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLk1heG91dExheWVyKGRlZikpOyBicmVhaztcbiAgICAgICAgICBjYXNlICdxdWFkdHJhbnNmb3JtJzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLlF1YWRUcmFuc2Zvcm1MYXllcihkZWYpKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc3ZtJzogdGhpcy5sYXllcnMucHVzaChuZXcgZ2xvYmFsLlNWTUxheWVyKGRlZikpOyBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiBjb25zb2xlLmxvZygnRVJST1I6IFVOUkVDT0dOSVpFRCBMQVlFUiBUWVBFIScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIGZvcndhcmQgcHJvcCB0aGUgbmV0d29yay4gQSB0cmFpbmVyIHdpbGwgcGFzcyBpbiBpc190cmFpbmluZyA9IHRydWVcbiAgICBmb3J3YXJkOiBmdW5jdGlvbihWLCBpc190cmFpbmluZykge1xuICAgICAgaWYodHlwZW9mKGlzX3RyYWluaW5nKT09PSd1bmRlZmluZWQnKSBpc190cmFpbmluZyA9IGZhbHNlO1xuICAgICAgdmFyIGFjdCA9IHRoaXMubGF5ZXJzWzBdLmZvcndhcmQoViwgaXNfdHJhaW5pbmcpO1xuICAgICAgZm9yKHZhciBpPTE7aTx0aGlzLmxheWVycy5sZW5ndGg7aSsrKSB7XG4gICAgICAgIGFjdCA9IHRoaXMubGF5ZXJzW2ldLmZvcndhcmQoYWN0LCBpc190cmFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0O1xuICAgIH0sXG5cbiAgICBnZXRDb3N0TG9zczogZnVuY3Rpb24oViwgeSkge1xuICAgICAgdGhpcy5mb3J3YXJkKFYsIGZhbHNlKTtcbiAgICAgIHZhciBOID0gdGhpcy5sYXllcnMubGVuZ3RoO1xuICAgICAgdmFyIGxvc3MgPSB0aGlzLmxheWVyc1tOLTFdLmJhY2t3YXJkKHkpO1xuICAgICAgcmV0dXJuIGxvc3M7XG4gICAgfSxcbiAgICBcbiAgICAvLyBiYWNrcHJvcDogY29tcHV0ZSBncmFkaWVudHMgd3J0IGFsbCBwYXJhbWV0ZXJzXG4gICAgYmFja3dhcmQ6IGZ1bmN0aW9uKHkpIHtcbiAgICAgIHZhciBOID0gdGhpcy5sYXllcnMubGVuZ3RoO1xuICAgICAgdmFyIGxvc3MgPSB0aGlzLmxheWVyc1tOLTFdLmJhY2t3YXJkKHkpOyAvLyBsYXN0IGxheWVyIGFzc3VtZWQgc29mdG1heFxuICAgICAgZm9yKHZhciBpPU4tMjtpPj0wO2ktLSkgeyAvLyBmaXJzdCBsYXllciBhc3N1bWVkIGlucHV0XG4gICAgICAgIHRoaXMubGF5ZXJzW2ldLmJhY2t3YXJkKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbG9zcztcbiAgICB9LFxuICAgIGdldFBhcmFtc0FuZEdyYWRzOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIGFjY3VtdWxhdGUgcGFyYW1ldGVycyBhbmQgZ3JhZGllbnRzIGZvciB0aGUgZW50aXJlIG5ldHdvcmtcbiAgICAgIHZhciByZXNwb25zZSA9IFtdO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLmxheWVycy5sZW5ndGg7aSsrKSB7XG4gICAgICAgIHZhciBsYXllcl9yZXBvbnNlID0gdGhpcy5sYXllcnNbaV0uZ2V0UGFyYW1zQW5kR3JhZHMoKTtcbiAgICAgICAgZm9yKHZhciBqPTA7ajxsYXllcl9yZXBvbnNlLmxlbmd0aDtqKyspIHtcbiAgICAgICAgICByZXNwb25zZS5wdXNoKGxheWVyX3JlcG9uc2Vbal0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSxcbiAgICBnZXRQcmVkaWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBTID0gdGhpcy5sYXllcnNbdGhpcy5sYXllcnMubGVuZ3RoLTFdOyAvLyBzb2Z0bWF4IGxheWVyXG4gICAgICB2YXIgcCA9IFMub3V0X2FjdC53O1xuICAgICAgdmFyIG1heHYgPSBwWzBdO1xuICAgICAgdmFyIG1heGkgPSAwO1xuICAgICAgZm9yKHZhciBpPTE7aTxwLmxlbmd0aDtpKyspIHtcbiAgICAgICAgaWYocFtpXSA+IG1heHYpIHsgbWF4diA9IHBbaV07IG1heGkgPSBpO31cbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXhpO1xuICAgIH0sXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBqc29uID0ge307XG4gICAgICBqc29uLmxheWVycyA9IFtdO1xuICAgICAgZm9yKHZhciBpPTA7aTx0aGlzLmxheWVycy5sZW5ndGg7aSsrKSB7XG4gICAgICAgIGpzb24ubGF5ZXJzLnB1c2godGhpcy5sYXllcnNbaV0udG9KU09OKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSxcbiAgICBmcm9tSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgdGhpcy5sYXllcnMgPSBbXTtcbiAgICAgIGZvcih2YXIgaT0wO2k8anNvbi5sYXllcnMubGVuZ3RoO2krKykge1xuICAgICAgICB2YXIgTGogPSBqc29uLmxheWVyc1tpXVxuICAgICAgICB2YXIgdCA9IExqLmxheWVyX3R5cGU7XG4gICAgICAgIHZhciBMO1xuICAgICAgICBpZih0PT09J2lucHV0JykgeyBMID0gbmV3IGdsb2JhbC5JbnB1dExheWVyKCk7IH1cbiAgICAgICAgaWYodD09PSdyZWx1JykgeyBMID0gbmV3IGdsb2JhbC5SZWx1TGF5ZXIoKTsgfVxuICAgICAgICBpZih0PT09J3NpZ21vaWQnKSB7IEwgPSBuZXcgZ2xvYmFsLlNpZ21vaWRMYXllcigpOyB9XG4gICAgICAgIGlmKHQ9PT0ndGFuaCcpIHsgTCA9IG5ldyBnbG9iYWwuVGFuaExheWVyKCk7IH1cbiAgICAgICAgaWYodD09PSdkcm9wb3V0JykgeyBMID0gbmV3IGdsb2JhbC5Ecm9wb3V0TGF5ZXIoKTsgfVxuICAgICAgICBpZih0PT09J2NvbnYnKSB7IEwgPSBuZXcgZ2xvYmFsLkNvbnZMYXllcigpOyB9XG4gICAgICAgIGlmKHQ9PT0ncG9vbCcpIHsgTCA9IG5ldyBnbG9iYWwuUG9vbExheWVyKCk7IH1cbiAgICAgICAgaWYodD09PSdscm4nKSB7IEwgPSBuZXcgZ2xvYmFsLkxvY2FsUmVzcG9uc2VOb3JtYWxpemF0aW9uTGF5ZXIoKTsgfVxuICAgICAgICBpZih0PT09J3NvZnRtYXgnKSB7IEwgPSBuZXcgZ2xvYmFsLlNvZnRtYXhMYXllcigpOyB9XG4gICAgICAgIGlmKHQ9PT0ncmVncmVzc2lvbicpIHsgTCA9IG5ldyBnbG9iYWwuUmVncmVzc2lvbkxheWVyKCk7IH1cbiAgICAgICAgaWYodD09PSdmYycpIHsgTCA9IG5ldyBnbG9iYWwuRnVsbHlDb25uTGF5ZXIoKTsgfVxuICAgICAgICBpZih0PT09J21heG91dCcpIHsgTCA9IG5ldyBnbG9iYWwuTWF4b3V0TGF5ZXIoKTsgfVxuICAgICAgICBpZih0PT09J3F1YWR0cmFuc2Zvcm0nKSB7IEwgPSBuZXcgZ2xvYmFsLlF1YWRUcmFuc2Zvcm1MYXllcigpOyB9XG4gICAgICAgIGlmKHQ9PT0nc3ZtJykgeyBMID0gbmV3IGdsb2JhbC5TVk1MYXllcigpOyB9XG4gICAgICAgIEwuZnJvbUpTT04oTGopO1xuICAgICAgICB0aGlzLmxheWVycy5wdXNoKEwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcblxuICBnbG9iYWwuTmV0ID0gTmV0O1xufSkoY29udm5ldGpzKTtcbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBWb2wgPSBnbG9iYWwuVm9sOyAvLyBjb252ZW5pZW5jZVxuXG4gIHZhciBUcmFpbmVyID0gZnVuY3Rpb24obmV0LCBvcHRpb25zKSB7XG5cbiAgICB0aGlzLm5ldCA9IG5ldDtcblxuICAgIHZhciBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLmxlYXJuaW5nX3JhdGUgPSB0eXBlb2Ygb3B0aW9ucy5sZWFybmluZ19yYXRlICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMubGVhcm5pbmdfcmF0ZSA6IDAuMDE7XG4gICAgdGhpcy5sMV9kZWNheSA9IHR5cGVvZiBvcHRpb25zLmwxX2RlY2F5ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMubDFfZGVjYXkgOiAwLjA7XG4gICAgdGhpcy5sMl9kZWNheSA9IHR5cGVvZiBvcHRpb25zLmwyX2RlY2F5ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMubDJfZGVjYXkgOiAwLjA7XG4gICAgdGhpcy5iYXRjaF9zaXplID0gdHlwZW9mIG9wdGlvbnMuYmF0Y2hfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmJhdGNoX3NpemUgOiAxO1xuICAgIHRoaXMubWV0aG9kID0gdHlwZW9mIG9wdGlvbnMubWV0aG9kICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMubWV0aG9kIDogJ3NnZCc7IC8vIHNnZC9hZGFncmFkL2FkYWRlbHRhL3dpbmRvd2dyYWRcblxuICAgIHRoaXMubW9tZW50dW0gPSB0eXBlb2Ygb3B0aW9ucy5tb21lbnR1bSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLm1vbWVudHVtIDogMC45O1xuICAgIHRoaXMucm8gPSB0eXBlb2Ygb3B0aW9ucy5ybyAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLnJvIDogMC45NTsgLy8gdXNlZCBpbiBhZGFkZWx0YVxuICAgIHRoaXMuZXBzID0gdHlwZW9mIG9wdGlvbnMuZXBzICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuZXBzIDogMWUtNjsgLy8gdXNlZCBpbiBhZGFkZWx0YVxuXG4gICAgdGhpcy5rID0gMDsgLy8gaXRlcmF0aW9uIGNvdW50ZXJcbiAgICB0aGlzLmdzdW0gPSBbXTsgLy8gbGFzdCBpdGVyYXRpb24gZ3JhZGllbnRzICh1c2VkIGZvciBtb21lbnR1bSBjYWxjdWxhdGlvbnMpXG4gICAgdGhpcy54c3VtID0gW107IC8vIHVzZWQgaW4gYWRhZGVsdGFcbiAgfVxuXG4gIFRyYWluZXIucHJvdG90eXBlID0ge1xuICAgIHRyYWluOiBmdW5jdGlvbih4LCB5KSB7XG5cbiAgICAgIHZhciBzdGFydCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdGhpcy5uZXQuZm9yd2FyZCh4LCB0cnVlKTsgLy8gYWxzbyBzZXQgdGhlIGZsYWcgdGhhdCBsZXRzIHRoZSBuZXQga25vdyB3ZSdyZSBqdXN0IHRyYWluaW5nXG4gICAgICB2YXIgZW5kID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB2YXIgZndkX3RpbWUgPSBlbmQgLSBzdGFydDtcblxuICAgICAgdmFyIHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB2YXIgY29zdF9sb3NzID0gdGhpcy5uZXQuYmFja3dhcmQoeSk7XG4gICAgICB2YXIgbDJfZGVjYXlfbG9zcyA9IDAuMDtcbiAgICAgIHZhciBsMV9kZWNheV9sb3NzID0gMC4wO1xuICAgICAgdmFyIGVuZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdmFyIGJ3ZF90aW1lID0gZW5kIC0gc3RhcnQ7XG4gICAgICBcbiAgICAgIHRoaXMuaysrO1xuICAgICAgaWYodGhpcy5rICUgdGhpcy5iYXRjaF9zaXplID09PSAwKSB7XG5cbiAgICAgICAgdmFyIHBnbGlzdCA9IHRoaXMubmV0LmdldFBhcmFtc0FuZEdyYWRzKCk7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBsaXN0cyBmb3IgYWNjdW11bGF0b3JzLiBXaWxsIG9ubHkgYmUgZG9uZSBvbmNlIG9uIGZpcnN0IGl0ZXJhdGlvblxuICAgICAgICBpZih0aGlzLmdzdW0ubGVuZ3RoID09PSAwICYmICh0aGlzLm1ldGhvZCAhPT0gJ3NnZCcgfHwgdGhpcy5tb21lbnR1bSA+IDAuMCkpIHtcbiAgICAgICAgICAvLyBvbmx5IHZhbmlsbGEgc2dkIGRvZXNudCBuZWVkIGVpdGhlciBsaXN0c1xuICAgICAgICAgIC8vIG1vbWVudHVtIG5lZWRzIGdzdW1cbiAgICAgICAgICAvLyBhZGFncmFkIG5lZWRzIGdzdW1cbiAgICAgICAgICAvLyBhZGFkZWx0YSBuZWVkcyBnc3VtIGFuZCB4c3VtXG4gICAgICAgICAgZm9yKHZhciBpPTA7aTxwZ2xpc3QubGVuZ3RoO2krKykge1xuICAgICAgICAgICAgdGhpcy5nc3VtLnB1c2goZ2xvYmFsLnplcm9zKHBnbGlzdFtpXS5wYXJhbXMubGVuZ3RoKSk7XG4gICAgICAgICAgICBpZih0aGlzLm1ldGhvZCA9PT0gJ2FkYWRlbHRhJykge1xuICAgICAgICAgICAgICB0aGlzLnhzdW0ucHVzaChnbG9iYWwuemVyb3MocGdsaXN0W2ldLnBhcmFtcy5sZW5ndGgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMueHN1bS5wdXNoKFtdKTsgLy8gY29uc2VydmUgbWVtb3J5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGVyZm9ybSBhbiB1cGRhdGUgZm9yIGFsbCBzZXRzIG9mIHdlaWdodHNcbiAgICAgICAgZm9yKHZhciBpPTA7aTxwZ2xpc3QubGVuZ3RoO2krKykge1xuICAgICAgICAgIHZhciBwZyA9IHBnbGlzdFtpXTsgLy8gcGFyYW0sIGdyYWRpZW50LCBvdGhlciBvcHRpb25zIGluIGZ1dHVyZSAoY3VzdG9tIGxlYXJuaW5nIHJhdGUgZXRjKVxuICAgICAgICAgIHZhciBwID0gcGcucGFyYW1zO1xuICAgICAgICAgIHZhciBnID0gcGcuZ3JhZHM7XG5cbiAgICAgICAgICAvLyBsZWFybmluZyByYXRlIGZvciBzb21lIHBhcmFtZXRlcnMuXG4gICAgICAgICAgdmFyIGwyX2RlY2F5X211bCA9IHR5cGVvZiBwZy5sMl9kZWNheV9tdWwgIT09ICd1bmRlZmluZWQnID8gcGcubDJfZGVjYXlfbXVsIDogMS4wO1xuICAgICAgICAgIHZhciBsMV9kZWNheV9tdWwgPSB0eXBlb2YgcGcubDFfZGVjYXlfbXVsICE9PSAndW5kZWZpbmVkJyA/IHBnLmwxX2RlY2F5X211bCA6IDEuMDtcbiAgICAgICAgICB2YXIgbDJfZGVjYXkgPSB0aGlzLmwyX2RlY2F5ICogbDJfZGVjYXlfbXVsO1xuICAgICAgICAgIHZhciBsMV9kZWNheSA9IHRoaXMubDFfZGVjYXkgKiBsMV9kZWNheV9tdWw7XG5cbiAgICAgICAgICB2YXIgcGxlbiA9IHAubGVuZ3RoO1xuICAgICAgICAgIGZvcih2YXIgaj0wO2o8cGxlbjtqKyspIHtcbiAgICAgICAgICAgIGwyX2RlY2F5X2xvc3MgKz0gbDJfZGVjYXkqcFtqXSpwW2pdLzI7IC8vIGFjY3VtdWxhdGUgd2VpZ2h0IGRlY2F5IGxvc3NcbiAgICAgICAgICAgIGwxX2RlY2F5X2xvc3MgKz0gbDFfZGVjYXkqTWF0aC5hYnMocFtqXSk7XG4gICAgICAgICAgICB2YXIgbDFncmFkID0gbDFfZGVjYXkgKiAocFtqXSA+IDAgPyAxIDogLTEpO1xuICAgICAgICAgICAgdmFyIGwyZ3JhZCA9IGwyX2RlY2F5ICogKHBbal0pO1xuXG4gICAgICAgICAgICB2YXIgZ2lqID0gKGwyZ3JhZCArIGwxZ3JhZCArIGdbal0pIC8gdGhpcy5iYXRjaF9zaXplOyAvLyByYXcgYmF0Y2ggZ3JhZGllbnRcblxuICAgICAgICAgICAgdmFyIGdzdW1pID0gdGhpcy5nc3VtW2ldO1xuICAgICAgICAgICAgdmFyIHhzdW1pID0gdGhpcy54c3VtW2ldO1xuICAgICAgICAgICAgaWYodGhpcy5tZXRob2QgPT09ICdhZGFncmFkJykge1xuICAgICAgICAgICAgICAvLyBhZGFncmFkIHVwZGF0ZVxuICAgICAgICAgICAgICBnc3VtaVtqXSA9IGdzdW1pW2pdICsgZ2lqICogZ2lqO1xuICAgICAgICAgICAgICB2YXIgZHggPSAtIHRoaXMubGVhcm5pbmdfcmF0ZSAvIE1hdGguc3FydChnc3VtaVtqXSArIHRoaXMuZXBzKSAqIGdpajtcbiAgICAgICAgICAgICAgcFtqXSArPSBkeDtcbiAgICAgICAgICAgIH0gZWxzZSBpZih0aGlzLm1ldGhvZCA9PT0gJ3dpbmRvd2dyYWQnKSB7XG4gICAgICAgICAgICAgIC8vIHRoaXMgaXMgYWRhZ3JhZCBidXQgd2l0aCBhIG1vdmluZyB3aW5kb3cgd2VpZ2h0ZWQgYXZlcmFnZVxuICAgICAgICAgICAgICAvLyBzbyB0aGUgZ3JhZGllbnQgaXMgbm90IGFjY3VtdWxhdGVkIG92ZXIgdGhlIGVudGlyZSBoaXN0b3J5IG9mIHRoZSBydW4uIFxuICAgICAgICAgICAgICAvLyBpdCdzIGFsc28gcmVmZXJyZWQgdG8gYXMgSWRlYSAjMSBpbiBaZWlsZXIgcGFwZXIgb24gQWRhZGVsdGEuIFNlZW1zIHJlYXNvbmFibGUgdG8gbWUhXG4gICAgICAgICAgICAgIGdzdW1pW2pdID0gdGhpcy5ybyAqIGdzdW1pW2pdICsgKDEtdGhpcy5ybykgKiBnaWogKiBnaWo7XG4gICAgICAgICAgICAgIHZhciBkeCA9IC0gdGhpcy5sZWFybmluZ19yYXRlIC8gTWF0aC5zcXJ0KGdzdW1pW2pdICsgdGhpcy5lcHMpICogZ2lqOyAvLyBlcHMgYWRkZWQgZm9yIGJldHRlciBjb25kaXRpb25pbmdcbiAgICAgICAgICAgICAgcFtqXSArPSBkeDtcbiAgICAgICAgICAgIH0gZWxzZSBpZih0aGlzLm1ldGhvZCA9PT0gJ2FkYWRlbHRhJykge1xuICAgICAgICAgICAgICAvLyBhc3N1bWUgYWRhZGVsdGEgaWYgbm90IHNnZCBvciBhZGFncmFkXG4gICAgICAgICAgICAgIGdzdW1pW2pdID0gdGhpcy5ybyAqIGdzdW1pW2pdICsgKDEtdGhpcy5ybykgKiBnaWogKiBnaWo7XG4gICAgICAgICAgICAgIHZhciBkeCA9IC0gTWF0aC5zcXJ0KCh4c3VtaVtqXSArIHRoaXMuZXBzKS8oZ3N1bWlbal0gKyB0aGlzLmVwcykpICogZ2lqO1xuICAgICAgICAgICAgICB4c3VtaVtqXSA9IHRoaXMucm8gKiB4c3VtaVtqXSArICgxLXRoaXMucm8pICogZHggKiBkeDsgLy8geWVzLCB4c3VtIGxhZ3MgYmVoaW5kIGdzdW0gYnkgMS5cbiAgICAgICAgICAgICAgcFtqXSArPSBkeDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGFzc3VtZSBTR0RcbiAgICAgICAgICAgICAgaWYodGhpcy5tb21lbnR1bSA+IDAuMCkge1xuICAgICAgICAgICAgICAgIC8vIG1vbWVudHVtIHVwZGF0ZVxuICAgICAgICAgICAgICAgIHZhciBkeCA9IHRoaXMubW9tZW50dW0gKiBnc3VtaVtqXSAtIHRoaXMubGVhcm5pbmdfcmF0ZSAqIGdpajsgLy8gc3RlcFxuICAgICAgICAgICAgICAgIGdzdW1pW2pdID0gZHg7IC8vIGJhY2sgdGhpcyB1cCBmb3IgbmV4dCBpdGVyYXRpb24gb2YgbW9tZW50dW1cbiAgICAgICAgICAgICAgICBwW2pdICs9IGR4OyAvLyBhcHBseSBjb3JyZWN0ZWQgZ3JhZGllbnRcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB2YW5pbGxhIHNnZFxuICAgICAgICAgICAgICAgIHBbal0gKz0gIC0gdGhpcy5sZWFybmluZ19yYXRlICogZ2lqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnW2pdID0gMC4wOyAvLyB6ZXJvIG91dCBncmFkaWVudCBzbyB0aGF0IHdlIGNhbiBiZWdpbiBhY2N1bXVsYXRpbmcgYW5ld1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBhcHBlbmRpbmcgc29mdG1heF9sb3NzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgYnV0IGZyb20gbm93IG9uIHdlIHdpbGwgYWx3YXlzIHVzZSBjb3N0X2xvc3NcbiAgICAgIC8vIGluIGZ1dHVyZSwgVE9ETzogaGF2ZSB0byBjb21wbGV0ZWx5IHJlZG8gdGhlIHdheSBsb3NzIGlzIGRvbmUgYXJvdW5kIHRoZSBuZXR3b3JrIGFzIGN1cnJlbnRseSBcbiAgICAgIC8vIGxvc3MgaXMgYSBiaXQgb2YgYSBoYWNrLiBJZGVhbGx5LCB1c2VyIHNob3VsZCBzcGVjaWZ5IGFyYml0cmFyeSBudW1iZXIgb2YgbG9zcyBmdW5jdGlvbnMgb24gYW55IGxheWVyXG4gICAgICAvLyBhbmQgaXQgc2hvdWxkIGFsbCBiZSBjb21wdXRlZCBjb3JyZWN0bHkgYW5kIGF1dG9tYXRpY2FsbHkuIFxuICAgICAgcmV0dXJuIHtmd2RfdGltZTogZndkX3RpbWUsIGJ3ZF90aW1lOiBid2RfdGltZSwgXG4gICAgICAgICAgICAgIGwyX2RlY2F5X2xvc3M6IGwyX2RlY2F5X2xvc3MsIGwxX2RlY2F5X2xvc3M6IGwxX2RlY2F5X2xvc3MsXG4gICAgICAgICAgICAgIGNvc3RfbG9zczogY29zdF9sb3NzLCBzb2Z0bWF4X2xvc3M6IGNvc3RfbG9zcywgXG4gICAgICAgICAgICAgIGxvc3M6IGNvc3RfbG9zcyArIGwxX2RlY2F5X2xvc3MgKyBsMl9kZWNheV9sb3NzfVxuICAgIH1cbiAgfVxuICBcbiAgZ2xvYmFsLlRyYWluZXIgPSBUcmFpbmVyO1xuICBnbG9iYWwuU0dEVHJhaW5lciA9IFRyYWluZXI7IC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG59KShjb252bmV0anMpO1xuXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIC8vIHVzZWQgdXRpbGl0aWVzLCBtYWtlIGV4cGxpY2l0IGxvY2FsIHJlZmVyZW5jZXNcbiAgdmFyIHJhbmRmID0gZ2xvYmFsLnJhbmRmO1xuICB2YXIgcmFuZGkgPSBnbG9iYWwucmFuZGk7XG4gIHZhciBOZXQgPSBnbG9iYWwuTmV0O1xuICB2YXIgVHJhaW5lciA9IGdsb2JhbC5UcmFpbmVyO1xuICB2YXIgbWF4bWluID0gZ2xvYmFsLm1heG1pbjtcbiAgdmFyIHJhbmRwZXJtID0gZ2xvYmFsLnJhbmRwZXJtO1xuICB2YXIgd2VpZ2h0ZWRTYW1wbGUgPSBnbG9iYWwud2VpZ2h0ZWRTYW1wbGU7XG4gIHZhciBnZXRvcHQgPSBnbG9iYWwuZ2V0b3B0O1xuICB2YXIgYXJyVW5pcXVlID0gZ2xvYmFsLmFyclVuaXF1ZTtcblxuICAvKlxuICBBIE1hZ2ljTmV0IHRha2VzIGRhdGE6IGEgbGlzdCBvZiBjb252bmV0anMuVm9sKCksIGFuZCBsYWJlbHNcbiAgd2hpY2ggZm9yIG5vdyBhcmUgYXNzdW1lZCB0byBiZSBjbGFzcyBpbmRlY2VzIDAuLksuIE1hZ2ljTmV0IHRoZW46XG4gIC0gY3JlYXRlcyBkYXRhIGZvbGRzIGZvciBjcm9zcy12YWxpZGF0aW9uXG4gIC0gc2FtcGxlcyBjYW5kaWRhdGUgbmV0d29ya3NcbiAgLSBldmFsdWF0ZXMgY2FuZGlkYXRlIG5ldHdvcmtzIG9uIGFsbCBkYXRhIGZvbGRzXG4gIC0gcHJvZHVjZXMgcHJlZGljdGlvbnMgYnkgbW9kZWwtYXZlcmFnaW5nIHRoZSBiZXN0IG5ldHdvcmtzXG4gICovXG4gIHZhciBNYWdpY05ldCA9IGZ1bmN0aW9uKGRhdGEsIGxhYmVscywgb3B0KSB7XG4gICAgdmFyIG9wdCA9IG9wdCB8fCB7fTtcbiAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHsgZGF0YSA9IFtdOyB9XG4gICAgaWYodHlwZW9mIGxhYmVscyA9PT0gJ3VuZGVmaW5lZCcpIHsgbGFiZWxzID0gW107IH1cblxuICAgIC8vIHJlcXVpcmVkIGlucHV0c1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7IC8vIHN0b3JlIHRoZXNlIHBvaW50ZXJzIHRvIGRhdGFcbiAgICB0aGlzLmxhYmVscyA9IGxhYmVscztcblxuICAgIC8vIG9wdGlvbmFsIGlucHV0c1xuICAgIHRoaXMudHJhaW5fcmF0aW8gPSBnZXRvcHQob3B0LCAndHJhaW5fcmF0aW8nLCAwLjcpO1xuICAgIHRoaXMubnVtX2ZvbGRzID0gZ2V0b3B0KG9wdCwgJ251bV9mb2xkcycsIDEwKTtcbiAgICB0aGlzLm51bV9jYW5kaWRhdGVzID0gZ2V0b3B0KG9wdCwgJ251bV9jYW5kaWRhdGVzJywgNTApOyAvLyB3ZSBldmFsdWF0ZSBzZXZlcmFsIGluIHBhcmFsbGVsXG4gICAgLy8gaG93IG1hbnkgZXBvY2hzIG9mIGRhdGEgdG8gdHJhaW4gZXZlcnkgbmV0d29yaz8gZm9yIGV2ZXJ5IGZvbGQ/XG4gICAgLy8gaGlnaGVyIHZhbHVlcyBtZWFuIGhpZ2hlciBhY2N1cmFjeSBpbiBmaW5hbCByZXN1bHRzLCBidXQgbW9yZSBleHBlbnNpdmVcbiAgICB0aGlzLm51bV9lcG9jaHMgPSBnZXRvcHQob3B0LCAnbnVtX2Vwb2NocycsIDUwKTsgXG4gICAgLy8gbnVtYmVyIG9mIGJlc3QgbW9kZWxzIHRvIGF2ZXJhZ2UgZHVyaW5nIHByZWRpY3Rpb24uIFVzdWFsbHkgaGlnaGVyID0gYmV0dGVyXG4gICAgdGhpcy5lbnNlbWJsZV9zaXplID0gZ2V0b3B0KG9wdCwgJ2Vuc2VtYmxlX3NpemUnLCAxMCk7XG5cbiAgICAvLyBjYW5kaWRhdGUgcGFyYW1ldGVyc1xuICAgIHRoaXMuYmF0Y2hfc2l6ZV9taW4gPSBnZXRvcHQob3B0LCAnYmF0Y2hfc2l6ZV9taW4nLCAxMCk7XG4gICAgdGhpcy5iYXRjaF9zaXplX21heCA9IGdldG9wdChvcHQsICdiYXRjaF9zaXplX21heCcsIDMwMCk7XG4gICAgdGhpcy5sMl9kZWNheV9taW4gPSBnZXRvcHQob3B0LCAnbDJfZGVjYXlfbWluJywgLTQpO1xuICAgIHRoaXMubDJfZGVjYXlfbWF4ID0gZ2V0b3B0KG9wdCwgJ2wyX2RlY2F5X21heCcsIDIpO1xuICAgIHRoaXMubGVhcm5pbmdfcmF0ZV9taW4gPSBnZXRvcHQob3B0LCAnbGVhcm5pbmdfcmF0ZV9taW4nLCAtNCk7XG4gICAgdGhpcy5sZWFybmluZ19yYXRlX21heCA9IGdldG9wdChvcHQsICdsZWFybmluZ19yYXRlX21heCcsIDApO1xuICAgIHRoaXMubW9tZW50dW1fbWluID0gZ2V0b3B0KG9wdCwgJ21vbWVudHVtX21pbicsIDAuOSk7XG4gICAgdGhpcy5tb21lbnR1bV9tYXggPSBnZXRvcHQob3B0LCAnbW9tZW50dW1fbWF4JywgMC45KTtcbiAgICB0aGlzLm5ldXJvbnNfbWluID0gZ2V0b3B0KG9wdCwgJ25ldXJvbnNfbWluJywgNSk7XG4gICAgdGhpcy5uZXVyb25zX21heCA9IGdldG9wdChvcHQsICduZXVyb25zX21heCcsIDMwKTtcblxuICAgIC8vIGNvbXB1dGVkXG4gICAgdGhpcy5mb2xkcyA9IFtdOyAvLyBkYXRhIGZvbGQgaW5kaWNlcywgZ2V0cyBmaWxsZWQgYnkgc2FtcGxlRm9sZHMoKVxuICAgIHRoaXMuY2FuZGlkYXRlcyA9IFtdOyAvLyBjYW5kaWRhdGUgbmV0d29ya3MgdGhhdCBhcmUgYmVpbmcgY3VycmVudGx5IGV2YWx1YXRlZFxuICAgIHRoaXMuZXZhbHVhdGVkX2NhbmRpZGF0ZXMgPSBbXTsgLy8gaGlzdG9yeSBvZiBhbGwgY2FuZGlkYXRlcyB0aGF0IHdlcmUgZnVsbHkgZXZhbHVhdGVkIG9uIGFsbCBmb2xkc1xuICAgIHRoaXMudW5pcXVlX2xhYmVscyA9IGFyclVuaXF1ZShsYWJlbHMpO1xuICAgIHRoaXMuaXRlciA9IDA7IC8vIGl0ZXJhdGlvbiBjb3VudGVyLCBnb2VzIGZyb20gMCAtPiBudW1fZXBvY2hzICogbnVtX3RyYWluaW5nX2RhdGFcbiAgICB0aGlzLmZvbGRpeCA9IDA7IC8vIGluZGV4IG9mIGFjdGl2ZSBmb2xkXG5cbiAgICAvLyBjYWxsYmFja3NcbiAgICB0aGlzLmZpbmlzaF9mb2xkX2NhbGxiYWNrID0gbnVsbDtcbiAgICB0aGlzLmZpbmlzaF9iYXRjaF9jYWxsYmFjayA9IG51bGw7XG5cbiAgICAvLyBpbml0aWFsaXphdGlvbnNcbiAgICBpZih0aGlzLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5zYW1wbGVGb2xkcygpO1xuICAgICAgdGhpcy5zYW1wbGVDYW5kaWRhdGVzKCk7XG4gICAgfVxuICB9O1xuXG4gIE1hZ2ljTmV0LnByb3RvdHlwZSA9IHtcblxuICAgIC8vIHNldHMgdGhpcy5mb2xkcyB0byBhIHNhbXBsaW5nIG9mIHRoaXMubnVtX2ZvbGRzIGZvbGRzXG4gICAgc2FtcGxlRm9sZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIE4gPSB0aGlzLmRhdGEubGVuZ3RoO1xuICAgICAgdmFyIG51bV90cmFpbiA9IE1hdGguZmxvb3IodGhpcy50cmFpbl9yYXRpbyAqIE4pO1xuICAgICAgdGhpcy5mb2xkcyA9IFtdOyAvLyBmbHVzaCBmb2xkcywgaWYgYW55XG4gICAgICBmb3IodmFyIGk9MDtpPHRoaXMubnVtX2ZvbGRzO2krKykge1xuICAgICAgICB2YXIgcCA9IHJhbmRwZXJtKE4pO1xuICAgICAgICB0aGlzLmZvbGRzLnB1c2goe3RyYWluX2l4OiBwLnNsaWNlKDAsIG51bV90cmFpbiksIHRlc3RfaXg6IHAuc2xpY2UobnVtX3RyYWluLCBOKX0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyByZXR1cm5zIGEgcmFuZG9tIGNhbmRpZGF0ZSBuZXR3b3JrXG4gICAgc2FtcGxlQ2FuZGlkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dF9kZXB0aCA9IHRoaXMuZGF0YVswXS53Lmxlbmd0aDtcbiAgICAgIHZhciBudW1fY2xhc3NlcyA9IHRoaXMudW5pcXVlX2xhYmVscy5sZW5ndGg7XG5cbiAgICAgIC8vIHNhbXBsZSBuZXR3b3JrIHRvcG9sb2d5IGFuZCBoeXBlcnBhcmFtZXRlcnNcbiAgICAgIHZhciBsYXllcl9kZWZzID0gW107XG4gICAgICBsYXllcl9kZWZzLnB1c2goe3R5cGU6J2lucHV0Jywgb3V0X3N4OjEsIG91dF9zeToxLCBvdXRfZGVwdGg6IGlucHV0X2RlcHRofSk7XG4gICAgICB2YXIgbmwgPSB3ZWlnaHRlZFNhbXBsZShbMCwxLDIsM10sIFswLjIsIDAuMywgMC4zLCAwLjJdKTsgLy8gcHJlZmVyIG5ldHMgd2l0aCAxLDIgaGlkZGVuIGxheWVyc1xuICAgICAgZm9yKHZhciBxPTA7cTxubDtxKyspIHtcbiAgICAgICAgdmFyIG5pID0gcmFuZGkodGhpcy5uZXVyb25zX21pbiwgdGhpcy5uZXVyb25zX21heCk7XG4gICAgICAgIHZhciBhY3QgPSBbJ3RhbmgnLCdtYXhvdXQnLCdyZWx1J11bcmFuZGkoMCwzKV07XG4gICAgICAgIGlmKHJhbmRmKDAsMSk8MC41KSB7XG4gICAgICAgICAgdmFyIGRwID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICBsYXllcl9kZWZzLnB1c2goe3R5cGU6J2ZjJywgbnVtX25ldXJvbnM6IG5pLCBhY3RpdmF0aW9uOiBhY3QsIGRyb3BfcHJvYjogZHB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsYXllcl9kZWZzLnB1c2goe3R5cGU6J2ZjJywgbnVtX25ldXJvbnM6IG5pLCBhY3RpdmF0aW9uOiBhY3R9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGF5ZXJfZGVmcy5wdXNoKHt0eXBlOidzb2Z0bWF4JywgbnVtX2NsYXNzZXM6IG51bV9jbGFzc2VzfSk7XG4gICAgICB2YXIgbmV0ID0gbmV3IE5ldCgpO1xuICAgICAgbmV0Lm1ha2VMYXllcnMobGF5ZXJfZGVmcyk7XG5cbiAgICAgIC8vIHNhbXBsZSB0cmFpbmluZyBoeXBlcnBhcmFtZXRlcnNcbiAgICAgIHZhciBicyA9IHJhbmRpKHRoaXMuYmF0Y2hfc2l6ZV9taW4sIHRoaXMuYmF0Y2hfc2l6ZV9tYXgpOyAvLyBiYXRjaCBzaXplXG4gICAgICB2YXIgbDIgPSBNYXRoLnBvdygxMCwgcmFuZGYodGhpcy5sMl9kZWNheV9taW4sIHRoaXMubDJfZGVjYXlfbWF4KSk7IC8vIGwyIHdlaWdodCBkZWNheVxuICAgICAgdmFyIGxyID0gTWF0aC5wb3coMTAsIHJhbmRmKHRoaXMubGVhcm5pbmdfcmF0ZV9taW4sIHRoaXMubGVhcm5pbmdfcmF0ZV9tYXgpKTsgLy8gbGVhcm5pbmcgcmF0ZVxuICAgICAgdmFyIG1vbSA9IHJhbmRmKHRoaXMubW9tZW50dW1fbWluLCB0aGlzLm1vbWVudHVtX21heCk7IC8vIG1vbWVudHVtLiBMZXRzIGp1c3QgdXNlIDAuOSwgd29ya3Mgb2theSB1c3VhbGx5IDtwXG4gICAgICB2YXIgdHAgPSByYW5kZigwLDEpOyAvLyB0cmFpbmVyIHR5cGVcbiAgICAgIHZhciB0cmFpbmVyX2RlZjtcbiAgICAgIGlmKHRwPDAuMzMpIHtcbiAgICAgICAgdHJhaW5lcl9kZWYgPSB7bWV0aG9kOidhZGFkZWx0YScsIGJhdGNoX3NpemU6YnMsIGwyX2RlY2F5OmwyfTtcbiAgICAgIH0gZWxzZSBpZih0cDwwLjY2KSB7XG4gICAgICAgIHRyYWluZXJfZGVmID0ge21ldGhvZDonYWRhZ3JhZCcsIGxlYXJuaW5nX3JhdGU6IGxyLCBiYXRjaF9zaXplOmJzLCBsMl9kZWNheTpsMn07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmFpbmVyX2RlZiA9IHttZXRob2Q6J3NnZCcsIGxlYXJuaW5nX3JhdGU6IGxyLCBtb21lbnR1bTogbW9tLCBiYXRjaF9zaXplOmJzLCBsMl9kZWNheTpsMn07XG4gICAgICB9XG4gICAgICBcbiAgICAgIHZhciB0cmFpbmVyID0gbmV3IFRyYWluZXIobmV0LCB0cmFpbmVyX2RlZik7XG5cbiAgICAgIHZhciBjYW5kID0ge307XG4gICAgICBjYW5kLmFjYyA9IFtdO1xuICAgICAgY2FuZC5hY2N2ID0gMDsgLy8gdGhpcyB3aWxsIG1haW50YWluZWQgYXMgc3VtKGFjYykgZm9yIGNvbnZlbmllbmNlXG4gICAgICBjYW5kLmxheWVyX2RlZnMgPSBsYXllcl9kZWZzO1xuICAgICAgY2FuZC50cmFpbmVyX2RlZiA9IHRyYWluZXJfZGVmO1xuICAgICAgY2FuZC5uZXQgPSBuZXQ7XG4gICAgICBjYW5kLnRyYWluZXIgPSB0cmFpbmVyO1xuICAgICAgcmV0dXJuIGNhbmQ7XG4gICAgfSxcblxuICAgIC8vIHNldHMgdGhpcy5jYW5kaWRhdGVzIHdpdGggdGhpcy5udW1fY2FuZGlkYXRlcyBjYW5kaWRhdGUgbmV0c1xuICAgIHNhbXBsZUNhbmRpZGF0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jYW5kaWRhdGVzID0gW107IC8vIGZsdXNoLCBpZiBhbnlcbiAgICAgIGZvcih2YXIgaT0wO2k8dGhpcy5udW1fY2FuZGlkYXRlcztpKyspIHtcbiAgICAgICAgdmFyIGNhbmQgPSB0aGlzLnNhbXBsZUNhbmRpZGF0ZSgpO1xuICAgICAgICB0aGlzLmNhbmRpZGF0ZXMucHVzaChjYW5kKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RlcDogZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIC8vIHJ1biBhbiBleGFtcGxlIHRocm91Z2ggY3VycmVudCBjYW5kaWRhdGVcbiAgICAgIHRoaXMuaXRlcisrO1xuXG4gICAgICAvLyBzdGVwIGFsbCBjYW5kaWRhdGVzIG9uIGEgcmFuZG9tIGRhdGEgcG9pbnRcbiAgICAgIHZhciBmb2xkID0gdGhpcy5mb2xkc1t0aGlzLmZvbGRpeF07IC8vIGFjdGl2ZSBmb2xkXG4gICAgICB2YXIgZGF0YWl4ID0gZm9sZC50cmFpbl9peFtyYW5kaSgwLCBmb2xkLnRyYWluX2l4Lmxlbmd0aCldO1xuICAgICAgZm9yKHZhciBrPTA7azx0aGlzLmNhbmRpZGF0ZXMubGVuZ3RoO2srKykge1xuICAgICAgICB2YXIgeCA9IHRoaXMuZGF0YVtkYXRhaXhdO1xuICAgICAgICB2YXIgbCA9IHRoaXMubGFiZWxzW2RhdGFpeF07XG4gICAgICAgIHRoaXMuY2FuZGlkYXRlc1trXS50cmFpbmVyLnRyYWluKHgsIGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBwcm9jZXNzIGNvbnNlcXVlbmNlczogc2FtcGxlIG5ldyBmb2xkcywgb3IgY2FuZGlkYXRlc1xuICAgICAgdmFyIGxhc3RpdGVyID0gdGhpcy5udW1fZXBvY2hzICogZm9sZC50cmFpbl9peC5sZW5ndGg7XG4gICAgICBpZih0aGlzLml0ZXIgPj0gbGFzdGl0ZXIpIHtcbiAgICAgICAgLy8gZmluaXNoZWQgZXZhbHVhdGlvbiBvZiB0aGlzIGZvbGQuIEdldCBmaW5hbCB2YWxpZGF0aW9uXG4gICAgICAgIC8vIGFjY3VyYWNpZXMsIHJlY29yZCB0aGVtLCBhbmQgZ28gb24gdG8gbmV4dCBmb2xkLlxuICAgICAgICB2YXIgdmFsX2FjYyA9IHRoaXMuZXZhbFZhbEVycm9ycygpO1xuICAgICAgICBmb3IodmFyIGs9MDtrPHRoaXMuY2FuZGlkYXRlcy5sZW5ndGg7aysrKSB7XG4gICAgICAgICAgdmFyIGMgPSB0aGlzLmNhbmRpZGF0ZXNba107XG4gICAgICAgICAgYy5hY2MucHVzaCh2YWxfYWNjW2tdKTtcbiAgICAgICAgICBjLmFjY3YgKz0gdmFsX2FjY1trXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLml0ZXIgPSAwOyAvLyByZXNldCBzdGVwIG51bWJlclxuICAgICAgICB0aGlzLmZvbGRpeCsrOyAvLyBpbmNyZW1lbnQgZm9sZFxuXG4gICAgICAgIGlmKHRoaXMuZmluaXNoX2ZvbGRfY2FsbGJhY2sgIT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmZpbmlzaF9mb2xkX2NhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZih0aGlzLmZvbGRpeCA+PSB0aGlzLmZvbGRzLmxlbmd0aCkge1xuICAgICAgICAgIC8vIHdlIGZpbmlzaGVkIGFsbCBmb2xkcyBhcyB3ZWxsISBSZWNvcmQgdGhlc2UgY2FuZGlkYXRlc1xuICAgICAgICAgIC8vIGFuZCBzYW1wbGUgbmV3IG9uZXMgdG8gZXZhbHVhdGUuXG4gICAgICAgICAgZm9yKHZhciBrPTA7azx0aGlzLmNhbmRpZGF0ZXMubGVuZ3RoO2srKykge1xuICAgICAgICAgICAgdGhpcy5ldmFsdWF0ZWRfY2FuZGlkYXRlcy5wdXNoKHRoaXMuY2FuZGlkYXRlc1trXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHNvcnQgZXZhbHVhdGVkIGNhbmRpZGF0ZXMgYWNjb3JkaW5nIHRvIGFjY3VyYWN5IGFjaGlldmVkXG4gICAgICAgICAgdGhpcy5ldmFsdWF0ZWRfY2FuZGlkYXRlcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgXG4gICAgICAgICAgICByZXR1cm4gKGEuYWNjdiAvIGEuYWNjLmxlbmd0aCkgXG4gICAgICAgICAgICAgICAgID4gKGIuYWNjdiAvIGIuYWNjLmxlbmd0aCkgXG4gICAgICAgICAgICAgICAgID8gLTEgOiAxO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIGFuZCBjbGlwIG9ubHkgdG8gdGhlIHRvcCBmZXcgb25lcyAobGV0cyBwbGFjZSBsaW1pdCBhdCAzKmVuc2VtYmxlX3NpemUpXG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIHRoZXJlIGFyZSBjb25jZXJucyB3aXRoIGtlZXBpbmcgdGhlc2UgYWxsIGluIG1lbW9yeSBcbiAgICAgICAgICAvLyBpZiBNYWdpY05ldCBpcyBiZWluZyBldmFsdWF0ZWQgZm9yIGEgdmVyeSBsb25nIHRpbWVcbiAgICAgICAgICBpZih0aGlzLmV2YWx1YXRlZF9jYW5kaWRhdGVzLmxlbmd0aCA+IDMgKiB0aGlzLmVuc2VtYmxlX3NpemUpIHtcbiAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVkX2NhbmRpZGF0ZXMgPSB0aGlzLmV2YWx1YXRlZF9jYW5kaWRhdGVzLnNsaWNlKDAsIDMgKiB0aGlzLmVuc2VtYmxlX3NpemUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0aGlzLmZpbmlzaF9iYXRjaF9jYWxsYmFjayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5maW5pc2hfYmF0Y2hfY2FsbGJhY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zYW1wbGVDYW5kaWRhdGVzKCk7IC8vIGJlZ2luIHdpdGggbmV3IGNhbmRpZGF0ZXNcbiAgICAgICAgICB0aGlzLmZvbGRpeCA9IDA7IC8vIHJlc2V0IHRoaXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB3ZSB3aWxsIGdvIG9uIHRvIGFub3RoZXIgZm9sZC4gcmVzZXQgYWxsIGNhbmRpZGF0ZXMgbmV0c1xuICAgICAgICAgIGZvcih2YXIgaz0wO2s8dGhpcy5jYW5kaWRhdGVzLmxlbmd0aDtrKyspIHtcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5jYW5kaWRhdGVzW2tdO1xuICAgICAgICAgICAgdmFyIG5ldCA9IG5ldyBOZXQoKTtcbiAgICAgICAgICAgIG5ldC5tYWtlTGF5ZXJzKGMubGF5ZXJfZGVmcyk7XG4gICAgICAgICAgICB2YXIgdHJhaW5lciA9IG5ldyBUcmFpbmVyKG5ldCwgYy50cmFpbmVyX2RlZik7XG4gICAgICAgICAgICBjLm5ldCA9IG5ldDtcbiAgICAgICAgICAgIGMudHJhaW5lciA9IHRyYWluZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGV2YWxWYWxFcnJvcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gZXZhbHVhdGUgY2FuZGlkYXRlcyBvbiB2YWxpZGF0aW9uIGRhdGEgYW5kIHJldHVybiBwZXJmb3JtYW5jZSBvZiBjdXJyZW50IG5ldHdvcmtzXG4gICAgICAvLyBhcyBzaW1wbGUgbGlzdFxuICAgICAgdmFyIHZhbHMgPSBbXTtcbiAgICAgIHZhciBmb2xkID0gdGhpcy5mb2xkc1t0aGlzLmZvbGRpeF07IC8vIGFjdGl2ZSBmb2xkXG4gICAgICBmb3IodmFyIGs9MDtrPHRoaXMuY2FuZGlkYXRlcy5sZW5ndGg7aysrKSB7XG4gICAgICAgIHZhciBuZXQgPSB0aGlzLmNhbmRpZGF0ZXNba10ubmV0O1xuICAgICAgICB2YXIgdiA9IDAuMDtcbiAgICAgICAgZm9yKHZhciBxPTA7cTxmb2xkLnRlc3RfaXgubGVuZ3RoO3ErKykge1xuICAgICAgICAgIHZhciB4ID0gdGhpcy5kYXRhW2ZvbGQudGVzdF9peFtxXV07XG4gICAgICAgICAgdmFyIGwgPSB0aGlzLmxhYmVsc1tmb2xkLnRlc3RfaXhbcV1dO1xuICAgICAgICAgIG5ldC5mb3J3YXJkKHgpO1xuICAgICAgICAgIHZhciB5aGF0ID0gbmV0LmdldFByZWRpY3Rpb24oKTtcbiAgICAgICAgICB2ICs9ICh5aGF0ID09PSBsID8gMS4wIDogMC4wKTsgLy8gMCAxIGxvc3NcbiAgICAgICAgfVxuICAgICAgICB2IC89IGZvbGQudGVzdF9peC5sZW5ndGg7IC8vIG5vcm1hbGl6ZVxuICAgICAgICB2YWxzLnB1c2godik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFscztcbiAgICB9LFxuXG4gICAgLy8gcmV0dXJucyBwcmVkaWN0aW9uIHNjb3JlcyBmb3IgZ2l2ZW4gdGVzdCBkYXRhIHBvaW50LCBhcyBWb2xcbiAgICAvLyB1c2VzIGFuIGF2ZXJhZ2VkIHByZWRpY3Rpb24gZnJvbSB0aGUgYmVzdCBlbnNlbWJsZV9zaXplIG1vZGVsc1xuICAgIC8vIHggaXMgYSBWb2wuXG4gICAgcHJlZGljdF9zb2Z0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBmb3J3YXJkIHByb3AgdGhlIGJlc3QgbmV0d29ya3NcbiAgICAgIC8vIGFuZCBhY2N1bXVsYXRlIHByb2JhYmlsaXRpZXMgYXQgbGFzdCBsYXllciBpbnRvIGEgYW4gb3V0cHV0IFZvbFxuICAgICAgdmFyIG52ID0gTWF0aC5taW4odGhpcy5lbnNlbWJsZV9zaXplLCB0aGlzLmV2YWx1YXRlZF9jYW5kaWRhdGVzLmxlbmd0aCk7XG4gICAgICBpZihudiA9PT0gMCkgeyByZXR1cm4gbmV3IGNvbnZuZXRqcy5Wb2woMCwwLDApOyB9IC8vIG5vdCBzdXJlIHdoYXQgdG8gZG8gaGVyZT8gd2UncmUgbm90IHJlYWR5IHlldFxuICAgICAgdmFyIHhvdXQsIG47XG4gICAgICBmb3IodmFyIGo9MDtqPG52O2orKykge1xuICAgICAgICB2YXIgbmV0ID0gdGhpcy5ldmFsdWF0ZWRfY2FuZGlkYXRlc1tqXS5uZXQ7XG4gICAgICAgIHZhciB4ID0gbmV0LmZvcndhcmQoZGF0YSk7XG4gICAgICAgIGlmKGo9PT0wKSB7IFxuICAgICAgICAgIHhvdXQgPSB4OyBcbiAgICAgICAgICBuID0geC53Lmxlbmd0aDsgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYWRkIGl0IG9uXG4gICAgICAgICAgZm9yKHZhciBkPTA7ZDxuO2QrKykge1xuICAgICAgICAgICAgeG91dC53W2RdICs9IHgud1tkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHByb2R1Y2UgYXZlcmFnZVxuICAgICAgZm9yKHZhciBkPTA7ZDxuO2QrKykge1xuICAgICAgICB4b3V0LndbZF0gLz0gbjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB4b3V0O1xuICAgIH0sXG5cbiAgICBwcmVkaWN0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgeG91dCA9IHRoaXMucHJlZGljdF9zb2Z0KGRhdGEpO1xuICAgICAgaWYoeG91dC53Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICB2YXIgc3RhdHMgPSBtYXhtaW4oeG91dC53KTtcbiAgICAgICAgdmFyIHByZWRpY3RlZF9sYWJlbCA9IHN0YXRzLm1heGk7IFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHByZWRpY3RlZF9sYWJlbCA9IC0xOyAvLyBlcnJvciBvdXRcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmVkaWN0ZWRfbGFiZWw7XG5cbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIGR1bXAgdGhlIHRvcCBlbnNlbWJsZV9zaXplIG5ldHdvcmtzIGFzIGEgbGlzdFxuICAgICAgdmFyIG52ID0gTWF0aC5taW4odGhpcy5lbnNlbWJsZV9zaXplLCB0aGlzLmV2YWx1YXRlZF9jYW5kaWRhdGVzLmxlbmd0aCk7XG4gICAgICB2YXIganNvbiA9IHt9O1xuICAgICAganNvbi5uZXRzID0gW107XG4gICAgICBmb3IodmFyIGk9MDtpPG52O2krKykge1xuICAgICAgICBqc29uLm5ldHMucHVzaCh0aGlzLmV2YWx1YXRlZF9jYW5kaWRhdGVzW2ldLm5ldC50b0pTT04oKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9LFxuXG4gICAgZnJvbUpTT046IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgIHRoaXMuZW5zZW1ibGVfc2l6ZSA9IGpzb24ubmV0cy5sZW5ndGg7XG4gICAgICB0aGlzLmV2YWx1YXRlZF9jYW5kaWRhdGVzID0gW107XG4gICAgICBmb3IodmFyIGk9MDtpPHRoaXMuZW5zZW1ibGVfc2l6ZTtpKyspIHtcbiAgICAgICAgdmFyIG5ldCA9IG5ldyBOZXQoKTtcbiAgICAgICAgbmV0LmZyb21KU09OKGpzb24ubmV0c1tpXSk7XG4gICAgICAgIHZhciBkdW1teV9jYW5kaWRhdGUgPSB7fTtcbiAgICAgICAgZHVtbXlfY2FuZGlkYXRlLm5ldCA9IG5ldDtcbiAgICAgICAgdGhpcy5ldmFsdWF0ZWRfY2FuZGlkYXRlcy5wdXNoKGR1bW15X2NhbmRpZGF0ZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAgIC8vIGNhbGxlZCB3aGVuIGEgZm9sZCBpcyBmaW5pc2hlZCwgd2hpbGUgZXZhbHVhdGluZyBhIGJhdGNoXG4gICAgb25GaW5pc2hGb2xkOiBmdW5jdGlvbihmKSB7IHRoaXMuZmluaXNoX2ZvbGRfY2FsbGJhY2sgPSBmOyB9LFxuICAgIC8vIGNhbGxlZCB3aGVuIGEgYmF0Y2ggb2YgY2FuZGlkYXRlcyBoYXMgZmluaXNoZWQgZXZhbHVhdGluZ1xuICAgIG9uRmluaXNoQmF0Y2g6IGZ1bmN0aW9uKGYpIHsgdGhpcy5maW5pc2hfYmF0Y2hfY2FsbGJhY2sgPSBmOyB9XG4gICAgXG4gIH07XG5cbiAgZ2xvYmFsLk1hZ2ljTmV0ID0gTWFnaWNOZXQ7XG59KShjb252bmV0anMpO1xudGhpcy5jb252bmV0anMgPSBjb252bmV0anM7XG4iLCIvKlxuIChjKSAyMDEzLCBWbGFkaW1pciBBZ2Fmb25raW5cbiBTaW1wbGlmeS5qcywgYSBoaWdoLXBlcmZvcm1hbmNlIEpTIHBvbHlsaW5lIHNpbXBsaWZpY2F0aW9uIGxpYnJhcnlcbiBtb3VybmVyLmdpdGh1Yi5pby9zaW1wbGlmeS1qc1xuKi9cblxudGhpcy5zaW1wbGlmeSA9IChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuLy8gdG8gc3VpdCB5b3VyIHBvaW50IGZvcm1hdCwgcnVuIHNlYXJjaC9yZXBsYWNlIGZvciAnLngnIGFuZCAnLnknO1xuLy8gZm9yIDNEIHZlcnNpb24sIHNlZSAzZCBicmFuY2ggKGNvbmZpZ3VyYWJpbGl0eSB3b3VsZCBkcmF3IHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIG92ZXJoZWFkKVxuXG4vLyBzcXVhcmUgZGlzdGFuY2UgYmV0d2VlbiAyIHBvaW50c1xuZnVuY3Rpb24gZ2V0U3FEaXN0KHAxLCBwMikge1xuXG4gICAgdmFyIGR4ID0gcDEueCAtIHAyLngsXG4gICAgICAgIGR5ID0gcDEueSAtIHAyLnk7XG5cbiAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbi8vIHNxdWFyZSBkaXN0YW5jZSBmcm9tIGEgcG9pbnQgdG8gYSBzZWdtZW50XG5mdW5jdGlvbiBnZXRTcVNlZ0Rpc3QocCwgcDEsIHAyKSB7XG5cbiAgICB2YXIgeCA9IHAxLngsXG4gICAgICAgIHkgPSBwMS55LFxuICAgICAgICBkeCA9IHAyLnggLSB4LFxuICAgICAgICBkeSA9IHAyLnkgLSB5O1xuXG4gICAgaWYgKGR4ICE9PSAwIHx8IGR5ICE9PSAwKSB7XG5cbiAgICAgICAgdmFyIHQgPSAoKHAueCAtIHgpICogZHggKyAocC55IC0geSkgKiBkeSkgLyAoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICAgIGlmICh0ID4gMSkge1xuICAgICAgICAgICAgeCA9IHAyLng7XG4gICAgICAgICAgICB5ID0gcDIueTtcblxuICAgICAgICB9IGVsc2UgaWYgKHQgPiAwKSB7XG4gICAgICAgICAgICB4ICs9IGR4ICogdDtcbiAgICAgICAgICAgIHkgKz0gZHkgKiB0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHggPSBwLnggLSB4O1xuICAgIGR5ID0gcC55IC0geTtcblxuICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cbi8vIHJlc3Qgb2YgdGhlIGNvZGUgZG9lc24ndCBjYXJlIGFib3V0IHBvaW50IGZvcm1hdFxuXG4vLyBiYXNpYyBkaXN0YW5jZS1iYXNlZCBzaW1wbGlmaWNhdGlvblxuZnVuY3Rpb24gc2ltcGxpZnlSYWRpYWxEaXN0KHBvaW50cywgc3FUb2xlcmFuY2UpIHtcblxuICAgIHZhciBwcmV2UG9pbnQgPSBwb2ludHNbMF0sXG4gICAgICAgIG5ld1BvaW50cyA9IFtwcmV2UG9pbnRdLFxuICAgICAgICBwb2ludDtcblxuICAgIGZvciAodmFyIGkgPSAxLCBsZW4gPSBwb2ludHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcG9pbnQgPSBwb2ludHNbaV07XG5cbiAgICAgICAgaWYgKGdldFNxRGlzdChwb2ludCwgcHJldlBvaW50KSA+IHNxVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBuZXdQb2ludHMucHVzaChwb2ludCk7XG4gICAgICAgICAgICBwcmV2UG9pbnQgPSBwb2ludDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcmV2UG9pbnQgIT09IHBvaW50KSBuZXdQb2ludHMucHVzaChwb2ludCk7XG5cbiAgICByZXR1cm4gbmV3UG9pbnRzO1xufVxuXG5mdW5jdGlvbiBzaW1wbGlmeURQU3RlcChwb2ludHMsIGZpcnN0LCBsYXN0LCBzcVRvbGVyYW5jZSwgc2ltcGxpZmllZCkge1xuICAgIHZhciBtYXhTcURpc3QgPSBzcVRvbGVyYW5jZSxcbiAgICAgICAgaW5kZXg7XG5cbiAgICBmb3IgKHZhciBpID0gZmlyc3QgKyAxOyBpIDwgbGFzdDsgaSsrKSB7XG4gICAgICAgIHZhciBzcURpc3QgPSBnZXRTcVNlZ0Rpc3QocG9pbnRzW2ldLCBwb2ludHNbZmlyc3RdLCBwb2ludHNbbGFzdF0pO1xuXG4gICAgICAgIGlmIChzcURpc3QgPiBtYXhTcURpc3QpIHtcbiAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgIG1heFNxRGlzdCA9IHNxRGlzdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXhTcURpc3QgPiBzcVRvbGVyYW5jZSkge1xuICAgICAgICBpZiAoaW5kZXggLSBmaXJzdCA+IDEpIHNpbXBsaWZ5RFBTdGVwKHBvaW50cywgZmlyc3QsIGluZGV4LCBzcVRvbGVyYW5jZSwgc2ltcGxpZmllZCk7XG4gICAgICAgIHNpbXBsaWZpZWQucHVzaChwb2ludHNbaW5kZXhdKTtcbiAgICAgICAgaWYgKGxhc3QgLSBpbmRleCA+IDEpIHNpbXBsaWZ5RFBTdGVwKHBvaW50cywgaW5kZXgsIGxhc3QsIHNxVG9sZXJhbmNlLCBzaW1wbGlmaWVkKTtcbiAgICB9XG59XG5cbi8vIHNpbXBsaWZpY2F0aW9uIHVzaW5nIFJhbWVyLURvdWdsYXMtUGV1Y2tlciBhbGdvcml0aG1cbmZ1bmN0aW9uIHNpbXBsaWZ5RG91Z2xhc1BldWNrZXIocG9pbnRzLCBzcVRvbGVyYW5jZSkge1xuICAgIHZhciBsYXN0ID0gcG9pbnRzLmxlbmd0aCAtIDE7XG5cbiAgICB2YXIgc2ltcGxpZmllZCA9IFtwb2ludHNbMF1dO1xuICAgIHNpbXBsaWZ5RFBTdGVwKHBvaW50cywgMCwgbGFzdCwgc3FUb2xlcmFuY2UsIHNpbXBsaWZpZWQpO1xuICAgIHNpbXBsaWZpZWQucHVzaChwb2ludHNbbGFzdF0pO1xuXG4gICAgcmV0dXJuIHNpbXBsaWZpZWQ7XG59XG5cbi8vIGJvdGggYWxnb3JpdGhtcyBjb21iaW5lZCBmb3IgYXdlc29tZSBwZXJmb3JtYW5jZVxuZnVuY3Rpb24gc2ltcGxpZnkocG9pbnRzLCB0b2xlcmFuY2UsIGhpZ2hlc3RRdWFsaXR5KSB7XG5cbiAgICBpZiAocG9pbnRzLmxlbmd0aCA8PSAyKSByZXR1cm4gcG9pbnRzO1xuXG4gICAgdmFyIHNxVG9sZXJhbmNlID0gdG9sZXJhbmNlICE9PSB1bmRlZmluZWQgPyB0b2xlcmFuY2UgKiB0b2xlcmFuY2UgOiAxO1xuXG4gICAgcG9pbnRzID0gaGlnaGVzdFF1YWxpdHkgPyBwb2ludHMgOiBzaW1wbGlmeVJhZGlhbERpc3QocG9pbnRzLCBzcVRvbGVyYW5jZSk7XG4gICAgcG9pbnRzID0gc2ltcGxpZnlEb3VnbGFzUGV1Y2tlcihwb2ludHMsIHNxVG9sZXJhbmNlKTtcblxuICAgIHJldHVybiBwb2ludHM7XG59XG5cbi8vIGV4cG9ydCBhcyBBTUQgbW9kdWxlIC8gTm9kZSBtb2R1bGUgLyBicm93c2VyIG9yIHdvcmtlciB2YXJpYWJsZVxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2ltcGxpZnk7IH0pO1xuZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gc2ltcGxpZnk7XG5lbHNlIHJldHVybiBzaW1wbGlmeTtcblxufSkoKTtcbiIsIi8qIVxuQ29weXJpZ2h0IChDKSAyMDEwLTIwMTMgUmF5bW9uZCBIaWxsOiBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2lcbk1JVCBMaWNlbnNlOiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL0xJQ0VOU0UubWRcbiovXG4vKlxuQXV0aG9yOiBSYXltb25kIEhpbGwgKHJoaWxsQHJheW1vbmRoaWxsLm5ldClcbkNvbnRyaWJ1dG9yOiBKZXNzZSBNb3JnYW4gKG1vcmdhamVsQGdtYWlsLmNvbSlcbkZpbGU6IHJoaWxsLXZvcm9ub2ktY29yZS5qc1xuVmVyc2lvbjogMC45OFxuRGF0ZTogSmFudWFyeSAyMSwgMjAxM1xuRGVzY3JpcHRpb246IFRoaXMgaXMgbXkgcGVyc29uYWwgSmF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZlxuU3RldmVuIEZvcnR1bmUncyBhbGdvcml0aG0gdG8gY29tcHV0ZSBWb3Jvbm9pIGRpYWdyYW1zLlxuXG5MaWNlbnNlOiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL0xJQ0VOU0UubWRcbkNyZWRpdHM6IFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvQ1JFRElUUy5tZFxuSGlzdG9yeTogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9DSEFOR0VMT0cubWRcblxuIyMgVXNhZ2U6XG5cbiAgdmFyIHNpdGVzID0gW3t4OjMwMCx5OjMwMH0sIHt4OjEwMCx5OjEwMH0sIHt4OjIwMCx5OjUwMH0sIHt4OjI1MCx5OjQ1MH0sIHt4OjYwMCx5OjE1MH1dO1xuICAvLyB4bCwgeHIgbWVhbnMgeCBsZWZ0LCB4IHJpZ2h0XG4gIC8vIHl0LCB5YiBtZWFucyB5IHRvcCwgeSBib3R0b21cbiAgdmFyIGJib3ggPSB7eGw6MCwgeHI6ODAwLCB5dDowLCB5Yjo2MDB9O1xuICB2YXIgdm9yb25vaSA9IG5ldyBWb3Jvbm9pKCk7XG4gIC8vIHBhc3MgYW4gb2JqZWN0IHdoaWNoIGV4aGliaXRzIHhsLCB4ciwgeXQsIHliIHByb3BlcnRpZXMuIFRoZSBib3VuZGluZ1xuICAvLyBib3ggd2lsbCBiZSB1c2VkIHRvIGNvbm5lY3QgdW5ib3VuZCBlZGdlcywgYW5kIHRvIGNsb3NlIG9wZW4gY2VsbHNcbiAgcmVzdWx0ID0gdm9yb25vaS5jb21wdXRlKHNpdGVzLCBiYm94KTtcbiAgLy8gcmVuZGVyLCBmdXJ0aGVyIGFuYWx5emUsIGV0Yy5cblxuUmV0dXJuIHZhbHVlOlxuICBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG5cbiAgcmVzdWx0LnZlcnRpY2VzID0gYW4gYXJyYXkgb2YgdW5vcmRlcmVkLCB1bmlxdWUgVm9yb25vaS5WZXJ0ZXggb2JqZWN0cyBtYWtpbmdcbiAgICB1cCB0aGUgVm9yb25vaSBkaWFncmFtLlxuICByZXN1bHQuZWRnZXMgPSBhbiBhcnJheSBvZiB1bm9yZGVyZWQsIHVuaXF1ZSBWb3Jvbm9pLkVkZ2Ugb2JqZWN0cyBtYWtpbmcgdXBcbiAgICB0aGUgVm9yb25vaSBkaWFncmFtLlxuICByZXN1bHQuY2VsbHMgPSBhbiBhcnJheSBvZiBWb3Jvbm9pLkNlbGwgb2JqZWN0IG1ha2luZyB1cCB0aGUgVm9yb25vaSBkaWFncmFtLlxuICAgIEEgQ2VsbCBvYmplY3QgbWlnaHQgaGF2ZSBhbiBlbXB0eSBhcnJheSBvZiBoYWxmZWRnZXMsIG1lYW5pbmcgbm8gVm9yb25vaVxuICAgIGNlbGwgY291bGQgYmUgY29tcHV0ZWQgZm9yIGEgcGFydGljdWxhciBjZWxsLlxuICByZXN1bHQuZXhlY1RpbWUgPSB0aGUgdGltZSBpdCB0b29rIHRvIGNvbXB1dGUgdGhlIFZvcm9ub2kgZGlhZ3JhbSwgaW5cbiAgICBtaWxsaXNlY29uZHMuXG5cblZvcm9ub2kuVmVydGV4IG9iamVjdDpcbiAgeDogVGhlIHggcG9zaXRpb24gb2YgdGhlIHZlcnRleC5cbiAgeTogVGhlIHkgcG9zaXRpb24gb2YgdGhlIHZlcnRleC5cblxuVm9yb25vaS5FZGdlIG9iamVjdDpcbiAgbFNpdGU6IHRoZSBWb3Jvbm9pIHNpdGUgb2JqZWN0IGF0IHRoZSBsZWZ0IG9mIHRoaXMgVm9yb25vaS5FZGdlIG9iamVjdC5cbiAgclNpdGU6IHRoZSBWb3Jvbm9pIHNpdGUgb2JqZWN0IGF0IHRoZSByaWdodCBvZiB0aGlzIFZvcm9ub2kuRWRnZSBvYmplY3QgKGNhblxuICAgIGJlIG51bGwpLlxuICB2YTogYW4gb2JqZWN0IHdpdGggYW4gJ3gnIGFuZCBhICd5JyBwcm9wZXJ0eSBkZWZpbmluZyB0aGUgc3RhcnQgcG9pbnRcbiAgICAocmVsYXRpdmUgdG8gdGhlIFZvcm9ub2kgc2l0ZSBvbiB0aGUgbGVmdCkgb2YgdGhpcyBWb3Jvbm9pLkVkZ2Ugb2JqZWN0LlxuICB2YjogYW4gb2JqZWN0IHdpdGggYW4gJ3gnIGFuZCBhICd5JyBwcm9wZXJ0eSBkZWZpbmluZyB0aGUgZW5kIHBvaW50XG4gICAgKHJlbGF0aXZlIHRvIFZvcm9ub2kgc2l0ZSBvbiB0aGUgbGVmdCkgb2YgdGhpcyBWb3Jvbm9pLkVkZ2Ugb2JqZWN0LlxuXG4gIEZvciBlZGdlcyB3aGljaCBhcmUgdXNlZCB0byBjbG9zZSBvcGVuIGNlbGxzICh1c2luZyB0aGUgc3VwcGxpZWQgYm91bmRpbmdcbiAgYm94KSwgdGhlIHJTaXRlIHByb3BlcnR5IHdpbGwgYmUgbnVsbC5cblxuVm9yb25vaS5DZWxsIG9iamVjdDpcbiAgc2l0ZTogdGhlIFZvcm9ub2kgc2l0ZSBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBWb3Jvbm9pIGNlbGwuXG4gIGhhbGZlZGdlczogYW4gYXJyYXkgb2YgVm9yb25vaS5IYWxmZWRnZSBvYmplY3RzLCBvcmRlcmVkIGNvdW50ZXJjbG9ja3dpc2UsXG4gICAgZGVmaW5pbmcgdGhlIHBvbHlnb24gZm9yIHRoaXMgVm9yb25vaSBjZWxsLlxuXG5Wb3Jvbm9pLkhhbGZlZGdlIG9iamVjdDpcbiAgc2l0ZTogdGhlIFZvcm9ub2kgc2l0ZSBvYmplY3Qgb3duaW5nIHRoaXMgVm9yb25vaS5IYWxmZWRnZSBvYmplY3QuXG4gIGVkZ2U6IGEgcmVmZXJlbmNlIHRvIHRoZSB1bmlxdWUgVm9yb25vaS5FZGdlIG9iamVjdCB1bmRlcmx5aW5nIHRoaXNcbiAgICBWb3Jvbm9pLkhhbGZlZGdlIG9iamVjdC5cbiAgZ2V0U3RhcnRwb2ludCgpOiBhIG1ldGhvZCByZXR1cm5pbmcgYW4gb2JqZWN0IHdpdGggYW4gJ3gnIGFuZCBhICd5JyBwcm9wZXJ0eVxuICAgIGZvciB0aGUgc3RhcnQgcG9pbnQgb2YgdGhpcyBoYWxmZWRnZS4gS2VlcCBpbiBtaW5kIGhhbGZlZGdlcyBhcmUgYWx3YXlzXG4gICAgY291bnRlcmNvY2t3aXNlLlxuICBnZXRFbmRwb2ludCgpOiBhIG1ldGhvZCByZXR1cm5pbmcgYW4gb2JqZWN0IHdpdGggYW4gJ3gnIGFuZCBhICd5JyBwcm9wZXJ0eVxuICAgIGZvciB0aGUgZW5kIHBvaW50IG9mIHRoaXMgaGFsZmVkZ2UuIEtlZXAgaW4gbWluZCBoYWxmZWRnZXMgYXJlIGFsd2F5c1xuICAgIGNvdW50ZXJjb2Nrd2lzZS5cblxuVE9ETzogSWRlbnRpZnkgb3Bwb3J0dW5pdGllcyBmb3IgcGVyZm9ybWFuY2UgaW1wcm92ZW1lbnQuXG5cblRPRE86IExldCB0aGUgdXNlciBjbG9zZSB0aGUgVm9yb25vaSBjZWxscywgZG8gbm90IGRvIGl0IGF1dG9tYXRpY2FsbHkuIE5vdCBvbmx5IGxldFxuICAgICAgaGltIGNsb3NlIHRoZSBjZWxscywgYnV0IGFsc28gYWxsb3cgaGltIHRvIGNsb3NlIG1vcmUgdGhhbiBvbmNlIHVzaW5nIGEgZGlmZmVyZW50XG4gICAgICBib3VuZGluZyBib3ggZm9yIHRoZSBzYW1lIFZvcm9ub2kgZGlhZ3JhbS5cbiovXG5cbi8qZ2xvYmFsIE1hdGggKi9cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIFZvcm9ub2koKSB7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IG51bGw7XG4gICAgdGhpcy5lZGdlcyA9IG51bGw7XG4gICAgdGhpcy5jZWxscyA9IG51bGw7XG4gICAgdGhpcy50b1JlY3ljbGUgPSBudWxsO1xuICAgIHRoaXMuYmVhY2hzZWN0aW9uSnVua3lhcmQgPSBbXTtcbiAgICB0aGlzLmNpcmNsZUV2ZW50SnVua3lhcmQgPSBbXTtcbiAgICB0aGlzLnZlcnRleEp1bmt5YXJkID0gW107XG4gICAgdGhpcy5lZGdlSnVua3lhcmQgPSBbXTtcbiAgICB0aGlzLmNlbGxKdW5reWFyZCA9IFtdO1xuICAgIH1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblZvcm9ub2kucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmJlYWNobGluZSkge1xuICAgICAgICB0aGlzLmJlYWNobGluZSA9IG5ldyB0aGlzLlJCVHJlZSgpO1xuICAgICAgICB9XG4gICAgLy8gTW92ZSBsZWZ0b3ZlciBiZWFjaHNlY3Rpb25zIHRvIHRoZSBiZWFjaHNlY3Rpb24ganVua3lhcmQuXG4gICAgaWYgKHRoaXMuYmVhY2hsaW5lLnJvb3QpIHtcbiAgICAgICAgdmFyIGJlYWNoc2VjdGlvbiA9IHRoaXMuYmVhY2hsaW5lLmdldEZpcnN0KHRoaXMuYmVhY2hsaW5lLnJvb3QpO1xuICAgICAgICB3aGlsZSAoYmVhY2hzZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmJlYWNoc2VjdGlvbkp1bmt5YXJkLnB1c2goYmVhY2hzZWN0aW9uKTsgLy8gbWFyayBmb3IgcmV1c2VcbiAgICAgICAgICAgIGJlYWNoc2VjdGlvbiA9IGJlYWNoc2VjdGlvbi5yYk5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB0aGlzLmJlYWNobGluZS5yb290ID0gbnVsbDtcbiAgICBpZiAoIXRoaXMuY2lyY2xlRXZlbnRzKSB7XG4gICAgICAgIHRoaXMuY2lyY2xlRXZlbnRzID0gbmV3IHRoaXMuUkJUcmVlKCk7XG4gICAgICAgIH1cbiAgICB0aGlzLmNpcmNsZUV2ZW50cy5yb290ID0gdGhpcy5maXJzdENpcmNsZUV2ZW50ID0gbnVsbDtcbiAgICB0aGlzLnZlcnRpY2VzID0gW107XG4gICAgdGhpcy5lZGdlcyA9IFtdO1xuICAgIHRoaXMuY2VsbHMgPSBbXTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5zcXJ0ID0gTWF0aC5zcXJ0O1xuVm9yb25vaS5wcm90b3R5cGUuYWJzID0gTWF0aC5hYnM7XG5Wb3Jvbm9pLnByb3RvdHlwZS7OtSA9IFZvcm9ub2kuzrUgPSAxZS05O1xuVm9yb25vaS5wcm90b3R5cGUuaW52zrUgPSBWb3Jvbm9pLmluds61ID0gMS4wIC8gVm9yb25vaS7OtTtcblZvcm9ub2kucHJvdG90eXBlLmVxdWFsV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiB0aGlzLmFicyhhLWIpPDFlLTk7fTtcblZvcm9ub2kucHJvdG90eXBlLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiBhLWI+MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUuZ3JlYXRlclRoYW5PckVxdWFsV2l0aEVwc2lsb24gPSBmdW5jdGlvbihhLGIpe3JldHVybiBiLWE8MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUubGVzc1RoYW5XaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYT4xZS05O307XG5Wb3Jvbm9pLnByb3RvdHlwZS5sZXNzVGhhbk9yRXF1YWxXaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEtYjwxZS05O307XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUmVkLUJsYWNrIHRyZWUgY29kZSAoYmFzZWQgb24gQyB2ZXJzaW9uIG9mIFwicmJ0cmVlXCIgYnkgRnJhbmNrIEJ1aS1IdXVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYnVpaHV1L2xpYnRyZWUvYmxvYi9tYXN0ZXIvcmIuY1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5SQlRyZWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJvb3QgPSBudWxsO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUucmJJbnNlcnRTdWNjZXNzb3IgPSBmdW5jdGlvbihub2RlLCBzdWNjZXNzb3IpIHtcbiAgICB2YXIgcGFyZW50O1xuICAgIGlmIChub2RlKSB7XG4gICAgICAgIC8vID4+PiByaGlsbCAyMDExLTA1LTI3OiBQZXJmb3JtYW5jZTogY2FjaGUgcHJldmlvdXMvbmV4dCBub2Rlc1xuICAgICAgICBzdWNjZXNzb3IucmJQcmV2aW91cyA9IG5vZGU7XG4gICAgICAgIHN1Y2Nlc3Nvci5yYk5leHQgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgaWYgKG5vZGUucmJOZXh0KSB7XG4gICAgICAgICAgICBub2RlLnJiTmV4dC5yYlByZXZpb3VzID0gc3VjY2Vzc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICBub2RlLnJiTmV4dCA9IHN1Y2Nlc3NvcjtcbiAgICAgICAgLy8gPDw8XG4gICAgICAgIGlmIChub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgICAgIC8vIGluLXBsYWNlIGV4cGFuc2lvbiBvZiBub2RlLnJiUmlnaHQuZ2V0Rmlyc3QoKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZS5yYkxlZnQpIHtub2RlID0gbm9kZS5yYkxlZnQ7fVxuICAgICAgICAgICAgbm9kZS5yYkxlZnQgPSBzdWNjZXNzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5yYlJpZ2h0ID0gc3VjY2Vzc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBub2RlO1xuICAgICAgICB9XG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wNzogaWYgbm9kZSBpcyBudWxsLCBzdWNjZXNzb3IgbXVzdCBiZSBpbnNlcnRlZFxuICAgIC8vIHRvIHRoZSBsZWZ0LW1vc3QgcGFydCBvZiB0aGUgdHJlZVxuICAgIGVsc2UgaWYgKHRoaXMucm9vdCkge1xuICAgICAgICBub2RlID0gdGhpcy5nZXRGaXJzdCh0aGlzLnJvb3QpO1xuICAgICAgICAvLyA+Pj4gUGVyZm9ybWFuY2U6IGNhY2hlIHByZXZpb3VzL25leHQgbm9kZXNcbiAgICAgICAgc3VjY2Vzc29yLnJiUHJldmlvdXMgPSBudWxsO1xuICAgICAgICBzdWNjZXNzb3IucmJOZXh0ID0gbm9kZTtcbiAgICAgICAgbm9kZS5yYlByZXZpb3VzID0gc3VjY2Vzc29yO1xuICAgICAgICAvLyA8PDxcbiAgICAgICAgbm9kZS5yYkxlZnQgPSBzdWNjZXNzb3I7XG4gICAgICAgIHBhcmVudCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gPj4+IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgICAgIHN1Y2Nlc3Nvci5yYlByZXZpb3VzID0gc3VjY2Vzc29yLnJiTmV4dCA9IG51bGw7XG4gICAgICAgIC8vIDw8PFxuICAgICAgICB0aGlzLnJvb3QgPSBzdWNjZXNzb3I7XG4gICAgICAgIHBhcmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICBzdWNjZXNzb3IucmJMZWZ0ID0gc3VjY2Vzc29yLnJiUmlnaHQgPSBudWxsO1xuICAgIHN1Y2Nlc3Nvci5yYlBhcmVudCA9IHBhcmVudDtcbiAgICBzdWNjZXNzb3IucmJSZWQgPSB0cnVlO1xuICAgIC8vIEZpeHVwIHRoZSBtb2RpZmllZCB0cmVlIGJ5IHJlY29sb3Jpbmcgbm9kZXMgYW5kIHBlcmZvcm1pbmdcbiAgICAvLyByb3RhdGlvbnMgKDIgYXQgbW9zdCkgaGVuY2UgdGhlIHJlZC1ibGFjayB0cmVlIHByb3BlcnRpZXMgYXJlXG4gICAgLy8gcHJlc2VydmVkLlxuICAgIHZhciBncmFuZHBhLCB1bmNsZTtcbiAgICBub2RlID0gc3VjY2Vzc29yO1xuICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50LnJiUmVkKSB7XG4gICAgICAgIGdyYW5kcGEgPSBwYXJlbnQucmJQYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQgPT09IGdyYW5kcGEucmJMZWZ0KSB7XG4gICAgICAgICAgICB1bmNsZSA9IGdyYW5kcGEucmJSaWdodDtcbiAgICAgICAgICAgIGlmICh1bmNsZSAmJiB1bmNsZS5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IHVuY2xlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGdyYW5kcGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHBhcmVudC5yYlJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBncmFuZHBhLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQoZ3JhbmRwYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHVuY2xlID0gZ3JhbmRwYS5yYkxlZnQ7XG4gICAgICAgICAgICBpZiAodW5jbGUgJiYgdW5jbGUucmJSZWQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB1bmNsZS5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGdyYW5kcGEucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBncmFuZHBhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBwYXJlbnQucmJMZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICBub2RlID0gcGFyZW50O1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBub2RlLnJiUGFyZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZUxlZnQoZ3JhbmRwYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBub2RlLnJiUGFyZW50O1xuICAgICAgICB9XG4gICAgdGhpcy5yb290LnJiUmVkID0gZmFsc2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJlbW92ZU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgLy8gPj4+IHJoaWxsIDIwMTEtMDUtMjc6IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgaWYgKG5vZGUucmJOZXh0KSB7XG4gICAgICAgIG5vZGUucmJOZXh0LnJiUHJldmlvdXMgPSBub2RlLnJiUHJldmlvdXM7XG4gICAgICAgIH1cbiAgICBpZiAobm9kZS5yYlByZXZpb3VzKSB7XG4gICAgICAgIG5vZGUucmJQcmV2aW91cy5yYk5leHQgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgfVxuICAgIG5vZGUucmJOZXh0ID0gbm9kZS5yYlByZXZpb3VzID0gbnVsbDtcbiAgICAvLyA8PDxcbiAgICB2YXIgcGFyZW50ID0gbm9kZS5yYlBhcmVudCxcbiAgICAgICAgbGVmdCA9IG5vZGUucmJMZWZ0LFxuICAgICAgICByaWdodCA9IG5vZGUucmJSaWdodCxcbiAgICAgICAgbmV4dDtcbiAgICBpZiAoIWxlZnQpIHtcbiAgICAgICAgbmV4dCA9IHJpZ2h0O1xuICAgICAgICB9XG4gICAgZWxzZSBpZiAoIXJpZ2h0KSB7XG4gICAgICAgIG5leHQgPSBsZWZ0O1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldEZpcnN0KHJpZ2h0KTtcbiAgICAgICAgfVxuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5yYkxlZnQgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudC5yYkxlZnQgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yYlJpZ2h0ID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJvb3QgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gZW5mb3JjZSByZWQtYmxhY2sgcnVsZXNcbiAgICB2YXIgaXNSZWQ7XG4gICAgaWYgKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgICAgaXNSZWQgPSBuZXh0LnJiUmVkO1xuICAgICAgICBuZXh0LnJiUmVkID0gbm9kZS5yYlJlZDtcbiAgICAgICAgbmV4dC5yYkxlZnQgPSBsZWZ0O1xuICAgICAgICBsZWZ0LnJiUGFyZW50ID0gbmV4dDtcbiAgICAgICAgaWYgKG5leHQgIT09IHJpZ2h0KSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBuZXh0LnJiUGFyZW50O1xuICAgICAgICAgICAgbmV4dC5yYlBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICBub2RlID0gbmV4dC5yYlJpZ2h0O1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IG5vZGU7XG4gICAgICAgICAgICBuZXh0LnJiUmlnaHQgPSByaWdodDtcbiAgICAgICAgICAgIHJpZ2h0LnJiUGFyZW50ID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXh0LnJiUGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgcGFyZW50ID0gbmV4dDtcbiAgICAgICAgICAgIG5vZGUgPSBuZXh0LnJiUmlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaXNSZWQgPSBub2RlLnJiUmVkO1xuICAgICAgICBub2RlID0gbmV4dDtcbiAgICAgICAgfVxuICAgIC8vICdub2RlJyBpcyBub3cgdGhlIHNvbGUgc3VjY2Vzc29yJ3MgY2hpbGQgYW5kICdwYXJlbnQnIGl0c1xuICAgIC8vIG5ldyBwYXJlbnQgKHNpbmNlIHRoZSBzdWNjZXNzb3IgY2FuIGhhdmUgYmVlbiBtb3ZlZClcbiAgICBpZiAobm9kZSkge1xuICAgICAgICBub2RlLnJiUGFyZW50ID0gcGFyZW50O1xuICAgICAgICB9XG4gICAgLy8gdGhlICdlYXN5JyBjYXNlc1xuICAgIGlmIChpc1JlZCkge3JldHVybjt9XG4gICAgaWYgKG5vZGUgJiYgbm9kZS5yYlJlZCkge1xuICAgICAgICBub2RlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIC8vIHRoZSBvdGhlciBjYXNlc1xuICAgIHZhciBzaWJsaW5nO1xuICAgIGRvIHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmIChub2RlID09PSBwYXJlbnQucmJMZWZ0KSB7XG4gICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiUmlnaHQ7XG4gICAgICAgICAgICBpZiAoc2libGluZy5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoc2libGluZy5yYkxlZnQgJiYgc2libGluZy5yYkxlZnQucmJSZWQpIHx8IChzaWJsaW5nLnJiUmlnaHQgJiYgc2libGluZy5yYlJpZ2h0LnJiUmVkKSkge1xuICAgICAgICAgICAgICAgIGlmICghc2libGluZy5yYlJpZ2h0IHx8ICFzaWJsaW5nLnJiUmlnaHQucmJSZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYkxlZnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChzaWJsaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHBhcmVudC5yYlJlZDtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBzaWJsaW5nLnJiUmlnaHQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlTGVmdChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQucmJMZWZ0O1xuICAgICAgICAgICAgaWYgKHNpYmxpbmcucmJSZWQpIHtcbiAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiTGVmdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKHNpYmxpbmcucmJMZWZ0ICYmIHNpYmxpbmcucmJMZWZ0LnJiUmVkKSB8fCAoc2libGluZy5yYlJpZ2h0ICYmIHNpYmxpbmcucmJSaWdodC5yYlJlZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNpYmxpbmcucmJMZWZ0IHx8ICFzaWJsaW5nLnJiTGVmdC5yYlJlZCkge1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmlnaHQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHNpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBwYXJlbnQucmJSZWQ7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gc2libGluZy5yYkxlZnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlUmlnaHQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5yb290O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgc2libGluZy5yYlJlZCA9IHRydWU7XG4gICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5yYlBhcmVudDtcbiAgICB9IHdoaWxlICghbm9kZS5yYlJlZCk7XG4gICAgaWYgKG5vZGUpIHtub2RlLnJiUmVkID0gZmFsc2U7fVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUucmJSb3RhdGVMZWZ0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwID0gbm9kZSxcbiAgICAgICAgcSA9IG5vZGUucmJSaWdodCwgLy8gY2FuJ3QgYmUgbnVsbFxuICAgICAgICBwYXJlbnQgPSBwLnJiUGFyZW50O1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5yYkxlZnQgPT09IHApIHtcbiAgICAgICAgICAgIHBhcmVudC5yYkxlZnQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yYlJpZ2h0ID0gcTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJvb3QgPSBxO1xuICAgICAgICB9XG4gICAgcS5yYlBhcmVudCA9IHBhcmVudDtcbiAgICBwLnJiUGFyZW50ID0gcTtcbiAgICBwLnJiUmlnaHQgPSBxLnJiTGVmdDtcbiAgICBpZiAocC5yYlJpZ2h0KSB7XG4gICAgICAgIHAucmJSaWdodC5yYlBhcmVudCA9IHA7XG4gICAgICAgIH1cbiAgICBxLnJiTGVmdCA9IHA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJvdGF0ZVJpZ2h0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwID0gbm9kZSxcbiAgICAgICAgcSA9IG5vZGUucmJMZWZ0LCAvLyBjYW4ndCBiZSBudWxsXG4gICAgICAgIHBhcmVudCA9IHAucmJQYXJlbnQ7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LnJiTGVmdCA9PT0gcCkge1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IHE7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJiUmlnaHQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHE7XG4gICAgICAgIH1cbiAgICBxLnJiUGFyZW50ID0gcGFyZW50O1xuICAgIHAucmJQYXJlbnQgPSBxO1xuICAgIHAucmJMZWZ0ID0gcS5yYlJpZ2h0O1xuICAgIGlmIChwLnJiTGVmdCkge1xuICAgICAgICBwLnJiTGVmdC5yYlBhcmVudCA9IHA7XG4gICAgICAgIH1cbiAgICBxLnJiUmlnaHQgPSBwO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUuZ2V0Rmlyc3QgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgd2hpbGUgKG5vZGUucmJMZWZ0KSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgfVxuICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZS5wcm90b3R5cGUuZ2V0TGFzdCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB3aGlsZSAobm9kZS5yYlJpZ2h0KSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERpYWdyYW0gbWV0aG9kc1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5EaWFncmFtID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IHNpdGU7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDZWxsIG1ldGhvZHNcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuaGFsZmVkZ2VzID0gW107XG4gICAgdGhpcy5jbG9zZU1lID0gZmFsc2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuICAgIHRoaXMuaGFsZmVkZ2VzID0gW107XG4gICAgdGhpcy5jbG9zZU1lID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQ2VsbCA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggY2VsbCApIHtcbiAgICAgICAgcmV0dXJuIGNlbGwuaW5pdChzaXRlKTtcbiAgICAgICAgfVxuICAgIHJldHVybiBuZXcgdGhpcy5DZWxsKHNpdGUpO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLnByZXBhcmVIYWxmZWRnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFsZmVkZ2VzID0gdGhpcy5oYWxmZWRnZXMsXG4gICAgICAgIGlIYWxmZWRnZSA9IGhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2U7XG4gICAgLy8gZ2V0IHJpZCBvZiB1bnVzZWQgaGFsZmVkZ2VzXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNzogS2VlcCBpdCBzaW1wbGUsIG5vIHBvaW50IGhlcmUgaW4gdHJ5aW5nXG4gICAgLy8gdG8gYmUgZmFuY3k6IGRhbmdsaW5nIGVkZ2VzIGFyZSBhIHR5cGljYWxseSBhIG1pbm9yaXR5LlxuICAgIHdoaWxlIChpSGFsZmVkZ2UtLSkge1xuICAgICAgICBlZGdlID0gaGFsZmVkZ2VzW2lIYWxmZWRnZV0uZWRnZTtcbiAgICAgICAgaWYgKCFlZGdlLnZiIHx8ICFlZGdlLnZhKSB7XG4gICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlIYWxmZWRnZSwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNjogSSB0cmllZCB0byB1c2UgYSBiaW5hcnkgc2VhcmNoIGF0IGluc2VydGlvblxuICAgIC8vIHRpbWUgdG8ga2VlcCB0aGUgYXJyYXkgc29ydGVkIG9uLXRoZS1mbHkgKGluIENlbGwuYWRkSGFsZmVkZ2UoKSkuXG4gICAgLy8gVGhlcmUgd2FzIG5vIHJlYWwgYmVuZWZpdHMgaW4gZG9pbmcgc28sIHBlcmZvcm1hbmNlIG9uXG4gICAgLy8gRmlyZWZveCAzLjYgd2FzIGltcHJvdmVkIG1hcmdpbmFsbHksIHdoaWxlIHBlcmZvcm1hbmNlIG9uXG4gICAgLy8gT3BlcmEgMTEgd2FzIHBlbmFsaXplZCBtYXJnaW5hbGx5LlxuICAgIGhhbGZlZGdlcy5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGIuYW5nbGUtYS5hbmdsZTt9KTtcbiAgICByZXR1cm4gaGFsZmVkZ2VzLmxlbmd0aDtcbiAgICB9O1xuXG4vLyBSZXR1cm4gYSBsaXN0IG9mIHRoZSBuZWlnaGJvciBJZHNcblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLmdldE5laWdoYm9ySWRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5laWdoYm9ycyA9IFtdLFxuICAgICAgICBpSGFsZmVkZ2UgPSB0aGlzLmhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIGVkZ2U7XG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKXtcbiAgICAgICAgZWRnZSA9IHRoaXMuaGFsZmVkZ2VzW2lIYWxmZWRnZV0uZWRnZTtcbiAgICAgICAgaWYgKGVkZ2UubFNpdGUgIT09IG51bGwgJiYgZWRnZS5sU2l0ZS52b3Jvbm9pSWQgIT0gdGhpcy5zaXRlLnZvcm9ub2lJZCkge1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goZWRnZS5sU2l0ZS52b3Jvbm9pSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlZGdlLnJTaXRlICE9PSBudWxsICYmIGVkZ2UuclNpdGUudm9yb25vaUlkICE9IHRoaXMuc2l0ZS52b3Jvbm9pSWQpe1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goZWRnZS5yU2l0ZS52b3Jvbm9pSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgcmV0dXJuIG5laWdoYm9ycztcbiAgICB9O1xuXG4vLyBDb21wdXRlIGJvdW5kaW5nIGJveFxuLy9cblZvcm9ub2kucHJvdG90eXBlLkNlbGwucHJvdG90eXBlLmdldEJib3ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGFsZmVkZ2VzID0gdGhpcy5oYWxmZWRnZXMsXG4gICAgICAgIGlIYWxmZWRnZSA9IGhhbGZlZGdlcy5sZW5ndGgsXG4gICAgICAgIHhtaW4gPSBJbmZpbml0eSxcbiAgICAgICAgeW1pbiA9IEluZmluaXR5LFxuICAgICAgICB4bWF4ID0gLUluZmluaXR5LFxuICAgICAgICB5bWF4ID0gLUluZmluaXR5LFxuICAgICAgICB2LCB2eCwgdnk7XG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKSB7XG4gICAgICAgIHYgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgIHZ4ID0gdi54O1xuICAgICAgICB2eSA9IHYueTtcbiAgICAgICAgaWYgKHZ4IDwgeG1pbikge3htaW4gPSB2eDt9XG4gICAgICAgIGlmICh2eSA8IHltaW4pIHt5bWluID0gdnk7fVxuICAgICAgICBpZiAodnggPiB4bWF4KSB7eG1heCA9IHZ4O31cbiAgICAgICAgaWYgKHZ5ID4geW1heCkge3ltYXggPSB2eTt9XG4gICAgICAgIC8vIHdlIGRvbnQgbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBlbmQgcG9pbnQsXG4gICAgICAgIC8vIHNpbmNlIGVhY2ggZW5kIHBvaW50IG1hdGNoZXMgYSBzdGFydCBwb2ludFxuICAgICAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogeG1pbixcbiAgICAgICAgeTogeW1pbixcbiAgICAgICAgd2lkdGg6IHhtYXgteG1pbixcbiAgICAgICAgaGVpZ2h0OiB5bWF4LXltaW5cbiAgICAgICAgfTtcbiAgICB9O1xuXG4vLyBSZXR1cm4gd2hldGhlciBhIHBvaW50IGlzIGluc2lkZSwgb24sIG9yIG91dHNpZGUgdGhlIGNlbGw6XG4vLyAgIC0xOiBwb2ludCBpcyBvdXRzaWRlIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vICAgIDA6IHBvaW50IGlzIG9uIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vICAgIDE6IHBvaW50IGlzIGluc2lkZSB0aGUgcGVyaW1ldGVyIG9mIHRoZSBjZWxsXG4vL1xuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUucG9pbnRJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgLy8gQ2hlY2sgaWYgcG9pbnQgaW4gcG9seWdvbi4gU2luY2UgYWxsIHBvbHlnb25zIG9mIGEgVm9yb25vaVxuICAgIC8vIGRpYWdyYW0gYXJlIGNvbnZleCwgdGhlbjpcbiAgICAvLyBodHRwOi8vcGF1bGJvdXJrZS5uZXQvZ2VvbWV0cnkvcG9seWdvbm1lc2gvXG4gICAgLy8gU29sdXRpb24gMyAoMkQpOlxuICAgIC8vICAgXCJJZiB0aGUgcG9seWdvbiBpcyBjb252ZXggdGhlbiBvbmUgY2FuIGNvbnNpZGVyIHRoZSBwb2x5Z29uXG4gICAgLy8gICBcImFzIGEgJ3BhdGgnIGZyb20gdGhlIGZpcnN0IHZlcnRleC4gQSBwb2ludCBpcyBvbiB0aGUgaW50ZXJpb3JcbiAgICAvLyAgIFwib2YgdGhpcyBwb2x5Z29ucyBpZiBpdCBpcyBhbHdheXMgb24gdGhlIHNhbWUgc2lkZSBvZiBhbGwgdGhlXG4gICAgLy8gICBcImxpbmUgc2VnbWVudHMgbWFraW5nIHVwIHRoZSBwYXRoLiAuLi5cbiAgICAvLyAgIFwiKHkgLSB5MCkgKHgxIC0geDApIC0gKHggLSB4MCkgKHkxIC0geTApXG4gICAgLy8gICBcImlmIGl0IGlzIGxlc3MgdGhhbiAwIHRoZW4gUCBpcyB0byB0aGUgcmlnaHQgb2YgdGhlIGxpbmUgc2VnbWVudCxcbiAgICAvLyAgIFwiaWYgZ3JlYXRlciB0aGFuIDAgaXQgaXMgdG8gdGhlIGxlZnQsIGlmIGVxdWFsIHRvIDAgdGhlbiBpdCBsaWVzXG4gICAgLy8gICBcIm9uIHRoZSBsaW5lIHNlZ21lbnRcIlxuICAgIHZhciBoYWxmZWRnZXMgPSB0aGlzLmhhbGZlZGdlcyxcbiAgICAgICAgaUhhbGZlZGdlID0gaGFsZmVkZ2VzLmxlbmd0aCxcbiAgICAgICAgaGFsZmVkZ2UsXG4gICAgICAgIHAwLCBwMSwgcjtcbiAgICB3aGlsZSAoaUhhbGZlZGdlLS0pIHtcbiAgICAgICAgaGFsZmVkZ2UgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXTtcbiAgICAgICAgcDAgPSBoYWxmZWRnZS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgIHAxID0gaGFsZmVkZ2UuZ2V0RW5kcG9pbnQoKTtcbiAgICAgICAgciA9ICh5LXAwLnkpKihwMS54LXAwLngpLSh4LXAwLngpKihwMS55LXAwLnkpO1xuICAgICAgICBpZiAoIXIpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICBpZiAociA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHJldHVybiAxO1xuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRWRnZSBtZXRob2RzXG4vL1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5WZXJ0ZXggPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkVkZ2UgPSBmdW5jdGlvbihsU2l0ZSwgclNpdGUpIHtcbiAgICB0aGlzLmxTaXRlID0gbFNpdGU7XG4gICAgdGhpcy5yU2l0ZSA9IHJTaXRlO1xuICAgIHRoaXMudmEgPSB0aGlzLnZiID0gbnVsbDtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZSA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IGxTaXRlO1xuICAgIHRoaXMuZWRnZSA9IGVkZ2U7XG4gICAgLy8gJ2FuZ2xlJyBpcyBhIHZhbHVlIHRvIGJlIHVzZWQgZm9yIHByb3Blcmx5IHNvcnRpbmcgdGhlXG4gICAgLy8gaGFsZnNlZ21lbnRzIGNvdW50ZXJjbG9ja3dpc2UuIEJ5IGNvbnZlbnRpb24sIHdlIHdpbGxcbiAgICAvLyB1c2UgdGhlIGFuZ2xlIG9mIHRoZSBsaW5lIGRlZmluZWQgYnkgdGhlICdzaXRlIHRvIHRoZSBsZWZ0J1xuICAgIC8vIHRvIHRoZSAnc2l0ZSB0byB0aGUgcmlnaHQnLlxuICAgIC8vIEhvd2V2ZXIsIGJvcmRlciBlZGdlcyBoYXZlIG5vICdzaXRlIHRvIHRoZSByaWdodCc6IHRodXMgd2VcbiAgICAvLyB1c2UgdGhlIGFuZ2xlIG9mIGxpbmUgcGVycGVuZGljdWxhciB0byB0aGUgaGFsZnNlZ21lbnQgKHRoZVxuICAgIC8vIGVkZ2Ugc2hvdWxkIGhhdmUgYm90aCBlbmQgcG9pbnRzIGRlZmluZWQgaW4gc3VjaCBjYXNlLilcbiAgICBpZiAoclNpdGUpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IE1hdGguYXRhbjIoclNpdGUueS1sU2l0ZS55LCByU2l0ZS54LWxTaXRlLngpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciB2YSA9IGVkZ2UudmEsXG4gICAgICAgICAgICB2YiA9IGVkZ2UudmI7XG4gICAgICAgIC8vIHJoaWxsIDIwMTEtMDUtMzE6IHVzZWQgdG8gY2FsbCBnZXRTdGFydHBvaW50KCkvZ2V0RW5kcG9pbnQoKSxcbiAgICAgICAgLy8gYnV0IGZvciBwZXJmb3JtYW5jZSBwdXJwb3NlLCB0aGVzZSBhcmUgZXhwYW5kZWQgaW4gcGxhY2UgaGVyZS5cbiAgICAgICAgdGhpcy5hbmdsZSA9IGVkZ2UubFNpdGUgPT09IGxTaXRlID9cbiAgICAgICAgICAgIE1hdGguYXRhbjIodmIueC12YS54LCB2YS55LXZiLnkpIDpcbiAgICAgICAgICAgIE1hdGguYXRhbjIodmEueC12Yi54LCB2Yi55LXZhLnkpO1xuICAgICAgICB9XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlSGFsZmVkZ2UgPSBmdW5jdGlvbihlZGdlLCBsU2l0ZSwgclNpdGUpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMuSGFsZmVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZS5wcm90b3R5cGUuZ2V0U3RhcnRwb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVkZ2UubFNpdGUgPT09IHRoaXMuc2l0ZSA/IHRoaXMuZWRnZS52YSA6IHRoaXMuZWRnZS52YjtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5IYWxmZWRnZS5wcm90b3R5cGUuZ2V0RW5kcG9pbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lZGdlLmxTaXRlID09PSB0aGlzLnNpdGUgPyB0aGlzLmVkZ2UudmIgOiB0aGlzLmVkZ2UudmE7XG4gICAgfTtcblxuXG5cbi8vIHRoaXMgY3JlYXRlIGFuZCBhZGQgYSB2ZXJ0ZXggdG8gdGhlIGludGVybmFsIGNvbGxlY3Rpb25cblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlVmVydGV4ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0ZXhKdW5reWFyZC5wb3AoKTtcbiAgICBpZiAoICF2ICkge1xuICAgICAgICB2ID0gbmV3IHRoaXMuVmVydGV4KHgsIHkpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHYueCA9IHg7XG4gICAgICAgIHYueSA9IHk7XG4gICAgICAgIH1cbiAgICB0aGlzLnZlcnRpY2VzLnB1c2godik7XG4gICAgcmV0dXJuIHY7XG4gICAgfTtcblxuLy8gdGhpcyBjcmVhdGUgYW5kIGFkZCBhbiBlZGdlIHRvIGludGVybmFsIGNvbGxlY3Rpb24sIGFuZCBhbHNvIGNyZWF0ZVxuLy8gdHdvIGhhbGZlZGdlcyB3aGljaCBhcmUgYWRkZWQgdG8gZWFjaCBzaXRlJ3MgY291bnRlcmNsb2Nrd2lzZSBhcnJheVxuLy8gb2YgaGFsZmVkZ2VzLlxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVFZGdlID0gZnVuY3Rpb24obFNpdGUsIHJTaXRlLCB2YSwgdmIpIHtcbiAgICB2YXIgZWRnZSA9IHRoaXMuZWRnZUp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIWVkZ2UgKSB7XG4gICAgICAgIGVkZ2UgPSBuZXcgdGhpcy5FZGdlKGxTaXRlLCByU2l0ZSk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZWRnZS5sU2l0ZSA9IGxTaXRlO1xuICAgICAgICBlZGdlLnJTaXRlID0gclNpdGU7XG4gICAgICAgIGVkZ2UudmEgPSBlZGdlLnZiID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgdGhpcy5lZGdlcy5wdXNoKGVkZ2UpO1xuICAgIGlmICh2YSkge1xuICAgICAgICB0aGlzLnNldEVkZ2VTdGFydHBvaW50KGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmEpO1xuICAgICAgICB9XG4gICAgaWYgKHZiKSB7XG4gICAgICAgIHRoaXMuc2V0RWRnZUVuZHBvaW50KGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmIpO1xuICAgICAgICB9XG4gICAgdGhpcy5jZWxsc1tsU2l0ZS52b3Jvbm9pSWRdLmhhbGZlZGdlcy5wdXNoKHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgbFNpdGUsIHJTaXRlKSk7XG4gICAgdGhpcy5jZWxsc1tyU2l0ZS52b3Jvbm9pSWRdLmhhbGZlZGdlcy5wdXNoKHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgclNpdGUsIGxTaXRlKSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQm9yZGVyRWRnZSA9IGZ1bmN0aW9uKGxTaXRlLCB2YSwgdmIpIHtcbiAgICB2YXIgZWRnZSA9IHRoaXMuZWRnZUp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIWVkZ2UgKSB7XG4gICAgICAgIGVkZ2UgPSBuZXcgdGhpcy5FZGdlKGxTaXRlLCBudWxsKTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgZWRnZS52YSA9IHZhO1xuICAgIGVkZ2UudmIgPSB2YjtcbiAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XG4gICAgcmV0dXJuIGVkZ2U7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuc2V0RWRnZVN0YXJ0cG9pbnQgPSBmdW5jdGlvbihlZGdlLCBsU2l0ZSwgclNpdGUsIHZlcnRleCkge1xuICAgIGlmICghZWRnZS52YSAmJiAhZWRnZS52Yikge1xuICAgICAgICBlZGdlLnZhID0gdmVydGV4O1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSByU2l0ZTtcbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UubFNpdGUgPT09IHJTaXRlKSB7XG4gICAgICAgIGVkZ2UudmIgPSB2ZXJ0ZXg7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZWRnZS52YSA9IHZlcnRleDtcbiAgICAgICAgfVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLnNldEVkZ2VFbmRwb2ludCA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KSB7XG4gICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChlZGdlLCByU2l0ZSwgbFNpdGUsIHZlcnRleCk7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBCZWFjaGxpbmUgbWV0aG9kc1xuXG4vLyByaGlsbCAyMDExLTA2LTA3OiBGb3Igc29tZSByZWFzb25zLCBwZXJmb3JtYW5jZSBzdWZmZXJzIHNpZ25pZmljYW50bHlcbi8vIHdoZW4gaW5zdGFuY2lhdGluZyBhIGxpdGVyYWwgb2JqZWN0IGluc3RlYWQgb2YgYW4gZW1wdHkgY3RvclxuVm9yb25vaS5wcm90b3R5cGUuQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgfTtcblxuLy8gcmhpbGwgMjAxMS0wNi0wMjogQSBsb3Qgb2YgQmVhY2hzZWN0aW9uIGluc3RhbmNpYXRpb25zXG4vLyBvY2N1ciBkdXJpbmcgdGhlIGNvbXB1dGF0aW9uIG9mIHRoZSBWb3Jvbm9pIGRpYWdyYW0sXG4vLyBzb21ld2hlcmUgYmV0d2VlbiB0aGUgbnVtYmVyIG9mIHNpdGVzIGFuZCB0d2ljZSB0aGVcbi8vIG51bWJlciBvZiBzaXRlcywgd2hpbGUgdGhlIG51bWJlciBvZiBCZWFjaHNlY3Rpb25zIG9uIHRoZVxuLy8gYmVhY2hsaW5lIGF0IGFueSBnaXZlbiB0aW1lIGlzIGNvbXBhcmF0aXZlbHkgbG93LiBGb3IgdGhpc1xuLy8gcmVhc29uLCB3ZSByZXVzZSBhbHJlYWR5IGNyZWF0ZWQgQmVhY2hzZWN0aW9ucywgaW4gb3JkZXJcbi8vIHRvIGF2b2lkIG5ldyBtZW1vcnkgYWxsb2NhdGlvbi4gVGhpcyByZXN1bHRlZCBpbiBhIG1lYXN1cmFibGVcbi8vIHBlcmZvcm1hbmNlIGdhaW4uXG5cblZvcm9ub2kucHJvdG90eXBlLmNyZWF0ZUJlYWNoc2VjdGlvbiA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgYmVhY2hzZWN0aW9uID0gdGhpcy5iZWFjaHNlY3Rpb25KdW5reWFyZC5wb3AoKTtcbiAgICBpZiAoIWJlYWNoc2VjdGlvbikge1xuICAgICAgICBiZWFjaHNlY3Rpb24gPSBuZXcgdGhpcy5CZWFjaHNlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgIGJlYWNoc2VjdGlvbi5zaXRlID0gc2l0ZTtcbiAgICByZXR1cm4gYmVhY2hzZWN0aW9uO1xuICAgIH07XG5cbi8vIGNhbGN1bGF0ZSB0aGUgbGVmdCBicmVhayBwb2ludCBvZiBhIHBhcnRpY3VsYXIgYmVhY2ggc2VjdGlvbixcbi8vIGdpdmVuIGEgcGFydGljdWxhciBzd2VlcCBsaW5lXG5Wb3Jvbm9pLnByb3RvdHlwZS5sZWZ0QnJlYWtQb2ludCA9IGZ1bmN0aW9uKGFyYywgZGlyZWN0cml4KSB7XG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9QYXJhYm9sYVxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUXVhZHJhdGljX2VxdWF0aW9uXG4gICAgLy8gaDEgPSB4MSxcbiAgICAvLyBrMSA9ICh5MStkaXJlY3RyaXgpLzIsXG4gICAgLy8gaDIgPSB4MixcbiAgICAvLyBrMiA9ICh5MitkaXJlY3RyaXgpLzIsXG4gICAgLy8gcDEgPSBrMS1kaXJlY3RyaXgsXG4gICAgLy8gYTEgPSAxLyg0KnAxKSxcbiAgICAvLyBiMSA9IC1oMS8oMipwMSksXG4gICAgLy8gYzEgPSBoMSpoMS8oNCpwMSkrazEsXG4gICAgLy8gcDIgPSBrMi1kaXJlY3RyaXgsXG4gICAgLy8gYTIgPSAxLyg0KnAyKSxcbiAgICAvLyBiMiA9IC1oMi8oMipwMiksXG4gICAgLy8gYzIgPSBoMipoMi8oNCpwMikrazIsXG4gICAgLy8geCA9ICgtKGIyLWIxKSArIE1hdGguc3FydCgoYjItYjEpKihiMi1iMSkgLSA0KihhMi1hMSkqKGMyLWMxKSkpIC8gKDIqKGEyLWExKSlcbiAgICAvLyBXaGVuIHgxIGJlY29tZSB0aGUgeC1vcmlnaW46XG4gICAgLy8gaDEgPSAwLFxuICAgIC8vIGsxID0gKHkxK2RpcmVjdHJpeCkvMixcbiAgICAvLyBoMiA9IHgyLXgxLFxuICAgIC8vIGsyID0gKHkyK2RpcmVjdHJpeCkvMixcbiAgICAvLyBwMSA9IGsxLWRpcmVjdHJpeCxcbiAgICAvLyBhMSA9IDEvKDQqcDEpLFxuICAgIC8vIGIxID0gMCxcbiAgICAvLyBjMSA9IGsxLFxuICAgIC8vIHAyID0gazItZGlyZWN0cml4LFxuICAgIC8vIGEyID0gMS8oNCpwMiksXG4gICAgLy8gYjIgPSAtaDIvKDIqcDIpLFxuICAgIC8vIGMyID0gaDIqaDIvKDQqcDIpK2syLFxuICAgIC8vIHggPSAoLWIyICsgTWF0aC5zcXJ0KGIyKmIyIC0gNCooYTItYTEpKihjMi1rMSkpKSAvICgyKihhMi1hMSkpICsgeDFcblxuICAgIC8vIGNoYW5nZSBjb2RlIGJlbG93IGF0IHlvdXIgb3duIHJpc2s6IGNhcmUgaGFzIGJlZW4gdGFrZW4gdG9cbiAgICAvLyByZWR1Y2UgZXJyb3JzIGR1ZSB0byBjb21wdXRlcnMnIGZpbml0ZSBhcml0aG1ldGljIHByZWNpc2lvbi5cbiAgICAvLyBNYXliZSBjYW4gc3RpbGwgYmUgaW1wcm92ZWQsIHdpbGwgc2VlIGlmIGFueSBtb3JlIG9mIHRoaXNcbiAgICAvLyBraW5kIG9mIGVycm9ycyBwb3AgdXAgYWdhaW4uXG4gICAgdmFyIHNpdGUgPSBhcmMuc2l0ZSxcbiAgICAgICAgcmZvY3ggPSBzaXRlLngsXG4gICAgICAgIHJmb2N5ID0gc2l0ZS55LFxuICAgICAgICBwYnkyID0gcmZvY3ktZGlyZWN0cml4O1xuICAgIC8vIHBhcmFib2xhIGluIGRlZ2VuZXJhdGUgY2FzZSB3aGVyZSBmb2N1cyBpcyBvbiBkaXJlY3RyaXhcbiAgICBpZiAoIXBieTIpIHtcbiAgICAgICAgcmV0dXJuIHJmb2N4O1xuICAgICAgICB9XG4gICAgdmFyIGxBcmMgPSBhcmMucmJQcmV2aW91cztcbiAgICBpZiAoIWxBcmMpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgICAgfVxuICAgIHNpdGUgPSBsQXJjLnNpdGU7XG4gICAgdmFyIGxmb2N4ID0gc2l0ZS54LFxuICAgICAgICBsZm9jeSA9IHNpdGUueSxcbiAgICAgICAgcGxieTIgPSBsZm9jeS1kaXJlY3RyaXg7XG4gICAgLy8gcGFyYWJvbGEgaW4gZGVnZW5lcmF0ZSBjYXNlIHdoZXJlIGZvY3VzIGlzIG9uIGRpcmVjdHJpeFxuICAgIGlmICghcGxieTIpIHtcbiAgICAgICAgcmV0dXJuIGxmb2N4O1xuICAgICAgICB9XG4gICAgdmFyIGhsID0gbGZvY3gtcmZvY3gsXG4gICAgICAgIGFieTIgPSAxL3BieTItMS9wbGJ5MixcbiAgICAgICAgYiA9IGhsL3BsYnkyO1xuICAgIGlmIChhYnkyKSB7XG4gICAgICAgIHJldHVybiAoLWIrdGhpcy5zcXJ0KGIqYi0yKmFieTIqKGhsKmhsLygtMipwbGJ5MiktbGZvY3krcGxieTIvMityZm9jeS1wYnkyLzIpKSkvYWJ5MityZm9jeDtcbiAgICAgICAgfVxuICAgIC8vIGJvdGggcGFyYWJvbGFzIGhhdmUgc2FtZSBkaXN0YW5jZSB0byBkaXJlY3RyaXgsIHRodXMgYnJlYWsgcG9pbnQgaXMgbWlkd2F5XG4gICAgcmV0dXJuIChyZm9jeCtsZm9jeCkvMjtcbiAgICB9O1xuXG4vLyBjYWxjdWxhdGUgdGhlIHJpZ2h0IGJyZWFrIHBvaW50IG9mIGEgcGFydGljdWxhciBiZWFjaCBzZWN0aW9uLFxuLy8gZ2l2ZW4gYSBwYXJ0aWN1bGFyIGRpcmVjdHJpeFxuVm9yb25vaS5wcm90b3R5cGUucmlnaHRCcmVha1BvaW50ID0gZnVuY3Rpb24oYXJjLCBkaXJlY3RyaXgpIHtcbiAgICB2YXIgckFyYyA9IGFyYy5yYk5leHQ7XG4gICAgaWYgKHJBcmMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdEJyZWFrUG9pbnQockFyYywgZGlyZWN0cml4KTtcbiAgICAgICAgfVxuICAgIHZhciBzaXRlID0gYXJjLnNpdGU7XG4gICAgcmV0dXJuIHNpdGUueSA9PT0gZGlyZWN0cml4ID8gc2l0ZS54IDogSW5maW5pdHk7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuZGV0YWNoQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oYmVhY2hzZWN0aW9uKSB7XG4gICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChiZWFjaHNlY3Rpb24pOyAvLyBkZXRhY2ggcG90ZW50aWFsbHkgYXR0YWNoZWQgY2lyY2xlIGV2ZW50XG4gICAgdGhpcy5iZWFjaGxpbmUucmJSZW1vdmVOb2RlKGJlYWNoc2VjdGlvbik7IC8vIHJlbW92ZSBmcm9tIFJCLXRyZWVcbiAgICB0aGlzLmJlYWNoc2VjdGlvbkp1bmt5YXJkLnB1c2goYmVhY2hzZWN0aW9uKTsgLy8gbWFyayBmb3IgcmV1c2VcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5yZW1vdmVCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihiZWFjaHNlY3Rpb24pIHtcbiAgICB2YXIgY2lyY2xlID0gYmVhY2hzZWN0aW9uLmNpcmNsZUV2ZW50LFxuICAgICAgICB4ID0gY2lyY2xlLngsXG4gICAgICAgIHkgPSBjaXJjbGUueWNlbnRlcixcbiAgICAgICAgdmVydGV4ID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeCwgeSksXG4gICAgICAgIHByZXZpb3VzID0gYmVhY2hzZWN0aW9uLnJiUHJldmlvdXMsXG4gICAgICAgIG5leHQgPSBiZWFjaHNlY3Rpb24ucmJOZXh0LFxuICAgICAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucyA9IFtiZWFjaHNlY3Rpb25dLFxuICAgICAgICBhYnNfZm4gPSBNYXRoLmFicztcblxuICAgIC8vIHJlbW92ZSBjb2xsYXBzZWQgYmVhY2hzZWN0aW9uIGZyb20gYmVhY2hsaW5lXG4gICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24oYmVhY2hzZWN0aW9uKTtcblxuICAgIC8vIHRoZXJlIGNvdWxkIGJlIG1vcmUgdGhhbiBvbmUgZW1wdHkgYXJjIGF0IHRoZSBkZWxldGlvbiBwb2ludCwgdGhpc1xuICAgIC8vIGhhcHBlbnMgd2hlbiBtb3JlIHRoYW4gdHdvIGVkZ2VzIGFyZSBsaW5rZWQgYnkgdGhlIHNhbWUgdmVydGV4LFxuICAgIC8vIHNvIHdlIHdpbGwgY29sbGVjdCBhbGwgdGhvc2UgZWRnZXMgYnkgbG9va2luZyB1cCBib3RoIHNpZGVzIG9mXG4gICAgLy8gdGhlIGRlbGV0aW9uIHBvaW50LlxuICAgIC8vIGJ5IHRoZSB3YXksIHRoZXJlIGlzICphbHdheXMqIGEgcHJlZGVjZXNzb3Ivc3VjY2Vzc29yIHRvIGFueSBjb2xsYXBzZWRcbiAgICAvLyBiZWFjaCBzZWN0aW9uLCBpdCdzIGp1c3QgaW1wb3NzaWJsZSB0byBoYXZlIGEgY29sbGFwc2luZyBmaXJzdC9sYXN0XG4gICAgLy8gYmVhY2ggc2VjdGlvbnMgb24gdGhlIGJlYWNobGluZSwgc2luY2UgdGhleSBvYnZpb3VzbHkgYXJlIHVuY29uc3RyYWluZWRcbiAgICAvLyBvbiB0aGVpciBsZWZ0L3JpZ2h0IHNpZGUuXG5cbiAgICAvLyBsb29rIGxlZnRcbiAgICB2YXIgbEFyYyA9IHByZXZpb3VzO1xuICAgIHdoaWxlIChsQXJjLmNpcmNsZUV2ZW50ICYmIGFic19mbih4LWxBcmMuY2lyY2xlRXZlbnQueCk8MWUtOSAmJiBhYnNfZm4oeS1sQXJjLmNpcmNsZUV2ZW50LnljZW50ZXIpPDFlLTkpIHtcbiAgICAgICAgcHJldmlvdXMgPSBsQXJjLnJiUHJldmlvdXM7XG4gICAgICAgIGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLnVuc2hpZnQobEFyYyk7XG4gICAgICAgIHRoaXMuZGV0YWNoQmVhY2hzZWN0aW9uKGxBcmMpOyAvLyBtYXJrIGZvciByZXVzZVxuICAgICAgICBsQXJjID0gcHJldmlvdXM7XG4gICAgICAgIH1cbiAgICAvLyBldmVuIHRob3VnaCBpdCBpcyBub3QgZGlzYXBwZWFyaW5nLCBJIHdpbGwgYWxzbyBhZGQgdGhlIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBpbW1lZGlhdGVseSB0byB0aGUgbGVmdCBvZiB0aGUgbGVmdC1tb3N0IGNvbGxhcHNlZCBiZWFjaCBzZWN0aW9uLCBmb3JcbiAgICAvLyBjb252ZW5pZW5jZSwgc2luY2Ugd2UgbmVlZCB0byByZWZlciB0byBpdCBsYXRlciBhcyB0aGlzIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBpcyB0aGUgJ2xlZnQnIHNpdGUgb2YgYW4gZWRnZSBmb3Igd2hpY2ggYSBzdGFydCBwb2ludCBpcyBzZXQuXG4gICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMudW5zaGlmdChsQXJjKTtcbiAgICB0aGlzLmRldGFjaENpcmNsZUV2ZW50KGxBcmMpO1xuXG4gICAgLy8gbG9vayByaWdodFxuICAgIHZhciByQXJjID0gbmV4dDtcbiAgICB3aGlsZSAockFyYy5jaXJjbGVFdmVudCAmJiBhYnNfZm4oeC1yQXJjLmNpcmNsZUV2ZW50LngpPDFlLTkgJiYgYWJzX2ZuKHktckFyYy5jaXJjbGVFdmVudC55Y2VudGVyKTwxZS05KSB7XG4gICAgICAgIG5leHQgPSByQXJjLnJiTmV4dDtcbiAgICAgICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMucHVzaChyQXJjKTtcbiAgICAgICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24ockFyYyk7IC8vIG1hcmsgZm9yIHJldXNlXG4gICAgICAgIHJBcmMgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gd2UgYWxzbyBoYXZlIHRvIGFkZCB0aGUgYmVhY2ggc2VjdGlvbiBpbW1lZGlhdGVseSB0byB0aGUgcmlnaHQgb2YgdGhlXG4gICAgLy8gcmlnaHQtbW9zdCBjb2xsYXBzZWQgYmVhY2ggc2VjdGlvbiwgc2luY2UgdGhlcmUgaXMgYWxzbyBhIGRpc2FwcGVhcmluZ1xuICAgIC8vIHRyYW5zaXRpb24gcmVwcmVzZW50aW5nIGFuIGVkZ2UncyBzdGFydCBwb2ludCBvbiBpdHMgbGVmdC5cbiAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucy5wdXNoKHJBcmMpO1xuICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG5cbiAgICAvLyB3YWxrIHRocm91Z2ggYWxsIHRoZSBkaXNhcHBlYXJpbmcgdHJhbnNpdGlvbnMgYmV0d2VlbiBiZWFjaCBzZWN0aW9ucyBhbmRcbiAgICAvLyBzZXQgdGhlIHN0YXJ0IHBvaW50IG9mIHRoZWlyIChpbXBsaWVkKSBlZGdlLlxuICAgIHZhciBuQXJjcyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLmxlbmd0aCxcbiAgICAgICAgaUFyYztcbiAgICBmb3IgKGlBcmM9MTsgaUFyYzxuQXJjczsgaUFyYysrKSB7XG4gICAgICAgIHJBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1tpQXJjXTtcbiAgICAgICAgbEFyYyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zW2lBcmMtMV07XG4gICAgICAgIHRoaXMuc2V0RWRnZVN0YXJ0cG9pbnQockFyYy5lZGdlLCBsQXJjLnNpdGUsIHJBcmMuc2l0ZSwgdmVydGV4KTtcbiAgICAgICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgbmV3IGVkZ2UgYXMgd2UgaGF2ZSBub3cgYSBuZXcgdHJhbnNpdGlvbiBiZXR3ZWVuXG4gICAgLy8gdHdvIGJlYWNoIHNlY3Rpb25zIHdoaWNoIHdlcmUgcHJldmlvdXNseSBub3QgYWRqYWNlbnQuXG4gICAgLy8gc2luY2UgdGhpcyBlZGdlIGFwcGVhcnMgYXMgYSBuZXcgdmVydGV4IGlzIGRlZmluZWQsIHRoZSB2ZXJ0ZXhcbiAgICAvLyBhY3R1YWxseSBkZWZpbmUgYW4gZW5kIHBvaW50IG9mIHRoZSBlZGdlIChyZWxhdGl2ZSB0byB0aGUgc2l0ZVxuICAgIC8vIG9uIHRoZSBsZWZ0KVxuICAgIGxBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1swXTtcbiAgICByQXJjID0gZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnNbbkFyY3MtMV07XG4gICAgckFyYy5lZGdlID0gdGhpcy5jcmVhdGVFZGdlKGxBcmMuc2l0ZSwgckFyYy5zaXRlLCB1bmRlZmluZWQsIHZlcnRleCk7XG5cbiAgICAvLyBjcmVhdGUgY2lyY2xlIGV2ZW50cyBpZiBhbnkgZm9yIGJlYWNoIHNlY3Rpb25zIGxlZnQgaW4gdGhlIGJlYWNobGluZVxuICAgIC8vIGFkamFjZW50IHRvIGNvbGxhcHNlZCBzZWN0aW9uc1xuICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgdGhpcy5hdHRhY2hDaXJjbGVFdmVudChyQXJjKTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5hZGRCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgdmFyIHggPSBzaXRlLngsXG4gICAgICAgIGRpcmVjdHJpeCA9IHNpdGUueTtcblxuICAgIC8vIGZpbmQgdGhlIGxlZnQgYW5kIHJpZ2h0IGJlYWNoIHNlY3Rpb25zIHdoaWNoIHdpbGwgc3Vycm91bmQgdGhlIG5ld2x5XG4gICAgLy8gY3JlYXRlZCBiZWFjaCBzZWN0aW9uLlxuICAgIC8vIHJoaWxsIDIwMTEtMDYtMDE6IFRoaXMgbG9vcCBpcyBvbmUgb2YgdGhlIG1vc3Qgb2Z0ZW4gZXhlY3V0ZWQsXG4gICAgLy8gaGVuY2Ugd2UgZXhwYW5kIGluLXBsYWNlIHRoZSBjb21wYXJpc29uLWFnYWluc3QtZXBzaWxvbiBjYWxscy5cbiAgICB2YXIgbEFyYywgckFyYyxcbiAgICAgICAgZHhsLCBkeHIsXG4gICAgICAgIG5vZGUgPSB0aGlzLmJlYWNobGluZS5yb290O1xuXG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgZHhsID0gdGhpcy5sZWZ0QnJlYWtQb2ludChub2RlLGRpcmVjdHJpeCkteDtcbiAgICAgICAgLy8geCBsZXNzVGhhbldpdGhFcHNpbG9uIHhsID0+IGZhbGxzIHNvbWV3aGVyZSBiZWZvcmUgdGhlIGxlZnQgZWRnZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgIGlmIChkeGwgPiAxZS05KSB7XG4gICAgICAgICAgICAvLyB0aGlzIGNhc2Ugc2hvdWxkIG5ldmVyIGhhcHBlblxuICAgICAgICAgICAgLy8gaWYgKCFub2RlLnJiTGVmdCkge1xuICAgICAgICAgICAgLy8gICAgckFyYyA9IG5vZGUucmJMZWZ0O1xuICAgICAgICAgICAgLy8gICAgYnJlYWs7XG4gICAgICAgICAgICAvLyAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5yYkxlZnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZHhyID0geC10aGlzLnJpZ2h0QnJlYWtQb2ludChub2RlLGRpcmVjdHJpeCk7XG4gICAgICAgICAgICAvLyB4IGdyZWF0ZXJUaGFuV2l0aEVwc2lsb24geHIgPT4gZmFsbHMgc29tZXdoZXJlIGFmdGVyIHRoZSByaWdodCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgIGlmIChkeHIgPiAxZS05KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucmJSaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB4IGVxdWFsV2l0aEVwc2lsb24geGwgPT4gZmFsbHMgZXhhY3RseSBvbiB0aGUgbGVmdCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgICAgICBpZiAoZHhsID4gLTFlLTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgICAgICAgICAgICAgckFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB4IGVxdWFsV2l0aEVwc2lsb24geHIgPT4gZmFsbHMgZXhhY3RseSBvbiB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZHhyID4gLTFlLTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbEFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHJBcmMgPSBub2RlLnJiTmV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGZhbGxzIGV4YWN0bHkgc29tZXdoZXJlIGluIHRoZSBtaWRkbGUgb2YgdGhlIGJlYWNoc2VjdGlvblxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsQXJjID0gckFyYyA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAvLyBhdCB0aGlzIHBvaW50LCBrZWVwIGluIG1pbmQgdGhhdCBsQXJjIGFuZC9vciByQXJjIGNvdWxkIGJlXG4gICAgLy8gdW5kZWZpbmVkIG9yIG51bGwuXG5cbiAgICAvLyBjcmVhdGUgYSBuZXcgYmVhY2ggc2VjdGlvbiBvYmplY3QgZm9yIHRoZSBzaXRlIGFuZCBhZGQgaXQgdG8gUkItdHJlZVxuICAgIHZhciBuZXdBcmMgPSB0aGlzLmNyZWF0ZUJlYWNoc2VjdGlvbihzaXRlKTtcbiAgICB0aGlzLmJlYWNobGluZS5yYkluc2VydFN1Y2Nlc3NvcihsQXJjLCBuZXdBcmMpO1xuXG4gICAgLy8gY2FzZXM6XG4gICAgLy9cblxuICAgIC8vIFtudWxsLG51bGxdXG4gICAgLy8gbGVhc3QgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGlzIHRoZSBmaXJzdCBiZWFjaCBzZWN0aW9uIG9uIHRoZVxuICAgIC8vIGJlYWNobGluZS5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBubyBuZXcgdHJhbnNpdGlvbiBhcHBlYXJzXG4gICAgLy8gICBubyBjb2xsYXBzaW5nIGJlYWNoIHNlY3Rpb25cbiAgICAvLyAgIG5ldyBiZWFjaHNlY3Rpb24gYmVjb21lIHJvb3Qgb2YgdGhlIFJCLXRyZWVcbiAgICBpZiAoIWxBcmMgJiYgIXJBcmMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAvLyBbbEFyYyxyQXJjXSB3aGVyZSBsQXJjID09IHJBcmNcbiAgICAvLyBtb3N0IGxpa2VseSBjYXNlOiBuZXcgYmVhY2ggc2VjdGlvbiBzcGxpdCBhbiBleGlzdGluZyBiZWFjaFxuICAgIC8vIHNlY3Rpb24uXG4gICAgLy8gVGhpcyBjYXNlIG1lYW5zOlxuICAgIC8vICAgb25lIG5ldyB0cmFuc2l0aW9uIGFwcGVhcnNcbiAgICAvLyAgIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9uIG1pZ2h0IGJlIGNvbGxhcHNpbmcgYXMgYSByZXN1bHRcbiAgICAvLyAgIHR3byBuZXcgbm9kZXMgYWRkZWQgdG8gdGhlIFJCLXRyZWVcbiAgICBpZiAobEFyYyA9PT0gckFyYykge1xuICAgICAgICAvLyBpbnZhbGlkYXRlIGNpcmNsZSBldmVudCBvZiBzcGxpdCBiZWFjaCBzZWN0aW9uXG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG5cbiAgICAgICAgLy8gc3BsaXQgdGhlIGJlYWNoIHNlY3Rpb24gaW50byB0d28gc2VwYXJhdGUgYmVhY2ggc2VjdGlvbnNcbiAgICAgICAgckFyYyA9IHRoaXMuY3JlYXRlQmVhY2hzZWN0aW9uKGxBcmMuc2l0ZSk7XG4gICAgICAgIHRoaXMuYmVhY2hsaW5lLnJiSW5zZXJ0U3VjY2Vzc29yKG5ld0FyYywgckFyYyk7XG5cbiAgICAgICAgLy8gc2luY2Ugd2UgaGF2ZSBhIG5ldyB0cmFuc2l0aW9uIGJldHdlZW4gdHdvIGJlYWNoIHNlY3Rpb25zLFxuICAgICAgICAvLyBhIG5ldyBlZGdlIGlzIGJvcm5cbiAgICAgICAgbmV3QXJjLmVkZ2UgPSByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLCBuZXdBcmMuc2l0ZSk7XG5cbiAgICAgICAgLy8gY2hlY2sgd2hldGhlciB0aGUgbGVmdCBhbmQgcmlnaHQgYmVhY2ggc2VjdGlvbnMgYXJlIGNvbGxhcHNpbmdcbiAgICAgICAgLy8gYW5kIGlmIHNvIGNyZWF0ZSBjaXJjbGUgZXZlbnRzLCB0byBiZSBub3RpZmllZCB3aGVuIHRoZSBwb2ludCBvZlxuICAgICAgICAvLyBjb2xsYXBzZSBpcyByZWFjaGVkLlxuICAgICAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KGxBcmMpO1xuICAgICAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KHJBcmMpO1xuICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgIC8vIFtsQXJjLG51bGxdXG4gICAgLy8gZXZlbiBsZXNzIGxpa2VseSBjYXNlOiBuZXcgYmVhY2ggc2VjdGlvbiBpcyB0aGUgKmxhc3QqIGJlYWNoIHNlY3Rpb25cbiAgICAvLyBvbiB0aGUgYmVhY2hsaW5lIC0tIHRoaXMgY2FuIGhhcHBlbiAqb25seSogaWYgKmFsbCogdGhlIHByZXZpb3VzIGJlYWNoXG4gICAgLy8gc2VjdGlvbnMgY3VycmVudGx5IG9uIHRoZSBiZWFjaGxpbmUgc2hhcmUgdGhlIHNhbWUgeSB2YWx1ZSBhc1xuICAgIC8vIHRoZSBuZXcgYmVhY2ggc2VjdGlvbi5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBvbmUgbmV3IHRyYW5zaXRpb24gYXBwZWFyc1xuICAgIC8vICAgbm8gY29sbGFwc2luZyBiZWFjaCBzZWN0aW9uIGFzIGEgcmVzdWx0XG4gICAgLy8gICBuZXcgYmVhY2ggc2VjdGlvbiBiZWNvbWUgcmlnaHQtbW9zdCBub2RlIG9mIHRoZSBSQi10cmVlXG4gICAgaWYgKGxBcmMgJiYgIXJBcmMpIHtcbiAgICAgICAgbmV3QXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLG5ld0FyYy5zaXRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAvLyBbbnVsbCxyQXJjXVxuICAgIC8vIGltcG9zc2libGUgY2FzZTogYmVjYXVzZSBzaXRlcyBhcmUgc3RyaWN0bHkgcHJvY2Vzc2VkIGZyb20gdG9wIHRvIGJvdHRvbSxcbiAgICAvLyBhbmQgbGVmdCB0byByaWdodCwgd2hpY2ggZ3VhcmFudGVlcyB0aGF0IHRoZXJlIHdpbGwgYWx3YXlzIGJlIGEgYmVhY2ggc2VjdGlvblxuICAgIC8vIG9uIHRoZSBsZWZ0IC0tIGV4Y2VwdCBvZiBjb3Vyc2Ugd2hlbiB0aGVyZSBhcmUgbm8gYmVhY2ggc2VjdGlvbiBhdCBhbGwgb25cbiAgICAvLyB0aGUgYmVhY2ggbGluZSwgd2hpY2ggY2FzZSB3YXMgaGFuZGxlZCBhYm92ZS5cbiAgICAvLyByaGlsbCAyMDExLTA2LTAyOiBObyBwb2ludCB0ZXN0aW5nIGluIG5vbi1kZWJ1ZyB2ZXJzaW9uXG4gICAgLy9pZiAoIWxBcmMgJiYgckFyYykge1xuICAgIC8vICAgIHRocm93IFwiVm9yb25vaS5hZGRCZWFjaHNlY3Rpb24oKTogV2hhdCBpcyB0aGlzIEkgZG9uJ3QgZXZlblwiO1xuICAgIC8vICAgIH1cblxuICAgIC8vIFtsQXJjLHJBcmNdIHdoZXJlIGxBcmMgIT0gckFyY1xuICAgIC8vIHNvbWV3aGF0IGxlc3MgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGZhbGxzICpleGFjdGx5KiBpbiBiZXR3ZWVuIHR3b1xuICAgIC8vIGV4aXN0aW5nIGJlYWNoIHNlY3Rpb25zXG4gICAgLy8gVGhpcyBjYXNlIG1lYW5zOlxuICAgIC8vICAgb25lIHRyYW5zaXRpb24gZGlzYXBwZWFyc1xuICAgIC8vICAgdHdvIG5ldyB0cmFuc2l0aW9ucyBhcHBlYXJcbiAgICAvLyAgIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9uIG1pZ2h0IGJlIGNvbGxhcHNpbmcgYXMgYSByZXN1bHRcbiAgICAvLyAgIG9ubHkgb25lIG5ldyBub2RlIGFkZGVkIHRvIHRoZSBSQi10cmVlXG4gICAgaWYgKGxBcmMgIT09IHJBcmMpIHtcbiAgICAgICAgLy8gaW52YWxpZGF0ZSBjaXJjbGUgZXZlbnRzIG9mIGxlZnQgYW5kIHJpZ2h0IHNpdGVzXG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG5cbiAgICAgICAgLy8gYW4gZXhpc3RpbmcgdHJhbnNpdGlvbiBkaXNhcHBlYXJzLCBtZWFuaW5nIGEgdmVydGV4IGlzIGRlZmluZWQgYXRcbiAgICAgICAgLy8gdGhlIGRpc2FwcGVhcmFuY2UgcG9pbnQuXG4gICAgICAgIC8vIHNpbmNlIHRoZSBkaXNhcHBlYXJhbmNlIGlzIGNhdXNlZCBieSB0aGUgbmV3IGJlYWNoc2VjdGlvbiwgdGhlXG4gICAgICAgIC8vIHZlcnRleCBpcyBhdCB0aGUgY2VudGVyIG9mIHRoZSBjaXJjdW1zY3JpYmVkIGNpcmNsZSBvZiB0aGUgbGVmdCxcbiAgICAgICAgLy8gbmV3IGFuZCByaWdodCBiZWFjaHNlY3Rpb25zLlxuICAgICAgICAvLyBodHRwOi8vbWF0aGZvcnVtLm9yZy9saWJyYXJ5L2RybWF0aC92aWV3LzU1MDAyLmh0bWxcbiAgICAgICAgLy8gRXhjZXB0IHRoYXQgSSBicmluZyB0aGUgb3JpZ2luIGF0IEEgdG8gc2ltcGxpZnlcbiAgICAgICAgLy8gY2FsY3VsYXRpb25cbiAgICAgICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLFxuICAgICAgICAgICAgYXggPSBsU2l0ZS54LFxuICAgICAgICAgICAgYXkgPSBsU2l0ZS55LFxuICAgICAgICAgICAgYng9c2l0ZS54LWF4LFxuICAgICAgICAgICAgYnk9c2l0ZS55LWF5LFxuICAgICAgICAgICAgclNpdGUgPSByQXJjLnNpdGUsXG4gICAgICAgICAgICBjeD1yU2l0ZS54LWF4LFxuICAgICAgICAgICAgY3k9clNpdGUueS1heSxcbiAgICAgICAgICAgIGQ9MiooYngqY3ktYnkqY3gpLFxuICAgICAgICAgICAgaGI9YngqYngrYnkqYnksXG4gICAgICAgICAgICBoYz1jeCpjeCtjeSpjeSxcbiAgICAgICAgICAgIHZlcnRleCA9IHRoaXMuY3JlYXRlVmVydGV4KChjeSpoYi1ieSpoYykvZCtheCwgKGJ4KmhjLWN4KmhiKS9kK2F5KTtcblxuICAgICAgICAvLyBvbmUgdHJhbnNpdGlvbiBkaXNhcHBlYXJcbiAgICAgICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChyQXJjLmVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KTtcblxuICAgICAgICAvLyB0d28gbmV3IHRyYW5zaXRpb25zIGFwcGVhciBhdCB0aGUgbmV3IHZlcnRleCBsb2NhdGlvblxuICAgICAgICBuZXdBcmMuZWRnZSA9IHRoaXMuY3JlYXRlRWRnZShsU2l0ZSwgc2l0ZSwgdW5kZWZpbmVkLCB2ZXJ0ZXgpO1xuICAgICAgICByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2Uoc2l0ZSwgclNpdGUsIHVuZGVmaW5lZCwgdmVydGV4KTtcblxuICAgICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9ucyBhcmUgY29sbGFwc2luZ1xuICAgICAgICAvLyBhbmQgaWYgc28gY3JlYXRlIGNpcmNsZSBldmVudHMsIHRvIGhhbmRsZSB0aGUgcG9pbnQgb2YgY29sbGFwc2UuXG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ2lyY2xlIGV2ZW50IG1ldGhvZHNcblxuLy8gcmhpbGwgMjAxMS0wNi0wNzogRm9yIHNvbWUgcmVhc29ucywgcGVyZm9ybWFuY2Ugc3VmZmVycyBzaWduaWZpY2FudGx5XG4vLyB3aGVuIGluc3RhbmNpYXRpbmcgYSBsaXRlcmFsIG9iamVjdCBpbnN0ZWFkIG9mIGFuIGVtcHR5IGN0b3JcblZvcm9ub2kucHJvdG90eXBlLkNpcmNsZUV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcmhpbGwgMjAxMy0xMC0xMjogaXQgaGVscHMgdG8gc3RhdGUgZXhhY3RseSB3aGF0IHdlIGFyZSBhdCBjdG9yIHRpbWUuXG4gICAgdGhpcy5hcmMgPSBudWxsO1xuICAgIHRoaXMucmJMZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJiTmV4dCA9IG51bGw7XG4gICAgdGhpcy5yYlBhcmVudCA9IG51bGw7XG4gICAgdGhpcy5yYlByZXZpb3VzID0gbnVsbDtcbiAgICB0aGlzLnJiUmVkID0gZmFsc2U7XG4gICAgdGhpcy5yYlJpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnNpdGUgPSBudWxsO1xuICAgIHRoaXMueCA9IHRoaXMueSA9IHRoaXMueWNlbnRlciA9IDA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuYXR0YWNoQ2lyY2xlRXZlbnQgPSBmdW5jdGlvbihhcmMpIHtcbiAgICB2YXIgbEFyYyA9IGFyYy5yYlByZXZpb3VzLFxuICAgICAgICByQXJjID0gYXJjLnJiTmV4dDtcbiAgICBpZiAoIWxBcmMgfHwgIXJBcmMpIHtyZXR1cm47fSAvLyBkb2VzIHRoYXQgZXZlciBoYXBwZW4/XG4gICAgdmFyIGxTaXRlID0gbEFyYy5zaXRlLFxuICAgICAgICBjU2l0ZSA9IGFyYy5zaXRlLFxuICAgICAgICByU2l0ZSA9IHJBcmMuc2l0ZTtcblxuICAgIC8vIElmIHNpdGUgb2YgbGVmdCBiZWFjaHNlY3Rpb24gaXMgc2FtZSBhcyBzaXRlIG9mXG4gICAgLy8gcmlnaHQgYmVhY2hzZWN0aW9uLCB0aGVyZSBjYW4ndCBiZSBjb252ZXJnZW5jZVxuICAgIGlmIChsU2l0ZT09PXJTaXRlKSB7cmV0dXJuO31cblxuICAgIC8vIEZpbmQgdGhlIGNpcmN1bXNjcmliZWQgY2lyY2xlIGZvciB0aGUgdGhyZWUgc2l0ZXMgYXNzb2NpYXRlZFxuICAgIC8vIHdpdGggdGhlIGJlYWNoc2VjdGlvbiB0cmlwbGV0LlxuICAgIC8vIHJoaWxsIDIwMTEtMDUtMjY6IEl0IGlzIG1vcmUgZWZmaWNpZW50IHRvIGNhbGN1bGF0ZSBpbi1wbGFjZVxuICAgIC8vIHJhdGhlciB0aGFuIGdldHRpbmcgdGhlIHJlc3VsdGluZyBjaXJjdW1zY3JpYmVkIGNpcmNsZSBmcm9tIGFuXG4gICAgLy8gb2JqZWN0IHJldHVybmVkIGJ5IGNhbGxpbmcgVm9yb25vaS5jaXJjdW1jaXJjbGUoKVxuICAgIC8vIGh0dHA6Ly9tYXRoZm9ydW0ub3JnL2xpYnJhcnkvZHJtYXRoL3ZpZXcvNTUwMDIuaHRtbFxuICAgIC8vIEV4Y2VwdCB0aGF0IEkgYnJpbmcgdGhlIG9yaWdpbiBhdCBjU2l0ZSB0byBzaW1wbGlmeSBjYWxjdWxhdGlvbnMuXG4gICAgLy8gVGhlIGJvdHRvbS1tb3N0IHBhcnQgb2YgdGhlIGNpcmN1bWNpcmNsZSBpcyBvdXIgRm9ydHVuZSAnY2lyY2xlXG4gICAgLy8gZXZlbnQnLCBhbmQgaXRzIGNlbnRlciBpcyBhIHZlcnRleCBwb3RlbnRpYWxseSBwYXJ0IG9mIHRoZSBmaW5hbFxuICAgIC8vIFZvcm9ub2kgZGlhZ3JhbS5cbiAgICB2YXIgYnggPSBjU2l0ZS54LFxuICAgICAgICBieSA9IGNTaXRlLnksXG4gICAgICAgIGF4ID0gbFNpdGUueC1ieCxcbiAgICAgICAgYXkgPSBsU2l0ZS55LWJ5LFxuICAgICAgICBjeCA9IHJTaXRlLngtYngsXG4gICAgICAgIGN5ID0gclNpdGUueS1ieTtcblxuICAgIC8vIElmIHBvaW50cyBsLT5jLT5yIGFyZSBjbG9ja3dpc2UsIHRoZW4gY2VudGVyIGJlYWNoIHNlY3Rpb24gZG9lcyBub3RcbiAgICAvLyBjb2xsYXBzZSwgaGVuY2UgaXQgY2FuJ3QgZW5kIHVwIGFzIGEgdmVydGV4ICh3ZSByZXVzZSAnZCcgaGVyZSwgd2hpY2hcbiAgICAvLyBzaWduIGlzIHJldmVyc2Ugb2YgdGhlIG9yaWVudGF0aW9uLCBoZW5jZSB3ZSByZXZlcnNlIHRoZSB0ZXN0LlxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ3VydmVfb3JpZW50YXRpb24jT3JpZW50YXRpb25fb2ZfYV9zaW1wbGVfcG9seWdvblxuICAgIC8vIHJoaWxsIDIwMTEtMDUtMjE6IE5hc3R5IGZpbml0ZSBwcmVjaXNpb24gZXJyb3Igd2hpY2ggY2F1c2VkIGNpcmN1bWNpcmNsZSgpIHRvXG4gICAgLy8gcmV0dXJuIGluZmluaXRlczogMWUtMTIgc2VlbXMgdG8gZml4IHRoZSBwcm9ibGVtLlxuICAgIHZhciBkID0gMiooYXgqY3ktYXkqY3gpO1xuICAgIGlmIChkID49IC0yZS0xMil7cmV0dXJuO31cblxuICAgIHZhciBoYSA9IGF4KmF4K2F5KmF5LFxuICAgICAgICBoYyA9IGN4KmN4K2N5KmN5LFxuICAgICAgICB4ID0gKGN5KmhhLWF5KmhjKS9kLFxuICAgICAgICB5ID0gKGF4KmhjLWN4KmhhKS9kLFxuICAgICAgICB5Y2VudGVyID0geStieTtcblxuICAgIC8vIEltcG9ydGFudDogeWJvdHRvbSBzaG91bGQgYWx3YXlzIGJlIHVuZGVyIG9yIGF0IHN3ZWVwLCBzbyBubyBuZWVkXG4gICAgLy8gdG8gd2FzdGUgQ1BVIGN5Y2xlcyBieSBjaGVja2luZ1xuXG4gICAgLy8gcmVjeWNsZSBjaXJjbGUgZXZlbnQgb2JqZWN0IGlmIHBvc3NpYmxlXG4gICAgdmFyIGNpcmNsZUV2ZW50ID0gdGhpcy5jaXJjbGVFdmVudEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICghY2lyY2xlRXZlbnQpIHtcbiAgICAgICAgY2lyY2xlRXZlbnQgPSBuZXcgdGhpcy5DaXJjbGVFdmVudCgpO1xuICAgICAgICB9XG4gICAgY2lyY2xlRXZlbnQuYXJjID0gYXJjO1xuICAgIGNpcmNsZUV2ZW50LnNpdGUgPSBjU2l0ZTtcbiAgICBjaXJjbGVFdmVudC54ID0geCtieDtcbiAgICBjaXJjbGVFdmVudC55ID0geWNlbnRlcit0aGlzLnNxcnQoeCp4K3kqeSk7IC8vIHkgYm90dG9tXG4gICAgY2lyY2xlRXZlbnQueWNlbnRlciA9IHljZW50ZXI7XG4gICAgYXJjLmNpcmNsZUV2ZW50ID0gY2lyY2xlRXZlbnQ7XG5cbiAgICAvLyBmaW5kIGluc2VydGlvbiBwb2ludCBpbiBSQi10cmVlOiBjaXJjbGUgZXZlbnRzIGFyZSBvcmRlcmVkIGZyb21cbiAgICAvLyBzbWFsbGVzdCB0byBsYXJnZXN0XG4gICAgdmFyIHByZWRlY2Vzc29yID0gbnVsbCxcbiAgICAgICAgbm9kZSA9IHRoaXMuY2lyY2xlRXZlbnRzLnJvb3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKGNpcmNsZUV2ZW50LnkgPCBub2RlLnkgfHwgKGNpcmNsZUV2ZW50LnkgPT09IG5vZGUueSAmJiBjaXJjbGVFdmVudC54IDw9IG5vZGUueCkpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnJiTGVmdCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVkZWNlc3NvciA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5vZGUucmJSaWdodCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiUmlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJlZGVjZXNzb3IgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIHRoaXMuY2lyY2xlRXZlbnRzLnJiSW5zZXJ0U3VjY2Vzc29yKHByZWRlY2Vzc29yLCBjaXJjbGVFdmVudCk7XG4gICAgaWYgKCFwcmVkZWNlc3Nvcikge1xuICAgICAgICB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQgPSBjaXJjbGVFdmVudDtcbiAgICAgICAgfVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLmRldGFjaENpcmNsZUV2ZW50ID0gZnVuY3Rpb24oYXJjKSB7XG4gICAgdmFyIGNpcmNsZUV2ZW50ID0gYXJjLmNpcmNsZUV2ZW50O1xuICAgIGlmIChjaXJjbGVFdmVudCkge1xuICAgICAgICBpZiAoIWNpcmNsZUV2ZW50LnJiUHJldmlvdXMpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RDaXJjbGVFdmVudCA9IGNpcmNsZUV2ZW50LnJiTmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgdGhpcy5jaXJjbGVFdmVudHMucmJSZW1vdmVOb2RlKGNpcmNsZUV2ZW50KTsgLy8gcmVtb3ZlIGZyb20gUkItdHJlZVxuICAgICAgICB0aGlzLmNpcmNsZUV2ZW50SnVua3lhcmQucHVzaChjaXJjbGVFdmVudCk7XG4gICAgICAgIGFyYy5jaXJjbGVFdmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERpYWdyYW0gY29tcGxldGlvbiBtZXRob2RzXG5cbi8vIGNvbm5lY3QgZGFuZ2xpbmcgZWRnZXMgKG5vdCBpZiBhIGN1cnNvcnkgdGVzdCB0ZWxscyB1c1xuLy8gaXQgaXMgbm90IGdvaW5nIHRvIGJlIHZpc2libGUuXG4vLyByZXR1cm4gdmFsdWU6XG4vLyAgIGZhbHNlOiB0aGUgZGFuZ2xpbmcgZW5kcG9pbnQgY291bGRuJ3QgYmUgY29ubmVjdGVkXG4vLyAgIHRydWU6IHRoZSBkYW5nbGluZyBlbmRwb2ludCBjb3VsZCBiZSBjb25uZWN0ZWRcblZvcm9ub2kucHJvdG90eXBlLmNvbm5lY3RFZGdlID0gZnVuY3Rpb24oZWRnZSwgYmJveCkge1xuICAgIC8vIHNraXAgaWYgZW5kIHBvaW50IGFscmVhZHkgY29ubmVjdGVkXG4gICAgdmFyIHZiID0gZWRnZS52YjtcbiAgICBpZiAoISF2Yikge3JldHVybiB0cnVlO31cblxuICAgIC8vIG1ha2UgbG9jYWwgY29weSBmb3IgcGVyZm9ybWFuY2UgcHVycG9zZVxuICAgIHZhciB2YSA9IGVkZ2UudmEsXG4gICAgICAgIHhsID0gYmJveC54bCxcbiAgICAgICAgeHIgPSBiYm94LnhyLFxuICAgICAgICB5dCA9IGJib3gueXQsXG4gICAgICAgIHliID0gYmJveC55YixcbiAgICAgICAgbFNpdGUgPSBlZGdlLmxTaXRlLFxuICAgICAgICByU2l0ZSA9IGVkZ2UuclNpdGUsXG4gICAgICAgIGx4ID0gbFNpdGUueCxcbiAgICAgICAgbHkgPSBsU2l0ZS55LFxuICAgICAgICByeCA9IHJTaXRlLngsXG4gICAgICAgIHJ5ID0gclNpdGUueSxcbiAgICAgICAgZnggPSAobHgrcngpLzIsXG4gICAgICAgIGZ5ID0gKGx5K3J5KS8yLFxuICAgICAgICBmbSwgZmI7XG5cbiAgICAvLyBpZiB3ZSByZWFjaCBoZXJlLCB0aGlzIG1lYW5zIGNlbGxzIHdoaWNoIHVzZSB0aGlzIGVkZ2Ugd2lsbCBuZWVkXG4gICAgLy8gdG8gYmUgY2xvc2VkLCB3aGV0aGVyIGJlY2F1c2UgdGhlIGVkZ2Ugd2FzIHJlbW92ZWQsIG9yIGJlY2F1c2UgaXRcbiAgICAvLyB3YXMgY29ubmVjdGVkIHRvIHRoZSBib3VuZGluZyBib3guXG4gICAgdGhpcy5jZWxsc1tsU2l0ZS52b3Jvbm9pSWRdLmNsb3NlTWUgPSB0cnVlO1xuICAgIHRoaXMuY2VsbHNbclNpdGUudm9yb25vaUlkXS5jbG9zZU1lID0gdHJ1ZTtcblxuICAgIC8vIGdldCB0aGUgbGluZSBlcXVhdGlvbiBvZiB0aGUgYmlzZWN0b3IgaWYgbGluZSBpcyBub3QgdmVydGljYWxcbiAgICBpZiAocnkgIT09IGx5KSB7XG4gICAgICAgIGZtID0gKGx4LXJ4KS8ocnktbHkpO1xuICAgICAgICBmYiA9IGZ5LWZtKmZ4O1xuICAgICAgICB9XG5cbiAgICAvLyByZW1lbWJlciwgZGlyZWN0aW9uIG9mIGxpbmUgKHJlbGF0aXZlIHRvIGxlZnQgc2l0ZSk6XG4gICAgLy8gdXB3YXJkOiBsZWZ0LnggPCByaWdodC54XG4gICAgLy8gZG93bndhcmQ6IGxlZnQueCA+IHJpZ2h0LnhcbiAgICAvLyBob3Jpem9udGFsOiBsZWZ0LnggPT0gcmlnaHQueFxuICAgIC8vIHVwd2FyZDogbGVmdC54IDwgcmlnaHQueFxuICAgIC8vIHJpZ2h0d2FyZDogbGVmdC55IDwgcmlnaHQueVxuICAgIC8vIGxlZnR3YXJkOiBsZWZ0LnkgPiByaWdodC55XG4gICAgLy8gdmVydGljYWw6IGxlZnQueSA9PSByaWdodC55XG5cbiAgICAvLyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvbiwgZmluZCB0aGUgYmVzdCBzaWRlIG9mIHRoZVxuICAgIC8vIGJvdW5kaW5nIGJveCB0byB1c2UgdG8gZGV0ZXJtaW5lIGEgcmVhc29uYWJsZSBzdGFydCBwb2ludFxuXG4gICAgLy8gcmhpbGwgMjAxMy0xMi0wMjpcbiAgICAvLyBXaGlsZSBhdCBpdCwgc2luY2Ugd2UgaGF2ZSB0aGUgdmFsdWVzIHdoaWNoIGRlZmluZSB0aGUgbGluZSxcbiAgICAvLyBjbGlwIHRoZSBlbmQgb2YgdmEgaWYgaXQgaXMgb3V0c2lkZSB0aGUgYmJveC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE1XG4gICAgLy8gVE9ETzogRG8gYWxsIHRoZSBjbGlwcGluZyBoZXJlIHJhdGhlciB0aGFuIHJlbHkgb24gTGlhbmctQmFyc2t5XG4gICAgLy8gd2hpY2ggZG9lcyBub3QgZG8gd2VsbCBzb21ldGltZXMgZHVlIHRvIGxvc3Mgb2YgYXJpdGhtZXRpY1xuICAgIC8vIHByZWNpc2lvbi4gVGhlIGNvZGUgaGVyZSBkb2Vzbid0IGRlZ3JhZGUgaWYgb25lIG9mIHRoZSB2ZXJ0ZXggaXNcbiAgICAvLyBhdCBhIGh1Z2UgZGlzdGFuY2UuXG5cbiAgICAvLyBzcGVjaWFsIGNhc2U6IHZlcnRpY2FsIGxpbmVcbiAgICBpZiAoZm0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBkb2Vzbid0IGludGVyc2VjdCB3aXRoIHZpZXdwb3J0XG4gICAgICAgIGlmIChmeCA8IHhsIHx8IGZ4ID49IHhyKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgLy8gZG93bndhcmRcbiAgICAgICAgaWYgKGx4ID4gcngpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPj0geWIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeWIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAvLyB1cHdhcmRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXZhIHx8IHZhLnkgPiB5Yikge1xuICAgICAgICAgICAgICAgIHZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoZngsIHliKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YS55IDwgeXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgLy8gY2xvc2VyIHRvIHZlcnRpY2FsIHRoYW4gaG9yaXpvbnRhbCwgY29ubmVjdCBzdGFydCBwb2ludCB0byB0aGVcbiAgICAvLyB0b3Agb3IgYm90dG9tIHNpZGUgb2YgdGhlIGJvdW5kaW5nIGJveFxuICAgIGVsc2UgaWYgKGZtIDwgLTEgfHwgZm0gPiAxKSB7XG4gICAgICAgIC8vIGRvd253YXJkXG4gICAgICAgIGlmIChseCA+IHJ4KSB7XG4gICAgICAgICAgICBpZiAoIXZhIHx8IHZhLnkgPCB5dCkge1xuICAgICAgICAgICAgICAgIHZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKHl0LWZiKS9mbSwgeXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPj0geWIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeWItZmIpL2ZtLCB5Yik7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIHVwd2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA+IHliKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeWItZmIpL2ZtLCB5Yik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKHl0LWZiKS9mbSwgeXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgLy8gY2xvc2VyIHRvIGhvcml6b250YWwgdGhhbiB2ZXJ0aWNhbCwgY29ubmVjdCBzdGFydCBwb2ludCB0byB0aGVcbiAgICAvLyBsZWZ0IG9yIHJpZ2h0IHNpZGUgb2YgdGhlIGJvdW5kaW5nIGJveFxuICAgIGVsc2Uge1xuICAgICAgICAvLyByaWdodHdhcmRcbiAgICAgICAgaWYgKGx5IDwgcnkpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueCA8IHhsKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgZm0qeGwrZmIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnggPj0geHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgZm0qeHIrZmIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAvLyBsZWZ0d2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueCA+IHhyKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgZm0qeHIrZmIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnggPCB4bCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KHhsLCBmbSp4bCtmYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlZGdlLnZhID0gdmE7XG4gICAgZWRnZS52YiA9IHZiO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuLy8gbGluZS1jbGlwcGluZyBjb2RlIHRha2VuIGZyb206XG4vLyAgIExpYW5nLUJhcnNreSBmdW5jdGlvbiBieSBEYW5pZWwgV2hpdGVcbi8vICAgaHR0cDovL3d3dy5za3l0b3BpYS5jb20vcHJvamVjdC9hcnRpY2xlcy9jb21wc2NpL2NsaXBwaW5nLmh0bWxcbi8vIFRoYW5rcyFcbi8vIEEgYml0IG1vZGlmaWVkIHRvIG1pbmltaXplIGNvZGUgcGF0aHNcblZvcm9ub2kucHJvdG90eXBlLmNsaXBFZGdlID0gZnVuY3Rpb24oZWRnZSwgYmJveCkge1xuICAgIHZhciBheCA9IGVkZ2UudmEueCxcbiAgICAgICAgYXkgPSBlZGdlLnZhLnksXG4gICAgICAgIGJ4ID0gZWRnZS52Yi54LFxuICAgICAgICBieSA9IGVkZ2UudmIueSxcbiAgICAgICAgdDAgPSAwLFxuICAgICAgICB0MSA9IDEsXG4gICAgICAgIGR4ID0gYngtYXgsXG4gICAgICAgIGR5ID0gYnktYXk7XG4gICAgLy8gbGVmdFxuICAgIHZhciBxID0gYXgtYmJveC54bDtcbiAgICBpZiAoZHg9PT0wICYmIHE8MCkge3JldHVybiBmYWxzZTt9XG4gICAgdmFyIHIgPSAtcS9keDtcbiAgICBpZiAoZHg8MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeD4wKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIC8vIHJpZ2h0XG4gICAgcSA9IGJib3gueHItYXg7XG4gICAgaWYgKGR4PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSBxL2R4O1xuICAgIGlmIChkeDwwKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR4PjApIHtcbiAgICAgICAgaWYgKHI8dDApIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocjx0MSkge3QxPXI7fVxuICAgICAgICB9XG4gICAgLy8gdG9wXG4gICAgcSA9IGF5LWJib3gueXQ7XG4gICAgaWYgKGR5PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSAtcS9keTtcbiAgICBpZiAoZHk8MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICBlbHNlIGlmIChkeT4wKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIC8vIGJvdHRvbSAgICAgICAgXG4gICAgcSA9IGJib3gueWItYXk7XG4gICAgaWYgKGR5PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSBxL2R5O1xuICAgIGlmIChkeTwwKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR5PjApIHtcbiAgICAgICAgaWYgKHI8dDApIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocjx0MSkge3QxPXI7fVxuICAgICAgICB9XG5cbiAgICAvLyBpZiB3ZSByZWFjaCB0aGlzIHBvaW50LCBWb3Jvbm9pIGVkZ2UgaXMgd2l0aGluIGJib3hcblxuICAgIC8vIGlmIHQwID4gMCwgdmEgbmVlZHMgdG8gY2hhbmdlXG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wMzogd2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgdmVydGV4IHJhdGhlclxuICAgIC8vIHRoYW4gbW9kaWZ5aW5nIHRoZSBleGlzdGluZyBvbmUsIHNpbmNlIHRoZSBleGlzdGluZ1xuICAgIC8vIG9uZSBpcyBsaWtlbHkgc2hhcmVkIHdpdGggYXQgbGVhc3QgYW5vdGhlciBlZGdlXG4gICAgaWYgKHQwID4gMCkge1xuICAgICAgICBlZGdlLnZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoYXgrdDAqZHgsIGF5K3QwKmR5KTtcbiAgICAgICAgfVxuXG4gICAgLy8gaWYgdDEgPCAxLCB2YiBuZWVkcyB0byBjaGFuZ2VcbiAgICAvLyByaGlsbCAyMDExLTA2LTAzOiB3ZSBuZWVkIHRvIGNyZWF0ZSBhIG5ldyB2ZXJ0ZXggcmF0aGVyXG4gICAgLy8gdGhhbiBtb2RpZnlpbmcgdGhlIGV4aXN0aW5nIG9uZSwgc2luY2UgdGhlIGV4aXN0aW5nXG4gICAgLy8gb25lIGlzIGxpa2VseSBzaGFyZWQgd2l0aCBhdCBsZWFzdCBhbm90aGVyIGVkZ2VcbiAgICBpZiAodDEgPCAxKSB7XG4gICAgICAgIGVkZ2UudmIgPSB0aGlzLmNyZWF0ZVZlcnRleChheCt0MSpkeCwgYXkrdDEqZHkpO1xuICAgICAgICB9XG5cbiAgICAvLyB2YSBhbmQvb3IgdmIgd2VyZSBjbGlwcGVkLCB0aHVzIHdlIHdpbGwgbmVlZCB0byBjbG9zZVxuICAgIC8vIGNlbGxzIHdoaWNoIHVzZSB0aGlzIGVkZ2UuXG4gICAgaWYgKCB0MCA+IDAgfHwgdDEgPCAxICkge1xuICAgICAgICB0aGlzLmNlbGxzW2VkZ2UubFNpdGUudm9yb25vaUlkXS5jbG9zZU1lID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jZWxsc1tlZGdlLnJTaXRlLnZvcm9ub2lJZF0uY2xvc2VNZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuLy8gQ29ubmVjdC9jdXQgZWRnZXMgYXQgYm91bmRpbmcgYm94XG5Wb3Jvbm9pLnByb3RvdHlwZS5jbGlwRWRnZXMgPSBmdW5jdGlvbihiYm94KSB7XG4gICAgLy8gY29ubmVjdCBhbGwgZGFuZ2xpbmcgZWRnZXMgdG8gYm91bmRpbmcgYm94XG4gICAgLy8gb3IgZ2V0IHJpZCBvZiB0aGVtIGlmIGl0IGNhbid0IGJlIGRvbmVcbiAgICB2YXIgZWRnZXMgPSB0aGlzLmVkZ2VzLFxuICAgICAgICBpRWRnZSA9IGVkZ2VzLmxlbmd0aCxcbiAgICAgICAgZWRnZSxcbiAgICAgICAgYWJzX2ZuID0gTWF0aC5hYnM7XG5cbiAgICAvLyBpdGVyYXRlIGJhY2t3YXJkIHNvIHdlIGNhbiBzcGxpY2Ugc2FmZWx5XG4gICAgd2hpbGUgKGlFZGdlLS0pIHtcbiAgICAgICAgZWRnZSA9IGVkZ2VzW2lFZGdlXTtcbiAgICAgICAgLy8gZWRnZSBpcyByZW1vdmVkIGlmOlxuICAgICAgICAvLyAgIGl0IGlzIHdob2xseSBvdXRzaWRlIHRoZSBib3VuZGluZyBib3hcbiAgICAgICAgLy8gICBpdCBpcyBsb29raW5nIG1vcmUgbGlrZSBhIHBvaW50IHRoYW4gYSBsaW5lXG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0RWRnZShlZGdlLCBiYm94KSB8fFxuICAgICAgICAgICAgIXRoaXMuY2xpcEVkZ2UoZWRnZSwgYmJveCkgfHxcbiAgICAgICAgICAgIChhYnNfZm4oZWRnZS52YS54LWVkZ2UudmIueCk8MWUtOSAmJiBhYnNfZm4oZWRnZS52YS55LWVkZ2UudmIueSk8MWUtOSkpIHtcbiAgICAgICAgICAgIGVkZ2UudmEgPSBlZGdlLnZiID0gbnVsbDtcbiAgICAgICAgICAgIGVkZ2VzLnNwbGljZShpRWRnZSwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbi8vIENsb3NlIHRoZSBjZWxscy5cbi8vIFRoZSBjZWxscyBhcmUgYm91bmQgYnkgdGhlIHN1cHBsaWVkIGJvdW5kaW5nIGJveC5cbi8vIEVhY2ggY2VsbCByZWZlcnMgdG8gaXRzIGFzc29jaWF0ZWQgc2l0ZSwgYW5kIGEgbGlzdFxuLy8gb2YgaGFsZmVkZ2VzIG9yZGVyZWQgY291bnRlcmNsb2Nrd2lzZS5cblZvcm9ub2kucHJvdG90eXBlLmNsb3NlQ2VsbHMgPSBmdW5jdGlvbihiYm94KSB7XG4gICAgdmFyIHhsID0gYmJveC54bCxcbiAgICAgICAgeHIgPSBiYm94LnhyLFxuICAgICAgICB5dCA9IGJib3gueXQsXG4gICAgICAgIHliID0gYmJveC55YixcbiAgICAgICAgY2VsbHMgPSB0aGlzLmNlbGxzLFxuICAgICAgICBpQ2VsbCA9IGNlbGxzLmxlbmd0aCxcbiAgICAgICAgY2VsbCxcbiAgICAgICAgaUxlZnQsXG4gICAgICAgIGhhbGZlZGdlcywgbkhhbGZlZGdlcyxcbiAgICAgICAgZWRnZSxcbiAgICAgICAgdmEsIHZiLCB2eixcbiAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQsXG4gICAgICAgIGFic19mbiA9IE1hdGguYWJzO1xuXG4gICAgd2hpbGUgKGlDZWxsLS0pIHtcbiAgICAgICAgY2VsbCA9IGNlbGxzW2lDZWxsXTtcbiAgICAgICAgLy8gcHJ1bmUsIG9yZGVyIGhhbGZlZGdlcyBjb3VudGVyY2xvY2t3aXNlLCB0aGVuIGFkZCBtaXNzaW5nIG9uZXNcbiAgICAgICAgLy8gcmVxdWlyZWQgdG8gY2xvc2UgY2VsbHNcbiAgICAgICAgaWYgKCFjZWxsLnByZXBhcmVIYWxmZWRnZXMoKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmICghY2VsbC5jbG9zZU1lKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgLy8gZmluZCBmaXJzdCAndW5jbG9zZWQnIHBvaW50LlxuICAgICAgICAvLyBhbiAndW5jbG9zZWQnIHBvaW50IHdpbGwgYmUgdGhlIGVuZCBwb2ludCBvZiBhIGhhbGZlZGdlIHdoaWNoXG4gICAgICAgIC8vIGRvZXMgbm90IG1hdGNoIHRoZSBzdGFydCBwb2ludCBvZiB0aGUgZm9sbG93aW5nIGhhbGZlZGdlXG4gICAgICAgIGhhbGZlZGdlcyA9IGNlbGwuaGFsZmVkZ2VzO1xuICAgICAgICBuSGFsZmVkZ2VzID0gaGFsZmVkZ2VzLmxlbmd0aDtcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiBvbmx5IG9uZSBzaXRlLCBpbiB3aGljaCBjYXNlLCB0aGUgdmlld3BvcnQgaXMgdGhlIGNlbGxcbiAgICAgICAgLy8gLi4uXG5cbiAgICAgICAgLy8gYWxsIG90aGVyIGNhc2VzXG4gICAgICAgIGlMZWZ0ID0gMDtcbiAgICAgICAgd2hpbGUgKGlMZWZ0IDwgbkhhbGZlZGdlcykge1xuICAgICAgICAgICAgdmEgPSBoYWxmZWRnZXNbaUxlZnRdLmdldEVuZHBvaW50KCk7XG4gICAgICAgICAgICB2eiA9IGhhbGZlZGdlc1soaUxlZnQrMSkgJSBuSGFsZmVkZ2VzXS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgICAgICAvLyBpZiBlbmQgcG9pbnQgaXMgbm90IGVxdWFsIHRvIHN0YXJ0IHBvaW50LCB3ZSBuZWVkIHRvIGFkZCB0aGUgbWlzc2luZ1xuICAgICAgICAgICAgLy8gaGFsZmVkZ2UocykgdXAgdG8gdnpcbiAgICAgICAgICAgIGlmIChhYnNfZm4odmEueC12ei54KT49MWUtOSB8fCBhYnNfZm4odmEueS12ei55KT49MWUtOSkge1xuXG4gICAgICAgICAgICAgICAgLy8gcmhpbGwgMjAxMy0xMi0wMjpcbiAgICAgICAgICAgICAgICAvLyBcIkhvbGVzXCIgaW4gdGhlIGhhbGZlZGdlcyBhcmUgbm90IG5lY2Vzc2FyaWx5IGFsd2F5cyBhZGphY2VudC5cbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE2XG5cbiAgICAgICAgICAgICAgICAvLyBmaW5kIGVudHJ5IHBvaW50OlxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgZG93bndhcmQgYWxvbmcgbGVmdCBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZhLngseGwpICYmIHRoaXMubGVzc1RoYW5XaXRoRXBzaWxvbih2YS55LHliKTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2FsayByaWdodHdhcmQgYWxvbmcgYm90dG9tIHNpZGVcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odmEueSx5YikgJiYgdGhpcy5sZXNzVGhhbldpdGhFcHNpbG9uKHZhLngseHIpOlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQgPSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odnoueSx5Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueCA6IHhyLCB5Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlID0gdGhpcy5jcmVhdGVCb3JkZXJFZGdlKGNlbGwuc2l0ZSwgdmEsIHZiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlMZWZ0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlMZWZ0LCAwLCB0aGlzLmNyZWF0ZUhhbGZlZGdlKGVkZ2UsIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbkhhbGZlZGdlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0Qm9yZGVyU2VnbWVudCApIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhID0gdmI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIHVwd2FyZCBhbG9uZyByaWdodCBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZhLngseHIpICYmIHRoaXMuZ3JlYXRlclRoYW5XaXRoRXBzaWxvbih2YS55LHl0KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2FsayBsZWZ0d2FyZCBhbG9uZyB0b3Agc2lkZVxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2YS55LHl0KSAmJiB0aGlzLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24odmEueCx4bCk6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei55LHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgobGFzdEJvcmRlclNlZ21lbnQgPyB2ei54IDogeGwsIHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIGRvd253YXJkIGFsb25nIGxlZnQgc2lkZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQgPSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odnoueCx4bCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KHhsLCBsYXN0Qm9yZGVyU2VnbWVudCA/IHZ6LnkgOiB5Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlID0gdGhpcy5jcmVhdGVCb3JkZXJFZGdlKGNlbGwuc2l0ZSwgdmEsIHZiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlMZWZ0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlMZWZ0LCAwLCB0aGlzLmNyZWF0ZUhhbGZlZGdlKGVkZ2UsIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbkhhbGZlZGdlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0Qm9yZGVyU2VnbWVudCApIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhID0gdmI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FsayByaWdodHdhcmQgYWxvbmcgYm90dG9tIHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LnkseWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChsYXN0Qm9yZGVyU2VnbWVudCA/IHZ6LnggOiB4ciwgeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgdXB3YXJkIGFsb25nIHJpZ2h0IHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJWb3Jvbm9pLmNsb3NlQ2VsbHMoKSA+IHRoaXMgbWFrZXMgbm8gc2Vuc2UhXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICBjZWxsLmNsb3NlTWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGVidWdnaW5nIGhlbHBlclxuLypcblZvcm9ub2kucHJvdG90eXBlLmR1bXBCZWFjaGxpbmUgPSBmdW5jdGlvbih5KSB7XG4gICAgY29uc29sZS5sb2coJ1Zvcm9ub2kuZHVtcEJlYWNobGluZSglZikgPiBCZWFjaHNlY3Rpb25zLCBmcm9tIGxlZnQgdG8gcmlnaHQ6JywgeSk7XG4gICAgaWYgKCAhdGhpcy5iZWFjaGxpbmUgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgIE5vbmUnKTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgYnMgPSB0aGlzLmJlYWNobGluZS5nZXRGaXJzdCh0aGlzLmJlYWNobGluZS5yb290KTtcbiAgICAgICAgd2hpbGUgKCBicyApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIHNpdGUgJWQ6IHhsOiAlZiwgeHI6ICVmJywgYnMuc2l0ZS52b3Jvbm9pSWQsIHRoaXMubGVmdEJyZWFrUG9pbnQoYnMsIHkpLCB0aGlzLnJpZ2h0QnJlYWtQb2ludChicywgeSkpO1xuICAgICAgICAgICAgYnMgPSBicy5yYk5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuKi9cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBIZWxwZXI6IFF1YW50aXplIHNpdGVzXG5cbi8vIHJoaWxsIDIwMTMtMTAtMTI6XG4vLyBUaGlzIGlzIHRvIHNvbHZlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9pc3N1ZXMvMTVcbi8vIFNpbmNlIG5vdCBhbGwgdXNlcnMgd2lsbCBlbmQgdXAgdXNpbmcgdGhlIGtpbmQgb2YgY29vcmQgdmFsdWVzIHdoaWNoIHdvdWxkXG4vLyBjYXVzZSB0aGUgaXNzdWUgdG8gYXJpc2UsIEkgY2hvc2UgdG8gbGV0IHRoZSB1c2VyIGRlY2lkZSB3aGV0aGVyIG9yIG5vdFxuLy8gaGUgc2hvdWxkIHNhbml0aXplIGhpcyBjb29yZCB2YWx1ZXMgdGhyb3VnaCB0aGlzIGhlbHBlci4gVGhpcyB3YXksIGZvclxuLy8gdGhvc2UgdXNlcnMgd2hvIHVzZXMgY29vcmQgdmFsdWVzIHdoaWNoIGFyZSBrbm93biB0byBiZSBmaW5lLCBubyBvdmVyaGVhZCBpc1xuLy8gYWRkZWQuXG5cblZvcm9ub2kucHJvdG90eXBlLnF1YW50aXplU2l0ZXMgPSBmdW5jdGlvbihzaXRlcykge1xuICAgIHZhciDOtSA9IHRoaXMuzrUsXG4gICAgICAgIG4gPSBzaXRlcy5sZW5ndGgsXG4gICAgICAgIHNpdGU7XG4gICAgd2hpbGUgKCBuLS0gKSB7XG4gICAgICAgIHNpdGUgPSBzaXRlc1tuXTtcbiAgICAgICAgc2l0ZS54ID0gTWF0aC5mbG9vcihzaXRlLnggLyDOtSkgKiDOtTtcbiAgICAgICAgc2l0ZS55ID0gTWF0aC5mbG9vcihzaXRlLnkgLyDOtSkgKiDOtTtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSGVscGVyOiBSZWN5Y2xlIGRpYWdyYW06IGFsbCB2ZXJ0ZXgsIGVkZ2UgYW5kIGNlbGwgb2JqZWN0cyBhcmVcbi8vIFwic3VycmVuZGVyZWRcIiB0byB0aGUgVm9yb25vaSBvYmplY3QgZm9yIHJldXNlLlxuLy8gVE9ETzogcmhpbGwtdm9yb25vaS1jb3JlIHYyOiBtb3JlIHBlcmZvcm1hbmNlIHRvIGJlIGdhaW5lZFxuLy8gd2hlbiBJIGNoYW5nZSB0aGUgc2VtYW50aWMgb2Ygd2hhdCBpcyByZXR1cm5lZC5cblxuVm9yb25vaS5wcm90b3R5cGUucmVjeWNsZSA9IGZ1bmN0aW9uKGRpYWdyYW0pIHtcbiAgICBpZiAoIGRpYWdyYW0gKSB7XG4gICAgICAgIGlmICggZGlhZ3JhbSBpbnN0YW5jZW9mIHRoaXMuRGlhZ3JhbSApIHtcbiAgICAgICAgICAgIHRoaXMudG9SZWN5Y2xlID0gZGlhZ3JhbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyAnVm9yb25vaS5yZWN5Y2xlRGlhZ3JhbSgpID4gTmVlZCBhIERpYWdyYW0gb2JqZWN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFRvcC1sZXZlbCBGb3J0dW5lIGxvb3BcblxuLy8gcmhpbGwgMjAxMS0wNS0xOTpcbi8vICAgVm9yb25vaSBzaXRlcyBhcmUga2VwdCBjbGllbnQtc2lkZSBub3csIHRvIGFsbG93XG4vLyAgIHVzZXIgdG8gZnJlZWx5IG1vZGlmeSBjb250ZW50LiBBdCBjb21wdXRlIHRpbWUsXG4vLyAgICpyZWZlcmVuY2VzKiB0byBzaXRlcyBhcmUgY29waWVkIGxvY2FsbHkuXG5cblZvcm9ub2kucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihzaXRlcywgYmJveCkge1xuICAgIC8vIHRvIG1lYXN1cmUgZXhlY3V0aW9uIHRpbWVcbiAgICB2YXIgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgIC8vIGluaXQgaW50ZXJuYWwgc3RhdGVcbiAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAvLyBhbnkgZGlhZ3JhbSBkYXRhIGF2YWlsYWJsZSBmb3IgcmVjeWNsaW5nP1xuICAgIC8vIEkgZG8gdGhhdCBoZXJlIHNvIHRoYXQgdGhpcyBpcyBpbmNsdWRlZCBpbiBleGVjdXRpb24gdGltZVxuICAgIGlmICggdGhpcy50b1JlY3ljbGUgKSB7XG4gICAgICAgIHRoaXMudmVydGV4SnVua3lhcmQgPSB0aGlzLnZlcnRleEp1bmt5YXJkLmNvbmNhdCh0aGlzLnRvUmVjeWNsZS52ZXJ0aWNlcyk7XG4gICAgICAgIHRoaXMuZWRnZUp1bmt5YXJkID0gdGhpcy5lZGdlSnVua3lhcmQuY29uY2F0KHRoaXMudG9SZWN5Y2xlLmVkZ2VzKTtcbiAgICAgICAgdGhpcy5jZWxsSnVua3lhcmQgPSB0aGlzLmNlbGxKdW5reWFyZC5jb25jYXQodGhpcy50b1JlY3ljbGUuY2VsbHMpO1xuICAgICAgICB0aGlzLnRvUmVjeWNsZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgIC8vIEluaXRpYWxpemUgc2l0ZSBldmVudCBxdWV1ZVxuICAgIHZhciBzaXRlRXZlbnRzID0gc2l0ZXMuc2xpY2UoMCk7XG4gICAgc2l0ZUV2ZW50cy5zb3J0KGZ1bmN0aW9uKGEsYil7XG4gICAgICAgIHZhciByID0gYi55IC0gYS55O1xuICAgICAgICBpZiAocikge3JldHVybiByO31cbiAgICAgICAgcmV0dXJuIGIueCAtIGEueDtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBwcm9jZXNzIHF1ZXVlXG4gICAgdmFyIHNpdGUgPSBzaXRlRXZlbnRzLnBvcCgpLFxuICAgICAgICBzaXRlaWQgPSAwLFxuICAgICAgICB4c2l0ZXgsIC8vIHRvIGF2b2lkIGR1cGxpY2F0ZSBzaXRlc1xuICAgICAgICB4c2l0ZXksXG4gICAgICAgIGNlbGxzID0gdGhpcy5jZWxscyxcbiAgICAgICAgY2lyY2xlO1xuXG4gICAgLy8gbWFpbiBsb29wXG4gICAgZm9yICg7Oykge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGZpZ3VyZSB3aGV0aGVyIHdlIGhhbmRsZSBhIHNpdGUgb3IgY2lyY2xlIGV2ZW50XG4gICAgICAgIC8vIGZvciB0aGlzIHdlIGZpbmQgb3V0IGlmIHRoZXJlIGlzIGEgc2l0ZSBldmVudCBhbmQgaXQgaXNcbiAgICAgICAgLy8gJ2VhcmxpZXInIHRoYW4gdGhlIGNpcmNsZSBldmVudFxuICAgICAgICBjaXJjbGUgPSB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQ7XG5cbiAgICAgICAgLy8gYWRkIGJlYWNoIHNlY3Rpb25cbiAgICAgICAgaWYgKHNpdGUgJiYgKCFjaXJjbGUgfHwgc2l0ZS55IDwgY2lyY2xlLnkgfHwgKHNpdGUueSA9PT0gY2lyY2xlLnkgJiYgc2l0ZS54IDwgY2lyY2xlLngpKSkge1xuICAgICAgICAgICAgLy8gb25seSBpZiBzaXRlIGlzIG5vdCBhIGR1cGxpY2F0ZVxuICAgICAgICAgICAgaWYgKHNpdGUueCAhPT0geHNpdGV4IHx8IHNpdGUueSAhPT0geHNpdGV5KSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgY3JlYXRlIGNlbGwgZm9yIG5ldyBzaXRlXG4gICAgICAgICAgICAgICAgY2VsbHNbc2l0ZWlkXSA9IHRoaXMuY3JlYXRlQ2VsbChzaXRlKTtcbiAgICAgICAgICAgICAgICBzaXRlLnZvcm9ub2lJZCA9IHNpdGVpZCsrO1xuICAgICAgICAgICAgICAgIC8vIHRoZW4gY3JlYXRlIGEgYmVhY2hzZWN0aW9uIGZvciB0aGF0IHNpdGVcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJlYWNoc2VjdGlvbihzaXRlKTtcbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciBsYXN0IHNpdGUgY29vcmRzIHRvIGRldGVjdCBkdXBsaWNhdGVcbiAgICAgICAgICAgICAgICB4c2l0ZXkgPSBzaXRlLnk7XG4gICAgICAgICAgICAgICAgeHNpdGV4ID0gc2l0ZS54O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpdGUgPSBzaXRlRXZlbnRzLnBvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSBiZWFjaCBzZWN0aW9uXG4gICAgICAgIGVsc2UgaWYgKGNpcmNsZSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVCZWFjaHNlY3Rpb24oY2lyY2xlLmFyYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgLy8gYWxsIGRvbmUsIHF1aXRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgLy8gd3JhcHBpbmctdXA6XG4gICAgLy8gICBjb25uZWN0IGRhbmdsaW5nIGVkZ2VzIHRvIGJvdW5kaW5nIGJveFxuICAgIC8vICAgY3V0IGVkZ2VzIGFzIHBlciBib3VuZGluZyBib3hcbiAgICAvLyAgIGRpc2NhcmQgZWRnZXMgY29tcGxldGVseSBvdXRzaWRlIGJvdW5kaW5nIGJveFxuICAgIC8vICAgZGlzY2FyZCBlZGdlcyB3aGljaCBhcmUgcG9pbnQtbGlrZVxuICAgIHRoaXMuY2xpcEVkZ2VzKGJib3gpO1xuXG4gICAgLy8gICBhZGQgbWlzc2luZyBlZGdlcyBpbiBvcmRlciB0byBjbG9zZSBvcGVuZWQgY2VsbHNcbiAgICB0aGlzLmNsb3NlQ2VsbHMoYmJveCk7XG5cbiAgICAvLyB0byBtZWFzdXJlIGV4ZWN1dGlvbiB0aW1lXG4gICAgdmFyIHN0b3BUaW1lID0gbmV3IERhdGUoKTtcblxuICAgIC8vIHByZXBhcmUgcmV0dXJuIHZhbHVlc1xuICAgIHZhciBkaWFncmFtID0gbmV3IHRoaXMuRGlhZ3JhbSgpO1xuICAgIGRpYWdyYW0uY2VsbHMgPSB0aGlzLmNlbGxzO1xuICAgIGRpYWdyYW0uZWRnZXMgPSB0aGlzLmVkZ2VzO1xuICAgIGRpYWdyYW0udmVydGljZXMgPSB0aGlzLnZlcnRpY2VzO1xuICAgIGRpYWdyYW0uZXhlY1RpbWUgPSBzdG9wVGltZS5nZXRUaW1lKCktc3RhcnRUaW1lLmdldFRpbWUoKTtcblxuICAgIC8vIGNsZWFuIHVwXG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgcmV0dXJuIGRpYWdyYW07XG4gICAgfTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuaWYgKCB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFZvcm9ub2k7XG59XG50aGlzLlZvcm9ub2kgPSBWb3Jvbm9pO1xuIiwiY29uc3Qge1xuICBkaXN0VG9QYXRoLFxuICBnZXRDb3NTaW1Bcm91bmRQb2ludCxcbiAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCxcbiAgZ2V0T3V0bGluZVBvaW50cyxcbiAgZXh0ZW5kUG9pbnRPbkxpbmUsXG4gIGVzdGltYXRlVGFuUG9pbnRzLFxuICByb3VuZFBhdGhQb2ludHMsXG4gIHB0RXEsXG4gIGRpc3QsXG59ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5cbkNMSVBfVEhSRVNIID0gMjtcbkxPV0VSX0NPU19TSU1fVEhSRVNIID0gMC44OTtcblVQUEVSX0NPU19TSU1fVEhSRVNIID0gMC45NztcblxuLy8gQSBicmlkZ2UgaXMgYSBwbGFjZSBpbiB0aGUgcGF0aHN0cmluZyB3aGVyZSAyIHN0cm9rZXMgaW50ZXJzZWN0LiBJdCBjYW4gZWl0aGVyIGJlIDEgc3Ryb2tlIGNsaXBwaW5nXG4vLyBhbm90aGVyLCBvciBpdCBjYW4gYmUgc3Ryb2tlcyBwYXNzaW5nIHRocm91Z2ggZWFjaCBvdGhlci4gSW4gdGhlIHBhdGhzdHJpbmcgZnJvbSBtYWtlbWVhaGFuemksIGFueVxuLy8gTCAjICMgaW4gdGhlIHBhdGhzdHJpbmcgaXMgYVxuY2xhc3MgQnJpZGdlIHtcbiAgY29uc3RydWN0b3IocG9pbnRzLCBwb2ludFN0cmluZywgc3Ryb2tlKSB7XG4gICAgdGhpcy5wb2ludHMgPSBwb2ludHM7XG4gICAgdGhpcy5wb2ludFN0cmluZyA9IHBvaW50U3RyaW5nO1xuICAgIHRoaXMuc3Ryb2tlID0gc3Ryb2tlO1xuICAgIHRoaXMuZXN0VGFuUG9pbnRzID0gZXN0aW1hdGVUYW5Qb2ludHMoc3Ryb2tlLm91dGxpbmUsIHBvaW50cyk7XG4gIH1cblxuICBnZXRDbGlwcygpIHtcbiAgICAvLyB0aGlzIGNsaXAgcG9pbnQgaXMgc3VwZXIgdGlueSwgaXQncyBwcm9iYWJseSBqdXN0IGEgZ2xpdGNoLCBza2lwIGl0XG4gICAgaWYgKGRpc3QodGhpcy5wb2ludHNbMF0sIHRoaXMucG9pbnRzWzFdKSA8IDMuMSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGNvc1NpbTAgPSBnZXRDb3NTaW1Bcm91bmRQb2ludCh0aGlzLnBvaW50c1swXSwgdGhpcy5zdHJva2Uub3V0bGluZSk7XG4gICAgY29uc3QgY29zU2ltMSA9IGdldENvc1NpbUFyb3VuZFBvaW50KHRoaXMucG9pbnRzWzFdLCB0aGlzLnN0cm9rZS5vdXRsaW5lKTtcbiAgICAvLyBJZiB0aGUgYW5nbGUgYXJvdW5kIHRoZSBicmlkZ2UgcG9pbnRzIGxvb2tzIGZsYXQsIGl0J3MgcHJvYmFibHkgYW4gaW50ZXJzZWN0aW9uLlxuICAgIGlmIChNYXRoLm1pbihjb3NTaW0wLCBjb3NTaW0xKSA+IExPV0VSX0NPU19TSU1fVEhSRVNIICYmIE1hdGgubWF4KGNvc1NpbTAsIGNvc1NpbTEpID4gVVBQRVJfQ09TX1NJTV9USFJFU0gpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3Ryb2tlLmNoYXJhY3Rlci5zdHJva2VzLmZpbHRlcihzdHJva2UgPT4ge1xuICAgICAgaWYgKHN0cm9rZSA9PT0gdGhpcy5zdHJva2UpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGRpc3QwID0gZGlzdFRvUGF0aCh0aGlzLnBvaW50c1swXSwgc3Ryb2tlLm91dGxpbmUpO1xuICAgICAgY29uc3QgZGlzdDEgPSBkaXN0VG9QYXRoKHRoaXMucG9pbnRzWzFdLCBzdHJva2Uub3V0bGluZSk7XG4gICAgICByZXR1cm4gZGlzdDAgPD0gQ0xJUF9USFJFU0ggJiYgZGlzdDEgPD0gQ0xJUF9USFJFU0g7XG4gICAgfSkubWFwKGNsaXBwaW5nU3Ryb2tlID0+IG5ldyBDbGlwKHRoaXMsIGNsaXBwaW5nU3Ryb2tlKSk7XG4gIH1cbn1cblxuY2xhc3MgQ2xpcCB7XG4gIGNvbnN0cnVjdG9yKGJyaWRnZSwgY2xpcHBpbmdTdHJva2UpIHtcbiAgICB0aGlzLnBvaW50cyA9IGJyaWRnZS5wb2ludHM7XG4gICAgdGhpcy5lc3RUYW5Qb2ludHMgPSBicmlkZ2UuZXN0VGFuUG9pbnRzO1xuICAgIHRoaXMucG9pbnRTdHJpbmcgPSBicmlkZ2UucG9pbnRTdHJpbmc7XG4gICAgdGhpcy5jbGlwcGVkQnkgPSBbY2xpcHBpbmdTdHJva2VdO1xuICAgIHRoaXMuaXNEb3VibGUgPSBmYWxzZTtcbiAgfVxuXG4gIGNhbk1lcmdlKG90aGVyQ2xpcCkge1xuICAgIHJldHVybiBwdEVxKHRoaXMucG9pbnRzWzFdLCBvdGhlckNsaXAucG9pbnRzWzBdKTtcbiAgfVxuXG4gIG1lcmdlSW50b0RvdWJsZShvdGhlckNsaXApIHtcbiAgICB0aGlzLmlzRG91YmxlID0gdHJ1ZTtcbiAgICB0aGlzLmNsaXBwZWRCeSA9IHRoaXMuY2xpcHBlZEJ5LmNvbmNhdChvdGhlckNsaXAuY2xpcHBlZEJ5KTtcbiAgICB0aGlzLm1pZGRsZVBvaW50ID0gb3RoZXJDbGlwLnBvaW50c1swXTtcbiAgICB0aGlzLnBvaW50c1sxXSA9IG90aGVyQ2xpcC5wb2ludHNbMV07XG4gICAgdGhpcy5lc3RUYW5Qb2ludHNbMV0gPSBvdGhlckNsaXAuZXN0VGFuUG9pbnRzWzFdO1xuICAgIHRoaXMucG9pbnRTdHJpbmcgKz0gb3RoZXJDbGlwLnBvaW50U3RyaW5nLnJlcGxhY2UoLy4qTC8sICcgTCcpO1xuICB9XG5cbiAgZ2V0TmV3U3Ryb2tlVGlwKCkge1xuICAgIGNvbnN0IG1heENvbnRyb2xQb2ludCA9IGdldExpbmVzSW50ZXJzZWN0UG9pbnQoXG4gICAgICB0aGlzLmVzdFRhblBvaW50c1swXSxcbiAgICAgIHRoaXMucG9pbnRzWzBdLFxuICAgICAgdGhpcy5lc3RUYW5Qb2ludHNbMV0sXG4gICAgICB0aGlzLnBvaW50c1sxXSxcbiAgICApO1xuXG4gICAgY29uc3QgbWF4RGlzdENvbnRyb2wwID0gZGlzdChtYXhDb250cm9sUG9pbnQsIHRoaXMucG9pbnRzWzBdKTtcbiAgICBjb25zdCBtYXhEaXN0Q29udHJvbDEgPSBkaXN0KG1heENvbnRyb2xQb2ludCwgdGhpcy5wb2ludHNbMV0pO1xuICAgIGxldCBkaXN0Q29udHJvbDAgPSBNYXRoLm1pbihtYXhEaXN0Q29udHJvbDAsIDMwKTtcbiAgICBsZXQgZGlzdENvbnRyb2wxID0gTWF0aC5taW4obWF4RGlzdENvbnRyb2wxLCAzMCk7XG5cbiAgICAvLyBpZiB0aGUgMiBsaW5lcyBhcmUgcGFyYWxsZWwsIHRoZXJlIHdpbGwgYmUgbm8gaW50ZXJzZWN0aW9uIHBvaW50LiBKdXN0IHVzZSAzMCBpbiB0aGF0IGNhc2UuXG4gICAgaWYgKGlzTmFOKGRpc3RDb250cm9sMCkpIGRpc3RDb250cm9sMCA9IDMwO1xuICAgIGlmIChpc05hTihkaXN0Q29udHJvbDEpKSBkaXN0Q29udHJvbDEgPSAzMDtcblxuICAgIGlmICh0aGlzLmlzRG91YmxlKSB7XG4gICAgICBjb25zdCBtaWREaXN0MCA9IGRpc3QodGhpcy5taWRkbGVQb2ludCwgdGhpcy5wb2ludHNbMF0pO1xuICAgICAgY29uc3QgbWlkRGlzdDEgPSBkaXN0KHRoaXMubWlkZGxlUG9pbnQsIHRoaXMucG9pbnRzWzFdKTtcbiAgICAgIGRpc3RDb250cm9sMCA9IE1hdGgubWF4KG1pZERpc3QwICogMS40LCBkaXN0Q29udHJvbDApO1xuICAgICAgZGlzdENvbnRyb2wxID0gTWF0aC5tYXgobWlkRGlzdDEgKiAxLjQsIGRpc3RDb250cm9sMSk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udHJvbFBvaW50MCA9IGV4dGVuZFBvaW50T25MaW5lKHRoaXMuZXN0VGFuUG9pbnRzWzBdLCB0aGlzLnBvaW50c1swXSwgZGlzdENvbnRyb2wwKTtcbiAgICBjb25zdCBjb250cm9sUG9pbnQxID0gZXh0ZW5kUG9pbnRPbkxpbmUodGhpcy5lc3RUYW5Qb2ludHNbMV0sIHRoaXMucG9pbnRzWzFdLCBkaXN0Q29udHJvbDEpO1xuXG4gICAgY29uc3QgcFN0cmluZyA9IHBvaW50ID0+IGAke01hdGgucm91bmQocG9pbnQueCl9ICR7TWF0aC5yb3VuZChwb2ludC55KX1gO1xuXG4gICAgcmV0dXJuIGAke3BTdHJpbmcodGhpcy5wb2ludHNbMF0pfSBDICR7cFN0cmluZyhjb250cm9sUG9pbnQwKX0gJHtwU3RyaW5nKGNvbnRyb2xQb2ludDEpfSAke3BTdHJpbmcodGhpcy5wb2ludHNbMV0pfWA7XG4gIH1cbn1cblxuY2xhc3MgU3Ryb2tlIHtcbiAgY29uc3RydWN0b3IocGF0aFN0cmluZywgY2hhcmFjdGVyLCBzdHJva2VOdW0pIHtcbiAgICB0aGlzLnBhdGhTdHJpbmcgPSBwYXRoU3RyaW5nO1xuICAgIHRoaXMub3V0bGluZSA9IGdldE91dGxpbmVQb2ludHMocGF0aFN0cmluZyk7XG4gICAgdGhpcy5jaGFyYWN0ZXIgPSBjaGFyYWN0ZXI7XG4gICAgdGhpcy5zdHJva2VOdW0gPSBzdHJva2VOdW07XG4gIH1cblxuICBnZXRCcmlkZ2VzKCkge1xuICAgIGNvbnN0IHBvaW50U3RyaW5nUGFydHMgPSB0aGlzLnBhdGhTdHJpbmcubWF0Y2goLy0/XFxkKyg/OlxcLlxcZCspPyAtP1xcZCsoPzpcXC5cXGQrKT8gTC9pZyk7XG4gICAgaWYgKCFwb2ludFN0cmluZ1BhcnRzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHBvaW50U3RyaW5nUGFydHMubWFwKHBvaW50U3RyaW5nUGFydCA9PiB7XG4gICAgICBjb25zdCBmdWxsUG9pbnRTdHJpbmdSZWdleCA9IG5ldyBSZWdFeHAoYCR7cG9pbnRTdHJpbmdQYXJ0fSAtP1xcXFxkKyg/OlxcXFwuXFxcXGQrKT8gLT9cXFxcZCsoPzpcXFxcLlxcXFxkKyk/YCk7XG4gICAgICBjb25zdCBwb2ludFN0cmluZyA9IHRoaXMucGF0aFN0cmluZy5tYXRjaChmdWxsUG9pbnRTdHJpbmdSZWdleClbMF07XG4gICAgICBjb25zdCBwYXJ0cyA9IHBvaW50U3RyaW5nLnNwbGl0KC9cXHNMP1xccz8vKS5tYXAobnVtID0+IHBhcnNlRmxvYXQobnVtKSk7XG4gICAgICBjb25zdCBwb2ludHMgPSBbe3g6IHBhcnRzWzBdLCB5OiBwYXJ0c1sxXX0sIHt4OiBwYXJ0c1syXSwgeTogcGFydHNbM119XTtcbiAgICAgIHJldHVybiBuZXcgQnJpZGdlKHBvaW50cywgcG9pbnRTdHJpbmcsIHRoaXMpO1xuICAgIH0pO1xuICB9XG5cbiAgZml4UGF0aFN0cmluZygpIHtcbiAgICBjb25zdCBicmlkZ2VzID0gdGhpcy5nZXRCcmlkZ2VzKCk7XG4gICAgbGV0IGNsaXBzID0gW107XG4gICAgYnJpZGdlcy5mb3JFYWNoKGJyaWRnZSA9PiB7XG4gICAgICBicmlkZ2UuZ2V0Q2xpcHMoKS5mb3JFYWNoKGNsaXAgPT4ge1xuICAgICAgICBjb25zdCBsYXN0Q2xpcCA9IGNsaXBzW2NsaXBzLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAobGFzdENsaXAgJiYgbGFzdENsaXAuY2FuTWVyZ2UoY2xpcCkpIHtcbiAgICAgICAgICBsYXN0Q2xpcC5tZXJnZUludG9Eb3VibGUoY2xpcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xpcHMucHVzaChjbGlwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsZXQgbW9kaWZpZWRQYXRoU3RyaW5nID0gdGhpcy5wYXRoU3RyaW5nO1xuICAgIGNsaXBzLmZvckVhY2goY2xpcCA9PiB7XG4gICAgICBjb25zdCBuZXdUaXAgPSBjbGlwLmdldE5ld1N0cm9rZVRpcCgpO1xuICAgICAgbW9kaWZpZWRQYXRoU3RyaW5nID0gcm91bmRQYXRoUG9pbnRzKG1vZGlmaWVkUGF0aFN0cmluZy5yZXBsYWNlKGNsaXAucG9pbnRTdHJpbmcsIG5ld1RpcCkpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzTW9kaWZpZWQ6IGNsaXBzLmxlbmd0aCA+IDAsXG4gICAgICBpc0RvdWJsZUNsaXBwZWQ6ICEhY2xpcHMuZmluZChjbGlwID0+IGNsaXAuaXNEb3VibGUpLFxuICAgICAgcGF0aFN0cmluZzogbW9kaWZpZWRQYXRoU3RyaW5nLFxuICAgICAgc3Ryb2tlTnVtOiB0aGlzLnN0cm9rZU51bSxcbiAgICB9O1xuICB9XG59XG5cbmNsYXNzIENoYXJhY3RlciB7XG4gIGNvbnN0cnVjdG9yKHBhdGhTdHJpbmdzKSB7XG4gICAgdGhpcy5zdHJva2VzID0gcGF0aFN0cmluZ3MubWFwKChwYXRoLCBpKSA9PiBuZXcgU3Ryb2tlKHBhdGgsIHRoaXMsIGkpKTtcbiAgfVxufVxuXG5jb25zdCBmaXhTdHJva2VzV2l0aERldGFpbHMgPSAoc3Ryb2tlUGF0aFN0cmluZ3MpID0+IHtcbiAgY29uc3QgY2hhcmFjdGVyID0gbmV3IENoYXJhY3RlcihzdHJva2VQYXRoU3RyaW5ncyk7XG4gIGNvbnN0IGZpeGVkU3Ryb2tlc0luZm8gPSBjaGFyYWN0ZXIuc3Ryb2tlcy5tYXAoc3Ryb2tlID0+IHN0cm9rZS5maXhQYXRoU3RyaW5nKCkpO1xuXG4gIHJldHVybiB7XG4gICAgbW9kaWZpZWQ6ICEhZml4ZWRTdHJva2VzSW5mby5maW5kKHN1bW1hcnkgPT4gc3VtbWFyeS5pc01vZGlmaWVkKSxcbiAgICBoYXNEb3VibGVDbGlwcGVkU3Ryb2tlOiAhIWZpeGVkU3Ryb2tlc0luZm8uZmluZChzdW1tYXJ5ID0+IHN1bW1hcnkuaXNEb3VibGVDbGlwcGVkKSxcbiAgICBtb2RpZmllZFN0cm9rZXM6IGZpeGVkU3Ryb2tlc0luZm8uZmlsdGVyKHN1bW1hcnkgPT4gc3VtbWFyeS5pc01vZGlmaWVkKS5tYXAoc3VtbWFyeSA9PiBzdW1tYXJ5LnN0cm9rZU51bSksXG4gICAgc3Ryb2tlczogZml4ZWRTdHJva2VzSW5mby5tYXAoc3VtbWFyeSA9PiBzdW1tYXJ5LnBhdGhTdHJpbmcpLFxuICB9O1xufTtcblxuY29uc3QgZml4U3Ryb2tlc09uY2UgPSAoc3Ryb2tlcykgPT4ge1xuICBjb25zdCBjb3JyZWN0ZWQgPSBmaXhTdHJva2VzV2l0aERldGFpbHMoc3Ryb2tlcyk7XG4gIHJldHVybiBjb3JyZWN0ZWQubW9kaWZpZWQgPyBjb3JyZWN0ZWQuc3Ryb2tlcyA6IHN0cm9rZXM7XG59XG5cbmNvbnN0IGZpeFN0cm9rZXMgPSAoc3Ryb2tlcykgPT4gZml4U3Ryb2tlc09uY2UoZml4U3Ryb2tlc09uY2Uoc3Ryb2tlcykpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtmaXhTdHJva2VzfTtcbiIsImNvbnN0IHN2Z1BhdGhVdGlscyA9IHJlcXVpcmUoJ3BvaW50LWF0LWxlbmd0aCcpO1xuXG5jb25zdCBkaXN0ID0gKHAxLCBwMikgPT4gTWF0aC5zcXJ0KE1hdGgucG93KHAxLnggLSBwMi54LCAyKSArIE1hdGgucG93KHAxLnkgLSBwMi55LCAyKSk7XG5jb25zdCBub3JtID0gKHZlY3QpID0+IGRpc3QodmVjdCwge3g6IDAsIHk6IDB9KTtcbmNvbnN0IHN1YnRyYWN0ID0gKHAxLCBwMikgPT4gKHt4OiBwMS54IC0gcDIueCwgeTogcDEueSAtIHAyLnl9KTtcbmNvbnN0IHB0RXEgPSAocDEsIHAyKSA9PiBwMS54ID09PSBwMi54ICYmIHAxLnkgPT09IHAyLnk7XG5cbmNvbnN0IGdldE91dGxpbmVQb2ludHMgPSAocGF0aFN0cmluZywgY291bnQgPSAxMDAwKSA9PiB7XG4gIGNvbnN0IHBhdGggPSBzdmdQYXRoVXRpbHMocGF0aFN0cmluZyk7XG4gIGNvbnN0IGRlbHRhID0gcGF0aC5sZW5ndGgoKSAvIGNvdW50O1xuICBjb25zdCBvdXRsaW5lID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSkge1xuICAgIGNvbnN0IHN2Z1BvaW50ID0gcGF0aC5hdChpICogZGVsdGEpO1xuICAgIG91dGxpbmUucHVzaCh7eDogc3ZnUG9pbnRbMF0sIHk6IHN2Z1BvaW50WzFdfSk7XG4gIH1cbiAgcmV0dXJuIG91dGxpbmU7XG59O1xuXG4vLyBnZXQgdGhlIGludGVyc2VjdGlvbiBwb2ludCBvZiAyIGxpbmVzIGRlZmluZWQgYnkgMiBwb2ludHMgZWFjaFxuLy8gZnJvbSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaW5lJUUyJTgwJTkzbGluZV9pbnRlcnNlY3Rpb25cbmNvbnN0IGdldExpbmVzSW50ZXJzZWN0UG9pbnQgPSAobDFwMSwgbDFwMiwgbDJwMSwgbDJwMikgPT4ge1xuICBjb25zdCB4MSA9IGwxcDEueDtcbiAgY29uc3QgeDIgPSBsMXAyLng7XG4gIGNvbnN0IHgzID0gbDJwMS54O1xuICBjb25zdCB4NCA9IGwycDIueDtcbiAgY29uc3QgeTEgPSBsMXAxLnk7XG4gIGNvbnN0IHkyID0gbDFwMi55O1xuICBjb25zdCB5MyA9IGwycDEueTtcbiAgY29uc3QgeTQgPSBsMnAyLnk7XG4gIGNvbnN0IHhOdW1lcmF0b3IgPSAoeDEgKiB5MiAtIHkxICogeDIpICogKHgzIC0geDQpIC0gKHgxIC0geDIpICogKHgzICogeTQgLSB5MyAqIHg0KTtcbiAgY29uc3QgeU51bWVyYXRvciA9ICh4MSAqIHkyIC0geTEgKiB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgKiB5NCAtIHkzICogeDQpO1xuICBjb25zdCBkZW5vbWluYXRvciA9ICh4MSAtIHgyKSAqICh5MyAtIHk0KSAtICh5MSAtIHkyKSAqICh4MyAtIHg0KTtcbiAgcmV0dXJuIHt4OiB4TnVtZXJhdG9yIC8gZGVub21pbmF0b3IsIHk6IHlOdW1lcmF0b3IgLyBkZW5vbWluYXRvcn07XG59O1xuXG5jb25zdCBnZXRQb2ludEluZGV4ID0gKHBvaW50LCBwYXRoT3V0bGluZSkgPT4ge1xuICBjb25zdCBkaXN0cyA9IHBhdGhPdXRsaW5lLm1hcChvdXRsaW5lUG9pbnQgPT4gZGlzdChwb2ludCwgb3V0bGluZVBvaW50KSk7XG4gIGNvbnN0IG1pbiA9IE1hdGgubWluKC4uLmRpc3RzKTtcbiAgcmV0dXJuIGRpc3RzLmluZGV4T2YobWluKTtcbn07XG5cbmNvbnN0IGdldEluZGV4QXREZWx0YSA9IChpbmRleCwgZGVsdGEsIHBhdGhPdXRsaW5lKSA9PiB7XG4gIHJldHVybiAocGF0aE91dGxpbmUubGVuZ3RoICsgaW5kZXggKyBkZWx0YSkgJSBwYXRoT3V0bGluZS5sZW5ndGg7XG59O1xuXG5jb25zdCBnZXRDb3NTaW1Bcm91bmRQb2ludCA9IChwb2ludCwgcGF0aE91dGxpbmUpID0+IHtcbiAgLy8gaWYgdGhpcyBpcyAxLCB0aGUgcG9pbnQgaXMgb24gYSBmbGF0IGxpbmUuXG4gIGNvbnN0IHBvaW50SW5kZXggPSBnZXRQb2ludEluZGV4KHBvaW50LCBwYXRoT3V0bGluZSk7XG4gIGNvbnN0IHByZUluZGV4ID0gZ2V0SW5kZXhBdERlbHRhKHBvaW50SW5kZXgsIC0zLCBwYXRoT3V0bGluZSk7XG4gIGNvbnN0IHBvc3RJbmRleCA9IGdldEluZGV4QXREZWx0YShwb2ludEluZGV4LCAzLCBwYXRoT3V0bGluZSk7XG4gIGNvbnN0IHZlY3QxID0gc3VidHJhY3QocGF0aE91dGxpbmVbcG9pbnRJbmRleF0sIHBhdGhPdXRsaW5lW3ByZUluZGV4XSk7XG4gIGNvbnN0IHZlY3QyID0gc3VidHJhY3QocGF0aE91dGxpbmVbcG9zdEluZGV4XSwgcGF0aE91dGxpbmVbcG9pbnRJbmRleF0pO1xuICByZXR1cm4gKHZlY3QxLnggKiB2ZWN0Mi54ICsgdmVjdDEueSAqIHZlY3QyLnkpIC8gKG5vcm0odmVjdDEpICogbm9ybSh2ZWN0MikpO1xufTtcblxuLy8gcmV0dXJuIGEgbmV3IHBvaW50LCBwMywgd2hpY2ggaXMgb24gdGhlIHNhbWUgbGluZSBhcyBwMSBhbmQgcDIsIGJ1dCBkaXN0YW5jZSBhd2F5XG4vLyBmcm9tIHAyLiBwMSwgcDIsIHAzIHdpbGwgYWx3YXlzIGxpZSBvbiB0aGUgbGluZSBpbiB0aGF0IG9yZGVyXG5jb25zdCBleHRlbmRQb2ludE9uTGluZSA9IChwMSwgcDIsIGRpc3RhbmNlKSA9PiB7XG4gIGNvbnN0IHZlY3QgPSBzdWJ0cmFjdChwMiwgcDEpO1xuICBjb25zdCBtYWcgPSBkaXN0YW5jZSAvIG5vcm0odmVjdCk7XG4gIHJldHVybiB7eDogcDIueCArIG1hZyAqIHZlY3QueCwgeTogcDIueSArIG1hZyAqIHZlY3QueX07XG59O1xuXG5jb25zdCBkaXN0VG9QYXRoID0gKHBvaW50LCBwYXRoT3V0bGluZSkgPT4ge1xuICBjb25zdCBkaXN0cyA9IHBhdGhPdXRsaW5lLm1hcChvdXRsaW5lUG9pbnQgPT4gZGlzdChwb2ludCwgb3V0bGluZVBvaW50KSk7XG4gIHJldHVybiBNYXRoLm1pbiguLi5kaXN0cyk7XG59O1xuXG5jb25zdCByb3VuZFBhdGhQb2ludHMgPSAocGF0aFN0cmluZykgPT4ge1xuICBjb25zdCBmbG9hdHMgPSBwYXRoU3RyaW5nLm1hdGNoKC9cXGQrXFwuXFxkKy9pZyk7XG4gIGlmICghZmxvYXRzKSByZXR1cm4gcGF0aFN0cmluZztcbiAgbGV0IGZpeGVkUGF0aFN0cmluZyA9IHBhdGhTdHJpbmc7XG4gIGZsb2F0cy5mb3JFYWNoKGZsb2F0ID0+IHtcbiAgICBmaXhlZFBhdGhTdHJpbmcgPSBmaXhlZFBhdGhTdHJpbmcucmVwbGFjZShmbG9hdCwgTWF0aC5yb3VuZChwYXJzZUZsb2F0KGZsb2F0KSkpO1xuICB9KTtcbiAgcmV0dXJuIGZpeGVkUGF0aFN0cmluZztcbn07XG5cbmNvbnN0IGVzdGltYXRlVGFuUG9pbnRzID0gKHBhdGhPdXRsaW5lLCBjbGlwUG9pbnRzKSA9PiB7XG4gIGNvbnN0IGNwSW5kZXgwID0gZ2V0UG9pbnRJbmRleChjbGlwUG9pbnRzWzBdLCBwYXRoT3V0bGluZSk7XG4gIGNvbnN0IGNwSW5kZXgxID0gZ2V0UG9pbnRJbmRleChjbGlwUG9pbnRzWzFdLCBwYXRoT3V0bGluZSk7XG4gIHJldHVybiBbXG4gICAgcGF0aE91dGxpbmVbZ2V0SW5kZXhBdERlbHRhKGNwSW5kZXgwLCAtMTUsIHBhdGhPdXRsaW5lKV0sXG4gICAgcGF0aE91dGxpbmVbZ2V0SW5kZXhBdERlbHRhKGNwSW5kZXgxLCAxNSwgcGF0aE91dGxpbmUpXSxcbiAgXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkaXN0VG9QYXRoLFxuICBnZXRDb3NTaW1Bcm91bmRQb2ludCxcbiAgZ2V0T3V0bGluZVBvaW50cyxcbiAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCxcbiAgZXh0ZW5kUG9pbnRPbkxpbmUsXG4gIGVzdGltYXRlVGFuUG9pbnRzLFxuICBkaXN0LFxuICBwdEVxLFxuICByb3VuZFBhdGhQb2ludHMsXG59O1xuIiwiY29uc3Qga0lkUHJlZml4ID0gJ21ha2UtbWUtYS1oYW56aSc7XG5jb25zdCBrV2lkdGggPSAxMjg7XG5cbmNvbnN0IGRpc3RhbmNlMiA9IChwb2ludDEsIHBvaW50MikgPT4ge1xuICBjb25zdCBkaWZmID0gW3BvaW50MVswXSAtIHBvaW50MlswXSwgcG9pbnQxWzFdIC0gcG9pbnQyWzFdXTtcbiAgcmV0dXJuIGRpZmZbMF0qZGlmZlswXSArIGRpZmZbMV0qZGlmZlsxXTtcbn1cblxuY29uc3QgZ2V0TWVkaWFuTGVuZ3RoID0gKG1lZGlhbikgPT4ge1xuICBsZXQgcmVzdWx0ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZWRpYW4ubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgcmVzdWx0ICs9IE1hdGguc3FydChkaXN0YW5jZTIobWVkaWFuW2ldLCBtZWRpYW5baSArIDFdKSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3QgZ2V0TWVkaWFuUGF0aCA9IChtZWRpYW4pID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGZvciAobGV0IHBvaW50IG9mIG1lZGlhbikge1xuICAgIHJlc3VsdC5wdXNoKHJlc3VsdC5sZW5ndGggPT09IDAgPyAnTScgOiAnTCcpO1xuICAgIHJlc3VsdC5wdXNoKCcnICsgcG9pbnRbMF0pO1xuICAgIHJlc3VsdC5wdXNoKCcnICsgcG9pbnRbMV0pO1xuICB9XG4gIHJldHVybiByZXN1bHQuam9pbignICcpO1xufVxuXG5cbmNvbnN0IGdldEFuaW1hdGlvbkRhdGEgPSAoc3Ryb2tlcywgbWVkaWFucywgb3B0aW9ucykgPT4ge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgY29uc3QgZGVsYXkgPSAxMDI0ICogKG9wdGlvbnMuZGVsYXkgfHwgMC4zKTtcbiAgY29uc3Qgc3BlZWQgPSAxMDI0ICogKG9wdGlvbnMuc3BlZWQgfHwgMC4wMik7XG5cbiAgY29uc3QgbGVuZ3RocyA9IG1lZGlhbnMubWFwKCh4KSA9PiBnZXRNZWRpYW5MZW5ndGgoeCkgKyBrV2lkdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChNYXRoLnJvdW5kKTtcbiAgY29uc3QgcGF0aHMgPSBtZWRpYW5zLm1hcChnZXRNZWRpYW5QYXRoKTtcblxuICBjb25zdCBhbmltYXRpb25zID0gW107XG4gIGxldCB0b3RhbF9kdXJhdGlvbiA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3Ryb2tlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG9mZnNldCA9IGxlbmd0aHNbaV0gKyBrV2lkdGg7XG4gICAgY29uc3QgZHVyYXRpb24gPSAoZGVsYXkgKyBvZmZzZXQpIC8gc3BlZWQgLyA2MDtcbiAgICBjb25zdCBmcmFjdGlvbiA9IE1hdGgucm91bmQoMTAwICogb2Zmc2V0IC8gKGRlbGF5ICsgb2Zmc2V0KSk7XG4gICAgYW5pbWF0aW9ucy5wdXNoKHtcbiAgICAgIGFuaW1hdGlvbl9pZDogYCR7a0lkUHJlZml4fS1hbmltYXRpb24tJHtpfWAsXG4gICAgICBjbGlwX2lkOiBgJHtrSWRQcmVmaXh9LWNsaXAtJHtpfWAsXG4gICAgICBkOiBwYXRoc1tpXSxcbiAgICAgIGRlbGF5OiBgJHt0b3RhbF9kdXJhdGlvbn1zYCxcbiAgICAgIGR1cmF0aW9uOiBgJHtkdXJhdGlvbn1zYCxcbiAgICAgIGZyYWN0aW9uOiBgJHtmcmFjdGlvbn0lYCxcbiAgICAgIGtleWZyYW1lczogYGtleWZyYW1lcyR7aX1gLFxuICAgICAgbGVuZ3RoOiBsZW5ndGhzW2ldLFxuICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICBzcGFjaW5nOiAyICogbGVuZ3Roc1tpXSxcbiAgICAgIHN0cm9rZTogc3Ryb2tlc1tpXSxcbiAgICAgIHdpZHRoOiBrV2lkdGgsXG4gICAgfSk7XG4gICAgdG90YWxfZHVyYXRpb24gKz0gZHVyYXRpb247XG4gIH1cblxuICByZXR1cm4ge2FuaW1hdGlvbnM6IGFuaW1hdGlvbnMsIHN0cm9rZXM6IHN0cm9rZXN9O1xufVxuXG5leHBvcnQge2dldEFuaW1hdGlvbkRhdGF9O1xuIiwiLy8gUHJpbnRzIHRoZSBtZXNzYWdlIGFuZCB0aHJvd3MgYW4gZXJyb3IgaWYgdGhlIGNvbmRpdGlvbmlzIGZhbHNlLlxuY29uc3QgYXNzZXJ0ID0gKGNvbmRpdGlvbiwgbWVzc2FnZSkgPT4ge1xuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gICAgdGhyb3cgbmV3IEVycm9yO1xuICB9XG59XG5cbmNvbnN0IGlzTnVtYmVyID0gKHgpID0+IE51bWJlci5pc0Zpbml0ZSh4KSAmJiAhTnVtYmVyLmlzTmFOKHgpO1xuXG5jb25zdCBtYXliZVJlcXVpcmUgPSAobW9kdWxlKSA9PiBNZXRlb3IuaXNTZXJ2ZXIgPyBOcG0ucmVxdWlyZShtb2R1bGUpIDogbnVsbDtcblxubGV0IGdldFBXRCA9IG51bGw7XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgTWV0ZW9yLm5wbVJlcXVpcmUoJ2VzNi1zaGltJyk7XG4gIGNvbnN0IHBhdGggPSBOcG0ucmVxdWlyZSgncGF0aCcpO1xuXG4gIGdldFBXRCA9ICgpID0+IHtcbiAgICAvLyBUT0RPKHNraXNob3JlKTogVGhlIG5leHQgbGluZSBtYWtlcyBhc3N1bXB0aW9ucyBhYm91dCB0aGUgTWV0ZW9yIGJ1aWxkXG4gICAgLy8gZGlyZWN0b3J5J3Mgc3RydWN0dXJlLiBXZSBzaG91bGQgcmVwbGFjZSBpdCB3aXRoIGEgTWV0ZW9yLXByb3ZpZGVkIEFQSS5cbiAgICByZXR1cm4gcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuUFdEID9cbiAgICAgICAgcHJvY2Vzcy5lbnYuUFdEIDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuLi8uLi8uLi8uLicpO1xuICB9XG59XG5cbi8vIFJldHVybnMgYSBsaXN0IG9mIHRoZSB1bmlxdWUgdmFsdWVzIGluIHRoZSBnaXZlbiBhcnJheSwgb3JkZXJlZCBieSB0aGVpclxuLy8gZmlyc3QgYXBwZWFyYW5jZSBpbiB0aGUgYXJyYXkuXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBjb25zdCBzZWVuID0ge307XG4gIHRoaXMubWFwKCh4KSA9PiB7XG4gICAgaWYgKCFzZWVuW3hdKSB7XG4gICAgICByZXN1bHQucHVzaCh4KTtcbiAgICAgIHNlZW5beF0gPSB0cnVlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEdpdmVuIGEgc3RyaW5nIGFuZCBhIGRpY3QgbWFwcGluZyBjaGFyYWN0ZXJzIHRvIG90aGVyIGNoYXJhY3RlcnMsIHJldHVybiBhXG4vLyBzdHJpbmcgd2l0aCB0aGF0IG1hcHBpbmcgYXBwbGllZCB0byBlYWNoIG9mIGl0cyBjaGFyYWN0ZXJzLlxuU3RyaW5nLnByb3RvdHlwZS5hcHBseU1hcHBpbmcgPSBmdW5jdGlvbihtYXBwaW5nKSB7XG4gIGxldCByZXN1bHQgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzdWx0ICs9IG1hcHBpbmdbdGhpc1tpXV0gPyBtYXBwaW5nW3RoaXNbaV1dIDogdGhpc1tpXTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBIZWxwZXIgbWV0aG9kcyBmb3IgdXNlIHdpdGggYW5nbGVzLCB3aGljaCBhcmUgZmxvYXRzIGluIFstcGksIHBpKS5cbmNvbnN0IEFuZ2xlID0ge1xuICBzdWJ0cmFjdDogKGFuZ2xlMSwgYW5nbGUyKSA9PiB7XG4gICAgdmFyIHJlc3VsdCA9IGFuZ2xlMSAtIGFuZ2xlMjtcbiAgICBpZiAocmVzdWx0IDwgLU1hdGguUEkpIHtcbiAgICAgIHJlc3VsdCArPSAyKk1hdGguUEk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQgPj0gTWF0aC5QSSkge1xuICAgICAgcmVzdWx0IC09IDIqTWF0aC5QSTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbiAgcGVuYWx0eTogKGRpZmYpID0+IGRpZmYqZGlmZixcbn07XG5cbi8vIEhlbHBlciBtZXRob2RzIGZvciB1c2Ugd2l0aCBcInBvaW50c1wiLCB3aGljaCBhcmUgcGFpcnMgb2YgaW50ZWdlcnMuXG5jb25zdCBQb2ludCA9IHtcbiAgYWRkOiAocG9pbnQxLCBwb2ludDIpID0+IFtwb2ludDFbMF0gKyBwb2ludDJbMF0sIHBvaW50MVsxXSArIHBvaW50MlsxXV0sXG4gIGFuZ2xlOiAocG9pbnQpID0+IE1hdGguYXRhbjIocG9pbnRbMV0sIHBvaW50WzBdKSxcbiAgY2xvbmU6IChwb2ludCkgPT4gW3BvaW50WzBdLCBwb2ludFsxXV0sXG4gIGRpc3RhbmNlMihwb2ludDEsIHBvaW50Mikge1xuICAgIHZhciBkaWZmID0gUG9pbnQuc3VidHJhY3QocG9pbnQxLCBwb2ludDIpO1xuICAgIHJldHVybiBNYXRoLnBvdyhkaWZmWzBdLCAyKSArIE1hdGgucG93KGRpZmZbMV0sIDIpO1xuICB9LFxuICBkb3Q6IChwb2ludDEsIHBvaW50MikgPT4gcG9pbnQxWzBdKnBvaW50MlswXSArIHBvaW50MVsxXSpwb2ludDJbMV0sXG4gIGVxdWFsOiAocG9pbnQxLCBwb2ludDIpID0+IHBvaW50MVswXSA9PT0gcG9pbnQyWzBdICYmIHBvaW50MVsxXSA9PT0gcG9pbnQyWzFdLFxuICBrZXk6IChwb2ludCkgPT4gcG9pbnQuam9pbignLCcpLFxuICBtaWRwb2ludDogKHBvaW50MSwgcG9pbnQyKSA9PiB7XG4gICAgcmV0dXJuIFsocG9pbnQxWzBdICsgcG9pbnQyWzBdKS8yLCAocG9pbnQxWzFdICsgcG9pbnQyWzFdKS8yXTtcbiAgfSxcbiAgc3VidHJhY3Q6IChwb2ludDEsIHBvaW50MikgPT4gW3BvaW50MVswXSAtIHBvaW50MlswXSwgcG9pbnQxWzFdIC0gcG9pbnQyWzFdXSxcbiAgdmFsaWQ6IChwb2ludCkgPT4gaXNOdW1iZXIocG9pbnRbMF0pICYmIGlzTnVtYmVyKHBvaW50WzFdKSxcbn07XG5cbmV4cG9ydCB7YXNzZXJ0LCBnZXRQV0QsIG1heWJlUmVxdWlyZSwgQW5nbGUsIFBvaW50fTtcbiIsImltcG9ydCB7YXNzZXJ0LCBnZXRQV0QsIG1heWJlUmVxdWlyZX0gZnJvbSAnL2xpYi9iYXNlJztcblxuY29uc3QgZnMgPSBtYXliZVJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwYXRoID0gbWF5YmVSZXF1aXJlKCdwYXRoJyk7XG5cbmNvbnN0IENIQVJBQ1RFUl9GSUVMRFMgPSBbJ2NoYXJhY3RlcicsICdkZWNvbXBvc2l0aW9uJywgJ2RlZmluaXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnZnJlcXVlbmN5JywgJ2thbmd4aV9pbmRleCcsICdwaW55aW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnc2ltcGxpZmllZCcsICdzdHJva2VzJywgJ3RyYWRpdGlvbmFsJ107XG5cbmNvbnN0IGNqa2xpYiA9IHtcbiAgY2hhcmFjdGVyczoge30sXG4gIGdiMjMxMjoge30sXG4gIHByb21pc2U6IHVuZGVmaW5lZCxcbiAgcmFkaWNhbHM6IHtcbiAgICBwcmltYXJ5X3JhZGljYWw6IHt9LFxuICAgIGluZGV4X3RvX3JhZGljYWxfbWFwOiB7fSxcbiAgICByYWRpY2FsX3RvX2luZGV4X21hcDoge30sXG4gICAgcmFkaWNhbF90b19jaGFyYWN0ZXJfbWFwOiB7fSxcbiAgfSxcbiAgZ2V0Q2hhcmFjdGVyRGF0YShjaGFyYWN0ZXIpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBDSEFSQUNURVJfRklFTERTLm1hcCgoZmllbGQpID0+XG4gICAgICAgIHJlc3VsdFtmaWVsZF0gPSBjamtsaWIuY2hhcmFjdGVyc1tmaWVsZF1bY2hhcmFjdGVyXSk7XG4gICAgcmVzdWx0LmNoYXJhY3RlciA9IGNoYXJhY3RlcjtcbiAgICByZXN1bHQudHJhZGl0aW9uYWwgPSByZXN1bHQudHJhZGl0aW9uYWwgfHwgW107XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbn07XG5cbkNIQVJBQ1RFUl9GSUVMRFMubWFwKChmaWVsZCkgPT4gY2prbGliLmNoYXJhY3RlcnNbZmllbGRdID0ge30pO1xuXG4vLyBJbnB1dDogU3RyaW5nIGNvbnRlbnRzIG9mIGEgY2prbGliIGRhdGEgZmlsZS5cbi8vIE91dHB1dDogYSBsaXN0IG9mIHJvd3MsIGVhY2ggb2Ygd2hpY2ggaXMgYSBsaXN0IG9mIFN0cmluZyBjb2x1bW5zLlxuY29uc3QgZ2V0Q0pLTGliUm93cyA9IChkYXRhKSA9PiB7XG4gIGNvbnN0IGxpbmVzID0gZGF0YS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiBsaW5lcy5maWx0ZXIoKGxpbmUpID0+IGxpbmUubGVuZ3RoID4gMCAmJiBsaW5lWzBdICE9PSAnIycpXG4gICAgICAgICAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUuc3BsaXQoJywnKS5tYXAoXG4gICAgICAgICAgICAgICAgICAoZW50cnkpID0+IGVudHJ5LnJlcGxhY2UoL1tcIiddL2csICcnKSkpO1xufVxuXG4vLyBJbnB1dDogU3RyaW5nIGNvbnRlbnRzIG9mIGEgVFNWIGRhdGEgZmlsZS5cbi8vIE91dHB1dDogYSBsaXN0IG9mIHJvd3MsIGVhY2ggb2Ygd2hpY2ggaXMgYSBsaXN0IG9mIFN0cmluZyBjb2x1bW5zLlxuY29uc3QgZ2V0RnJlcXVlbmN5Um93cyA9IChkYXRhKSA9PiB7XG4gIGNvbnN0IGxpbmVzID0gZGF0YS5zcGxpdCgnXFxuJyk7XG4gIHJldHVybiBsaW5lcy5maWx0ZXIoKGxpbmUpID0+IGxpbmUubGVuZ3RoID4gMCAmJiBsaW5lWzBdICE9PSAnIycpXG4gICAgICAgICAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUuc3BsaXQoJ1xcdCcpKTtcbn1cblxuLy8gSW5wdXQ6IFN0cmluZyBjb250ZW50cyBvZiBhIFVuaWhhbiBkYXRhIGZpbGUuXG4vLyBPdXRwdXQ6IGEgbGlzdCBvZiByb3dzLCBlYWNoIG9mIHdoaWNoIGlzIGEgbGlzdCBvZiBTdHJpbmcgY29sdW1ucy5cbmNvbnN0IGdldFVuaWhhblJvd3MgPSAoZGF0YSkgPT4ge1xuICBjb25zdCBsaW5lcyA9IGRhdGEuc3BsaXQoJ1xcbicpO1xuICByZXR1cm4gbGluZXMuZmlsdGVyKChsaW5lKSA9PiBsaW5lLmxlbmd0aCA+IDAgJiYgbGluZVswXSAhPT0gJyMnKVxuICAgICAgICAgICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnNwbGl0KCdcXHQnKSk7XG59XG5cbi8vIElucHV0OiBhIFN0cmluZyBvZiB0aGUgZm9ybSAnVSs8aGV4PicgcmVwcmVzZW50aW5nIGEgVW5pY29kZSBjb2RlcG9pbnQuXG4vLyBPdXRwdXQ6IHRoZSBjaGFyYWN0ZXIgYXQgdGhhdCBjb2RlcG9pbnRcbmNvbnN0IHBhcnNlVW5pY29kZVN0ciA9XG4gICAgKHN0cikgPT4gU3RyaW5nLmZyb21Db2RlUG9pbnQocGFyc2VJbnQoc3RyLnN1YnN0cigyKSwgMTYpKTtcblxuLy8gSW5wdXQ6IHRoZSBwYXRoIHRvIGEgVW5paGFuIGRhdGEgZmlsZSwgc3RhcnRpbmcgZnJvbSB0aGUgcHVibGljIGRpcmVjdG9yeS5cbi8vIE91dHB1dDogUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBTdHJpbmcgY29udGVudHMgb2YgdGhhdCBmaWxlLlxuY29uc3QgcmVhZEZpbGUgPSAoZmlsZW5hbWUpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgIGNvbnN0IGZpbGVwYXRoID0gcGF0aC5qb2luKGdldFBXRCgpLCAncHVibGljJywgZmlsZW5hbWUpO1xuICAgIGZzLnJlYWRGaWxlKGZpbGVwYXRoLCAndXRmOCcsIChlcnJvciwgZGF0YSkgPT4ge1xuICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgJC5nZXQoZmlsZW5hbWUsIChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICBpZiAoY29kZSAhPT0gJ3N1Y2Nlc3MnKSB0aHJvdyBuZXcgRXJyb3IoY29kZSk7XG4gICAgICByZXNvbHZlKGRhdGEpO1xuICAgIH0pO1xuICB9XG59KTtcblxuLy8gUHJvbWlzZXMgdGhhdCBmaWxsIGRhdGEgZnJvbSBzcGVjaWZpYyB0YWJsZXMuXG5cbi8vIE91dHB1dDogUHJvbWlzZSB0aGF0IGZpbGxzIHJlc3VsdCB3aXRoIGEgbWFwcGluZyBjaGFyYWN0ZXIgLT4gZGVjb21wb3NpdGlvbi5cbi8vIFRoZSBkZWNvbXBvc2l0aW9ucyBhcmUgZm9ybWF0dGVkIHVzaW5nIElkZW9ncmFwaGljIERlc2NyaXB0aW9uIFNlcXVlbmNlXG4vLyBzeW1ib2xzIC0gc2VlIHRoZSBVbmljb2RlIHN0YW5kYXJkIGZvciBtb3JlIGRldGFpbHMuXG5jb25zdCBmaWxsRGVjb21wb3NpdGlvbnMgPSAoZGVjb21wb3NpdGlvbnMsIGdseXBocywgcmVzdWx0KSA9PiB7XG4gIHJldHVybiBQcm9taXNlLmFsbChbZGVjb21wb3NpdGlvbnMsIGdseXBoc10pLnRoZW4oKFtyb3dzLCBnbHlwaHNdKSA9PiB7XG4gICAgcm93cy5maWx0ZXIoKHJvdykgPT4gcGFyc2VJbnQocm93WzJdLCAxMCkgPT09IChnbHlwaHNbcm93WzBdXSB8fCAwKSlcbiAgICAgICAgLm1hcCgocm93KSA9PiByZXN1bHRbcm93WzBdXSA9IHJvd1sxXSk7XG4gIH0pO1xufVxuXG4vLyBPdXRwdXQ6IFByb21pc2UgdGhhdCBmaWxscyByZXN1bHQgd2l0aCBhIG1hcHBpbmcgY2hhcmFjdGVyIC0+IFBpbnlpbi5cbmNvbnN0IGZpbGxEZWZpbml0aW9ucyA9IChyZWFkaW5ncywgcmVzdWx0KSA9PiB7XG4gIHJldHVybiByZWFkaW5ncy50aGVuKChyb3dzKSA9PiB7XG4gICAgcm93cy5maWx0ZXIoKHJvdykgPT4gcm93WzFdID09PSAna0RlZmluaXRpb24nKVxuICAgICAgICAubWFwKChyb3cpID0+IHJlc3VsdFtwYXJzZVVuaWNvZGVTdHIocm93WzBdKV0gPSByb3dbMl0pO1xuICB9KTtcbn1cblxuLy8gT3V0cHV0OiBQcm9taXNlIHRoYXQgZmlsbHMgcmVzdWx0IHdpdGggYSBtYXBwaW5nIGNoYXJhY3RlciAtPiBmcmVxdWVuY3kgcmFuay5cbmNvbnN0IGZpbGxGcmVxdWVuY2llcyA9IChyZWFkaW5ncywgcmVzdWx0KSA9PiB7XG4gIHJldHVybiByZWFkaW5ncy50aGVuKChyb3dzKSA9PiB7XG4gICAgcm93cy5tYXAoKHJvdykgPT4gcmVzdWx0W3Jvd1sxXV0gPSBwYXJzZUludChyb3dbMF0sIDEwKSk7XG4gIH0pO1xufVxuXG4vLyBPdXRwdXQ6IFByb21pc2UgdGhhdCBmaWxscyByZXN1bHQgd2l0aCBhIG1hcHBpbmcgY2hhcmFjdGVyIC0+IEthbmd4aSByYWRpY2FsLVxuLy8gc3Ryb2tlIGNvdW50LCB3aGljaCBpcyBhIHBhaXIgb2YgaW50ZWdlcnMgW3JhZGljYWwsIGV4dHJhX3N0cm9rZXNdLlxuY29uc3QgZmlsbEthbmd4aUluZGV4ID0gKHJlYWRpbmdzLCByZXN1bHQpID0+IHtcbiAgcmV0dXJuIHJlYWRpbmdzLnRoZW4oKHJvd3MpID0+IHtcbiAgICBjb25zdCBnZXRJbmRleCA9IChhZG90YikgPT4gYWRvdGIuc3BsaXQoJy4nKS5tYXAoKHgpID0+IHBhcnNlSW50KHgsIDEwKSk7XG4gICAgcm93cy5maWx0ZXIoKHJvdykgPT4gcm93WzFdID09PSAna1JTS2FuZ1hpJylcbiAgICAgICAgLm1hcCgocm93KSA9PiByZXN1bHRbcGFyc2VVbmljb2RlU3RyKHJvd1swXSldID0gZ2V0SW5kZXgocm93WzJdKSk7XG4gIH0pO1xufVxuXG4vLyBPdXRwdXQ6IFByb21pc2UgdGhhdCBmaWxscyByZXN1bHQgd2l0aCBhIG1hcHBpbmcgY2hhcmFjdGVyIC0+IFBpbnlpbi5cbmNvbnN0IGZpbGxQaW55aW4gPSAocmVhZGluZ3MsIHJlc3VsdCkgPT4ge1xuICByZXR1cm4gcmVhZGluZ3MudGhlbigocm93cykgPT4ge1xuICAgIHJvd3MuZmlsdGVyKChyb3cpID0+IHJvd1sxXSA9PT0gJ2tNYW5kYXJpbicpXG4gICAgICAgIC5tYXAoKHJvdykgPT4gcmVzdWx0W3BhcnNlVW5pY29kZVN0cihyb3dbMF0pXSA9IHJvd1syXSk7XG4gIH0pO1xufVxuXG4vLyBPdXRwdXQ6IFByb21pc2UgdGhhdCBmaWxscyByZXN1bHQgd2l0aCBhIG1hcHBpbmcgY2hhcmFjdGVyIC0+IHN0cm9rZSBjb3VudC5cbmNvbnN0IGZpbGxTdHJva2VDb3VudHMgPSAoZGljdGlvbmFyeV9saWtlX2RhdGEsIHJlc3VsdCkgPT4ge1xuICByZXR1cm4gZGljdGlvbmFyeV9saWtlX2RhdGEudGhlbigocm93cykgPT4ge1xuICAgIHJvd3MuZmlsdGVyKChyb3cpID0+IHJvd1sxXSA9PT0gJ2tUb3RhbFN0cm9rZXMnKVxuICAgICAgICAubWFwKChyb3cpID0+IHJlc3VsdFtwYXJzZVVuaWNvZGVTdHIocm93WzBdKV0gPSBwYXJzZUludChyb3dbMl0sIDEwKSk7XG4gIH0pO1xufVxuXG4vLyBPdXRwdXQ6IFByb21pc2UgdGhhdCBmaWxscyBtdWx0aXBsZSBkaWN0aW9uYXJpZXMgaW4gdGhlIHJlc3VsdDpcbi8vICAgLSBpbmRleF90b19yYWRpY2FsX21hcDogTWFwIGZyb20gaW5kZXggLT4gbGlzdCBvZiByYWRpY2FscyBhdCB0aGF0IGluZGV4XG4vLyAgIC0gcmFkaWNhbF90b19pbmRleF9tYXA6IE1hcCBmcm9tIHJhZGljYWwgLT4gaW5kZXggb2YgdGhhdCByYWRpY2FsXG4vLyAgIC0gcHJpbWFyeV9yYWRpY2FsOiBNYXAgZnJvbSBpbmRleCAtPiBwcmltYXJ5IHJhZGljYWwgYXQgdGhhdCBpbmRleFxuY29uc3QgZmlsbFJhZGljYWxEYXRhID0gKGxvY2FsZSwgcmFkaWNhbHMsIHJlc3VsdCkgPT4ge1xuICByZXR1cm4gcmFkaWNhbHMudGhlbigocm93cykgPT4ge1xuICAgIHJvd3MubWFwKChyb3cpID0+IHtcbiAgICAgIGlmICghcmVzdWx0LmluZGV4X3RvX3JhZGljYWxfbWFwLmhhc093blByb3BlcnR5KHJvd1swXSkpIHtcbiAgICAgICAgcmVzdWx0LmluZGV4X3RvX3JhZGljYWxfbWFwW3Jvd1swXV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5pbmRleF90b19yYWRpY2FsX21hcFtyb3dbMF1dLnB1c2gocm93WzFdKTtcbiAgICAgIHJlc3VsdC5yYWRpY2FsX3RvX2luZGV4X21hcFtyb3dbMV1dID0gcm93WzBdO1xuICAgICAgaWYgKHJvd1syXSA9PT0gJ1InICYmIHJvd1szXS5pbmRleE9mKGxvY2FsZSkgPj0gMCkge1xuICAgICAgICByZXN1bHQucHJpbWFyeV9yYWRpY2FsW3Jvd1swXV0gPSByb3dbMV07XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vLyBPdXRwdXQ6IFByb21pc2UgdGhhdCBmaWxscyByZXN1bHQgd2l0aCBhIG1hcCBmcm9tIFVuaWNvZGUgcmFkaWNhbC1jb2RlYmxvY2tcbi8vIGNoYXJhY3RlciAtPiBlcXVpdmFsZW50IFVuaWNvZGUgQ0pLLWNvZGVibG9jayAoaG9wZWZ1bGx5LCBHQjIzMTIpIGNoYXJhY3Rlci5cbi8vIFRoZXJlIG1heSBiZSBVbmljb2RlIHJhZGljYWwgY2hhcmFjdGVycyB3aXRob3V0IGEgQ0pLIGVxdWl2YWxlbnQuXG5jb25zdCBmaWxsUmFkaWNhbFRvQ2hhcmFjdGVyTWFwID1cbiAgICAobG9jYWxlLCByYWRpY2FsX2VxdWl2YWxlbnRfY2hhcmFjdGVycywgcmVzdWx0KSA9PiB7XG4gIHJldHVybiByYWRpY2FsX2VxdWl2YWxlbnRfY2hhcmFjdGVycy50aGVuKChyb3dzKSA9PiB7XG4gICAgcm93cy5maWx0ZXIoKHJvdykgPT4gcm93WzJdLmluZGV4T2YobG9jYWxlKSA+PSAwKVxuICAgICAgICAubWFwKChyb3cpID0+IHJlc3VsdFtyb3dbMF1dID0gcm93WzFdKTtcbiAgfSk7XG59XG5cbi8vIE91dHB1dDogUHJvbWlzZSB0aGF0IGZpbGxzIHRoZSB0d28gbWFwcyB3aXRoIHBvaW50ZXJzIGZyb20gYSBnaXZlbiBjaGFyYWN0ZXJcbi8vIHRvIGl0cyBzaW1wbGlmaWVkIGFuZCB0cmFkaXRpb25hbCB2YXJpYW50cy5cbmNvbnN0IGZpbGxWYXJpYW50cyA9IChzaW1wbGlmaWVkLCB0cmFkaXRpb25hbCwgdmFyaWFudHMpID0+IHtcbiAgcmV0dXJuIHZhcmlhbnRzLnRoZW4oKHJvd3MpID0+IHtcbiAgICByb3dzLm1hcCgocm93KSA9PiB7XG4gICAgICBpZiAoKHJvd1sxXSAhPT0gJ2tTaW1wbGlmaWVkVmFyaWFudCcgJiZcbiAgICAgICAgICAgcm93WzFdICE9PSAna1RyYWRpdGlvbmFsVmFyaWFudCcpIHx8XG4gICAgICAgICAgcm93WzBdID09PSByb3dbMl0gfHwgcm93WzBdID09PSAnVSsyQjVCOCcpIHtcbiAgICAgICAgLy8gVW5pY29kZSBpbnRyb2R1Y2VkIGFuIGV4dHJhIGNoYXJhY3RlciBVKzJCNUI4IG1hdGNoaW5nIFUrNjEzRi5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IHNvdXJjZSA9IHBhcnNlVW5pY29kZVN0cihyb3dbMF0pO1xuICAgICAgbGV0IHRhcmdldCA9IHBhcnNlVW5pY29kZVN0cihyb3dbMl0pO1xuICAgICAgY29uc3Qgc3BsaXQgPSByb3dbMl0uc3BsaXQoJyAnKTtcbiAgICAgIC8vIEEgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaGF2ZSBtdWx0aXBsZSBzaW1wbGlmaWVkIHZhcmlhbnRzLiBPZiB0aGVzZSxcbiAgICAgIC8vIHdlIHNob3VsZCBvbmx5IHVzZSBvbmUgb2YgdGhlbSwgdXN1YWxseSB0aGUgZmlyc3QsIGJ1dCBpbiB0aHJlZSBjYXNlcyxcbiAgICAgIC8vIHRoZSBzZWNvbmQuXG4gICAgICBpZiAoc3BsaXQubGVuZ3RoID09PSAyICYmXG4gICAgICAgICAgWydVKzkzN0UnLCAnVSs5NDlGJywgJ1UrOTkxOCddLmluZGV4T2Yocm93WzBdKSA+PSAwKSB7XG4gICAgICAgIHRhcmdldCA9IHBhcnNlVW5pY29kZVN0cihzcGxpdFsxXSk7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlID09PSB0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChyb3dbMV0gPT09ICdrVHJhZGl0aW9uYWxWYXJpYW50Jykge1xuICAgICAgICBjb25zdCBzd2FwID0gdGFyZ2V0O1xuICAgICAgICB0YXJnZXQgPSBzb3VyY2U7XG4gICAgICAgIHNvdXJjZSA9IHN3YXA7XG4gICAgICB9XG4gICAgICAvLyBUaGUgbWFwcGluZyBmcm9tIHRyYWRpdGlvbmFsIGNoYXJhY3RlcnMgdG8gc2ltcGxpZmllZCBjaGFyYWN0ZXJzIGlzXG4gICAgICAvLyBtYW55IHRvIG9uZSwgc28gd2UgY2FuIG9ubHkgYXNzZXJ0IHRoYXQgc2ltcGxpZmllZFtzb3VyY2VdIGlzIHVuaXF1ZS5cbiAgICAgIGFzc2VydCghc2ltcGxpZmllZFtzb3VyY2VdIHx8IHNpbXBsaWZpZWRbc291cmNlXSA9PT0gdGFyZ2V0KTtcbiAgICAgIHNpbXBsaWZpZWRbc291cmNlXSA9IHRhcmdldDtcbiAgICAgIHRyYWRpdGlvbmFsW3RhcmdldF0gPSBfLnVuaXF1ZShcbiAgICAgICAgICAodHJhZGl0aW9uYWxbdGFyZ2V0XSB8fCBbXSkuY29uY2F0KFtzb3VyY2VdKSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vLyBHaXZlbiB0aGUgZGF0YSBmcm9tIHRoZSBHQjIzMTIgZGF0YSBmaWxlLCBmaWxscyB0aGUgR0IyMzEyIHJlc3VsdCBtYXAuXG5jb25zdCBmaWxsR0IyMzEyID0gKGRhdGEsIHJlc3VsdCkgPT4ge1xuICBBcnJheS5mcm9tKGRhdGEpLm1hcCgoY2hhcmFjdGVyKSA9PiB7XG4gICAgaWYgKGNoYXJhY3RlciA9PT0gJ1xcbicpIHJldHVybjtcbiAgICBhc3NlcnQoY2hhcmFjdGVyLmxlbmd0aCA9PT0gMSk7XG4gICAgY29uc3QgY29kZXBvaW50ID0gY2hhcmFjdGVyLmNvZGVQb2ludEF0KDApO1xuICAgIGFzc2VydCgweDRlMDAgPD0gY29kZXBvaW50ICYmIGNvZGVwb2ludCA8PSAweDlmZmYpO1xuICAgIHJlc3VsdFtjaGFyYWN0ZXJdID0gdHJ1ZTtcbiAgfSk7XG4gIGFzc2VydChPYmplY3Qua2V5cyhyZXN1bHQpLmxlbmd0aCA9PT0gNjc2Myk7XG59XG5cbi8vIEdpdmVuIHRoZSByb3dzIG9mIHRoZSBsb2NhbGUtY2hhcmFjdGVyIG1hcCBmcm9tIHRoZSBjamtsaWIgZGF0YSwgcmV0dXJucyBhXG4vLyBtYXBwaW5nIGZyb20gY2hhcmFjdGVycyB0byB0aGUgYXBwcm9wcmlhdGUgZ2x5cGggaW4gdGhhdCBsb2NhbGUuXG5jb25zdCBwYXJzZUxvY2FsZUdseXBoTWFwID0gKGxvY2FsZSwgcm93cykgPT4ge1xuICBjb25zdCByZXN1bHQgPSB7fTtcbiAgcm93cy5maWx0ZXIoKHJvdykgPT4gcm93WzJdLmluZGV4T2YobG9jYWxlKSA+PSAwKVxuICAgICAgLm1hcCgocm93KSA9PiByZXN1bHRbcm93WzBdXSA9IHBhcnNlSW50KHJvd1sxXSwgMTApKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gTWV0aG9kcyB1c2VkIGZvciBmaW5hbCBwb3N0LXByb2Nlc3Npbmcgb2YgdGhlIGxvYWRlZCBkYXRhc2V0cy5cblxuY29uc3QgY2xlYW51cENKS0xpYkRhdGEgPSAoKSA9PiB7XG4gIGNvbnN0IGNoYXJhY3RlcnMgPSBjamtsaWIuY2hhcmFjdGVycztcbiAgY29uc3QgcmFkaWNhbHMgPSBjamtsaWIucmFkaWNhbHM7XG4gIGNvbnN0IGNvbnZlcnRfYXN0cmFsX2NoYXJhY3RlcnMgPSAoeCkgPT4geC5sZW5ndGggPT09IDEgPyB4IDogJ++8nydcbiAgY29uc3QgcmFkaWNhbF90b19jaGFyYWN0ZXIgPSAoeCkgPT4gcmFkaWNhbHMucmFkaWNhbF90b19jaGFyYWN0ZXJfbWFwW3hdIHx8IHg7XG4gIE9iamVjdC5rZXlzKGNoYXJhY3RlcnMuZGVjb21wb3NpdGlvbikubWFwKChjaGFyYWN0ZXIpID0+IHtcbiAgICAvLyBDb252ZXJ0IGFueSAnYXN0cmFsIGNoYXJhY3RlcnMnIC0gdGhhdCBpcywgY2hhcmFjdGVycyBvdXRzaWRlIHRoZSBCYXNpY1xuICAgIC8vIE11bHRpbGluZ3VhbCBQbGFuZSAtIHRvIHdpZGUgcXVlc3Rpb24gbWFya3MgYW5kIHJlcGxhY2UgcmFkaWNhbHMgd2l0aCBhblxuICAgIC8vIGVxdWl2YWxlbnQgY2hhcmFjdGVyIHdpdGggdGhhdCBjaGFyYWN0ZXIuXG4gICAgY29uc3QgZGVjb21wb3NpdGlvbiA9IGNoYXJhY3RlcnMuZGVjb21wb3NpdGlvbltjaGFyYWN0ZXJdO1xuICAgIGNoYXJhY3RlcnMuZGVjb21wb3NpdGlvbltjaGFyYWN0ZXJdID1cbiAgICAgICAgQXJyYXkuZnJvbShkZWNvbXBvc2l0aW9uKS5tYXAoY29udmVydF9hc3RyYWxfY2hhcmFjdGVycylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAocmFkaWNhbF90b19jaGFyYWN0ZXIpLmpvaW4oJycpO1xuICB9KTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPD0gMjE0OyBpKyspIHtcbiAgICAvLyBBbGwgcHJpbWFyeSByYWRpY2FscyBzaG91bGQgaGF2ZSBhbiBlcXVpdmFsZW50IGNoYXJhY3RlciBmb3JtLlxuICAgIGNvbnN0IHByaW1hcnkgPSByYWRpY2Fscy5wcmltYXJ5X3JhZGljYWxbaV07XG4gICAgYXNzZXJ0KHJhZGljYWxzLnJhZGljYWxfdG9fY2hhcmFjdGVyX21hcC5oYXNPd25Qcm9wZXJ0eShwcmltYXJ5KSk7XG4gICAgcmFkaWNhbHMucHJpbWFyeV9yYWRpY2FsW2ldID0gcmFkaWNhbHMucmFkaWNhbF90b19jaGFyYWN0ZXJfbWFwW3ByaW1hcnldO1xuICAgIHJhZGljYWxzLmluZGV4X3RvX3JhZGljYWxfbWFwW2ldID1cbiAgICAgICAgcmFkaWNhbHMuaW5kZXhfdG9fcmFkaWNhbF9tYXBbaV0ubWFwKHJhZGljYWxfdG9fY2hhcmFjdGVyKS51bmlxdWUoKTtcbiAgfVxuICBPYmplY3Qua2V5cyhyYWRpY2Fscy5yYWRpY2FsX3RvX2luZGV4X21hcCkubWFwKChyYWRpY2FsKSA9PiB7XG4gICAgY29uc3QgY2hhcmFjdGVyID0gcmFkaWNhbF90b19jaGFyYWN0ZXIocmFkaWNhbCk7XG4gICAgaWYgKGNoYXJhY3RlciAhPT0gcmFkaWNhbCkge1xuICAgICAgcmFkaWNhbHMucmFkaWNhbF90b19pbmRleF9tYXBbY2hhcmFjdGVyXSA9XG4gICAgICAgICAgcmFkaWNhbHMucmFkaWNhbF90b19pbmRleF9tYXBbcmFkaWNhbF07XG4gICAgICBkZWxldGUgcmFkaWNhbHMucmFkaWNhbF90b19pbmRleF9tYXBbcmFkaWNhbF07XG4gICAgfVxuICB9KTtcbiAgZGVsZXRlIHJhZGljYWxzLnJhZGljYWxfdG9fY2hhcmFjdGVyX21hcDtcbn1cblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAvLyBjamtsaWIgZGF0YWJhc2UgZGF0YS5cbiAgY29uc3QgbG9jYWxlID0gJ0MnO1xuICBjb25zdCBkZWNvbXBvc2l0aW9uID1cbiAgICAgIHJlYWRGaWxlKCdjamtsaWIvY2hhcmFjdGVyZGVjb21wb3NpdGlvbi5jc3YnKS50aGVuKGdldENKS0xpYlJvd3MpO1xuICBjb25zdCBnbHlwaHMgPSByZWFkRmlsZSgnY2prbGliL2xvY2FsZWNoYXJhY3RlcmdseXBoLmNzdicpXG4gICAgICAgICAgICAgICAgICAgICAudGhlbihnZXRDSktMaWJSb3dzKVxuICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocGFyc2VMb2NhbGVHbHlwaE1hcC5iaW5kKG51bGwsIGxvY2FsZSkpO1xuICBjb25zdCByYWRpY2FscyA9IHJlYWRGaWxlKCdjamtsaWIva2FuZ3hpcmFkaWNhbC5jc3YnKS50aGVuKGdldENKS0xpYlJvd3MpO1xuICBjb25zdCByYWRpY2FsX2VxdWl2YWxlbnRfY2hhcmFjdGVycyA9XG4gICAgICByZWFkRmlsZSgnY2prbGliL3JhZGljYWxlcXVpdmFsZW50Y2hhcmFjdGVyLmNzdicpLnRoZW4oZ2V0Q0pLTGliUm93cyk7XG4gIGNvbnN0IHJhZGljYWxfaXNvbGF0ZWRfY2hhcmFjdGVycyA9XG4gICAgICByZWFkRmlsZSgnY2prbGliL2thbmd4aXJhZGljYWxpc29sYXRlZGNoYXJhY3Rlci5jc3YnKS50aGVuKGdldENKS0xpYlJvd3MpO1xuXG4gIC8vIEp1biBEYSdzIGNoYXJhY3RlciBmcmVxdWVuY3kgZGF0YSwgdXNlZCBvbmx5IGZvciBwcmlvcml0aXphdGlvbi5cbiAgY29uc3QgZnJlcXVlbmNpZXMgPSByZWFkRmlsZSgnanVuZGEvY2hhcmFjdGVyX2ZyZXF1ZW5jeS50c3YnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihnZXRGcmVxdWVuY3lSb3dzKTtcblxuICAvLyBVbmloYW4gZGF0YWJhc2UgZGF0YS5cbiAgY29uc3QgZGljdGlvbmFyeV9saWtlX2RhdGEgPVxuICAgICAgcmVhZEZpbGUoJ3VuaWhhbi9VbmloYW5fRGljdGlvbmFyeUxpa2VEYXRhLnR4dCcpLnRoZW4oZ2V0VW5paGFuUm93cyk7XG4gIGNvbnN0IHJhZGljYWxfc3Ryb2tlX2NvdW50cyA9XG4gICAgICByZWFkRmlsZSgndW5paGFuL1VuaWhhbl9SYWRpY2FsU3Ryb2tlQ291bnRzLnR4dCcpLnRoZW4oZ2V0VW5paGFuUm93cyk7XG4gIGNvbnN0IHJlYWRpbmdzID0gcmVhZEZpbGUoJ3VuaWhhbi9VbmloYW5fUmVhZGluZ3MudHh0JykudGhlbihnZXRVbmloYW5Sb3dzKTtcbiAgY29uc3QgdmFyaWFudHMgPSByZWFkRmlsZSgndW5paGFuL1VuaWhhbl9WYXJpYW50cy50eHQnKS50aGVuKGdldFVuaWhhblJvd3MpO1xuXG4gIGNqa2xpYi5wcm9taXNlID0gUHJvbWlzZS5hbGwoW1xuICAgICAgLy8gUGVyLWNoYXJhY3RlciBkYXRhLlxuICAgICAgZmlsbERlY29tcG9zaXRpb25zKGRlY29tcG9zaXRpb24sIGdseXBocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjamtsaWIuY2hhcmFjdGVycy5kZWNvbXBvc2l0aW9uKSxcbiAgICAgIGZpbGxEZWZpbml0aW9ucyhyZWFkaW5ncywgY2prbGliLmNoYXJhY3RlcnMuZGVmaW5pdGlvbiksXG4gICAgICBmaWxsRnJlcXVlbmNpZXMoZnJlcXVlbmNpZXMsIGNqa2xpYi5jaGFyYWN0ZXJzLmZyZXF1ZW5jeSksXG4gICAgICBmaWxsS2FuZ3hpSW5kZXgocmFkaWNhbF9zdHJva2VfY291bnRzLCBjamtsaWIuY2hhcmFjdGVycy5rYW5neGlfaW5kZXgpLFxuICAgICAgZmlsbFBpbnlpbihyZWFkaW5ncywgY2prbGliLmNoYXJhY3RlcnMucGlueWluKSxcbiAgICAgIGZpbGxTdHJva2VDb3VudHMoZGljdGlvbmFyeV9saWtlX2RhdGEsIGNqa2xpYi5jaGFyYWN0ZXJzLnN0cm9rZXMpLFxuICAgICAgLy8gUGVyLXJhZGljYWwgZGF0YS5cbiAgICAgIGZpbGxSYWRpY2FsRGF0YShsb2NhbGUsIHJhZGljYWxzLCBjamtsaWIucmFkaWNhbHMpLFxuICAgICAgZmlsbFJhZGljYWxEYXRhKGxvY2FsZSwgcmFkaWNhbF9pc29sYXRlZF9jaGFyYWN0ZXJzLCBjamtsaWIucmFkaWNhbHMpLFxuICAgICAgZmlsbFJhZGljYWxUb0NoYXJhY3Rlck1hcChsb2NhbGUsIHJhZGljYWxfZXF1aXZhbGVudF9jaGFyYWN0ZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjamtsaWIucmFkaWNhbHMucmFkaWNhbF90b19jaGFyYWN0ZXJfbWFwKSxcbiAgICAgIGZpbGxWYXJpYW50cyhjamtsaWIuY2hhcmFjdGVycy5zaW1wbGlmaWVkLFxuICAgICAgICAgICAgICAgICAgIGNqa2xpYi5jaGFyYWN0ZXJzLnRyYWRpdGlvbmFsLCB2YXJpYW50cyksXG4gICAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIGNoYXJhY3RlcnMgaW4gdGhlIEdCMjMxMiBjaGFyYWN0ZXIgc2V0LlxuICAgICAgcmVhZEZpbGUoJ2diMjMxMicpLnRoZW4oKGRhdGEpID0+IGZpbGxHQjIzMTIoZGF0YSwgY2prbGliLmdiMjMxMikpLFxuICBdKS50aGVuKGNsZWFudXBDSktMaWJEYXRhKTtcbiAgY2prbGliLnByb21pc2UuY2F0Y2goY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUpKTtcbn0pO1xuXG5leHBvcnQge2Nqa2xpYn07XG4iLCJpbXBvcnQge05FVVJBTF9ORVRfVFJBSU5FRF9GT1JfU1RST0tFX0VYVFJBQ1RJT059IGZyb20gJy9saWIvbmV0JztcbmltcG9ydCB7c3Ryb2tlX2V4dHJhY3Rvcn0gZnJvbSAnL2xpYi9zdHJva2VfZXh0cmFjdG9yJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICBjb25zdCBpbnB1dCA9IG5ldyBjb252bmV0anMuVm9sKDEsIDEsIDggLyogZmVhdHVyZSB2ZWN0b3IgZGltZW5zaW9ucyAqLyk7XG4gIGNvbnN0IG5ldCA9IG5ldyBjb252bmV0anMuTmV0KCk7XG4gIG5ldC5mcm9tSlNPTihORVVSQUxfTkVUX1RSQUlORURfRk9SX1NUUk9LRV9FWFRSQUNUSU9OKTtcbiAgY29uc3Qgd2VpZ2h0ID0gMC44O1xuXG4gIGNvbnN0IHRyYWluZWRDbGFzc2lmaWVyID0gKGZlYXR1cmVzKSA9PiB7XG4gICAgaW5wdXQudyA9IGZlYXR1cmVzO1xuICAgIGNvbnN0IHNvZnRtYXggPSBuZXQuZm9yd2FyZChpbnB1dCkudztcbiAgICByZXR1cm4gc29mdG1heFsxXSAtIHNvZnRtYXhbMF07XG4gIH1cblxuICBzdHJva2VfZXh0cmFjdG9yLmNvbWJpbmVkQ2xhc3NpZmllciA9IChmZWF0dXJlcykgPT4ge1xuICAgIHJldHVybiBzdHJva2VfZXh0cmFjdG9yLmhhbmRUdW5lZENsYXNzaWZpZXIoZmVhdHVyZXMpICtcbiAgICAgICAgICAgd2VpZ2h0KnRyYWluZWRDbGFzc2lmaWVyKGZlYXR1cmVzKTtcbiAgfVxufSk7XG4iLCJpbXBvcnQge2Fzc2VydH0gZnJvbSAnL2xpYi9iYXNlJztcblxuY29uc3QgZGVjb21wb3NpdGlvbl91dGlsID0ge307XG5cbmRlY29tcG9zaXRpb25fdXRpbC5pZHNfZGF0YSA9IHtcbiAgJ+K/sCc6IHtsYWJlbDogJ0xlZnQtdG8tcmlnaHQnLCBhcml0eTogMn0sXG4gICfiv7EnOiB7bGFiZWw6ICdUb3AtdG8tYm90dG9tJywgYXJpdHk6IDJ9LFxuICAn4r+0Jzoge2xhYmVsOiAnU3Vycm91bmQnLCBhcml0eTogMn0sXG4gICfiv7UnOiB7bGFiZWw6ICdTdXJyb3VuZC1mcm9tLWFib3ZlJywgYXJpdHk6IDJ9LFxuICAn4r+2Jzoge2xhYmVsOiAnU3Vycm91bmQtZnJvbS1iZWxvdycsIGFyaXR5OiAyfSxcbiAgJ+K/tyc6IHtsYWJlbDogJ1N1cnJvdW5kLWZyb20tbGVmdCcsIGFyaXR5OiAyfSxcbiAgJ+K/uCc6IHtsYWJlbDogJ1N1cnJvdW5kLWZyb20tdXBwZXItbGVmdCcsIGFyaXR5OiAyfSxcbiAgJ+K/uSc6IHtsYWJlbDogJ1N1cnJvdW5kLWZyb20tdXBwZXItcmlnaHQnLCBhcml0eTogMn0sXG4gICfiv7onOiB7bGFiZWw6ICdTdXJyb3VuZC1mcm9tLWxvd2VyLWxlZnQnLCBhcml0eTogMn0sXG4gICfiv7snOiB7bGFiZWw6ICdPdmVybGFpZCcsIGFyaXR5OiAyfSxcbiAgJ+K/syc6IHtsYWJlbDogJ1RvcC10by1taWRkbGUtdG8tYm90dG9tJywgYXJpdHk6IDN9LFxuICAn4r+yJzoge2xhYmVsOiAnTGVmdC10by1taWRkbGUtdG8tcmlnaHQnLCBhcml0eTogM30sXG59XG5kZWNvbXBvc2l0aW9uX3V0aWwuaWRlb2dyYXBoX2Rlc2NyaXB0aW9uX2NoYXJhY3RlcnMgPVxuICAgIE9iamVjdC5rZXlzKGRlY29tcG9zaXRpb25fdXRpbC5pZHNfZGF0YSk7XG5cbmNvbnN0IFVOS05PV05fQ09NUE9ORU5UID0gJ++8nyc7XG5cbmNvbnN0IGF1Z21lbnRUcmVlV2l0aFBhdGhEYXRhID0gKHRyZWUsIHBhdGgpID0+IHtcbiAgdHJlZS5wYXRoID0gcGF0aDtcbiAgY29uc3QgY2hpbGRyZW4gPSAodHJlZS5jaGlsZHJlbiB8fCBbXSkubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuOyBpKyspIHtcbiAgICBhdWdtZW50VHJlZVdpdGhQYXRoRGF0YSh0cmVlLmNoaWxkcmVuW2ldLCBwYXRoLmNvbmNhdChbaV0pKTtcbiAgfVxuICByZXR1cm4gdHJlZTtcbn1cblxuY29uc3QgcGFyc2VTdWJ0cmVlID0gKGRlY29tcG9zaXRpb24sIGluZGV4KSA9PiB7XG4gIGFzc2VydChpbmRleFswXSA8IGRlY29tcG9zaXRpb24ubGVuZ3RoLFxuICAgICAgICAgYE5vdCBlbm91Z2ggY2hhcmFjdGVycyBpbiAke2RlY29tcG9zaXRpb259LmApO1xuICBjb25zdCBjdXJyZW50ID0gZGVjb21wb3NpdGlvbltpbmRleFswXV07XG4gIGluZGV4WzBdICs9IDE7XG4gIGlmIChkZWNvbXBvc2l0aW9uX3V0aWwuaWRzX2RhdGEuaGFzT3duUHJvcGVydHkoY3VycmVudCkpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7dHlwZTogJ2NvbXBvdW5kJywgdmFsdWU6IGN1cnJlbnQsIGNoaWxkcmVuOiBbXX07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWNvbXBvc2l0aW9uX3V0aWwuaWRzX2RhdGFbY3VycmVudF0uYXJpdHk7IGkrKykge1xuICAgICAgcmVzdWx0LmNoaWxkcmVuLnB1c2gocGFyc2VTdWJ0cmVlKGRlY29tcG9zaXRpb24sIGluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gZWxzZSBpZiAoY3VycmVudCA9PT0gVU5LTk9XTl9DT01QT05FTlQpIHtcbiAgICByZXR1cm4ge3R5cGU6ICdjaGFyYWN0ZXInLCB2YWx1ZTogJz8nfTtcbiAgfVxuICAvLyBDaGFyYWN0ZXJzIG1heSBiZSBmb2xsb3dlZCBieSBhIFt4XSBhbm5vdGF0aW9uIHRoYXQgcmVjb3JkcyB3aGljaCB2YXJpYW50XG4gIC8vIG9mIHRoZSBjaGFyYWN0ZXIgdG8gdXNlIGF0IHRoYXQgcG9zaXRpb24uIFdlIGlnbm9yZSB0aGVzZSBhbm5vdGF0aW9ucy5cbiAgaWYgKGRlY29tcG9zaXRpb25baW5kZXhbMF1dID09PSAnWycpIHtcbiAgICBhc3NlcnQoJzAxMjM0NTY3ODknLmluZGV4T2YoZGVjb21wb3NpdGlvbltpbmRleFswXSArIDFdKSA+PSAwKTtcbiAgICBhc3NlcnQoZGVjb21wb3NpdGlvbltpbmRleFswXSArIDJdID09PSAnXScpO1xuICAgIGluZGV4WzBdICs9IDM7XG4gIH1cbiAgcmV0dXJuIHt0eXBlOiAnY2hhcmFjdGVyJywgdmFsdWU6IGN1cnJlbnR9O1xufVxuXG5jb25zdCBzZXJpYWxpemVTdWJ0cmVlID0gKHN1YnRyZWUsIHJlc3VsdCkgPT4ge1xuICByZXN1bHRbMF0gKz0gc3VidHJlZS52YWx1ZSA9PT0gJz8nID8gVU5LTk9XTl9DT01QT05FTlQgOiBzdWJ0cmVlLnZhbHVlO1xuICBjb25zdCBjaGlsZHJlbiA9IHN1YnRyZWUuY2hpbGRyZW4gPyBzdWJ0cmVlLmNoaWxkcmVuLmxlbmd0aCA6IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW47IGkrKykge1xuICAgIHNlcmlhbGl6ZVN1YnRyZWUoc3VidHJlZS5jaGlsZHJlbltpXSwgcmVzdWx0KTtcbiAgfVxufVxuXG5kZWNvbXBvc2l0aW9uX3V0aWwuY29sbGVjdENvbXBvbmVudHMgPSAodHJlZSwgcmVzdWx0KSA9PiB7XG4gIHJlc3VsdCA9IHJlc3VsdCB8fCBbXTtcbiAgaWYgKHRyZWUudHlwZSA9PT0gJ2NoYXJhY3RlcicgJiYgdHJlZS52YWx1ZSAhPT0gJz8nKSB7XG4gICAgcmVzdWx0LnB1c2godHJlZS52YWx1ZSk7XG4gIH1cbiAgZm9yIChsZXQgY2hpbGQgb2YgdHJlZS5jaGlsZHJlbiB8fCBbXSkge1xuICAgIGRlY29tcG9zaXRpb25fdXRpbC5jb2xsZWN0Q29tcG9uZW50cyhjaGlsZCwgcmVzdWx0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5kZWNvbXBvc2l0aW9uX3V0aWwuY29udmVydERlY29tcG9zaXRpb25Ub1RyZWUgPSAoZGVjb21wb3NpdGlvbikgPT4ge1xuICBjb25zdCBpbmRleCA9IFswXTtcbiAgZGVjb21wb3NpdGlvbiA9IGRlY29tcG9zaXRpb24gfHwgVU5LTk9XTl9DT01QT05FTlQ7XG4gIGNvbnN0IHJlc3VsdCA9IHBhcnNlU3VidHJlZShkZWNvbXBvc2l0aW9uLCBpbmRleCk7XG4gIGFzc2VydChpbmRleFswXSA9PT0gZGVjb21wb3NpdGlvbi5sZW5ndGgsXG4gICAgICAgICBgVG9vIG1hbnkgY2hhcmFjdGVycyBpbiAke2RlY29tcG9zaXRpb259LmApO1xuICByZXR1cm4gYXVnbWVudFRyZWVXaXRoUGF0aERhdGEocmVzdWx0LCBbXSk7XG59XG5cbmRlY29tcG9zaXRpb25fdXRpbC5jb252ZXJ0VHJlZVRvRGVjb21wb3NpdGlvbiA9ICh0cmVlKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IFsnJ107XG4gIHNlcmlhbGl6ZVN1YnRyZWUodHJlZSwgcmVzdWx0KTtcbiAgcmV0dXJuIHJlc3VsdFswXTtcbn1cblxuZGVjb21wb3NpdGlvbl91dGlsLmdldFN1YnRyZWUgPSAodHJlZSwgcGF0aCkgPT4ge1xuICBsZXQgc3VidHJlZSA9IHRyZWU7XG4gIGZvciAobGV0IGluZGV4IG9mIHBhdGgpIHtcbiAgICBhc3NlcnQoMCA8PSBpbmRleCAmJiBpbmRleCA8IHN1YnRyZWUuY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICBzdWJ0cmVlID0gc3VidHJlZS5jaGlsZHJlbltpbmRleF07XG4gIH1cbiAgcmV0dXJuIHN1YnRyZWU7XG59XG5cbmV4cG9ydCB7ZGVjb21wb3NpdGlvbl91dGlsfTtcbiIsImltcG9ydCB7YXNzZXJ0fSBmcm9tICcvbGliL2Jhc2UnO1xuaW1wb3J0IHtjamtsaWJ9IGZyb20gJy9saWIvY2prbGliJztcblxuY29uc3QgZGVmYXVsdEdseXBoID0gKGNoYXJhY3RlcikgPT4ge1xuICBpZiAoIWNoYXJhY3RlcikgcmV0dXJuO1xuICBhc3NlcnQoY2hhcmFjdGVyLmxlbmd0aCA9PT0gMSk7XG4gIGNvbnN0IGRhdGEgPSBjamtsaWIuZ2V0Q2hhcmFjdGVyRGF0YShjaGFyYWN0ZXIpO1xuICBjb25zdCByZXN1bHQgPSB7XG4gICAgY2hhcmFjdGVyOiBjaGFyYWN0ZXIsXG4gICAgY29kZXBvaW50OiBjaGFyYWN0ZXIuY29kZVBvaW50QXQoMCksXG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIGZyZXF1ZW5jeTogZGF0YS5mcmVxdWVuY3ksXG4gICAgICBrYW5neGlfaW5kZXg6IGRhdGEua2FuZ3hpX2luZGV4LFxuICAgIH0sXG4gICAgc3RhZ2VzOiB7fSxcbiAgICBzaW1wbGlmaWVkOiBkYXRhLnNpbXBsaWZpZWQsXG4gICAgdHJhZGl0aW9uYWw6IGRhdGEudHJhZGl0aW9uYWwsXG4gIH1cbiAgaWYgKGRhdGEuc2ltcGxpZmllZCkge1xuICAgIGNvbnN0IGdseXBoID0gR2x5cGhzLmdldChkYXRhLnNpbXBsaWZpZWQpO1xuICAgIGNvbnN0IGJhc2UgPSBjamtsaWIuZ2V0Q2hhcmFjdGVyRGF0YShkYXRhLnNpbXBsaWZpZWQpO1xuICAgIGlmIChnbHlwaC5zdGFnZXMudmVyaWZpZWQpIHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2x5cGgubWV0YWRhdGE7XG4gICAgICByZXN1bHQubWV0YWRhdGEuZGVmaW5pdGlvbiA9IG1ldGFkYXRhLmRlZmluaXRpb24gfHwgYmFzZS5kZWZpbml0aW9uO1xuICAgICAgcmVzdWx0Lm1ldGFkYXRhLnBpbnlpbiA9IG1ldGFkYXRhLnBpbnlpbiB8fCBiYXNlLnBpbnlpbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3QgR2x5cGhzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2dseXBocycpO1xuY29uc3QgUHJvZ3Jlc3MgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbigncHJvZ3Jlc3MnKTtcblxuR2x5cGhzLmNsZWFyRGVwZW5kZW5jaWVzID0gKGNoYXJhY3RlcikgPT4ge1xuICBjb25zdCBzdGFjayA9IFtjaGFyYWN0ZXJdO1xuICBjb25zdCB2aXNpdGVkID0ge307XG4gIHZpc2l0ZWRbY2hhcmFjdGVyXSA9IHRydWU7XG4gIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHN0YWNrLnBvcCgpO1xuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IEdseXBocy5maW5kKHtcbiAgICAgICdzdGFnZXMuYW5hbHlzaXMuZGVjb21wb3NpdGlvbic6IHskcmVnZXg6IGAuKiR7Y3VycmVudH0uKmB9LFxuICAgICAgJ3N0YWdlcy5vcmRlcic6IHskbmU6IG51bGx9LFxuICAgIH0sIHtjaGFyYWN0ZXI6IDF9KS5mZXRjaCgpO1xuICAgIGRlcGVuZGVuY2llcy5tYXAoKHgpID0+IHguY2hhcmFjdGVyKS5maWx0ZXIoKHgpID0+ICF2aXNpdGVkW3hdKS5tYXAoKHgpID0+IHtcbiAgICAgIHN0YWNrLnB1c2goeCk7XG4gICAgICB2aXNpdGVkW3hdID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuICBkZWxldGUgdmlzaXRlZFtjaGFyYWN0ZXJdO1xuICBHbHlwaHMudXBkYXRlKHtjaGFyYWN0ZXI6IHskaW46IE9iamVjdC5rZXlzKHZpc2l0ZWQpfX0sXG4gICAgICAgICAgICAgICAgeyRzZXQ6IHsnc3RhZ2VzLm9yZGVyJzogbnVsbCwgJ3N0YWdlcy52ZXJpZmllZCc6IG51bGx9fSxcbiAgICAgICAgICAgICAgICB7bXVsdGk6IHRydWV9KTtcbn1cblxuR2x5cGhzLmdldCA9IChjaGFyYWN0ZXIpID0+XG4gICAgR2x5cGhzLmZpbmRPbmUoe2NoYXJhY3RlcjogY2hhcmFjdGVyfSkgfHwgZGVmYXVsdEdseXBoKGNoYXJhY3Rlcik7XG5cbkdseXBocy5nZXRBbGwgPSAoY2hhcmFjdGVycykgPT4gR2x5cGhzLmZpbmQoe2NoYXJhY3RlcjogeyRpbjogY2hhcmFjdGVyc319KTtcblxuR2x5cGhzLmdldE5leHQgPSAoZ2x5cGgsIGNsYXVzZSkgPT4ge1xuICBjbGF1c2UgPSBjbGF1c2UgfHwge307XG4gIGNvbnN0IGNvZGVwb2ludCA9IGdseXBoID8gZ2x5cGguY29kZXBvaW50IDogdW5kZWZpbmVkO1xuICBjb25zdCBjb25kaXRpb24gPSBfLmV4dGVuZCh7Y29kZXBvaW50OiB7JGd0OiBjb2RlcG9pbnR9fSwgY2xhdXNlKTtcbiAgY29uc3QgbmV4dCA9IEdseXBocy5maW5kT25lKGNvbmRpdGlvbiwge3NvcnQ6IHtjb2RlcG9pbnQ6IDF9fSk7XG4gIHJldHVybiBuZXh0ID8gbmV4dCA6IEdseXBocy5maW5kT25lKGNsYXVzZSwge3NvcnQ6IHtjb2RlcG9pbnQ6IDF9fSk7XG59XG5cbkdseXBocy5nZXROZXh0VW52ZXJpZmllZCA9IChnbHlwaCkgPT4ge1xuICByZXR1cm4gR2x5cGhzLmdldE5leHQoZ2x5cGgsIHsnc3RhZ2VzLnZlcmlmaWVkJzogbnVsbH0pO1xufVxuXG5HbHlwaHMuZ2V0TmV4dFZlcmlmaWVkID0gKGdseXBoKSA9PiB7XG4gIHJldHVybiBHbHlwaHMuZ2V0TmV4dChnbHlwaCwgeydzdGFnZXMudmVyaWZpZWQnOiB7JG5lOiBudWxsfX0pO1xufVxuXG5HbHlwaHMuZ2V0UHJldmlvdXMgPSAoZ2x5cGgsIGNsYXVzZSkgPT4ge1xuICBjbGF1c2UgPSBjbGF1c2UgfHwge307XG4gIGNvbnN0IGNvZGVwb2ludCA9IGdseXBoID8gZ2x5cGguY29kZXBvaW50IDogdW5kZWZpbmVkO1xuICBjb25zdCBjb25kaXRpb24gPSBfLmV4dGVuZCh7Y29kZXBvaW50OiB7JGx0OiBjb2RlcG9pbnR9fSwgY2xhdXNlKTtcbiAgY29uc3QgcHJldmlvdXMgPSBHbHlwaHMuZmluZE9uZShjb25kaXRpb24sIHtzb3J0OiB7Y29kZXBvaW50OiAtMX19KTtcbiAgcmV0dXJuIHByZXZpb3VzID8gcHJldmlvdXMgOiBHbHlwaHMuZmluZE9uZShjbGF1c2UsIHtzb3J0OiB7Y29kZXBvaW50OiAtMX19KTtcbn1cblxuR2x5cGhzLmdldFByZXZpb3VzVW52ZXJpZmllZCA9IChnbHlwaCkgPT4ge1xuICByZXR1cm4gR2x5cGhzLmdldFByZXZpb3VzKGdseXBoLCB7J3N0YWdlcy52ZXJpZmllZCc6IG51bGx9KTtcbn1cblxuR2x5cGhzLmdldFByZXZpb3VzVmVyaWZpZWQgPSAoZ2x5cGgpID0+IHtcbiAgcmV0dXJuIEdseXBocy5nZXRQcmV2aW91cyhnbHlwaCwgeydzdGFnZXMudmVyaWZpZWQnOiB7JG5lOiBudWxsfX0pO1xufVxuXG5HbHlwaHMubG9hZEFsbCA9IChjaGFyYWN0ZXJzKSA9PiB7XG4gIGZvciAobGV0IGNoYXJhY3RlciBvZiBjaGFyYWN0ZXJzKSB7XG4gICAgY29uc3QgZ2x5cGggPSBHbHlwaHMuZ2V0KGNoYXJhY3Rlcik7XG4gICAgaWYgKCFnbHlwaC5zdGFnZXMudmVyaWZpZWQpIHtcbiAgICAgIEdseXBocy51cHNlcnQoe2NoYXJhY3RlcjogZ2x5cGguY2hhcmFjdGVyfSwgZ2x5cGgpO1xuICAgIH1cbiAgfVxuICBQcm9ncmVzcy5yZWZyZXNoKCk7XG59XG5cbkdseXBocy5zYXZlID0gKGdseXBoKSA9PiB7XG4gIGNoZWNrKGdseXBoLmNoYXJhY3RlciwgU3RyaW5nKTtcbiAgYXNzZXJ0KGdseXBoLmNoYXJhY3Rlci5sZW5ndGggPT09IDEpO1xuICBjb25zdCBjdXJyZW50ID0gR2x5cGhzLmdldChnbHlwaC5jaGFyYWN0ZXIpO1xuICBpZiAoY3VycmVudCAmJiBjdXJyZW50LnN0YWdlcy52ZXJpZmllZCAmJiAhZ2x5cGguc3RhZ2VzLnZlcmlmaWVkKSB7XG4gICAgR2x5cGhzLmNsZWFyRGVwZW5kZW5jaWVzKGdseXBoLmNoYXJhY3Rlcik7XG4gIH1cbiAgR2x5cGhzLnN5bmNEZWZpbml0aW9uQW5kUGlueWluKGdseXBoKTtcbiAgaWYgKGdseXBoLnN0YWdlcy5wYXRoICYmICFnbHlwaC5zdGFnZXMucGF0aC5zZW50aW5lbCkge1xuICAgIEdseXBocy51cHNlcnQoe2NoYXJhY3RlcjogZ2x5cGguY2hhcmFjdGVyfSwgZ2x5cGgpO1xuICB9IGVsc2Uge1xuICAgIEdseXBocy5yZW1vdmUoe2NoYXJhY3RlcjogZ2x5cGguY2hhcmFjdGVyfSk7XG4gIH1cbiAgUHJvZ3Jlc3MucmVmcmVzaCgpO1xufVxuXG5HbHlwaHMuc3luY0RlZmluaXRpb25BbmRQaW55aW4gPSAoZ2x5cGgpID0+IHtcbiAgY29uc3QgZGF0YSA9IGNqa2xpYi5nZXRDaGFyYWN0ZXJEYXRhKGdseXBoLmNoYXJhY3Rlcik7XG4gIGNvbnN0IGJhc2UgPSBjamtsaWIuZ2V0Q2hhcmFjdGVyRGF0YShkYXRhLnNpbXBsaWZpZWQgfHwgZ2x5cGguY2hhcmFjdGVyKTtcbiAgY29uc3QgdGFyZ2V0cyA9IFtiYXNlLmNoYXJhY3Rlcl0uY29uY2F0KGJhc2UudHJhZGl0aW9uYWwpO1xuICBpZiAodGFyZ2V0cy5sZW5ndGggPT09IDEgfHwgJ+W5suS5iOedgOWkjScuaW5kZXhPZih0YXJnZXRzWzBdKSA+PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGRlZmluaXRpb24gPSBnbHlwaC5tZXRhZGF0YS5kZWZpbml0aW9uIHx8IGRhdGEuZGVmaW5pdGlvbjtcbiAgY29uc3QgcGlueWluID0gZ2x5cGgubWV0YWRhdGEucGlueWluIHx8IGRhdGEucGlueWluO1xuICBHbHlwaHMudXBkYXRlKHtjaGFyYWN0ZXI6IHskaW46IHRhcmdldHN9fSwgeyRzZXQ6IHtcbiAgICAnbWV0YWRhdGEuZGVmaW5pdGlvbic6IGRlZmluaXRpb24sXG4gICAgJ21ldGFkYXRhLnBpbnlpbic6IHBpbnlpbixcbiAgfX0sIHttdWx0aTogdHJ1ZX0pO1xufVxuXG5Qcm9ncmVzcy5yZWZyZXNoID0gKCkgPT4ge1xuICBjb25zdCB0b3RhbCA9IEdseXBocy5maW5kKCkuY291bnQoKTtcbiAgY29uc3QgY29tcGxldGUgPSBHbHlwaHMuZmluZCh7J3N0YWdlcy52ZXJpZmllZCc6IHskbmU6IG51bGx9fSkuY291bnQoKTtcbiAgUHJvZ3Jlc3MudXBzZXJ0KHt9LCB7dG90YWw6IHRvdGFsLCBjb21wbGV0ZTogY29tcGxldGUsIGJhY2t1cDogZmFsc2V9KTtcbn1cblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAvLyBDb25zdHJ1Y3QgaW5kaWNlcyBvbiB0aGUgR2x5cGhzIHRhYmxlLlxuICBHbHlwaHMuX2Vuc3VyZUluZGV4KHtjaGFyYWN0ZXI6IDF9LCB7dW5pcXVlOiB0cnVlfSk7XG4gIEdseXBocy5fZW5zdXJlSW5kZXgoe2NvZGVwb2ludDogMX0sIHt1bmlxdWU6IHRydWV9KTtcbiAgR2x5cGhzLl9lbnN1cmVJbmRleCh7J3N0YWdlcy52ZXJpZmllZCc6IDF9KTtcblxuICAvLyBSZWZyZXNoIHRoZSBQcm9ncmVzcyBjb3VudGVyLlxuICBQcm9ncmVzcy5yZWZyZXNoKCk7XG5cbiAgLy8gUmVnaXN0ZXIgdGhlIG1ldGhvZHMgYWJvdmUgc28gdGhleSBhcmUgYXZhaWxhYmxlIHRvIHRoZSBjbGllbnQuXG4gIGNvbnN0IG1ldGhvZHMgPSB7fTtcbiAgY29uc3QgbWV0aG9kX25hbWVzID0gW1xuICAgICAgJ2dldCcsICdnZXROZXh0JywgJ2dldE5leHRVbnZlcmlmaWVkJywgJ2dldE5leHRWZXJpZmllZCcsXG4gICAgICAnZ2V0UHJldmlvdXMnLCAnZ2V0UHJldmlvdXNVbnZlcmlmaWVkJywgJ2dldFByZXZpb3VzVmVyaWZpZWQnLCAnc2F2ZSddO1xuICBtZXRob2RfbmFtZXMubWFwKChuYW1lKSA9PiBtZXRob2RzW2Ake25hbWV9R2x5cGhgXSA9IEdseXBoc1tuYW1lXSk7XG4gIG1ldGhvZHMubG9hZEFsbEdseXBocyA9IEdseXBocy5sb2FkQWxsO1xuICBtZXRob2RzLnNhdmVHbHlwaHMgPSAoZ2x5cGhzKSA9PiBnbHlwaHMubWFwKEdseXBocy5zYXZlKTtcbiAgTWV0ZW9yLm1ldGhvZHMobWV0aG9kcyk7XG5cbiAgLy8gUHVibGlzaCBhY2Nlc3NvcnMgdGhhdCB3aWxsIGdldCBhbGwgZ2x5cGhzIGluIGEgbGlzdCBhbmQgZ2V0IHRoZSBwcm9ncmVzcy5cbiAgTWV0ZW9yLnB1Ymxpc2goJ2dldEFsbEdseXBocycsIEdseXBocy5nZXRBbGwpO1xuICBNZXRlb3IucHVibGlzaCgnZ2V0UHJvZ3Jlc3MnLCBQcm9ncmVzcy5maW5kLmJpbmQoUHJvZ3Jlc3MpKTtcbn1cblxuZXhwb3J0IHtHbHlwaHMsIFByb2dyZXNzfTtcbiIsIi8vIFRoaXMgYWxnb3JpdGhtIHdhcyBwdWxsZWQgZnJvbSBhbm90aGVyIG9uZSBvZiBteSBwcm9qZWN0cy4gLXNraXNob3JlXG4vLyAgIGh0dHBzOi8vZ2l0aHViLmNvbS9za2lzaG9yZS90ZXNzZXJhY3QvYmxvYi9tYXN0ZXIvY29mZmVlL2h1bmdhcmlhbi5jb2ZmZWVcblxudmFyIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG5jb25zdCBIdW5nYXJpYW4gPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIEh1bmdhcmlhbihjb3N0X21hdHJpeCkge1xuICAgIHZhciBpLCBqLCBsYXN0X21hdGNoZWQsIGxlbiwgcmVmLCByZWYxLCByZXN1bHRzLCByb3csIHgsIHk7XG4gICAgdGhpcy5jb3N0X21hdHJpeCA9IGNvc3RfbWF0cml4O1xuICAgIHRoaXMuZ2V0X2ZpbmFsX3Njb3JlID0gYmluZCh0aGlzLmdldF9maW5hbF9zY29yZSwgdGhpcyk7XG4gICAgdGhpcy51cGRhdGVfbGFiZWxzID0gYmluZCh0aGlzLnVwZGF0ZV9sYWJlbHMsIHRoaXMpO1xuICAgIHRoaXMuZmluZF9yb290X2FuZF9zbGFja3MgPSBiaW5kKHRoaXMuZmluZF9yb290X2FuZF9zbGFja3MsIHRoaXMpO1xuICAgIHRoaXMuYXVnbWVudCA9IGJpbmQodGhpcy5hdWdtZW50LCB0aGlzKTtcbiAgICB0aGlzLm1hdGNoID0gYmluZCh0aGlzLm1hdGNoLCB0aGlzKTtcbiAgICB0aGlzLmNvc3QgPSBiaW5kKHRoaXMuY29zdCwgdGhpcyk7XG4gICAgdGhpcy5maW5kX2dyZWVkeV9zb2x1dGlvbiA9IGJpbmQodGhpcy5maW5kX2dyZWVkeV9zb2x1dGlvbiwgdGhpcyk7XG4gICAgdGhpcy5yZWR1Y2VfY29zdF9tYXRyaXggPSBiaW5kKHRoaXMucmVkdWNlX2Nvc3RfbWF0cml4LCB0aGlzKTtcbiAgICB0aGlzLm4gPSB0aGlzLmNvc3RfbWF0cml4Lmxlbmd0aDtcbiAgICByZWYgPSB0aGlzLmNvc3RfbWF0cml4O1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgcm93ID0gcmVmW2ldO1xuICAgICAgaWYgKHJvdy5sZW5ndGggIT09IHRoaXMubikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYWxmb3JybWVkIGNvc3RfbWF0cml4OiBcIiArIHRoaXMuY29zdF9tYXRyaXgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlID0gKGZ1bmN0aW9uKCkge1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yICh2YXIgaiA9IDAsIHJlZjEgPSB0aGlzLm47IDAgPD0gcmVmMSA/IGogPCByZWYxIDogaiA+IHJlZjE7IDAgPD0gcmVmMSA/IGorKyA6IGotLSl7IHJlc3VsdHMucHVzaChqKTsgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSkuYXBwbHkodGhpcyk7XG4gICAgdGhpcy5tYXRjaGVkID0gMDtcbiAgICB0aGlzLnhfbGFiZWwgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaywgbGVuMSwgcmVmMiwgcmVzdWx0czE7XG4gICAgICByZWYyID0gdGhpcy5yYW5nZTtcbiAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICBmb3IgKGsgPSAwLCBsZW4xID0gcmVmMi5sZW5ndGg7IGsgPCBsZW4xOyBrKyspIHtcbiAgICAgICAgeCA9IHJlZjJba107XG4gICAgICAgIHJlc3VsdHMxLnB1c2goMCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgfSkuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnlfbGFiZWwgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaywgbGVuMSwgcmVmMiwgcmVzdWx0czE7XG4gICAgICByZWYyID0gdGhpcy5yYW5nZTtcbiAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICBmb3IgKGsgPSAwLCBsZW4xID0gcmVmMi5sZW5ndGg7IGsgPCBsZW4xOyBrKyspIHtcbiAgICAgICAgeSA9IHJlZjJba107XG4gICAgICAgIHJlc3VsdHMxLnB1c2goMCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgfSkuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnhfbWF0Y2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaywgbGVuMSwgcmVmMiwgcmVzdWx0czE7XG4gICAgICByZWYyID0gdGhpcy5yYW5nZTtcbiAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICBmb3IgKGsgPSAwLCBsZW4xID0gcmVmMi5sZW5ndGg7IGsgPCBsZW4xOyBrKyspIHtcbiAgICAgICAgeCA9IHJlZjJba107XG4gICAgICAgIHJlc3VsdHMxLnB1c2goLTEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHMxO1xuICAgIH0pLmNhbGwodGhpcyk7XG4gICAgdGhpcy55X21hdGNoID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGssIGxlbjEsIHJlZjIsIHJlc3VsdHMxO1xuICAgICAgcmVmMiA9IHRoaXMucmFuZ2U7XG4gICAgICByZXN1bHRzMSA9IFtdO1xuICAgICAgZm9yIChrID0gMCwgbGVuMSA9IHJlZjIubGVuZ3RoOyBrIDwgbGVuMTsgaysrKSB7XG4gICAgICAgIHkgPSByZWYyW2tdO1xuICAgICAgICByZXN1bHRzMS5wdXNoKC0xKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICB9KS5jYWxsKHRoaXMpO1xuICAgIHRoaXMucmVkdWNlX2Nvc3RfbWF0cml4KCk7XG4gICAgdGhpcy5maW5kX2dyZWVkeV9zb2x1dGlvbigpO1xuICAgIHdoaWxlICh0aGlzLm1hdGNoZWQgPCB0aGlzLm4pIHtcbiAgICAgIGxhc3RfbWF0Y2hlZCA9IHRoaXMubWF0Y2hlZDtcbiAgICAgIHRoaXMuYXVnbWVudCgpO1xuICAgICAgaWYgKHRoaXMubWF0Y2hlZCA8PSBsYXN0X21hdGNoZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXVnbWVudGF0aW9uIHJvdW5kIGRpZCBub3QgaW5jcmVhc2UgbWF0Y2hlZCFcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgSHVuZ2FyaWFuLnByb3RvdHlwZS5yZWR1Y2VfY29zdF9tYXRyaXggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSwgaiwgaywgbCwgbGVuLCBsZW4xLCBsZW4yLCBsZW4zLCBtYXhfY29zdCwgcmVmLCByZWYxLCByZWYyLCByZWYzLCByb3csIHgsIHk7XG4gICAgdGhpcy5jb3N0X21hdHJpeCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpLCBsZW4sIHJlZiwgcmVzdWx0cztcbiAgICAgIHJlZiA9IHRoaXMuY29zdF9tYXRyaXg7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcm93ID0gcmVmW2ldO1xuICAgICAgICByZXN1bHRzLnB1c2gocm93LnNsaWNlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSkuY2FsbCh0aGlzKTtcbiAgICByZWYgPSB0aGlzLnJhbmdlO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgeCA9IHJlZltpXTtcbiAgICAgIG1heF9jb3N0ID0gTWF0aC5tYXguYXBwbHkoMCwgKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaiwgbGVuMSwgcmVmMSwgcmVzdWx0cztcbiAgICAgICAgcmVmMSA9IHRoaXMucmFuZ2U7XG4gICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChqID0gMCwgbGVuMSA9IHJlZjEubGVuZ3RoOyBqIDwgbGVuMTsgaisrKSB7XG4gICAgICAgICAgeSA9IHJlZjFbal07XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMuY29zdF9tYXRyaXhbeF1beV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgfSkuY2FsbCh0aGlzKSk7XG4gICAgICByZWYxID0gdGhpcy5yYW5nZTtcbiAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYxLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICB5ID0gcmVmMVtqXTtcbiAgICAgICAgdGhpcy5jb3N0X21hdHJpeFt4XVt5XSAtPSBtYXhfY29zdDtcbiAgICAgIH1cbiAgICAgIHRoaXMueF9sYWJlbFt4XSA9IDA7XG4gICAgfVxuICAgIHJlZjIgPSB0aGlzLnJhbmdlO1xuICAgIGZvciAoayA9IDAsIGxlbjIgPSByZWYyLmxlbmd0aDsgayA8IGxlbjI7IGsrKykge1xuICAgICAgeSA9IHJlZjJba107XG4gICAgICBtYXhfY29zdCA9IE1hdGgubWF4LmFwcGx5KDAsIChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGwsIGxlbjMsIHJlZjMsIHJlc3VsdHM7XG4gICAgICAgIHJlZjMgPSB0aGlzLnJhbmdlO1xuICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgIGZvciAobCA9IDAsIGxlbjMgPSByZWYzLmxlbmd0aDsgbCA8IGxlbjM7IGwrKykge1xuICAgICAgICAgIHggPSByZWYzW2xdO1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLmNvc3RfbWF0cml4W3hdW3ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0pLmNhbGwodGhpcykpO1xuICAgICAgcmVmMyA9IHRoaXMucmFuZ2U7XG4gICAgICBmb3IgKGwgPSAwLCBsZW4zID0gcmVmMy5sZW5ndGg7IGwgPCBsZW4zOyBsKyspIHtcbiAgICAgICAgeCA9IHJlZjNbbF07XG4gICAgICAgIHRoaXMuY29zdF9tYXRyaXhbeF1beV0gLT0gbWF4X2Nvc3Q7XG4gICAgICB9XG4gICAgICB0aGlzLnlfbGFiZWxbeV0gPSAwO1xuICAgIH1cbiAgfTtcblxuICBIdW5nYXJpYW4ucHJvdG90eXBlLmZpbmRfZ3JlZWR5X3NvbHV0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGksIGxlbiwgcmVmLCByZXN1bHRzLCB4LCB5O1xuICAgIHJlZiA9IHRoaXMucmFuZ2U7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgeCA9IHJlZltpXTtcbiAgICAgIHJlc3VsdHMucHVzaCgoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBqLCBsZW4xLCByZWYxLCByZXN1bHRzMTtcbiAgICAgICAgcmVmMSA9IHRoaXMucmFuZ2U7XG4gICAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYxLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICAgIHkgPSByZWYxW2pdO1xuICAgICAgICAgIGlmICh0aGlzLnhfbWF0Y2hbeF0gPT09IC0xICYmIHRoaXMueV9tYXRjaFt5XSA9PT0gLTEgJiYgKHRoaXMuY29zdCh4LCB5KSkgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMubWF0Y2goeCwgeSk7XG4gICAgICAgICAgICByZXN1bHRzMS5wdXNoKHRoaXMubWF0Y2hlZCArPSAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0czEucHVzaCh2b2lkIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgICB9KS5jYWxsKHRoaXMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgSHVuZ2FyaWFuLnByb3RvdHlwZS5jb3N0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiB0aGlzLmNvc3RfbWF0cml4W3hdW3ldIC0gdGhpcy54X2xhYmVsW3hdIC0gdGhpcy55X2xhYmVsW3ldO1xuICB9O1xuXG4gIEh1bmdhcmlhbi5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54X21hdGNoW3hdID0geTtcbiAgICByZXR1cm4gdGhpcy55X21hdGNoW3ldID0geDtcbiAgfTtcblxuICBIdW5nYXJpYW4ucHJvdG90eXBlLmF1Z21lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3VyX3gsIGN1cl95LCBkZWx0YSwgZGVsdGFfeCwgZGVsdGFfeSwgaSwgaiwgbGVuLCBsZW4xLCBuZXdfc2xhY2ssIG5leHRfeSwgcmVmLCByZWYxLCByZWYyLCByb290LCBzbGFjaywgc2xhY2tfeCwgeCwgeF9pbl90cmVlLCB5LCB5X3BhcmVudDtcbiAgICB4X2luX3RyZWUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSwgbGVuLCByZWYsIHJlc3VsdHM7XG4gICAgICByZWYgPSB0aGlzLnJhbmdlO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHggPSByZWZbaV07XG4gICAgICAgIHJlc3VsdHMucHVzaChmYWxzZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KS5jYWxsKHRoaXMpO1xuICAgIHlfcGFyZW50ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGksIGxlbiwgcmVmLCByZXN1bHRzO1xuICAgICAgcmVmID0gdGhpcy5yYW5nZTtcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB5ID0gcmVmW2ldO1xuICAgICAgICByZXN1bHRzLnB1c2goLTEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSkuY2FsbCh0aGlzKTtcbiAgICByZWYgPSB0aGlzLmZpbmRfcm9vdF9hbmRfc2xhY2tzKCksIHJvb3QgPSByZWZbMF0sIHNsYWNrID0gcmVmWzFdLCBzbGFja194ID0gcmVmWzJdO1xuICAgIHhfaW5fdHJlZVtyb290XSA9IHRydWU7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGRlbHRhID0gSW5maW5pdHk7XG4gICAgICByZWYxID0gdGhpcy5yYW5nZTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZjEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgeSA9IHJlZjFbaV07XG4gICAgICAgIGlmICh5X3BhcmVudFt5XSA8IDAgJiYgc2xhY2tbeV0gPCBkZWx0YSkge1xuICAgICAgICAgIGRlbHRhID0gc2xhY2tbeV07XG4gICAgICAgICAgZGVsdGFfeCA9IHNsYWNrX3hbeV07XG4gICAgICAgICAgZGVsdGFfeSA9IHk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlX2xhYmVscyhkZWx0YSwgeF9pbl90cmVlLCB5X3BhcmVudCwgc2xhY2spO1xuICAgICAgeV9wYXJlbnRbZGVsdGFfeV0gPSBkZWx0YV94O1xuICAgICAgaWYgKHRoaXMueV9tYXRjaFtkZWx0YV95XSA8IDApIHtcbiAgICAgICAgY3VyX3kgPSBkZWx0YV95O1xuICAgICAgICB3aGlsZSAoY3VyX3kgPj0gMCkge1xuICAgICAgICAgIGN1cl94ID0geV9wYXJlbnRbY3VyX3ldO1xuICAgICAgICAgIG5leHRfeSA9IHRoaXMueF9tYXRjaFtjdXJfeF07XG4gICAgICAgICAgdGhpcy5tYXRjaChjdXJfeCwgY3VyX3kpO1xuICAgICAgICAgIGN1cl95ID0gbmV4dF95O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWF0Y2hlZCArPSAxO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB4ID0gdGhpcy55X21hdGNoW2RlbHRhX3ldO1xuICAgICAgeF9pbl90cmVlW3hdID0gdHJ1ZTtcbiAgICAgIHJlZjIgPSB0aGlzLnJhbmdlO1xuICAgICAgZm9yIChqID0gMCwgbGVuMSA9IHJlZjIubGVuZ3RoOyBqIDwgbGVuMTsgaisrKSB7XG4gICAgICAgIHkgPSByZWYyW2pdO1xuICAgICAgICBpZiAoeV9wYXJlbnRbeV0gPCAwKSB7XG4gICAgICAgICAgbmV3X3NsYWNrID0gLSh0aGlzLmNvc3QoeCwgeSkpO1xuICAgICAgICAgIGlmIChzbGFja1t5XSA+IG5ld19zbGFjaykge1xuICAgICAgICAgICAgc2xhY2tbeV0gPSBuZXdfc2xhY2s7XG4gICAgICAgICAgICBzbGFja194W3ldID0geDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgSHVuZ2FyaWFuLnByb3RvdHlwZS5maW5kX3Jvb3RfYW5kX3NsYWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpLCBsZW4sIHJlZiwgeCwgeTtcbiAgICByZWYgPSB0aGlzLnJhbmdlO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgeCA9IHJlZltpXTtcbiAgICAgIGlmICh0aGlzLnhfbWF0Y2hbeF0gPCAwKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgeCwgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGosIGxlbjEsIHJlZjEsIHJlc3VsdHM7XG4gICAgICAgICAgICByZWYxID0gdGhpcy5yYW5nZTtcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYxLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICAgICAgICB5ID0gcmVmMVtqXTtcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKC0odGhpcy5jb3N0KHgsIHkpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICB9KS5jYWxsKHRoaXMpLCAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaiwgbGVuMSwgcmVmMSwgcmVzdWx0cztcbiAgICAgICAgICAgIHJlZjEgPSB0aGlzLnJhbmdlO1xuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuMSA9IHJlZjEubGVuZ3RoOyBqIDwgbGVuMTsgaisrKSB7XG4gICAgICAgICAgICAgIHkgPSByZWYxW2pdO1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICB9KS5jYWxsKHRoaXMpXG4gICAgICAgIF07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIEh1bmdhcmlhbi5wcm90b3R5cGUudXBkYXRlX2xhYmVscyA9IGZ1bmN0aW9uKGRlbHRhLCB4X2luX3RyZWUsIHlfcGFyZW50LCBzbGFjaykge1xuICAgIHZhciBpLCBqLCBsZW4sIGxlbjEsIHJlZiwgcmVmMSwgcmVzdWx0cywgeCwgeTtcbiAgICByZWYgPSB0aGlzLnJhbmdlO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgeCA9IHJlZltpXTtcbiAgICAgIGlmICh4X2luX3RyZWVbeF0pIHtcbiAgICAgICAgdGhpcy54X2xhYmVsW3hdIC09IGRlbHRhO1xuICAgICAgfVxuICAgIH1cbiAgICByZWYxID0gdGhpcy5yYW5nZTtcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChqID0gMCwgbGVuMSA9IHJlZjEubGVuZ3RoOyBqIDwgbGVuMTsgaisrKSB7XG4gICAgICB5ID0gcmVmMVtqXTtcbiAgICAgIGlmICh5X3BhcmVudFt5XSA8IDApIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHNsYWNrW3ldIC09IGRlbHRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLnlfbGFiZWxbeV0gKz0gZGVsdGEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICBIdW5nYXJpYW4ucHJvdG90eXBlLmdldF9maW5hbF9zY29yZSA9IGZ1bmN0aW9uKG9yaWdpbmFsX21hdHJpeCkge1xuICAgIHZhciB4O1xuICAgIHJldHVybiBVdGlsLnN1bSgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSwgbGVuLCByZWYsIHJlc3VsdHM7XG4gICAgICByZWYgPSB0aGlzLnJhbmdlO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHggPSByZWZbaV07XG4gICAgICAgIHJlc3VsdHMucHVzaChvcmlnaW5hbF9tYXRyaXhbeF1bdGhpcy54X21hdGNoW3hdXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KS5jYWxsKHRoaXMpKTtcbiAgfTtcblxuICByZXR1cm4gSHVuZ2FyaWFuO1xuXG59KSgpO1xuXG5leHBvcnQge0h1bmdhcmlhbn07XG4iLCJpbXBvcnQgc2ltcGxpZnkgZnJvbSAnL2xpYi9leHRlcm5hbC9zaW1wbGlmeS8xLjIuMi9zaW1wbGlmeSc7XG5cbmltcG9ydCB7YXNzZXJ0LCBQb2ludH0gZnJvbSAnL2xpYi9iYXNlJztcbmltcG9ydCB7c3ZnfSBmcm9tICcvbGliL3N2Zyc7XG5cbmNvbnN0IHNpemUgPSAxMDI0O1xuY29uc3QgcmlzZSA9IDkwMDtcbmNvbnN0IG51bV90b19tYXRjaCA9IDg7XG5cbmxldCB2b3Jvbm9pID0gdW5kZWZpbmVkO1xuXG5jb25zdCBmaWx0ZXJNZWRpYW4gPSAobWVkaWFuLCBuKSA9PiB7XG4gIGNvbnN0IGRpc3RhbmNlcyA9IF8ucmFuZ2UobWVkaWFuLmxlbmd0aCAtIDEpLm1hcChcbiAgICAgIChpKSA9PiBNYXRoLnNxcnQoUG9pbnQuZGlzdGFuY2UyKG1lZGlhbltpXSwgbWVkaWFuW2kgKyAxXSkpKTtcbiAgbGV0IHRvdGFsID0gMDtcbiAgZGlzdGFuY2VzLm1hcCgoeCkgPT4gdG90YWwgKz0geCk7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgcG9zaXRpb24gPSBtZWRpYW5bMF07XG4gIGxldCB0b3RhbF9zb19mYXIgPSAwO1xuICBmb3IgKGxldCBpIG9mIF8ucmFuZ2UobiAtIDEpKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gaSp0b3RhbC8obiAtIDEpO1xuICAgIHdoaWxlICh0b3RhbF9zb19mYXIgPCB0YXJnZXQpIHtcbiAgICAgIGNvbnN0IHN0ZXAgPSBNYXRoLnNxcnQoUG9pbnQuZGlzdGFuY2UyKHBvc2l0aW9uLCBtZWRpYW5baW5kZXggKyAxXSkpO1xuICAgICAgaWYgKHRvdGFsX3NvX2ZhciArIHN0ZXAgPCB0YXJnZXQpIHtcbiAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgICAgcG9zaXRpb24gPSBtZWRpYW5baW5kZXhdO1xuICAgICAgICB0b3RhbF9zb19mYXIgKz0gc3RlcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHQgPSAodGFyZ2V0IC0gdG90YWxfc29fZmFyKS9zdGVwO1xuICAgICAgICBwb3NpdGlvbiA9IFsoMSAtIHQpKnBvc2l0aW9uWzBdICsgdCptZWRpYW5baW5kZXggKyAxXVswXSxcbiAgICAgICAgICAgICAgICAgICAgKDEgLSB0KSpwb3NpdGlvblsxXSArIHQqbWVkaWFuW2luZGV4ICsgMV1bMV1dO1xuICAgICAgICB0b3RhbF9zb19mYXIgPSB0YXJnZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKFBvaW50LmNsb25lKHBvc2l0aW9uKSk7XG4gIH1cbiAgcmVzdWx0LnB1c2gobWVkaWFuW21lZGlhbi5sZW5ndGggLSAxXSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IGZpbmRMb25nZXN0U2hvcnRlc3RQYXRoID0gKGFkamFjZW5jeSwgdmVydGljZXMsIG5vZGUpID0+IHtcbiAgY29uc3QgcGF0aCA9IGZpbmRQYXRoRnJvbUZ1cnRoZXN0Tm9kZShhZGphY2VuY3ksIHZlcnRpY2VzLCBub2RlKTtcbiAgcmV0dXJuIGZpbmRQYXRoRnJvbUZ1cnRoZXN0Tm9kZShhZGphY2VuY3ksIHZlcnRpY2VzLCBwYXRoWzBdKTtcbn1cblxuY29uc3QgZmluZFBhdGhGcm9tRnVydGhlc3ROb2RlID0gKGFkamFjZW5jeSwgdmVydGljZXMsIG5vZGUsIHZpc2l0ZWQpID0+IHtcbiAgdmlzaXRlZCA9IHZpc2l0ZWQgfHwge307XG4gIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xuICBsZXQgcmVzdWx0ID0gW107XG4gIHJlc3VsdC5kaXN0YW5jZSA9IDA7XG4gIGZvciAobGV0IG5laWdoYm9yIG9mIGFkamFjZW5jeVtub2RlXSB8fCBbXSkge1xuICAgIGlmICghdmlzaXRlZFtuZWlnaGJvcl0pIHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRQYXRoRnJvbUZ1cnRoZXN0Tm9kZShcbiAgICAgICAgICBhZGphY2VuY3ksIHZlcnRpY2VzLCBuZWlnaGJvciwgdmlzaXRlZCk7XG4gICAgICBjYW5kaWRhdGUuZGlzdGFuY2UgKz1cbiAgICAgICAgICBNYXRoLnNxcnQoUG9pbnQuZGlzdGFuY2UyKHZlcnRpY2VzW25vZGVdLCB2ZXJ0aWNlc1tuZWlnaGJvcl0pKTtcbiAgICAgIGlmIChjYW5kaWRhdGUuZGlzdGFuY2UgPiByZXN1bHQuZGlzdGFuY2UpIHtcbiAgICAgICAgcmVzdWx0ID0gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXN1bHQucHVzaChub2RlKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3QgZmluZFN0cm9rZU1lZGlhbiA9IChzdHJva2UpID0+IHtcbiAgY29uc3QgcGF0aHMgPSBzdmcuY29udmVydFNWR1BhdGhUb1BhdGhzKHN0cm9rZSk7XG4gIGFzc2VydChwYXRocy5sZW5ndGggPT09IDEsIGBHb3Qgc3Ryb2tlIHdpdGggbXVsdGlwbGUgbG9vcHM6ICR7c3Ryb2tlfWApO1xuXG4gIGxldCBwb2x5Z29uID0gdW5kZWZpbmVkO1xuICBsZXQgZGlhZ3JhbSA9IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgYXBwcm94aW1hdGlvbiBvZiBbMTYsIDY0XSkge1xuICAgIHBvbHlnb24gPSBzdmcuZ2V0UG9seWdvbkFwcHJveGltYXRpb24ocGF0aHNbMF0sIGFwcHJveGltYXRpb24pO1xuICAgIHZvcm9ub2kgPSB2b3Jvbm9pIHx8IG5ldyBWb3Jvbm9pO1xuICAgIGNvbnN0IHNpdGVzID0gcG9seWdvbi5tYXAoKHBvaW50KSA9PiAoe3g6IHBvaW50WzBdLCB5OiBwb2ludFsxXX0pKTtcbiAgICBjb25zdCBib3VuZGluZ19ib3ggPSB7eGw6IC1zaXplLCB4cjogc2l6ZSwgeXQ6IC1zaXplLCB5Yjogc2l6ZX07XG4gICAgdHJ5IHtcbiAgICAgIGRpYWdyYW0gPSB2b3Jvbm9pLmNvbXB1dGUoc2l0ZXMsIGJvdW5kaW5nX2JveCk7XG4gICAgICBicmVhaztcbiAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBXQVJOSU5HOiBWb3Jvbm9pIGNvbXB1dGF0aW9uIGZhaWxlZCBhdCAke2FwcHJveGltYXRpb259LmApO1xuICAgIH1cbiAgfVxuICBhc3NlcnQoZGlhZ3JhbSwgJ1Zvcm9ub2kgY29tcHV0YXRpb24gZmFpbGVkIGNvbXBsZXRlbHkhJyk7XG5cbiAgZGlhZ3JhbS52ZXJ0aWNlcy5tYXAoKHgsIGkpID0+IHtcbiAgICB4LmluY2x1ZGUgPSBzdmcucG9seWdvbkNvbnRhaW5zUG9pbnQocG9seWdvbiwgW3gueCwgeC55XSk7XG4gICAgeC5pbmRleCA9IGk7XG4gIH0pO1xuICBjb25zdCB2ZXJ0aWNlcyA9IGRpYWdyYW0udmVydGljZXMubWFwKCh4KSA9PiBbeC54LCB4LnldLm1hcChNYXRoLnJvdW5kKSk7XG4gIGNvbnN0IGVkZ2VzID0gZGlhZ3JhbS5lZGdlcy5tYXAoKHgpID0+IFt4LnZhLmluZGV4LCB4LnZiLmluZGV4XSkuZmlsdGVyKFxuICAgICAgKHgpID0+IGRpYWdyYW0udmVydGljZXNbeFswXV0uaW5jbHVkZSAmJiBkaWFncmFtLnZlcnRpY2VzW3hbMV1dLmluY2x1ZGUpO1xuICB2b3Jvbm9pLnJlY3ljbGUoZGlhZ3JhbSk7XG5cbiAgYXNzZXJ0KGVkZ2VzLmxlbmd0aCA+IDApO1xuICBjb25zdCBhZGphY2VuY3kgPSB7fTtcbiAgZm9yIChsZXQgZWRnZSBvZiBlZGdlcykge1xuICAgIGFkamFjZW5jeVtlZGdlWzBdXSA9IGFkamFjZW5jeVtlZGdlWzBdXSB8fCBbXTtcbiAgICBhZGphY2VuY3lbZWRnZVswXV0ucHVzaChlZGdlWzFdKTtcbiAgICBhZGphY2VuY3lbZWRnZVsxXV0gPSBhZGphY2VuY3lbZWRnZVsxXV0gfHwgW107XG4gICAgYWRqYWNlbmN5W2VkZ2VbMV1dLnB1c2goZWRnZVswXSk7XG4gIH1cbiAgY29uc3Qgcm9vdCA9IGVkZ2VzWzBdWzBdO1xuICBjb25zdCBwYXRoID0gZmluZExvbmdlc3RTaG9ydGVzdFBhdGgoYWRqYWNlbmN5LCB2ZXJ0aWNlcywgcm9vdCk7XG4gIGNvbnN0IHBvaW50cyA9IHBhdGgubWFwKChpKSA9PiB2ZXJ0aWNlc1tpXSk7XG5cbiAgY29uc3QgdG9sZXJhbmNlID0gNDtcbiAgY29uc3Qgc2ltcGxlID0gc2ltcGxpZnkocG9pbnRzLm1hcCgoeCkgPT4gKHt4OiB4WzBdLCB5OiB4WzFdfSkpLCB0b2xlcmFuY2UpO1xuICByZXR1cm4gc2ltcGxlLm1hcCgoeCkgPT4gW3gueCwgeC55XSk7XG59XG5cbmNvbnN0IG5vcm1hbGl6ZUZvck1hdGNoID0gKG1lZGlhbikgPT4ge1xuICByZXR1cm4gZmlsdGVyTWVkaWFuKG1lZGlhbiwgbnVtX3RvX21hdGNoKS5tYXAoXG4gICAgICAoeCkgPT4gW3hbMF0vc2l6ZSwgKHJpc2UgLSB4WzFdKS9zaXplXSk7XG59XG5cbmNvbnN0IG1lZGlhbl91dGlsID0ge1xuICBmaW5kU3Ryb2tlTWVkaWFuOiBmaW5kU3Ryb2tlTWVkaWFuLFxuICBub3JtYWxpemVGb3JNYXRjaDogbm9ybWFsaXplRm9yTWF0Y2gsXG59O1xuXG5leHBvcnQge21lZGlhbl91dGlsfTtcbiIsImNvbnN0IE5FVVJBTF9ORVRfVFJBSU5FRF9GT1JfU1RST0tFX0VYVFJBQ1RJT04gPSB7XCJsYXllcnNcIjpbe1wib3V0X2RlcHRoXCI6OCxcIm91dF9zeFwiOjEsXCJvdXRfc3lcIjoxLFwibGF5ZXJfdHlwZVwiOlwiaW5wdXRcIn0se1wib3V0X2RlcHRoXCI6OCxcIm91dF9zeFwiOjEsXCJvdXRfc3lcIjoxLFwibGF5ZXJfdHlwZVwiOlwiZmNcIixcIm51bV9pbnB1dHNcIjo4LFwibDFfZGVjYXlfbXVsXCI6MCxcImwyX2RlY2F5X211bFwiOjEsXCJmaWx0ZXJzXCI6W3tcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6LTAuMzA0NDI2MTYwNTY2NjE2NyxcIjFcIjotMC4xNDgzNDkyMjQyMzA4MzMyNCxcIjJcIjowLjIwMjE5NDAxNjYxNTc0MTc3LFwiM1wiOjAuNTUwMzUyMjYxNjQ1OTg3MyxcIjRcIjowLjQ1NTAyMTI3MzI4MzUwMjM0LFwiNVwiOjAuMjYyNTc0NTE4NjU5NDkzNixcIjZcIjowLjAxMjg4OTczMTAyMjY5NTY4OSxcIjdcIjotMC4yNjc1OTIzODAwMjUyNjI2LFwiQllURVNfUEVSX0VMRU1FTlRcIjo4LFwiYnVmZmVyXCI6e1wiMFwiOjE4MyxcIjFcIjoxNDAsXCIyXCI6MjM1LFwiM1wiOjIyMCxcIjRcIjoxODMsXCI1XCI6MTIzLFwiNlwiOjIxMSxcIjdcIjoxOTEsXCI4XCI6MjE0LFwiOVwiOjE3MixcIjEwXCI6NTgsXCIxMVwiOjEyNSxcIjEyXCI6MjcsXCIxM1wiOjI1MyxcIjE0XCI6MTk0LFwiMTVcIjoxOTEsXCIxNlwiOjI0NCxcIjE3XCI6MjIyLFwiMThcIjoxMDMsXCIxOVwiOjg4LFwiMjBcIjoxMjYsXCIyMVwiOjIyNSxcIjIyXCI6MjAxLFwiMjNcIjo2MyxcIjI0XCI6MTY0LFwiMjVcIjoxNDYsXCIyNlwiOjE2MSxcIjI3XCI6ODgsXCIyOFwiOjEyNCxcIjI5XCI6MTU2LFwiMzBcIjoyMjUsXCIzMVwiOjYzLFwiMzJcIjoxODMsXCIzM1wiOjQxLFwiMzRcIjoyMzksXCIzNVwiOjEzOSxcIjM2XCI6MTcsXCIzN1wiOjMxLFwiMzhcIjoyMjEsXCIzOVwiOjYzLFwiNDBcIjo0MyxcIjQxXCI6MjQzLFwiNDJcIjoxNTMsXCI0M1wiOjkwLFwiNDRcIjo1LFwiNDVcIjoyMDYsXCI0NlwiOjIwOCxcIjQ3XCI6NjMsXCI0OFwiOjI5LFwiNDlcIjoyMjMsXCI1MFwiOjE0NixcIjUxXCI6MTA1LFwiNTJcIjoyMzgsXCI1M1wiOjEwMSxcIjU0XCI6MTM4LFwiNTVcIjo2MyxcIjU2XCI6MjQzLFwiNTdcIjoxMjksXCI1OFwiOjU1LFwiNTlcIjoyMDIsXCI2MFwiOjU5LFwiNjFcIjozMixcIjYyXCI6MjA5LFwiNjNcIjoxOTEsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjotMC41NTk2NjM5ODgyNDU2MTY2LFwiMVwiOi0wLjI3OTQwODQwOTY0NDIwNDYsXCIyXCI6LTAuMTEyNTY5ODQyMjUyNDExNyxcIjNcIjotMC4wODg1MDY3NjcwMjc3NzkwMyxcIjRcIjowLjA2MzE3NjAxNjgyNTQzOTY5LFwiNVwiOi0wLjE4MjQ3MjQ4NDUzNTE0ODc4LFwiNlwiOjAuMjk0MDEwODI3MjQ1NDE4NCxcIjdcIjowLjk4NjE4MjEwOTI3NjA3NDIsXCJCWVRFU19QRVJfRUxFTUVOVFwiOjgsXCJidWZmZXJcIjp7XCIwXCI6MTIxLFwiMVwiOjExMyxcIjJcIjoyMDAsXCIzXCI6MTE1LFwiNFwiOjE5NixcIjVcIjoyMzIsXCI2XCI6MjI1LFwiN1wiOjE5MSxcIjhcIjoyNTEsXCI5XCI6MTQwLFwiMTBcIjoxMDUsXCIxMVwiOjIwNyxcIjEyXCI6MjExLFwiMTNcIjoyMjUsXCIxNFwiOjIwOSxcIjE1XCI6MTkxLFwiMTZcIjoyMDYsXCIxN1wiOjExMSxcIjE4XCI6MjUzLFwiMTlcIjoxNDIsXCIyMFwiOjk2LFwiMjFcIjoyMDksXCIyMlwiOjE4OCxcIjIzXCI6MTkxLFwiMjRcIjoxNDMsXCIyNVwiOjIzMSxcIjI2XCI6MjE5LFwiMjdcIjozNyxcIjI4XCI6OTcsXCIyOVwiOjE2OCxcIjMwXCI6MTgyLFwiMzFcIjoxOTEsXCIzMlwiOjE2NixcIjMzXCI6MzYsXCIzNFwiOjQwLFwiMzVcIjoxNzQsXCIzNlwiOjc3LFwiMzdcIjo0NCxcIjM4XCI6MTc2LFwiMzlcIjo2MyxcIjQwXCI6NjksXCI0MVwiOjIwMSxcIjQyXCI6MTkxLFwiNDNcIjozNixcIjQ0XCI6NjYsXCI0NVwiOjkxLFwiNDZcIjoxOTksXCI0N1wiOjE5MSxcIjQ4XCI6NTQsXCI0OVwiOjI0LFwiNTBcIjoyMzYsXCI1MVwiOjIwMSxcIjUyXCI6MTgsXCI1M1wiOjIwOSxcIjU0XCI6MjEwLFwiNTVcIjo2MyxcIjU2XCI6MTQ3LFwiNTdcIjoxODIsXCI1OFwiOjEwMyxcIjU5XCI6MjAwLFwiNjBcIjoyMDUsXCI2MVwiOjE0MixcIjYyXCI6MjM5LFwiNjNcIjo2MyxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fSx7XCJzeFwiOjEsXCJzeVwiOjEsXCJkZXB0aFwiOjgsXCJ3XCI6e1wiMFwiOi0wLjQyOTMyNDA3MDM2NTk3MzYsXCIxXCI6MC40ODc5OTY2NjM1MzQzMDcxNSxcIjJcIjotMC4wMTEyMjE0MTExNzA4OTEyNDMsXCIzXCI6MC4wMTY3NTk1NTE0OTEwNDI4MjUsXCI0XCI6LTAuMTAxNzgyNDE0OTAzMDA0NTUsXCI1XCI6LTAuMDU5Mzg2MzY5NzU4OTc4MjEsXCI2XCI6LTAuNzE0MDU1NTIxNjU0Mzc1NyxcIjdcIjotMC4xMzAzMzg5NjMyODA1NjcyNCxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoxNTcsXCIxXCI6MjI0LFwiMlwiOjEwMixcIjNcIjoxNzAsXCI0XCI6MTEsXCI1XCI6MTIyLFwiNlwiOjIxOSxcIjdcIjoxOTEsXCI4XCI6NjAsXCI5XCI6MjQ3LFwiMTBcIjoxNTUsXCIxMVwiOjkxLFwiMTJcIjo4NixcIjEzXCI6NTksXCIxNFwiOjIyMyxcIjE1XCI6NjMsXCIxNlwiOjExOCxcIjE3XCI6MTU0LFwiMThcIjoyNDMsXCIxOVwiOjc5LFwiMjBcIjo2NCxcIjIxXCI6MjUxLFwiMjJcIjoxMzQsXCIyM1wiOjE5MSxcIjI0XCI6NzEsXCIyNVwiOjIxNyxcIjI2XCI6NTAsXCIyN1wiOjExOCxcIjI4XCI6MTA2LFwiMjlcIjo0MSxcIjMwXCI6MTQ1LFwiMzFcIjo2MyxcIjMyXCI6MTM2LFwiMzNcIjoyNDksXCIzNFwiOjgwLFwiMzVcIjoxNDMsXCIzNlwiOjEwNSxcIjM3XCI6MTQsXCIzOFwiOjE4NixcIjM5XCI6MTkxLFwiNDBcIjoxNTIsXCI0MVwiOjIwNSxcIjQyXCI6MjI2LFwiNDNcIjoyMzEsXCI0NFwiOjIyNyxcIjQ1XCI6MTAzLFwiNDZcIjoxNzQsXCI0N1wiOjE5MSxcIjQ4XCI6MTUxLFwiNDlcIjoyMCxcIjUwXCI6MzMsXCI1MVwiOjI0NyxcIjUyXCI6MTM4LFwiNTNcIjoyMTcsXCI1NFwiOjIzMCxcIjU1XCI6MTkxLFwiNTZcIjo5MSxcIjU3XCI6MTYwLFwiNThcIjo4NyxcIjU5XCI6MTIwLFwiNjBcIjoyNDIsXCI2MVwiOjE3NCxcIjYyXCI6MTkyLFwiNjNcIjoxOTEsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjowLjAwNDEzMjI0MzIwNDM5OTkyMSxcIjFcIjowLjMxNjQ0MzI4MDQ2MDEzMDE1LFwiMlwiOi0wLjQyNDYyMTk2NDQ1MzIyMjUsXCIzXCI6MC4wMjE4ODg3MTk1MjQ5NTg1MjUsXCI0XCI6LTAuNTczNjQ5OTY4Mzc0NDk1NCxcIjVcIjotMC4xMjg1Nzc4Njg3NjMxODY3LFwiNlwiOi0wLjE3NjMzNjM3NDI4MTk5OTUzLFwiN1wiOi0wLjA5MTg0ODAwNTYyODQ5NDc1LFwiQllURVNfUEVSX0VMRU1FTlRcIjo4LFwiYnVmZmVyXCI6e1wiMFwiOjE5MixcIjFcIjoxNDcsXCIyXCI6MTkyLFwiM1wiOjE1MCxcIjRcIjoyNDgsXCI1XCI6MjM2LFwiNlwiOjExMixcIjdcIjo2MyxcIjhcIjoxNzQsXCI5XCI6OTUsXCIxMFwiOjM5LFwiMTFcIjo4MSxcIjEyXCI6MTU1LFwiMTNcIjo2NCxcIjE0XCI6MjEyLFwiMTVcIjo2MyxcIjE2XCI6MjQzLFwiMTdcIjo4OSxcIjE4XCI6MTU5LFwiMTlcIjoxNTQsXCIyMFwiOjEsXCIyMVwiOjQ1LFwiMjJcIjoyMTksXCIyM1wiOjE5MSxcIjI0XCI6MzMsXCIyNVwiOjcxLFwiMjZcIjoxMSxcIjI3XCI6MjYsXCIyOFwiOjI1NSxcIjI5XCI6MTA1LFwiMzBcIjoxNTAsXCIzMVwiOjYzLFwiMzJcIjoyNDUsXCIzM1wiOjE2MixcIjM0XCI6MTc2LFwiMzVcIjo0NSxcIjM2XCI6ODcsXCIzN1wiOjkxLFwiMzhcIjoyMjYsXCIzOVwiOjE5MSxcIjQwXCI6MjI1LFwiNDFcIjoyMjcsXCI0MlwiOjE2OSxcIjQzXCI6ODYsXCI0NFwiOjYxLFwiNDVcIjoxMTcsXCI0NlwiOjE5MixcIjQ3XCI6MTkxLFwiNDhcIjoxNzEsXCI0OVwiOjExNyxcIjUwXCI6ODEsXCI1MVwiOjE4NCxcIjUyXCI6NDgsXCI1M1wiOjE0NixcIjU0XCI6MTk4LFwiNTVcIjoxOTEsXCI1NlwiOjE5NSxcIjU3XCI6MTQ0LFwiNThcIjo5NixcIjU5XCI6MjEyLFwiNjBcIjo4OSxcIjYxXCI6MTMxLFwiNjJcIjoxODMsXCI2M1wiOjE5MSxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fSx7XCJzeFwiOjEsXCJzeVwiOjEsXCJkZXB0aFwiOjgsXCJ3XCI6e1wiMFwiOjAuMDk0NjE4OTI4MDU5OTA4MzIsXCIxXCI6LTAuNjMyOTc0NTU1Mjg0NDIwNCxcIjJcIjotMC43OTIzNjc2Mzk0NjI0NzM3LFwiM1wiOi0wLjA4NjA2NDQ1OTAwMTcyNTQ2LFwiNFwiOjAuMTE2MDMxMjQ5MjAyODYyODgsXCI1XCI6MC4wMjkyNTIwNTQ4MTQzMjAzOTIsXCI2XCI6LTAuMDM3NDc5MDc3NTcwMzg2NTcsXCI3XCI6LTAuNjAwNTI4OTA0Nzk4MTU1OCxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoyMzgsXCIxXCI6MTQ1LFwiMlwiOjE1MyxcIjNcIjo0OSxcIjRcIjoyNDIsXCI1XCI6NTYsXCI2XCI6MTg0LFwiN1wiOjYzLFwiOFwiOjIsXCI5XCI6MTc4LFwiMTBcIjoxOTYsXCIxMVwiOjIxOCxcIjEyXCI6ODMsXCIxM1wiOjY1LFwiMTRcIjoyMjgsXCIxNVwiOjE5MSxcIjE2XCI6NDAsXCIxN1wiOjIwNSxcIjE4XCI6NjAsXCIxOVwiOjk3LFwiMjBcIjoxOSxcIjIxXCI6OTEsXCIyMlwiOjIzMyxcIjIzXCI6MTkxLFwiMjRcIjoyMjYsXCIyNVwiOjE2NSxcIjI2XCI6MTk0LFwiMjdcIjo0LFwiMjhcIjo4MixcIjI5XCI6OCxcIjMwXCI6MTgyLFwiMzFcIjoxOTEsXCIzMlwiOjM5LFwiMzNcIjoyMzYsXCIzNFwiOjE2MyxcIjM1XCI6ODQsXCIzNlwiOjU3LFwiMzdcIjoxODAsXCIzOFwiOjE4OSxcIjM5XCI6NjMsXCI0MFwiOjE2OSxcIjQxXCI6MTkwLFwiNDJcIjoxOCxcIjQzXCI6NDMsXCI0NFwiOjY0LFwiNDVcIjoyNDQsXCI0NlwiOjE1NyxcIjQ3XCI6NjMsXCI0OFwiOjIyMCxcIjQ5XCI6MjM0LFwiNTBcIjoyMjksXCI1MVwiOjQwLFwiNTJcIjoxMTcsXCI1M1wiOjQ4LFwiNTRcIjoxNjMsXCI1NVwiOjE5MSxcIjU2XCI6MjEsXCI1N1wiOjM3LFwiNThcIjoyMDUsXCI1OVwiOjEwMCxcIjYwXCI6MTM2LFwiNjFcIjo1NSxcIjYyXCI6MjI3LFwiNjNcIjoxOTEsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjowLjQyMjc3NDM4ODU1MTgwNDA1LFwiMVwiOjEuNDEzODY4ODE0MzA2MDE0NSxcIjJcIjotMC4zNzc4NTQ3NDE1MDMyMTY2LFwiM1wiOi0wLjAxMjAyMzA0OTQ5MzMyMjY1MSxcIjRcIjowLjExODI1MjI0NTI2NDc5ODI5LFwiNVwiOi0wLjQ0MzQ4MTk5MTgyNTEzMDYsXCI2XCI6LTAuNjc3Mjk3NDQzMjU3MjYzNSxcIjdcIjotMC4xNDc0MTE2MzEyMzkyNzA5MixcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjo1NixcIjFcIjoxNjYsXCIyXCI6MjYsXCIzXCI6NzksXCI0XCI6MTg4LFwiNVwiOjE0LFwiNlwiOjIxOSxcIjdcIjo2MyxcIjhcIjo2OCxcIjlcIjoxMTcsXCIxMFwiOjIyOCxcIjExXCI6MjMxLFwiMTJcIjo1MixcIjEzXCI6MTU5LFwiMTRcIjoyNDYsXCIxNVwiOjYzLFwiMTZcIjo1MyxcIjE3XCI6NjksXCIxOFwiOjg5LFwiMTlcIjoxNjcsXCIyMFwiOjE5NyxcIjIxXCI6NDYsXCIyMlwiOjIxNixcIjIzXCI6MTkxLFwiMjRcIjoxMTgsXCIyNVwiOjIyNCxcIjI2XCI6MjQ5LFwiMjdcIjo5OCxcIjI4XCI6MTM4LFwiMjlcIjoxNTksXCIzMFwiOjEzNixcIjMxXCI6MTkxLFwiMzJcIjoyMjUsXCIzM1wiOjY3LFwiMzRcIjoyMyxcIjM1XCI6MTE4LFwiMzZcIjoxOTksXCIzN1wiOjY5LFwiMzhcIjoxOTAsXCIzOVwiOjYzLFwiNDBcIjoxMjYsXCI0MVwiOjYzLFwiNDJcIjoyMDgsXCI0M1wiOjc0LFwiNDRcIjoyLFwiNDVcIjo5OCxcIjQ2XCI6MjIwLFwiNDdcIjoxOTEsXCI0OFwiOjM1LFwiNDlcIjoxMzgsXCI1MFwiOjE0LFwiNTFcIjoxNzYsXCI1MlwiOjEwNyxcIjUzXCI6MTcyLFwiNTRcIjoyMjksXCI1NVwiOjE5MSxcIjU2XCI6MjA0LFwiNTdcIjoxMjgsXCI1OFwiOjE1NixcIjU5XCI6OTksXCI2MFwiOjk4LFwiNjFcIjoyMjIsXCI2MlwiOjE5NCxcIjYzXCI6MTkxLFwiYnl0ZUxlbmd0aFwiOjY0fSxcImxlbmd0aFwiOjgsXCJieXRlT2Zmc2V0XCI6MCxcImJ5dGVMZW5ndGhcIjo2NH19LHtcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6MS4xOTkzNjcwNDIwMTQ2ODc0LFwiMVwiOjAuMzIyMzQzMTA5NjE5MjcxNSxcIjJcIjotMC4zNjg2MTQwMDA0Nzc5ODIwNCxcIjNcIjotMC4wODAzODI5NDIzMzcxNzYxMixcIjRcIjowLjI3MTEyMTA3NzUyMDU0MTgsXCI1XCI6MC40Mjg3OTE2OTgyNzkxODU5NSxcIjZcIjowLjYzNzYwODU2NTY5ODMwNDUsXCI3XCI6MC4wMzc1NjAyODI1MzI1OTgyNCxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjo3MixcIjFcIjoxNjcsXCIyXCI6MjEzLFwiM1wiOjEyNixcIjRcIjoxNTUsXCI1XCI6NDgsXCI2XCI6MjQzLFwiN1wiOjYzLFwiOFwiOjU2LFwiOVwiOjI0NyxcIjEwXCI6MTIxLFwiMTFcIjoyNTQsXCIxMlwiOjY4LFwiMTNcIjoxNjEsXCIxNFwiOjIxMixcIjE1XCI6NjMsXCIxNlwiOjExMSxcIjE3XCI6MTY0LFwiMThcIjo1NyxcIjE5XCI6NDUsXCIyMFwiOjk1LFwiMjFcIjoxNTEsXCIyMlwiOjIxNSxcIjIzXCI6MTkxLFwiMjRcIjoxNjcsXCIyNVwiOjE0NixcIjI2XCI6MTI2LFwiMjdcIjoyNTIsXCIyOFwiOjI0OSxcIjI5XCI6MTQ3LFwiMzBcIjoxODAsXCIzMVwiOjE5MSxcIjMyXCI6MTU4LFwiMzNcIjo2MyxcIjM0XCI6NzcsXCIzNVwiOjU2LFwiMzZcIjoxMixcIjM3XCI6OTAsXCIzOFwiOjIwOSxcIjM5XCI6NjMsXCI0MFwiOjMyLFwiNDFcIjoyNDIsXCI0MlwiOjU3LFwiNDNcIjoxODgsXCI0NFwiOjgyLFwiNDVcIjoxMTMsXCI0NlwiOjIxOSxcIjQ3XCI6NjMsXCI0OFwiOjE2MSxcIjQ5XCI6OTEsXCI1MFwiOjQyLFwiNTFcIjoyMCxcIjUyXCI6NzQsXCI1M1wiOjEwMyxcIjU0XCI6MjI4LFwiNTVcIjo2MyxcIjU2XCI6MTI3LFwiNTdcIjo3MyxcIjU4XCI6NTQsXCI1OVwiOjI0MixcIjYwXCI6MjUsXCI2MVwiOjU5LFwiNjJcIjoxNjMsXCI2M1wiOjYzLFwiYnl0ZUxlbmd0aFwiOjY0fSxcImxlbmd0aFwiOjgsXCJieXRlT2Zmc2V0XCI6MCxcImJ5dGVMZW5ndGhcIjo2NH19LHtcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6MC4xMzk2NzQwMjU4MzQzMDE0NCxcIjFcIjotMC4xMTM1Nzg1MDM2NjgwMjQyNCxcIjJcIjotMC41NzQ2NjEwODI3NjI3OTY3LFwiM1wiOi0wLjU3MTc1ODI4NzU4ODQ1MjIsXCI0XCI6LTAuMTg5ODU3NjkyODkyMjEzOCxcIjVcIjotMC4xODY1NzM5ODcwMjMwNjMzNSxcIjZcIjowLjcxNjU4ODQwMDUzMzkxMDYsXCI3XCI6LTAuNjIyNDI0OTU5MzUzMTc0MSxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoyMDAsXCIxXCI6MTQwLFwiMlwiOjEzNSxcIjNcIjoxNjYsXCI0XCI6MjE0LFwiNVwiOjIyNCxcIjZcIjoxOTMsXCI3XCI6NjMsXCI4XCI6NzIsXCI5XCI6MTAwLFwiMTBcIjoyMDAsXCIxMVwiOjIyLFwiMTJcIjoxMjMsXCIxM1wiOjE5LFwiMTRcIjoxODksXCIxNVwiOjE5MSxcIjE2XCI6ODIsXCIxN1wiOjEsXCIxOFwiOjE1MixcIjE5XCI6MTYzLFwiMjBcIjoxNTksXCIyMVwiOjk5LFwiMjJcIjoyMjYsXCIyM1wiOjE5MSxcIjI0XCI6MTMyLFwiMjVcIjoyNSxcIjI2XCI6NzcsXCIyN1wiOjksXCIyOFwiOjIxNixcIjI5XCI6NzUsXCIzMFwiOjIyNixcIjMxXCI6MTkxLFwiMzJcIjo5NyxcIjMzXCI6MjE5LFwiMzRcIjoyMzgsXCIzNVwiOjE5NCxcIjM2XCI6NjUsXCIzN1wiOjc3LFwiMzhcIjoyMDAsXCIzOVwiOjE5MSxcIjQwXCI6MTI3LFwiNDFcIjo0OSxcIjQyXCI6NzAsXCI0M1wiOjEwLFwiNDRcIjoxNjgsXCI0NVwiOjIyNSxcIjQ2XCI6MTk5LFwiNDdcIjoxOTEsXCI0OFwiOjIzLFwiNDlcIjoxNDIsXCI1MFwiOjMxLFwiNTFcIjoyMDQsXCI1MlwiOjc0LFwiNTNcIjoyMzgsXCI1NFwiOjIzMCxcIjU1XCI6NjMsXCI1NlwiOjU0LFwiNTdcIjo5MCxcIjU4XCI6MTQ4LFwiNTlcIjoxOTEsXCI2MFwiOjIzMSxcIjYxXCI6MjM0LFwiNjJcIjoyMjcsXCI2M1wiOjE5MSxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fV0sXCJiaWFzZXNcIjp7XCJzeFwiOjEsXCJzeVwiOjEsXCJkZXB0aFwiOjgsXCJ3XCI6e1wiMFwiOjAuMjU2MjA0OTI1NDE5MDExNSxcIjFcIjotMC41NDU1MzkzMDgxODAyNzI5LFwiMlwiOjAuMTA5MDM3MjY5ODA2NDM5NjIsXCIzXCI6LTAuMTYzNTU5NTQ3Njk1NDE1NzIsXCI0XCI6MC4wODk5MjExNzg4NDY3Mzk3NSxcIjVcIjowLjUxODU2MjI1MTI4NDQyMzIsXCI2XCI6LTAuNDYwNzM1NjI0MzcwNzE2NjMsXCI3XCI6MC4zODUwOTY0NzU1OTgxMTAxNyxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoyMzIsXCIxXCI6MjM1LFwiMlwiOjIzOSxcIjNcIjo4NyxcIjRcIjoxNjksXCI1XCI6MTAxLFwiNlwiOjIwOCxcIjdcIjo2MyxcIjhcIjoxODIsXCI5XCI6MzQsXCIxMFwiOjIzNCxcIjExXCI6MjE3LFwiMTJcIjoxNCxcIjEzXCI6MTE3LFwiMTRcIjoyMjUsXCIxNVwiOjE5MSxcIjE2XCI6MjcsXCIxN1wiOjMzLFwiMThcIjoyMjEsXCIxOVwiOjIxMSxcIjIwXCI6MjIxLFwiMjFcIjoyMzMsXCIyMlwiOjE4NyxcIjIzXCI6NjMsXCIyNFwiOjczLFwiMjVcIjoxMTQsXCIyNlwiOjM4LFwiMjdcIjoyMzgsXCIyOFwiOjEzMixcIjI5XCI6MjM5LFwiMzBcIjoxOTYsXCIzMVwiOjE5MSxcIjMyXCI6MjA2LFwiMzNcIjo4MCxcIjM0XCI6OTMsXCIzNVwiOjEwLFwiMzZcIjoxOSxcIjM3XCI6NSxcIjM4XCI6MTgzLFwiMzlcIjo2MyxcIjQwXCI6MTQwLFwiNDFcIjoxNTcsXCI0MlwiOjE5OCxcIjQzXCI6MjIwLFwiNDRcIjoxNSxcIjQ1XCI6MTUyLFwiNDZcIjoyMjQsXCI0N1wiOjYzLFwiNDhcIjo2NSxcIjQ5XCI6MTQzLFwiNTBcIjoxNzcsXCI1MVwiOjY5LFwiNTJcIjoxNzcsXCI1M1wiOjEyNCxcIjU0XCI6MjIxLFwiNTVcIjoxOTEsXCI1NlwiOjExMyxcIjU3XCI6MjM1LFwiNThcIjozMSxcIjU5XCI6MTc2LFwiNjBcIjoxMDcsXCI2MVwiOjE2NSxcIjYyXCI6MjE2LFwiNjNcIjo2MyxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fX0se1wib3V0X2RlcHRoXCI6OCxcIm91dF9zeFwiOjEsXCJvdXRfc3lcIjoxLFwibGF5ZXJfdHlwZVwiOlwidGFuaFwifSx7XCJvdXRfZGVwdGhcIjo4LFwib3V0X3N4XCI6MSxcIm91dF9zeVwiOjEsXCJsYXllcl90eXBlXCI6XCJmY1wiLFwibnVtX2lucHV0c1wiOjgsXCJsMV9kZWNheV9tdWxcIjowLFwibDJfZGVjYXlfbXVsXCI6MSxcImZpbHRlcnNcIjpbe1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjotMC4zODgzMjgyNDYxMTQxOTYxNCxcIjFcIjowLjUzMzEyMDc3MTA2OTAxMjEsXCIyXCI6LTAuMTY5NTgwMTMyNTI0NzE4NzQsXCIzXCI6LTAuMDM3NjM4MDAyMzAzMzAwMjYsXCI0XCI6LTAuMzAyNzcxNTI3NzE2NTExNjcsXCI1XCI6LTAuMDM4OTkyMzU3OTE3NTM3NTQsXCI2XCI6MC40ODQwNTc5MjQxNDI2MDI3LFwiN1wiOi0wLjU0MTYzNDIwMzI3Njk1NDQsXCJCWVRFU19QRVJfRUxFTUVOVFwiOjgsXCJidWZmZXJcIjp7XCIwXCI6MjA4LFwiMVwiOjI2LFwiMlwiOjc1LFwiM1wiOjE4MyxcIjRcIjo5NCxcIjVcIjoyMTgsXCI2XCI6MjE2LFwiN1wiOjE5MSxcIjhcIjozNyxcIjlcIjoyMzMsXCIxMFwiOjE0NSxcIjExXCI6NzQsXCIxMlwiOjgzLFwiMTNcIjoxNSxcIjE0XCI6MjI1LFwiMTVcIjo2MyxcIjE2XCI6MTQ5LFwiMTdcIjo5MixcIjE4XCI6MTU5LFwiMTlcIjo2NSxcIjIwXCI6MjA1LFwiMjFcIjoxODAsXCIyMlwiOjE5NyxcIjIzXCI6MTkxLFwiMjRcIjoyOSxcIjI1XCI6MTIyLFwiMjZcIjoyNDUsXCIyN1wiOjIwMSxcIjI4XCI6NzMsXCIyOVwiOjY5LFwiMzBcIjoxNjMsXCIzMVwiOjE5MSxcIjMyXCI6MTgzLFwiMzNcIjoyNDMsXCIzNFwiOjEwOCxcIjM1XCI6MjEyLFwiMzZcIjoxNTUsXCIzN1wiOjk2LFwiMzhcIjoyMTEsXCIzOVwiOjE5MSxcIjQwXCI6MjI2LFwiNDFcIjoxMjAsXCI0MlwiOjI1LFwiNDNcIjoxMDgsXCI0NFwiOjIwNixcIjQ1XCI6MjQ2LFwiNDZcIjoxNjMsXCI0N1wiOjE5MSxcIjQ4XCI6MjI5LFwiNDlcIjoyNDksXCI1MFwiOjk5LFwiNTFcIjoyMixcIjUyXCI6MjA2LFwiNTNcIjoyNTAsXCI1NFwiOjIyMixcIjU1XCI6NjMsXCI1NlwiOjExMSxcIjU3XCI6NixcIjU4XCI6MTc1LFwiNTlcIjo2NCxcIjYwXCI6MTcsXCI2MVwiOjg1LFwiNjJcIjoyMjUsXCI2M1wiOjE5MSxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fSx7XCJzeFwiOjEsXCJzeVwiOjEsXCJkZXB0aFwiOjgsXCJ3XCI6e1wiMFwiOi0wLjExNDM5NDA3NjMyMjcwNjMyLFwiMVwiOi0xLjI4MTk4OTA4ODYzMjc5NjMsXCIyXCI6MC4xNDYzNDEwNjM5NTEzNjI3MyxcIjNcIjowLjE0MzA0Mzk1MDMyODc1MTY0LFwiNFwiOjAuMjI5NzMyNzY0NzYwMDc2NSxcIjVcIjowLjQzNDg3MjU2MzQxNTc3NDIsXCI2XCI6LTAuMjY0MTY0MjU4MTI0MTI2ODYsXCI3XCI6MC4wNTg0NTM4MTE3OTY4OTk0ODUsXCJCWVRFU19QRVJfRUxFTUVOVFwiOjgsXCJidWZmZXJcIjp7XCIwXCI6MTk2LFwiMVwiOjEzMCxcIjJcIjoxNjksXCIzXCI6MzIsXCI0XCI6MjM4LFwiNVwiOjcyLFwiNlwiOjE4OSxcIjdcIjoxOTEsXCI4XCI6MTE5LFwiOVwiOjI3LFwiMTBcIjoxNTIsXCIxMVwiOjI1MyxcIjEyXCI6NixcIjEzXCI6MTMxLFwiMTRcIjoyNDQsXCIxNVwiOjE5MSxcIjE2XCI6NTcsXCIxN1wiOjIwOSxcIjE4XCI6MjIxLFwiMTlcIjoyMDksXCIyMFwiOjc3LFwiMjFcIjoxODcsXCIyMlwiOjE5NCxcIjIzXCI6NjMsXCIyNFwiOjIwNSxcIjI1XCI6MTg4LFwiMjZcIjo3MCxcIjI3XCI6MTYwLFwiMjhcIjo2NyxcIjI5XCI6NzksXCIzMFwiOjE5NCxcIjMxXCI6NjMsXCIzMlwiOjE0NyxcIjMzXCI6MTA2LFwiMzRcIjoxODcsXCIzNVwiOjI3LFwiMzZcIjoyMjYsXCIzN1wiOjEwMyxcIjM4XCI6MjA1LFwiMzlcIjo2MyxcIjQwXCI6MTQ4LFwiNDFcIjoyNSxcIjQyXCI6MTE1LFwiNDNcIjoxODcsXCI0NFwiOjI0MyxcIjQ1XCI6MjEyLFwiNDZcIjoyMTksXCI0N1wiOjYzLFwiNDhcIjoyMSxcIjQ5XCI6MTQ3LFwiNTBcIjo5MCxcIjUxXCI6NTIsXCI1MlwiOjE3LFwiNTNcIjoyMzIsXCI1NFwiOjIwOCxcIjU1XCI6MTkxLFwiNTZcIjoxODAsXCI1N1wiOjEwLFwiNThcIjoyNTMsXCI1OVwiOjExNSxcIjYwXCI6MTY4LFwiNjFcIjoyMzcsXCI2MlwiOjE3MyxcIjYzXCI6NjMsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjotMC4xNDA2ODgxOTE2NDg5MjQ3LFwiMVwiOjAuOTQwNTU3ODY2MDk2NTUwNyxcIjJcIjowLjAwNDkwMTg1ODAyNTUxODIzNCxcIjNcIjotMC4yMzI2NjQ1MzcyMDYyMzUzLFwiNFwiOi0wLjIxNDQ4NDIxNTAyMDAyNTc2LFwiNVwiOi0xLjA4OTM4OTgyMTM2ODMxNjQsXCI2XCI6LTAuMzc3ODI4MzA2Njc2NjMyMSxcIjdcIjotMC4zNzc0NzM4NTI5OTA2NDU5NSxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoxNzgsXCIxXCI6OTgsXCIyXCI6OCxcIjNcIjoyMyxcIjRcIjoxOCxcIjVcIjoyLFwiNlwiOjE5NCxcIjdcIjoxOTEsXCI4XCI6MjIxLFwiOVwiOjQyLFwiMTBcIjo5MixcIjExXCI6MjA3LFwiMTJcIjoxMixcIjEzXCI6MjUsXCIxNFwiOjIzOCxcIjE1XCI6NjMsXCIxNlwiOjI1NCxcIjE3XCI6NTgsXCIxOFwiOjE0MCxcIjE5XCI6MTI2LFwiMjBcIjoyNDgsXCIyMVwiOjE5LFwiMjJcIjoxMTYsXCIyM1wiOjYzLFwiMjRcIjo4MixcIjI1XCI6MTc2LFwiMjZcIjozMCxcIjI3XCI6MTUzLFwiMjhcIjoyNDMsXCIyOVwiOjE5OSxcIjMwXCI6MjA1LFwiMzFcIjoxOTEsXCIzMlwiOjEzOSxcIjMzXCI6MTE4LFwiMzRcIjoxMzAsXCIzNVwiOjAsXCIzNlwiOjU2LFwiMzdcIjoxMTYsXCIzOFwiOjIwMyxcIjM5XCI6MTkxLFwiNDBcIjoxMzcsXCI0MVwiOjI0NCxcIjQyXCI6MTE3LFwiNDNcIjo1LFwiNDRcIjozNixcIjQ1XCI6MTEwLFwiNDZcIjoyNDEsXCI0N1wiOjE5MSxcIjQ4XCI6MjMxLFwiNDlcIjoxMTksXCI1MFwiOjQzLFwiNTFcIjoxOTksXCI1MlwiOjg2LFwiNTNcIjo0NixcIjU0XCI6MjE2LFwiNTVcIjoxOTEsXCI1NlwiOjIzNCxcIjU3XCI6MzksXCI1OFwiOjEwOCxcIjU5XCI6MjMsXCI2MFwiOjEzNixcIjYxXCI6NDAsXCI2MlwiOjIxNixcIjYzXCI6MTkxLFwiYnl0ZUxlbmd0aFwiOjY0fSxcImxlbmd0aFwiOjgsXCJieXRlT2Zmc2V0XCI6MCxcImJ5dGVMZW5ndGhcIjo2NH19LHtcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6MC4zNzEwMzg0MDEwNjg5NTcxLFwiMVwiOi0wLjYxOTA4ODE2ODAxNzcsXCIyXCI6MC40MTE2Mjk0MTIyNTg2MTgyNyxcIjNcIjotMC41NDM2MTgxMjk3MjUyMjMsXCI0XCI6MC42MTYzMzMwMDkwMjU4NzE4LFwiNVwiOjAuNzk0OTExMDgwNjg5ODE2OCxcIjZcIjotMC43ODg0MDkwMDA3MTA0MTUyLFwiN1wiOjAuMzg0NzgwMTI1NjE4NzcyMjMsXCJCWVRFU19QRVJfRUxFTUVOVFwiOjgsXCJidWZmZXJcIjp7XCIwXCI6MjM5LFwiMVwiOjE3NCxcIjJcIjoxMzcsXCIzXCI6MjE3LFwiNFwiOjIzLFwiNVwiOjE5MSxcIjZcIjoyMTUsXCI3XCI6NjMsXCI4XCI6MjUsXCI5XCI6NjQsXCIxMFwiOjk1LFwiMTFcIjoyNTMsXCIxMlwiOjE0NSxcIjEzXCI6MjA3LFwiMTRcIjoyMjcsXCIxNVwiOjE5MSxcIjE2XCI6MjMwLFwiMTdcIjo2MCxcIjE4XCI6MjM4LFwiMTlcIjoyMjcsXCIyMFwiOjM0LFwiMjFcIjo4OCxcIjIyXCI6MjE4LFwiMjNcIjo2MyxcIjI0XCI6NDksXCIyNVwiOjIxNSxcIjI2XCI6MjEsXCIyN1wiOjIxNyxcIjI4XCI6ODEsXCIyOVwiOjEwMSxcIjMwXCI6MjI1LFwiMzFcIjoxOTEsXCIzMlwiOjE4NixcIjMzXCI6MTk1LFwiMzRcIjoxNjYsXCIzNVwiOjAsXCIzNlwiOjAsXCIzN1wiOjE4NSxcIjM4XCI6MjI3LFwiMzlcIjo2MyxcIjQwXCI6MTgsXCI0MVwiOjc4LFwiNDJcIjoyMTcsXCI0M1wiOjkyLFwiNDRcIjoyMzMsXCI0NVwiOjExMSxcIjQ2XCI6MjMzLFwiNDdcIjo2MyxcIjQ4XCI6MTE4LFwiNDlcIjoxMzksXCI1MFwiOjYxLFwiNTFcIjoxMzEsXCI1MlwiOjE2NSxcIjUzXCI6NTgsXCI1NFwiOjIzMyxcIjU1XCI6MTkxLFwiNTZcIjoyMDUsXCI1N1wiOjE4OCxcIjU4XCI6MjM1LFwiNTlcIjoyMDksXCI2MFwiOjYwLFwiNjFcIjoxNjAsXCI2MlwiOjIxNixcIjYzXCI6NjMsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjowLjI3NDAwMDY3NTQ4OTM5OTksXCIxXCI6LTAuODU0NDE2ODU5NjUwODE5NSxcIjJcIjowLjA3Mzg3MTQ5NzgyNTE2MzQ2LFwiM1wiOi0wLjE4ODU0Njg0NDY3NzYwOTgyLFwiNFwiOjAuNTMwNjE2Mzg1MjExODU3NyxcIjVcIjowLjUyMTc1MTkzNTU2ODI1NDksXCI2XCI6LTAuMTY2NzI5MTc0ODY0ODY0OTcsXCI3XCI6MC4yMzMzNTU2Nzg5MzI3MTk3NyxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoxODIsXCIxXCI6MTk2LFwiMlwiOjE5LFwiM1wiOjMzLFwiNFwiOjU4LFwiNVwiOjEzNyxcIjZcIjoyMDksXCI3XCI6NjMsXCI4XCI6MjAwLFwiOVwiOjYxLFwiMTBcIjoxNzEsXCIxMVwiOjYsXCIxMlwiOjk4LFwiMTNcIjo4NyxcIjE0XCI6MjM1LFwiMTVcIjoxOTEsXCIxNlwiOjQxLFwiMTdcIjoyNTUsXCIxOFwiOjY3LFwiMTlcIjoxOSxcIjIwXCI6NjIsXCIyMVwiOjIzMyxcIjIyXCI6MTc4LFwiMjNcIjo2MyxcIjI0XCI6MjQzLFwiMjVcIjoxOTIsXCIyNlwiOjIxMSxcIjI3XCI6MTQ1LFwiMjhcIjo3NyxcIjI5XCI6MzQsXCIzMFwiOjIwMCxcIjMxXCI6MTkxLFwiMzJcIjo0LFwiMzNcIjoxNTcsXCIzNFwiOjE2NixcIjM1XCI6NTQsXCIzNlwiOjIwNyxcIjM3XCI6MjUwLFwiMzhcIjoyMjQsXCIzOVwiOjYzLFwiNDBcIjoyMDAsXCI0MVwiOjEyNSxcIjQyXCI6MTI0LFwiNDNcIjoyOSxcIjQ0XCI6NDksXCI0NVwiOjE3OCxcIjQ2XCI6MjI0LFwiNDdcIjo2MyxcIjQ4XCI6OTcsXCI0OVwiOjE4MSxcIjUwXCI6MTcwLFwiNTFcIjoxNzYsXCI1MlwiOjk3LFwiNTNcIjo4NyxcIjU0XCI6MTk3LFwiNTVcIjoxOTEsXCI1NlwiOjc5LFwiNTdcIjoxMSxcIjU4XCI6MTczLFwiNTlcIjo4MCxcIjYwXCI6MTUzLFwiNjFcIjoyMjIsXCI2MlwiOjIwNSxcIjYzXCI6NjMsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjotMC4xOTA2NjI2NzgxMzU3MzI1LFwiMVwiOjAuNDcwOTM4MTcwNzI0MTAzMyxcIjJcIjowLjI0MTYwOTE5NjIyNjkyODUzLFwiM1wiOjAuNjMxMTc1Nzc2OTg2NzA5MSxcIjRcIjotMC4zMjAzOTEzOTMxMTM4NTA3LFwiNVwiOi0wLjU4NzkzODcyMjgwNDYzNjQsXCI2XCI6MC4zOTM0NjA4NDY3ODczNDMxNyxcIjdcIjotMC4zNTYxMDE1NzkwMzA4Mzc0LFwiQllURVNfUEVSX0VMRU1FTlRcIjo4LFwiYnVmZmVyXCI6e1wiMFwiOjc4LFwiMVwiOjE0NyxcIjJcIjoxNDgsXCIzXCI6MTE5LFwiNFwiOjE2MixcIjVcIjoxMDMsXCI2XCI6MjAwLFwiN1wiOjE5MSxcIjhcIjoxMjMsXCI5XCI6MTczLFwiMTBcIjoxMDgsXCIxMVwiOjIxOCxcIjEyXCI6MjE3LFwiMTNcIjozNSxcIjE0XCI6MjIyLFwiMTVcIjo2MyxcIjE2XCI6MTMxLFwiMTdcIjoxNDMsXCIxOFwiOjI2LFwiMTlcIjoyMTQsXCIyMFwiOjEyLFwiMjFcIjoyMzcsXCIyMlwiOjIwNixcIjIzXCI6NjMsXCIyNFwiOjUsXCIyNVwiOjIzOCxcIjI2XCI6NSxcIjI3XCI6MTM5LFwiMjhcIjoxNTEsXCIyOVwiOjUwLFwiMzBcIjoyMjgsXCIzMVwiOjYzLFwiMzJcIjoyNDAsXCIzM1wiOjEsXCIzNFwiOjIxNCxcIjM1XCI6MjMwLFwiMzZcIjo3NCxcIjM3XCI6MTI5LFwiMzhcIjoyMTIsXCIzOVwiOjE5MSxcIjQwXCI6MjUyLFwiNDFcIjoyMzgsXCI0MlwiOjc5LFwiNDNcIjoyMjIsXCI0NFwiOjEwMCxcIjQ1XCI6MjA4LFwiNDZcIjoyMjYsXCI0N1wiOjE5MSxcIjQ4XCI6MTU0LFwiNDlcIjo4MSxcIjUwXCI6NzcsXCI1MVwiOjEwMyxcIjUyXCI6MTE4LFwiNTNcIjo0NixcIjU0XCI6MjE3LFwiNTVcIjo2MyxcIjU2XCI6NTAsXCI1N1wiOjExNSxcIjU4XCI6MjU1LFwiNTlcIjo3MCxcIjYwXCI6OTQsXCI2MVwiOjIwMixcIjYyXCI6MjE0LFwiNjNcIjoxOTEsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX0se1wic3hcIjoxLFwic3lcIjoxLFwiZGVwdGhcIjo4LFwid1wiOntcIjBcIjotMC4wNTIzMzIxMTk4MjE5MTY0NzYsXCIxXCI6MC41MDAwMTY3MDk2NzgxNzExLFwiMlwiOjAuMjYyNjY1Njg5MTEwNjI2OTMsXCIzXCI6MC4yNjUwNjUzNTI5NzYwMTgzNSxcIjRcIjotMC4yNTQ2MzI4NzI3NzA0OTkyMyxcIjVcIjowLjA4MjgyNjExMTc5MzA1MzkxLFwiNlwiOjAuOTM5NjE3OTkxMTgxMzU4NSxcIjdcIjotMC41NTQyODk5NzgxNDAwNDg3LFwiQllURVNfUEVSX0VMRU1FTlRcIjo4LFwiYnVmZmVyXCI6e1wiMFwiOjEwMixcIjFcIjoxODYsXCIyXCI6ODQsXCIzXCI6MTQyLFwiNFwiOjcwLFwiNVwiOjIwMyxcIjZcIjoxNzAsXCI3XCI6MTkxLFwiOFwiOjY2LFwiOVwiOjE3NCxcIjEwXCI6MjQwLFwiMTFcIjoxMCxcIjEyXCI6MzUsXCIxM1wiOjAsXCIxNFwiOjIyNCxcIjE1XCI6NjMsXCIxNlwiOjEzNixcIjE3XCI6MTg3LFwiMThcIjozMixcIjE5XCI6MTkyLFwiMjBcIjoxMzEsXCIyMVwiOjIwNyxcIjIyXCI6MjA4LFwiMjNcIjo2MyxcIjI0XCI6MTY1LFwiMjVcIjoxMDcsXCIyNlwiOjE0OSxcIjI3XCI6MTcxLFwiMjhcIjoyMTIsXCIyOVwiOjI0NixcIjMwXCI6MjA4LFwiMzFcIjo2MyxcIjMyXCI6MjM3LFwiMzNcIjo3NCxcIjM0XCI6NjYsXCIzNVwiOjE3MyxcIjM2XCI6MjMxLFwiMzdcIjo3NSxcIjM4XCI6MjA4LFwiMzlcIjoxOTEsXCI0MFwiOjEwLFwiNDFcIjoyNDAsXCI0MlwiOjEwMyxcIjQzXCI6MTQ1LFwiNDRcIjoyMyxcIjQ1XCI6NTIsXCI0NlwiOjE4MSxcIjQ3XCI6NjMsXCI0OFwiOjIwMCxcIjQ5XCI6MTA5LFwiNTBcIjoyMTksXCI1MVwiOjE5MSxcIjUyXCI6ODksXCI1M1wiOjE3LFwiNTRcIjoyMzgsXCI1NVwiOjYzLFwiNTZcIjo3LFwiNTdcIjoxNTAsXCI1OFwiOjE5LFwiNTlcIjo4NixcIjYwXCI6MTkwLFwiNjFcIjoxODgsXCI2MlwiOjIyNSxcIjYzXCI6MTkxLFwiYnl0ZUxlbmd0aFwiOjY0fSxcImxlbmd0aFwiOjgsXCJieXRlT2Zmc2V0XCI6MCxcImJ5dGVMZW5ndGhcIjo2NH19LHtcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6MC41MTgzNTczMzAwNjQ2Njc0LFwiMVwiOi0wLjgwODQyNzkzMDk5MzA5MjIsXCIyXCI6MC4xNzU2NDExNjg3ODc3MjExNSxcIjNcIjotMC40MTIwODM5MTk4ODA2MTE2LFwiNFwiOjAuNTc2MDQzNDg1NjQ1MjM0OSxcIjVcIjowLjM1NTc4NjM0OTEzOTUzMjA1LFwiNlwiOi0wLjM3MDU1NDg1OTk4MjIwNzgsXCI3XCI6MC40NDMwMDE3NzI5NTg4NjgwNixcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjoxOTUsXCIxXCI6MTYwLFwiMlwiOjEzNixcIjNcIjoyOCxcIjRcIjo5OCxcIjVcIjoxNTAsXCI2XCI6MjI0LFwiN1wiOjYzLFwiOFwiOjE0MixcIjlcIjo1NyxcIjEwXCI6MTUzLFwiMTFcIjo2NCxcIjEyXCI6MTY0LFwiMTNcIjoyMjIsXCIxNFwiOjIzMyxcIjE1XCI6MTkxLFwiMTZcIjoyNyxcIjE3XCI6MzQsXCIxOFwiOjIyNyxcIjE5XCI6MjMzLFwiMjBcIjoxMDQsXCIyMVwiOjEyMyxcIjIyXCI6MTk4LFwiMjNcIjo2MyxcIjI0XCI6MTkxLFwiMjVcIjoxNSxcIjI2XCI6MTk4LFwiMjdcIjo1OSxcIjI4XCI6MTQ5LFwiMjlcIjo5NSxcIjMwXCI6MjE4LFwiMzFcIjoxOTEsXCIzMlwiOjE3OSxcIjMzXCI6MTEzLFwiMzRcIjoxMjUsXCIzNVwiOjE5MSxcIjM2XCI6MjQyLFwiMzdcIjoxMTAsXCIzOFwiOjIyNixcIjM5XCI6NjMsXCI0MFwiOjE5OSxcIjQxXCI6MTg0LFwiNDJcIjoxMjIsXCI0M1wiOjI3LFwiNDRcIjo1MixcIjQ1XCI6MTk3LFwiNDZcIjoyMTQsXCI0N1wiOjYzLFwiNDhcIjoyMSxcIjQ5XCI6MjE0LFwiNTBcIjo2MyxcIjUxXCI6MTg3LFwiNTJcIjo0MyxcIjUzXCI6MTgzLFwiNTRcIjoyMTUsXCI1NVwiOjE5MSxcIjU2XCI6NDUsXCI1N1wiOjEwNixcIjU4XCI6MTg3LFwiNTlcIjoyNyxcIjYwXCI6MzYsXCI2MVwiOjkwLFwiNjJcIjoyMjAsXCI2M1wiOjYzLFwiYnl0ZUxlbmd0aFwiOjY0fSxcImxlbmd0aFwiOjgsXCJieXRlT2Zmc2V0XCI6MCxcImJ5dGVMZW5ndGhcIjo2NH19XSxcImJpYXNlc1wiOntcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6MC4wMTMxODc0NjM0NzY3MjYzMTMsXCIxXCI6LTAuMDA3NjMwNTIwMTI0NDI4NjE1LFwiMlwiOi0wLjI3MTQ0MTkwNDg4NDg5NDA2LFwiM1wiOi0wLjMwNDI5NTk1NzI2OTY4ODk0LFwiNFwiOi0wLjA1MDA0OTgxNzgzMjQ1MjI0LFwiNVwiOjAuMDcwMDM2NDE3NTM4MTk5NDcsXCI2XCI6LTAuMDkwOTM2ODY2OTM3NDczMjMsXCI3XCI6MC4wNTc1NzYxNDQ3NTM2NjgxNCxcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjo4MyxcIjFcIjo2NSxcIjJcIjoyMDQsXCIzXCI6OTgsXCI0XCI6NyxcIjVcIjoyLFwiNlwiOjEzOSxcIjdcIjo2MyxcIjhcIjoyMDAsXCI5XCI6MTU1LFwiMTBcIjo0NCxcIjExXCI6MzgsXCIxMlwiOjQ2LFwiMTNcIjo2NSxcIjE0XCI6MTI3LFwiMTVcIjoxOTEsXCIxNlwiOjIzNCxcIjE3XCI6MTY2LFwiMThcIjoxNSxcIjE5XCI6MjIyLFwiMjBcIjo3NyxcIjIxXCI6OTUsXCIyMlwiOjIwOSxcIjIzXCI6MTkxLFwiMjRcIjozMCxcIjI1XCI6MjA4LFwiMjZcIjo0OSxcIjI3XCI6MTkyLFwiMjhcIjoxNDksXCIyOVwiOjEyMSxcIjMwXCI6MjExLFwiMzFcIjoxOTEsXCIzMlwiOjM2LFwiMzNcIjoxODAsXCIzNFwiOjEzMyxcIjM1XCI6NTMsXCIzNlwiOjMzLFwiMzdcIjoxNjAsXCIzOFwiOjE2OSxcIjM5XCI6MTkxLFwiNDBcIjoxMjIsXCI0MVwiOjYsXCI0MlwiOjIxOSxcIjQzXCI6MjYsXCI0NFwiOjIzMixcIjQ1XCI6MjM3LFwiNDZcIjoxNzcsXCI0N1wiOjYzLFwiNDhcIjo3NyxcIjQ5XCI6NjksXCI1MFwiOjEyNyxcIjUxXCI6MTE3LFwiNTJcIjoxNjMsXCI1M1wiOjcxLFwiNTRcIjoxODMsXCI1NVwiOjE5MSxcIjU2XCI6NTAsXCI1N1wiOjg4LFwiNThcIjoxMjYsXCI1OVwiOjIxMyxcIjYwXCI6MTU4LFwiNjFcIjoxMjIsXCI2MlwiOjE3MyxcIjYzXCI6NjMsXCJieXRlTGVuZ3RoXCI6NjR9LFwibGVuZ3RoXCI6OCxcImJ5dGVPZmZzZXRcIjowLFwiYnl0ZUxlbmd0aFwiOjY0fX19LHtcIm91dF9kZXB0aFwiOjgsXCJvdXRfc3hcIjoxLFwib3V0X3N5XCI6MSxcImxheWVyX3R5cGVcIjpcInRhbmhcIn0se1wib3V0X2RlcHRoXCI6MixcIm91dF9zeFwiOjEsXCJvdXRfc3lcIjoxLFwibGF5ZXJfdHlwZVwiOlwiZmNcIixcIm51bV9pbnB1dHNcIjo4LFwibDFfZGVjYXlfbXVsXCI6MCxcImwyX2RlY2F5X211bFwiOjEsXCJmaWx0ZXJzXCI6W3tcInN4XCI6MSxcInN5XCI6MSxcImRlcHRoXCI6OCxcIndcIjp7XCIwXCI6MS4wMTcyNzMwMDE2NzM5NTA4LFwiMVwiOi0wLjEzMjIxMTM3NTgxNTcwODMzLFwiMlwiOjAuOTM5NTQ2NjIyMTY1NzAzOCxcIjNcIjotMS42MjUxODYwNjEwODgwNTY5LFwiNFwiOi0xLjIzODgzMDkxMzc4MDgwMTMsXCI1XCI6MC44NTMzODkwNjU0NjM2Mzk0LFwiNlwiOjAuNzY0OTE1MjEzMTI3ODY1OCxcIjdcIjotMS43OTA3MzEzODAyNjQ5NTU2LFwiQllURVNfUEVSX0VMRU1FTlRcIjo4LFwiYnVmZmVyXCI6e1wiMFwiOjE2NyxcIjFcIjoxNzcsXCIyXCI6MjAsXCIzXCI6MTQsXCI0XCI6MTkyLFwiNVwiOjcwLFwiNlwiOjI0MCxcIjdcIjo2MyxcIjhcIjozNyxcIjlcIjoyMDksXCIxMFwiOjE2NCxcIjExXCI6MTAzLFwiMTJcIjo3NyxcIjEzXCI6MjM2LFwiMTRcIjoxOTIsXCIxNVwiOjE5MSxcIjE2XCI6OTYsXCIxN1wiOjE1NSxcIjE4XCI6MjMyLFwiMTlcIjoxOSxcIjIwXCI6MTk2LFwiMjFcIjoxNixcIjIyXCI6MjM4LFwiMjNcIjo2MyxcIjI0XCI6MTg1LFwiMjVcIjoxNTYsXCIyNlwiOjEwMCxcIjI3XCI6MjUsXCIyOFwiOjE5NSxcIjI5XCI6MCxcIjMwXCI6MjUwLFwiMzFcIjoxOTEsXCIzMlwiOjE4OCxcIjMzXCI6MTAxLFwiMzRcIjo2MyxcIjM1XCI6OTMsXCIzNlwiOjY0LFwiMzdcIjoyMTAsXCIzOFwiOjI0MyxcIjM5XCI6MTkxLFwiNDBcIjo3NixcIjQxXCI6MTk3LFwiNDJcIjoyMjEsXCI0M1wiOjE0OSxcIjQ0XCI6MjQ2LFwiNDVcIjo3OCxcIjQ2XCI6MjM1LFwiNDdcIjo2MyxcIjQ4XCI6MTYsXCI0OVwiOjI3LFwiNTBcIjoxOSxcIjUxXCI6MTIwLFwiNTJcIjo0NyxcIjUzXCI6MTIyLFwiNTRcIjoyMzIsXCI1NVwiOjYzLFwiNTZcIjoyNDQsXCI1N1wiOjEzOCxcIjU4XCI6MTYyLFwiNTlcIjoyNDIsXCI2MFwiOjIxMyxcIjYxXCI6MTY2LFwiNjJcIjoyNTIsXCI2M1wiOjE5MSxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fSx7XCJzeFwiOjEsXCJzeVwiOjEsXCJkZXB0aFwiOjgsXCJ3XCI6e1wiMFwiOi0xLjI1MjI3MDUzMDU4MjQwMyxcIjFcIjowLjcyODUyNzA5OTk5NzY2MDYsXCIyXCI6MC4wMjM3OTg1NzY4MjgzOTAzMDMsXCIzXCI6MS4wNjQ0ODQ1MTk0NTQzNDUsXCI0XCI6MC4yNDYyODY3NTQ3ODgwODUsXCI1XCI6LTEuMjQ3NDM0MDM1NDI1MzM4MixcIjZcIjotMC4zMDUxNDkxOTUxNzI1ODM5LFwiN1wiOjEuNDE3Nzc4NTIwMTQ1MDU3MixcIkJZVEVTX1BFUl9FTEVNRU5UXCI6OCxcImJ1ZmZlclwiOntcIjBcIjo0MyxcIjFcIjoxMzcsXCIyXCI6MjMzLFwiM1wiOjIxMCxcIjRcIjo3NixcIjVcIjo5LFwiNlwiOjI0NCxcIjdcIjoxOTEsXCI4XCI6MTA1LFwiOVwiOjE3MSxcIjEwXCI6MTUxLFwiMTFcIjoxNixcIjEyXCI6MjQsXCIxM1wiOjgwLFwiMTRcIjoyMzEsXCIxNVwiOjYzLFwiMTZcIjoxNzIsXCIxN1wiOjg3LFwiMThcIjoxNzMsXCIxOVwiOjExNixcIjIwXCI6MTY3LFwiMjFcIjo5NCxcIjIyXCI6MTUyLFwiMjNcIjo2MyxcIjI0XCI6MTU0LFwiMjVcIjoxMjEsXCIyNlwiOjk4LFwiMjdcIjoyMzUsXCIyOFwiOjMyLFwiMjlcIjo4LFwiMzBcIjoyNDEsXCIzMVwiOjYzLFwiMzJcIjoxNjMsXCIzM1wiOjkxLFwiMzRcIjoxNjAsXCIzNVwiOjEwLFwiMzZcIjo4MyxcIjM3XCI6MTM0LFwiMzhcIjoyMDcsXCIzOVwiOjYzLFwiNDBcIjo0MyxcIjQxXCI6MjcsXCI0MlwiOjMzLFwiNDNcIjoxMDAsXCI0NFwiOjEyNSxcIjQ1XCI6MjQ1LFwiNDZcIjoyNDMsXCI0N1wiOjE5MSxcIjQ4XCI6MTU4LFwiNDlcIjoxNzUsXCI1MFwiOjEwNixcIjUxXCI6MTI1LFwiNTJcIjoxNDQsXCI1M1wiOjEzNSxcIjU0XCI6MjExLFwiNTVcIjoxOTEsXCI1NlwiOjE2NSxcIjU3XCI6MjMyLFwiNThcIjoxNDMsXCI1OVwiOjEzNSxcIjYwXCI6NTYsXCI2MVwiOjE3NSxcIjYyXCI6MjQ2LFwiNjNcIjo2MyxcImJ5dGVMZW5ndGhcIjo2NH0sXCJsZW5ndGhcIjo4LFwiYnl0ZU9mZnNldFwiOjAsXCJieXRlTGVuZ3RoXCI6NjR9fV0sXCJiaWFzZXNcIjp7XCJzeFwiOjEsXCJzeVwiOjEsXCJkZXB0aFwiOjIsXCJ3XCI6e1wiMFwiOi0wLjAwODc0NTY5MTI5NzgwMjAxNyxcIjFcIjowLjAwODc0NTY5MTI5NzgwMTc1LFwiQllURVNfUEVSX0VMRU1FTlRcIjo4LFwiYnVmZmVyXCI6e1wiMFwiOjcxLFwiMVwiOjI1MSxcIjJcIjoyMTQsXCIzXCI6MjA4LFwiNFwiOjY2LFwiNVwiOjIzMyxcIjZcIjoxMjksXCI3XCI6MTkxLFwiOFwiOjE3MyxcIjlcIjoyNTAsXCIxMFwiOjIxNCxcIjExXCI6MjA4LFwiMTJcIjo2NixcIjEzXCI6MjMzLFwiMTRcIjoxMjksXCIxNVwiOjYzLFwiYnl0ZUxlbmd0aFwiOjE2fSxcImxlbmd0aFwiOjIsXCJieXRlT2Zmc2V0XCI6MCxcImJ5dGVMZW5ndGhcIjoxNn19fSx7XCJvdXRfZGVwdGhcIjoyLFwib3V0X3N4XCI6MSxcIm91dF9zeVwiOjEsXCJsYXllcl90eXBlXCI6XCJzb2Z0bWF4XCIsXCJudW1faW5wdXRzXCI6Mn1dfTtcblxuZXhwb3J0IHtORVVSQUxfTkVUX1RSQUlORURfRk9SX1NUUk9LRV9FWFRSQUNUSU9OfTtcbiIsImltcG9ydCB7YXNzZXJ0fSBmcm9tICcvbGliL2Jhc2UnO1xuXG5jb25zdCB2b3dlbF90b190b25lID1cbiAgICB7MDogXCJhZWlvdcO8XCIsIDE6IFwixIHEk8SrxY3Fq8eWXCIsIDI6IFwiw6HDqcOtw7PDuseYXCIsIDM6IFwix47Em8eQx5LHlMeaXCIsIDQ6IFwiw6DDqMOsw7LDucecXCJ9O1xuXG5jb25zdCB0b2tlblNldCA9ICh0b2tlbnMpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIHRva2Vucy5zcGxpdCgnICcpLm1hcCgoeCkgPT4gcmVzdWx0W3hdID0gdHJ1ZSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IGNvbnNvbmFudHMgPSB0b2tlblNldCgnYiBwIG0gZiBkIHQgbiBsIGcgayBoIGogcSB4IHpoIGNoIHNoIHIgeiBjIHMgeSB3Jyk7XG5jb25zdCB2b3dlbHMgPSB0b2tlblNldCgnYSBhaSBhbiBhbmcgYW8gZSBlaSBlbiBlbmcgZXIgaSBpYSBpYW4gaWFuZyBpYW8gaWUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnaW4gaW5nIGlvIGlvbmcgaXUgbyBvbmcgb3UgdSB1YSB1YWkgdWFuIHVhbmcgdWUgdWkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAndW4gdW8gdiB2YW4gdm4nKTtcbmNvbnN0IHR3b19zeWxsYWJsZXMgPSB0b2tlblNldCgnaWEgaWFuIGlhbmcgaWFvIGllIGlvIGlvbmcgaXUgdWEgdWFpIHVhbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndWFuZyB1ZSB1aSB1byB2YW4nKTtcblxuY29uc3QgcGlueWluX3V0aWwgPSB7fTtcblxucGlueWluX3V0aWwuZHJvcFRvbmVzID0gKHBpbnlpbiwgYXBwZW5kX251bWJlcikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBpbnlpbi5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IG9wdGlvbiA9IDE7IG9wdGlvbiA8PSA0OyBvcHRpb24rKykge1xuICAgICAgY29uc3QgaW5kZXggPSB2b3dlbF90b190b25lW29wdGlvbl0uaW5kZXhPZihwaW55aW5baV0pO1xuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgY29uc3QgdG9uZWxlc3MgPSAnYWVpb3V2J1tpbmRleF07XG4gICAgICAgIHBpbnlpbiA9IHBpbnlpbi5zdWJzdHIoMCwgaSkgKyB0b25lbGVzcyArIHBpbnlpbi5zdWJzdHIoaSArIDEpO1xuICAgICAgICBpZiAoYXBwZW5kX251bWJlcikge1xuICAgICAgICAgIHJldHVybiBgJHtwaW55aW59JHtvcHRpb259YDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcGlueWluO1xufVxuXG5waW55aW5fdXRpbC5udW1iZXJlZFBpbnlpblRvVG9uZVBpbnlpbiA9IChudW1iZXJlZCkgPT4ge1xuICBhc3NlcnQobnVtYmVyZWQgJiYgbnVtYmVyZWQgPT09IG51bWJlcmVkLnRvTG93ZXJDYXNlKCkpO1xuICBsZXQgdG9uZSA9IDA7XG4gIGlmICgnMDEyMzQnLmluZGV4T2YobnVtYmVyZWRbbnVtYmVyZWQubGVuZ3RoIC0gMV0pID49IDApIHtcbiAgICB0b25lID0gcGFyc2VJbnQobnVtYmVyZWRbbnVtYmVyZWQubGVuZ3RoIC0gMV0sIDEwKTtcbiAgICBudW1iZXJlZCA9IG51bWJlcmVkLnN1YnN0cigwLCBudW1iZXJlZC5sZW5ndGggLSAxKTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlcmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yIChsZXQgb3B0aW9uID0gMTsgb3B0aW9uIDw9IDQ7IG9wdGlvbisrKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHZvd2VsX3RvX3RvbmVbb3B0aW9uXS5pbmRleE9mKG51bWJlcmVkW2ldKTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHRvbmUgPSBvcHRpb247XG4gICAgICAgIGNvbnN0IHRvbmVsZXNzID0gJ2FlaW91didbaW5kZXhdO1xuICAgICAgICBudW1iZXJlZCA9IG51bWJlcmVkLnN1YnN0cigwLCBpKSArIHRvbmVsZXNzICsgbnVtYmVyZWQuc3Vic3RyKGkgKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbGV0IGNvbnNvbmFudCA9ICcnO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IG51bWJlcmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gbnVtYmVyZWQuc3Vic3RyKDAsIGkpO1xuICAgIGlmIChjb25zb25hbnRzW2NhbmRpZGF0ZV0pIHtcbiAgICAgIGNvbnNvbmFudCA9IGNhbmRpZGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGxldCB2b3dlbCA9IG51bWJlcmVkLnN1YnN0cihjb25zb25hbnQubGVuZ3RoKTtcbiAgYXNzZXJ0KCghY29uc29uYW50IHx8IGNvbnNvbmFudHNbY29uc29uYW50XSkgJiYgdm93ZWxzW3Zvd2VsXSk7XG4gIGlmICh0d29fc3lsbGFibGVzW3Zvd2VsXSkge1xuICAgIGNvbnN0IGluZGV4ID0gJ2FlaW91dicuaW5kZXhPZih2b3dlbFsxXSk7XG4gICAgdm93ZWwgPSB2b3dlbFswXSArIHZvd2VsX3RvX3RvbmVbdG9uZV1baW5kZXhdICsgdm93ZWwuc3Vic3RyKDIpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluZGV4ID0gJ2FlaW91dicuaW5kZXhPZih2b3dlbFswXSk7XG4gICAgYXNzZXJ0KGluZGV4ID49IDApO1xuICAgIHZvd2VsID0gdm93ZWxfdG9fdG9uZVt0b25lXVtpbmRleF0gKyB2b3dlbC5zdWJzdHIoMSk7XG4gIH1cbiAgcmV0dXJuIGNvbnNvbmFudCArIHZvd2VsLnJlcGxhY2UoJ3YnLCAnw7wnKTtcbn1cblxucGlueWluX3V0aWwudG9uZVBpbnlpblRvTnVtYmVyZWRQaW55aW4gPSAodG9uZSkgPT4ge1xuICByZXR1cm4gcGlueWluX3V0aWwuZHJvcFRvbmVzKHRvbmUsIHRydWUgLyogYXBwZW5kX251bWJlciAqLyk7XG59XG5cbmV4cG9ydCB7cGlueWluX3V0aWx9O1xuIiwiaW1wb3J0IHthc3NlcnQsIEFuZ2xlLCBQb2ludH0gZnJvbSAnL2xpYi9iYXNlJztcbmltcG9ydCB7SHVuZ2FyaWFufSBmcm9tICcvbGliL2h1bmdhcmlhbic7XG5pbXBvcnQge3N2Z30gZnJvbSAnL2xpYi9zdmcnO1xuXG5jb25zdCBNQVhfQlJJREdFX0RJU1RBTkNFID0gNjQ7XG5jb25zdCBNSU5fQ09STkVSX0FOR0xFID0gMC4xKk1hdGguUEk7XG5jb25zdCBNSU5fQ09STkVSX1RBTkdFTlRfRElTVEFOQ0UgPSA0O1xuY29uc3QgUkVWRVJTQUxfUEVOQUxUWSA9IDAuNTtcblxuLy8gRXJyb3JzIG91dCBpZiB0aGUgYnJpZGdlcyBhcmUgaW52YWxpZCBpbiBzb21lIGdyb3NzIHdheS5cbmNvbnN0IGNoZWNrQnJpZGdlID0gKGJyaWRnZSkgPT4ge1xuICBhc3NlcnQoUG9pbnQudmFsaWQoYnJpZGdlWzBdKSAmJiBQb2ludC52YWxpZChicmlkZ2VbMV0pKTtcbiAgYXNzZXJ0KCFQb2ludC5lcXVhbChicmlkZ2VbMF0sIGJyaWRnZVsxXSkpO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBsaXN0IG9mIGJyaWRnZXMgb24gdGhlIHBhdGggd2l0aCB0aGUgZ2l2ZW4gZW5kcG9pbnRzLiBXZSBzdHJpcFxuLy8gbmVhcmx5IGFsbCBvZiB0aGUgbWV0YWRhdGEgb3V0IG9mIHRoaXMgbGlzdCB0byBtYWtlIGl0IGVhc3kgdG8gaGFuZC1jb3JyZWN0LlxuLy8gVGhlIGxpc3QgdGhhdCB3ZSByZXR1cm4gaXMgc2ltcGx5IGEgbGlzdCBvZiBwYWlycyBvZiBwb2ludHMuXG5jb25zdCBnZXRCcmlkZ2VzID0gKGVuZHBvaW50cywgY2xhc3NpZmllcikgPT4ge1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgY29uc3QgY29ybmVycyA9IGVuZHBvaW50cy5maWx0ZXIoKHgpID0+IHguY29ybmVyKTtcbiAgY29uc3QgbWF0Y2hpbmcgPSBtYXRjaENvcm5lcnMoY29ybmVycywgY2xhc3NpZmllcik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29ybmVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGogPSBtYXRjaGluZ1tpXTtcbiAgICBpZiAoaiA8PSBpICYmIG1hdGNoaW5nW2pdID09PSBpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goW1BvaW50LmNsb25lKGNvcm5lcnNbaV0ucG9pbnQpLCBQb2ludC5jbG9uZShjb3JuZXJzW2pdLnBvaW50KV0pO1xuICB9XG4gIHJlc3VsdC5tYXAoY2hlY2tCcmlkZ2UpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBSZXR1cm5zIGEgbGlzdCBvZiBhbmdsZSBhbmQgZGlzdGFuY2UgZmVhdHVyZXMgYmV0d2VlbiB0d28gY29ybmVycy5cbmNvbnN0IGdldEZlYXR1cmVzID0gKGlucywgb3V0KSA9PiB7XG4gIGNvbnN0IGRpZmYgPSBQb2ludC5zdWJ0cmFjdChvdXQucG9pbnQsIGlucy5wb2ludCk7XG4gIGNvbnN0IHRyaXZpYWwgPSBQb2ludC5lcXVhbChkaWZmLCBbMCwgMF0pO1xuICBjb25zdCBhbmdsZSA9IE1hdGguYXRhbjIoZGlmZlsxXSwgZGlmZlswXSk7XG4gIGNvbnN0IGRpc3RhbmNlID0gTWF0aC5zcXJ0KFBvaW50LmRpc3RhbmNlMihvdXQucG9pbnQsIGlucy5wb2ludCkpO1xuICByZXR1cm4gW1xuICAgIEFuZ2xlLnN1YnRyYWN0KGFuZ2xlLCBpbnMuYW5nbGVzWzBdKSxcbiAgICBBbmdsZS5zdWJ0cmFjdChvdXQuYW5nbGVzWzFdLCBhbmdsZSksXG4gICAgQW5nbGUuc3VidHJhY3QoaW5zLmFuZ2xlc1sxXSwgYW5nbGUpLFxuICAgIEFuZ2xlLnN1YnRyYWN0KGFuZ2xlLCBvdXQuYW5nbGVzWzBdKSxcbiAgICBBbmdsZS5zdWJ0cmFjdChpbnMuYW5nbGVzWzFdLCBpbnMuYW5nbGVzWzBdKSxcbiAgICBBbmdsZS5zdWJ0cmFjdChvdXQuYW5nbGVzWzFdLCBvdXQuYW5nbGVzWzBdKSxcbiAgICAodHJpdmlhbCA/IDEgOiAwKSxcbiAgICBkaXN0YW5jZS9NQVhfQlJJREdFX0RJU1RBTkNFLFxuICBdO1xufVxuXG4vLyBBIGhhbmQtdHVuZWQgY2xhc3NpZmllciB0aGF0IHVzZXMgdGhlIGZlYXR1cmVzIGFib3ZlIHRvIHJldHVybiBhIHNjb3JlIGZvclxuLy8gY29ubmVjdGluZyB0d28gY29ybmVycyBieSBhIGJyaWRnZS4gVGhpcyBjbGFzc2lmaWVyIHRocm93cyBvdXQgbW9zdCBkYXRhLlxuY29uc3QgaGFuZFR1bmVkQ2xhc3NpZmllciA9IChmZWF0dXJlcykgPT4ge1xuICBpZiAoZmVhdHVyZXNbNl0gPiAwKSB7XG4gICAgcmV0dXJuIC1BbmdsZS5wZW5hbHR5KGZlYXR1cmVzWzRdKTtcbiAgfVxuICBsZXQgYW5nbGVfcGVuYWx0eSA9IEFuZ2xlLnBlbmFsdHkoZmVhdHVyZXNbMF0pICsgQW5nbGUucGVuYWx0eShmZWF0dXJlc1sxXSk7XG4gIGNvbnN0IGRpc3RhbmNlX3BlbmFsdHkgPSBmZWF0dXJlc1s3XTtcbiAgaWYgKGZlYXR1cmVzWzBdID4gMCAmJiBmZWF0dXJlc1sxXSA+IDAgJiZcbiAgICAgIGZlYXR1cmVzWzJdICsgZmVhdHVyZXNbM10gPCAtMC41Kk1hdGguUEkpIHtcbiAgICBhbmdsZV9wZW5hbHR5ID0gYW5nbGVfcGVuYWx0eS8xNjtcbiAgfVxuICByZXR1cm4gLShhbmdsZV9wZW5hbHR5ICsgZGlzdGFuY2VfcGVuYWx0eSk7XG59XG5cbi8vIFRha2VzIGEgbGlzdCBvZiBjb3JuZXJzIGFuZCByZXR1cm5zIGEgYmlwYXJ0aXRlIG1hdGNoaW5nIGJldHdlZW4gdGhlbS5cbi8vIElmIG1hdGNoaW5nW2ldID09PSBqLCB0aGVuIGNvcm5lcnNbaV0gaXMgbWF0Y2hlZCB3aXRoIGNvcm5lcnNbal0gLSB0aGF0IGlzLFxuLy8gd2Ugc2hvdWxkIGNvbnN0cnVjdCBhIGJyaWRnZSBmcm9tIGNvcm5lcnNbaV0ucG9pbnQgdG8gY29ybmVyc1tqXS5wb2ludC5cbmNvbnN0IG1hdGNoQ29ybmVycyA9IChjb3JuZXJzLCBjbGFzc2lmaWVyKSA9PiB7XG4gIGNvbnN0IG1hdHJpeCA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvcm5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICBtYXRyaXgucHVzaChbXSk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb3JuZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICBtYXRyaXhbaV0ucHVzaChzY29yZUNvcm5lcnMoY29ybmVyc1tpXSwgY29ybmVyc1tqXSwgY2xhc3NpZmllcikpO1xuICAgIH1cbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvcm5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvcm5lcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHJldmVyc2VkX3Njb3JlID0gbWF0cml4W2pdW2ldIC0gUkVWRVJTQUxfUEVOQUxUWTtcbiAgICAgIGlmIChyZXZlcnNlZF9zY29yZSA+IG1hdHJpeFtpXVtqXSkge1xuICAgICAgICBtYXRyaXhbaV1bal0gPSByZXZlcnNlZF9zY29yZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChuZXcgSHVuZ2FyaWFuKG1hdHJpeCkpLnhfbWF0Y2g7XG59XG5cbi8vIFRha2VzIHR3byBjb3JuZXJzIGFuZCByZXR1cm5zIHRoZSBzY29yZSBhc3NpZ25lZCB0byBjb25zdHJ1Y3RpbmcgYSBicmlkZ2Vcbi8vIGZyb20gb25lIGNvcm5lciB0byB0aGUgb3RoZXIuIFRoZSBzY29yZSBpcyBkaXJlY3RlZDogdGhlIGJyaWRnZSBmcm9tIGlucyB0b1xuLy8gb3V0IG1heSBiZSB3ZWlnaHRlZCBoaWdoZXIgdGhhbiBmcm9tIG91dCB0byBpbnMuXG5jb25zdCBzY29yZUNvcm5lcnMgPSAoaW5zLCBvdXQsIGNsYXNzaWZpZXIpID0+IHtcbiAgcmV0dXJuIGNsYXNzaWZpZXIoZ2V0RmVhdHVyZXMoaW5zLCBvdXQpKTtcbn1cblxuLy8gU3RvcmVzIGFuZ2xlIGFuZCBkaXN0YW5jZSBtZXRhZGF0YSBhcm91bmQgYW4gU1ZHIHBhdGggc2VnbWVudCdzIHN0YXJ0IHBvaW50LlxuLy8gVGhpcyBlbmRwb2ludCBtYXkgYmUgYSAnY29ybmVyJywgd2hpY2ggaXMgdHJ1ZSBpZiB0aGUgcGF0aCBiZW5kcyBzaGFycGx5IGluXG4vLyB0aGUgbmVnYXRpdmUgKGNsb2Nrd2lzZSkgZGlyZWN0aW9uIGF0IHRoYXQgcG9pbnQuXG5mdW5jdGlvbiBFbmRwb2ludChwYXRocywgaW5kZXgpIHtcbiAgdGhpcy5pbmRleCA9IGluZGV4O1xuICBjb25zdCBwYXRoID0gcGF0aHNbaW5kZXhbMF1dO1xuICBjb25zdCBuID0gcGF0aC5sZW5ndGg7XG4gIHRoaXMuaW5kaWNlcyA9IFtbaW5kZXhbMF0sIChpbmRleFsxXSArIG4gLSAxKSAlIG5dLCBpbmRleF07XG4gIHRoaXMuc2VnbWVudHMgPSBbcGF0aFsoaW5kZXhbMV0gKyBuIC0gMSkgJSBuXSwgcGF0aFtpbmRleFsxXV1dO1xuICB0aGlzLnBvaW50ID0gdGhpcy5zZWdtZW50c1swXS5lbmQ7XG4gIGFzc2VydChQb2ludC52YWxpZCh0aGlzLnBvaW50KSwgdGhpcy5wb2ludCk7XG4gIGFzc2VydChQb2ludC5lcXVhbCh0aGlzLnBvaW50LCB0aGlzLnNlZ21lbnRzWzFdLnN0YXJ0KSwgcGF0aCk7XG4gIHRoaXMudGFuZ2VudHMgPSBbXG4gICAgUG9pbnQuc3VidHJhY3QodGhpcy5zZWdtZW50c1swXS5lbmQsIHRoaXMuc2VnbWVudHNbMF0uc3RhcnQpLFxuICAgIFBvaW50LnN1YnRyYWN0KHRoaXMuc2VnbWVudHNbMV0uZW5kLCB0aGlzLnNlZ21lbnRzWzFdLnN0YXJ0KSxcbiAgXTtcbiAgY29uc3QgdGhyZXNob2xkID0gTWF0aC5wb3coTUlOX0NPUk5FUl9UQU5HRU5UX0RJU1RBTkNFLCAyKTtcbiAgaWYgKHRoaXMuc2VnbWVudHNbMF0uY29udHJvbCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBQb2ludC5kaXN0YW5jZTIodGhpcy5wb2ludCwgdGhpcy5zZWdtZW50c1swXS5jb250cm9sKSA+IHRocmVzaG9sZCkge1xuICAgIHRoaXMudGFuZ2VudHNbMF0gPSBQb2ludC5zdWJ0cmFjdCh0aGlzLnBvaW50LCB0aGlzLnNlZ21lbnRzWzBdLmNvbnRyb2wpO1xuICB9XG4gIGlmICh0aGlzLnNlZ21lbnRzWzFdLmNvbnRyb2wgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgUG9pbnQuZGlzdGFuY2UyKHRoaXMucG9pbnQsIHRoaXMuc2VnbWVudHNbMV0uY29udHJvbCkgPiB0aHJlc2hvbGQpIHtcbiAgICB0aGlzLnRhbmdlbnRzWzFdID0gUG9pbnQuc3VidHJhY3QodGhpcy5zZWdtZW50c1sxXS5jb250cm9sLCB0aGlzLnBvaW50KTtcbiAgfVxuICB0aGlzLmFuZ2xlcyA9IHRoaXMudGFuZ2VudHMubWFwKFBvaW50LmFuZ2xlKTtcbiAgY29uc3QgZGlmZiA9IEFuZ2xlLnN1YnRyYWN0KHRoaXMuYW5nbGVzWzFdLCB0aGlzLmFuZ2xlc1swXSk7XG4gIHRoaXMuY29ybmVyID0gZGlmZiA8IC1NSU5fQ09STkVSX0FOR0xFO1xuICByZXR1cm4gdGhpcztcbn1cblxuLy8gQ29kZSBmb3IgdGhlIHN0cm9rZSBleHRyYWN0aW9uIHN0ZXAgZm9sbG93cy5cblxuY29uc3QgYWRkRWRnZVRvQWRqYWNlbmN5ID0gKGVkZ2UsIGFkamFjZW5jeSkgPT4ge1xuICBhc3NlcnQoZWRnZS5sZW5ndGggPT09IDIpO1xuICBhZGphY2VuY3lbZWRnZVswXV0gPSBhZGphY2VuY3lbZWRnZVswXV0gfHwgW107XG4gIGlmIChhZGphY2VuY3lbZWRnZVswXV0uaW5kZXhPZihlZGdlWzFdKSA8IDApIHtcbiAgICBhZGphY2VuY3lbZWRnZVswXV0ucHVzaChlZGdlWzFdKTtcbiAgfVxufVxuXG5jb25zdCBleHRyYWN0U3Ryb2tlID0gKHBhdGhzLCBlbmRwb2ludF9tYXAsIGJyaWRnZV9hZGphY2VuY3ksIGxvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkX2luZGljZXMsIHN0YXJ0LCBhdHRlbXB0X29uZSkgPT4ge1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgY29uc3QgdmlzaXRlZCA9IHt9O1xuICBsZXQgY3VycmVudCA9IHN0YXJ0O1xuXG4gIC8vIEEgbGlzdCBvZiBsaW5lIHNlZ21lbnRzIHRoYXQgd2VyZSBhZGRlZCB0byB0aGUgcGF0aCBidXQgdGhhdCB3ZXJlIG5vdFxuICAvLyBwYXJ0IG9mIHRoZSBvcmlnaW5hbCBzdHJva2UgZGF0YS4gTm9uZSBvZiB0aGVzZSBzaG91bGQgaW50ZXJzZWN0LlxuICBjb25zdCBsaW5lX3NlZ21lbnRzID0gW107XG4gIGxldCBzZWxmX2ludGVyc2VjdGluZyA9IGZhbHNlO1xuXG4gIGNvbnN0IGFkdmFuY2UgPSAoaW5kZXgpID0+XG4gICAgICBbaW5kZXhbMF0sIChpbmRleFsxXSArIDEpICUgcGF0aHNbaW5kZXhbMF1dLmxlbmd0aF07XG5cbiAgY29uc3QgYW5nbGUgPSAoaW5kZXgxLCBpbmRleDIpID0+IHtcbiAgICBjb25zdCBkaWZmID0gUG9pbnQuc3VidHJhY3QoZW5kcG9pbnRfbWFwW1BvaW50LmtleShpbmRleDIpXS5wb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnRfbWFwW1BvaW50LmtleShpbmRleDEpXS5wb2ludCk7XG4gICAgYXNzZXJ0KGRpZmZbMF0gIT09IDAgfHwgZGlmZlsxXSAhPT0gMCk7XG4gICAgY29uc3QgYW5nbGUgPSBNYXRoLmF0YW4yKGRpZmZbMV0sIGRpZmZbMF0pO1xuICAgIHJldHVybiBBbmdsZS5zdWJ0cmFjdChhbmdsZSwgIGVuZHBvaW50LmFuZ2xlc1swXSk7XG4gIH1cblxuICBjb25zdCBnZXRJbnRlcnNlY3Rpb24gPSAoc2VnbWVudDEsIHNlZ21lbnQyKSA9PiB7XG4gICAgY29uc3QgZGlmZjEgPSBQb2ludC5zdWJ0cmFjdChzZWdtZW50MVsxXSwgc2VnbWVudDFbMF0pO1xuICAgIGNvbnN0IGRpZmYyID0gUG9pbnQuc3VidHJhY3Qoc2VnbWVudDJbMV0sIHNlZ21lbnQyWzBdKTtcbiAgICBjb25zdCBjcm9zcyA9IGRpZmYxWzBdKmRpZmYyWzFdIC0gZGlmZjFbMV0qZGlmZjJbMF07XG4gICAgaWYgKGNyb3NzID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCB2ID0gUG9pbnQuc3VidHJhY3Qoc2VnbWVudDFbMF0sIHNlZ21lbnQyWzBdKTtcbiAgICBjb25zdCBzID0gKGRpZmYxWzBdKnZbMV0gLSBkaWZmMVsxXSp2WzBdKS9jcm9zcztcbiAgICBjb25zdCB0ID0gKGRpZmYyWzBdKnZbMV0gLSBkaWZmMlsxXSp2WzBdKS9jcm9zcztcbiAgICBpZiAoMCA8IHMgJiYgcyA8IDEgJiYgMCA8IHQgJiYgdCA8IDEpIHtcbiAgICAgIHJldHVybiBbc2VnbWVudDFbMF1bMF0gKyB0KmRpZmYxWzBdLCBzZWdtZW50MVswXVsxXSArIHQqZGlmZjFbMV1dO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgaW5kZXhUb1BvaW50ID0gKGluZGV4KSA9PiBlbmRwb2ludF9tYXBbUG9pbnQua2V5KGluZGV4KV0ucG9pbnQ7XG5cbiAgY29uc3QgcHVzaExpbmVTZWdtZW50cyA9IChwb2ludHMpID0+IHtcbiAgICBjb25zdCBvbGRfbGluZXMgPSBsaW5lX3NlZ21lbnRzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGxpbmVfc2VnbWVudHMucHVzaChbcG9pbnRzW2ldLCBwb2ludHNbaSArIDFdXSk7XG4gICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgIHN0YXJ0OiBQb2ludC5jbG9uZShwb2ludHNbaV0pLFxuICAgICAgICBlbmQ6IFBvaW50LmNsb25lKHBvaW50c1tpICsgMV0pLFxuICAgICAgICBjb250cm9sOiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gTG9nIGFuIGVycm9yIGlmIHRoaXMgc3Ryb2tlIGlzIHNlbGYtaW50ZXJzZWN0aW5nLlxuICAgIGlmICghc2VsZl9pbnRlcnNlY3RpbmcpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2xkX2xpbmVzOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IG9sZF9saW5lczsgaiA8IGxpbmVfc2VnbWVudHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoZ2V0SW50ZXJzZWN0aW9uKGxpbmVfc2VnbWVudHNbaV0sIGxpbmVfc2VnbWVudHNbal0pKSB7XG4gICAgICAgICAgICBzZWxmX2ludGVyc2VjdGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSGVyZSB0aGVyZSBiZSBkcmFnb25zIVxuICAvLyBUT0RPKHNraXNob3JlKTogRG9jdW1lbnQgdGhlIHBvaW50IG9mIHRoZSBnZW9tZXRyeSBpbiB0aGlzIGZ1bmN0aW9uLlxuICBjb25zdCBzZWxlY3RCcmlkZ2UgPSAoZW5kcG9pbnQsIG9wdGlvbnMpID0+IHtcbiAgICBpZiAob3B0aW9ucy5sZW5ndGggPT09IDEgJiYgZXh0cmFjdGVkX2luZGljZXNbUG9pbnQua2V5KG9wdGlvbnNbMF0pXSkge1xuICAgICAgLy8gSGFuZGxlIHN0YXItc2hhcGVkIHN0cm9rZXMgd2hlcmUgb25lIHN0cm9rZSBlbmRzIGF0IHRoZSBpbnRlcnNlY3Rpb25cbiAgICAgIC8vIG9mIHRoZSBicmlkZ2VzIHVzZWQgYnkgdHdvIG90aGVyIHN0cm9rZXMuXG4gICAgICBjb25zdCBpbmRpY2VzMSA9IFtlbmRwb2ludC5pbmRleCwgb3B0aW9uc1swXV07XG4gICAgICBjb25zdCBzZWdtZW50MSA9IGluZGljZXMxLm1hcChpbmRleFRvUG9pbnQpO1xuICAgICAgZm9yIChsZXQga2V5IGluIGJyaWRnZV9hZGphY2VuY3kpIHtcbiAgICAgICAgaWYgKFBvaW50LmVxdWFsKGVuZHBvaW50X21hcFtrZXldLmluZGV4LCBpbmRpY2VzMVswXSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJyaWRnZV9hZGphY2VuY3lba2V5XS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChQb2ludC5lcXVhbChicmlkZ2VfYWRqYWNlbmN5W2tleV1baV0sIHNlZ21lbnQxWzBdKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG90aGVyIGJyaWRnZSBzZWdtZW50IGFuZCBjaGVjayBpZiBpdCBpbnRlcnNlY3RzLlxuICAgICAgICAgIGNvbnN0IGluZGljZXMyID0gW2VuZHBvaW50X21hcFtrZXldLmluZGV4LCBicmlkZ2VfYWRqYWNlbmN5W2tleV1baV1dO1xuICAgICAgICAgIGNvbnN0IHNlZ21lbnQyID0gaW5kaWNlczIubWFwKGluZGV4VG9Qb2ludCk7XG4gICAgICAgICAgaWYgKFBvaW50LmVxdWFsKGluZGljZXMyWzBdLCBpbmRpY2VzMVsxXSkgJiZcbiAgICAgICAgICAgICAgIWV4dHJhY3RlZF9pbmRpY2VzW1BvaW50LmtleShpbmRpY2VzMlsxXSldKSB7XG4gICAgICAgICAgICBwdXNoTGluZVNlZ21lbnRzKFtzZWdtZW50MVswXSwgc2VnbWVudDFbMV0sIHNlZ21lbnQyWzFdXSk7XG4gICAgICAgICAgICByZXR1cm4gaW5kaWNlczJbMV07XG4gICAgICAgICAgfSBlbHNlIGlmIChQb2ludC5lcXVhbChpbmRpY2VzMlsxXSwgaW5kaWNlczFbMV0pICYmXG4gICAgICAgICAgICAgICAgICAgICAhZXh0cmFjdGVkX2luZGljZXNbUG9pbnQua2V5KGluZGljZXMyWzBdKV0pIHtcbiAgICAgICAgICAgIHB1c2hMaW5lU2VnbWVudHMoW3NlZ21lbnQxWzBdLCBzZWdtZW50MVsxXSwgc2VnbWVudDJbMF1dKTtcbiAgICAgICAgICAgIHJldHVybiBpbmRpY2VzMlswXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgaW50ZXJzZWN0aW9uID0gZ2V0SW50ZXJzZWN0aW9uKHNlZ21lbnQxLCBzZWdtZW50Mik7XG4gICAgICAgICAgaWYgKGludGVyc2VjdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBhbmdsZTEgPSBhbmdsZShpbmRpY2VzMVswXSwgaW5kaWNlczFbMV0pO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUyID0gYW5nbGUoaW5kaWNlczJbMF0sIGluZGljZXMyWzFdKTtcbiAgICAgICAgICAgIGlmIChBbmdsZS5zdWJ0cmFjdChhbmdsZTIsIGFuZ2xlMSkgPCAwKSB7XG4gICAgICAgICAgICAgIGluZGljZXMyLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgc2VnbWVudDIucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHVzaExpbmVTZWdtZW50cyhbc2VnbWVudDFbMF0sIGludGVyc2VjdGlvbiwgc2VnbWVudDJbMV1dKTtcbiAgICAgICAgICAgIHJldHVybiBpbmRpY2VzMlsxXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSGFuZGxlIHNlZ21lbnRzIHdoZXJlIHRoZSBjb3JyZWN0IHBhdGggaXMgdG8gZm9sbG93IGEgZGVhZC1lbmQgYnJpZGdlLFxuICAgICAgLy8gZXZlbiBpZiB0aGVyZSBpcyBhbm90aGVyIGJyaWRnZSB0aGF0IGlzIG1vcmUgYWxpZ25lZCB3aXRoIHRoZSBzdHJva2UuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gUG9pbnQua2V5KG9wdGlvbnNbaV0pO1xuICAgICAgICBpZiAoIWV4dHJhY3RlZF9pbmRpY2VzW2tleV0pIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3B0aW9uc1swXTtcbiAgfVxuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgLy8gQWRkIHRoZSBjdXJyZW50IHBhdGggc2VnbWVudCB0byB0aGUgcGF0aC5cbiAgICByZXN1bHQucHVzaChwYXRoc1tjdXJyZW50WzBdXVtjdXJyZW50WzFdXSk7XG4gICAgdmlzaXRlZFtQb2ludC5rZXkoY3VycmVudCldID0gdHJ1ZTtcbiAgICBjdXJyZW50ID0gYWR2YW5jZShjdXJyZW50KTtcbiAgICAvLyBJZiB0aGVyZSBhcmUgYnJpZGdlcyBhdCB0aGUgc3RhcnQgb2YgdGhlIG5leHQgcGF0aCBzZWdtZW50LCBmb2xsb3cgdGhlXG4gICAgLy8gb25lIHRoYXQgbWFrZXMgdGhlIGxhcmdlc3QgYW5nbGUgd2l0aCB0aGUgY3VycmVudCBwYXRoLiBUaGUgb3JkZXJpbmdcbiAgICAvLyBjcml0ZXJpb24gZW5mb3JjZSB0aGF0IHdlIHRyeSB0byBjcm9zcyBhbGlnbmVkIGJyaWRnZXMuXG4gICAgY29uc3Qga2V5ID0gUG9pbnQua2V5KGN1cnJlbnQpO1xuICAgIGlmIChicmlkZ2VfYWRqYWNlbmN5Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHZhciBlbmRwb2ludCA9IGVuZHBvaW50X21hcFtrZXldO1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGJyaWRnZV9hZGphY2VuY3lba2V5XS5zb3J0KFxuICAgICAgICAgIChhLCBiKSA9PiBhbmdsZShlbmRwb2ludC5pbmRleCwgYSkgLSBhbmdsZShlbmRwb2ludC5pbmRleCwgYikpO1xuICAgICAgLy8gSEFDSyhza2lzaG9yZSk6IFRoZSBjYWxsIHRvIHNlbGVjdEJyaWRnZSBtYXkgdXBkYXRlIHRoZSByZXN1bHQuXG4gICAgICAvLyBXaGVuIGEgc3Ryb2tlIGlzIGZvcm1lZCBieSBjb21wdXRpbmcgYSBicmlkZ2UgaW50ZXJzZWN0aW9uLCB0aGVuIHRoZVxuICAgICAgLy8gdHdvIGJyaWRnZSBmcmFnbWVudHMgYXJlIGFkZGVkIGluIHNlbGVjdEJyaWRnZS5cbiAgICAgIGNvbnN0IHJlc3VsdF9sZW5ndGggPSByZXN1bHQubGVuZ3RoO1xuICAgICAgY29uc3QgbmV4dCA9IChhdHRlbXB0X29uZSA/IG9wdGlvbnNbMF0gOiBzZWxlY3RCcmlkZ2UoZW5kcG9pbnQsIG9wdGlvbnMpKTtcbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSByZXN1bHRfbGVuZ3RoKSB7XG4gICAgICAgIHB1c2hMaW5lU2VnbWVudHMoW2VuZHBvaW50LnBvaW50LCBlbmRwb2ludF9tYXBbUG9pbnQua2V5KG5leHQpXS5wb2ludF0pO1xuICAgICAgfVxuICAgICAgY3VycmVudCA9IG5leHQ7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgZWl0aGVyIGNsb3NlZCB0aGUgbG9vcCBvciBoaXQgYW4gZXh0cmFjdGVkIHNlZ21lbnQuXG4gICAgY29uc3QgbmV3X2tleSA9IFBvaW50LmtleShjdXJyZW50KTtcbiAgICBpZiAoUG9pbnQuZXF1YWwoY3VycmVudCwgc3RhcnQpKSB7XG4gICAgICBpZiAoc2VsZl9pbnRlcnNlY3RpbmcpIHtcbiAgICAgICAgbG9nLnB1c2goe2NsczogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdFeHRyYWN0ZWQgYSBzZWxmLWludGVyc2VjdGluZyBzdHJva2UuJ30pO1xuICAgICAgfVxuICAgICAgbGV0IG51bV9zZWdtZW50c19vbl9wYXRoID0gMDtcbiAgICAgIGZvciAobGV0IGluZGV4IGluIHZpc2l0ZWQpIHtcbiAgICAgICAgZXh0cmFjdGVkX2luZGljZXNbaW5kZXhdID0gdHJ1ZTtcbiAgICAgICAgbnVtX3NlZ21lbnRzX29uX3BhdGggKz0gMTtcbiAgICAgIH1cbiAgICAgIC8vIFNpbmdsZS1zZWdtZW50IHN0cm9rZXMgbWF5IGJlIGR1ZSB0byBncmFwaGljYWwgYXJ0aWZhY3RzIGluIHRoZSBmb250LlxuICAgICAgLy8gV2UgZHJvcCB0aGVtIHRvIHJlbW92ZSB0aGVzZSBhcnRpZmFjdHMuXG4gICAgICBpZiAobnVtX3NlZ21lbnRzX29uX3BhdGggPT09IDEpIHtcbiAgICAgICAgbG9nLnB1c2goe2NsczogJ3N1Y2Nlc3MnLCBtZXNzYWdlOiAnRHJvcHBpbmcgc2luZ2xlLXNlZ21lbnQgc3Ryb2tlLid9KTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIGlmIChleHRyYWN0ZWRfaW5kaWNlc1tuZXdfa2V5XSB8fCB2aXNpdGVkW25ld19rZXldKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBleHRyYWN0U3Ryb2tlcyA9IChwYXRocywgZW5kcG9pbnRzLCBicmlkZ2VzLCBsb2cpID0+IHtcbiAgLy8gQnVpbGQgdXAgdGhlIG5lY2Vzc2FyeSBoYXNoIHRhYmxlcyBhbmQgYWRqYWNlbmN5IGxpc3RzIG5lZWRlZCB0byBydW4gdGhlXG4gIC8vIHN0cm9rZSBleHRyYWN0aW9uIGxvb3AuXG4gIGNvbnN0IGVuZHBvaW50X21hcCA9IHt9O1xuICBjb25zdCBlbmRwb2ludF9wb3NpdGlvbl9tYXAgPSB7fTtcbiAgZm9yIChsZXQgZW5kcG9pbnQgb2YgZW5kcG9pbnRzKSB7XG4gICAgZW5kcG9pbnRfbWFwW1BvaW50LmtleShlbmRwb2ludC5pbmRleCldID0gZW5kcG9pbnQ7XG4gICAgZW5kcG9pbnRfcG9zaXRpb25fbWFwW1BvaW50LmtleShlbmRwb2ludC5wb2ludCldID0gZW5kcG9pbnQ7XG4gIH1cbiAgYnJpZGdlcy5tYXAoY2hlY2tCcmlkZ2UpO1xuICBjb25zdCBicmlkZ2VfYWRqYWNlbmN5ID0ge307XG4gIGZvciAobGV0IGJyaWRnZSBvZiBicmlkZ2VzKSB7XG4gICAgY29uc3Qga2V5cyA9IGJyaWRnZS5tYXAoUG9pbnQua2V5KTtcbiAgICBhc3NlcnQoZW5kcG9pbnRfcG9zaXRpb25fbWFwLmhhc093blByb3BlcnR5KGtleXNbMF0pKTtcbiAgICBhc3NlcnQoZW5kcG9pbnRfcG9zaXRpb25fbWFwLmhhc093blByb3BlcnR5KGtleXNbMV0pKTtcbiAgICBjb25zdCB4cyA9IGtleXMubWFwKCh4KSA9PiBlbmRwb2ludF9wb3NpdGlvbl9tYXBbeF0uaW5kZXgpO1xuICAgIGFkZEVkZ2VUb0FkamFjZW5jeShbUG9pbnQua2V5KHhzWzBdKSwgeHNbMV1dLCBicmlkZ2VfYWRqYWNlbmN5KTtcbiAgICBhZGRFZGdlVG9BZGphY2VuY3koW1BvaW50LmtleSh4c1sxXSksIHhzWzBdXSwgYnJpZGdlX2FkamFjZW5jeSk7XG4gIH1cbiAgLy8gQWN0dWFsbHkgZXh0cmFjdCBzdHJva2VzLiBBbnkgZ2l2ZW4gcGF0aCBzZWdtZW50IGluZGV4IHNob3VsZCBhcHBlYXIgb25cbiAgLy8gZXhhY3RseSBvbmUgc3Ryb2tlOyBpZiBpdCBpcyBub3Qgb24gYSBzdHJva2UsIHdlIGxvZyBhIHdhcm5pbmcuXG4gIGNvbnN0IGV4dHJhY3RlZF9pbmRpY2VzID0ge307XG4gIGNvbnN0IHN0cm9rZXMgPSBbXTtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAzOyBhdHRlbXB0KyspIHtcbiAgICBsZXQgbWlzc2VkID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYXRoc1tpXS5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpbmRleCA9IFtpLCBqXTtcbiAgICAgICAgaWYgKGV4dHJhY3RlZF9pbmRpY2VzW1BvaW50LmtleShpbmRleCldKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXR0ZW1wdF9vbmUgPSBhdHRlbXB0ID09PSAwO1xuICAgICAgICBjb25zdCBzdHJva2UgPSBleHRyYWN0U3Ryb2tlKHBhdGhzLCBlbmRwb2ludF9tYXAsIGJyaWRnZV9hZGphY2VuY3ksIGxvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWRfaW5kaWNlcywgaW5kZXgsIGF0dGVtcHRfb25lKTtcbiAgICAgICAgaWYgKHN0cm9rZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbWlzc2VkID0gdHJ1ZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBzdHJva2VzLnB1c2goc3Ryb2tlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFtaXNzZWQpIHtcbiAgICAgIHJldHVybiBzdHJva2VzO1xuICAgIH1cbiAgfVxuICBsb2cucHVzaCh7Y2xzOiAnZXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1N0cm9rZSBleHRyYWN0aW9uIG1pc3NlZCBzb21lIHBhdGggc2VnbWVudHMuJ30pO1xuICByZXR1cm4gc3Ryb2tlcztcbn1cblxuLy8gRXhwb3J0cyBnbyBiZWxvdyB0aGlzIGZvbGQuXG5cbmNvbnN0IHN0cm9rZV9leHRyYWN0b3IgPSB7fTtcblxuc3Ryb2tlX2V4dHJhY3Rvci5nZXRCcmlkZ2VzID0gKHBhdGgsIGNsYXNzaWZpZXIpID0+IHtcbiAgY29uc3QgcGF0aHMgPSBzdmcuY29udmVydFNWR1BhdGhUb1BhdGhzKHBhdGgpO1xuICBjb25zdCBlbmRwb2ludHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGF0aHNbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgIGVuZHBvaW50cy5wdXNoKG5ldyBFbmRwb2ludChwYXRocywgW2ksIGpdKSk7XG4gICAgfVxuICB9XG4gIGNsYXNzaWZpZXIgPSBjbGFzc2lmaWVyIHx8IHN0cm9rZV9leHRyYWN0b3IuY29tYmluZWRDbGFzc2lmaWVyO1xuICBjb25zdCBicmlkZ2VzID0gZ2V0QnJpZGdlcyhlbmRwb2ludHMsIGNsYXNzaWZpZXIpO1xuICByZXR1cm4ge2VuZHBvaW50czogZW5kcG9pbnRzLCBicmlkZ2VzOiBicmlkZ2VzfTtcbn1cblxuc3Ryb2tlX2V4dHJhY3Rvci5nZXRTdHJva2VzID0gKHBhdGgsIGJyaWRnZXMpID0+IHtcbiAgY29uc3QgcGF0aHMgPSBzdmcuY29udmVydFNWR1BhdGhUb1BhdGhzKHBhdGgpO1xuICBjb25zdCBlbmRwb2ludHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGF0aHNbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgIGVuZHBvaW50cy5wdXNoKG5ldyBFbmRwb2ludChwYXRocywgW2ksIGpdKSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IGxvZyA9IFtdO1xuICBjb25zdCBzdHJva2VfcGF0aHMgPSBleHRyYWN0U3Ryb2tlcyhwYXRocywgZW5kcG9pbnRzLCBicmlkZ2VzLCBsb2cpO1xuICBjb25zdCBzdHJva2VzID0gc3Ryb2tlX3BhdGhzLm1hcCgoeCkgPT4gc3ZnLmNvbnZlcnRQYXRoc1RvU1ZHUGF0aChbeF0pKTtcbiAgcmV0dXJuIHtsb2c6IGxvZywgc3Ryb2tlczogc3Ryb2tlc307XG59XG5cbnN0cm9rZV9leHRyYWN0b3IuaGFuZFR1bmVkQ2xhc3NpZmllciA9IGhhbmRUdW5lZENsYXNzaWZpZXI7XG5cbmV4cG9ydCB7c3Ryb2tlX2V4dHJhY3Rvcn07XG4iLCJpbXBvcnQge2Fzc2VydCwgUG9pbnR9IGZyb20gJy9saWIvYmFzZSc7XG5cbmNvbnN0IHN2ZyA9IHt9O1xuXG4vLyBBIG5vcm1hbC1mb3JtIFNWRyBwYXRoIHN0cmluZyBpcyBhIGRhdGEgc3RyaW5nIHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuLy8gICAtIEV2ZXJ5IGNvbW1hbmQgaW4gdGhlIHBhdGggaXMgaW4gWydMJywgJ00nLCAnUScsICdaJ10uXG4vLyAgIC0gQWRqYWNlbnQgdG9rZW5zIGluIHRoZSBwYXRoIGFyZSBzZXBhcmF0ZWQgYnkgZXhhY3RseSBvbmUgc3BhY2UuXG4vLyAgIC0gVGhlcmUgaXMgZXhhY3RseSBvbmUgJ1onLCBhbmQgaXQgaXMgdGhlIGxhc3QgY29tbWFuZC5cbi8vXG4vLyBBIHNlZ21lbnQgaXMgYSBzZWN0aW9uIG9mIGEgcGF0aCwgcmVwcmVzZW50ZWQgYXMgYW4gb2JqZWN0IHRoYXQgaGFzIGEgc3RhcnQsXG4vLyBhbiBlbmQsIGFuZCBwb3NzaWJseSBhIGNvbnRyb2wsIGFsbCBvZiB3aGljaCBhcmUgdmFsaWQgUG9pbnRzICh0aGF0IGlzLCBwYWlyc1xuLy8gb2YgTnVtYmVycykuXG4vL1xuLy8gQSBwYXRoIGlzIGEgbGlzdCBvZiBzZWdtZW50cyB3aGljaCBpcyBub24tZW1wdHkgYW5kIGNsb3NlZCAtIHRoYXQgaXMsIHRoZSBlbmRcbi8vIG9mIHRoZSBsYXN0IHNlZ21lbnQgb24gdGhlIHBhdGggaXMgdGhlIHN0YXJ0IG9mIHRoZSBmaXJzdC5cblxuLy8gUmV0dXJucyB0d2ljZSB0aGUgYXJlYSBjb250YWluZWQgaW4gdGhlIHBvbHlnb24uIFRoZSByZXN1bHQgaXMgcG9zaXRpdmUgaWZmXG4vLyB0aGUgcG9seWdvbiB3aW5kcyBpbiB0aGUgY291bnRlci1jbG9ja3dpc2UgZGlyZWN0aW9uLlxuY29uc3QgZ2V0MnhBcmVhID0gKHBvbHlnb24pID0+IHtcbiAgbGV0IGFyZWEgPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvbHlnb24ubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwMSA9IHBvbHlnb25baV07XG4gICAgY29uc3QgcDIgPSBwb2x5Z29uWyhpICsgMSkgJSBwb2x5Z29uLmxlbmd0aF07XG4gICAgYXJlYSArPSAocDJbMF0gKyBwMVswXSkqKHAyWzFdIC0gcDFbMV0pO1xuICB9XG4gIHJldHVybiBhcmVhO1xufVxuXG4vLyBUYWtlcyBhIGxpc3Qgb2YgcGF0aHMgYW5kIG9yaWVudHMgdGhlbSBzbyB0aGF0IGV4dGVyaW9yIGNvbnRvdXJzIGFyZSBvcmllbnRlZFxuLy8gY291bnRlci1jbG9ja3dpc2UgYW5kIGludGVyaW9yIGNvbnRvdXJzIGNsb2Nrd2lzZS5cbmNvbnN0IG9yaWVudFBhdGhzID0gKHBhdGhzLCBhcHByb3hpbWF0aW9uX2Vycm9yKSA9PiB7XG4gIGNvbnN0IHBvbHlnb25zID0gcGF0aHMubWFwKHN2Zy5nZXRQb2x5Z29uQXBwcm94aW1hdGlvbik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwYXRoID0gcGF0aHNbaV07XG4gICAgbGV0IGNvbnRhaW5zID0gMDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhdGhzLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAoaiA9PT0gaSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAoc3ZnLnBvbHlnb25Db250YWluc1BvaW50KHBvbHlnb25zW2pdLCBwYXRoWzBdLnN0YXJ0KSkge1xuICAgICAgICBjb250YWlucyArPSAxO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBhcmVhID0gZ2V0MnhBcmVhKHBvbHlnb25zW2ldKTtcbiAgICAvLyBUaGUgcGF0aCBpcyBhbiBleHRlcm5hbCBwYXRoIGlmZiBpdCBpcyBjb250YWluZWQgaW4gYW4gZXZlbiBudW1iZXIgb2ZcbiAgICAvLyBvdGhlciBwYXRocy4gSXQgaXMgY291bnRlci1jbG9ja3dpc2UgaWZmIGl0cyBhcmVhIGlzIHBvc2l0aXZlLiBUaGUgcGF0aFxuICAgIC8vIHNob3VsZCBiZSByZXZlcnNlZCBpZiAoQ0NXICYmIGludGVybmFsKSB8fCAoQ1cgJiYgZXh0ZXJuYWwpLlxuICAgIGNvbnN0IHNob3VsZF9yZXZlcnNlID0gKGFyZWEgPiAwKSAhPT0gKGNvbnRhaW5zICUgMiA9PT0gMCk7XG4gICAgaWYgKHNob3VsZF9yZXZlcnNlKSB7XG4gICAgICBmb3IgKGxldCBzZWdtZW50IG9mIHBhdGgpIHtcbiAgICAgICAgW3NlZ21lbnQuc3RhcnQsIHNlZ21lbnQuZW5kXSA9IFtzZWdtZW50LmVuZCwgc2VnbWVudC5zdGFydF07XG4gICAgICB9XG4gICAgICBwYXRoLnJldmVyc2UoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhdGhzO1xufVxuXG4vLyBUYWtlcyBhIG5vcm1hbC1mb3JtIFNWRyBwYXRoIHN0cmluZyBhbmQgY29udmVydHMgaXQgdG8gYSBsaXN0IG9mIHBhdGhzLlxuY29uc3Qgc3BsaXRQYXRoID0gKHBhdGgpID0+IHtcbiAgYXNzZXJ0KHBhdGgubGVuZ3RoID4gMCk7XG4gIGFzc2VydChwYXRoWzBdID09PSAnTScsIGBQYXRoIGRpZCBub3Qgc3RhcnQgd2l0aCBNOiAke3BhdGh9YCk7XG4gIGFzc2VydChwYXRoW3BhdGgubGVuZ3RoIC0gMV0gPT09ICdaJywgYFBhdGggZGlkIG5vdCBlbmQgd2l0aCBaOiAke3BhdGh9YCk7XG4gIGNvbnN0IHRlcm1zID0gcGF0aC5zcGxpdCgnICcpO1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgbGV0IHN0YXJ0ID0gdW5kZWZpbmVkO1xuICBsZXQgY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXJtcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNvbW1hbmQgPSB0ZXJtc1tpXTtcbiAgICBhc3NlcnQoY29tbWFuZC5sZW5ndGggPiAwLCBgUGF0aCBpbmNsdWRlcyBlbXB0eSBjb21tYW5kOiAke3BhdGh9YCk7XG4gICAgYXNzZXJ0KCdMTVFaJy5pbmRleE9mKGNvbW1hbmQpID49IDAsIGNvbW1hbmQpO1xuICAgIGlmIChjb21tYW5kID09PSAnTScgfHwgY29tbWFuZCA9PT0gJ1onKSB7XG4gICAgICBpZiAoY3VycmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChQb2ludC5lcXVhbChjdXJyZW50LCBzdGFydCksIGBQYXRoIGhhcyBvcGVuIGNvbnRvdXI6ICR7cGF0aH1gKTtcbiAgICAgICAgYXNzZXJ0KHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0ubGVuZ3RoID4gMCxcbiAgICAgICAgICAgICAgIGBQYXRoIGhhcyBlbXB0eSBjb250b3VyOiAke3BhdGh9YCk7XG4gICAgICAgIGlmIChjb21tYW5kID09PSAnWicpIHtcbiAgICAgICAgICBhc3NlcnQoaSA9PT0gdGVybXMubGVuZ3RoIC0gMSwgYFBhdGggZW5kZWQgZWFybHk6ICR7cGF0aH1gKTtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXN1bHQucHVzaChbXSk7XG4gICAgICBhc3NlcnQoaSA8IHRlcm1zLmxlbmd0aCAtIDIsIGBNaXNzaW5nIHBvaW50IG9uIHBhdGg6ICR7cGF0aH1gKTtcbiAgICAgIHN0YXJ0ID0gW3BhcnNlRmxvYXQodGVybXNbaSArIDFdLCAxMCksIHBhcnNlRmxvYXQodGVybXNbaSArIDJdLCAxMCldO1xuICAgICAgYXNzZXJ0KFBvaW50LnZhbGlkKHN0YXJ0KSk7XG4gICAgICBpICs9IDI7XG4gICAgICBjdXJyZW50ID0gUG9pbnQuY2xvbmUoc3RhcnQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGxldCBjb250cm9sID0gdW5kZWZpbmVkO1xuICAgIGlmIChjb21tYW5kID09PSAnUScpIHtcbiAgICAgIGFzc2VydChpIDwgdGVybXMubGVuZ3RoIC0gMiwgYE1pc3NpbmcgcG9pbnQgb24gcGF0aDogJHtwYXRofWApO1xuICAgICAgY29udHJvbCA9IFtwYXJzZUZsb2F0KHRlcm1zW2kgKyAxXSwgMTApLCBwYXJzZUZsb2F0KHRlcm1zW2kgKyAyXSwgMTApXTtcbiAgICAgIGFzc2VydChQb2ludC52YWxpZChjb250cm9sKSk7XG4gICAgICBpICs9IDI7XG4gICAgfVxuICAgIGFzc2VydChpIDwgdGVybXMubGVuZ3RoIC0gMiwgYE1pc3NpbmcgcG9pbnQgb24gcGF0aDogJHtwYXRofWApO1xuICAgIGNvbnN0IGVuZCA9IFtwYXJzZUZsb2F0KHRlcm1zW2kgKyAxXSwgMTApLCBwYXJzZUZsb2F0KHRlcm1zW2kgKyAyXSwgMTApXTtcbiAgICBhc3NlcnQoUG9pbnQudmFsaWQoZW5kKSk7XG4gICAgaSArPSAyO1xuICAgIGlmIChQb2ludC5lcXVhbChjdXJyZW50LCBlbmQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGNvbnRyb2wgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAoUG9pbnQuZXF1YWwoY29udHJvbCwgY3VycmVudCkgfHwgUG9pbnQuZXF1YWwoY29udHJvbCwgZW5kKSkpIHtcbiAgICAgIGNvbnRyb2wgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0ucHVzaCh7XG4gICAgICBzdGFydDogUG9pbnQuY2xvbmUoY3VycmVudCksXG4gICAgICBjb250cm9sOiBjb250cm9sLFxuICAgICAgZW5kOiBlbmQsXG4gICAgfSk7XG4gICAgY3VycmVudCA9IFBvaW50LmNsb25lKGVuZCk7XG4gIH1cbn1cblxuLy8gVGFrZXMgYSBUcnVlVHlwZSBmb250IGNvbW1hbmQgbGlzdCAoYXMgcHJvdmlkZWQgYnkgb3BlbnR5cGUuanMpIGFuZCByZXR1cm5zXG4vLyBhIG5vcm1hbC1mb3JtIFNWRyBwYXRoIHN0cmluZyBhcyBkZWZpbmVkIGFib3ZlLlxuc3ZnLmNvbnZlcnRDb21tYW5kc1RvUGF0aCA9IChjb21tYW5kcykgPT4ge1xuICBjb25zdCB0ZXJtcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IGNvbW1hbmRzW2ldO1xuICAgIGFzc2VydCgnTE1RWicuaW5kZXhPZihjb21tYW5kLnR5cGUpID49IDAsIGNvbW1hbmQudHlwZSk7XG4gICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gJ1onKSB7XG4gICAgICBhc3NlcnQoaSA9PT0gY29tbWFuZHMubGVuZ3RoIC0gMSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgdGVybXMucHVzaChjb21tYW5kLnR5cGUpO1xuICAgIGFzc2VydCgoY29tbWFuZC54MSAhPT0gdW5kZWZpbmVkKSA9PT0gKGNvbW1hbmQudHlwZSA9PT0gJ1EnKSk7XG4gICAgaWYgKGNvbW1hbmQueDEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGVybXMucHVzaChjb21tYW5kLngxKTtcbiAgICAgIHRlcm1zLnB1c2goY29tbWFuZC55MSk7XG4gICAgfVxuICAgIGFzc2VydChjb21tYW5kLnggIT09IHVuZGVmaW5lZCk7XG4gICAgdGVybXMucHVzaChjb21tYW5kLngpO1xuICAgIHRlcm1zLnB1c2goY29tbWFuZC55KTtcbiAgfVxuICB0ZXJtcy5wdXNoKCdaJyk7XG4gIHJldHVybiB0ZXJtcy5qb2luKCcgJyk7XG59XG5cbi8vIENvbnZlcnRzIGEgbm9ybWFsLWZvcm0gU1ZHIHBhdGggc3RyaW5nIHRvIGEgbGlzdCBvZiBwYXRocy4gVGhlIHBhdGhzIG9iZXkgYW5cbi8vIG9yaWVudGF0aW9uIGNvbnN0cmFpbnQ6IHRoZSBleHRlcm5hbCBwYXRocyBhcmUgb3JpZW50ZWQgY291bnRlci1jbG9ja3dpc2UsXG4vLyB3aGlsZSB0aGUgaW50ZXJuYWwgcGF0aHMgYXJlIG9yaWVudGVkIGNsb2Nrd2lzZS5cbnN2Zy5jb252ZXJ0U1ZHUGF0aFRvUGF0aHMgPSAocGF0aCkgPT4ge1xuICByZXR1cm4gb3JpZW50UGF0aHMoc3BsaXRQYXRoKHBhdGgpKTtcbn1cblxuLy8gVGFrZXMgdGhlIGdpdmVuIGxpc3Qgb2YgcGF0aHMgYW5kIHJldHVybnMgYSBub3JtYWwtZm9ybSBTVkcgcGF0aCBzdHJpbmcuXG5zdmcuY29udmVydFBhdGhzVG9TVkdQYXRoID0gKHBhdGhzKSA9PiB7XG4gIGNvbnN0IHRlcm1zID0gW107XG4gIGZvciAobGV0IHBhdGggb2YgcGF0aHMpIHtcbiAgICBhc3NlcnQocGF0aC5sZW5ndGggPiAwKTtcbiAgICB0ZXJtcy5wdXNoKCdNJyk7XG4gICAgdGVybXMucHVzaChwYXRoWzBdLnN0YXJ0WzBdKTtcbiAgICB0ZXJtcy5wdXNoKHBhdGhbMF0uc3RhcnRbMV0pO1xuICAgIGZvciAobGV0IHNlZ21lbnQgb2YgcGF0aCkge1xuICAgICAgaWYgKHNlZ21lbnQuY29udHJvbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRlcm1zLnB1c2goJ0wnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRlcm1zLnB1c2goJ1EnKTtcbiAgICAgICAgdGVybXMucHVzaChzZWdtZW50LmNvbnRyb2xbMF0pO1xuICAgICAgICB0ZXJtcy5wdXNoKHNlZ21lbnQuY29udHJvbFsxXSk7XG4gICAgICB9XG4gICAgICB0ZXJtcy5wdXNoKHNlZ21lbnQuZW5kWzBdKTtcbiAgICAgIHRlcm1zLnB1c2goc2VnbWVudC5lbmRbMV0pO1xuICAgIH1cbiAgfVxuICB0ZXJtcy5wdXNoKCdaJyk7XG4gIHJldHVybiB0ZXJtcy5qb2luKCcgJyk7XG59XG5cbi8vIFRha2VzIGEgcGF0aCAoYSBsaXN0IG9mIHNlZ21lbnRzKSBhbmQgcmV0dXJucyBhIHBvbHlnb24gYXBwcm94aW1hdGlvbiB0byBpdC5cbi8vIFRoZSBwb2x5Z29uIGlzIGdpdmVuIGFzIGEgbGlzdCBvZiBwYWlycyBvZiBwb2ludHMuXG4vL1xuLy8gVGhlIGFwcHJveGltYXRpb24gZXJyb3IgaXMgYW4gdXBwZXItYm91bmQgb24gdGhlIGRpc3RhbmNlIGJldHdlZW4gY29uc2VjdXRpdmVcbi8vIHBvaW50cyBpbiB0aGUgcG9seWdvbiBhcHByb3hpbWF0aW9uIHVzZWQgdG8gY29tcHV0ZSB0aGUgYXJlYS4gVGhlIGRlZmF1bHRcbi8vIGVycm9yIG9mIDY0IGlzIGNob3NlbiBiZWNhdXNlIHRoZSBnbHlwaHMgaGF2ZSBhIHRvdGFsIHNpemUgb2YgMTAyNHgxMDI0Llxuc3ZnLmdldFBvbHlnb25BcHByb3hpbWF0aW9uID0gKHBhdGgsIGFwcHJveGltYXRpb25fZXJyb3IpID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGFwcHJveGltYXRpb25fZXJyb3IgPSBhcHByb3hpbWF0aW9uX2Vycm9yIHx8IDY0O1xuICBmb3IgKGxldCB4IG9mIHBhdGgpIHtcbiAgICBjb25zdCBjb250cm9sID0geC5jb250cm9sIHx8IFBvaW50Lm1pZHBvaW50KHguc3RhcnQsIHguZW5kKTtcbiAgICBjb25zdCBkaXN0YW5jZSA9IE1hdGguc3FydChQb2ludC5kaXN0YW5jZTIoeC5zdGFydCwgeC5lbmQpKTtcbiAgICBjb25zdCBudW1fcG9pbnRzID0gTWF0aC5mbG9vcihkaXN0YW5jZS9hcHByb3hpbWF0aW9uX2Vycm9yKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bV9wb2ludHM7IGkrKykge1xuICAgICAgY29uc3QgdCA9IChpICsgMSkvKG51bV9wb2ludHMgKyAxKTtcbiAgICAgIGNvbnN0IHMgPSAxIC0gdDtcbiAgICAgIHJlc3VsdC5wdXNoKFtzKnMqeC5zdGFydFswXSArIDIqcyp0KmNvbnRyb2xbMF0gKyB0KnQqeC5lbmRbMF0sXG4gICAgICAgICAgICAgICAgICAgcypzKnguc3RhcnRbMV0gKyAyKnMqdCpjb250cm9sWzFdICsgdCp0KnguZW5kWzFdXSk7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKHguZW5kKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHBvaW50IGlzIGNvbnRhaW5lZCBpbnNpZGUgdGhlIGdpdmVuIHBvbHlnb24uXG5zdmcucG9seWdvbkNvbnRhaW5zUG9pbnQgPSAocG9seWdvbiwgcG9pbnQpID0+IHtcbiAgY29uc3QgeCA9IHBvaW50WzBdO1xuICBjb25zdCB5ID0gcG9pbnRbMV07XG4gIGxldCBjcm9zc2luZ3MgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBvbHlnb24ubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzZWdtZW50ID0ge3N0YXJ0OiBwb2x5Z29uW2ldLCBlbmQ6IHBvbHlnb25bKGkgKyAxKSAlIHBvbHlnb24ubGVuZ3RoXX07XG4gICAgaWYgKChzZWdtZW50LnN0YXJ0WzBdIDwgeCAmJiB4IDwgc2VnbWVudC5lbmRbMF0pIHx8XG4gICAgICAgIChzZWdtZW50LnN0YXJ0WzBdID4geCAmJiB4ID4gc2VnbWVudC5lbmRbMF0pKSB7XG4gICAgICBjb25zdCB0ID0gKHggLSBzZWdtZW50LmVuZFswXSkvKHNlZ21lbnQuc3RhcnRbMF0gLSBzZWdtZW50LmVuZFswXSk7XG4gICAgICBjb25zdCBjeSA9IHQqc2VnbWVudC5zdGFydFsxXSArICgxIC0gdCkqc2VnbWVudC5lbmRbMV07XG4gICAgICBpZiAoeSA+IGN5KSB7XG4gICAgICAgIGNyb3NzaW5ncyArPSAxO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc2VnbWVudC5zdGFydFswXSA9PT0geCAmJiBzZWdtZW50LnN0YXJ0WzFdIDw9IHkpIHtcbiAgICAgIGlmIChzZWdtZW50LmVuZFswXSA+IHgpIHtcbiAgICAgICAgY3Jvc3NpbmdzICs9IDE7XG4gICAgICB9XG4gICAgICBjb25zdCBsYXN0ID0gcG9seWdvblsoaSArIHBvbHlnb24ubGVuZ3RoIC0gMSkgJSAocG9seWdvbi5sZW5ndGgpXTtcbiAgICAgIGlmIChsYXN0WzBdID4geCkge1xuICAgICAgICBjcm9zc2luZ3MgKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNyb3NzaW5ncyAlIDIgPT09IDE7XG59XG5cbmV4cG9ydCB7c3ZnfTtcbiIsImltcG9ydCB7R2x5cGhzfSBmcm9tICcvbGliL2dseXBocyc7XG5cbk1ldGVvci5wdWJsaXNoKCdpbmRleCcsIEdseXBocy5maW5kR2x5cGhzRm9yUmFkaWNhbCk7XG4iLCJpbXBvcnQge2dldEFuaW1hdGlvbkRhdGF9IGZyb20gJy9saWIvYW5pbWF0aW9uJztcbmltcG9ydCB7YXNzZXJ0LCBnZXRQV0QsIFBvaW50fSBmcm9tICcvbGliL2Jhc2UnO1xuaW1wb3J0IHtjamtsaWJ9IGZyb20gJy9saWIvY2prbGliJztcbmltcG9ydCB7R2x5cGhzfSBmcm9tICcvbGliL2dseXBocyc7XG5pbXBvcnQge2ZpeFN0cm9rZXN9IGZyb20gJy9saWIvc3Ryb2tlX2NhcHMvZml4U3Ryb2tlcyc7XG5pbXBvcnQge3N0cm9rZV9leHRyYWN0b3J9IGZyb20gJy9saWIvc3Ryb2tlX2V4dHJhY3Rvcic7XG5pbXBvcnQge3N2Z30gZnJvbSAnL2xpYi9zdmcnO1xuXG5jb25zdCBhZGRGcmVxdWVuY3lGaWVsZCA9IChnbHlwaCkgPT4ge1xuICBjb25zdCBkYXRhID0gY2prbGliLmdldENoYXJhY3RlckRhdGEoZ2x5cGguY2hhcmFjdGVyKTtcbiAgZ2x5cGgubWV0YWRhdGEuZnJlcXVlbmN5ID0gZGF0YS5mcmVxdWVuY3k7XG4gIEdseXBocy5zYXZlKGdseXBoKTtcbn1cblxuY29uc3QgYWRkU2ltcGxpZmllZEFuZFRyYWRpdGlvbmFsRmllbGRzID0gKGdseXBoKSA9PiB7XG4gIGNvbnN0IGRhdGEgPSBjamtsaWIuZ2V0Q2hhcmFjdGVyRGF0YShnbHlwaC5jaGFyYWN0ZXIpO1xuICBnbHlwaC5zaW1wbGlmaWVkID0gZGF0YS5zaW1wbGlmaWVkO1xuICBnbHlwaC50cmFkaXRpb25hbCA9IGRhdGEudHJhZGl0aW9uYWw7XG4gIEdseXBocy5zYXZlKGdseXBoKTtcbn1cblxuY29uc3QgYWRkU3Ryb2tlQ2FwcyA9IChnbHlwaCkgPT4ge1xuICBjb25zdCByYXcgPSBnbHlwaC5zdGFnZXMuc3Ryb2tlcztcbiAgaWYgKHJhdy5yYXcgfHwgcmF3LmNvcnJlY3RlZCkgcmV0dXJuO1xuICBnbHlwaC5zdGFnZXMuc3Ryb2tlcyA9IHtjb3JyZWN0ZWQ6IGZpeFN0cm9rZXMocmF3KSwgcmF3fTtcbiAgR2x5cGhzLnNhdmUoZ2x5cGgpO1xufVxuXG5jb25zdCBjaGVja1N0cm9rZUV4dHJhY3RvclN0YWJpbGl0eSA9IChnbHlwaCkgPT4ge1xuICBjb25zdCBzdHJva2VzID0gc3Ryb2tlX2V4dHJhY3Rvci5nZXRTdHJva2VzKFxuICAgICAgZ2x5cGguc3RhZ2VzLnBhdGgsIGdseXBoLnN0YWdlcy5icmlkZ2VzKTtcbiAgaWYgKCFfLmlzRXF1YWwoc3Ryb2tlcy5zdHJva2VzLnNvcnQoKSwgZ2x5cGguc3RhZ2VzLnN0cm9rZXMuc29ydCgpKSkge1xuICAgIGNvbnNvbGUubG9nKGBEaWZmZXJlbnQgc3Ryb2tlcyBmb3IgJHtnbHlwaC5jaGFyYWN0ZXJ9YCk7XG4gIH1cbn1cblxuY29uc3QgY29udmVydE9sZFBhdGhTY2hlbWFUb1NWR1BhdGggPSAocGF0aCkgPT4ge1xuICBjb25zdCB0ZXJtcyA9IFtdO1xuICBmb3IgKGxldCBzZWdtZW50IG9mIHBhdGgpIHtcbiAgICBhc3NlcnQoJ0xNUVonLmluZGV4T2Yoc2VnbWVudC50eXBlKSA+PSAwLCBzZWdtZW50LnR5cGUpO1xuICAgIHRlcm1zLnB1c2goc2VnbWVudC50eXBlKTtcbiAgICBpZiAoc2VnbWVudC54MSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0ZXJtcy5wdXNoKHNlZ21lbnQueDEpO1xuICAgICAgdGVybXMucHVzaChzZWdtZW50LnkxKTtcbiAgICB9XG4gICAgaWYgKHNlZ21lbnQueCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0ZXJtcy5wdXNoKHNlZ21lbnQueCk7XG4gICAgICB0ZXJtcy5wdXNoKHNlZ21lbnQueSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0ZXJtcy5qb2luKCcgJyk7XG59XG5cbmNvbnN0IGR1bXBHbHlwaCA9IChkaWN0aW9uYXJ5LCBncmFwaGljcykgPT4gKGdseXBoKSA9PiB7XG4gIGlmICghZ2x5cGguc3RhZ2VzLnZlcmlmaWVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGFuYWx5c2lzID0gZ2x5cGguc3RhZ2VzLmFuYWx5c2lzO1xuICBjb25zdCBvcmRlciA9IGdseXBoLnN0YWdlcy5vcmRlcjtcbiAgY29uc3QgZGF0YSA9IGNqa2xpYi5nZXRDaGFyYWN0ZXJEYXRhKGdseXBoLmNoYXJhY3Rlcik7XG4gIGNvbnN0IHBpbnlpbiA9IChnbHlwaC5tZXRhZGF0YS5waW55aW4gfHwgZGF0YS5waW55aW4gfHwgJycpXG4gICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJywnKS5tYXAoKHgpID0+IHgudHJpbSgpKS5maWx0ZXIoKHgpID0+IHgpO1xuICBjb25zdCBzdHJva2VzID0gb3JkZXIubWFwKCh4KSA9PiBnbHlwaC5zdGFnZXMuc3Ryb2tlcy5jb3JyZWN0ZWRbeC5zdHJva2VdKTtcbiAgY29uc3QgbWVkaWFucyA9IG9yZGVyLm1hcCgoeCkgPT4geC5tZWRpYW4pO1xuICBzdHJva2VzLm1hcCgoeCkgPT4gYXNzZXJ0KHgpKTtcbiAgbWVkaWFucy5tYXAoKHgpID0+IGFzc2VydCh4KSk7XG4gIGNvbnN0IGhhc19ldHltb2xvZ3kgPVxuICAgICAgYW5hbHlzaXMuZXR5bW9sb2d5LmhpbnQgfHwgKGFuYWx5c2lzLmV0eW1vbG9neS50eXBlID09PSAncGljdG9waG9uZXRpYycpO1xuXG4gIGRpY3Rpb25hcnkud3JpdGUoSlNPTi5zdHJpbmdpZnkoe1xuICAgIGNoYXJhY3RlcjogZ2x5cGguY2hhcmFjdGVyLFxuICAgIGRlZmluaXRpb246IGdseXBoLm1ldGFkYXRhLmRlZmluaXRpb24gfHwgZGF0YS5kZWZpbml0aW9uLFxuICAgIHBpbnlpbjogcGlueWluLFxuICAgIGRlY29tcG9zaXRpb246IGFuYWx5c2lzLmRlY29tcG9zaXRpb24gfHwgJ++8nycsXG4gICAgZXR5bW9sb2d5OiBoYXNfZXR5bW9sb2d5ID8gYW5hbHlzaXMuZXR5bW9sb2d5IDogdW5kZWZpbmVkLFxuICAgIHJhZGljYWw6IGFuYWx5c2lzLnJhZGljYWwsXG4gICAgbWF0Y2hlczogb3JkZXIubWFwKCh4KSA9PiB4Lm1hdGNoKSxcbiAgfSkgKyAnXFxuJyk7XG4gIGdyYXBoaWNzLndyaXRlKEpTT04uc3RyaW5naWZ5KHtcbiAgICBjaGFyYWN0ZXI6IGdseXBoLmNoYXJhY3RlcixcbiAgICBzdHJva2VzOiBzdHJva2VzLFxuICAgIG1lZGlhbnM6IG1lZGlhbnMsXG4gIH0pICsgJ1xcbicpO1xufVxuXG5jb25zdCBmaXhCcm9rZW5NZWRpYW5zID0gKGdseXBoLCB0aHJlc2hvbGQpID0+IHtcbiAgdGhyZXNob2xkID0gdGhyZXNob2xkIHx8IDE2O1xuICBmb3IgKGxldCBzdHJva2Ugb2YgZ2x5cGguc3RhZ2VzLm9yZGVyKSB7XG4gICAgY29uc3QgZGlzdGFuY2UgPSBNYXRoLnNxcnQoUG9pbnQuZGlzdGFuY2UyKFxuICAgICAgICBzdHJva2UubWVkaWFuWzBdLCBzdHJva2UubWVkaWFuW3N0cm9rZS5tZWRpYW4ubGVuZ3RoIC0gMV0pKTtcbiAgICBpZiAoZGlzdGFuY2UgPCB0aHJlc2hvbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCBicm9rZW4gbWVkaWFuIGluICR7Z2x5cGguY2hhcmFjdGVyfWApO1xuICAgICAgY29uc3QgcGF0aHMgPSBzdmcuY29udmVydFNWR1BhdGhUb1BhdGhzKFxuICAgICAgICAgIGdseXBoLnN0YWdlcy5zdHJva2VzW3N0cm9rZS5zdHJva2VdKTtcbiAgICAgIGFzc2VydChwYXRocy5sZW5ndGggPT09IDEpO1xuICAgICAgY29uc3QgcG9seWdvbiA9IHN2Zy5nZXRQb2x5Z29uQXBwcm94aW1hdGlvbihwYXRoc1swXSwgdGhyZXNob2xkKTtcbiAgICAgIGxldCBiZXN0X3BvaW50ID0gbnVsbDtcbiAgICAgIGxldCBiZXN0X3ZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZm9yIChsZXQgcG9pbnQgb2YgcG9seWdvbikge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IFBvaW50LmRpc3RhbmNlMihwb2ludCwgc3Ryb2tlLm1lZGlhblswXSlcbiAgICAgICAgaWYgKHZhbHVlID4gYmVzdF92YWx1ZSkge1xuICAgICAgICAgIGJlc3RfcG9pbnQgPSBwb2ludDtcbiAgICAgICAgICBiZXN0X3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFzc2VydChiZXN0X3BvaW50ICE9PSBudWxsKTtcbiAgICAgIHN0cm9rZS5tZWRpYW4gPSBbYmVzdF9wb2ludCwgc3Ryb2tlLm1lZGlhblswXV07XG4gICAgICBHbHlwaHMuc2F2ZShnbHlwaCk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IG1pZ3JhdGVPbGRHbHlwaFNjaGVtYVRvTmV3ID0gKGdseXBoKSA9PiB7XG4gIGNvbnN0IGNvZGVwb2ludCA9IHBhcnNlSW50KGdseXBoLm5hbWUuc3Vic3RyKDMpLCAxNik7XG4gIGNvbnN0IGNoYXJhY3RlciA9IFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGVwb2ludCk7XG4gIGNvbnN0IGRhdGEgPSBjamtsaWIuZ2V0Q2hhcmFjdGVyRGF0YShjaGFyYWN0ZXIpO1xuICBhc3NlcnQoZ2x5cGgubWFudWFsICYmIGdseXBoLm1hbnVhbC52ZXJpZmllZCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgYEdseXBoICR7Y2hhcmFjdGVyfSB3YXMgbm90IHZlcmlmaWVkLmApO1xuICAvLyBQdWxsIGRlZmluaXRpb24gYW5kIHBpbnlpbiBmcm9tIHNpbXBsaWZpZWQgY2hhcmFjdGVyLCBpZiBhdmFpbGFibGUuXG4gIGxldCBkZWZpbml0aW9uID0gdW5kZWZpbmVkO1xuICBsZXQgcGlueWluID0gdW5kZWZpbmVkO1xuICBpZiAoZGF0YS5zaW1wbGlmaWVkKSB7XG4gICAgY29uc3Qgc2ltcGxpZmllZCA9IEdseXBocy5nZXQoZGF0YS5zaW1wbGlmaWVkKTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IChzaW1wbGlmaWVkIHx8IHttZXRhZGF0YToge319KS5tZXRhZGF0YTtcbiAgICBjb25zdCBiYXNlID0gY2prbGliLmdldENoYXJhY3RlckRhdGEoZGF0YS5zaW1wbGlmaWVkKTtcbiAgICBkZWZpbml0aW9uID0gbWV0YWRhdGEuZGVmaW5pdGlvbiB8fCBiYXNlLmRlZmluaXRpb247XG4gICAgcGlueWluID0gbWV0YWRhdGEucGlueWluIHx8IGJhc2UucGlueWluO1xuICB9XG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICBjaGFyYWN0ZXI6IGNoYXJhY3RlcixcbiAgICBjb2RlcG9pbnQ6IGNvZGVwb2ludCxcbiAgICBtZXRhZGF0YToge1xuICAgICAgZGVmaW5pdGlvbjogZGVmaW5pdGlvbixcbiAgICAgIGZyZXF1ZW5jeTogZGF0YS5mcmVxdWVuY3ksXG4gICAgICBrYW5neGlfaW5kZXg6IGRhdGEua2FuZ3hpX2luZGV4LFxuICAgICAgcGlueWluOiBwaW55aW4sXG4gICAgICBzdHJva2VzOiB1bmRlZmluZWQsXG4gICAgfSxcbiAgICBzdGFnZXM6IHtcbiAgICAgIHBhdGg6IGNvbnZlcnRPbGRQYXRoU2NoZW1hVG9TVkdQYXRoKGdseXBoLnBhdGgpLFxuICAgICAgYnJpZGdlczogZ2x5cGgubWFudWFsLmJyaWRnZXMsXG4gICAgICBzdHJva2VzOiBnbHlwaC5kZXJpdmVkLnN0cm9rZXMsXG4gICAgICBhbmFseXNpczogdW5kZWZpbmVkLFxuICAgICAgb3JkZXI6IHVuZGVmaW5lZCxcbiAgICAgIHZlcmlmaWVkOiB1bmRlZmluZWQsXG4gICAgfSxcbiAgICBzaW1wbGlmaWVkOiBkYXRhLnNpbXBsaWZpZWQsXG4gICAgdHJhZGl0aW9uYWw6IGRhdGEudHJhZGl0aW9uYWwsXG4gIH07XG4gIGFzc2VydChyZXN1bHQuc3RhZ2VzLnBhdGggIT09IHVuZGVmaW5lZCk7XG4gIGFzc2VydChyZXN1bHQuc3RhZ2VzLmJyaWRnZXMgIT09IHVuZGVmaW5lZCk7XG4gIGFzc2VydChyZXN1bHQuc3RhZ2VzLnN0cm9rZXMgIT09IHVuZGVmaW5lZCk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIE1ldGVvciBtZXRob2RzIHRoYXQgbWFrZSB1c2Ugb2YgdGhlIG1pZ3JhdGlvbiBzeXN0ZW0gZm9sbG93LlxuXG5jb25zdCBkdW1wVG9OZXdTY2hlbWFKU09OID0gKCkgPT4ge1xuICBjb25zdCBmcyA9IE5wbS5yZXF1aXJlKCdmcycpO1xuICBjb25zdCBwYXRoID0gTnBtLnJlcXVpcmUoJ3BhdGgnKTtcbiAgY29uc3QgcHdkID0gZ2V0UFdEKCk7XG4gIGNvbnN0IGRpY3Rpb25hcnkgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShwYXRoLmpvaW4ocHdkLCAnZGljdGlvbmFyeS50eHQnKSk7XG4gIGNvbnN0IGdyYXBoaWNzID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0ocGF0aC5qb2luKHB3ZCwgJ2dyYXBoaWNzLnR4dCcpKTtcbiAgcnVuTWlncmF0aW9uKGR1bXBHbHlwaChkaWN0aW9uYXJ5LCBncmFwaGljcyksICgoKSA9PiB7XG4gICAgZGljdGlvbmFyeS5lbmQoKTtcbiAgICBncmFwaGljcy5lbmQoKTtcbiAgfSkpO1xufVxuXG5jb25zdCBleHBvcnRTVkdzID0gKCkgPT4ge1xuICBjb25zdCBmcyA9IE5wbS5yZXF1aXJlKCdmcycpO1xuICBjb25zdCBwYXRoID0gTnBtLnJlcXVpcmUoJ3BhdGgnKTtcbiAgY29uc3QgcHdkID0gZ2V0UFdEKCk7XG4gIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguam9pbihwd2QsICcuc3ZncycpO1xuICBmcy5ta2RpclN5bmMoZGlyZWN0b3J5KTtcbiAgcnVuTWlncmF0aW9uKChnbHlwaCkgPT4ge1xuICAgIGNvbnN0IGNvZGVwb2ludCA9IGdseXBoLmNoYXJhY3Rlci5jb2RlUG9pbnRBdCgwKTtcbiAgICBjb25zdCBtZWRpYW5zID0gZ2x5cGguc3RhZ2VzLm9yZGVyLm1hcCgoeCkgPT4geC5tZWRpYW4pO1xuICAgIGNvbnN0IHN0cm9rZXMgPSBnbHlwaC5zdGFnZXMub3JkZXIubWFwKFxuICAgICAgICAoeCkgPT4gZ2x5cGguc3RhZ2VzLnN0cm9rZXMuY29ycmVjdGVkW3guc3Ryb2tlXSk7XG4gICAgY29uc3QgcmF3ID0gU1NSLnJlbmRlcignYW5pbWF0aW9uJywgZ2V0QW5pbWF0aW9uRGF0YShzdHJva2VzLCBtZWRpYW5zKSk7XG4gICAgY29uc3Qgc3ZnID0gcmF3LnJlcGxhY2UoL1xcbiAgL2csICdcXG4nKS5zcGxpdCgnXFxuJykuc2xpY2UoMSwgLTIpLmpvaW4oJ1xcbicpO1xuICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKGRpcmVjdG9yeSwgYCR7Y29kZXBvaW50fS5zdmdgKSwgc3ZnKTtcbiAgfSwgKCkgPT4ge30pO1xufVxuXG5jb25zdCBsb2FkRnJvbU9sZFNjaGVtYUpTT04gPSAoZmlsZW5hbWUpID0+IHtcbiAgY29uc3QgZnMgPSBOcG0ucmVxdWlyZSgnZnMnKTtcbiAgY29uc3QgcGF0aCA9IE5wbS5yZXF1aXJlKCdwYXRoJyk7XG4gIGNvbnN0IGZpbGVwYXRoID0gcGF0aC5qb2luKGdldFBXRCgpLCAncHVibGljJywgZmlsZW5hbWUpO1xuICBmcy5yZWFkRmlsZShmaWxlcGF0aCwgJ3V0ZjgnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChlcnJvciwgZGF0YSkgPT4ge1xuICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG4gICAgY29uc3QgbGluZXMgPSBkYXRhLnNwbGl0KCdcXG4nKS5maWx0ZXIoKHgpID0+IHgubGVuZ3RoID4gMCk7XG4gICAgY29uc29sZS5sb2coYExvYWRlZCAke2xpbmVzLmxlbmd0aH0gb2xkLXNjaGVtYSBnbHlwaHMuYCk7XG4gICAgbGV0IG1pZ3JhdGVkID0gMDtcbiAgICBsZXQgZGVmaW5pdGlvbiA9IDA7XG4gICAgbGV0IHBpbnlpbiA9IDA7XG4gICAgZm9yICh2YXIgbGluZSBvZiBsaW5lcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgb2xkX2dseXBoID0gSlNPTi5wYXJzZShsaW5lKTtcbiAgICAgICAgY29uc3QgbmV3X2dseXBoID0gbWlncmF0ZU9sZEdseXBoU2NoZW1hVG9OZXcob2xkX2dseXBoKTtcbiAgICAgICAgY29uc3QgZ2x5cGggPSBHbHlwaHMuZ2V0KG5ld19nbHlwaC5jaGFyYWN0ZXIpO1xuICAgICAgICBpZiAoZ2x5cGggJiYgZ2x5cGguc3RhZ2VzLnZlcmlmaWVkKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYEdseXBoIGFscmVhZHkgdmVyaWZpZWQ6ICR7Z2x5cGguY2hhcmFjdGVyfWApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIEdseXBocy5zYXZlKG5ld19nbHlwaCk7XG4gICAgICAgIG1pZ3JhdGVkICs9IDE7XG4gICAgICAgIGRlZmluaXRpb24gKz0gbmV3X2dseXBoLm1ldGFkYXRhLmRlZmluaXRpb24gPyAxIDogMDtcbiAgICAgICAgcGlueWluICs9IG5ld19nbHlwaC5tZXRhZGF0YS5waW55aW4gPyAxIDogMDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgU3VjY2Vzc2Z1bGx5IG1pZ3JhdGVkICR7bWlncmF0ZWR9IGdseXBocy5gKTtcbiAgICBjb25zb2xlLmxvZyhgUHVsbGVkIGRlZmluaXRpb25zIGZvciAke2RlZmluaXRpb259IGdseXBocy5gKTtcbiAgICBjb25zb2xlLmxvZyhgUHVsbGVkIHBpbnlpbiBmb3IgJHtwaW55aW59IGdseXBocy5gKTtcbiAgfSkpO1xufVxuXG4vLyBSdW5zIHRoZSBnaXZlbiBwZXItZ2x5cGggY2FsbGJhY2sgZm9yIGVhY2ggZ2x5cGggaW4gdGhlIGRhdGFiYXNlLlxuLy8gV2hlbiBhbGwgdGhlIGdseXBocyBhcmUgbWlncmF0ZWQsIHJ1bnMgdGhlIGNvbXBsZXRpb24gY2FsbGJhY2suXG5jb25zdCBydW5NaWdyYXRpb24gPSAocGVyX2dseXBoX2NhbGxiYWNrLCBjb21wbGV0aW9uX2NhbGxiYWNrKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdSdW5uaW5nIG1pZ3JhdGlvbi4uLicpO1xuICBpZiAocGVyX2dseXBoX2NhbGxiYWNrKSB7XG4gICAgY29uc3QgY29kZXBvaW50cyA9XG4gICAgICAgIEdseXBocy5maW5kKHt9LCB7ZmllbGRzOiB7Y29kZXBvaW50OiAxfSwgc29ydDoge2NvZGVwb2ludDogMX19KS5mZXRjaCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29kZXBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZ2x5cGggPSBHbHlwaHMuZmluZE9uZSh7Y29kZXBvaW50OiBjb2RlcG9pbnRzW2ldLmNvZGVwb2ludH0pO1xuICAgICAgYXNzZXJ0KGdseXBoLCAnR2x5cGhzIGNoYW5nZWQgZHVyaW5nIG1pZ3JhdGlvbiEnKTtcbiAgICAgIHBlcl9nbHlwaF9jYWxsYmFjayhnbHlwaCk7XG4gICAgICBpZiAoKGkgKyAxKSAlIDEwMDAgPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYE1pZ3JhdGVkICR7aSArIDF9IGdseXBocy5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGNvbXBsZXRpb25fY2FsbGJhY2spIHtcbiAgICBjb21wbGV0aW9uX2NhbGxiYWNrKCk7XG4gIH1cbiAgY29uc29sZS5sb2coJ01pZ3JhdGlvbiBjb21wbGV0ZS4nKTtcbn1cblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAnZXhwb3J0JzogKCkgPT4ge1xuICAgIGNqa2xpYi5wcm9taXNlLnRoZW4oTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChkdW1wVG9OZXdTY2hlbWFKU09OKSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSkpO1xuICB9LFxuICAnZXhwb3J0U1ZHcyc6IGV4cG9ydFNWR3MsXG4gICdsb2FkRnJvbU9sZFNjaGVtYUpTT04nOiAoZmlsZW5hbWUpID0+IHtcbiAgICBjamtsaWIucHJvbWlzZS50aGVuKFxuICAgICAgICBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IGxvYWRGcm9tT2xkU2NoZW1hSlNPTihmaWxlbmFtZSkpKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKSk7XG4gIH0sXG59KTtcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICBTU1IuY29tcGlsZVRlbXBsYXRlKCdhbmltYXRpb24nLCBBc3NldHMuZ2V0VGV4dCgnYW5pbWF0aW9uLmh0bWwnKSk7XG4gIGNvbnN0IGNvbXBsZXRpb25fY2FsbGJhY2sgPSB1bmRlZmluZWQ7XG4gIGNvbnN0IHBlcl9nbHlwaF9jYWxsYmFjayA9IHVuZGVmaW5lZDtcbiAgaWYgKCFwZXJfZ2x5cGhfY2FsbGJhY2sgJiYgIWNvbXBsZXRpb25fY2FsbGJhY2spIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc29sZS5sb2coJ1ByZXBhcmluZyBmb3IgbWlncmF0aW9uLi4uJyk7XG4gIGNvbnN0IG1pZ3JhdGlvbiA9ICgpID0+IHJ1bk1pZ3JhdGlvbihwZXJfZ2x5cGhfY2FsbGJhY2ssIGNvbXBsZXRpb25fY2FsbGJhY2spO1xuICBjamtsaWIucHJvbWlzZS50aGVuKE1ldGVvci5iaW5kRW52aXJvbm1lbnQobWlncmF0aW9uKSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUpKTtcbn0pO1xuIiwiaW1wb3J0IHtnZXRQV0R9IGZyb20gJy9saWIvYmFzZSc7XG5pbXBvcnQge1Byb2dyZXNzfSBmcm9tICcvbGliL2dseXBocyc7XG5cbmNvbnN0IGNoaWxkX3Byb2Nlc3MgPSBOcG0ucmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpO1xuY29uc3QgcGF0aCA9IE5wbS5yZXF1aXJlKCdwYXRoJyk7XG5cbmNvbnN0IGdldEJhY2t1cFBhdGggPSAoKSA9PiB7XG4gIHJldHVybiBwYXRoLmpvaW4oZ2V0UFdEKCksICdzZXJ2ZXInLCAnYmFja3VwJyk7XG59XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgYmFja3VwKCkge1xuICAgIGNvbnN0IHBhdGggPSBnZXRCYWNrdXBQYXRoKCk7XG4gICAgY2hpbGRfcHJvY2Vzcy5zcGF3bignbW9uZ29kdW1wJywgWyctLXBvcnQnLCAnMzAwMScsICctLW91dCcsIHBhdGhdKTtcbiAgICBQcm9ncmVzcy51cGRhdGUoe30sIHskc2V0OiB7YmFja3VwOiB0cnVlfX0pO1xuICB9LFxuICByZXN0b3JlKCkge1xuICAgIGNvbnN0IHBhdGggPSBnZXRCYWNrdXBQYXRoKCk7XG4gICAgY2hpbGRfcHJvY2Vzcy5zcGF3bignbW9uZ29yZXN0b3JlJywgWyctLXBvcnQnLCAnMzAwMScsICctLWRyb3AnLCBwYXRoXSk7XG4gIH0sXG59KTtcbiIsImltcG9ydCB7YXNzZXJ0fSBmcm9tICcvbGliL2Jhc2UnO1xuaW1wb3J0IHtHbHlwaHN9IGZyb20gJy9saWIvZ2x5cGhzJztcblxuZnVuY3Rpb24gZXZhbHVhdGUoZ2x5cGhzLCBjbGFzc2lmaWVyKSB7XG4gIHZhciBudW1fY29ycmVjdCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ2x5cGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoZWNrX2NsYXNzaWZpZXJfb25fZ2x5cGgoZ2x5cGhzW2ldLCBjbGFzc2lmaWVyKSkge1xuICAgICAgbnVtX2NvcnJlY3QgKz0gMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bV9jb3JyZWN0L2dseXBocy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIHRyYWluX25ldXJhbF9uZXQoKSB7XG4gIHZhciBnbHlwaHMgPSBHbHlwaHMuZmluZCh7J21hbnVhbC52ZXJpZmllZCc6IHRydWV9KS5mZXRjaCgpO1xuICB2YXIgc2FtcGxlID0gXy5zYW1wbGUoZ2x5cGhzLCA0MDApO1xuICBjb25zb2xlLmxvZygnSGFuZC10dW5lZCBhY2N1cmFjeTonLCBldmFsdWF0ZShzYW1wbGUsIGhhbmRfdHVuZWRfY2xhc3NpZmllcikpO1xuXG4gIHZhciB0cmFpbmluZ19kYXRhID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ2x5cGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGdseXBoX2RhdGEgPSBnZXRfZ2x5cGhfdHJhaW5pbmdfZGF0YShnbHlwaHNbaV0pO1xuICAgIHZhciBwb3NpdGl2ZV9kYXRhID0gZ2x5cGhfZGF0YS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4geFsxXSA+IDA7IH0pO1xuICAgIHZhciBuZWdhdGl2ZV9kYXRhID0gZ2x5cGhfZGF0YS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4geFsxXSA9PT0gMDsgfSk7XG4gICAgaWYgKHBvc2l0aXZlX2RhdGEubGVuZ3RoID4gbmVnYXRpdmVfZGF0YS5sZW5ndGgpIHtcbiAgICAgIHBvc2l0aXZlX2RhdGEgPSBfLnNhbXBsZShwb3NpdGl2ZV9kYXRhLCBuZWdhdGl2ZV9kYXRhLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5lZ2F0aXZlX2RhdGEgPSBfLnNhbXBsZShuZWdhdGl2ZV9kYXRhLCBwb3NpdGl2ZV9kYXRhLmxlbmd0aCk7XG4gICAgfVxuICAgIGdseXBoX2RhdGEgPSBuZWdhdGl2ZV9kYXRhLmNvbmNhdChwb3NpdGl2ZV9kYXRhKTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdseXBoX2RhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgIHRyYWluaW5nX2RhdGEucHVzaChnbHlwaF9kYXRhW2pdKTtcbiAgICB9XG4gIH1cbiAgY29uc29sZS5sb2coJ0dvdCAnICsgdHJhaW5pbmdfZGF0YS5sZW5ndGggKyAnIHJvd3Mgb2YgdHJhaW5pbmcgZGF0YS4nKTtcblxuICB2YXIgbmV0ID0gbmV3IGNvbnZuZXRqcy5OZXQoKTtcbiAgbmV0Lm1ha2VMYXllcnMoW1xuICAgIHt0eXBlOiAnaW5wdXQnLCBvdXRfc3g6IDEsIG91dF9zeTogMSwgb3V0X2RlcHRoOiA4fSxcbiAgICB7dHlwZTogJ2ZjJywgbnVtX25ldXJvbnM6IDgsIGFjdGl2YXRpb246ICd0YW5oJ30sXG4gICAge3R5cGU6ICdmYycsIG51bV9uZXVyb25zOiA4LCBhY3RpdmF0aW9uOiAndGFuaCd9LFxuICAgIHt0eXBlOiAnc29mdG1heCcsIG51bV9jbGFzc2VzOiAyfSxcbiAgXSk7XG4gIHZhciB0cmFpbmVyID0gbmV3IGNvbnZuZXRqcy5UcmFpbmVyKFxuICAgICAgbmV0LCB7bWV0aG9kOiAnYWRhZGVsdGEnLCBsMl9kZWNheTogMC4wMDEsIGJhdGNoX3NpemU6IDEwfSk7XG4gIHZhciBpbnB1dCA9IG5ldyBjb252bmV0anMuVm9sKDEsIDEsIDgpO1xuICBmb3IgKHZhciBpdGVyYXRpb24gPSAwOyBpdGVyYXRpb24gPCAxMDsgaXRlcmF0aW9uKyspIHtcbiAgICB2YXIgbG9zcyA9IDA7XG4gICAgdmFyIHJvdW5kX2RhdGEgPSBfLnNhbXBsZSh0cmFpbmluZ19kYXRhLCA0MDAwKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvdW5kX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFzc2VydChpbnB1dC53Lmxlbmd0aCA9PT0gcm91bmRfZGF0YVtpXVswXS5sZW5ndGgpO1xuICAgICAgaW5wdXQudyA9IHJvdW5kX2RhdGFbaV1bMF07XG4gICAgICB2YXIgc3RhdHMgPSB0cmFpbmVyLnRyYWluKGlucHV0LCByb3VuZF9kYXRhW2ldWzFdKTtcbiAgICAgIGFzc2VydCghaXNOYU4oc3RhdHMubG9zcykpXG4gICAgICBsb3NzICs9IHN0YXRzLmxvc3M7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdJdGVyYXRpb24nLCBpdGVyYXRpb24sICdtZWFuIGxvc3M6JywgbG9zcy9yb3VuZF9kYXRhLmxlbmd0aCk7XG4gIH1cbiAgY29uc29sZS5sb2coJ1RyYWluZWQgbmV1cmFsIG5ldHdvcms6JywgSlNPTi5zdHJpbmdpZnkobmV0LnRvSlNPTigpKSk7XG5cbiAgZnVuY3Rpb24gbmV0X2NsYXNzaWZpZXIoZmVhdHVyZXMpIHtcbiAgICBhc3NlcnQoaW5wdXQudy5sZW5ndGggPT09IGZlYXR1cmVzLmxlbmd0aCk7XG4gICAgaW5wdXQudyA9IGZlYXR1cmVzO1xuICAgIHZhciBzb2Z0bWF4ID0gbmV0LmZvcndhcmQoaW5wdXQpLnc7XG4gICAgYXNzZXJ0KHNvZnRtYXgubGVuZ3RoID09PSAyKTtcbiAgICByZXR1cm4gc29mdG1heFsxXSAtIHNvZnRtYXhbMF07XG4gIH1cbiAgY29uc29sZS5sb2coJ05ldXJhbC1uZXQgYWNjdXJhY3k6JywgZXZhbHVhdGUoc2FtcGxlLCBuZXRfY2xhc3NpZmllcikpO1xuXG4gIGZ1bmN0aW9uIGNvbWJpbmVkX2NsYXNzaWZpZXIod2VpZ2h0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGZlYXR1cmVzKSB7XG4gICAgICByZXR1cm4gaGFuZF90dW5lZF9jbGFzc2lmaWVyKGZlYXR1cmVzKSArIHdlaWdodCpuZXRfY2xhc3NpZmllcihmZWF0dXJlcyk7XG4gICAgfVxuICB9XG4gIHZhciB3ZWlnaHRzID0gWzAsIDAuMSwgMC4yLCAwLjMsIDAuNCwgMC41LCAwLjYsIDAuNywgMC44LCAwLjksIDFdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHdlaWdodHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zb2xlLmxvZygnV2VpZ2h0JywgIHdlaWdodHNbaV0sICdjb21iaW5lZCBhY2N1cmFjeTonLFxuICAgICAgICAgICAgICAgIGV2YWx1YXRlKHNhbXBsZSwgY29tYmluZWRfY2xhc3NpZmllcih3ZWlnaHRzW2ldKSkpO1xuICB9XG59XG4iXX0=
