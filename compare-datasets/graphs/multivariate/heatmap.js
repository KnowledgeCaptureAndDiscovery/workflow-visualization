(function($) {

	var Heatmap = function(renderTo, seriesNames, dataCopy) {
		var module = this,
			$div,
			$graph,
			graph,
			$independentScaleCheckbox,
			independentScale,
			$renderCheckbox,
			renderAllData,
			sampleDataThreshold = 600,
			names = [],
			data = [],
			renderer = [];

		module.init = function(renderTo, seriesNames, dataCopy) {
			$div = renderTo;
			$div.data("dashboard.multivariate.heatmap", module);
			names = seriesNames;
			data = dataCopy;

			var $options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".heatmap").remove();
			$options.append("<div class='heatmap'></div>");
			$options = $options.find(".heatmap");
			$options.html($div.find(".plot.options").html());

			$graph = $div.find('.chart.image');
			$independentScaleCheckbox = $options.find('.scale.fitted.toggle.checkbox');
			$renderCheckbox = $options.find('.render.fitted.toggle.checkbox');

			module.reset();
			module.initCheckboxes(data);

			data.forEach(function() {
				renderer.push(null);
			});

			module.render();
		};

		module.initCheckboxes = function() {
			independentScale = $independentScaleCheckbox
								.checkbox("is checked");
			$independentScaleCheckbox.checkbox({
				onChecked: function() {
					independentScale = true;
					module.render();
				},
				onUnchecked: function() {
					independentScale = false;
					module.render();
				}
			});

			renderAllData = true;
			data.forEach(function(singleData) {
				if(!renderAllData) return;
				if(singleData[0].length >= sampleDataThreshold) {
					renderAllData = false;
				}
			});
			var $options = $div.closest(".column").find(".settings.popup .plot.options");
			if(renderAllData) {
				$renderCheckbox.checkbox("set checked");
				$options.find(".render").addClass("hidden");
				$options.find(".render-detail").addClass("hidden");
			}
			else {
				$renderCheckbox.checkbox("set unchecked");
				$options.find(".render").removeClass("hidden");
				$options.find(".render-detail").removeClass("hidden");
				$options.find(".render-detail").css("margin-top", "5px");
				$options.find(".render-detail").css("padding-bottom", "0");
			}
			$renderCheckbox.checkbox({
				onChecked: function() {
					renderAllData = true;
					module.render();
				},
				onUnchecked: function() {
					renderAllData = false;
					module.render();
				}
			});
		};

		module.render = function() {
			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.renderIndividual($div.find(".block-" + ix), singleData, ix);
			});
		}

		module.renderIndividual = function(renderTo, data, dataIndex) {
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

			if(renderer[dataIndex] != null) renderer[dataIndex].invalidate();

			var scales = data.map(function(col, ix) {
				return d3.scaleLinear()
						.domain([d3.min(col), d3.max(col)])
						.range([0, 100]);
			});

			var graphData = data.map(function(col, ix1) {
				return col.map(function(val, ix2) {
					return [ix1, ix2, val];
				});
			});
			graphData = [].concat.apply([], d3.transpose(graphData));

			var scaledData = graphData.map(function(point) {
				var respectiveScale = scales[point[0]];
				return [point[0], point[1], respectiveScale(point[2])];
			});

			graph = new Highcharts.Chart({
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
						text: ''
					},
					categories: names,
					min: 0,
					max: names.length - 1,
					tickInterval: 1
				},
				yAxis: [{
					title: {
						text: 'Data Points'
					},
					labels: {
						enabled: false
					},
					min: 0,
					max: data[0].length - 1,
					startOnTick: false,
					endOnTick: false
				}],
				color: ['#3198f7'],
				colorAxis: {
					stops: [
						[0, '#3060cf'],
		                [0.5, '#fffbbc'],
		                [0.9, '#c4463a'],
		                [1, '#c4463a']
					],
					labels: {
				        formatter: function() {
				        	return this.value + (independentScale? '%': '');
				        }
					}
				},
				legend: {
			        align: 'right',
			        layout: 'vertical',
			        margin: 0,
			        verticalAlign: 'middle'
			    },
				series: [{
					name: "Heatmap",
					borderColor: '#eeeeee',
					data: [],
					turboThreshold: graphData.length + 1
				}],
				tooltip: {
					formatter: function() {
						var perc = scaledData[this.point.x * data[0].length + this.y][2];
						return 'Data Point No. ' + (this.y+1) + '<br/>'
							+	names[this.point.x] + ': <b>' + data[this.point.x][this.y] + '</b><br/>'
							+	'Percentage: <b>' + perc.toFixed(2) + '%</b>';
					}
				},
				credits: {
					enabled: false
				}
			});

			// configure progressive rendering
			var dataToRender = (independentScale? scaledData: graphData);
			if(!renderAllData) dataToRender.splice(sampleDataThreshold * names.length);
			renderer[dataIndex] = renderQueue(function(point) {
				graph.series[0].addPoint(point, false);
			}).redraw(function() {
				graph.yAxis[0].setExtremes(0, Math.floor(renderer[dataIndex].completed() / names.length) - 1);
				graph.redraw();
			}).clear(function() {
				graph.series[0].setData([]);
			}).rate(1000);
			renderer[dataIndex](dataToRender);

		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			renderer.forEach(function(singleRenderer) {
				singleRenderer.invalidate();
			});

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy);

	};

	$.fn.dashboard_multivariate_heatmap = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.multivariate.heatmap") !== undefined) {
        			$.data($(this), "dashboard.multivariate.heatmap")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Heatmap, [null, $(this)].concat(args))));
        	}
        });
    };
	
}(jQuery));