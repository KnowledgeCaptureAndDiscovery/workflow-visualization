Univariate.piechart = (function($) {
	var module = {},
		$div,
		$graph,
		data = [],
		classes;

	module.init = function(renderTo, dataCopy, classesCopy) {
		module.reset();
		
		$div = renderTo;
		data = dataCopy;
		classes = classesCopy;

		$graph = $div.find('.chart.image');

		var graphData = [];
		classes.forEach(function(item) {
			graphData.push({
				name: item,
				y: data.filter(function(val) { return val == item; }).length
			});
		});

		var graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'pie',
				style: {
					fontFamily: 'Lato'
				}
			},
			colors: (function () {
				var colors = [],
					base = '#3198f7',
					i,
					len = graphData.length;

				for (i = 0; i < len; i += 1) {
					colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
				}
				
				return colors;
			}()),
			title: {
				text: ''
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					dataLabels: {
						enabled: false
					},
					showInLegend: true
				}
			},
			series: [{
				name: 'Percentage',
				colorByPoint: true,
				data: graphData
			}],
			credits: {
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