(function($) {

	var Scatterplot = function(renderTo, seriesNames, dataCopy, oneofs) {
		
		var module = this,
			$div,
			$graph,
			graph,
			graphData = [],
			names = [],
			data = [],
			categories = [];

		module.init = function(renderTo, seriesNames, dataCopy, oneofs) {			
			$div = renderTo;
			$div.data("dashboard.trivariate.scatterplot", module);
			names = seriesNames;
			data = d3.transpose(dataCopy);
			categories = oneofs[2];
			$graph = $div.find('.chart.image');

			module.reset();

			graphData = categories.map(function(categoryName) {
				return {name: categoryName, data: []};
			});
			data.forEach(function(row) {
				graphData[categories.indexOf(row[2])]["data"].push(row.slice(0, -1));
			});

			graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
					type: 'scatter',
					zoomType: 'xy',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: (function () {
					var colors = [],
						base = '#3198f7',
						i,
						len = categories.length;

					for (i = 0; i < len; i += 1) {
						colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
					}
					
					return colors;
				}()),
				title: {
					text: ''
				},
				xAxis: {
					gridLineWidth: 1,
					title: {
						enabled: true,
						text: names[0]
					}
				},
				yAxis: {
					title: {
						text: names[1]
					}
				},
				tooltip: {
					headerFormat: '<b>Data Point</b><br>',
					pointFormat: names[2] + ': <b>{series.name}</b>'
						+ '<br/>'
						+ names[0] + ': <b>{point.x}</b>'	
						+ '<br/>'
						+ names[1] + ': <b>{point.y}</b>'	
				},
				series: graphData,
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

		module.init(renderTo, seriesNames, dataCopy, oneofs);

	};

	$.fn.dashboard_trivariate_scatterplot = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.trivariate.scatterplot") !== undefined) {
        			$.data($(this), "dashboard.trivariate.scatterplot")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Scatterplot, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));