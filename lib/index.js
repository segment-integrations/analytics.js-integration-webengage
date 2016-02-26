'use strict';

/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');
var useHttps = require('use-https');
var asString = Object.prototype.toString;


/**
 * Expose `WebEngage` integration.
 */

var WebEngage = module.exports = integration('WebEngage')
  .readyOnInitialize()
  .global('webengage')
  .option('licenseCode', '')
  .tag('http', '<script src="http://cdn.widgets.webengage.com/js/widget/webengage-min-v-5.0.js">')
  .tag('https', '<script src="https://ssl.widgets.webengage.com/js/widget/webengage-min-v-5.0.js">');

/**
 * Initialize.
 *
 * http://docs.webengage.com/sdks/web/integration/readme.html#default-integration-code
 * @api public
 */

WebEngage.prototype.initialize = function() {
  var self = this;
  function ready() {
    window.webengage.onReady(self.ready);
  }

  if (window.webengage && window.webengage.onReady) {
    return ready();
  }

  /* eslint-disable */
  !function(e,t,n){function o(e,t){e[t[t.length-1]]=function(){r.__queue.push([t.join("."),arguments])}}var i,s,r=e[n],g=" ",l="init options track screen onReady".split(g),a="feedback survey notification".split(g),c="options render clear abort".split(g),p="Open Close Submit Complete View Click".split(g),u="identify login logout setAttribute".split(g);if(!r||!r.__v){for(e[n]=r={__queue:[],__v:"5.0",user:{}},i=0;i<l.length;i++)o(r,[l[i]]);for(i=0;i<a.length;i++){for(r[a[i]]={},s=0;s<c.length;s++)o(r[a[i]],[a[i],c[s]]);for(s=0;s<p.length;s++)o(r[a[i]],[a[i],"on"+p[s]])}for(i=0;i<u.length;i++)o(r.user,["user",u[i]]);}}(window,document,"webengage");
  /* eslint-enable */

  window.webengage.ixP = 'Segment';

  window.webengage.init(this.options.licenseCode);

  var name = useHttps() ? 'https' : 'http';
  this.load(name, ready);
};


/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

WebEngage.prototype.loaded = function() {
  var loaded = false;

  if (window.webengage && window.webengage.onReady) {
    window.webengage.onReady(function() { loaded = true; });
  }

  return loaded;
};


/**
 * Identify.
 *
 * http://docs.webengage.com/sdks/web/user/readme.html#webengageuserlogin
 *
 * @api public
 * @param {Identify} identify
 */

WebEngage.prototype.identify = function(identify) {
  var traits = identify.traits();
  var id = identify.userId();
  if (id) window.webengage.user.login(id);

  if (traits) window.webengage.user.setAttribute(mapTraits(flatten(traits)));
};


/**
 * Track.
 *
 * http://docs.webengage.com/sdks/web/events/readme.html#webengagetrack
 *
 * @api public
 * @param {Track} track
 */

WebEngage.prototype.track = function(track) {
  var event = track.event();
  var properties = flatten(track.properties());
  window.webengage.track(event, properties);
};


/**
 * Page.
 *
 * @param {Page} page
 */

WebEngage.prototype.page = function(page) {
  var name = page.name() || '';
  var properties = flatten(page.properties());

  window.webengage.screen(name, properties);
};


/**
 * Map traits to their WebEngage attributes.
 *
 * http://docs.webengage.com/sdks/web/user/readme.html#predefined-attribute-keys
 *
 * @param {Object} traits
 * @return {Object} mapped
 * @api private
 */

function mapTraits(traits) {
  var aliases = {
    name: 'we_first_name',
    firstName: 'we_first_name',
    lastName: 'we_last_name',
    email: 'we_email',
    gender: 'we_gender',
    birthday: 'we_birth_date',
    phone: 'we_phone',
    company: 'we_company'
  };

  var mapped = {};
  for (var k in traits) {
    if (aliases.hasOwnProperty(k)) {
      mapped[aliases[k]] = traits[k];
    } else {
      mapped[k] = traits[k];
    }
  }

  if (asString.call(mapped.we_birth_date) === '[object Date]') {
    var date = mapped.we_birth_date;

    mapped.we_birth_date = date.getUTCFullYear()
      + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate());
  }

  return mapped;
}

/**
 * Pad single digit numbers with a leading 0.
 *
 * @param {number} number
 * @return {number}
 * @api private
 */

function pad(number) {
  return number < 10 ? '0' + number : number;
}

/**
 * Flatten nested objects and arrays
 *
 * @param {Object} obj
 * @return {Object} obj
 * @api public
 */

function flatten(target) {
  var delimiter = '.';
  var output = {};

  function step(object, prev) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        var value = object[key];
        var type = asString.call(value);

        if (value == null) continue;

        var newKey = prev
          ? prev + delimiter + key
          : key;

        // leave booleans, numbers, strings and dates as is
        if (type === '[object Boolean]' || type === '[object Number]' || type === '[object String]' || type === '[object Date]') {
          output[newKey] = value;
        } else if (type !== '[object Object]' && type !== '[object Array]') {
        // convert non objects/arrays to strings
          output[newKey] = value.toString();
        } else {
          step(value, newKey);
        }
      }
    }
  }

  step(target);

  return output;
}
