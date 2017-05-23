Univariate.boxplot = (function($) {
	var module = {},
		data = [],
		$div,
		$graph,
		$rows;

	module.init = function(renderTo, dataCopy, meta) {
		module.reset();
		
		$div = renderTo;
		data = dataCopy.sort(function(a,b) { return a-b; });
		$graph = $div.find('.chart.image');
		$rows = $div.find('.table').find('tbody');

		var median = meta.median;
		var q1 = meta.q1;
		var q3 = meta.q3;
		var iqr = meta.iqr;
		var upperFence = meta.upperFence;
		var lowerFence = meta.lowerFence;

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