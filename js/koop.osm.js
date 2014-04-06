(function( exports ){
  var KoopOSM = function(host, d3){

    var stateCounts = function(type, where, callback){
      console.log('WHERE', where);
      for (key in where){
        
      }
      _count('state', type, where, callback);
    };

    var countyCounts = function(type, where, callback){
      _count('county', type, where, callback);
    };

    // generic count request method
    var _count = function(boundary, type, where, callback){
      var url = host+'/osm/'+type+'/'+boundary+'/count';
      var qs = [];
      for (key in where){
        qs.push(key +"='"+ where[key] + "'");
      }
      if (qs.length){
        url += '?where='+qs.join('&');
      }
      _req(url, callback);
    };

    var _req = function(url, callback){
      d3.json(url, function(err, data){
        callback(err, data);
      });
    }

    var distinct = function(type, field, callback){
      var url = host+'/osm/'+type+"/distinct/"+field
      _req(url, callback);
    };

    var fields = function(type, callback){
      var url = host+'/osm/'+type+"/fields";
      _req(url, callback);
    };

    var koop = {
      host: host,
      stateCounts: stateCounts,
      countyCounts: countyCounts,
      distinct: distinct,
      fields: fields
    };

    return koop;

  }

  exports.KoopOSM = KoopOSM;

})(typeof module === "undefined" ? this : module.exports);
