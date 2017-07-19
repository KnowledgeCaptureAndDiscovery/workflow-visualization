(function($) {

	var Heatmap = function(renderTo, seriesNames, dataCopy, oneofs) {

		var module = this,
			$div,
			$graph,
			heatmapData = [],
			names = [],
			data = [];

		module.init = function(renderTo, seriesNames, dataCopy, classes) {
			$div = renderTo;
			$div.data("dashboard.trivariate.heatmap", module);
			names = seriesNames;
			data = dataCopy.map((singleData) => (singleData == null? null : d3.transpose(singleData)));
			$graph = $div.find('.chart.image');

			module.reset();
			
			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), singleData, classes[ix]);
			});
		};

		module.render = function(renderTo, data, categories) {
			console.log(data);
			if(data[0][0] == null || data[0][1] == null || data[0][2] == null) {
				renderTo.showNoData();
				return;
			}

			var heatmapData = [];
			categories[0].forEach(function(category1, ix1) {
				categories[1].forEach(function(category2, ix2) {
					var filteredData = data.filter(function(val) {
						return val[0] == category1 && val[1] == category2;
					}).map(function(val) {
						return val[2];
					});
					var mean = d3.mean(filteredData);
					if(mean !== undefined) {
						heatmapData.push([ix1, ix2, mean]);
					}
				});
			});

			var graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'heatmap',
					style: {
						fontFamily: 'Lato'
					},
	        		plotBorderWidth: 1
				},
				title: {
					text: ''
				},
				xAxis: {
					title: {
						text: names[0]
					},
					labels: {
						formatter: function() {
							return categories[0][this.value];
						}
					},
					min: 0,
					max: categories[0].length - 1,
					tickmarkPlacement: 'between'
				},
				yAxis: [{
					title: {
						text: names[1]
					},
					labels: {
						formatter: function() {
							return categories[1][this.value];
						}
					},
					startOnTick: false,
					endOnTick: false,
					gridLineWidth: 0
				}],
				color: ['#3198f7'],
				colorAxis: {
					stops: [
						[0, '#fff'],
						[1, '#3198f7']
					]
				},
				legend: {
			        align: 'right',
			        layout: 'vertical',
			        margin: 0,
			        verticalAlign: 'middle'
			    },
				series: [{
					name: "Heatmap",
					borderWidth: 1,
					borderColor: '#eeeeee',
					data: heatmapData
				}],
				tooltip: {
					formatter: function() {
						return 'Average ' + names[2] + ': <b>' + this.point.value.toFixed(2) + '</b>';
					}
				},
				credits: {
				  enabled: false
				}
			});
		}

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy, oneofs);

	};

	$.fn.dashboard_trivariate_heatmap = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.trivariate.heatmap") !== undefined) {
        			$.data($(this), "dashboard.trivariate.heatmap")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Heatmap, [null, $(this)].concat(args))));
        	}
        });
    };
	
}(jQuery));
