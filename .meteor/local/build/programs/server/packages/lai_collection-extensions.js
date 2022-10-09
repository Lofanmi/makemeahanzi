(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var CollectionExtensions;

var require = meteorInstall({"node_modules":{"meteor":{"lai:collection-extensions":{"collection-extensions.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/lai_collection-extensions/collection-extensions.js                                                     //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 1);
// The collection extensions namespace
CollectionExtensions = {}; // eslint-disable-line no-global-assign
// Stores all the collection extensions

CollectionExtensions._extensions = []; // This is where you would add custom functionality to
// Mongo.Collection/Meteor.Collection

CollectionExtensions.addExtension = function (customFunction) {
  if (typeof customFunction !== 'function') {
    throw new Meteor.Error('collection-extension-wrong-argument', 'You must pass a function into CollectionExtensions.addExtension().');
  }

  CollectionExtensions._extensions.push(customFunction); // If Meteor.users exists, apply the extension right away


  if (typeof Meteor.users !== 'undefined') {
    customFunction.apply(Meteor.users, ['users']);
  }
}; // Backwards compatibility


Meteor.addCollectionExtension = function () {
  console.warn('`Meteor.addCollectionExtension` is deprecated, please use `CollectionExtensions.addExtension`');
  CollectionExtensions.addExtension.apply(null, arguments);
}; // Utility function to add a prototype function to your
// Meteor/Mongo.Collection object


CollectionExtensions.addPrototype = function (name, customFunction) {
  if (typeof name !== 'string') {
    throw new Meteor.Error('collection-extension-wrong-argument', 'You must pass a string as the first argument into CollectionExtensions.addPrototype().');
  }

  if (typeof customFunction !== 'function') {
    throw new Meteor.Error('collection-extension-wrong-argument', 'You must pass a function as the second argument into CollectionExtensions.addPrototype().');
  }

  (typeof Mongo !== 'undefined' ? Mongo.Collection : Meteor.Collection).prototype[name] = customFunction;
}; // Backwards compatibility


Meteor.addCollectionPrototype = function () {
  console.warn('`Meteor.addCollectionPrototype` is deprecated, please use `CollectionExtensions.addPrototype`');
  CollectionExtensions.addPrototype.apply(null, arguments);
}; // This is used to reassign the prototype of unfortunately
// and unstoppably already instantiated Mongo instances
// i.e. Meteor.users


function reassignCollectionPrototype(instance, constr) {
  const hasSetPrototypeOf = typeof Object.setPrototypeOf === 'function';
  if (!constr) constr = typeof Mongo !== 'undefined' ? Mongo.Collection : Meteor.Collection; // __proto__ is not available in < IE11
  // Note: Assigning a prototype dynamically has performance implications

  if (hasSetPrototypeOf) {
    Object.setPrototypeOf(instance, constr.prototype);
  } else if (instance.__proto__) {
    // eslint-disable-line no-proto
    // eslint-disable-next-line no-proto
    instance.__proto__ = constr.prototype;
  }
} // This monkey-patches the Collection constructor
// This code is the same monkey-patching code
// that matb33:collection-hooks uses, which works pretty nicely


function wrapCollection(ns, as) {
  // Save the original prototype
  if (!as._CollectionPrototype) as._CollectionPrototype = new as.Collection(null);
  const constructor = as.Collection;
  const proto = as._CollectionPrototype;

  ns.Collection = function () {
    const ret = constructor.apply(this, arguments); // This is where all the collection extensions get processed

    processCollectionExtensions(this, arguments);
    return ret;
  };

  ns.Collection.prototype = proto;
  ns.Collection.prototype.constructor = ns.Collection;

  for (const prop in constructor) {
    if (Object.prototype.hasOwnProperty.call(constructor, prop)) {
      ns.Collection[prop] = constructor[prop];
    }
  }
}

function processCollectionExtensions(self, args) {
  // Using old-school operations for better performance
  // Please don't judge me ;P
  const applyArgs = args ? [].slice.call(args, 0) : undefined;
  const extensions = CollectionExtensions._extensions;

  for (let i = 0, len = extensions.length; i < len; i++) {
    extensions[i].apply(self, applyArgs);
  }
}

if (typeof Mongo !== 'undefined') {
  wrapCollection(Meteor, Mongo);
  wrapCollection(Mongo, Mongo);
} else {
  wrapCollection(Meteor, Meteor);
}

if (typeof Meteor.users !== 'undefined') {
  // Ensures that Meteor.users instanceof Mongo.Collection
  reassignCollectionPrototype(Meteor.users);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/lai:collection-extensions/collection-extensions.js");

/* Exports */
Package._define("lai:collection-extensions", {
  CollectionExtensions: CollectionExtensions
});

})();

//# sourceURL=meteor://💻app/packages/lai_collection-extensions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbGFpOmNvbGxlY3Rpb24tZXh0ZW5zaW9ucy9jb2xsZWN0aW9uLWV4dGVuc2lvbnMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwibW9kdWxlIiwibGluayIsInYiLCJNb25nbyIsIkNvbGxlY3Rpb25FeHRlbnNpb25zIiwiX2V4dGVuc2lvbnMiLCJhZGRFeHRlbnNpb24iLCJjdXN0b21GdW5jdGlvbiIsIkVycm9yIiwicHVzaCIsInVzZXJzIiwiYXBwbHkiLCJhZGRDb2xsZWN0aW9uRXh0ZW5zaW9uIiwiY29uc29sZSIsIndhcm4iLCJhcmd1bWVudHMiLCJhZGRQcm90b3R5cGUiLCJuYW1lIiwiQ29sbGVjdGlvbiIsInByb3RvdHlwZSIsImFkZENvbGxlY3Rpb25Qcm90b3R5cGUiLCJyZWFzc2lnbkNvbGxlY3Rpb25Qcm90b3R5cGUiLCJpbnN0YW5jZSIsImNvbnN0ciIsImhhc1NldFByb3RvdHlwZU9mIiwiT2JqZWN0Iiwic2V0UHJvdG90eXBlT2YiLCJfX3Byb3RvX18iLCJ3cmFwQ29sbGVjdGlvbiIsIm5zIiwiYXMiLCJfQ29sbGVjdGlvblByb3RvdHlwZSIsImNvbnN0cnVjdG9yIiwicHJvdG8iLCJyZXQiLCJwcm9jZXNzQ29sbGVjdGlvbkV4dGVuc2lvbnMiLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic2VsZiIsImFyZ3MiLCJhcHBseUFyZ3MiLCJzbGljZSIsInVuZGVmaW5lZCIsImV4dGVuc2lvbnMiLCJpIiwibGVuIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLGVBQVosRUFBNEI7QUFBQ0YsUUFBTSxDQUFDRyxDQUFELEVBQUc7QUFBQ0gsVUFBTSxHQUFDRyxDQUFQO0FBQVM7O0FBQXBCLENBQTVCLEVBQWtELENBQWxEO0FBQXFELElBQUlDLEtBQUo7QUFBVUgsTUFB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QUFLLElBQUl3QyxDQUFDLEdBQUcsQ0FBUixFQUFXQyxHQUFHLEdBQUdGLFVBQVUsQ0FBQ0csTUFBakMsRUFBeUNGLENBQUMsR0FBR0MsR0FBN0MsRUFBa0RELENBQUMsRUFBbkQsRUFBdUQ7QUFDckRELGNBQVUsQ0FBQ0MsQ0FBRCxDQUFWLENBQWNsQyxLQUFkLENBQW9CNEIsSUFBcEIsRUFBMEJFLFNBQTFCO0FBQ0Q7QUFDRjs7QUFFRCxJQUFJLE9BQU90QyxLQUFQLEtBQWlCLFdBQXJCLEVBQWtDO0FBQ2hDeUIsZ0JBQWMsQ0FBQzdCLE1BQUQsRUFBU0ksS0FBVCxDQUFkO0FBQ0F5QixnQkFBYyxDQUFDekIsS0FBRCxFQUFRQSxLQUFSLENBQWQ7QUFDRCxDQUhELE1BR087QUFDTHlCLGdCQUFjLENBQUM3QixNQUFELEVBQVNBLE1BQVQsQ0FBZDtBQUNEOztBQUVELElBQUksT0FBT0EsTUFBTSxDQUFDVyxLQUFkLEtBQXdCLFdBQTVCLEVBQXlDO0FBQ3ZDO0FBQ0FXLDZCQUEyQixDQUFDdEIsTUFBTSxDQUFDVyxLQUFSLENBQTNCO0FBQ0QsQyIsImZpbGUiOiIvcGFja2FnZXMvbGFpX2NvbGxlY3Rpb24tZXh0ZW5zaW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBDb2xsZWN0aW9uRXh0ZW5zaW9ucyAqL1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcidcbmltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJ1xuXG4vLyBUaGUgY29sbGVjdGlvbiBleHRlbnNpb25zIG5hbWVzcGFjZVxuQ29sbGVjdGlvbkV4dGVuc2lvbnMgPSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWdsb2JhbC1hc3NpZ25cblxuLy8gU3RvcmVzIGFsbCB0aGUgY29sbGVjdGlvbiBleHRlbnNpb25zXG5Db2xsZWN0aW9uRXh0ZW5zaW9ucy5fZXh0ZW5zaW9ucyA9IFtdXG5cbi8vIFRoaXMgaXMgd2hlcmUgeW91IHdvdWxkIGFkZCBjdXN0b20gZnVuY3Rpb25hbGl0eSB0b1xuLy8gTW9uZ28uQ29sbGVjdGlvbi9NZXRlb3IuQ29sbGVjdGlvblxuQ29sbGVjdGlvbkV4dGVuc2lvbnMuYWRkRXh0ZW5zaW9uID0gZnVuY3Rpb24gKGN1c3RvbUZ1bmN0aW9uKSB7XG4gIGlmICh0eXBlb2YgY3VzdG9tRnVuY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgJ2NvbGxlY3Rpb24tZXh0ZW5zaW9uLXdyb25nLWFyZ3VtZW50JyxcbiAgICAgICdZb3UgbXVzdCBwYXNzIGEgZnVuY3Rpb24gaW50byBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRFeHRlbnNpb24oKS4nKVxuICB9XG4gIENvbGxlY3Rpb25FeHRlbnNpb25zLl9leHRlbnNpb25zLnB1c2goY3VzdG9tRnVuY3Rpb24pXG4gIC8vIElmIE1ldGVvci51c2VycyBleGlzdHMsIGFwcGx5IHRoZSBleHRlbnNpb24gcmlnaHQgYXdheVxuICBpZiAodHlwZW9mIE1ldGVvci51c2VycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjdXN0b21GdW5jdGlvbi5hcHBseShNZXRlb3IudXNlcnMsIFsndXNlcnMnXSlcbiAgfVxufVxuXG4vLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuTWV0ZW9yLmFkZENvbGxlY3Rpb25FeHRlbnNpb24gPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUud2FybignYE1ldGVvci5hZGRDb2xsZWN0aW9uRXh0ZW5zaW9uYCBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIGBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRFeHRlbnNpb25gJylcbiAgQ29sbGVjdGlvbkV4dGVuc2lvbnMuYWRkRXh0ZW5zaW9uLmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbn1cblxuLy8gVXRpbGl0eSBmdW5jdGlvbiB0byBhZGQgYSBwcm90b3R5cGUgZnVuY3Rpb24gdG8geW91clxuLy8gTWV0ZW9yL01vbmdvLkNvbGxlY3Rpb24gb2JqZWN0XG5Db2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRQcm90b3R5cGUgPSBmdW5jdGlvbiAobmFtZSwgY3VzdG9tRnVuY3Rpb24pIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAnY29sbGVjdGlvbi1leHRlbnNpb24td3JvbmctYXJndW1lbnQnLFxuICAgICAgJ1lvdSBtdXN0IHBhc3MgYSBzdHJpbmcgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IGludG8gQ29sbGVjdGlvbkV4dGVuc2lvbnMuYWRkUHJvdG90eXBlKCkuJylcbiAgfVxuICBpZiAodHlwZW9mIGN1c3RvbUZ1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcbiAgICAgICdjb2xsZWN0aW9uLWV4dGVuc2lvbi13cm9uZy1hcmd1bWVudCcsXG4gICAgICAnWW91IG11c3QgcGFzcyBhIGZ1bmN0aW9uIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgaW50byBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRQcm90b3R5cGUoKS4nKVxuICB9XG4gICh0eXBlb2YgTW9uZ28gIT09ICd1bmRlZmluZWQnXG4gICAgPyBNb25nby5Db2xsZWN0aW9uXG4gICAgOiBNZXRlb3IuQ29sbGVjdGlvbikucHJvdG90eXBlW25hbWVdID0gY3VzdG9tRnVuY3Rpb25cbn1cblxuLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbk1ldGVvci5hZGRDb2xsZWN0aW9uUHJvdG90eXBlID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLndhcm4oJ2BNZXRlb3IuYWRkQ29sbGVjdGlvblByb3RvdHlwZWAgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVzZSBgQ29sbGVjdGlvbkV4dGVuc2lvbnMuYWRkUHJvdG90eXBlYCcpXG4gIENvbGxlY3Rpb25FeHRlbnNpb25zLmFkZFByb3RvdHlwZS5hcHBseShudWxsLCBhcmd1bWVudHMpXG59XG5cbi8vIFRoaXMgaXMgdXNlZCB0byByZWFzc2lnbiB0aGUgcHJvdG90eXBlIG9mIHVuZm9ydHVuYXRlbHlcbi8vIGFuZCB1bnN0b3BwYWJseSBhbHJlYWR5IGluc3RhbnRpYXRlZCBNb25nbyBpbnN0YW5jZXNcbi8vIGkuZS4gTWV0ZW9yLnVzZXJzXG5mdW5jdGlvbiByZWFzc2lnbkNvbGxlY3Rpb25Qcm90b3R5cGUgKGluc3RhbmNlLCBjb25zdHIpIHtcbiAgY29uc3QgaGFzU2V0UHJvdG90eXBlT2YgPSB0eXBlb2YgT2JqZWN0LnNldFByb3RvdHlwZU9mID09PSAnZnVuY3Rpb24nXG5cbiAgaWYgKCFjb25zdHIpIGNvbnN0ciA9IHR5cGVvZiBNb25nbyAhPT0gJ3VuZGVmaW5lZCcgPyBNb25nby5Db2xsZWN0aW9uIDogTWV0ZW9yLkNvbGxlY3Rpb25cblxuICAvLyBfX3Byb3RvX18gaXMgbm90IGF2YWlsYWJsZSBpbiA8IElFMTFcbiAgLy8gTm90ZTogQXNzaWduaW5nIGEgcHJvdG90eXBlIGR5bmFtaWNhbGx5IGhhcyBwZXJmb3JtYW5jZSBpbXBsaWNhdGlvbnNcbiAgaWYgKGhhc1NldFByb3RvdHlwZU9mKSB7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGluc3RhbmNlLCBjb25zdHIucHJvdG90eXBlKVxuICB9IGVsc2UgaWYgKGluc3RhbmNlLl9fcHJvdG9fXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXByb3RvXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b1xuICAgIGluc3RhbmNlLl9fcHJvdG9fXyA9IGNvbnN0ci5wcm90b3R5cGVcbiAgfVxufVxuXG4vLyBUaGlzIG1vbmtleS1wYXRjaGVzIHRoZSBDb2xsZWN0aW9uIGNvbnN0cnVjdG9yXG4vLyBUaGlzIGNvZGUgaXMgdGhlIHNhbWUgbW9ua2V5LXBhdGNoaW5nIGNvZGVcbi8vIHRoYXQgbWF0YjMzOmNvbGxlY3Rpb24taG9va3MgdXNlcywgd2hpY2ggd29ya3MgcHJldHR5IG5pY2VseVxuZnVuY3Rpb24gd3JhcENvbGxlY3Rpb24gKG5zLCBhcykge1xuICAvLyBTYXZlIHRoZSBvcmlnaW5hbCBwcm90b3R5cGVcbiAgaWYgKCFhcy5fQ29sbGVjdGlvblByb3RvdHlwZSkgYXMuX0NvbGxlY3Rpb25Qcm90b3R5cGUgPSBuZXcgYXMuQ29sbGVjdGlvbihudWxsKVxuXG4gIGNvbnN0IGNvbnN0cnVjdG9yID0gYXMuQ29sbGVjdGlvblxuICBjb25zdCBwcm90byA9IGFzLl9Db2xsZWN0aW9uUHJvdG90eXBlXG5cbiAgbnMuQ29sbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXQgPSBjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgLy8gVGhpcyBpcyB3aGVyZSBhbGwgdGhlIGNvbGxlY3Rpb24gZXh0ZW5zaW9ucyBnZXQgcHJvY2Vzc2VkXG4gICAgcHJvY2Vzc0NvbGxlY3Rpb25FeHRlbnNpb25zKHRoaXMsIGFyZ3VtZW50cylcbiAgICByZXR1cm4gcmV0XG4gIH1cblxuICBucy5Db2xsZWN0aW9uLnByb3RvdHlwZSA9IHByb3RvXG4gIG5zLkNvbGxlY3Rpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gbnMuQ29sbGVjdGlvblxuXG4gIGZvciAoY29uc3QgcHJvcCBpbiBjb25zdHJ1Y3Rvcikge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoY29uc3RydWN0b3IsIHByb3ApKSB7XG4gICAgICBucy5Db2xsZWN0aW9uW3Byb3BdID0gY29uc3RydWN0b3JbcHJvcF1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0NvbGxlY3Rpb25FeHRlbnNpb25zIChzZWxmLCBhcmdzKSB7XG4gIC8vIFVzaW5nIG9sZC1zY2hvb2wgb3BlcmF0aW9ucyBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG4gIC8vIFBsZWFzZSBkb24ndCBqdWRnZSBtZSA7UFxuICBjb25zdCBhcHBseUFyZ3MgPSBhcmdzID8gW10uc2xpY2UuY2FsbChhcmdzLCAwKSA6IHVuZGVmaW5lZFxuICBjb25zdCBleHRlbnNpb25zID0gQ29sbGVjdGlvbkV4dGVuc2lvbnMuX2V4dGVuc2lvbnNcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGV4dGVuc2lvbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBleHRlbnNpb25zW2ldLmFwcGx5KHNlbGYsIGFwcGx5QXJncylcbiAgfVxufVxuXG5pZiAodHlwZW9mIE1vbmdvICE9PSAndW5kZWZpbmVkJykge1xuICB3cmFwQ29sbGVjdGlvbihNZXRlb3IsIE1vbmdvKVxuICB3cmFwQ29sbGVjdGlvbihNb25nbywgTW9uZ28pXG59IGVsc2Uge1xuICB3cmFwQ29sbGVjdGlvbihNZXRlb3IsIE1ldGVvcilcbn1cblxuaWYgKHR5cGVvZiBNZXRlb3IudXNlcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gIC8vIEVuc3VyZXMgdGhhdCBNZXRlb3IudXNlcnMgaW5zdGFuY2VvZiBNb25nby5Db2xsZWN0aW9uXG4gIHJlYXNzaWduQ29sbGVjdGlvblByb3RvdHlwZShNZXRlb3IudXNlcnMpXG59XG4iXX0=
