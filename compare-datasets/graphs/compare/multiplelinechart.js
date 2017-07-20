(function($) {

	var Multiplelinechart = function(renderTo, namesCopy, dataCopy, typesCopy) {
		var module = this,
			$div,
			$graph,
			$reduceOptions,
			$reduceDropdown,
			data = [],
			names = [],
			types = [],
			graph = [];

		module.init = function(renderTo, namesCopy, dataCopy, typesCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.compare.multiplelinechart", module);
			$graph = $div.find(".chart.image");
			names = namesCopy;
			data = dataCopy;
			types = typesCopy;

			$options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".histogram").remove();
			$options.append("<div class='histogram'></div>");
			$options = $options.find(".histogram");
			$options.html($div.find(".plot.options").html());

			$reduceOptions = $options.find(".reduce.options");
			$reduceDropdown = $reduceOptions.find(".dropdown");

			module.reset();
			module.render();
		};

		module.render = function() {
			var noData = false;
			data.forEach(function(singleData) {
				if(noData) return;
				if(singleData[0] == null) {
					noData = true;
				}
			});
			if(noData) {
				renderTo.showNoData();
				return;
			}

			module.hideReduceOptions();

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.renderIndividual($div.find(".block-" + ix), singleData, types[ix]);
			});
		};

		module.renderIndividual = function(renderTo, data, types) {
			var noData = false;
			data.forEach(function(singleData) {
				if(noData) return;
				if(singleData[0] == null) {
					noData = true;
				}
			});
			if(noData) {
				renderTo.showNoData();
				return;
			}

			data = d3.transpose(data).sort(function(a, b) {
				if(typesCopy[0] == "numeric" ||  typesCopy[0] == "discrete") {
					return a[0] - b[0];
				}
				else {
					return (a[0] > b[0])? 1 : -1;
				}
			});
			types = typesCopy;

			var duplicateExists = module.checkDuplicate((d3.transpose(data))[0]);
			if(duplicateExists) {
				module.showReduceOptions();
				data = module.groupData(data);
			}

			module.plot(renderTo, names, data, types, duplicateExists);
		};

		module.checkDuplicate = function(arr) {
			return arr.length != new Set(arr).size;
		};

		module.showReduceOptions = function() {
			$reduceOptions.show();
			$reduceDropdown.dropdown({
				onChange: function() {
					module.render();
				}
			});
		};

		module.hideReduceOptions = function() {
			$reduceOptions.hide();
		};

		module.groupData = function(dataWithDuplicate) {
			var groupedData = [];
			var index = -1;
			dataWithDuplicate.forEach(function(row) {
				if(index == -1 || row[0] != groupedData[index][0]) {
					groupedData.push([row[0], []]);
					index++;
				}
				row.shift();
				groupedData[index][1].push(row);
			});
			groupedData.forEach(function(row) {
				row[1] = d3.transpose(row[1]);
			});
			console.log(groupedData);
			return groupedData;
		};

		module.plot = function(renderTo, names, data, types, duplicate = true) {
			if(types[0] == "nominal") {
				module.plotOrdinalData(renderTo, names, data, types, duplicate);
			}
			else {
				module.plotLinearData(renderTo, names, data, types, duplicate);
			}
		}

		module.plotLinearData = function(renderTo, names, data, types, duplicate) {
			var dataToBeProcessed = data;
			var graphData = [];
			if(duplicate) {
				var dropdownOption = $reduceDropdown.dropdown("get value")[0];
				dataToBeProcessed = data.map(function(xCategory) {
					var flattenedData = xCategory[1].map(function(values) {
						return d3[dropdownOption](values);
					})
					flattenedData.unshift(xCategory[0]);
					return flattenedData;
				});
			}
			for(var ix = 1; ix < dataToBeProcessed[0].length; ix++) {
				graphData.push(dataToBeProcessed.map(function(row) {
					return [row[0], row[ix]];
				}));
			}
			graphData = graphData.map(function(series, ix) {
				return {
					name: names[ix + 1],
					type: 'line',
					data: series
				};
			});
			var dropdownText = "";
			if(duplicate) {
				dropdownText = $reduceDropdown.dropdown("get text")[0];
			}
			var graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'line',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: (function () {
					var colors = [],
						base = '#3198f7',
						i,
						len = names.length - 1;

					for (i = 0; i < len; i += 1) {
						colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
					}
					
					return colors;
				}()),
				title: { text: '' },
				xAxis: { title: { text: names[0] } },
				yAxis: { 
					title: { 
						text: (duplicate) ? dropdownText : "Value"
					} 
				},
				series: graphData,
				tooltip: {
					formatter: function() {
						return names[0] + ': <b>' + this.x + '</b>'
						+ '<br>'
						+ ((duplicate) ? (dropdownText + " of ") : "")
						+ this.series.name + ': <b>' + this.y.toFixed(2) + '</b>'
					}
				},
				credits: {
				  enabled: false
				}
			});
		};

		module.plotOrdinalData = function(renderTo, names, data, types, duplicate) {
			var dataToBeProcessed = data;
			var graphData = [];
			if(duplicate) {
				var dropdownOption = $reduceDropdown.dropdown("get value")[0];
				dataToBeProcessed = data.map(function(xCategory) {
					var flattenedData = xCategory[1].map(function(values) {
						return d3[dropdownOption](values);
					})
					flattenedData.unshift(xCategory[0]);
					return flattenedData;
				});
			}
			dataToBeProcessed = d3.transpose(dataToBeProcessed);
			dataToBeProcessed.splice(0, 1);
			graphData = dataToBeProcessed.map(function(series, ix) {
				return {
					name: names[ix + 1],
					type: 'line',
					data: series
				}
			});
			var categories = data.map(function(series) { return series[0]; });
			var dropdownText = "";
			if(duplicate) {
				dropdownText = $reduceDropdown.dropdown("get text")[0];
			}
			var graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'line',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: (function () {
					var colors = [],
						base = '#3198f7',
						i,
						len = names.length - 1;

					for (i = 0; i < len; i += 1) {
						colors.push(Highcharts.Color(base).brighten((i - len / 2) / (len / 2 + 2)).get());
					}
					
					return colors;
				}()),
				title: { text: '' },
				xAxis: { 
					categories: categories,
					title: {
						text: names[0]
					} 
				},
				yAxis: { 
					title: { 
						text: (duplicate) ? dropdownText : "Value"
					} 
				},
				series: graphData,
				tooltip: {
					formatter: function() {
						return names[0] + ': <b>' + this.x + '</b>'
						+ '<br>'
						+ ((duplicate) ? (dropdownText + " of ") : "")
						+ this.series.name + ': <b>' + this.y.toFixed(2) + '</b>'
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

		module.init(renderTo, namesCopy, dataCopy, typesCopy);
	};

	$.fn.dashboard_compare_multiplelinechart = function () {
		var args = Array.prototype.slice.call(arguments);
		return this.each(function () {
			if(typeof args[0] == "string") {
				if($.data($(this)[0], "dashboard.compare.multiplelinechart") !== undefined) {
					$.data($(this)[0], "dashboard.compare.multiplelinechart")[args[0]].apply(null, args.slice(1));
				}
			}
			else {
				(new (Function.prototype.bind.apply(Multiplelinechart, [null, $(this)].concat(args))));
			}
		});
	};

}(jQuery));