(function($) {

	var Stackedhistogram = function(renderTo, seriesNames, dataCopy, classesCopy) {
		var module = this,
			$div,
			$graph,
			$rangeSelector,
			graph,
			data = [],
			classes = [];

		module.init = function(renderTo, names, dataCopy, classesCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.bivariate.stackedhistogram", module);

			data = dataCopy;
			classes = classesCopy;

			$options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".stackedhistogram").remove();
			$options.append("<div class='stackedhistogram'></div>");
			$options = $options.find(".stackedhistogram");
			$options.html($div.find(".plot.options").html());

			$graph = $div.find('.chart.image');
			$rangeSelector = $options.find(".ui.range");

			module.reset();

			module.initGraphs(names, data, classes);
		};

		module.initGraphs = function(names, data, classes) {
			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				if(data[0][0] == null || data[1][0] == null) {
					renderTo.showNoData();
					return;
				}

				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));

				graph = new Highcharts.Chart({
					chart: {
						renderTo: $div.find(".block-" + ix).get(0),
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
							len = classes[ix][1].length;

						for (i = 0; i < len; i += 1) {
							colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
						}
						
						return colors;
					}()),
					xAxis: {
						categories: [],
						title: {
							text: names[0]
						},
						min: 0,
						gridLineWidth: 1,
						tickmarkPlacement: 'on'
					},
					yAxis: [{
						title: {
							text: 'Histogram Count'
						}
					}],
					series: [],
					plotOptions: {
						column: {
							stacking: 'normal',
							pointPadding: 0,
							groupPadding: 0,
							pointPlacement: 'between'
						}
					},
					tooltip: {
						headerFormat: names[1] + ': <b>{series.name}</b><br/>',
						pointFormat: 'Histogram Count: <b>{point.y}</b> of {point.stackTotal}'
					},
					credits: {
					  enabled: false
					}
				});
			});

			var initialNumberOfBins = 8;

			$rangeSelector.ionRangeSlider({
				min: 2,
				max: 20,
				from: initialNumberOfBins,
				step: 1,
				postfix: ' bins',
				max_postfix: "+",
				grid: false
			});

			$rangeSelector.data("ionRangeSlider").update({
				onFinish: function(sliderData) {
					module.render(sliderData.from);
				}
			});

			module.render(initialNumberOfBins);
		};

		module.render = function(numBins) {
			data.forEach(function(singleData, ix) {
				module.renderIndividual(numBins, singleData, ix);
			});
		};

		module.renderIndividual = function(numBins, data, index) {
			console.log("stackedhist", data, classes);
			if(data[0][0] == null || data[1][0] == null) {
				$div.find(".block-" + index).showNoData();
				return;
			}

			var min = d3.min(data[0]);
			var max = d3.max(data[0]);
			var ticks = d3.ticks(min, max, numBins);
			var tickInterval = d3.tickStep(min, max, numBins);

			ticks.splice(0, 0, ticks[0] - tickInterval);
			
			var histData = classes[index][1].map(function(item) {
				var counts = [];
				var itemData = data[0].filter(function(val, ix) {
					return (data[1][ix] == item);
				});
				counts = ticks.map(function(tickValue, ix) {
					return itemData.filter(function(val) {
						return (val >= ticks[ix] && val < ticks[ix] + tickInterval)
					}).length;
				});

				return {
					name: item,
					type: 'column',
					data: counts
				};
			});

			var graph = $div.find(".block-" + index).highcharts();

			while(graph.series.length > 0)
				graph.series[0].remove(false);

			for(var ix in histData) {
				graph.addSeries(histData[ix]);
			}

			graph.xAxis[0].setCategories(ticks);
		}

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy, classesCopy);

	};

	$.fn.dashboard_bivariate_stackedhistogram = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.bivariate.stackedhistogram") !== undefined) {
        			$.data($(this)[0], "dashboard.bivariate.stackedhistogram")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Stackedhistogram, [null, $(this)].concat(args))));
        	}
        });
    };
	
}(jQuery));