Univariate.histogram = (function($) {
	var module = {},
		$div,
		$rangeSelector,
		$graph,
		data = [],
		histData = [],
		graph;

	module.init = function(renderTo, dataCopy) {
		module.reset();

		$div = renderTo;
		$rangeSelector = $div.find(".ui.range");
		$graph = $div.find(".chart");
		graph = $graph.get(0);
		data = dataCopy;

		graph = new Highcharts.Chart({
			chart: {
				renderTo: graph,
				type: 'column',
				style: {
					fontFamily: 'Lato'
				}
			},
			colors: ['#3198f7'],
			title: {
				text: ''
			},
			xAxis: {
				gridLineWidth: 1
			},
			yAxis: [{
				title: {
					text: 'Histogram Count'
				}
			}],
			series: [{
				name: 'Histogram',
				type: 'column',
				data: histData,
				pointPadding: 0,
				groupPadding: 0,
				pointPlacement: 'between'
			}],
			credits: {
			  enabled: false
			},
			legend: {
			  enabled: false
			},
			tooltip: {
				formatter: function() {
					return 'Histogram Count: <b>' + this.y + '</b>';
				}
			}
		});

		module.render(0);
	};

	module.render = function(numBins) {
		// need to suggest number of bins
		if(numBins == 0) {
			numBins = d3.thresholdFreedmanDiaconis(
				data, 
				d3.min(data), 
				d3.max(data)
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
				grid: false,
				onFinish: function(data) {
					module.render(data.from);
				}
			});
		}

		var min = d3.min(data);
		var max = d3.max(data);
		var ticks = d3.ticks(min, max, numBins);
		var tickInterval = d3.tickStep(min, max, numBins);

		ticks.splice(0, 0, ticks[0] - tickInterval);

		$rangeSelector.data("ionRangeSlider").update({
			from: ticks.length
		});
		
		histData = ticks.map(function(tickValue, ix) {
			return [ticks[ix], data.filter(function(val) {
				return (val >= ticks[ix] && val < ticks[ix] + tickInterval)
			}).length];
		});

		graph.series[0].update({
			data: histData
		});
	};

	module.reset = function() {
		// if init has not been run, do nothing
		if(!$div) return;

		data = {};
		$graph.html("");
	};

	return module;

}(jQuery));