Multivariate.parallelcoordinate = (function($) {
	var module = {},
		$div,
		$graph,
		dimensions = [],
		data = [],
		renderer = null,
		currentWidth = 0,
		resizeTimeout = false,
		rtime,
		actives = {};

	module.init = function(renderTo, seriesNames, dataCopy) {
		module.reset();

		$div = renderTo;
		dimensions = seriesNames;
		data = d3.transpose(dataCopy);

		$graph = $div.find('.chart.image');

		module.render();

		$graph.resize(function() {
			var divWidth = $graph.width();
			var delta = 120;
			function checkResizeEnd() {
	        	if (new Date() - rtime < delta) {
			        setTimeout(checkResizeEnd, delta);
			    } else {
			        resizeTimeout = false;
			        module.render();
			    }  
			}
			rtime = new Date();
			if (divWidth != 0 && divWidth != currentWidth && resizeTimeout === false) {
		        resizeTimeout = true;
		        currentWidth = divWidth;
		        setTimeout(checkResizeEnd, delta);
		    }
		});

		$graph.trigger('resize');
	};

	// Code adapted from https://bl.ocks.org/jasondavies/1341281
	module.render = function() {
		$graph.html("");

		var margin = {top: 30, right: 10, bottom: 10, left: 10},
			width = $graph.width() - margin.left - margin.right,
			height = 400 - margin.top - margin.bottom;

		var x = d3.scalePoint().domain(dimensions).range([0, width]).padding(0.5),
			y = {},
			dragging = {};

		dimensions.forEach(function(item, ix) {
			y[item] = d3.scaleLinear()
				.domain(d3.extent(data, function(p) { return +p[ix]; }))
				.range([height, 0]);
		});

		var line = d3.line(),
			axis = d3.axisLeft(),
			background,
			foreground;

		var svg = d3.select($graph.get(0)).append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// Add grey background lines for context.
		background = svg.append("g")
			.attr("class", "background")
		  .selectAll("path")
			.data(data)
		  .enter().append("path")
			.attr("d", path);  

		// Add blue foreground lines for focus.
		foregroundWrapper = svg.append("g")
					.attr("class", "foreground");
		renderer = renderQueue(function(item) {
			foregroundWrapper.append("path")
						.attr("d", path(item))
						.attr("display", calcDisplay(item));
			foreground = foregroundWrapper.selectAll("path");
		}).clear(function() {
			foregroundWrapper.selectAll("*").remove();
		}).rate(1000);
		renderer(data);

		// Add a group element for each dimension.
		var g = svg.selectAll(".dimension")
			.data(dimensions)
		  .enter().append("g")
			.attr("class", "dimension")
			.attr("transform", function(d) { return "translate(" + x(d) + ")"; });

		// Add an axis and title.
		g.append("g")
		  .attr("class", "axis")
		  .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
		.append("text")
		  .style("text-anchor", "middle")
		  .attr("y", -9)
		  .html(function(d) { return '<tspan>' + d + '</tspan>'; })
		  .style("font-size", "12px")
		  .style("font-family", "'Lato', sans-serif");

		// Add and store a brush for each axis.
		g.append("g")
			.attr("class", "brush")
			.each(function(d) {
				d3.select(this).call(y[d].brush = d3.brushY()
					.extent([[-10,0], [10,height]])
					.on("start", brushStart)
					.on("brush", brush)
					.on("end", brushEnd));
			})
		.selectAll("rect")
			.attr("x", -8)
			.attr("width", 16);

		function position(d) {
			var v = dragging[d];
			return v == null ? x(d) : v;
		}

		function transition(g) {
			return g.transition().duration(500);
		}

		// Returns the path for a given data point.
		function path(d) {
			return line(dimensions.map(function(p, ix) { return [position(p), y[p](d[ix])]; }));
		}
		
		function calcDisplay(d) {
			var count = 0;
			Object.keys(actives).forEach(function(p) {
				var ix = dimensions.indexOf(p);
				if(!(actives[p][0] <= y[p](d[ix]) && y[p](d[ix]) <= actives[p][1])) {
					count++;
				}
			});
			return (count == 0) ? null : "none";
		}

		function brushStart() {
			d3.event.sourceEvent.stopPropagation();
		}

		// Handles a brush event, toggling the display of foreground lines.
		function brush() {
			actives = {};
			svg.selectAll(".brush")
				.filter(function(p) { return d3.brushSelection(this); })
				.each(function(p) { actives[p] = d3.brushSelection(this); });
			renderer(data);
		}

		// Update render if the brush event clears a brush
		function brushEnd() {
			newActives = {};
			svg.selectAll(".brush")
				.filter(function(p) { return d3.brushSelection(this); })
				.each(function(p) { newActives[p] = d3.brushSelection(this); });
			// compares the previous and current applied brushes count
			if(Object.keys(actives).length != Object.keys(newActives).length) {
				actives = newActives;
				renderer(data);
			}
		}
	};

	module.reset = function() {
		// if init has not been run, do nothing
		if(!$div) return;

		data = [];
		renderer.invalidate();
		currentWidth = 0;
		$graph.html("");
	};

	return module;
	
}(jQuery));