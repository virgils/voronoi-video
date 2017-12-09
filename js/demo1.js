var voronoi =  new Voronoi(), 
    sites = [], // All of the points
    bounds,
    canvasWidth = 960,
    canvasHeight = 540,
    canvasArray= [],
    contextArray= [],
    modToggle = 0;

// DOM selectors
var canvasCellsContainer = document.querySelectorAll('#container-cells'),
    v = document.getElementById('video'),
    canvasSource = document.getElementById('voronoiCanvas'),
    ctx = canvasSource.getContext('2d', {alpha: false}),
    canvasCells;

// Blur background variables
var copy = document.getElementById('copy'),
    copy_ctx = copy.getContext('2d', {alpha: false}),
    copyBlur = document.getElementById('copy_blur'),
    copyBlur_ctx = copyBlur.getContext('2d', {alpha: false}),
    blurred = document.getElementById('blurred-1'),
    blurred_ctx = blurred.getContext('2d', {alpha: false}),
    blurWidth, blurHeight;

// Creates the voronoi cells and updates with video display
var VoronoiRenderer = {
  speed: 1, // Speed of the cells morphing
  amount: 6, // Number of sites

  // Start or restart
  build: function() {
    // Fill the screen with canvas
    canvasSource.width = canvasSource.offsetWidth;
    canvasSource.height = canvasSource.offsetHeight;

    // Make sure we tell the voronoi
    bounds = {
      xl: 0,
      xr: canvasSource.width,
      yt: 0,
      yb: canvasSource.height
    };

    // Starting positions
    this.generatePoints(this.amount);

    // Blurs
    blurWidth = 400;
    blurHeight = 300; 

    blurred.width = blurWidth;
    blurred.height = blurHeight;
    copy.width = 200;
    copyBlur.width = 200;
    copy.height = 150;
    copyBlur.height = 150;
  },

  // Randomly throw up points for the cells to start from
  generatePoints: function(n) {
    for (var i = 0; i < n; i += 1) {

      var canv = document.createElement('canvas');
      canv.width = canvasWidth;
      canv.height = canvasHeight;

      // Append to DOM
      document.body.appendChild(canv);
      document.getElementById('container-cells').appendChild(canv); 

      // Push to array
      canvasArray.push(canv);
      contextArray.push(canv.getContext('2d', {alpha: false}));

      // Initial values for sites
      sites.push({
        // Random position on the canvas
        x: Math.random() * canvasSource.width,
        y: Math.random() * canvasSource.height,
        // Random direction in dx, dy (pixels per iteration)
        dx: (Math.random() - 0.5) * this.speed,
        dy: (Math.random() - 0.5) * this.speed
      });
    }

    canvasCells = document.querySelectorAll('#container-cells canvas');
  },

  // Iteration, updates positions and draws
  render: function() {
    if (modToggle++ % 4 === 0) {
      VoronoiRenderer.updateSites();

      var diagram = voronoi.compute(sites, bounds),
          site,
          cell,
          halfedges,
          length;

      // Catch
      if (!diagram) {
        return;
      }

      // Get all the pretty shapes
      for (var i = 0; i < VoronoiRenderer.amount; i += 1) {
        site = sites[i];
        cell = diagram.cells[site.voronoiId];

        halfedges = cell.halfedges;
        length = halfedges.length;

        // Fewer than three points connected? Won't be visible
        if (length <= 2) {
          continue;
        }
      }

      VoronoiRenderer.updateCells();
      VoronoiRenderer.updateBlur();
    }

    // Go to the next frame
    window.requestAnimationFrame(VoronoiRenderer.render);
  },

  // Move the sites and bounce off the walls
  updateSites: function() {
    var n = sites.length,
        site;

    for (var i = 0; i < n; i += 1) {
      site = sites[i];

      site.x += site.dx;
      site.y += site.dy;

      // Stepping out of line?
      if (site.x > bounds.xr || site.x < 0) {
        // Turn around
        site.dx *= -1;
        site.x += site.dx;
      }

      // Stepping out of line?
      if (site.y > bounds.yb || site.y < 0) {
        // Turn around
        site.dy *= -1;
        site.y += site.dy;
      }
    }
  },

  // Masking each canvas with its respective voronoi cell
  updateCells: function() {
    var canvas, ctx, diagram, cell, found, v;

    for (var j=0; j<sites.length; j++) {

      ctx = contextArray[j];
      canvasArray[j].width = canvasWidth;
      found = 0;

      // Draw video
      v = document.getElementById('video');
      ctx.drawImage(v,0,0,960,540);
      
      // Compute
      diagram = voronoi.compute(sites, bounds);

      // Find cell
      for (var i=0; i<sites.length; i++) {
        if (!found) {
          cell = diagram.cells[i];

          if (sites[j].voronoiId === cell.site.voronoiId) {
            found = 1;
          }
        }
      }

      // Create mask to only show the current cell
      ctx.globalCompositeOperation = 'destination-in';
      ctx.globalAlpha = 1;

      ctx.beginPath();

      var halfedges = cell.halfedges,
      nHalfedges = halfedges.length,
      v = halfedges[0].getStartpoint();

      ctx.moveTo(v.x,v.y);

      for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
        v = halfedges[iHalfedge].getEndpoint();
        ctx.lineTo(v.x,v.y);
      }

      ctx.fillStyle = sites[j].c;
      ctx.fill();
    }
  },

  // Update the blur background
  updateBlur: function() {
    if (v.paused || v.ended) return false;

    copy_ctx.drawImage(v, 0, 0, 200, 150);
    stackBlurImage('copy', 'copy_blur', 8, 2)

    blurred_ctx.drawImage(copy_blur, 0, 0, blurWidth, blurHeight);
  }

}

// Random integer helper
function randomInt(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

// Remove preload layer and show demo
function removePreloader() {
  document.body.classList.remove('loading');

  // Show cells
  document.getElementById("container-cells").classList.add('show');
}

// Initialize the demo
function init() {
  // Build the canvas and set up cells
  VoronoiRenderer.build();

  // Start animating the cells and masking them
  VoronoiRenderer.render();

  // Give each cell a different rotation
  for (i = 0; i < canvasCells.length; ++i) {
    canvasCells[i].style.transform = 'rotate('+randomInt(-15,15)+'deg)';
  }

  // If video has playing capabilities remove preloader
  v.addEventListener('canplaythrough', function() {
    removePreloader();
  }, false);
  if (v.readyState > 3) {
    removePreloader();
  }

}

// Start demo on window load
window.onload = function() {
  init();
};

