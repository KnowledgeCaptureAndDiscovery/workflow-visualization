(function($) {

	var Scatterplot = function(renderTo, seriesNames, dataCopy, oneofs) {
		
		var module = this,
			$div,
			$graph,
			graph,
			graphData = [],
			$renderCheckbox,
			renderAllData,
			sampleDataThreshold = 1000,
			names = [],
			data = [],
			categories = [],
			sampleData = [];

		module.init = function(renderTo, seriesNames, dataCopy, oneofs) {			
			$div = renderTo;
			$div.data("dashboard.trivariate.scatterplot", module);
			names = seriesNames;
			data = d3.transpose(dataCopy);
			sampleData = data.slice(0, sampleDataThreshold);
			categories = oneofs[2];
			$renderCheckbox = $div.find('.render.fitted.toggle.checkbox');
			$graph = $div.find('.chart.image');

			module.reset();
			module.initCheckbox();
			module.render();
		};

		module.render = function() {
			graphData = categories.map(function(categoryName) {
				return {name: categoryName, data: []};
			});
			module.dataToRender().forEach(function(row) {
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
				// colors: (function () {
				// 	var colors = [],
				// 		base = '#3198f7',
				// 		i,
				// 		len = categories.length;

				// 	for (i = 0; i < len; i += 1) {
				// 		colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
				// 	}
					
				// 	return colors;
				// }()),
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

		module.initCheckbox = function() {
			if(data.length < sampleDataThreshold) {
				renderAllData = true;
				$renderCheckbox.checkbox("set checked");
				$div.find(".render").addClass("hidden");
				$div.find(".render-detail").addClass("hidden");
			}
			else {
				renderAllData = false;
				$renderCheckbox.checkbox("set unchecked");
				$div.find(".render").removeClass("hidden");
				$div.find(".render-detail").removeClass("hidden");
				$div.find(".render-detail").css("margin-top", "5px");
				$div.find(".render-detail").css("padding-bottom", "0");
			}
			$renderCheckbox.checkbox({
				onChecked: function() {
					renderAllData = true;
					module.render();
				},
				onUnchecked: function() {
					renderAllData = false;
					module.render();
				}
			});
		};

		module.dataToRender = function() {
			return (renderAllData? data: sampleData);
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