(function( exports ){
  var KoopOSM = function(host, d3){

    var stateCounts = function(type, where, callback){
      d3.json(host+'/osm/'+type+'/state/count', function(err, data){
        callback(err, data);
      });
    };

    var countyCounts = function(type, where, callback){
      d3.json(host+'/osm/'+type+'/county/count', function(err, data){
        callback(err, data);
      });
    };

    var koop = {
      host: host,
      stateCounts: stateCounts,
      countyCounts: countyCounts
    };

    return koop;

  }

  exports.KoopOSM = KoopOSM;

})(typeof module === "undefined" ? this : module.exports);
