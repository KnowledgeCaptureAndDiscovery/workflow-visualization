(function($) {

	var Columnchart = function(renderTo, dataCopy, classesCopy) {
	
		var module = {},
			$div,
			$graph,
			numbers = [];

		module.init = function(renderTo, data, classes) {
			$div = renderTo;
			$div.data("dashboard.univariate.columnchart", module);
			$graph = $div.find('.chart.image');
			module.reset();

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), singleData, classes[ix]);
			});

			module.equlizeAxis();
		};

		module.render = function(renderTo, dataToRender, classes) {
			if(dataToRender == null) {
				renderTo.showNoData();
				return;
			}

			var graphData = classes.map(function(item) {
				return dataToRender.filter(function(val) { return val == item; }).length;
			});
			numbers = numbers.concat(graphData);

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
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
				legend: {
					enabled: false
				},
				credits: {
				  enabled: false
				}
			});
		};

		module.equlizeAxis = function() {
			var numberMax = d3.max(numbers);
			$div.find(".grid").find(".column").each(function() {
				if($(this).highcharts() !== undefined)
					$(this).highcharts().yAxis[0].setExtremes(0, numberMax);
			})
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
			numbers = [];
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