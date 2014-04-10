var App = function(){
  var self = this;

  this.width = document.getElementById("map").clientWidth;
  this.height = window.innerHeight;

  this.dataType = 'points';
  this.zlevel = 'nation';

  this.filters = {};

  this.kooposm = KoopOSM('http://koop-load-balancer-1909547375.us-east-1.elb.amazonaws.com', d3);
  //this.kooposm = KoopOSM('http://54.197.196.9', d3);
  
  this.initMap();
  this.bindUI(); 
  this._updateFields();
}

App.prototype.bindUI = function() {
  var self = this;

  d3.select('#data-type-select').on('change', function(){
    self.dataType = this.value;
    if (!self.state){
      self._totalCountByState();
    } else if (!self.county) {
      self._totalCountByCountyByState();
    }

    if ( this.field ){
      self._showFilters();
    }
  });

  d3.select('#attr-select').on('change', function(){
    self.field = this.value;
    self._showFilters();
  });

};

App.prototype.initMap = function() {
  var self = this;
  
  this.centered = '';

  this.projection = d3.geo.albersUsa()
      .scale(1070)
      .translate([self.width / 2, self.height / 2]);

  this.path = d3.geo.path()
      .projection( self.projection );

  this.svg = d3.select("#map").append("svg")
      .attr("width", self.width)
      .attr("height", self.height);

  this.svg.append("rect")
      .attr("class", "background")
      .attr("width", self.width)
      .attr("height", self.height)
      .on("click", function(d) {
        self._mapClicked(d)
      });

  this.g = this.svg.append("g");

  //Add states, and set default style on map load 
  d3.json("data/us.json", function(error, us) {
    console.log('us', us);
    self.g.append("g")
        .attr("id", "states")
      .selectAll("path")
        .data(topojson.feature(us, us.objects.us).features)
      .enter().append("path")
        .attr('class', 'state')
        .attr("d", self.path)
        .on("click", function(d) {
          self._mapClicked(d)
        });

    self.g.append("path")
        .datum(topojson.mesh(us, us.objects.us, function(a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", self.path);

    self._totalCountByState();

  });

  //Add counties, but keep them hidden by default
  d3.json("data/us-counties.json", function(error, us) {
    
    self.g.append("g")
      .attr("id", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.UScounties).features)
    .enter().append("path")
      .attr('class', 'county-hidden')
      .attr("d", self.path);

  });

};


/*
* Handle map zoom and animation
* Fire "Show Counties"
* TODO: logic for zipcodes
*
*/
App.prototype._mapClicked = function(d, county) {
  var self = this;

  var x, y, k;
  
  if (d && this.centered !== d && !county) {
    var centroid = self.path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    this.centered = d;
  } else if (d && county && this.centered !== d) {
    var centroid = self.path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 13;
    this.centered = d;
  } else {
    x = self.width / 2;
    y = self.height / 2;
    k = 1;
    this.centered = null;
    d3.selectAll('.county')
      .attr('class', 'county-hidden');
    county = null;
  }

  //console.log('k', k);

  self.g.selectAll("path")
      .classed("active", self.centered && function(d) { return d === self.centered; });

  self.g.transition()
      .duration(250)
      .attr("transform", "translate(" + self.width / 2 + "," + self.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px")
      .each("end", function() {
        if ( county ) {
          self._showCounty(d);
        } else {
          self._showCounties(d);
        }

      });

  if (self.centered){
    self.state = self.centered.properties.STATE_NAME || self.centered.properties.NAME10;
    self.county = self.centered.properties.NAME;
  } else {
    self.state = null, self.county = null;
  }

  self.removeCrumb('state');
  self.removeCrumb('county');

  if (self.state){
    self.addCrumb(self.state, 'state');
  }
  if (self.county){
    self.addCrumb(self.county, 'county');
  }
}



/*
* On state select, show counties within state
*
*
*/
App.prototype._showCounties = function(state) {
  var self = this;

  
  d3.selectAll('.county')
    .attr('class', 'county-hidden');
  
  d3.select("#geographic-extent").html(state.properties.NAME10);
  d3.select('#total-feature-count').html( 0 );

  d3.selectAll('.county-hidden')
    .attr('class', function(d) {
      if (state.properties.NAME10 === d.properties.STATE_NAME) {
        return "county";
      } else {
        return "county-hidden";
      }
    })
    .on("click", function(d) {
      self._mapClicked(d, true)
    });

  
  self._totalCountByCountyByState( state );
}


/*
* Show single selected county
*
*
*/
App.prototype._showCounty = function(county) {
  var self = this;

  //d3.selectAll('.county')
//    .attr('class', 'county-hidden');

  d3.selectAll('.county-hidden')
    .on("click", function(d) {
      self._mapClicked(d, true)
    });

  d3.select("#geographic-extent").html(county.properties.NAME + " County");

}




/*
* Default map style
* Total count by state
*
*/
App.prototype._totalCountByState = function() {
  var self = this;

  var quantize = d3.scale.quantize()
    .domain([0, 0])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

  this.kooposm.stateCounts(this.dataType, this.filters, function(err, data){ 
    
    //need to know domain 
    var min = null, max = null, totalCount = 0;
    data.forEach(function(st,i) {
      if ( !max || st.count >= max ) max = st.count;
      if ( !min || st.count <= min ) min = st.count;
      quantize.domain([min, max]);
      totalCount += st.count;
    });

    console.log('MINMAX', min, max, self.dataType, d3.selectAll('.state'));

    d3.selectAll('.state')
      .attr('class', function(d) {
        var count = 0;
        
        data.forEach(function(st,i) {
          if ( d.properties.NAME10 === st.state ) {
            if (self.dataType == 'lines') console.log(st)
            d.properties.count = st.count;
            count = st.count;
          }
        });
        totalCount += count;

        //for now not all states have count, but we still want to color them
        //if ( count === 0 ) {
        //  return "state"
        //} else {
          console.log(quantize( count ))
          return 'state ' + quantize( count );
        //}

      })
      .on('mouseenter', function(d) {
        var mouse = d3.mouse(this);
        var state = d.properties.NAME10;
        var count = d.properties.count.toLocaleString();
        var content = '<span id="info-title">'+state+'</span><br /><span>Total '+self.dataType+': '+count+'</span>';
        d3.select('#infowin').style({'display': 'block', 'left': mouse[0]+50+'px', 'top': mouse[1]-60+'px'}).html( content );
      })
      .on('mouseexit', function() {
        d3.select('#infowin').style({'display':'none'});
      });

    document.getElementById('dash').style.display = "block";
    //d3.select("#selection").html("Total Data Count");
    //d3.select("#geographic-extent").html("United States");
    self.removeCrumb('state');
    self.removeCrumb('county');
    d3.select('#total-feature-count').html( totalCount.toLocaleString() + ' ' + self.dataType );

    console.log('TOTAL COUNT DOMAIN: ', quantize.domain());
  });

}

/* 
*
*/
App.prototype.addCrumb = function( id, type ) {
  d3.select('li.' + type + 'crumb').remove();
  d3.select('.breadcrumb' )
    .append('li')
      .attr('class', type+'crumb')
    .append('a')
      .attr('id', id)
      .text(id);
};

/* 
*
*/
App.prototype.removeCrumb = function( type ) {
  d3.select('.breadcrumb li.'+type+'crumb' ).remove();
};

/* 
*
*/
App.prototype._updateFields = function() {

  var el = d3.select('#attr-select');
  this.kooposm.fields(this.dataType, function(err, fields){
    fields.forEach(function(field, i){
      el.append('option')
        .attr('value', field )
        .text( field );
    });
  })

};



App.prototype._showFilters = function() {
  var self = this;
  d3.selectAll('.filter').remove();
  var el = d3.select('#value-select');

  this.kooposm.distinct(this.dataType, this.field, function(err, values){
    
    values.sort().forEach(function(val, i){
      el.append('li')
        .attr('id', val )
        .attr('class', 'filter list-group-item')
        .text( val );
    });
    d3.selectAll('.filter').on('click', function(){
      
      if (!self.filters[self.field]) self.filters[self.field] = {};
      self.filters[self.field][this.id] = true;
      self.reloadMap();
    });
  });
};


App.prototype.reloadMap = function(){
  if (this.state && this.county){
  
  } else if (this.state && !this.county){
    this._totalCountByCountyByState(this.state);
  } else {
    this._totalCountByState();
  }
};

/* 
* Style selected state counties by TOTAL count (generic)
*
*
*/ 
App.prototype._totalCountByCountyByState = function( ) {
  var self = this;
  //var name = state.properties.NAME10;
  
  var quantize = d3.scale.quantize()
    .domain([0, 0])
    .range(d3.range(9).map(function(i) { return "b" + i + "-9"; }));


  this.kooposm.countyCounts(this.dataType,{},function(err, data) {

    //need to know domain and populate selected counties array
    var min = null, max = null, totalCount = 0, selectedCounties = [];

    data.forEach(function(rec, i) {
      
      if ( rec.state === self.state ) {
        if ( !max || rec.count >= max ) max = rec.count;
        if ( !min || rec.count <= min ) min = rec.count;
        quantize.domain([min, max]);

        selectedCounties.push(rec);
      }

    });

    d3.selectAll('.county')
      .attr('class', function(d) {
        var count = 0;
        
        selectedCounties.forEach(function(c,i) {
          
          if ( d.properties.NAME === c.county ) {
            count = c.count;
            d.properties.count = c.count;
          }

        });

        totalCount += count;

        //console.log('quantize( count )', quantize( count ))
        var style = "county " + quantize( count )
        return style;

      })
      .on('mouseenter', function(d) {
        var mouse = d3.mouse(this);
        var state = d.properties.NAME;
        var count = d.properties.count.toLocaleString();
        var content = '<span id="info-title">'+state+'</span><br /><span>Total '+self.dataType+': '+count+'</span>';
        d3.select('#infowin').style({'display': 'block', 'left': mouse[0]+50+'px', 'top': mouse[1]-60+'px'}).html( content );
      })
      .on('mouseexit', function() {
        d3.select('#infowin').style({'display':'none'});
      });

    d3.select('#total-feature-count').html( totalCount.toLocaleString() );

  });

};

App.prototype.buildQueryString = function(){
  console.log('filters', this.state, this.county);
}; 

