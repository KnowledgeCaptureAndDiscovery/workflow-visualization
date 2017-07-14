(function($) {

	var Piechart = function(renderTo, dataCopy, classesCopy) {

		var module = {},
			$div,
			$graph;

		module.init = function(renderTo, data, classes) {
			$div = renderTo;
			$div.data("dashboard.univariate.piechart", module);
			$graph = $div.find('.chart.image');
			module.reset();

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), singleData, classes[ix]);
			});
		};

		module.render = function(renderTo, dataToRender, classes) {
			if(dataToRender == null) {
				renderTo.showNoData();
				return;
			}
			
			var graphData = classes.map(function(item) {
				return {
					name: item,
					y: dataToRender.filter(function(val) { return val == item; }).length
				};
			});

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
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