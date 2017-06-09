(function($) {

	var Columnchart = function(renderTo, dataCopy, classesCopy) {
	
		var module = {},
			$div,
			classes,
			data;

		module.init = function(renderTo, dataCopy, classesCopy) {
			$div = renderTo;
			$div.data("dashboard.univariate.columnchart", module);
			classes = classesCopy;
			data = dataCopy;

			$graph = $div.find('.chart.image');
			var graphData = classes.map(function(item) {
				return data.filter(function(val) { return val == item; }).length
			});

			module.reset();

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

			$graph.html("");
		};

		module.init(renderTo, dataCopy, classesCopy);

	};

	$.fn.dashboard_univariate_columnchart = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.univariate.columnchart") !== undefined) {
        			$.data($(this), "dashboard.univariate.columnchart")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Columnchart, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));