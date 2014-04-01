var vows   = require('vows'),
  d3 = require('d3'),
  assert = require('assert');

var KoopOSM = require('../js/koop.osm.js');

var host = 'koop.dc.esri.com';

vows.describe('KoopOSM').addBatch({
  'When creating an instance of KoopOSM': {
    topic: function () {
      var kooposm = KoopOSM(host);
      this.callback( null, kooposm );
    },
    'It should return the instance of koop osm': function (err, kooposm) {
      assert.notEqual( kooposm, null);
      assert.equal( kooposm.host, host );
    }
  },

  'When querying for state counts': {
    topic: function () {
      var kooposm = KoopOSM(host, d3);
      kooposm.stateCounts('points', {}, this.callback);
    },
    'It should return counts': function (err, result) {
      assert.equal( err, null );
      assert.notEqual( result, null );
      assert.equal( result.length, 3 );
    }
  },
}).export(module);
