(function($) {

	var Parallelcoordinate = function(renderTo, seriesNames, dataCopy, datatypes) {

		var module = this,
			$div,
			$graph,
			$renderCheckbox,
			renderAllData,
			sampleDataThreshold = 2000,
			dimensions = [],
			data = [],
			types = [],
			sampleData = [],
			renderer = null,
			currentWidth = 0,
			resizeTimeout = false,
			rtime,
			actives = {},
			svg = null,
			x,
			y,
			dragging,
			foreground,
			background,
			foregroundWrapper,
			sec;

		module.init = function(renderTo, seriesNames, dataCopy, datatypes) {
			$div = renderTo;
			$div.data("dashboard.multivariate.parallelcoordinate", module);
			dimensions = seriesNames;
			data = d3.transpose(dataCopy);
			types = datatypes;
			sampleData = data.slice(0, sampleDataThreshold);
			$renderCheckbox = $div.find('.render.fitted.toggle.checkbox');
			$graph = $div.find('.chart.image');

			module.reset();
			module.initCheckbox();
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

		module.initCheckbox = function() {
			if(data.length < sampleDataThreshold) {
				renderAllData = true;
				$renderCheckbox.checkbox("set checked");
				$div.find(".render").addClass("hidden");
				$div.find(".render-detail").addClass("hidden");
			}
			else {
				renderAllData = false;
				$renderCheckbox.checkbox("set unchecked");
				$div.find(".render").removeClass("hidden");
				$div.find(".render-detail").removeClass("hidden");
				$div.find(".render-detail").css("margin-top", "5px");
				$div.find(".render-detail").css("padding-bottom", "0");
			}
			$renderCheckbox.checkbox({
				onChecked: function() {
					renderAllData = true;
					module.render();
				},
				onUnchecked: function() {
					renderAllData = false;
					module.render();
				}
			});
		};

		module.dataToRender = function() {
			return (renderAllData? data: sampleData);
		};

		// Code adapted from https://bl.ocks.org/jasondavies/1341281
		module.render = function() {
			$graph.html("");

			var margin = {top: 30, right: 10, bottom: 10, left: 10},
				width = $graph.width() - margin.left - margin.right,
				height = 400 - margin.top - margin.bottom;

			x = d3.scalePoint().domain(dimensions).range([0, width]).padding(0.5);
			y = {};
			dragging = {};

			dimensions.forEach(function(item, ix) {
				var type = types[ix];
				if(type == "numeric") {
					y[item] = d3.scaleLinear()
						.domain(d3.extent(module.dataToRender(), function(p) { return +p[ix]; }))
						.range([height, 0]);
				}
				else {
					var dataArray = module.dataToRender().map(function(p) { return p[ix]; });
					var uniqueElements = dataArray.reduce(function(values, v) {
						if (!values.set[v]) {
							values.set[v] = 1;
							values.arr.push(v);
						}
						return values;
					}, { set: {}, arr: [] });
					y[item] = d3.scaleOrdinal()
						.domain(uniqueElements.arr)
						.range(uniqueElements.arr.map(function(val, ix) {
							return height * ix / (uniqueElements.arr.length - 1);
						}));
				}
			});

			svg = d3.select($graph.get(0)).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			  .append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			// Add grey background lines for context.
			background = svg.append("g")
				.attr("class", "background")
			  .selectAll("path")
				.data(module.dataToRender())
			  .enter().append("path")
				.attr("d", module.path)
				.style("fill", "none")
				.style("stroke", "#e6e6e6"); 

			// Add blue foreground lines for focus.
			foregroundWrapper = svg.append("g")
						.attr("class", "foreground");
			renderer = renderQueue(function(item) {
				foregroundWrapper.append("path")
							.attr("d", module.path(item))
							.attr("display", module.calcDisplay(item))
							.style("fill", "none")
							.style("stroke", "#3198F7");
				foreground = foregroundWrapper.selectAll("path");
			}).clear(function() {
				foregroundWrapper.selectAll("*").remove();
			}).rate(1000);
			renderer(module.dataToRender());

			// Add a group element for each dimension.
			var g = svg.selectAll(".dimension")
				.data(dimensions)
			  .enter().append("g")
				.attr("class", "dimension")
				.attr("transform", function(d) { return "translate(" + x(d) + ")"; });

			// Add an axis and title.
			g.append("g")
			  .attr("class", "axis")
			  .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
			  .style("fill", "none")
			.append("text")
			  .style("text-anchor", "middle")
			  .attr("y", -9)
			  .html(function(d) { return '<tspan>' + d + '</tspan>'; })
			  .style("font-size", "11px")
			  .style("fill", "#666");

			// Add and store a brush for each axis.
			g.append("g")
				.attr("class", "brush")
				.each(function(d) {
					d3.select(this).call(y[d].brush = d3.brushY()
						.extent([[-10,0], [10,height]])
						.on("start", module.brushStart)
						.on("brush", module.brush)
						.on("end", module.brushEnd));
				})
			.selectAll("rect")
				.attr("x", -8)
				.attr("width", 16);
		};

		module.position = function(d) {
			var v = dragging[d];
			return v == null ? x(d) : v;
		}

		module.transition = function(g) {
			return g.transition().duration(500);
		}

		// Returns the path for a given data point.
		module.path = function(d) {
			var line = d3.line();
			return line(dimensions.map(function(p, ix) {
				return [module.position(p), y[p](d[ix])]; 
			}));
		}
			
		module.calcDisplay = function(d) {
			var count = 0;
			Object.keys(actives).forEach(function(p) {
				var ix = dimensions.indexOf(p);
				if(!(actives[p][0] <= y[p](d[ix]) && y[p](d[ix]) <= actives[p][1])) {
					count++;
				}
			});
			return (count == 0) ? null : "none";
		}

		module.brushStart = function() {
			d3.event.sourceEvent.stopPropagation();
		};

		// Handles a brush event, toggling the display of foreground lines.
		module.brush = function() {
			actives = {};
			svg.selectAll(".brush")
				.filter(function(p) { return d3.brushSelection(this); })
				.each(function(p) { actives[p] = d3.brushSelection(this); });
			renderer(module.dataToRender());
		};

		// Update render if the brush event clears a brush
		module.brushEnd = function() {
			newActives = {};
			svg.selectAll(".brush")
				.filter(function(p) { return d3.brushSelection(this); })
				.each(function(p) { newActives[p] = d3.brushSelection(this); });
			// compares the previous and current applied brushes count
			if(Object.keys(actives).length != Object.keys(newActives).length) {
				actives = newActives;
				renderer(module.dataToRender());
			}
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			if(renderer) renderer.invalidate();
			if(svg) svg = null;
			currentWidth = 0;
			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy, datatypes);

	};
	
	$.fn.dashboard_multivariate_parallelcoordinate = function () {
		var args = Array.prototype.slice.call(arguments);
		return this.each(function () {
			if(typeof args[0] == "string") {
				if($.data($(this), "dashboard.multivariate.parallelcoordinate") !== undefined) {
					$.data($(this), "dashboard.multivariate.parallelcoordinate")[args[0]].apply(null, args.slice(1));
				}
			}
			else {
				(new (Function.prototype.bind.apply(Parallelcoordinate, [null, $(this)].concat(args))));
			}
		});
	};
	
}(jQuery));