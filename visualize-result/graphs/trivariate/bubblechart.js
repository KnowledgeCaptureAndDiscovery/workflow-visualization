Trivariate.bubblechart = (function($) {
	var module = {},
		$div,
		$graph,
		graph,
		graphData = [],
		names = [],
		data = [];

	module.init = function(renderTo, seriesNames, dataCopy) {
		module.reset();
		
		$div = renderTo;
		names = seriesNames;
		data = dataCopy;

		$graph = $div.find('.chart.image');

		graphData = data[0].map(function(val, ix) {
			return {x: data[0][ix], y: data[1][ix], z: data[2][ix]};
		});

		graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'bubble',
				zoomType: 'xy',
				style: {
					fontFamily: 'Lato'
				}
			},
			colors: ['#3198f7'],
			title: {
				text: ''
			},
			xAxis: {
				gridLineWidth: 1,
				title: {
					enabled: true,
					text: names[0]
				}
			},
			yAxis: {
				title: {
					text: names[1]
				}
			},
			tooltip: {
				headerFormat: '<b>Data Point</b><br>',
				pointFormat: names[0] + ': <b>{point.x}</b>'
					+ '<br/>'
					+ names[1] + ': <b>{point.y}</b>'	
					+ '<br/>'
					+ names[2] + ': <b>{point.z}</b>'	
			},
			series: [{
				data: graphData
			}],
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