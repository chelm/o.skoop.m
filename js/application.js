var App = function(){
  var self = this;

  this.width = document.getElementById("map").clientWidth;
  this.height = window.screen.height / 1.8;
  
  this.initMap();

}

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

  d3.json("data/us.json", function(error, us) {
    console.log('us', us);
    self.g.append("g")
        .attr("id", "states")
      .selectAll("path")
        .data(topojson.feature(us, us.objects.us).features)
      .enter().append("path")
        .attr("d", self.path)
        .on("click", function(d) {
          self._mapClicked(d)
        });

    self.g.append("path")
        .datum(topojson.mesh(us, us.objects.us, function(a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", self.path);
  });

  d3.json("data/us-counties.json", function(error, us) {
    
    self.g.append("g")
      .attr("id", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.UScounties).features)
    .enter().append("path")
      .attr('class', 'county-hidden')
      .attr("d", self.path)
  });

};

App.prototype._mapClicked = function(d) {
  var self = this;

  var x, y, k;

  if (d && this.centered !== d) {
    var centroid = self.path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    this.centered = d;
  } else {
    x = self.width / 2;
    y = self.height / 2;
    k = 1;
    this.centered = null;
  }

  self.g.selectAll("path")
      .classed("active", self.centered && function(d) { return d === self.centered; });

  self.g.transition()
      .duration(750)
      .attr("transform", "translate(" + self.width / 2 + "," + self.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px")
      .each("end", function() {
        self._showCounties(d);
      });
}

App.prototype._showCounties = function(state) {
  var self = this;

  
  d3.selectAll('.county')
    .attr('class', 'county-hidden');
  
  d3.selectAll('.county-hidden')
    .attr('class', function(d) {
      if (state.properties.NAME10 === d.properties.STATE_NAME) {
        return "county";
      } else {
        return "county-hidden";
      }
    });
  
}