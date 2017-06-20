(function($) {

	var Areaplot = function(renderTo, namesCopy, dataCopy, typesCopy) {
	
		var module = this,
			$div,
			$rangeSelector,
			$graph,
			data = [],
			names = [],
			types = [],
			histData = [];

		module.init = function(renderTo, namesCopy, dataCopy, typesCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.compare.areaplot", module);
			$rangeSelector = $div.find(".ui.range");
			$graph = $div.find(".chart");
			names = namesCopy;
			data = dataCopy;
			types = typesCopy;

			module.reset();

			var series = data.map(function(_, ix) {
				return {
					name: names[ix],
					type: 'areaspline',
					data: []
				};
			});

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
					type: 'areaspline',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: (function () {
					var colors = [],
						base = '#3198f7',
						i,
						len = names.length;

					for (i = 0; i < len; i += 1) {
						colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
					}
					
					return colors;
				}()),
				title: {
					text: ''
				},
				xAxis: {
					gridLineWidth: 1
				},
				yAxis: [{
					title: {
						text: 'Percentage (%)'
					}
				}],
				plotOptions: {
					areaspline: {
						marker: {
				            enabled: false
				        }
					}
				},
				series: series,
				credits: {
				  enabled: false
				},
				tooltip: {
					formatter: function() {
						return '<b>' + this.series.name + '</b><br/> Percentage: <b>' + this.y + '%</b>';
					}
				}
			});

			data.forEach(function(_, ix) {
				module.render(0, ix);
			});
		};

		module.render = function(numBins, ix) {
			var dataToShow = data[ix];

			// need to suggest number of bins
			if(numBins == 0) {
				numBins = d3.thresholdFreedmanDiaconis(
					dataToShow, 
					d3.min(dataToShow), 
					d3.max(dataToShow)
				);
				if(numBins < 2) numBins = 2;
				else if(numBins > 20) numBins = 20;
			
				$rangeSelector.ionRangeSlider({
					min: 2,
					max: 20,
					from: numBins,
					step: 1,
					postfix: ' bins',
					max_postfix: "+",
					grid: false
				});

				$rangeSelector.data("ionRangeSlider").update({
					onFinish: function(sliderData) {
						data.forEach(function(_, ix) {
							module.render(sliderData.from, ix);
						});
					}
				});
			}

			var min = d3.min(dataToShow);
			var max = d3.max(dataToShow);
			var ticks = d3.ticks(min, max, numBins);
			var tickInterval = d3.tickStep(min, max, numBins);

			ticks.splice(0, 0, ticks[0] - tickInterval);
			ticks.splice(0, 0, ticks[0] - 2 * tickInterval);
			ticks.push(ticks[ticks.length - 1] + tickInterval);
			
			histData = ticks.map(function(tickValue, ix) {
				tickValue += tickInterval / 2;
				var count = dataToShow.filter(function(val) {
					return (val >= ticks[ix] && val < ticks[ix] + tickInterval);
				}).length;
				count = count / dataToShow.length * 100;
				count = parseFloat(count.toFixed(2));
				return [tickValue, count];
			});

			var graph = $graph.highcharts();
			graph.series[ix].update({
				data: histData
			});
		};

		module.update = function() {
			var numBins = $rangeSelector.data("ionRangeSlider").old_from;
			data.forEach(function(_, ix) {
				module.render(numBins, ix);
			});
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, namesCopy, dataCopy, typesCopy);
	};

	$.fn.dashboard_compare_areaplot = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.compare.areaplot") !== undefined) {
        			$.data($(this)[0], "dashboard.compare.areaplot")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Areaplot, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));