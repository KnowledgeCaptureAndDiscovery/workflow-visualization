var Bivariate = (function(Dashboard, $) {

	var module = Dashboard.bivariate = Dashboard.bivariate || {},
		$div,
		$dropdown1,
		$dropdown2,
		$menu,
		data = {},
		plotTypes = [];

	module.init = function(renderTo, dataCopy) {
		$div = renderTo;
		data = dataCopy;
		$dropdown1 = $div.find(".col-dropdown").find(".fluid.dropdown").first();
		$dropdown2 = $div.find(".col-dropdown").find(".fluid.dropdown").last();
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
		};

		var updateChart = function() {
			var ix1 = ($dropdown1.dropdown("get value"))[0];
			var ix2 = ($dropdown2.dropdown("get value"))[0];
			module.initGraphs(
				getType(data["attribute"][ix1]["type"]),
				getType(data["attribute"][ix2]["type"]),
				ix1,
				ix2
			);

			$dropdown1.dropdown().find(".menu").find(".item").each(function() { $(this).removeClass("disabled"); });
			$dropdown1.dropdown().find(".menu").find(".item[data-value='" + $dropdown2.dropdown("get value")[0] + "']")
				.addClass("disabled");

			$dropdown2.dropdown().find(".menu").find(".item").each(function() { $(this).removeClass("disabled"); });
			$dropdown2.dropdown().find(".menu").find(".item[data-value='" + $dropdown1.dropdown("get value")[0] + "']")
				.addClass("disabled");
		};

		var $switchBtn = $div.find(".switch.icon");
		$switchBtn.hover(function() { $(this).css("cursor", "pointer"); });
		$switchBtn.on("click", function() {
			var tempSel = $dropdown1.dropdown("get value");
			$dropdown1.dropdown("set value", $dropdown2.dropdown("get value"));
			$dropdown2.dropdown("set value", tempSel);
			updateChart();
		});
		
		var columnOptions = "";
		var availableIx = [];
		for(ix in data["attribute"]) {
			var type = data["attribute"][ix]["type"];
			if(getType(type) != "others") {
				// set first available index if necessary
				availableIx.push(ix);

				// populate column selection dropdown
				$dropdown1.append($("<option>")
					.attr("value",ix)
					.text(data["attribute"][ix]["name"]));
			}
			$dropdown2.html($dropdown1.html());
		}

		if(availableIx.length >= 2) {
			// define dropdown action events
			$div.find(".col-dropdown").find(".fluid.dropdown").dropdown("setting", "onChange", function() {
				updateChart();
			});

			$dropdown1.dropdown("set selected", availableIx[0]);
			$dropdown2.dropdown("set selected", availableIx[1]);

			updateChart();

			$div.removeClass("hidden");
		}
		else {
			console.log("No bivariate graph to show");
			$div.addClass("hidden");
		}
	};

	module.initGraphs = function(type1, type2, ix1, ix2) {
		// obtain modules that needs rendering
		var names = [];
		var type = type1 + "-" + type2;
		var columnData1 = module.getColumn(ix1);
		var columnData2 = module.getColumn(ix2);

		if(type == "numeric-numeric") {
			names = ["scatter-plot"];
		}
		else if(type == "nominal-nominal") {
			names = ["stacked-column-chart"];
		}
		else if(type == "nominal-numeric") {
			names = ["line-chart"];
		}
		else if(type == "numeric-nominal") {
			names = ["stacked-histogram"];
		}
		else {
			return;
		}

		// initialize necessary modules
		names.forEach(function(name) {
			var moduleName = name.replace(/-/g,"");
			if(type == "numeric-numeric") {
				module[moduleName].init(
					$div.find("." + name), 
					[data["attribute"][ix1]["name"], data["attribute"][ix2]["name"]],
					[columnData1, columnData2]
				);
			}
			else if(type == "nominal-nominal") {
				module[moduleName].init(
					$div.find("." + name), 
					[data["attribute"][ix1]["name"], data["attribute"][ix2]["name"]],
					[columnData1, columnData2],
					[data["attribute"][ix1]["type"]["oneof"], data["attribute"][ix2]["type"]["oneof"]]
				);
			}
			else if(type == "nominal-numeric") {
				module[moduleName].init(
					$div.find("." + name), 
					[data["attribute"][ix1]["name"], data["attribute"][ix2]["name"]],
					[columnData1, columnData2],
					data["attribute"][ix1]["type"]["oneof"]
				);
			}
			else if(type == "numeric-nominal") {
				module[moduleName].init(
					$div.find("." + name), 
					[data["attribute"][ix1]["name"], data["attribute"][ix2]["name"]],
					[columnData1, columnData2],
					data["attribute"][ix2]["type"]["oneof"]
				);
			}
		});

		function toTitleCase(str) {
			return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}

		// toggle show and hide
		plotTypes.forEach(function(type) {
			var typeName = toTitleCase(type.replace(/-/g, " "));
			if(names.indexOf(type) != -1) {
				$div.find("." + type).removeClass("hidden");
				$menu.find("a.item:contains('" + typeName + "')").removeClass("hidden");
			}
			else {
				$div.find("." + type).addClass("hidden");
				$menu.find("a.item:contains('" + typeName.replace(/-/g, " ") + "')").addClass("hidden");
			}
		});

		// set tab status
		var $activeItem = $menu.find(".active.item");
		if(names.indexOf($activeItem.html().toLowerCase()) == -1) {
			var typeToActivate = names[0];
			var firstVisibleType = toTitleCase(typeToActivate.replace(/-/g, " "));
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
			+ "<div class='ui horizontal divider'><i class='resize vertical switch icon'></i></div>"
			+ "<select class='ui fluid dropdown'>"
			+   "<option value=''>Select Columns</option>"
			+ "</select>"
		);

		plotTypes.forEach(function(name) {
			name = name.replace(/-/g,"");
			if(module[name]) {
				module[name].reset();
			}
		});
	};

	return module;

}(Dashboard || {}, jQuery));