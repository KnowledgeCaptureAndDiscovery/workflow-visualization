Univariate.columnchart = (function($) {
	var module = {},
		$div,
		classes,
		data;

	module.init = function(renderTo, dataCopy, classesCopy) {
		module.reset();
		
		$div = renderTo;
		classes = classesCopy;
		data = dataCopy;

		$graph = $div.find('.chart.image');
		var graphData = classes.map(function(item) {
			return data.filter(function(val) { return val == item; }).length
		});

		var graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
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
				categories: classes
			},
			series: [{
				name: 'Category Count',
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