'use strict';

var Analytics = require('analytics.js-core').constructor;
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var WebEngage = require('../lib/');

describe('WebEngage', function() {
  var analytics;
  var webengage;
  var options = {
    licenseCode: '~2024c003'
  };

  beforeEach(function() {
    analytics = new Analytics();
    webengage = new WebEngage(options);
    analytics.use(WebEngage);
    analytics.use(tester);
    analytics.add(webengage);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    webengage.reset();
    sandbox();
  });

  it('should store the correct settings', function() {
    analytics.compare(WebEngage, integration('WebEngage')
      .readyOnInitialize()
      .global('webengage')
      .option('licenseCode', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(webengage, 'load');
      analytics.initialize();
      analytics.page();
    });

    describe('#initialize', function() {
      it('should create window.webengage', function() {
        analytics.assert(window.webengage);
      });

      it('should create window.webengage.screen', function() {
        analytics.assert(window.webengage.screen);
      });

      it('should create window.webengage.track', function() {
        analytics.assert(window.webengage.screen);
      });

      it('should create window.webengage.user.login', function() {
        analytics.assert(window.webengage.user.login);
      });

      it('should create window.webengage.user.setAttribute', function() {
        analytics.assert(window.webengage.user.setAttribute);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(webengage, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should be ready', function() {
      var isReady = false;
      window.webengage.onReady(function() {
        isReady = true;
      });

      analytics.assert(isReady);
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.webengage, 'screen');
      });

      afterEach(function() {
        // window.webengage.reload();
      });

      it('should call screen', function() {
        analytics.page();
        analytics.called(window.webengage.screen);
      });

      it('should pass page name and default properties via screen', function() {
        analytics.page('Name');
        analytics.called(window.webengage.screen, 'Name', {
          title: document.title,
          url: window.location.href,
          name: 'Name',
          path: window.location.pathname,
          referrer: document.referrer,
          search: window.location.search
        });
      });

      it('should pass page name and properties (some overridden) via screen', function() {
        analytics.page('Arbitrary category', 'Name', {
          title: 'Multi-channel User Engagement & Marketing Automation Platform - WebEngage',
          url: 'https://webengage.com',
          custom: 'Custom property'
        });
        analytics.called(window.webengage.screen, 'Name', {
          title: 'Multi-channel User Engagement & Marketing Automation Platform - WebEngage',
          url: 'https://webengage.com',
          name: 'Name',
          path: window.location.pathname,
          referrer: document.referrer,
          search: window.location.search,
          category: 'Arbitrary category',
          custom: 'Custom property'
        });
      });

      it('should pass page name and flattened nested properties via screen', function() {
        analytics.page('Another name', {
          plans: ['Personal', 'Professional', 'Business', 'Enterprise'],
          company: 'WebEngage',
          info: {
            'started in': '2011',
            parent: 'Webklipper'
          }
        });
        analytics.called(window.webengage.screen, 'Another name', {
          title: document.title,
          url: window.location.href,
          name: 'Another name',
          path: window.location.pathname,
          referrer: document.referrer,
          search: window.location.search,
          'plans.0': 'Personal',
          'plans.1': 'Professional',
          'plans.2': 'Business',
          'plans.3': 'Enterprise',
          company: 'WebEngage',
          'info.started in': '2011',
          'info.parent': 'Webklipper'
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.webengage.user, 'login');
        analytics.stub(window.webengage.user, 'setAttribute');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.webengage.user.login, 'id');
        analytics.called(window.webengage.user.setAttribute, {
          id: 'id'
        });
      });

      it('should send traits', function() {
        analytics.identify({
          trait: true
        });
        analytics.didNotCall(window.webengage.user.login);
        analytics.called(window.webengage.user.setAttribute, {
          trait: true
        });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', {
          trait: true
        });
        analytics.called(window.webengage.user.login, 'id');
        analytics.called(window.webengage.user.setAttribute, {
          trait: true,
          id: 'id'
        });
      });

      it('should send flattened nested traits objects', function() {
        analytics.identify('id', {
          trait: {
            foo: 'bar',
            spam: ['apples', 'oranges', 'bananas', {
              nut: 'peanut'
            }]
          }
        });
        analytics.called(window.webengage.user.login, 'id');
        analytics.called(window.webengage.user.setAttribute, {
          'trait.foo': 'bar',
          'trait.spam.0': 'apples',
          'trait.spam.1': 'oranges',
          'trait.spam.2': 'bananas',
          'trait.spam.3.nut': 'peanut',
          id: 'id'
        });
      });

      it('should send mapped traits to their reserved WebEngage user attributes', function() {
        analytics.identify('id', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@anonymous.org',
          gender: 'male',
          birthday: '1970-01-01',
          phone: '333-444-1234',
          company: 'Acme Inc'
        });
        analytics.called(window.webengage.user.login, 'id');
        analytics.called(window.webengage.user.setAttribute, {
          we_first_name: 'John',
          we_last_name: 'Doe',
          we_email: 'johndoe@anonymous.org',
          we_gender: 'male',
          we_birth_date: '1970-01-01',
          we_phone: '333-444-1234',
          we_company: 'Acme Inc',
          id: 'id'
        });
      });

      it('should send convert the "birthday" trait to a yyyy-mm-dd (UTC) string for we_birth_date user attribute', function() {
        analytics.identify('id', {
          birthday: new Date('Wed, 3 Apr 2001 00:00:00 UTC')
        });
        analytics.called(window.webengage.user.login, 'id');
        analytics.called(window.webengage.user.setAttribute, {
          we_birth_date: '2001-04-03',
          id: 'id'
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.webengage, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.webengage.track, 'event', {});
      });

      it('should send an event and properties', function() {
        analytics.track('event', {
          property: true
        });
        analytics.called(window.webengage.track, 'event', {
          property: true
        });
      });

      it('should flatten nested objects', function() {
        analytics.track('event', {
          glenn: {
            coco: 'best halloween costume',
            puntuations: ['comma', 'apostrophe', 'quotes', 'colon', 'semi colon'],
            mean: {
              girls: 'lindsey',
              birthdate: new Date(1991, 2, 3)
            }
          }
        });
        analytics.called(window.webengage.track, 'event', {
          'glenn.coco': 'best halloween costume',
          'glenn.puntuations.0': 'comma',
          'glenn.puntuations.1': 'apostrophe',
          'glenn.puntuations.2': 'quotes',
          'glenn.puntuations.3': 'colon',
          'glenn.puntuations.4': 'semi colon',
          'glenn.mean.girls': 'lindsey',
          'glenn.mean.birthdate': new Date(1991, 2, 3)
        });
      });
    });
  });
});
