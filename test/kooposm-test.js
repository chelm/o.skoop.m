var vows   = require('vows');
var assert = require('assert');

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
  }
}).export(module);
