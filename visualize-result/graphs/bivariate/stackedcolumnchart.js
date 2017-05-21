Bivariate.stackedcolumnchart = (function($) {
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

		graphData = classes[1].map(function (item2) {
			return {
				name: item2,  
				data: classes[0].map(function (item1) {
					return data[0].filter(function (val, ix) {
						return (data[0][ix] == item1 && data[1][ix] == item2);
					}).length;
				})
			};
		});

		graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'column',
				style: {
					fontFamily: 'Lato'
				}
			},
			title: {
				text: ''
			},
			colors: (function () {
				var colors = [],
					base = '#3198f7',
					i,
					len = classes[1].length;

				for (i = 0; i < len; i += 1) {
					colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
				}
				
				return colors;
			}()),
			xAxis: {
				categories: classes[0],
				title: {
					enabled: true,
					text: names[0]
				}
			},
			yAxis: {
				title: {
					text: 'Total ' + names[1]
				}
			},
			plotOptions: {
				column: {
					stacking: 'normal'
				}
			},
			series: graphData,
			tooltip: {
				headerFormat: names[0] + ': <b>{point.x}</b><br/>',
				pointFormat: names[1] + ': <b>{series.name}</b><br/>Count: <b>{point.y}</b> of {point.stackTotal}'
			},
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