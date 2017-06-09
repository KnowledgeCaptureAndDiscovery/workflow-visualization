(function($) {

	var Bubblechart = function(renderTo, seriesNames, dataCopy) {
	
		var module = this,
			$div,
			$graph,
			graph,
			graphData = [],
			names = [],
			data = [];

		module.init = function(renderTo, seriesNames, dataCopy) {
			$div = renderTo;
			$div.data("dashboard.trivariate.bubblechart", module);
			names = seriesNames;
			data = dataCopy;
			$graph = $div.find('.chart.image');	

			module.reset();

			graphData = data[0].map(function(val, ix) {
				return {x: data[0][ix], y: data[1][ix], z: data[2][ix]};
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
				legend: {
				  enabled: false
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