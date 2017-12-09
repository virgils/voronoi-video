var VoronoiDemo = {
	voronoi: new Voronoi(),
	sites: [],
	diagram: null,
	margin: 0.1,
	canvas: null,
	bbox: {xl:0,xr:360,yt:0,yb:640},
	lastCell: undefined,
	treemap: null,

	init: function() {
		this.canvas = document.getElementById('voronoiCanvas');
		this.randomSites(10,true);
		this.render();
		},

	clearSites: function() {
		this.sites = [];
		this.treemap = null;
		this.diagram = this.voronoi.compute(this.sites, this.bbox);
		this.updateStats();
		},

	randomSites: function(n,clear) {
		if (clear) {this.sites = [];}
		// create vertices
		var xmargin = this.canvas.width*this.margin,
			ymargin = this.canvas.height*this.margin,
			xo = xmargin,
			dx = this.canvas.width-xmargin*2,
			yo = ymargin,
			dy = this.canvas.height-ymargin*2;
		for (var i=0; i<n; i++) {
			this.sites.push({x:self.Math.round((xo+self.Math.random()*dx)*10)/10,y:self.Math.round((yo+self.Math.random()*dy)*10)/10});
			}
		this.treemap = null;
		this.diagram = this.voronoi.compute(this.sites, this.bbox);
		this.updateStats();
		},

	recompute: function() {
		this.treemap = null;
		this.diagram = this.voronoi.compute(this.sites, this.bbox);
		this.updateStats();
		},

	updateStats: function() {
		if (!this.diagram) {return;}
		var e = document.getElementById('voronoiStats');
		if (!e) {return;}
		e.innerHTML = '('+this.diagram.cells.length+' Voronoi cells computed from '+this.diagram.cells.length+' Voronoi sites in '+this.diagram.execTime+' ms &ndash; rendering <i>not</i> included)';
		},

	buildTreemap: function() {
		var treemap = new QuadTree({
			x: this.bbox.xl,
			y: this.bbox.yt,
			width: this.bbox.xr-this.bbox.xl,
			height: this.bbox.yb-this.bbox.yt
			});
		var cells = this.diagram.cells,
			iCell = cells.length;
		while (iCell--) {
			bbox = cells[iCell].getBbox();
			bbox.cellid = iCell;
			treemap.insert(bbox);
			}
		return treemap;
		},

	cellUnderMouse: function(ev) {
		if (!this.diagram) {return;}
		var canvas = document.getElementById('voronoiCanvas');
		if (!canvas) {
			return;
			}
		// >>> http://www.quirksmode.org/js/events_properties.html#position
		var x = 0,
			y = 0;
		if (!ev) {
			ev = window.event;
			}
		if (ev.pageX || ev.pageY) {
			x = ev.pageX;
			y = ev.pageY;
			}
		else if (e.clientX || e.clientY) {
			x = ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = ev.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
		// <<< http://www.quirksmode.org/js/events_properties.html#position
		x -= canvas.offsetLeft;
		y -= canvas.offsetTop;
		cellid = this.cellIdFromPoint(x,y);
		if (this.lastCell !== cellid) {
			if (this.lastCell !== undefined) {
				this.renderCell(this.lastCell, '#fff', '#000');
				}
			if (cellid !== undefined) {
				this.renderCell(cellid, '#f00', '#00f');
				}
			this.lastCell = cellid;
			}
		document.getElementById('voronoiCellid').innerHTML = "(" + x + "," + y + ") = " + cellid;
		},

	cellIdFromPoint: function(x, y) {
		// We build the treemap on-demand
		if (this.treemap === null) {
			this.treemap = this.buildTreemap();
			}
		// Get the Voronoi cells from the tree map given x,y
		var items = this.treemap.retrieve({x:x,y:y}),
			iItem = items.length,
			cells = this.diagram.cells,
			cell, cellid;
		while (iItem--) {
			cellid = items[iItem].cellid;
			cell = cells[cellid];
			if (cell.pointIntersection(x,y) > 0) {
				return cellid;
				}
			}
		return undefined;
		},

	renderCell: function(id, fillStyle, strokeStyle) {
		if (id === undefined) {return;}
		if (!this.diagram) {return;}
		var cell = this.diagram.cells[id];
		if (!cell) {return;}
		var ctx = this.canvas.getContext('2d');
		ctx.globalAlpha = 1;
		// edges
		ctx.beginPath();
		var halfedges = cell.halfedges,
			nHalfedges = halfedges.length,
			v = halfedges[0].getStartpoint();
		ctx.moveTo(v.x,v.y);
		for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
			v = halfedges[iHalfedge].getEndpoint();
			ctx.lineTo(v.x,v.y);
			}
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle = strokeStyle;
		ctx.fill();
		ctx.stroke();
		// site
		v = cell.site;
		ctx.fillStyle = '#44f';
		ctx.beginPath();
		ctx.rect(v.x-2/3,v.y-2/3,2,2);
		ctx.fill();
		},

	render: function() {
		var ctx = this.canvas.getContext('2d');
		// background
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.rect(0,0,this.canvas.width,this.canvas.height);
		ctx.fillStyle = 'white';
		ctx.fill();
		ctx.strokeStyle = '#888';
		ctx.stroke();
		// voronoi
		if (!this.diagram) {return;}
		// edges
		ctx.beginPath();
		ctx.strokeStyle = '#000';
		var edges = this.diagram.edges,
			iEdge = edges.length,
			edge, v;
		while (iEdge--) {
			edge = edges[iEdge];
			v = edge.va;
			ctx.moveTo(v.x,v.y);
			v = edge.vb;
			ctx.lineTo(v.x,v.y);
			}
		ctx.stroke();
		// sites
		ctx.beginPath();
		ctx.fillStyle = '#44f';
		var sites = this.sites,
			iSite = sites.length;
		while (iSite--) {
			v = sites[iSite];
			ctx.rect(v.x-2/3,v.y-2/3,2,2);
			}
		ctx.fill();
		},
	};