(function($) {

	var Scatterplot = function(renderTo, seriesNames, dataCopy) {
	
		var module = this,
			$div,
			$graph,
			$checkbox,
			$regDropdown,
			graph,
			graphData = [],
			names = [],
			data = [],
			regType = null,
			regEquation = "";

		module.init = function(renderTo, seriesNames, dataCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.bivariate.scatterplot", module);
			names = seriesNames;
			data = dataCopy;

			$options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".scatter-plot").remove();
			$options.append("<div class='scatter-plot'></div>");
			$options = $options.find(".scatter-plot");
			$options.html($div.find(".plot.options").html());

			$graph = $div.find('.chart.image');
			$checkbox = $options.find('.fitted.toggle.checkbox');
			$regDropdown = $options.find('.ui.dropdown');

			$regDropdown = $regDropdown.dropdown();

			module.reset();

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), names, singleData, ix);
			});

			module.updateChart();

			$checkbox.checkbox({
				onChecked: function() {
					$regDropdown.removeClass("hidden");
					regType = $regDropdown.dropdown("get value");
					module.updateChart();
				},
				onUnchecked: function() {
					$regDropdown.addClass("hidden");
					regType = null;
					module.updateChart();
				}
			});

			$div.find(".ui.dropdown").dropdown("setting", "onChange", function() {
				regType = $regDropdown.dropdown("get value");
				module.updateChart();
			});
		};

		module.render = function(renderTo, names, data, plotIndex) {
			if(data == null) {
				renderTo.showNoData();
				return;
			}

			graphData[plotIndex] = data[0].map(function(val, ix) {
				return [data[0][ix], data[1][ix]];
			});

			graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'scatter',
					zoomType: 'xy',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: ['#3198f7'],
				title: {
					text: ''
				},
				xAxis: {
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
				plotOptions: {
					scatter: {
						tooltip: {
							headerFormat: '<b>Data Point</b><br>',
							pointFormat: names[0] + ': <b>{point.x}</b>'
								+ '<br>'
								+ names[1] + ': <b>{point.y}</b>'
						}
					},
					line: {
						tooltip: {
							headerFormat: '<b>Regression Line</b><br>',
							pointFormat: 'Equation: ' + regEquation
						}
					}
				},
				series: [{
					name: 'Data',
					type: 'scatter',
					data: graphData[plotIndex]
				}, {
					name: 'Regression Line',
					type: 'line',
					data: []
				}],
				credits: {
				  enabled: false
				},
				legend: {
				  enabled: false
				}
			});
		};

		module.updateChart = function() {
			data.forEach(function(singleData, ix) {
				module.updateIndividualChart(ix);
			});
		};

		module.updateIndividualChart = function(plotIndex) {
			if(data[plotIndex] == null) {
				return;
			}

			var newSeries = [];
			if(regType != null) {
				$regDropdown.removeClass("hidden");
				var regResult = {};
				if(regType != "polynomial") {
					regResult = regression(regType, graphData[plotIndex]);
				}
				else {
					regResult = regression(regType, graphData[plotIndex], 2);
				}
				regEquation = regResult.string;
				newSeries = regResult.points
					.sort(function (a,b) {
						return a[0] - b[0];
					})
					.filter(function (val, ix, arr) {
						return (ix == 0 || arr[ix-1][0] != val[0]);
				});
			}
			else {
				$regDropdown.addClass("hidden");
			}

			$div.find(".block-" + plotIndex).highcharts().series[1].update({
				data: newSeries,
				tooltip: {
					headerFormat: '<b>Regression Line</b><br>',
					pointFormat: 'Equation: ' + regEquation
				},
				color: 'rgba(0,0,0,0.7)'
			});
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy);

	};

	$.fn.dashboard_bivariate_scatterplot = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.bivariate.scatterplot") !== undefined) {
        			$.data($(this)[0], "dashboard.bivariate.scatterplot")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Scatterplot, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));