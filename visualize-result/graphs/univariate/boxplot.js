Univariate.boxplot = (function($) {
	var module = {},
		data = [],
		$div,
		$graph,
		$rows;

	module.init = function(renderTo, dataCopy) {
		module.reset();
		
		$div = renderTo;
		data = dataCopy.sort(function(a,b) { return a-b; });
		$graph = $div.find('.chart.image');
		$rows = $div.find('.table').find('tbody');

		var median = d3.median(data);
		var q1 = d3.quantile(data, 0.25);
		var q3 = d3.quantile(data, 0.75);
		var iqr = q3 - q1;
		var upperFence = Math.min(q3 + 1.5*iqr, d3.max(data));
		var lowerFence = Math.max(q1 - 1.5*iqr, d3.min(data));

		var outliers = data.filter(function(val) {
			return (val < lowerFence || val > upperFence);
		});

		var graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'boxplot',
				style: {
					fontFamily: 'Lato'
				}
			},
			colors: ['#3198f7'],
			title: {
				text: ''
			},
			xAxis: {
				categories: [''],
				gridLineWidth: 1
			},
			yAxis: [{
				title: {
					text: 'Value'
				}
			}],
			series: [{
				name: 'Observations',
				data: [[lowerFence, q1, median, q3, upperFence]]
			}, {
				name: 'Outlier',
				type: 'scatter',
				data: outliers.map(function(val) { return [0, val]; }),
				tooltip: {
					pointFormat: 'Value: {point.y}'
				}
			}],
			credits: {
			  enabled: false
			},
			legend: {
			  enabled: false
			}
		});

		var properties = ['min', 'max', 'mean', 'median', 'variance', 'deviation'];

		properties.forEach(function(name) {
			var value = d3[name](data);
			name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
			$rows.append(
					'<tr><td>'
				+	name
				+	'</td><td>'
				+	value.toFixed(2)
				+	'</td></tr>'
			);
		});
	};

	module.reset = function() {
		// if init has not been run, do nothing
		if(!$div) return;

		data = [];
		$graph.html("");
		$rows.html("");
	};

	return module;

}(jQuery));