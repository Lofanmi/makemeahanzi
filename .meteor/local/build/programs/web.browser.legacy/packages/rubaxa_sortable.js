//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Template = Package['templating-runtime'].Template;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var Sortable;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rubaxa_sortable/packages/rubaxa_sortable.js              //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/Sortable.js                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**!                                                                                                                  // 1
 * Sortable                                                                                                           // 2
 * @author	RubaXa   <trash@rubaxa.org>                                                                                // 3
 * @license MIT                                                                                                       // 4
 */                                                                                                                   // 5
                                                                                                                      // 6
                                                                                                                      // 7
(function (factory) {                                                                                                 // 8
	"use strict";                                                                                                        // 9
                                                                                                                      // 10
	if (typeof define === "function" && define.amd) {                                                                    // 11
		define(factory);                                                                                                    // 12
	}                                                                                                                    // 13
	else if (typeof module != "undefined" && typeof module.exports != "undefined") {                                     // 14
		module.exports = factory();                                                                                         // 15
	}                                                                                                                    // 16
	else if (typeof Package !== "undefined") {                                                                           // 17
		Sortable = factory();  // export for Meteor.js                                                                      // 18
	}                                                                                                                    // 19
	else {                                                                                                               // 20
		/* jshint sub:true */                                                                                               // 21
		window["Sortable"] = factory();                                                                                     // 22
	}                                                                                                                    // 23
})(function () {                                                                                                      // 24
	"use strict";                                                                                                        // 25
                                                                                                                      // 26
	var dragEl,                                                                                                          // 27
		parentEl,                                                                                                           // 28
		ghostEl,                                                                                                            // 29
		cloneEl,                                                                                                            // 30
		rootEl,                                                                                                             // 31
		nextEl,                                                                                                             // 32
                                                                                                                      // 33
		scrollEl,                                                                                                           // 34
		scrollParentEl,                                                                                                     // 35
                                                                                                                      // 36
		lastEl,                                                                                                             // 37
		lastCSS,                                                                                                            // 38
		lastParentCSS,                                                                                                      // 39
                                                                                                                      // 40
		oldIndex,                                                                                                           // 41
		newIndex,                                                                                                           // 42
                                                                                                                      // 43
		activeGroup,                                                                                                        // 44
		autoScroll = {},                                                                                                    // 45
                                                                                                                      // 46
		tapEvt,                                                                                                             // 47
		touchEvt,                                                                                                           // 48
                                                                                                                      // 49
		moved,                                                                                                              // 50
                                                                                                                      // 51
		/** @const */                                                                                                       // 52
		RSPACE = /\s+/g,                                                                                                    // 53
                                                                                                                      // 54
		expando = 'Sortable' + (new Date).getTime(),                                                                        // 55
                                                                                                                      // 56
		win = window,                                                                                                       // 57
		document = win.document,                                                                                            // 58
		parseInt = win.parseInt,                                                                                            // 59
                                                                                                                      // 60
		supportDraggable = !!('draggable' in document.createElement('div')),                                                // 61
		supportCssPointerEvents = (function (el) {                                                                          // 62
			el = document.createElement('x');                                                                                  // 63
			el.style.cssText = 'pointer-events:auto';                                                                          // 64
			return el.style.pointerEvents === 'auto';                                                                          // 65
		})(),                                                                                                               // 66
                                                                                                                      // 67
		_silent = false,                                                                                                    // 68
                                                                                                                      // 69
		abs = Math.abs,                                                                                                     // 70
		slice = [].slice,                                                                                                   // 71
                                                                                                                      // 72
		touchDragOverListeners = [],                                                                                        // 73
                                                                                                                      // 74
		_autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {                      // 75
			// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521                                                        // 76
			if (rootEl && options.scroll) {                                                                                    // 77
				var el,                                                                                                           // 78
					rect,                                                                                                            // 79
					sens = options.scrollSensitivity,                                                                                // 80
					speed = options.scrollSpeed,                                                                                     // 81
                                                                                                                      // 82
					x = evt.clientX,                                                                                                 // 83
					y = evt.clientY,                                                                                                 // 84
                                                                                                                      // 85
					winWidth = window.innerWidth,                                                                                    // 86
					winHeight = window.innerHeight,                                                                                  // 87
                                                                                                                      // 88
					vx,                                                                                                              // 89
					vy                                                                                                               // 90
				;                                                                                                                 // 91
                                                                                                                      // 92
				// Delect scrollEl                                                                                                // 93
				if (scrollParentEl !== rootEl) {                                                                                  // 94
					scrollEl = options.scroll;                                                                                       // 95
					scrollParentEl = rootEl;                                                                                         // 96
                                                                                                                      // 97
					if (scrollEl === true) {                                                                                         // 98
						scrollEl = rootEl;                                                                                              // 99
                                                                                                                      // 100
						do {                                                                                                            // 101
							if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||                                                           // 102
								(scrollEl.offsetHeight < scrollEl.scrollHeight)                                                               // 103
							) {                                                                                                            // 104
								break;                                                                                                        // 105
							}                                                                                                              // 106
							/* jshint boss:true */                                                                                         // 107
						} while (scrollEl = scrollEl.parentNode);                                                                       // 108
					}                                                                                                                // 109
				}                                                                                                                 // 110
                                                                                                                      // 111
				if (scrollEl) {                                                                                                   // 112
					el = scrollEl;                                                                                                   // 113
					rect = scrollEl.getBoundingClientRect();                                                                         // 114
					vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);                                               // 115
					vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);                                               // 116
				}                                                                                                                 // 117
                                                                                                                      // 118
                                                                                                                      // 119
				if (!(vx || vy)) {                                                                                                // 120
					vx = (winWidth - x <= sens) - (x <= sens);                                                                       // 121
					vy = (winHeight - y <= sens) - (y <= sens);                                                                      // 122
                                                                                                                      // 123
					/* jshint expr:true */                                                                                           // 124
					(vx || vy) && (el = win);                                                                                        // 125
				}                                                                                                                 // 126
                                                                                                                      // 127
                                                                                                                      // 128
				if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {                                       // 129
					autoScroll.el = el;                                                                                              // 130
					autoScroll.vx = vx;                                                                                              // 131
					autoScroll.vy = vy;                                                                                              // 132
                                                                                                                      // 133
					clearInterval(autoScroll.pid);                                                                                   // 134
                                                                                                                      // 135
					if (el) {                                                                                                        // 136
						autoScroll.pid = setInterval(function () {                                                                      // 137
							if (el === win) {                                                                                              // 138
								win.scrollTo(win.pageXOffset + vx * speed, win.pageYOffset + vy * speed);                                     // 139
							} else {                                                                                                       // 140
								vy && (el.scrollTop += vy * speed);                                                                           // 141
								vx && (el.scrollLeft += vx * speed);                                                                          // 142
							}                                                                                                              // 143
						}, 24);                                                                                                         // 144
					}                                                                                                                // 145
				}                                                                                                                 // 146
			}                                                                                                                  // 147
		}, 30),                                                                                                             // 148
                                                                                                                      // 149
		_prepareGroup = function (options) {                                                                                // 150
			var group = options.group;                                                                                         // 151
                                                                                                                      // 152
			if (!group || typeof group != 'object') {                                                                          // 153
				group = options.group = {name: group};                                                                            // 154
			}                                                                                                                  // 155
                                                                                                                      // 156
			['pull', 'put'].forEach(function (key) {                                                                           // 157
				if (!(key in group)) {                                                                                            // 158
					group[key] = true;                                                                                               // 159
				}                                                                                                                 // 160
			});                                                                                                                // 161
                                                                                                                      // 162
			options.groups = ' ' + group.name + (group.put.join ? ' ' + group.put.join(' ') : '') + ' ';                       // 163
		}                                                                                                                   // 164
	;                                                                                                                    // 165
                                                                                                                      // 166
                                                                                                                      // 167
                                                                                                                      // 168
	/**                                                                                                                  // 169
	 * @class  Sortable                                                                                                  // 170
	 * @param  {HTMLElement}  el                                                                                         // 171
	 * @param  {Object}       [options]                                                                                  // 172
	 */                                                                                                                  // 173
	function Sortable(el, options) {                                                                                     // 174
		if (!(el && el.nodeType && el.nodeType === 1)) {                                                                    // 175
			throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);                                       // 176
		}                                                                                                                   // 177
                                                                                                                      // 178
		this.el = el; // root element                                                                                       // 179
		this.options = options = _extend({}, options);                                                                      // 180
                                                                                                                      // 181
                                                                                                                      // 182
		// Export instance                                                                                                  // 183
		el[expando] = this;                                                                                                 // 184
                                                                                                                      // 185
                                                                                                                      // 186
		// Default options                                                                                                  // 187
		var defaults = {                                                                                                    // 188
			group: Math.random(),                                                                                              // 189
			sort: true,                                                                                                        // 190
			disabled: false,                                                                                                   // 191
			store: null,                                                                                                       // 192
			handle: null,                                                                                                      // 193
			scroll: true,                                                                                                      // 194
			scrollSensitivity: 30,                                                                                             // 195
			scrollSpeed: 10,                                                                                                   // 196
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',                                                               // 197
			ghostClass: 'sortable-ghost',                                                                                      // 198
			chosenClass: 'sortable-chosen',                                                                                    // 199
			ignore: 'a, img',                                                                                                  // 200
			filter: null,                                                                                                      // 201
			animation: 0,                                                                                                      // 202
			setData: function (dataTransfer, dragEl) {                                                                         // 203
				dataTransfer.setData('Text', dragEl.textContent);                                                                 // 204
			},                                                                                                                 // 205
			dropBubble: false,                                                                                                 // 206
			dragoverBubble: false,                                                                                             // 207
			dataIdAttr: 'data-id',                                                                                             // 208
			delay: 0,                                                                                                          // 209
			forceFallback: false,                                                                                              // 210
			fallbackClass: 'sortable-fallback',                                                                                // 211
			fallbackOnBody: false                                                                                              // 212
		};                                                                                                                  // 213
                                                                                                                      // 214
                                                                                                                      // 215
		// Set default options                                                                                              // 216
		for (var name in defaults) {                                                                                        // 217
			!(name in options) && (options[name] = defaults[name]);                                                            // 218
		}                                                                                                                   // 219
                                                                                                                      // 220
		_prepareGroup(options);                                                                                             // 221
                                                                                                                      // 222
		// Bind all private methods                                                                                         // 223
		for (var fn in this) {                                                                                              // 224
			if (fn.charAt(0) === '_') {                                                                                        // 225
				this[fn] = this[fn].bind(this);                                                                                   // 226
			}                                                                                                                  // 227
		}                                                                                                                   // 228
                                                                                                                      // 229
		// Setup drag mode                                                                                                  // 230
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;                                            // 231
                                                                                                                      // 232
		// Bind events                                                                                                      // 233
		_on(el, 'mousedown', this._onTapStart);                                                                             // 234
		_on(el, 'touchstart', this._onTapStart);                                                                            // 235
                                                                                                                      // 236
		if (this.nativeDraggable) {                                                                                         // 237
			_on(el, 'dragover', this);                                                                                         // 238
			_on(el, 'dragenter', this);                                                                                        // 239
		}                                                                                                                   // 240
                                                                                                                      // 241
		touchDragOverListeners.push(this._onDragOver);                                                                      // 242
                                                                                                                      // 243
		// Restore sorting                                                                                                  // 244
		options.store && this.sort(options.store.get(this));                                                                // 245
	}                                                                                                                    // 246
                                                                                                                      // 247
                                                                                                                      // 248
	Sortable.prototype = /** @lends Sortable.prototype */ {                                                              // 249
		constructor: Sortable,                                                                                              // 250
                                                                                                                      // 251
		_onTapStart: function (/** Event|TouchEvent */evt) {                                                                // 252
			var _this = this,                                                                                                  // 253
				el = this.el,                                                                                                     // 254
				options = this.options,                                                                                           // 255
				type = evt.type,                                                                                                  // 256
				touch = evt.touches && evt.touches[0],                                                                            // 257
				target = (touch || evt).target,                                                                                   // 258
				originalTarget = target,                                                                                          // 259
				filter = options.filter;                                                                                          // 260
                                                                                                                      // 261
                                                                                                                      // 262
			if (type === 'mousedown' && evt.button !== 0 || options.disabled) {                                                // 263
				return; // only left button or enabled                                                                            // 264
			}                                                                                                                  // 265
                                                                                                                      // 266
			target = _closest(target, options.draggable, el);                                                                  // 267
                                                                                                                      // 268
			if (!target) {                                                                                                     // 269
				return;                                                                                                           // 270
			}                                                                                                                  // 271
                                                                                                                      // 272
			// get the index of the dragged element within its parent                                                          // 273
			oldIndex = _index(target);                                                                                         // 274
                                                                                                                      // 275
			// Check filter                                                                                                    // 276
			if (typeof filter === 'function') {                                                                                // 277
				if (filter.call(this, evt, target, this)) {                                                                       // 278
					_dispatchEvent(_this, originalTarget, 'filter', target, el, oldIndex);                                           // 279
					evt.preventDefault();                                                                                            // 280
					return; // cancel dnd                                                                                            // 281
				}                                                                                                                 // 282
			}                                                                                                                  // 283
			else if (filter) {                                                                                                 // 284
				filter = filter.split(',').some(function (criteria) {                                                             // 285
					criteria = _closest(originalTarget, criteria.trim(), el);                                                        // 286
                                                                                                                      // 287
					if (criteria) {                                                                                                  // 288
						_dispatchEvent(_this, criteria, 'filter', target, el, oldIndex);                                                // 289
						return true;                                                                                                    // 290
					}                                                                                                                // 291
				});                                                                                                               // 292
                                                                                                                      // 293
				if (filter) {                                                                                                     // 294
					evt.preventDefault();                                                                                            // 295
					return; // cancel dnd                                                                                            // 296
				}                                                                                                                 // 297
			}                                                                                                                  // 298
                                                                                                                      // 299
                                                                                                                      // 300
			if (options.handle && !_closest(originalTarget, options.handle, el)) {                                             // 301
				return;                                                                                                           // 302
			}                                                                                                                  // 303
                                                                                                                      // 304
                                                                                                                      // 305
			// Prepare `dragstart`                                                                                             // 306
			this._prepareDragStart(evt, touch, target);                                                                        // 307
		},                                                                                                                  // 308
                                                                                                                      // 309
		_prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target) {                        // 310
			var _this = this,                                                                                                  // 311
				el = _this.el,                                                                                                    // 312
				options = _this.options,                                                                                          // 313
				ownerDocument = el.ownerDocument,                                                                                 // 314
				dragStartFn;                                                                                                      // 315
                                                                                                                      // 316
			if (target && !dragEl && (target.parentNode === el)) {                                                             // 317
				tapEvt = evt;                                                                                                     // 318
                                                                                                                      // 319
				rootEl = el;                                                                                                      // 320
				dragEl = target;                                                                                                  // 321
				parentEl = dragEl.parentNode;                                                                                     // 322
				nextEl = dragEl.nextSibling;                                                                                      // 323
				activeGroup = options.group;                                                                                      // 324
                                                                                                                      // 325
				dragStartFn = function () {                                                                                       // 326
					// Delayed drag has been triggered                                                                               // 327
					// we can re-enable the events: touchmove/mousemove                                                              // 328
					_this._disableDelayedDrag();                                                                                     // 329
                                                                                                                      // 330
					// Make the element draggable                                                                                    // 331
					dragEl.draggable = true;                                                                                         // 332
                                                                                                                      // 333
					// Chosen item                                                                                                   // 334
					_toggleClass(dragEl, _this.options.chosenClass, true);                                                           // 335
                                                                                                                      // 336
					// Bind the events: dragstart/dragend                                                                            // 337
					_this._triggerDragStart(touch);                                                                                  // 338
				};                                                                                                                // 339
                                                                                                                      // 340
				// Disable "draggable"                                                                                            // 341
				options.ignore.split(',').forEach(function (criteria) {                                                           // 342
					_find(dragEl, criteria.trim(), _disableDraggable);                                                               // 343
				});                                                                                                               // 344
                                                                                                                      // 345
				_on(ownerDocument, 'mouseup', _this._onDrop);                                                                     // 346
				_on(ownerDocument, 'touchend', _this._onDrop);                                                                    // 347
				_on(ownerDocument, 'touchcancel', _this._onDrop);                                                                 // 348
                                                                                                                      // 349
				if (options.delay) {                                                                                              // 350
					// If the user moves the pointer or let go the click or touch                                                    // 351
					// before the delay has been reached:                                                                            // 352
					// disable the delayed drag                                                                                      // 353
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);                                                        // 354
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);                                                       // 355
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);                                                    // 356
					_on(ownerDocument, 'mousemove', _this._disableDelayedDrag);                                                      // 357
					_on(ownerDocument, 'touchmove', _this._disableDelayedDrag);                                                      // 358
                                                                                                                      // 359
					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);                                                  // 360
				} else {                                                                                                          // 361
					dragStartFn();                                                                                                   // 362
				}                                                                                                                 // 363
			}                                                                                                                  // 364
		},                                                                                                                  // 365
                                                                                                                      // 366
		_disableDelayedDrag: function () {                                                                                  // 367
			var ownerDocument = this.el.ownerDocument;                                                                         // 368
                                                                                                                      // 369
			clearTimeout(this._dragStartTimer);                                                                                // 370
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);                                                          // 371
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);                                                         // 372
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);                                                      // 373
			_off(ownerDocument, 'mousemove', this._disableDelayedDrag);                                                        // 374
			_off(ownerDocument, 'touchmove', this._disableDelayedDrag);                                                        // 375
		},                                                                                                                  // 376
                                                                                                                      // 377
		_triggerDragStart: function (/** Touch */touch) {                                                                   // 378
			if (touch) {                                                                                                       // 379
				// Touch device support                                                                                           // 380
				tapEvt = {                                                                                                        // 381
					target: dragEl,                                                                                                  // 382
					clientX: touch.clientX,                                                                                          // 383
					clientY: touch.clientY                                                                                           // 384
				};                                                                                                                // 385
                                                                                                                      // 386
				this._onDragStart(tapEvt, 'touch');                                                                               // 387
			}                                                                                                                  // 388
			else if (!this.nativeDraggable) {                                                                                  // 389
				this._onDragStart(tapEvt, true);                                                                                  // 390
			}                                                                                                                  // 391
			else {                                                                                                             // 392
				_on(dragEl, 'dragend', this);                                                                                     // 393
				_on(rootEl, 'dragstart', this._onDragStart);                                                                      // 394
			}                                                                                                                  // 395
                                                                                                                      // 396
			try {                                                                                                              // 397
				if (document.selection) {                                                                                         // 398
					document.selection.empty();                                                                                      // 399
				} else {                                                                                                          // 400
					window.getSelection().removeAllRanges();                                                                         // 401
				}                                                                                                                 // 402
			} catch (err) {                                                                                                    // 403
			}                                                                                                                  // 404
		},                                                                                                                  // 405
                                                                                                                      // 406
		_dragStarted: function () {                                                                                         // 407
			if (rootEl && dragEl) {                                                                                            // 408
				// Apply effect                                                                                                   // 409
				_toggleClass(dragEl, this.options.ghostClass, true);                                                              // 410
                                                                                                                      // 411
				Sortable.active = this;                                                                                           // 412
                                                                                                                      // 413
				// Drag start event                                                                                               // 414
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, oldIndex);                                                  // 415
			}                                                                                                                  // 416
		},                                                                                                                  // 417
                                                                                                                      // 418
		_emulateDragOver: function () {                                                                                     // 419
			if (touchEvt) {                                                                                                    // 420
				if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {                                       // 421
					return;                                                                                                          // 422
				}                                                                                                                 // 423
                                                                                                                      // 424
				this._lastX = touchEvt.clientX;                                                                                   // 425
				this._lastY = touchEvt.clientY;                                                                                   // 426
                                                                                                                      // 427
				if (!supportCssPointerEvents) {                                                                                   // 428
					_css(ghostEl, 'display', 'none');                                                                                // 429
				}                                                                                                                 // 430
                                                                                                                      // 431
				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),                                       // 432
					parent = target,                                                                                                 // 433
					groupName = ' ' + this.options.group.name + '',                                                                  // 434
					i = touchDragOverListeners.length;                                                                               // 435
                                                                                                                      // 436
				if (parent) {                                                                                                     // 437
					do {                                                                                                             // 438
						if (parent[expando] && parent[expando].options.groups.indexOf(groupName) > -1) {                                // 439
							while (i--) {                                                                                                  // 440
								touchDragOverListeners[i]({                                                                                   // 441
									clientX: touchEvt.clientX,                                                                                   // 442
									clientY: touchEvt.clientY,                                                                                   // 443
									target: target,                                                                                              // 444
									rootEl: parent                                                                                               // 445
								});                                                                                                           // 446
							}                                                                                                              // 447
                                                                                                                      // 448
							break;                                                                                                         // 449
						}                                                                                                               // 450
                                                                                                                      // 451
						target = parent; // store last element                                                                          // 452
					}                                                                                                                // 453
					/* jshint boss:true */                                                                                           // 454
					while (parent = parent.parentNode);                                                                              // 455
				}                                                                                                                 // 456
                                                                                                                      // 457
				if (!supportCssPointerEvents) {                                                                                   // 458
					_css(ghostEl, 'display', '');                                                                                    // 459
				}                                                                                                                 // 460
			}                                                                                                                  // 461
		},                                                                                                                  // 462
                                                                                                                      // 463
                                                                                                                      // 464
		_onTouchMove: function (/**TouchEvent*/evt) {                                                                       // 465
			if (tapEvt) {                                                                                                      // 466
				// only set the status to dragging, when we are actually dragging                                                 // 467
				if (!Sortable.active) {                                                                                           // 468
					this._dragStarted();                                                                                             // 469
				}                                                                                                                 // 470
                                                                                                                      // 471
				// as well as creating the ghost element on the document body                                                     // 472
				this._appendGhost();                                                                                              // 473
                                                                                                                      // 474
				var touch = evt.touches ? evt.touches[0] : evt,                                                                   // 475
					dx = touch.clientX - tapEvt.clientX,                                                                             // 476
					dy = touch.clientY - tapEvt.clientY,                                                                             // 477
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)'; // 478
                                                                                                                      // 479
				moved = true;                                                                                                     // 480
				touchEvt = touch;                                                                                                 // 481
                                                                                                                      // 482
				_css(ghostEl, 'webkitTransform', translate3d);                                                                    // 483
				_css(ghostEl, 'mozTransform', translate3d);                                                                       // 484
				_css(ghostEl, 'msTransform', translate3d);                                                                        // 485
				_css(ghostEl, 'transform', translate3d);                                                                          // 486
                                                                                                                      // 487
				evt.preventDefault();                                                                                             // 488
			}                                                                                                                  // 489
		},                                                                                                                  // 490
                                                                                                                      // 491
		_appendGhost: function () {                                                                                         // 492
			if (!ghostEl) {                                                                                                    // 493
				var rect = dragEl.getBoundingClientRect(),                                                                        // 494
					css = _css(dragEl),                                                                                              // 495
					ghostRect;                                                                                                       // 496
                                                                                                                      // 497
				ghostEl = dragEl.cloneNode(true);                                                                                 // 498
                                                                                                                      // 499
				_toggleClass(ghostEl, this.options.ghostClass, false);                                                            // 500
				_toggleClass(ghostEl, this.options.fallbackClass, true);                                                          // 501
                                                                                                                      // 502
				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));                                                     // 503
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));                                                  // 504
				_css(ghostEl, 'width', rect.width);                                                                               // 505
				_css(ghostEl, 'height', rect.height);                                                                             // 506
				_css(ghostEl, 'opacity', '0.8');                                                                                  // 507
				_css(ghostEl, 'position', 'fixed');                                                                               // 508
				_css(ghostEl, 'zIndex', '100000');                                                                                // 509
				_css(ghostEl, 'pointerEvents', 'none');                                                                           // 510
                                                                                                                      // 511
				this.options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);                 // 512
                                                                                                                      // 513
				// Fixing dimensions.                                                                                             // 514
				ghostRect = ghostEl.getBoundingClientRect();                                                                      // 515
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);                                                         // 516
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);                                                      // 517
			}                                                                                                                  // 518
		},                                                                                                                  // 519
                                                                                                                      // 520
		_onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {                                                   // 521
			var dataTransfer = evt.dataTransfer,                                                                               // 522
				options = this.options;                                                                                           // 523
                                                                                                                      // 524
			this._offUpEvents();                                                                                               // 525
                                                                                                                      // 526
			if (activeGroup.pull == 'clone') {                                                                                 // 527
				cloneEl = dragEl.cloneNode(true);                                                                                 // 528
				_css(cloneEl, 'display', 'none');                                                                                 // 529
				rootEl.insertBefore(cloneEl, dragEl);                                                                             // 530
			}                                                                                                                  // 531
                                                                                                                      // 532
			if (useFallback) {                                                                                                 // 533
                                                                                                                      // 534
				if (useFallback === 'touch') {                                                                                    // 535
					// Bind touch events                                                                                             // 536
					_on(document, 'touchmove', this._onTouchMove);                                                                   // 537
					_on(document, 'touchend', this._onDrop);                                                                         // 538
					_on(document, 'touchcancel', this._onDrop);                                                                      // 539
				} else {                                                                                                          // 540
					// Old brwoser                                                                                                   // 541
					_on(document, 'mousemove', this._onTouchMove);                                                                   // 542
					_on(document, 'mouseup', this._onDrop);                                                                          // 543
				}                                                                                                                 // 544
                                                                                                                      // 545
				this._loopId = setInterval(this._emulateDragOver, 50);                                                            // 546
			}                                                                                                                  // 547
			else {                                                                                                             // 548
				if (dataTransfer) {                                                                                               // 549
					dataTransfer.effectAllowed = 'move';                                                                             // 550
					options.setData && options.setData.call(this, dataTransfer, dragEl);                                             // 551
				}                                                                                                                 // 552
                                                                                                                      // 553
				_on(document, 'drop', this);                                                                                      // 554
				setTimeout(this._dragStarted, 0);                                                                                 // 555
			}                                                                                                                  // 556
		},                                                                                                                  // 557
                                                                                                                      // 558
		_onDragOver: function (/**Event*/evt) {                                                                             // 559
			var el = this.el,                                                                                                  // 560
				target,                                                                                                           // 561
				dragRect,                                                                                                         // 562
				revert,                                                                                                           // 563
				options = this.options,                                                                                           // 564
				group = options.group,                                                                                            // 565
				groupPut = group.put,                                                                                             // 566
				isOwner = (activeGroup === group),                                                                                // 567
				canSort = options.sort;                                                                                           // 568
                                                                                                                      // 569
			if (evt.preventDefault !== void 0) {                                                                               // 570
				evt.preventDefault();                                                                                             // 571
				!options.dragoverBubble && evt.stopPropagation();                                                                 // 572
			}                                                                                                                  // 573
                                                                                                                      // 574
			moved = true;                                                                                                      // 575
                                                                                                                      // 576
			if (activeGroup && !options.disabled &&                                                                            // 577
				(isOwner                                                                                                          // 578
					? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list                        // 579
					: activeGroup.pull && groupPut && (                                                                              // 580
						(activeGroup.name === group.name) || // by Name                                                                 // 581
						(groupPut.indexOf && ~groupPut.indexOf(activeGroup.name)) // by Array                                           // 582
					)                                                                                                                // 583
				) &&                                                                                                              // 584
				(evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback                                               // 585
			) {                                                                                                                // 586
				// Smart auto-scrolling                                                                                           // 587
				_autoScroll(evt, options, this.el);                                                                               // 588
                                                                                                                      // 589
				if (_silent) {                                                                                                    // 590
					return;                                                                                                          // 591
				}                                                                                                                 // 592
                                                                                                                      // 593
				target = _closest(evt.target, options.draggable, el);                                                             // 594
				dragRect = dragEl.getBoundingClientRect();                                                                        // 595
                                                                                                                      // 596
				if (revert) {                                                                                                     // 597
					_cloneHide(true);                                                                                                // 598
                                                                                                                      // 599
					if (cloneEl || nextEl) {                                                                                         // 600
						rootEl.insertBefore(dragEl, cloneEl || nextEl);                                                                 // 601
					}                                                                                                                // 602
					else if (!canSort) {                                                                                             // 603
						rootEl.appendChild(dragEl);                                                                                     // 604
					}                                                                                                                // 605
                                                                                                                      // 606
					return;                                                                                                          // 607
				}                                                                                                                 // 608
                                                                                                                      // 609
                                                                                                                      // 610
				if ((el.children.length === 0) || (el.children[0] === ghostEl) ||                                                 // 611
					(el === evt.target) && (target = _ghostIsLast(el, evt))                                                          // 612
				) {                                                                                                               // 613
                                                                                                                      // 614
					if (target) {                                                                                                    // 615
						if (target.animated) {                                                                                          // 616
							return;                                                                                                        // 617
						}                                                                                                               // 618
                                                                                                                      // 619
						targetRect = target.getBoundingClientRect();                                                                    // 620
					}                                                                                                                // 621
                                                                                                                      // 622
					_cloneHide(isOwner);                                                                                             // 623
                                                                                                                      // 624
					if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect) !== false) {                                       // 625
						if (!dragEl.contains(el)) {                                                                                     // 626
							el.appendChild(dragEl);                                                                                        // 627
							parentEl = el; // actualization                                                                                // 628
						}                                                                                                               // 629
                                                                                                                      // 630
						this._animate(dragRect, dragEl);                                                                                // 631
						target && this._animate(targetRect, target);                                                                    // 632
					}                                                                                                                // 633
				}                                                                                                                 // 634
				else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {            // 635
					if (lastEl !== target) {                                                                                         // 636
						lastEl = target;                                                                                                // 637
						lastCSS = _css(target);                                                                                         // 638
						lastParentCSS = _css(target.parentNode);                                                                        // 639
					}                                                                                                                // 640
                                                                                                                      // 641
                                                                                                                      // 642
					var targetRect = target.getBoundingClientRect(),                                                                 // 643
						width = targetRect.right - targetRect.left,                                                                     // 644
						height = targetRect.bottom - targetRect.top,                                                                    // 645
						floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display)                                         // 646
							|| (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),                  // 647
						isWide = (target.offsetWidth > dragEl.offsetWidth),                                                             // 648
						isLong = (target.offsetHeight > dragEl.offsetHeight),                                                           // 649
						halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5, // 650
						nextSibling = target.nextElementSibling,                                                                        // 651
						moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect),                                         // 652
						after                                                                                                           // 653
					;                                                                                                                // 654
                                                                                                                      // 655
					if (moveVector !== false) {                                                                                      // 656
						_silent = true;                                                                                                 // 657
						setTimeout(_unsilent, 30);                                                                                      // 658
                                                                                                                      // 659
						_cloneHide(isOwner);                                                                                            // 660
                                                                                                                      // 661
						if (moveVector === 1 || moveVector === -1) {                                                                    // 662
							after = (moveVector === 1);                                                                                    // 663
						}                                                                                                               // 664
						else if (floating) {                                                                                            // 665
							var elTop = dragEl.offsetTop,                                                                                  // 666
								tgTop = target.offsetTop;                                                                                     // 667
                                                                                                                      // 668
							if (elTop === tgTop) {                                                                                         // 669
								after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;                           // 670
							} else {                                                                                                       // 671
								after = tgTop > elTop;                                                                                        // 672
							}                                                                                                              // 673
						} else {                                                                                                        // 674
							after = (nextSibling !== dragEl) && !isLong || halfway && isLong;                                              // 675
						}                                                                                                               // 676
                                                                                                                      // 677
						if (!dragEl.contains(el)) {                                                                                     // 678
							if (after && !nextSibling) {                                                                                   // 679
								el.appendChild(dragEl);                                                                                       // 680
							} else {                                                                                                       // 681
								target.parentNode.insertBefore(dragEl, after ? nextSibling : target);                                         // 682
							}                                                                                                              // 683
						}                                                                                                               // 684
                                                                                                                      // 685
						parentEl = dragEl.parentNode; // actualization                                                                  // 686
                                                                                                                      // 687
						this._animate(dragRect, dragEl);                                                                                // 688
						this._animate(targetRect, target);                                                                              // 689
					}                                                                                                                // 690
				}                                                                                                                 // 691
			}                                                                                                                  // 692
		},                                                                                                                  // 693
                                                                                                                      // 694
		_animate: function (prevRect, target) {                                                                             // 695
			var ms = this.options.animation;                                                                                   // 696
                                                                                                                      // 697
			if (ms) {                                                                                                          // 698
				var currentRect = target.getBoundingClientRect();                                                                 // 699
                                                                                                                      // 700
				_css(target, 'transition', 'none');                                                                               // 701
				_css(target, 'transform', 'translate3d('                                                                          // 702
					+ (prevRect.left - currentRect.left) + 'px,'                                                                     // 703
					+ (prevRect.top - currentRect.top) + 'px,0)'                                                                     // 704
				);                                                                                                                // 705
                                                                                                                      // 706
				target.offsetWidth; // repaint                                                                                    // 707
                                                                                                                      // 708
				_css(target, 'transition', 'all ' + ms + 'ms');                                                                   // 709
				_css(target, 'transform', 'translate3d(0,0,0)');                                                                  // 710
                                                                                                                      // 711
				clearTimeout(target.animated);                                                                                    // 712
				target.animated = setTimeout(function () {                                                                        // 713
					_css(target, 'transition', '');                                                                                  // 714
					_css(target, 'transform', '');                                                                                   // 715
					target.animated = false;                                                                                         // 716
				}, ms);                                                                                                           // 717
			}                                                                                                                  // 718
		},                                                                                                                  // 719
                                                                                                                      // 720
		_offUpEvents: function () {                                                                                         // 721
			var ownerDocument = this.el.ownerDocument;                                                                         // 722
                                                                                                                      // 723
			_off(document, 'touchmove', this._onTouchMove);                                                                    // 724
			_off(ownerDocument, 'mouseup', this._onDrop);                                                                      // 725
			_off(ownerDocument, 'touchend', this._onDrop);                                                                     // 726
			_off(ownerDocument, 'touchcancel', this._onDrop);                                                                  // 727
		},                                                                                                                  // 728
                                                                                                                      // 729
		_onDrop: function (/**Event*/evt) {                                                                                 // 730
			var el = this.el,                                                                                                  // 731
				options = this.options;                                                                                           // 732
                                                                                                                      // 733
			clearInterval(this._loopId);                                                                                       // 734
			clearInterval(autoScroll.pid);                                                                                     // 735
			clearTimeout(this._dragStartTimer);                                                                                // 736
                                                                                                                      // 737
			// Unbind events                                                                                                   // 738
			_off(document, 'mousemove', this._onTouchMove);                                                                    // 739
                                                                                                                      // 740
			if (this.nativeDraggable) {                                                                                        // 741
				_off(document, 'drop', this);                                                                                     // 742
				_off(el, 'dragstart', this._onDragStart);                                                                         // 743
			}                                                                                                                  // 744
                                                                                                                      // 745
			this._offUpEvents();                                                                                               // 746
                                                                                                                      // 747
			if (evt) {                                                                                                         // 748
				if (moved) {                                                                                                      // 749
					evt.preventDefault();                                                                                            // 750
					!options.dropBubble && evt.stopPropagation();                                                                    // 751
				}                                                                                                                 // 752
                                                                                                                      // 753
				ghostEl && ghostEl.parentNode.removeChild(ghostEl);                                                               // 754
                                                                                                                      // 755
				if (dragEl) {                                                                                                     // 756
					if (this.nativeDraggable) {                                                                                      // 757
						_off(dragEl, 'dragend', this);                                                                                  // 758
					}                                                                                                                // 759
                                                                                                                      // 760
					_disableDraggable(dragEl);                                                                                       // 761
                                                                                                                      // 762
					// Remove class's                                                                                                // 763
					_toggleClass(dragEl, this.options.ghostClass, false);                                                            // 764
					_toggleClass(dragEl, this.options.chosenClass, false);                                                           // 765
                                                                                                                      // 766
					if (rootEl !== parentEl) {                                                                                       // 767
						newIndex = _index(dragEl);                                                                                      // 768
                                                                                                                      // 769
						if (newIndex >= 0) {                                                                                            // 770
							// drag from one list and drop into another                                                                    // 771
							_dispatchEvent(null, parentEl, 'sort', dragEl, rootEl, oldIndex, newIndex);                                    // 772
							_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);                                      // 773
                                                                                                                      // 774
							// Add event                                                                                                   // 775
							_dispatchEvent(null, parentEl, 'add', dragEl, rootEl, oldIndex, newIndex);                                     // 776
                                                                                                                      // 777
							// Remove event                                                                                                // 778
							_dispatchEvent(this, rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);                                    // 779
						}                                                                                                               // 780
					}                                                                                                                // 781
					else {                                                                                                           // 782
						// Remove clone                                                                                                 // 783
						cloneEl && cloneEl.parentNode.removeChild(cloneEl);                                                             // 784
                                                                                                                      // 785
						if (dragEl.nextSibling !== nextEl) {                                                                            // 786
							// Get the index of the dragged element within its parent                                                      // 787
							newIndex = _index(dragEl);                                                                                     // 788
                                                                                                                      // 789
							if (newIndex >= 0) {                                                                                           // 790
								// drag & drop within the same list                                                                           // 791
								_dispatchEvent(this, rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);                                   // 792
								_dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);                                     // 793
							}                                                                                                              // 794
						}                                                                                                               // 795
					}                                                                                                                // 796
                                                                                                                      // 797
					if (Sortable.active) {                                                                                           // 798
						if (newIndex === null || newIndex === -1) {                                                                     // 799
							newIndex = oldIndex;                                                                                           // 800
						}                                                                                                               // 801
                                                                                                                      // 802
						_dispatchEvent(this, rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);                                        // 803
                                                                                                                      // 804
						// Save sorting                                                                                                 // 805
						this.save();                                                                                                    // 806
					}                                                                                                                // 807
				}                                                                                                                 // 808
                                                                                                                      // 809
				// Nulling                                                                                                        // 810
				rootEl =                                                                                                          // 811
				dragEl =                                                                                                          // 812
				parentEl =                                                                                                        // 813
				ghostEl =                                                                                                         // 814
				nextEl =                                                                                                          // 815
				cloneEl =                                                                                                         // 816
                                                                                                                      // 817
				scrollEl =                                                                                                        // 818
				scrollParentEl =                                                                                                  // 819
                                                                                                                      // 820
				tapEvt =                                                                                                          // 821
				touchEvt =                                                                                                        // 822
                                                                                                                      // 823
				moved =                                                                                                           // 824
				newIndex =                                                                                                        // 825
                                                                                                                      // 826
				lastEl =                                                                                                          // 827
				lastCSS =                                                                                                         // 828
                                                                                                                      // 829
				activeGroup =                                                                                                     // 830
				Sortable.active = null;                                                                                           // 831
			}                                                                                                                  // 832
		},                                                                                                                  // 833
                                                                                                                      // 834
                                                                                                                      // 835
		handleEvent: function (/**Event*/evt) {                                                                             // 836
			var type = evt.type;                                                                                               // 837
                                                                                                                      // 838
			if (type === 'dragover' || type === 'dragenter') {                                                                 // 839
				if (dragEl) {                                                                                                     // 840
					this._onDragOver(evt);                                                                                           // 841
					_globalDragOver(evt);                                                                                            // 842
				}                                                                                                                 // 843
			}                                                                                                                  // 844
			else if (type === 'drop' || type === 'dragend') {                                                                  // 845
				this._onDrop(evt);                                                                                                // 846
			}                                                                                                                  // 847
		},                                                                                                                  // 848
                                                                                                                      // 849
                                                                                                                      // 850
		/**                                                                                                                 // 851
		 * Serializes the item into an array of string.                                                                     // 852
		 * @returns {String[]}                                                                                              // 853
		 */                                                                                                                 // 854
		toArray: function () {                                                                                              // 855
			var order = [],                                                                                                    // 856
				el,                                                                                                               // 857
				children = this.el.children,                                                                                      // 858
				i = 0,                                                                                                            // 859
				n = children.length,                                                                                              // 860
				options = this.options;                                                                                           // 861
                                                                                                                      // 862
			for (; i < n; i++) {                                                                                               // 863
				el = children[i];                                                                                                 // 864
				if (_closest(el, options.draggable, this.el)) {                                                                   // 865
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));                                              // 866
				}                                                                                                                 // 867
			}                                                                                                                  // 868
                                                                                                                      // 869
			return order;                                                                                                      // 870
		},                                                                                                                  // 871
                                                                                                                      // 872
                                                                                                                      // 873
		/**                                                                                                                 // 874
		 * Sorts the elements according to the array.                                                                       // 875
		 * @param  {String[]}  order  order of the items                                                                    // 876
		 */                                                                                                                 // 877
		sort: function (order) {                                                                                            // 878
			var items = {}, rootEl = this.el;                                                                                  // 879
                                                                                                                      // 880
			this.toArray().forEach(function (id, i) {                                                                          // 881
				var el = rootEl.children[i];                                                                                      // 882
                                                                                                                      // 883
				if (_closest(el, this.options.draggable, rootEl)) {                                                               // 884
					items[id] = el;                                                                                                  // 885
				}                                                                                                                 // 886
			}, this);                                                                                                          // 887
                                                                                                                      // 888
			order.forEach(function (id) {                                                                                      // 889
				if (items[id]) {                                                                                                  // 890
					rootEl.removeChild(items[id]);                                                                                   // 891
					rootEl.appendChild(items[id]);                                                                                   // 892
				}                                                                                                                 // 893
			});                                                                                                                // 894
		},                                                                                                                  // 895
                                                                                                                      // 896
                                                                                                                      // 897
		/**                                                                                                                 // 898
		 * Save the current sorting                                                                                         // 899
		 */                                                                                                                 // 900
		save: function () {                                                                                                 // 901
			var store = this.options.store;                                                                                    // 902
			store && store.set(this);                                                                                          // 903
		},                                                                                                                  // 904
                                                                                                                      // 905
                                                                                                                      // 906
		/**                                                                                                                 // 907
		 * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
		 * @param   {HTMLElement}  el                                                                                       // 909
		 * @param   {String}       [selector]  default: `options.draggable`                                                 // 910
		 * @returns {HTMLElement|null}                                                                                      // 911
		 */                                                                                                                 // 912
		closest: function (el, selector) {                                                                                  // 913
			return _closest(el, selector || this.options.draggable, this.el);                                                  // 914
		},                                                                                                                  // 915
                                                                                                                      // 916
                                                                                                                      // 917
		/**                                                                                                                 // 918
		 * Set/get option                                                                                                   // 919
		 * @param   {string} name                                                                                           // 920
		 * @param   {*}      [value]                                                                                        // 921
		 * @returns {*}                                                                                                     // 922
		 */                                                                                                                 // 923
		option: function (name, value) {                                                                                    // 924
			var options = this.options;                                                                                        // 925
                                                                                                                      // 926
			if (value === void 0) {                                                                                            // 927
				return options[name];                                                                                             // 928
			} else {                                                                                                           // 929
				options[name] = value;                                                                                            // 930
                                                                                                                      // 931
				if (name === 'group') {                                                                                           // 932
					_prepareGroup(options);                                                                                          // 933
				}                                                                                                                 // 934
			}                                                                                                                  // 935
		},                                                                                                                  // 936
                                                                                                                      // 937
                                                                                                                      // 938
		/**                                                                                                                 // 939
		 * Destroy                                                                                                          // 940
		 */                                                                                                                 // 941
		destroy: function () {                                                                                              // 942
			var el = this.el;                                                                                                  // 943
                                                                                                                      // 944
			el[expando] = null;                                                                                                // 945
                                                                                                                      // 946
			_off(el, 'mousedown', this._onTapStart);                                                                           // 947
			_off(el, 'touchstart', this._onTapStart);                                                                          // 948
                                                                                                                      // 949
			if (this.nativeDraggable) {                                                                                        // 950
				_off(el, 'dragover', this);                                                                                       // 951
				_off(el, 'dragenter', this);                                                                                      // 952
			}                                                                                                                  // 953
                                                                                                                      // 954
			// Remove draggable attributes                                                                                     // 955
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {                                   // 956
				el.removeAttribute('draggable');                                                                                  // 957
			});                                                                                                                // 958
                                                                                                                      // 959
			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);                                // 960
                                                                                                                      // 961
			this._onDrop();                                                                                                    // 962
                                                                                                                      // 963
			this.el = el = null;                                                                                               // 964
		}                                                                                                                   // 965
	};                                                                                                                   // 966
                                                                                                                      // 967
                                                                                                                      // 968
	function _cloneHide(state) {                                                                                         // 969
		if (cloneEl && (cloneEl.state !== state)) {                                                                         // 970
			_css(cloneEl, 'display', state ? 'none' : '');                                                                     // 971
			!state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);                                                   // 972
			cloneEl.state = state;                                                                                             // 973
		}                                                                                                                   // 974
	}                                                                                                                    // 975
                                                                                                                      // 976
                                                                                                                      // 977
	function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {                                    // 978
		if (el) {                                                                                                           // 979
			ctx = ctx || document;                                                                                             // 980
			selector = selector.split('.');                                                                                    // 981
                                                                                                                      // 982
			var tag = selector.shift().toUpperCase(),                                                                          // 983
				re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');                                                   // 984
                                                                                                                      // 985
			do {                                                                                                               // 986
				if (                                                                                                              // 987
					(tag === '>*' && el.parentNode === ctx) || (                                                                     // 988
						(tag === '' || el.nodeName.toUpperCase() == tag) &&                                                             // 989
						(!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)                    // 990
					)                                                                                                                // 991
				) {                                                                                                               // 992
					return el;                                                                                                       // 993
				}                                                                                                                 // 994
			}                                                                                                                  // 995
			while (el !== ctx && (el = el.parentNode));                                                                        // 996
		}                                                                                                                   // 997
                                                                                                                      // 998
		return null;                                                                                                        // 999
	}                                                                                                                    // 1000
                                                                                                                      // 1001
                                                                                                                      // 1002
	function _globalDragOver(/**Event*/evt) {                                                                            // 1003
		if (evt.dataTransfer) {                                                                                             // 1004
			evt.dataTransfer.dropEffect = 'move';                                                                              // 1005
		}                                                                                                                   // 1006
		evt.preventDefault();                                                                                               // 1007
	}                                                                                                                    // 1008
                                                                                                                      // 1009
                                                                                                                      // 1010
	function _on(el, event, fn) {                                                                                        // 1011
		el.addEventListener(event, fn, false);                                                                              // 1012
	}                                                                                                                    // 1013
                                                                                                                      // 1014
                                                                                                                      // 1015
	function _off(el, event, fn) {                                                                                       // 1016
		el.removeEventListener(event, fn, false);                                                                           // 1017
	}                                                                                                                    // 1018
                                                                                                                      // 1019
                                                                                                                      // 1020
	function _toggleClass(el, name, state) {                                                                             // 1021
		if (el) {                                                                                                           // 1022
			if (el.classList) {                                                                                                // 1023
				el.classList[state ? 'add' : 'remove'](name);                                                                     // 1024
			}                                                                                                                  // 1025
			else {                                                                                                             // 1026
				var className = (' ' + el.className + ' ').replace(RSPACE, ' ').replace(' ' + name + ' ', ' ');                   // 1027
				el.className = (className + (state ? ' ' + name : '')).replace(RSPACE, ' ');                                      // 1028
			}                                                                                                                  // 1029
		}                                                                                                                   // 1030
	}                                                                                                                    // 1031
                                                                                                                      // 1032
                                                                                                                      // 1033
	function _css(el, prop, val) {                                                                                       // 1034
		var style = el && el.style;                                                                                         // 1035
                                                                                                                      // 1036
		if (style) {                                                                                                        // 1037
			if (val === void 0) {                                                                                              // 1038
				if (document.defaultView && document.defaultView.getComputedStyle) {                                              // 1039
					val = document.defaultView.getComputedStyle(el, '');                                                             // 1040
				}                                                                                                                 // 1041
				else if (el.currentStyle) {                                                                                       // 1042
					val = el.currentStyle;                                                                                           // 1043
				}                                                                                                                 // 1044
                                                                                                                      // 1045
				return prop === void 0 ? val : val[prop];                                                                         // 1046
			}                                                                                                                  // 1047
			else {                                                                                                             // 1048
				if (!(prop in style)) {                                                                                           // 1049
					prop = '-webkit-' + prop;                                                                                        // 1050
				}                                                                                                                 // 1051
                                                                                                                      // 1052
				style[prop] = val + (typeof val === 'string' ? '' : 'px');                                                        // 1053
			}                                                                                                                  // 1054
		}                                                                                                                   // 1055
	}                                                                                                                    // 1056
                                                                                                                      // 1057
                                                                                                                      // 1058
	function _find(ctx, tagName, iterator) {                                                                             // 1059
		if (ctx) {                                                                                                          // 1060
			var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;                                              // 1061
                                                                                                                      // 1062
			if (iterator) {                                                                                                    // 1063
				for (; i < n; i++) {                                                                                              // 1064
					iterator(list[i], i);                                                                                            // 1065
				}                                                                                                                 // 1066
			}                                                                                                                  // 1067
                                                                                                                      // 1068
			return list;                                                                                                       // 1069
		}                                                                                                                   // 1070
                                                                                                                      // 1071
		return [];                                                                                                          // 1072
	}                                                                                                                    // 1073
                                                                                                                      // 1074
                                                                                                                      // 1075
                                                                                                                      // 1076
	function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {                            // 1077
		var evt = document.createEvent('Event'),                                                                            // 1078
			options = (sortable || rootEl[expando]).options,                                                                   // 1079
			onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);                                                     // 1080
                                                                                                                      // 1081
		evt.initEvent(name, true, true);                                                                                    // 1082
                                                                                                                      // 1083
		evt.to = rootEl;                                                                                                    // 1084
		evt.from = fromEl || rootEl;                                                                                        // 1085
		evt.item = targetEl || rootEl;                                                                                      // 1086
		evt.clone = cloneEl;                                                                                                // 1087
                                                                                                                      // 1088
		evt.oldIndex = startIndex;                                                                                          // 1089
		evt.newIndex = newIndex;                                                                                            // 1090
                                                                                                                      // 1091
		rootEl.dispatchEvent(evt);                                                                                          // 1092
                                                                                                                      // 1093
		if (options[onName]) {                                                                                              // 1094
			options[onName].call(sortable, evt);                                                                               // 1095
		}                                                                                                                   // 1096
	}                                                                                                                    // 1097
                                                                                                                      // 1098
                                                                                                                      // 1099
	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect) {                                             // 1100
		var evt,                                                                                                            // 1101
			sortable = fromEl[expando],                                                                                        // 1102
			onMoveFn = sortable.options.onMove,                                                                                // 1103
			retVal;                                                                                                            // 1104
                                                                                                                      // 1105
		evt = document.createEvent('Event');                                                                                // 1106
		evt.initEvent('move', true, true);                                                                                  // 1107
                                                                                                                      // 1108
		evt.to = toEl;                                                                                                      // 1109
		evt.from = fromEl;                                                                                                  // 1110
		evt.dragged = dragEl;                                                                                               // 1111
		evt.draggedRect = dragRect;                                                                                         // 1112
		evt.related = targetEl || toEl;                                                                                     // 1113
		evt.relatedRect = targetRect || toEl.getBoundingClientRect();                                                       // 1114
                                                                                                                      // 1115
		fromEl.dispatchEvent(evt);                                                                                          // 1116
                                                                                                                      // 1117
		if (onMoveFn) {                                                                                                     // 1118
			retVal = onMoveFn.call(sortable, evt);                                                                             // 1119
		}                                                                                                                   // 1120
                                                                                                                      // 1121
		return retVal;                                                                                                      // 1122
	}                                                                                                                    // 1123
                                                                                                                      // 1124
                                                                                                                      // 1125
	function _disableDraggable(el) {                                                                                     // 1126
		el.draggable = false;                                                                                               // 1127
	}                                                                                                                    // 1128
                                                                                                                      // 1129
                                                                                                                      // 1130
	function _unsilent() {                                                                                               // 1131
		_silent = false;                                                                                                    // 1132
	}                                                                                                                    // 1133
                                                                                                                      // 1134
                                                                                                                      // 1135
	/** @returns {HTMLElement|false} */                                                                                  // 1136
	function _ghostIsLast(el, evt) {                                                                                     // 1137
		var lastEl = el.lastElementChild,                                                                                   // 1138
				rect = lastEl.getBoundingClientRect();                                                                            // 1139
                                                                                                                      // 1140
		return ((evt.clientY - (rect.top + rect.height) > 5) || (evt.clientX - (rect.right + rect.width) > 5)) && lastEl; // min delta
	}                                                                                                                    // 1142
                                                                                                                      // 1143
                                                                                                                      // 1144
	/**                                                                                                                  // 1145
	 * Generate id                                                                                                       // 1146
	 * @param   {HTMLElement} el                                                                                         // 1147
	 * @returns {String}                                                                                                 // 1148
	 * @private                                                                                                          // 1149
	 */                                                                                                                  // 1150
	function _generateId(el) {                                                                                           // 1151
		var str = el.tagName + el.className + el.src + el.href + el.textContent,                                            // 1152
			i = str.length,                                                                                                    // 1153
			sum = 0;                                                                                                           // 1154
                                                                                                                      // 1155
		while (i--) {                                                                                                       // 1156
			sum += str.charCodeAt(i);                                                                                          // 1157
		}                                                                                                                   // 1158
                                                                                                                      // 1159
		return sum.toString(36);                                                                                            // 1160
	}                                                                                                                    // 1161
                                                                                                                      // 1162
	/**                                                                                                                  // 1163
	 * Returns the index of an element within its parent                                                                 // 1164
	 * @param  {HTMLElement} el                                                                                          // 1165
	 * @return {number}                                                                                                  // 1166
	 */                                                                                                                  // 1167
	function _index(el) {                                                                                                // 1168
		var index = 0;                                                                                                      // 1169
                                                                                                                      // 1170
		if (!el || !el.parentNode) {                                                                                        // 1171
			return -1;                                                                                                         // 1172
		}                                                                                                                   // 1173
                                                                                                                      // 1174
		while (el && (el = el.previousElementSibling)) {                                                                    // 1175
			if (el.nodeName.toUpperCase() !== 'TEMPLATE') {                                                                    // 1176
				index++;                                                                                                          // 1177
			}                                                                                                                  // 1178
		}                                                                                                                   // 1179
                                                                                                                      // 1180
		return index;                                                                                                       // 1181
	}                                                                                                                    // 1182
                                                                                                                      // 1183
	function _throttle(callback, ms) {                                                                                   // 1184
		var args, _this;                                                                                                    // 1185
                                                                                                                      // 1186
		return function () {                                                                                                // 1187
			if (args === void 0) {                                                                                             // 1188
				args = arguments;                                                                                                 // 1189
				_this = this;                                                                                                     // 1190
                                                                                                                      // 1191
				setTimeout(function () {                                                                                          // 1192
					if (args.length === 1) {                                                                                         // 1193
						callback.call(_this, args[0]);                                                                                  // 1194
					} else {                                                                                                         // 1195
						callback.apply(_this, args);                                                                                    // 1196
					}                                                                                                                // 1197
                                                                                                                      // 1198
					args = void 0;                                                                                                   // 1199
				}, ms);                                                                                                           // 1200
			}                                                                                                                  // 1201
		};                                                                                                                  // 1202
	}                                                                                                                    // 1203
                                                                                                                      // 1204
	function _extend(dst, src) {                                                                                         // 1205
		if (dst && src) {                                                                                                   // 1206
			for (var key in src) {                                                                                             // 1207
				if (src.hasOwnProperty(key)) {                                                                                    // 1208
					dst[key] = src[key];                                                                                             // 1209
				}                                                                                                                 // 1210
			}                                                                                                                  // 1211
		}                                                                                                                   // 1212
                                                                                                                      // 1213
		return dst;                                                                                                         // 1214
	}                                                                                                                    // 1215
                                                                                                                      // 1216
                                                                                                                      // 1217
	// Export utils                                                                                                      // 1218
	Sortable.utils = {                                                                                                   // 1219
		on: _on,                                                                                                            // 1220
		off: _off,                                                                                                          // 1221
		css: _css,                                                                                                          // 1222
		find: _find,                                                                                                        // 1223
		is: function (el, selector) {                                                                                       // 1224
			return !!_closest(el, selector, el);                                                                               // 1225
		},                                                                                                                  // 1226
		extend: _extend,                                                                                                    // 1227
		throttle: _throttle,                                                                                                // 1228
		closest: _closest,                                                                                                  // 1229
		toggleClass: _toggleClass,                                                                                          // 1230
		index: _index                                                                                                       // 1231
	};                                                                                                                   // 1232
                                                                                                                      // 1233
                                                                                                                      // 1234
	/**                                                                                                                  // 1235
	 * Create sortable instance                                                                                          // 1236
	 * @param {HTMLElement}  el                                                                                          // 1237
	 * @param {Object}      [options]                                                                                    // 1238
	 */                                                                                                                  // 1239
	Sortable.create = function (el, options) {                                                                           // 1240
		return new Sortable(el, options);                                                                                   // 1241
	};                                                                                                                   // 1242
                                                                                                                      // 1243
                                                                                                                      // 1244
	// Export                                                                                                            // 1245
	Sortable.version = '1.3.0';                                                                                          // 1246
	return Sortable;                                                                                                     // 1247
});                                                                                                                   // 1248
                                                                                                                      // 1249
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rubaxa:sortable/template.template.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
                                                                                                                      // 1
