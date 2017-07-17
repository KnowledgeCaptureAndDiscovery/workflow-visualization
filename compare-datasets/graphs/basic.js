(function($) {

	var Basic = function(renderTo, dataCopy) {

		var module = this,
			$div;

		module.init = function(renderTo, dataCopy) {
			$div = renderTo;
			$div.data("module-data", module);
			var data = dataCopy;

			module.reset();

			var $content = $div.find(".content").last();
			$content.html("<div class='ui " + numberToEnglish(data.length) + " column grid'></div>");
			data.forEach(function(singleData, ix) {
				$div.find(".grid").append($("<div>").addClass("block-" + ix).addClass("column"));
				module.render($div.find(".block-" + ix), singleData);
			});

			// init popup
			$div.find(".right.floated.meta").find(".link.icon").popup({
				popup: $div.find(".ui.settings.popup"),
				on: "click",
				position: "bottom right",
				variation: "wide"
			});

			$div.removeClass("hidden");
		};

		module.render = function(renderTo, data) {
			var attributeLen = data["attribute"].length;
			var dataLen = data["data"].length;

			renderTo.html("<div class='ui one statistics'></div>");
			renderTo.html(renderTo.html() + "<div class='ui invisible divider'></div>" + renderTo.html());
			renderTo.find("div").first()
				.append($("<div>").addClass("ui statistic col-count"));
			renderTo.find("div").last()
				.append($("<div>").addClass("ui statistic row-count"));
			renderTo.find(".statistic").each(function() {
				var labelName = ($(this).hasClass("col-count")) ? "Columns" : "Data Points";
				$(this)
					.append($("<div>").addClass("value").text("-"))
					.append($("<div>").addClass("label").text(labelName));
			});

			var $col = renderTo.find(".col-count");
			var $row = renderTo.find(".row-count");

			$col.find(".value").html('' + attributeLen);
			if(attributeLen > 1) {
				$col.find(".label").html('Columns');
			}
			else {
				$col.find(".label").html('Column');
			}

			$row.find(".value").html('' + dataLen);
			if(dataLen > 1) {
				$row.find(".label").html('Data Points');
			}
			else {
				$row.find(".label").html('Data Point');
			}
		};

		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$div.find(".col-count").each(function() {
				$(this).find(".value").html('-');
			});
			$div.find(".row-count").each(function() {
				$(this).find(".value").html('-');
			});
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