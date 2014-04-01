
(function() {
  d3.geo.acmp = function() {

    var pick = function (scale, coords) {
      var proj,
        currentProj;

      if (scale <= 1.5) {
        proj = d3.geo.hammer()
           .coefficient(2)
           .precision(0.3)
           .scale(scale * 100)
           .rotate([coords[0],0]);

        currentProj = 'Hammer';

      } else if (scale <= 2.0) {
        proj = d3.geo.hammer()
           .coefficient(2.0 - (scale-1.5) * 2.0)
           .precision(0.3)
           .scale(scale * 100)
           .rotate([coords[0],0]);

        currentProj = 'Modified Hammer';

      } else if (scale <= 6.0) {
        proj = d3.geo.azimuthalEqualArea()
           .scale(scale * 100)
           .precision(0.3)
           .clipAngle(180 - 1e-3)
           .rotate(coords);
  
        currentProj = 'Lambert Azimuthal';

      } else if (scale <= 12) {

        coords = (coords[0] == 0) ? [0.01, 0.01] : coords;
        proj = d3.geo.albers()
            .rotate([coords[0], 0])
            .center([0, -coords[1]])
            .parallels([ -coords[1] - scale, -coords[1] + scale])
            .scale(scale * 100)
            .translate([width / 2, height / 2])
            .precision(.1);
    
         currentProj = 'Albers';

      } else {
        proj = d3.geo.mercator()
           .scale(scale * 95)
           .translate([width / 2, height / 2])
           .rotate([coords[0],0])
           .center([0, -coords[1]]);
        
        currentProj = 'Mercator';
      }
        
      return { projection: proj, name: currentProj };
    }


    return {
      pick: pick
    }
  }
})();
