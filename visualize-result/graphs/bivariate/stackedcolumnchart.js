(function($) {

	var Stackedcolumnchart = function(renderTo, seriesNames, dataCopy, classesCopy) {
	
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
			$.data($div[0], "dashboard.bivariate.stackedcolumnchart", module);
			names = seriesNames;
			data = dataCopy;
			classes = classesCopy;
			$graph = $div.find('.chart.image');

			module.reset();

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

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy, classesCopy);

	};

	$.fn.dashboard_bivariate_stackedcolumnchart = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.bivariate.stackedcolumnchart") !== undefined) {
        			$.data($(this)[0], "dashboard.bivariate.stackedcolumnchart")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Stackedcolumnchart, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));