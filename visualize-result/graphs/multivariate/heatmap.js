Multivariate.heatmap = (function($) {
	var module = {},
		$div,
		$graph,
		$independentScaleCheckbox,
		independentScale,
		names = [],
		data = [],
		scales,
		graphData = [],
		scaledData = [];

	module.init = function(renderTo, seriesNames, dataCopy) {
      // TIME_KEEPING
      console.log("--- Heatmap Script Starts Loading ---");
      window.ST = (new Date());
      console.log("Heatmap init: " + 0);

		module.reset();

		$div = renderTo;
		$graph = $div.find('.chart.image');
		$independentScaleCheckbox = $div.find('.fitted.toggle.checkbox');

		names = seriesNames;
		data = dataCopy;

		scales = data.map(function(col, ix) {
			return d3.scaleLinear()
					.domain([d3.min(col), d3.max(col)])
					.range([0, 100]);
		});

		graphData = data.map(function(col, ix1) {
			return col.map(function(val, ix2) {
				return [ix1, ix2, val];
			});
		});
		graphData = [].concat.apply([], graphData);

		// TIME_KEEPING
		console.log("Heatmap data process 1: " + (new Date() - window.ST));

		scaledData = graphData.map(function(point) {
			var respectiveScale = scales[point[0]];
			return [point[0], point[1], respectiveScale(point[2])];
		});

		// TIME_KEEPING
		console.log("Heatmap data process 2: " + (new Date() - window.ST));

		module.initCheckbox();
		module.render();
	};

	module.initCheckbox = function() {
		independentScale = $independentScaleCheckbox
							.checkbox("is checked");
		$independentScaleCheckbox.checkbox({
			onChecked: function() {
				independentScale = true;
				module.render();
			},
			onUnchecked: function() {
				independentScale = false;
				module.render();
			}
		});
	};

	module.render = function() {
		graph = new Highcharts.Chart({
			chart: {
				renderTo: $graph.get(0),
				type: 'heatmap',
				style: {
					fontFamily: 'Lato'
				},
        		plotBorderWidth: 1
			},
			title: {
				text: ''
			},
			xAxis: {
				title: {
					text: ''
				},
				categories: names,
				min: 0,
				max: names.length - 1,
				tickInterval: 1
			},
			yAxis: [{
				title: {
					text: 'Data Points'
				},
				labels: {
					enabled: false
				},
				min: 0,
				max: data[0].length - 1,
				startOnTick: false,
				endOnTick: false
			}],
			color: ['#3198f7'],
			colorAxis: {
				stops: [
					[0, '#3060cf'],
	                [0.5, '#fffbbc'],
	                [0.9, '#c4463a'],
	                [1, '#c4463a']
				],
				labels: {
			        formatter: function() {
			        	return this.value + (independentScale? '%': '');
			        }
				}
			},
			legend: {
		        align: 'right',
		        layout: 'vertical',
		        margin: 0,
		        verticalAlign: 'middle'
		    },
			series: [{
				name: "Heatmap",
				borderColor: '#eeeeee',
				data: (independentScale? scaledData: graphData),
				turboThreshold: graphData.length + 1
			}],
			tooltip: {
				formatter: function() {
					var perc = scaledData[this.point.x * data[0].length + this.y][2];
					return 'Data Point No. ' + (this.y+1) + '<br/>'
						+	names[this.point.x] + ': <b>' + data[this.point.x][this.y] + '</b><br/>'
						+	'Percentage: <b>' + perc.toFixed(2) + '%</b>';
				}
			},
			credits: {
				enabled: false
			}
		});
		// TIME_KEEPING
		console.log("Heatmap render: " + (new Date() - window.ST));
	};

	module.reset = function() {
		// if init has not been run, do nothing
		if(!$div) return;

		data = [];
		$graph.html("");
	};

	return module;
	
}(jQuery));