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

			console.log(meta);

			module.reset();

			var median = meta.map(val => val.median);
			var q1 = meta.map(val => val.q1);
			var q3 = meta.map(val => val.q3);
			var iqr = meta.map(val => val.iqr);
			var upperFence = meta.map(val => val.upperFence);
			var lowerFence = meta.map(val => val.lowerFence);

			var outliers = data.map(function(individualData, ix) {
				return individualData.filter(function(val) {
					return (val < lowerFence[ix] || val > upperFence[ix]);
				});
			});

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
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
					categories: data.map(function(_, ix) { return "Dataset " + (ix + 1); })
				},
				yAxis: [{
					title: {
						text: 'Value'
					}
				}],
				series: [{
					name: 'Observations',
					data: d3.transpose([lowerFence, q1, median, q3, upperFence])
				}, {
					name: 'Outlier',
					type: 'scatter',
					data: outliers.map(function(val, ix) { return [ix, val]; }),
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

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
			$div.closest(".column").find(".settings.popup .plot.options").html("");
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