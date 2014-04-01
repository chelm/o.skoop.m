var App = function(){
  var self = this;

  this.width = document.getElementById("map").clientWidth;
  this.height = window.screen.height;
  
  this.initMap();

}

App.prototype.initMap = function() {
  var scale = 1,
      currentProj;

  var rotate = [0,0];

  var acmp = d3.geo.acmp();

  var projection = acmp.pick(1, [0,0], this.width, this.height);

  var path = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();

  var m0,
      o0;

  this.zoom = d3.behavior.zoom()
      .center([self.width / 2, self.height / 2])
      .on("zoomstart", function(){
        m0 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
        if (currentProj == "albers") {
          var proj = projection.rotate(),
              cent = projection.center();
          o0 = [-proj[0], cent[1]];
        } else {
          var proj = projection.rotate();
          o0 = [-proj[0],-proj[1]];
        }
        d3.event.sourceEvent.stopPropagation();
      })
      .on("zoom", function() {
        if (m0) {
          var constant = (scale < 4) ? 4 : scale * 2;
          var m1 = [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY],
              o1 = [o0[0] + (m0[0] - m1[0]) / constant, o0[1] + (m1[1] - m0[1]) / constant];
        }

        rotate = [-o1[0], -o1[1]];
        scale = (d3.event.scale >= 1) ? d3.event.scale : 1;
        projection = acmp.pick(scale, rotate, self.width, self.height);
        d3.selectAll("path").attr("d", path.projection(projection));

      });

  var svg = d3.select("#map").append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .call(this.zoom);
      
  svg.append("defs").append("path")
      .datum({type: "Sphere"})
      .attr("id", "sphere")
      .attr("d", path);

  svg.append("use")
      .attr("class", "stroke")
      .attr("xlink:href", "#sphere");

  svg.append("use")
      .attr("class", "fill")
      .attr("xlink:href", "#sphere");

  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

  d3.json("countries_1e5.json", function(error, data) {
    svg.insert("path", ".graticule")
        .datum(topojson.feature(data, data.objects.countries))
        .attr("class", "land")
        .attr("d", path);

    d3.select("body").append("text")
      .attr("id", "info");
    d3.select("body").append("text")
      .attr("id", "proj");
  });
}