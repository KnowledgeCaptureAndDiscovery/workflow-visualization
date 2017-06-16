(function($) {

	function Bivariate(renderTo, dataCopy) {

		/* Private Variables */
		var module = this,
			$div,
			$dropdown1,
			$dropdown2,
			$menu,
			ix = [],
			data = {},
			plotTypes = [];

		/* Helper Functions */

		// @brief	converts display string to strings used as div names
		// @param	str 	input string
		// @return 	converted string
		var displayToEncoding = function(str) {
			return str.toLowerCase().replace(/\s+/g, '-');
		};

		// @brief	converts div string names to display string
		// @param	str 	input string
		// @return	converted string
		var encodingToDisplay = function(str) {
			return str.replace(/\w\S*/g, function(txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		};

		// @brief	converts column type name to a format easier to work with
		// @param	type 	name of a column type
		// @return	converted column type
		var getType = function(type) {
			if(type["type"] == "numeric" || type["type"] == "nominal") {
				return type["type"];
			}
			else if(type["type"] == "discrete") {
				return "nominal";
			}
			else {
				return "others";
			}
		};

		/* Member Functions */

		// @brief	initialization code
		// @param	renderTo	the jQuery div object 
		//						that the module is rendered to
		// @param	dataCopy	the data used in the visualization 
		//						(data is shallow copied)
		module.init = function(renderTo, dataCopy) {
			$div = renderTo;
			$div.data("module-data", module);
			data = dataCopy;

			module.reset();

			$dropdown1 = $div.find(".col-dropdown").find(".fluid.dropdown").first();
			$dropdown2 = $div.find(".col-dropdown").find(".fluid.dropdown").last();
			$menu = $div.find(".has-menu").find(".menu");

			module.initPlotTypes();

			module.initSwitchButton();

			var availableIx = module.initGraphOptionDropdown();

			if(availableIx.length >= 2) {
				// define dropdown action events
				$div.find(".col-dropdown").find(".fluid.dropdown").dropdown("setting", "onChange", function() {
					module.render();
				});

				$dropdown1.dropdown("set selected", availableIx[0]);
				$dropdown2.dropdown("set selected", availableIx[1]);

				module.render();

				$div.removeClass("hidden");
			}
			else {
				console.log("No bivariate graph to show");
				$div.addClass("hidden");
			}
		};

		// @brief	extract plot types from html and add click event handlers
		module.initPlotTypes = function() {
			$menu.find("a.item").each(function() {
				plotTypes.push(displayToEncoding($(this).html()));

				$(this).click(function() {
					var shownItem = displayToEncoding($(this).html());

					$menu.find(".active.item").removeClass("active");
					$(this).addClass("active");
					
					plotTypes.forEach(function(type) {
						$div.find("." + type).addClass("hidden");
					});
					$div.find("." + shownItem).removeClass("hidden");
				});
			});
		};

		// @brief	initialize click event handler for switch button
		module.initSwitchButton = function() {
			var $switchBtn = $div.find(".switch.icon");
			$switchBtn.hover(function() { $(this).css("cursor", "pointer"); });
			$switchBtn.on("click", function() {
				var tempSel = $dropdown1.dropdown("get value");
				$dropdown1.dropdown("set value", $dropdown2.dropdown("get value"));
				$dropdown2.dropdown("set value", tempSel);
				module.render();
			});
		};

		// @brief	populate graph option dropdown based on column data types
		// @return	column indices that are shown in the dropdown
		module.initGraphOptionDropdown = function() {
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
			return availableIx;
		};

		// @brief	delete bad data in a numeric data column
		//			add bad data notice in the module
		// @param	columnData	the column data to be trimmed
		// @param	types 		data types of the 2 columns
		// @return	trimmed column data
		module.trimBadData = function(columnData, types) {
			var $missingNotice = $div.find(".missing-notice");

			if(types[0] != "numeric" && types[1] != "numeric") {
				$missingNotice.addClass("hidden");
			}

			else {
				columnData = d3.transpose(columnData);

				var originalLength = columnData.length;

				if(types[0] == "numeric") {
					columnData = columnData.filter(function(val) {
						return (typeof val[0] === 'number');
					});
				}

				if(types[1] == "numeric") {
					columnData = columnData.filter(function(val) {
						return (typeof val[1] === 'number');
					});
				}

				var trimmedLength = columnData.length;

				if(trimmedLength != originalLength) {
					$missingNotice.html(
						"<i class='warning sign icon'></i> " + (originalLength - trimmedLength) 
							+ " of " + originalLength 
							+ " data points are identified as problematic data and are omitted."
					);
					$missingNotice.removeClass("hidden");
				}
				else {
					$missingNotice.addClass("hidden");
				}

				columnData = d3.transpose(columnData);
			}

			return columnData;
		};

		// @brief	init modules and set module visibility
		module.render = function() {
			var ix1 = ($dropdown1.dropdown("get value"))[0];
			var ix2 = ($dropdown2.dropdown("get value"))[0];
			ix = [ix1, ix2];
			var type1 = getType(data["attribute"][ix1]["type"]);
			var type2 = getType(data["attribute"][ix2]["type"]);

			// set dropdown disable states
			$dropdown1.dropdown().find(".menu").find(".item").each(function() { $(this).removeClass("disabled"); });
			$dropdown1.dropdown().find(".menu").find(".item[data-value='" + $dropdown2.dropdown("get value")[0] + "']")
				.addClass("disabled");
			$dropdown2.dropdown().find(".menu").find(".item").each(function() { $(this).removeClass("disabled"); });
			$dropdown2.dropdown().find(".menu").find(".item[data-value='" + $dropdown1.dropdown("get value")[0] + "']")
				.addClass("disabled");

			var columnData = [module.getColumn(ix1), module.getColumn(ix2)];
			columnData = module.trimBadData(columnData, [type1, type2]);

			// obtain modules that needs rendering
			var names = [];
			var type = type1 + "-" + type2;
			if(type == "numeric-numeric") {
				if(columnData[0].length > 1000) {
					names.push("heatmap");
				}
				if(columnData[0].length < 10000) {
					names.push("scatter-plot");
				}
			}
			else if(type == "nominal-nominal") {
				names = ["donut-chart", "stacked-column-chart"];
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
				// TIME_KEEPING
				// console.log("Bivariate " + name + " Starts: " + ((new Date())-window.ST));

				var moduleName = name.replace(/-/g,"");
				var $divToRender = $div.find("." + name);
				var columnNames = [data["attribute"][ix1]["name"], data["attribute"][ix2]["name"]];
				if(type == "numeric-numeric") {
					$divToRender["dashboard_bivariate_" + moduleName](
						columnNames, columnData
					);
				}
				else if(type == "nominal-nominal") {
					$divToRender["dashboard_bivariate_" + moduleName](
						columnNames, columnData,
						[data["attribute"][ix1]["type"]["oneof"], data["attribute"][ix2]["type"]["oneof"]]
					);
				}
				else if(type == "nominal-numeric") {
					$divToRender["dashboard_bivariate_" + moduleName](
						columnNames, columnData,
						data["attribute"][ix1]["type"]["oneof"]
					);
				}
				else if(type == "numeric-nominal") {
					$divToRender["dashboard_bivariate_" + moduleName](
						columnNames, columnData,
						data["attribute"][ix2]["type"]["oneof"]
					);
				}

				// TIME_KEEPING
				// console.log("Bivariate " + name + " Ends: " + ((new Date())-window.ST));
			});

			// toggle show and hide
			plotTypes.forEach(function(type) {
				var typeName = encodingToDisplay(type.replace(/-/g, " "));
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
				var firstVisibleType = encodingToDisplay(typeToActivate.replace(/-/g, " "));
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

		// @brief	reset the module
		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			ix = [];

			$div.find(".col-dropdown").html(""
				+ "<select class='ui fluid dropdown'>"
				+   "<option value=''>Select Columns</option>"
				+ "</select>"
				+ "<div class='ui horizontal divider'><i class='resize vertical switch icon'></i></div>"
				+ "<select class='ui fluid dropdown'>"
				+   "<option value=''>Select Columns</option>"
				+ "</select>"
			);

			// plotTypes.forEach(function(name) {
			// 	name = name.replace(/-/g,"");
			// 	if(module[name]) {
			// 		module[name].reset();
			// 	}
			// });
		};

		module.description = function() {
			var activeType = $menu.find(".active.item").html();
			if(ix.length != 2) {
				return "No Graph";
			}
			else {
				var names = ix.map(function(val) { return data["attribute"][val]["name"]});
				return activeType + " of " + names[0] + " and " + names[1];
			}
		};

		module.init(renderTo, dataCopy);

	};

	$.fn.dashboard_bivariate = function () {
		var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
				if($.data(this, "module-data") !== undefined) {
        			$.data(this, "module-data")[args[0]].apply(null, args.slice(1));
        		}        	
        	}
        	else {
        		(new (Function.prototype.bind.apply(Bivariate, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));