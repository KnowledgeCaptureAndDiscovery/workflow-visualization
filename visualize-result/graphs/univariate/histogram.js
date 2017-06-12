(function($) {

	var Histogram = function(renderTo, dataCopy, metaCopy) {
	
		var module = this,
			$div,
			$rangeSelector,
			$graph,
			$excludeCheckbox,
			$percCheckbox,
			data = [],
			dataWithoutOutliers = [],
			meta = {},
			histData = [],
			excludeOutliers,
			showPerc;

		module.init = function(renderTo, dataCopy, metaCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.univariate.histogram", module);
			$rangeSelector = $div.find(".ui.range");
			$graph = $div.find(".chart");
			$excludeCheckbox = $div
				.find(".exclude.toggle-container")
				.find('.fitted.toggle.checkbox');
			$percCheckbox = $div
				.find(".perc.toggle-container")
				.find('.fitted.toggle.checkbox');
			data = dataCopy;
			meta = metaCopy;

			module.reset();

			module.initExcludeCheckbox();
			module.initPercCheckbox();

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
					gridLineWidth: 1
				},
				yAxis: [{
					title: {
						text: 'Histogram Count'
					}
				}],
				series: [{
					name: 'Histogram',
					type: 'column',
					data: histData,
					pointPadding: 0,
					groupPadding: 0,
					pointPlacement: 'between'
				}],
				credits: {
				  enabled: false
				},
				legend: {
				  enabled: false
				},
				tooltip: {
					formatter: function() {
						return 'Histogram Count: <b>' + this.y + '</b>';
					}
				}
			});

			module.render(0);
		};

		module.initExcludeCheckbox = function() {
			excludeOutliers = $excludeCheckbox.checkbox("is checked");
			$excludeCheckbox.checkbox({
				onChecked: function() {
					excludeOutliers = true;
					module.update();
				},
				onUnchecked: function() {
					excludeOutliers = false;
					module.update();
				}
			});

			dataWithoutOutliers = data.filter(function(val) {
				return (val >= meta.lowerFence && val <= meta.upperFence);
			});

			if(dataWithoutOutliers.length == data.length) {
				$div.find(".exclude.toggle-container").addClass("hidden");
				excludeOutliers = false;
				$div.find(".ui.divider:last").addClass("hidden");
			}
			else {
				$div.find(".exclude.toggle-container").removeClass("hidden");
				$div.find(".ui.divider:last").removeClass("hidden");
			}
		};

		module.initPercCheckbox = function() {
			showPerc = $percCheckbox.checkbox("is checked");
			$percCheckbox.checkbox({
				onChecked: function() {
					showPerc = true;
					module.update();
				},
				onUnchecked: function() {
					showPerc = false;
					module.update();
				}
			});
		};

		module.render = function(numBins) {
			var dataToShow = data;
			if(excludeOutliers) {
				dataToShow = dataWithoutOutliers;
				var numExclude = data.length - dataWithoutOutliers.length;
				var plural = " outliers are";
				if(numExclude <= 1) plural = " outlier is";
				$div.find(".exclude-detail").css("margin-top", "5px");
				$div.find(".exclude-detail").css("padding-bottom", "0");
				$div.find(".exclude-detail").html(
					"<i class='info circle icon'></i> " 
					+ numExclude + plural + " excluded."
				);
				$div.find(".exclude-detail").removeClass("hidden");
			}
			else {
				$div.find(".exclude-detail").addClass("hidden");
			}

			// need to suggest number of bins
			if(numBins == 0) {
				numBins = d3.thresholdFreedmanDiaconis(
					dataToShow, 
					d3.min(dataToShow), 
					d3.max(dataToShow)
				);
				if(numBins < 2) numBins = 2;
				else if(numBins > 20) numBins = 20;
			
				$rangeSelector.ionRangeSlider({
					min: 2,
					max: 20,
					from: numBins,
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
			}

			var min = d3.min(dataToShow);
			var max = d3.max(dataToShow);
			var ticks = d3.ticks(min, max, numBins);
			var tickInterval = d3.tickStep(min, max, numBins);

			ticks.splice(0, 0, ticks[0] - tickInterval);

			$rangeSelector.data("ionRangeSlider").update({
				from: ticks.length
			});
			
			histData = ticks.map(function(tickValue, ix) {
				var count = dataToShow.filter(function(val) {
					return (val >= ticks[ix] && val < ticks[ix] + tickInterval);
				}).length;
				if(showPerc) {
					count = count / dataToShow.length * 100;
					count = parseFloat(count.toFixed(2));
				}
				return [ticks[ix], count];
			});

			var graph = $graph.highcharts();
			graph.series[0].update({
				data: histData
			});

			if(showPerc) {
				graph.update({
					yAxis: [{
						title: {
							text: 'Histogram Percentage (%)'
						}
					}],
					tooltip: {
						formatter: function() {
							return 'Percentage: <b>' + this.y + '%</b>';
						}
					}
				});
			}
			else {
				graph.update({
					yAxis: [{
						title: {
							text: 'Histogram Count'
						}
					}],
					tooltip: {
						formatter: function() {
							return 'Histogram Count: <b>' + this.y + '</b>';
						}
					}
				});
			}
		};

		module.update = function() {
			var numBins = $rangeSelector.data("ionRangeSlider").old_from;
			module.render(numBins);
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			dataWithoutOutliers = [];

			$graph.html("");
		};

		module.init(renderTo, dataCopy, metaCopy);
	};

	$.fn.dashboard_univariate_histogram = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.univariate.histogram") !== undefined) {
        			$.data($(this)[0], "dashboard.univariate.histogram")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Histogram, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));