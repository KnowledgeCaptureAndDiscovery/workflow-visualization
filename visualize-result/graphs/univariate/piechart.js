(function($) {

	var Piechart = function(renderTo, dataCopy, classesCopy) {

		var module = {},
			$div,
			$graph,
			data = [],
			classes;

		module.init = function(renderTo, dataCopy, classesCopy) {
			$div = renderTo;
			$div.data("dashboard.univariate.piechart", module);
			data = dataCopy;
			classes = classesCopy;
			$graph = $div.find('.chart.image');

			var graphData = [];
			classes.forEach(function(item) {
				graphData.push({
					name: item,
					y: data.filter(function(val) { return val == item; }).length
				});
			});

			module.reset();

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
					type: 'pie',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: (function () {
					var colors = [],
						base = '#3198f7',
						i,
						len = graphData.length;

					for (i = 0; i < len; i += 1) {
						colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
					}
					
					return colors;
				}()),
				title: {
					text: ''
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: false
						},
						showInLegend: true
					}
				},
				series: [{
					name: 'Percentage',
					colorByPoint: true,
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

			$graph.html("");
		};

		module.init(renderTo, dataCopy, classesCopy);
		
	};

	$.fn.dashboard_univariate_piechart = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.univariate.piechart") !== undefined) {
        			$.data($(this), "dashboard.univariate.piechart")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Piechart, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));