Template.__checkName("sortable");                                                                                     // 2
Template["sortable"] = new Template("Template.sortable", (function() {                                                // 3
  var view = this;                                                                                                    // 4
  return Blaze.Each(function() {                                                                                      // 5
    return Spacebars.call(view.lookup("items"));                                                                      // 6
  }, function() {                                                                                                     // 7
    return [ "\n		", Blaze._InOuterTemplateScope(view, function() {                                                   // 8
      return Blaze._TemplateWith(function() {                                                                         // 9
        return Spacebars.call(view.lookup("."));                                                                      // 10
      }, function() {                                                                                                 // 11
        return Spacebars.include(function() {                                                                         // 12
          return Spacebars.call(view.templateContentBlock);                                                           // 13
        });                                                                                                           // 14
      });                                                                                                             // 15
    }), "\n	" ];                                                                                                      // 16
  });                                                                                                                 // 17
}));                                                                                                                  // 18
                                                                                                                      // 19
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rubaxa:sortable/reactivize.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*                                                                                                                    // 1
Make a Sortable reactive by binding it to a Mongo.Collection.                                                         // 2
Calls `rubaxa:sortable/collection-update` on the server to update the sortField of affected records.                  // 3
                                                                                                                      // 4
TODO:                                                                                                                 // 5
  * supply consecutive values if the `order` field doesn't have any                                                   // 6
  * .get(DOMElement) - return the Sortable object of a DOMElement                                                     // 7
  * create a new _id automatically onAdd if the event.from list had pull: 'clone'                                     // 8
  * support arrays                                                                                                    // 9
    * sparse arrays                                                                                                   // 10
  * tests                                                                                                             // 11
    * drop onto existing empty lists                                                                                  // 12
    * insert back into lists emptied by dropping                                                                      // 13
    * performance on dragging into long list at the beginning                                                         // 14
  * handle failures on Collection operations, e.g. add callback to .insert                                            // 15
  * when adding elements, update ranks just for the half closer to the start/end of the list                          // 16
  * revisit http://programmers.stackexchange.com/questions/266451/maintain-ordered-collection-by-updating-as-few-order-fields-as-possible
  * reproduce the insidious bug where the list isn't always sorted (fiddle with dragging #1 over #2, then back, then #N before #1)
                                                                                                                      // 19
 */                                                                                                                   // 20
                                                                                                                      // 21
