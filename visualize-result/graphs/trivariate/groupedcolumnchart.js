Trivariate.groupedcolumnchart = (function($) {
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
		classes[2].forEach(function (item2, groupIx) {
			graphData.push({
				name: item2,  
				data: classes[0].map(function (item1) {
					return d3.mean(
						data[1]
							.filter(function (_, xValue) {
								return (data[0][xValue] == item1
								 && data[2][xValue] == item2);
							})
					) || 0;
				})
			});
		});

		console.log(graphData);

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
					len = classes[2].length;

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
					text: 'Average ' + names[1]
				}
			},
			plotOptions: {
				column: {
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
					return names[0] + ': <b>' + this.key + '</b><br/>'
						+ 'Average ' + names[1] + ': <b>' + this.y.toFixed(2) + '</b><br/>'
						+ names[2] + ': <b>' + this.series.name + '</b>';
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