(function($) {

	var Multiplelinechart = function(renderTo, namesCopy, dataCopy, typesCopy) {
		var module = this,
			$div,
			$graph,
			data = [],
			names = [],
			types = [],
			graph = [];

		module.init = function(renderTo, namesCopy, dataCopy, typesCopy) {
			$div = renderTo;
			$.data($div[0], "dashboard.compare.multiplelinechart", module);
			$graph = $div.find(".chart");
			names = namesCopy;
			data = dataCopy;
			types = typesCopy;

			
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