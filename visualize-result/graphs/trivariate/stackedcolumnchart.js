Trivariate.stackedcolumnchart = (function($) {
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

		graphData = [];
		classes[2].forEach(function (item3, ix) {
			classes[1].forEach(function (item2) {
				graphData.push({
					name: item2,  
					data: classes[0].map(function (item1) {
						return data[0].filter(function (val, ix) {
							return (data[0][ix] == item1
							 && data[1][ix] == item2
							 && data[2][ix] == item3);
						}).length;
					}),
					showInLegend: ix == 0, 
					stack: item3,
					stackName: item3
				});
			});
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
					stacking: 'normal',
					events: {
						legendItemClick: function () {
							return false;
						}
					}
				}
			},
			series: graphData,
			tooltip: {
				formatter: function() {
					return names[0] + ': <b>' + this.point.x + '</b><br/>',
						+ names[1] + ': <b>' + this.series.name + '</b><br/>Count: <b>' + this.point.y + '</b> of ' + this.point.stackTotal + '<br/>'
						+ names[2] + ': <b>' + this.series.stackKey.substr(6) + '</b>';
				}
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