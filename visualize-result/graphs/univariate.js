var Univariate = (function(Dashboard, $) {

	var module = Dashboard.univariate = Dashboard.univariate || {},
		$div,
		$dropdown,
		$menu,
		data = {},
		plotTypes = [];

	module.init = function(renderTo, dataCopy) {
		$div = renderTo;
		data = dataCopy;
		$dropdown = $div.find(".fluid.dropdown");
		$menu = $div.find(".has-menu").find(".menu");
		
		$menu.find("a.item").each(function() { 
			plotTypes.push($(this).html().toLowerCase().replace(/\s+/g, '-')); 
		});

		$menu.find("a.item").each(function() {
			$(this).click(function() {
				var shownItem = $(this).html().toLowerCase().replace(/\s+/g, '-');

				$menu.find(".active.item").removeClass("active");
				$(this).addClass("active");
				
				plotTypes.forEach(function(type) {
					$div.find("." + type).addClass("hidden");
				});
				$div.find("." + shownItem).removeClass("hidden");
			});
		});

		var getType = function(type) {
			if(type["type"] == "numeric") {
				return "numeric";
			}
			else if(type["type"] == "nominal") {
				return "nominal";
			}
			else {
				return "others";
			}
		}
		
		var columnOptions = "";
		var firstAvailableIx = -1;
		for(ix in data["attribute"]) {
			var type = data["attribute"][ix]["type"];
			if(getType(type) != "others") {
				// set first available index if necessary
				if(firstAvailableIx == -1) firstAvailableIx = ix;

				// populate column selection dropdown
				$dropdown.append($("<option>")
					.attr("value",ix)
					.text(data["attribute"][ix]["name"]));
			}
		}

		if(firstAvailableIx != -1) {
			var updateChart = function() {
				var ix = ($dropdown.dropdown("get value"))[0];
				module.initAllGraphsWithNames(
					getType(data["attribute"][ix]["type"]),
					ix
				);
			}

			// define dropdown action events
			$div.find(".fluid.dropdown").dropdown("setting", "onChange", function() {
				updateChart();
			});

			$dropdown.dropdown("set selected", firstAvailableIx);

			updateChart();

			$div.removeClass("hidden");
		}
		else {
			console.log("No univariate graph to show");
			$div.addClass("hidden");
		}
	};

	module.initAllGraphsWithNames = function(type, ix) {
		// obtain modules that needs rendering
		var names = [];
		var columnData = module.getColumn(ix);
		if(type == "numeric") {
			names = ["box-plot", "histogram"];
		}
		else if(type == "nominal") {
			names = ["pie-chart", "column-chart"];
		}
		else {
			return;
		}

		// initialize necessary modules
		names.forEach(function(name) {
			var moduleName = name.replace("-", "");
			if(type == "numeric") {
				module[moduleName].init(
					$div.find("." + name), 
					columnData
				);
			}
			else {
				module[moduleName].init(
					$div.find("." + name), 
					columnData, 
					data["attribute"][ix]["type"]["oneof"]
				);
			}
		});

		function toTitleCase(str) {
			return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}

		// toggle show and hide
		plotTypes.forEach(function(type) {
			var typeName = toTitleCase(type.replace('-', ' '));
			if(names.indexOf(type) != -1) {
				$div.find("." + type).removeClass("hidden");
				$menu.find("a.item:contains('" + typeName + "')").removeClass("hidden");
			}
			else {
				$div.find("." + type).addClass("hidden");
				$menu.find("a.item:contains('" + typeName + "')").addClass("hidden");
			}
		});

		// set tab status
		var $activeItem = $menu.find(".active.item");
		if(names.indexOf($activeItem.html().toLowerCase()) == -1) {
			var typeToActivate = names[0];
			var firstVisibleType = toTitleCase(typeToActivate.replace('-', ' '));
			$menu.find("a.item:contains('" + firstVisibleType + "')").click();
		}
		else {
			$activeItem.click();
		}
	};

	module.getColumn = function(ix) {
		return data["data"].map(function(val) {
			return val[data["attribute"][ix]["name"]];
		});
	};

	module.reset = function() {
		// if init has not been run, do nothing
		if(!$div) return;

		data = {};
		$div.find(".col-dropdown").html(""
			+ "<select class='ui fluid dropdown'>"
			+   "<option value=''>Select Columns</option>"
			+ "</select>"
		);

		plotTypes.forEach(function(name) {
			name = name.replace("-", "");
			if(module[name]) {
				module[name].reset();
			}
		});
	};

	return module;

}(Dashboard || {}, jQuery));