'use strict';                                                                                                         // 22
                                                                                                                      // 23
Template.sortable.created = function () {                                                                             // 24
	var templateInstance = this;                                                                                         // 25
	// `this` is a template instance that can store properties of our choice - http://docs.meteor.com/#/full/template_inst
	if (templateInstance.setupDone) return;  // paranoid: only run setup once                                            // 27
	// this.data is the data context - http://docs.meteor.com/#/full/template_data                                       // 28
	// normalize all options into templateInstance.options, and remove them from .data                                   // 29
	templateInstance.options = templateInstance.data.options || {};                                                      // 30
	Object.keys(templateInstance.data).forEach(function (key) {                                                          // 31
		if (key === 'options' || key === 'items') return;                                                                   // 32
		templateInstance.options[key] = templateInstance.data[key];                                                         // 33
		delete templateInstance.data[key];                                                                                  // 34
	});                                                                                                                  // 35
	templateInstance.options.sortField = templateInstance.options.sortField || 'order';                                  // 36
	// We can get the collection via the .collection property of the cursor, but changes made that way                   // 37
	// will NOT be sent to the server - https://github.com/meteor/meteor/issues/3271#issuecomment-66656257               // 38
	// Thus we need to use dburles:mongo-collection-instances to get a *real* collection                                 // 39
	if (templateInstance.data.items && templateInstance.data.items.collection) {                                         // 40
		// cursor passed via items=; its .collection works client-only and has a .name property                             // 41
		templateInstance.collectionName = templateInstance.data.items.collection.name;                                      // 42
		templateInstance.collection = Mongo.Collection.get(templateInstance.collectionName);                                // 43
	}	else if (templateInstance.data.items) {                                                                            // 44
		// collection passed via items=; does NOT have a .name property, but _name                                          // 45
		templateInstance.collection = templateInstance.data.items;                                                          // 46
		templateInstance.collectionName = templateInstance.collection._name;                                                // 47
	}	else if (templateInstance.data.collection) {                                                                       // 48
	  // cursor passed directly                                                                                          // 49
		templateInstance.collectionName = templateInstance.data.collection.name;                                            // 50
		templateInstance.collection = Mongo.Collection.get(templateInstance.collectionName);                                // 51
	} else {                                                                                                             // 52
		templateInstance.collection = templateInstance.data;  // collection passed directly                                 // 53
		templateInstance.collectionName = templateInstance.collection._name;                                                // 54
	}                                                                                                                    // 55
                                                                                                                      // 56
	// TODO if (Array.isArray(templateInstance.collection))                                                              // 57
                                                                                                                      // 58
	// What if user filters some of the items in the cursor, instead of ordering the entire collection?                  // 59
	// Use case: reorder by preference movies of a given genre, a filter within all movies.                              // 60
	// A: Modify all intervening items **that are on the client**, to preserve the overall order                         // 61
	// TODO: update *all* orders via a server method that takes not ids, but start & end elements - mild security risk   // 62
	delete templateInstance.data.options;                                                                                // 63
                                                                                                                      // 64
	/**                                                                                                                  // 65
	 * When an element was moved, adjust its orders and possibly the order of                                            // 66
	 * other elements, so as to maintain a consistent and correct order.                                                 // 67
	 *                                                                                                                   // 68
	 * There are three approaches to this:                                                                               // 69
	 * 1) Using arbitrary precision arithmetic and setting only the order of the moved                                   // 70
	 *    element to the average of the orders of the elements around it -                                               // 71
	 *    http://programmers.stackexchange.com/questions/266451/maintain-ordered-collection-by-updating-as-few-order-fields-as-possible
	 *    The downside is that the order field in the DB will increase by one byte every                                 // 73
	 *    time an element is reordered.                                                                                  // 74
	 * 2) Adjust the orders of the intervening items. This keeps the orders sane (integers)                              // 75
	 *    but is slower because we have to modify multiple documents.                                                    // 76
	 *    TODO: we may be able to update fewer records by only altering the                                              // 77
	 *    order of the records between the newIndex/oldIndex and the start/end of the list.                              // 78
	 * 3) Use regular precision arithmetic, but when the difference between the orders of the                            // 79
	 *    moved item and the one before/after it falls below a certain threshold, adjust                                 // 80
	 *    the order of that other item, and cascade doing so up or down the list.                                        // 81
	 *    This will keep the `order` field constant in size, and will only occasionally                                  // 82
	 *    require updating the `order` of other records.                                                                 // 83
	 *                                                                                                                   // 84
	 * For now, we use approach #2.                                                                                      // 85
	 *                                                                                                                   // 86
	 * @param {String} itemId - the _id of the item that was moved                                                       // 87
	 * @param {Number} orderPrevItem - the order of the item before it, or null                                          // 88
	 * @param {Number} orderNextItem - the order of the item after it, or null                                           // 89
	 */                                                                                                                  // 90
	templateInstance.adjustOrders = function adjustOrders(itemId, orderPrevItem, orderNextItem) {                        // 91
		var orderField = templateInstance.options.sortField;                                                                // 92
		var selector = templateInstance.options.selector || {}, modifier = {$set: {}};                                      // 93
		var ids = [];                                                                                                       // 94
		var startOrder = templateInstance.collection.findOne(itemId)[orderField];                                           // 95
		if (orderPrevItem !== null) {                                                                                       // 96
			// Element has a previous sibling, therefore it was moved down in the list.                                        // 97
			// Decrease the order of intervening elements.                                                                     // 98
			selector[orderField] = {$lte: orderPrevItem, $gt: startOrder};                                                     // 99
			ids = _.pluck(templateInstance.collection.find(selector, {fields: {_id: 1}}).fetch(), '_id');                      // 100
			Meteor.call('rubaxa:sortable/collection-update', templateInstance.collectionName, ids, orderField, -1);            // 101
                                                                                                                      // 102
			// Set the order of the dropped element to the order of its predecessor, whose order was decreased                 // 103
			modifier.$set[orderField] = orderPrevItem;                                                                         // 104
		} else {                                                                                                            // 105
			// element moved up the list, increase order of intervening elements                                               // 106
			selector[orderField] = {$gte: orderNextItem, $lt: startOrder};                                                     // 107
			ids = _.pluck(templateInstance.collection.find(selector, {fields: {_id: 1}}).fetch(), '_id');                      // 108
			Meteor.call('rubaxa:sortable/collection-update', templateInstance.collectionName, ids, orderField, 1);             // 109
                                                                                                                      // 110
			// Set the order of the dropped element to the order of its successor, whose order was increased                   // 111
			modifier.$set[orderField] = orderNextItem;                                                                         // 112
		}                                                                                                                   // 113
		templateInstance.collection.update(itemId, modifier);                                                               // 114
	};                                                                                                                   // 115
                                                                                                                      // 116
	templateInstance.setupDone = true;                                                                                   // 117
};                                                                                                                    // 118
                                                                                                                      // 119
                                                                                                                      // 120
