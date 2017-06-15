(function($) {

	var Linechart = function(renderTo, seriesNames, dataCopy, classesCopy) {

		var module = this,
			$div,
			$graph,
			graph,
			graphData = [],
			names = [],
			classes = [],
			data = [];

		module.init = function(renderTo, seriesNames, dataCopy, classesCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.bivariate.linechart", module);
			names = seriesNames;
			data = dataCopy;
			classes = classesCopy;
			$graph = $div.find('.chart.image');

			module.reset();

			graphData = classes.map(function(item) {
				var values = data[1].filter(function(val, ix) {
					return data[0][ix] == item;
				});
				if(values.length == 0) {
					return 0;
				}
				return d3.mean(values);
			});

			graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
					type: 'line',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: ['#3198f7'],
				title: {
					text: ''
				},
				xAxis: {
					categories: classes,
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
				series: [{
					name: 'Data',
					type: 'line',
					data: graphData
				}],
				tooltip: {
					formatter: function() {
						return names[0] + ': <b>' + this.x + '</b>'
						+ '<br>'
						+ names[1] + ': <b>' + this.y.toFixed(2) + '</b>'
					}
				},
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

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy, classesCopy);

	};

	$.fn.dashboard_bivariate_linechart = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.bivariate.linechart") !== undefined) {
        			$.data($(this)[0], "dashboard.bivariate.linechart")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Linechart, [null, $(this)].concat(args))));
        	}
        });
    };
	
}(jQuery));