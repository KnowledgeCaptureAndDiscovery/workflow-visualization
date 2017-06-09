(function($) {

	var Heatmap = function(renderTo, seriesNames, dataCopy) {

		var module = this,
			$div,
			$graph,
			$rangeSelectors = [],
			graph,
			heatmapData = [],
			names = [],
			data = [],
			numBins = null;

		module.init = function(renderTo, seriesNames, dataCopy) {		
			$div = renderTo;
			$.data($div[0], "dashboard.bivariate.heatmap", module);
			names = seriesNames;
			data = dataCopy;

			$graph = $div.find('.chart.image');
			$div.find(".ui.range").each(function() {
				$rangeSelectors.push($(this));
			});

			module.reset();

			module.render();
		};

		module.setNumBins = function(ix, val) {
			numBins[ix] = val;
			module.render();
		};

		module.render = function() {
			if(numBins == null) {
				numBins = [20, 20];

				$rangeSelectors.forEach(function($item, ix) {
					$item.ionRangeSlider({
						min: 5,
						max: 80,
						from: numBins[ix],
						step: 1,
						postfix: ' bins',
						max_postfix: "+",
						grid: false,
						onFinish: function(data) {
							// to avoid scope issues, we call something that is not related to scope
							$div.dashboard_bivariate_heatmap("setNumBins", ix, data.from);
						}
					});
				});
			}

			var min = data.map(function(val) { return d3.min(val); });
			var max = data.map(function(val) { return d3.max(val); });
			var ticks = data.map(function(val, ix) { 
				return d3.ticks(min[ix], max[ix], numBins[ix]); 
			});
			var tickIntervals = data.map(function(val, ix) { 
				return d3.tickStep(min[ix], max[ix], numBins[ix]); 
			});

			for(var ix = 0; ix < 2; ix++) {
				ticks[ix].splice(0, 0, ticks[ix][0] - tickIntervals[ix]);
				$rangeSelectors[ix].data("ionRangeSlider").update({
					from: ticks[ix].length
				});
			}

			heatmapData = [];
			for(var ix1 in ticks[0]) {
				for(var ix2 in ticks[1]) {
					heatmapData.push([+ix1+0.5, +ix2+0.5, 0]);
				}
			}
			d3.transpose(data).forEach(function(point) {
				var bin1 = Math.floor((point[0]-ticks[0][0]) / tickIntervals[0]);
				var bin2 = Math.floor((point[1]-ticks[1][0]) / tickIntervals[1]);
				try {
					heatmapData[bin1 * ticks[1].length + bin2][2]++;
				}
				catch(e) {
					console.log(bin1, bin2);
				}
			});

			var countValues = heatmapData
				.map(function(val) { return val[2]; })
				.filter(function(val) { return val != 0; })
				.sort(function(a, b) { return a - b; });
			var upperFence = Math.min(
				d3.max(countValues), 
				d3.quantile(countValues, 0.75) 
					+ 1.5*( 
						d3.quantile(countValues, 0.75) 
						- d3.quantile(countValues, 0.25)
					)
			);
			var whiteColorStop = 1 / upperFence;

			var borderWidth = 0.5;
			if(ticks[0].length >= 40 || ticks[1].length >= 40) {
				borderWidth = 0;
			}

			graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
					type: 'heatmap',
					style: {
						fontFamily: 'Lato'
					},
	        		plotBorderWidth: 1
				},
				title: {
					text: ''
				},
				xAxis: {
					title: {
						text: names[0]
					},
					labels: {
						formatter: function() {
							return (ticks[0][0] + this.value * tickIntervals[0]);
						}
					},
					min: 0.5,
					max: ticks[0].length - 1.5,
					tickmarkPlacement: 'between'
				},
				yAxis: [{
					title: {
						text: names[1]
					},
					labels: {
						formatter: function() {
							return (ticks[1][0] + this.value * tickIntervals[1]);
						}
					},
					min: 0.5,
					max: ticks[1].length - 0.5,
					startOnTick: false,
					endOnTick: false
				}],
				color: ['#3198f7'],
				colorAxis: {
					stops: [
						[0, '#aaaaaa'],
						[whiteColorStop, '#ffffff'],
						[1, Highcharts.Color('#3198f7').brighten(-0.4).get()]
					],
					min: 0,
					max: upperFence
				},
				legend: {
			        align: 'right',
			        layout: 'vertical',
			        margin: 0,
			        verticalAlign: 'middle'
			    },
				series: [{
					name: "Heatmap",
					borderWidth: borderWidth,
					borderColor: '#eeeeee',
					data: heatmapData
				}],
				tooltip: {
					formatter: function() {
						return 'Count: <b>' + this.point.value + '</b>';
					}
				},
				credits: {
				  enabled: false
				}
			});
		}

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy);

	};

	$.fn.dashboard_bivariate_heatmap = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.bivariate.heatmap") !== undefined) {
        			$.data($(this)[0], "dashboard.bivariate.heatmap")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Heatmap, [null, $(this)].concat(args))));
        	}
        });
    };
	
}(jQuery));
