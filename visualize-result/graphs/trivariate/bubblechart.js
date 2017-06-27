(function($) {

	var Bubblechart = function(renderTo, seriesNames, dataCopy) {
	
		var module = this,
			$div,
			$graph,
			graph,
			$renderCheckbox,
			renderAllData,
			sampleDataThreshold = 2000,
			graphData = [],
			names = [],
			data = [],
			sampleData = [];

		module.init = function(renderTo, seriesNames, dataCopy) {
			$div = renderTo;
			$div.data("dashboard.trivariate.bubblechart", module);
			names = seriesNames;
			data = dataCopy;
			sampleData = d3.transpose(d3.transpose(data).slice(0, sampleDataThreshold));
			$renderCheckbox = $div.find('.render.fitted.toggle.checkbox');
			$graph = $div.find('.chart.image');	

			module.reset();
			module.initCheckbox();

			var dataToShow = module.dataToRender();
			graphData = dataToShow[0].map(function(val, ix) {
				return {
					x: parseFloat(dataToShow[0][ix].toFixed(3)), 
					y: parseFloat(dataToShow[1][ix].toFixed(3)), 
					z: parseFloat(dataToShow[2][ix].toFixed(3))
				};
			});

			graph = new Highcharts.Chart({
				chart: {
					renderTo: $graph.get(0),
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
			if(d3.transpose(data).length < sampleDataThreshold) {
				renderAllData = true;
				$renderCheckbox.checkbox("set checked");
				$div.find(".render").addClass("hidden");
				$div.find(".render-detail").addClass("hidden");
			}
			else {
				renderAllData = false;
				$renderCheckbox.checkbox("set unchecked");
				$div.find(".render").removeClass("hidden");
				$div.find(".render-detail").removeClass("hidden");
				$div.find(".render-detail").css("margin-top", "5px");
				$div.find(".render-detail").css("padding-bottom", "0");
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

		module.dataToRender = function() {
			return (renderAllData? data: sampleData);
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