Bivariate.scatterplot = (function($) {
	var module = {},
		$div,
		$graph,
		$checkbox,
		$regDropdown,
		graph,
		graphData = [],
		names = [],
		data = [],
		regType = null,
		regEquation = "";

	module.init = function(renderTo, seriesNames, dataCopy) {
		module.reset();
		
		$div = renderTo;
		names = seriesNames;
		data = dataCopy;

		$graph = $div.find('.chart.image');
		$checkbox = $div.find('.fitted.toggle.checkbox');
		$regDropdown = $div.find('.ui.dropdown');

		$regDropdown = $regDropdown.dropdown();

		graphData = data[0].map(function(val, ix) {
			return [data[0][ix], data[1][ix]];
		});

		graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'scatter',
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
			plotOptions: {
				scatter: {
					tooltip: {
						headerFormat: '<b>Data Point</b><br>',
						pointFormat: names[0] + ': <b>{point.x}</b>'
							+ '<br>'
							+ names[1] + ': <b>{point.y}</b>'
					}
				},
				line: {
					tooltip: {
						headerFormat: '<b>Regression Line</b><br>',
						pointFormat: 'Equation: ' + regEquation
					}
				}
			},
			series: [{
				name: 'Data',
				type: 'scatter',
				data: graphData
			}, {
				name: 'Regression Line',
				type: 'line',
				data: []
			}],
			credits: {
			  enabled: false
			},
			legend: {
			  enabled: false
			}
		});

		module.updateChart();

		$checkbox.checkbox({
			onChecked: function() {
				$regDropdown.removeClass("hidden");
				regType = $regDropdown.dropdown("get value");
				module.updateChart();
			},
			onUnchecked: function() {
				$regDropdown.addClass("hidden");
				regType = null;
				module.updateChart();
			}
		});

		$div.find(".ui.dropdown").dropdown("setting", "onChange", function() {
			regType = $regDropdown.dropdown("get value");
			module.updateChart();
		});
	};

	module.updateChart = function() {
		var newSeries = [];
		if(regType != null) {
			$regDropdown.removeClass("hidden");
			var regResult = {};
			if(regType != "polynomial") {
				regResult = regression(regType, graphData);
			}
			else {
				regResult = regression(regType, graphData, 2);
			}
			regEquation = regResult.string;
			newSeries = regResult.points
				.sort(function (a,b) {
					return a[0] - b[0];
				})
				.filter(function (val, ix, arr) {
					return (ix == 0 || arr[ix-1][0] != val[0]);
			});
		}
		else {
			$regDropdown.addClass("hidden");
		}
		graph.series[1].update({
			data: newSeries,
			tooltip: {
				headerFormat: '<b>Regression Line</b><br>',
				pointFormat: 'Equation: ' + regEquation
			},
			color: 'rgba(0,0,0,0.7)'
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