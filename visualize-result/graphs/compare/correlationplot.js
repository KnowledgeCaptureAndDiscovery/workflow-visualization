(function($) {

	var CorrelationPlot = function(renderTo, namesCopy, dataCopy, typesCopy) {
	
		var module = this,
			$div,
			$graph,
			data = [],
			names = [],
			types = [];

		module.init = function(renderTo, namesCopy, dataCopy, typesCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.compare.correlationplot", module);
			$graph = $div.find(".chart");
			names = namesCopy;
			console.log(dataCopy);
			data = dataCopy;
			types = typesCopy;

			module.reset();

			var dists = [];
			for(var i = 0; i < names.length; i++) {
				var tempArr = [];
				for(var j = 0; j < names.length; j++) {
					var singleCorrelation;
					if(i > j) {
						singleCorrelation = 1 - dists[j][i];
					}
					else if(i == j) {
						singleCorrelation = 1;
					}
					else {
						singleCorrelation = Math.abs(module.pearsonCorrelation(data, i, j));
					}
					var dist = 1 - singleCorrelation;
					tempArr.push(dist);
				}
				dists.push(tempArr);
			}

			// FOR DEBUG
			// console.log(dists);

			mdsjs.landmarkMDSAsync(mdsjs.convertToMatrix(dists), 2, function(points) {
				var plotData = [];
				var ix = 0;
				points.rowsIter(function(row) {
					plotData.push({
						x: row[0],
						y: row[1],
						name: names[ix]
					});
					ix++;
				});

				// FOR DEBUG
				// console.log(plotData);

				module.render(plotData);
			});
		};

		module.render = function(plotData) {
			var graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
					type: 'scatter',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: ['#3198f7'],
				title: {
					text: ''
				},
				xAxis: {
					tickInterval: 0.2,
					gridLineWidth: 1,
					labels: {
						enabled: false
					}
				},
				yAxis: {
					tickInterval: 0.2,
					title: {
						text: ''
					},
					labels: {
						enabled: false
					}
				},
				series: [{
					data: plotData
				}],
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				plotOptions: {
					series: {
						dataLabels: {
							enabled: true,
							format: '{point.name}'
						}
					}
				},
				tooltip: {
					formatter: function() {
						return '<b>' + this.point.name + '</b>';
					}
				}
			});
		}

		module.pearsonCorrelation = function(prefs, p1, p2) {
			var si = [];

			for (var key in prefs[p1]) {
				if (prefs[p2][key]) si.push(key);
			}

			var n = si.length;

			if (n == 0) return 0;

			var sum1 = 0;
			for (var i = 0; i < si.length; i++) sum1 += prefs[p1][si[i]];

			var sum2 = 0;
			for (var i = 0; i < si.length; i++) sum2 += prefs[p2][si[i]];

			var sum1Sq = 0;
			for (var i = 0; i < si.length; i++) {
				sum1Sq += Math.pow(prefs[p1][si[i]], 2);
			}

			var sum2Sq = 0;
			for (var i = 0; i < si.length; i++) {
				sum2Sq += Math.pow(prefs[p2][si[i]], 2);
			}

			var pSum = 0;
			for (var i = 0; i < si.length; i++) {
				pSum += prefs[p1][si[i]] * prefs[p2][si[i]];
			}

			var num = pSum - (sum1 * sum2 / n);
			var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) *
				(sum2Sq - Math.pow(sum2, 2) / n));

			if (den == 0) return 0;

			return num / den;
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("Loading...");
			$graph.css("height", "400px").css("line-height", "400px").css("color", "gray");
		};

		module.init(renderTo, namesCopy, dataCopy, typesCopy);
	};

	$.fn.dashboard_compare_correlationplot = function () {
		var args = Array.prototype.slice.call(arguments);
		return this.each(function () {
			if(typeof args[0] == "string") {
				if($.data($(this)[0], "dashboard.compare.correlationplot") !== undefined) {
					$.data($(this)[0], "dashboard.compare.correlationplot")[args[0]].apply(null, args.slice(1));
				}
			}
			else {
				(new (Function.prototype.bind.apply(CorrelationPlot, [null, $(this)].concat(args))));
			}
		});
	};

}(jQuery));