Template.sortable.rendered = function () {                                                                            // 121
  var templateInstance = this;                                                                                        // 122
	var orderField = templateInstance.options.sortField;                                                                 // 123
                                                                                                                      // 124
	// sorting was changed within the list                                                                               // 125
	var optionsOnUpdate = templateInstance.options.onUpdate;                                                             // 126
	templateInstance.options.onUpdate = function sortableUpdate(/**Event*/event) {                                       // 127
		var itemEl = event.item;  // dragged HTMLElement                                                                    // 128
		event.data = Blaze.getData(itemEl);                                                                                 // 129
		if (event.newIndex < event.oldIndex) {                                                                              // 130
			// Element moved up in the list. The dropped element has a next sibling for sure.                                  // 131
			var orderNextItem = Blaze.getData(itemEl.nextElementSibling)[orderField];                                          // 132
			templateInstance.adjustOrders(event.data._id, null, orderNextItem);                                                // 133
		} else if (event.newIndex > event.oldIndex) {                                                                       // 134
			// Element moved down in the list. The dropped element has a previous sibling for sure.                            // 135
			var orderPrevItem = Blaze.getData(itemEl.previousElementSibling)[orderField];                                      // 136
			templateInstance.adjustOrders(event.data._id, orderPrevItem, null);                                                // 137
		} else {                                                                                                            // 138
			// do nothing - drag and drop in the same location                                                                 // 139
		}                                                                                                                   // 140
		if (optionsOnUpdate) optionsOnUpdate(event);                                                                        // 141
	};                                                                                                                   // 142
                                                                                                                      // 143
	// element was added from another list                                                                               // 144
	var optionsOnAdd = templateInstance.options.onAdd;                                                                   // 145
	templateInstance.options.onAdd = function sortableAdd(/**Event*/event) {                                             // 146
		var itemEl = event.item;  // dragged HTMLElement                                                                    // 147
		event.data = Blaze.getData(itemEl);                                                                                 // 148
		// let the user decorate the object with additional properties before insertion                                     // 149
		if (optionsOnAdd) optionsOnAdd(event);                                                                              // 150
                                                                                                                      // 151
		// Insert the new element at the end of the list and move it where it was dropped.                                  // 152
		// We could insert it at the beginning, but that would lead to negative orders.                                     // 153
		var sortSpecifier = {}; sortSpecifier[orderField] = -1;                                                             // 154
		event.data.order = templateInstance.collection.findOne({}, { sort: sortSpecifier, limit: 1 }).order + 1;            // 155
		// TODO: this can obviously be optimized by setting the order directly as the arithmetic average, with the caveats described above
		var newElementId = templateInstance.collection.insert(event.data);                                                  // 157
		event.data._id = newElementId;                                                                                      // 158
		if (itemEl.nextElementSibling) {                                                                                    // 159
			var orderNextItem = Blaze.getData(itemEl.nextElementSibling)[orderField];                                          // 160
			templateInstance.adjustOrders(newElementId, null, orderNextItem);                                                  // 161
		} else {                                                                                                            // 162
			// do nothing - inserted after the last element                                                                    // 163
		}                                                                                                                   // 164
		// remove the dropped HTMLElement from the list because we have inserted it in the collection, which will update the template
		itemEl.parentElement.removeChild(itemEl);                                                                           // 166
	};                                                                                                                   // 167
                                                                                                                      // 168
	// element was removed by dragging into another list                                                                 // 169
	var optionsOnRemove = templateInstance.options.onRemove;                                                             // 170
	templateInstance.options.onRemove = function sortableRemove(/**Event*/event) {                                       // 171
		var itemEl = event.item;  // dragged HTMLElement                                                                    // 172
		event.data = Blaze.getData(itemEl);                                                                                 // 173
		// don't remove from the collection if group.pull is clone or false                                                 // 174
		if (typeof templateInstance.options.group === 'undefined'                                                           // 175
				|| typeof templateInstance.options.group.pull === 'undefined'                                                     // 176
				|| templateInstance.options.group.pull === true                                                                   // 177
		) templateInstance.collection.remove(event.data._id);                                                               // 178
		if (optionsOnRemove) optionsOnRemove(event);                                                                        // 179
	};                                                                                                                   // 180
                                                                                                                      // 181
	// just compute the `data` context                                                                                   // 182
	['onStart', 'onEnd', 'onSort', 'onFilter'].forEach(function (eventHandler) {                                         // 183
		if (templateInstance.options[eventHandler]) {                                                                       // 184
			var userEventHandler = templateInstance.options[eventHandler];                                                     // 185
			templateInstance.options[eventHandler] = function (/**Event*/event) {                                              // 186
				var itemEl = event.item;  // dragged HTMLElement                                                                  // 187
				event.data = Blaze.getData(itemEl);                                                                               // 188
				userEventHandler(event);                                                                                          // 189
			};                                                                                                                 // 190
		}                                                                                                                   // 191
	});                                                                                                                  // 192
                                                                                                                      // 193
	templateInstance.sortable = Sortable.create(templateInstance.firstNode.parentElement, templateInstance.options);     // 194
	// TODO make the object accessible, e.g. via Sortable.getSortableById() or some such                                 // 195
};                                                                                                                    // 196
                                                                                                                      // 197
                                                                                                                      // 198
