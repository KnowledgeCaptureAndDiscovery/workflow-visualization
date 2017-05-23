var Basic = (function(Dashboard, $) {
	var module 	= Dashboard.basic = Dashboard.basic || {},
		$div,
		$colSummary,
		$checkbox,
		$summaryTable,
		data;

	module.init = function(renderTo, dataCopy) {
		module.reset();

		$div = renderTo;
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
		
		data = {};

		$div.find(".col-count").find(".value").html('-');
		$div.find(".row-count").find(".value").html('-');

		$colSummary.html("");
	};

	return Dashboard;

}(Dashboard || {}, jQuery));