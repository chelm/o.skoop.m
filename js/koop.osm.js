(function( exports ){
  var KoopOSM = function(host, d3){

    var stateCounts = function(type, where, callback){
      var url = host+'/osm/'+type+'/state/count';
      var qs = [];
      for (key in where){
        qs.push(key +"='"+ where[key] + "'");
      }
      if (qs.length){
        url += '?where='+qs.join('&');
      }
      console.log(url);
      d3.json(url, function(err, data){
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
