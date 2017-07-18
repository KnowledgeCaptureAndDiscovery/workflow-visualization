(function($) {

	var Donutchart = function(renderTo, seriesNames, dataCopy, classesCopy) {

		var module = this,
			$div,
			$graph;

		module.init = function(renderTo, names, data, classes) {
			$div = renderTo;
			$.data($div[0], "dashbaord.bivariate.donutchart", module);
			$graph = $div.find('.chart.image');

			module.reset();

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), names, singleData, classes[ix]);
			});
		};

		module.render = function(renderTo, names, data, classes) {
			if(data[0][0] == null || data[1][0] == null) {
				renderTo.showNoData();
				return;
			}

			var dataStore = {};

			classes[0].forEach(function(item1) {
				dataStore[item1] = {};
				classes[1].forEach(function(item2) {
					dataStore[item1][item2] = 0;
				});
			});

			data[0].forEach(function(val, ix) {
				dataStore[val][data[1][ix]]++;
			});

			var colors = (function () {
				var colors = [],
					base = '#3198f7',
					i,
					len = classes[0].length * classes[1].length;

				for (i = 0; i < len; i += 1) {
					colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
				}
				
				return colors;
			}())

			var masterData = classes[0].map(function(item, ix) {
				var count = 0;
				for(var ele in dataStore[item]) {
					count += dataStore[item][ele];
				}
				return {
					name: item,
					y: count,
					color: colors[ix * classes[1].length],
					drilldown: item
				};
			});

			var detailData = [];
			classes[0].forEach(function(item1, ix1) {
				classes[1].forEach(function(item2, ix2) {
					detailData.push({
						name1: item1,
						name2: item2,
						color: colors[ix1 * classes[1].length + ix2],
						y: dataStore[item1][item2]
					});
				});
			});

			var drilldownData = classes[0].map(function(item1, ix) {
				return {
					name: item1,
					id: item1,
					colors: colors.slice(ix * classes[1].length, (ix + 1) * classes[1].length),
					tooltip: {
						headerFormat: '<b>Drilldown</b><br/>' + names[0] + ': <b>{series.name}</b><br>',
						pointFormat: names[1] + ': <b>{point.name}</b><br/>Percentage: <b>{point.percentage:.1f}%</b>'
					},
					data: classes[1].map(function(item2) {
						return [item2, dataStore[item1][item2]];
					})
				};
			});

			graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'pie',
					style: {
						fontFamily: 'Lato'
					}
				},
				title: {
					text: ''
				},
				series: [{
					name: "Overview",
					size: '67%',
					innerSize: '33%',
					cursor: 'pointer',
					data: masterData,
					tooltip: {
						headerFormat: '<b>{series.name}</b><br>',
						pointFormat: names[0] + ': <b>{point.name}</b><br/>Percentage: <b>{point.percentage:.1f}%</b>'
					},
				},{
					name: "Detail",
					size: '100%',
					innerSize: '67%',
					showInLegend: false,
					data: detailData,
					tooltip: {
						headerFormat: '<b>{series.name}</b><br>',
						pointFormat: names[0] + ': <b>{point.name1}</b><br/>' 
							+ names[1] + ': <b>{point.name2}</b><br/>'
							+ 'Percentage: <b>{point.percentage:.1f}%</b>'
					},
				}],
				drilldown: {
					series: drilldownData
				},
				plotOptions: {
					pie: {
						dataLabels: {
							enabled: false
						},
						showInLegend: true,
						point: {
							events: {
								legendItemClick: function(e) {
									if (e.target.drilldown != undefined) {
										e.target.hcEvents.click[0]();
									} 
									else {
										return false;
									}
								}
							}
						}
					}
				},
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

		module.init(renderTo, seriesNames, dataCopy, classesCopy);

	};

	$.fn.dashboard_bivariate_donutchart = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this)[0], "dashboard.bivariate.donutchart") !== undefined) {
        			$.data($(this)[0], "dashboard.bivariate.donutchart")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Donutchart, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));	