Template.sortable.destroyed = function () {                                                                           // 199
	if(this.sortable) this.sortable.destroy();                                                                           // 200
};                                                                                                                    // 201
                                                                                                                      // 202
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rubaxa:sortable/methods-client.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
'use strict';                                                                                                         // 1
                                                                                                                      // 2
Meteor.methods({                                                                                                      // 3
	/**                                                                                                                  // 4
	 * Update the sortField of documents with given ids in a collection, incrementing it by incDec                       // 5
	 * @param {String} collectionName - name of the collection to update                                                 // 6
	 * @param {String[]} ids - array of document ids                                                                     // 7
	 * @param {String} orderField - the name of the order field, usually "order"                                         // 8
	 * @param {Number} incDec - pass 1 or -1                                                                             // 9
	 */                                                                                                                  // 10
	'rubaxa:sortable/collection-update': function (collectionName, ids, sortField, incDec) {                             // 11
		var selector = {_id: {$in: ids}}, modifier = {$inc: {}};                                                            // 12
		modifier.$inc[sortField] = incDec;                                                                                  // 13
		Mongo.Collection.get(collectionName).update(selector, modifier, {multi: true});                                     // 14
	}                                                                                                                    // 15
});                                                                                                                   // 16
                                                                                                                      // 17
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("rubaxa:sortable", {
  Sortable: Sortable
});

})();
