Bivariate.linechart = (function($) {
	var module = {},
		$div,
		$graph,
		graph,
		graphData = [],
		names = [],
		classes = [],
		data = [];

	module.init = function(renderTo, seriesNames, dataCopy, classesCopy) {
		module.reset();

		$div = renderTo;
		names = seriesNames;
		data = dataCopy;
		classes = classesCopy;

		$graph = $div.find('.chart.image');

		graphData = classes.map(function(item) {
			var values = data[1].filter(function(val, ix) {
				return data[0][ix] == item;
			});
			if(values.length == 0) {
				return 0;
			}
			return d3.mean(values);
		});

		graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'line',
				style: {
					fontFamily: 'Lato'
				}
			},
			colors: ['#3198f7'],
			title: {
				text: ''
			},
			xAxis: {
				categories: classes,
				title: {
					enabled: true,
					text: names[0]
				}
			},
			yAxis: {
				title: {
					text: 'Average ' + names[1]
				}
			},
			series: [{
				name: 'Data',
				type: 'line',
				data: graphData
			}],
			tooltip: {
				formatter: function() {
					return names[0] + ': <b>' + this.x + '</b>'
					+ '<br>'
					+ names[1] + ': <b>' + this.y.toFixed(2) + '</b>'
				}
			},
			credits: {
			  enabled: false
			},
			legend: {
			  enabled: false
			}
		});
	};

	module.reset = function() {
		// if init has not been run, do nothing
		if(!$div) return;

		data = [];
		$graph.html("");
	};

	return module;
	
}(jQuery));