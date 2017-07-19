(function($) {

	var Parallelcoordinate = function(renderTo, seriesNames, dataCopy, datatypes) {

		var module = this,
			$div,
			renderAllData,
			sampleDataThreshold = 2000;

		module.init = function(renderTo, names, data, datatypes) {
			$div = renderTo;
			$div.data("dashboard.multivariate.parallelcoordinate", module);

			var $options = $div.closest(".column").find(".settings.popup .plot.options");
			$options.find(".parallel-coordinate").remove();
			$options.append("<div class='parallel-coordinate'></div>");
			$options = $options.find(".parallel-coordinate");
			$options.html($div.find(".plot.options").html());

			$renderCheckbox = $options.find('.render.fitted.toggle.checkbox');

			module.initCheckbox(data);

			$div.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				$div.find(".block-" + ix).dashboard_multivariate_parallelcoordinategraph(
					names, singleData, datatypes
				)
			});
		};

		module.initCheckbox = function(data) {
			renderAllData = true;
			data.forEach(function(singleData) {
				if(!renderAllData || singleData == null) return;
				if(singleData.length >= sampleDataThreshold) {
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
		};

		module.init(renderTo, seriesNames, dataCopy, datatypes);

	};
	
	$.fn.dashboard_multivariate_parallelcoordinate = function () {
		var args = Array.prototype.slice.call(arguments);
		return this.each(function () {
			if(typeof args[0] == "string") {
				if($.data($(this), "dashboard.multivariate.parallelcoordinate") !== undefined) {
					$.data($(this), "dashboard.multivariate.parallelcoordinate")[args[0]].apply(null, args.slice(1));
				}
			}
			else {
				(new (Function.prototype.bind.apply(Parallelcoordinate, [null, $(this)].concat(args))));
			}
		});
	};
	
}(jQuery));