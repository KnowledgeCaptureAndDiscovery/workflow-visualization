(function($) {

	var Bubblechart = function(renderTo, seriesNames, dataCopy) {
	
		var module = this,
			$div,
			$graph,
			graph,
			$renderCheckbox,
			renderAllData = true,
			sampleDataThreshold = 1000,
			graphData = [],
			names = [],
			data = [],
			sampleData = [];

		module.init = function(renderTo, namesCopy, dataCopy) {
			$div = renderTo;
			$div.data("dashboard.trivariate.bubblechart", module);
			data = dataCopy;
			names = namesCopy;
			sampleData = data.map((singleData) => (singleData == null) ? null : singleData.map(function(dataColumn) {
				return dataColumn.slice(0, sampleDataThreshold);
			}));

			var $options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".bubblechart").remove();
			$options.append("<div class='bubblechart'></div>");
			$options = $options.find(".bubblechart");
			$options.html($div.find(".plot.options").html());

			$renderCheckbox = $options.find('.render.fitted.toggle.checkbox');
			$graph = $div.find('.chart.image');	

			module.reset();
			module.initCheckbox();

			module.render();
		};

		module.render = function() {
			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			var dataToRender = renderAllData? data: sampleData;
			dataToRender.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.renderIndividual($div.find(".block-" + ix), singleData, names);
			});
		};

		module.renderIndividual = function(renderTo, dataToShow, names) {
			if(dataToShow == null) {
				renderTo.showNoData();
				return;
			}

			graphData = dataToShow[0].map(function(val, ix) {
				return {
					x: parseFloat(dataToShow[0][ix].toFixed(3)), 
					y: parseFloat(dataToShow[1][ix].toFixed(3)), 
					z: parseFloat(dataToShow[2][ix].toFixed(3))
				};
			});

			graph = new Highcharts.Chart({
				chart: {
					renderTo: renderTo.get(0),
					type: 'bubble',
					zoomType: 'xy',
					style: {
						fontFamily: 'Lato'
					}
				},
				colors: ['#3198f7'],
				title: {
					text: ''
				},
				xAxis: {
					gridLineWidth: 1,
					title: {
						enabled: true,
						text: names[0]
					}
				},
				yAxis: {
					title: {
						text: names[1]
					}
				},
				tooltip: {
					headerFormat: '<b>Data Point</b><br>',
					pointFormat: names[0] + ': <b>{point.x}</b>'
						+ '<br/>'
						+ names[1] + ': <b>{point.y}</b>'	
						+ '<br/>'
						+ names[2] + ': <b>{point.z}</b>'	
				},
				series: [{
					data: graphData
				}],
				credits: {
				  enabled: false
				},
				plotOptions: {
					bubble: {
						maxSize: '10%'
					}
				},
				legend: {
				  enabled: false
				}
			});
		};

		module.initCheckbox = function() {
			var $options = $div.closest(".column").find(".settings.popup .plot.options");
			data.forEach(function(singleData) {
				if(!renderAllData || singleData == null) return;
				else if(d3.transpose(singleData).length >= sampleDataThreshold) {
					renderAllData = false;
					$renderCheckbox.checkbox("set unchecked");
					$options.find(".render").removeClass("hidden");
					$options.find(".render-detail").removeClass("hidden");
					$options.find(".render-detail").css("margin-top", "5px");
					$options.find(".render-detail").css("padding-bottom", "0");
				}
			});

			if(renderAllData) {
				$renderCheckbox.checkbox("set checked");
				$options.find(".render").addClass("hidden");
				$options.find(".render-detail").addClass("hidden");
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

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$graph.html("");
		};

		module.init(renderTo, seriesNames, dataCopy);
	};

	$.fn.dashboard_trivariate_bubblechart = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "dashboard.univariate.bubblechart") !== undefined) {
        			$.data($(this), "dashboard.univariate.bubblechart")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Bubblechart, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));