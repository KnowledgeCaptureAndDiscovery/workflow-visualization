(function($) {

	var Basic = function(renderTo, dataCopy) {

		var module = this,
			$div,
			$colSummary,
			$checkbox,
			$summaryTable,
			data;

		module.init = function(renderTo, dataCopy) {
			$div = renderTo;
			$div.data("module-data", module);
			$colSummary = $div.find("tbody.col-type");
			$checkbox = $div.find('.fitted.toggle.checkbox');
			$summaryTable = $div.find(".unstackable.table");
			data = dataCopy;

			$checkbox.checkbox({
				onChecked: function() {
					$summaryTable.removeClass("hidden");
				},
				onUnchecked: function() {
					$summaryTable.addClass("hidden");
				}
			});

			module.reset();
			module.render();
		};

		module.render = function() {
			var attributeLen = data["attribute"].length;
			var dataLen = data["data"].length;

			$div.find(".col-count").find(".value").html('' + attributeLen);
			if(attributeLen > 1) {
				$div.find(".col-count").find(".label").html('Columns');
			}
			else {
				$div.find(".col-count").find(".label").html('Column');
			}

			$div.find(".row-count").find(".value").html('' + dataLen);
			if(dataLen > 1) {
				$div.find(".row-count").find(".label").html('Data Points');
			}
			else {
				$div.find(".row-count").find(".label").html('Data Point');
			}

			for(var ix in data["attribute"]) {
				var typeStr = data["attribute"][ix]["type"]["type"];
				$colSummary.append("<tr><td>" 
					+ data["attribute"][ix]["name"]
					+ "</td><td>" 
					+ typeStr
					+ "</td></tr>"
				);
			}

			$div.removeClass("hidden");

			$checkbox.checkbox("uncheck");
			$summaryTable.addClass("hidden");
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$div.find(".col-count").find(".value").html('-');
			$div.find(".row-count").find(".value").html('-');

			$colSummary.html("");
		};

		module.description = function() {
			return "Basic Information";
		}

		module.init(renderTo, dataCopy);

	};

	$.fn.dashboard_basic = function () {
        var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "module-data") !== undefined) {
        			$.data($(this), "module-data")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
            	Basic.apply(null, [$(this)].concat(args));
        	}
        });
    };

}(jQuery));