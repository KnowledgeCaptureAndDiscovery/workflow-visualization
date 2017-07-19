(function($) {

	var Histogram = function(renderTo, dataCopy, metaCopy) {
	
		var module = this,
			$div,
			$rangeSelector,
			$graph,
			$excludeCheckbox,
			$percCheckbox,
			$options,
			data = [],
			dataWithoutOutliers = [],
			meta = {},
			excludeOutliers,
			showPerc;

		module.init = function(renderTo, dataCopy, metaCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.univariate.histogram", module);

			$options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".histogram").remove();
			$options.append("<div class='histogram'></div>");
			$options = $options.find(".histogram");
			$options.html($div.find(".plot.options").html());

			$rangeSelector = $options.find(".ui.range");
			$graph = $div.find(".chart");
			$excludeCheckbox = $options
				.find(".exclude.toggle-container")
				.find('.fitted.toggle.checkbox');
			$percCheckbox = $options
				.find(".perc.toggle-container")
				.find('.fitted.toggle.checkbox');

			data = dataCopy;
			meta = data.map(singleData => module.calculateDataInfo(singleData));

			module.reset();

			dataWithoutOutliers = data.map(function(singleData, ix) {
				return (singleData || []).filter(function(val) {
					return (val >= meta[ix].lowerFence && val <= meta[ix].upperFence);
				});
			});

			module.initExcludeCheckbox();
			module.initPercCheckbox();
			module.initGraphs();

			module.render(0);
		};

		// @brief 	calculate column meta information used by all visualizations
		// @param	columnData 	column data
		// @return	an object including all meta data
		module.calculateDataInfo = function(columnData) {
			if(columnData == null) {
				return null;
			}

			columnData = columnData.sort(function(a,b) { return a - b; });

			var metaInfo = {};

			metaInfo.min = columnData[0];
			metaInfo.max = columnData[columnData.length - 1];
			metaInfo.q1 = d3.quantile(columnData, 0.25);
			metaInfo.q3 = d3.quantile(columnData, 0.75);
			metaInfo.iqr = metaInfo.q3 - metaInfo.q1;
			metaInfo.upperFence = Math.min(
				metaInfo.q3 + 1.5*metaInfo.iqr, 
				metaInfo.max
			);
			metaInfo.lowerFence = Math.max(
				metaInfo.q1 - 1.5*metaInfo.iqr, 
				metaInfo.min
			);

			return metaInfo;
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

			if(dataWithoutOutliers.length == data.length) {
				$options.find(".exclude.toggle-container").addClass("hidden");
				excludeOutliers = false;
				$options.find(".ui.divider:last").addClass("hidden");
			}
			else {
				$options.find(".exclude.toggle-container").removeClass("hidden");
				$options.find(".ui.divider:last").removeClass("hidden");
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

		module.initGraphs = function() {
			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));

				if(singleData == null) {
					return;
				}
			
				var graph = new Highcharts.Chart({
					chart: {
						renderTo: $div.find(".block-" + ix).get(0),
						type: 'column',
						style: {
							fontFamily: 'Lato'
						},
						zoomType: 'x'
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
						data: [],
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
			});
		};

		module.render = function(numBins) {
			var dataToShow = data;
			if(excludeOutliers) {
				dataToShow = dataWithoutOutliers;
			}
			dataToShow.forEach(function(singleData, ix) {
				module.renderIndividual(numBins, singleData, ix);
			});
		};

		module.renderIndividual = function(numBins, dataToShow, index) {
			if(dataToShow == null) {
				$div.find(".block-" + index).showNoData();
				return;
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
			
			var histData = ticks.map(function(tickValue, ix) {
				var count = dataToShow.filter(function(val) {
					return (val >= ticks[ix] && val < ticks[ix] + tickInterval);
				}).length;
				if(showPerc) {
					count = count / dataToShow.length * 100;
					count = parseFloat(count.toFixed(2));
				}
				return [ticks[ix], count];
			});

			var graph = $div.find(".block-" + index).highcharts();
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