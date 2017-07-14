(function($) {

	var Boxplot = function(renderTo, dataCopy) {

		var module = this,
			data = [],
			$div,
			meta,
			$graph;

		module.init = function(renderTo, dataCopy) {
			$div = renderTo;
			$div.data("dashboard.univariate.boxplot", module);
			data = dataCopy.sort(function(a,b) { return a-b; });
			meta = data.map(module.calculateDataInfo);
			$graph = $div.find('.chart.image');

			module.reset();

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), singleData, meta[ix]);
			});

			module.equlizeAxis();
		};

		module.render = function(renderTo, data, meta) {
			if(data == null) {
				renderTo.showNoData();
				return;
			}

			var median = meta.median;
			var q1 = meta.q1;
			var q3 = meta.q3;
			var iqr = meta.iqr;
			var upperFence = meta.upperFence;
			var lowerFence = meta.lowerFence;

			var outliers = data.filter(function(val) {
				return (val < lowerFence || val > upperFence);
			});

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'boxplot',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: ['#3198f7'],
				title: {
					text: ''
				},
				xAxis: {
					categories: [''],
					gridLineWidth: 1
				},
				series: [{
					name: 'Observations',
					data: [[lowerFence, q1, median, q3, upperFence]]
				}, {
					name: 'Outlier',
					type: 'scatter',
					data: outliers.map(function(val) { return [0, val]; }),
					tooltip: {
						pointFormat: 'Value: {point.y}'
					}
				}],
				credits: {
				  enabled: false
				},
				legend: {
				  enabled: false
				}
			});
		};

		// @brief 	calculate column meta information used by all visualizations
		// @param	columnData 	column data
		// @return	an object including all meta data
		module.calculateDataInfo = function(columnData) {
			if(columnData == null) {
				return null;
			}

			columnData = columnData.sort(function(a,b) { return a - b; });

			var meta = {};

			meta.min = columnData[0];
			meta.max = columnData[columnData.length - 1];
			meta.median = d3.median(columnData);
			meta.q1 = d3.quantile(columnData, 0.25);
			meta.q3 = d3.quantile(columnData, 0.75);
			meta.iqr = meta.q3 - meta.q1;
			meta.upperFence = Math.min(
				meta.q3 + 1.5*meta.iqr, 
				meta.max
			);
			meta.lowerFence = Math.max(
				meta.q1 - 1.5*meta.iqr, 
				meta.min
			);

			return meta;
		};

		module.equlizeAxis = function(flag = true) {
			if(flag) {
				var numberMax = d3.max(meta.filter((val) => (val != null)).map((val) => (val.upperFence)));
				var numberMin = d3.min(meta.filter((val) => (val != null)).map((val) => (val.lowerFence)));
				$div.find(".grid").find(".column").each(function() {
					if($(this).highcharts() !== undefined)
						$(this).highcharts().yAxis[0].setExtremes(numberMin, numberMax);
				});
			}
			else {
				$div.find(".grid").find(".column").each(function() {
					if($(this).highcharts() !== undefined)
						$(this).highcharts().yAxis[0].setExtremes(null, null);
				});
			}
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, dataCopy);
	};

	$.fn.dashboard_univariate_boxplot = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.univariate.boxplot") !== undefined) {
        			$.data($(this), "dashboard.univariate.boxplot")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Boxplot, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));