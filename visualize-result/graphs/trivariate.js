(function($) {

	function Trivariate(renderTo, dataCopy) {

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

			var availableIx = module.initGraphOptionDropdown();

			if(availableIx.length >= 3) {
				// define dropdown action events
				$div.find(".col-dropdown").find(".fluid.dropdown").dropdown("setting", "onChange", function() {
					module.render();
				});

				$dropdown1.dropdown("set selected", availableIx[0]);
				$dropdown1.dropdown("set selected", availableIx[1]);
				$dropdown2.dropdown("set selected", availableIx[2]);

				module.render();

				$div.removeClass("hidden");
			}
			else {
				console.log("No trivariate graph to show");
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

			if(types.indexOf("numeric") == -1) {
				$missingNotice.addClass("hidden");
			}

			else {
				columnData = d3.transpose(columnData);

				var originalLength = columnData.length;

				types.forEach(function(type, ix) {
					if(type == "numeric") {
						columnData = columnData.filter(function(val) {
							return (typeof val[ix] === 'number');
						});
					}
				});

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
			ix = $dropdown1.dropdown("get value").slice(0, -1);
			if(ix.length != 2) {
				module.renderNoGraph();
				return;
			}
			ix.push(($dropdown2.dropdown("get value"))[0]);

			var types = ix.map(function(columnIx) {
				return getType(data["attribute"][columnIx]["type"]);
			});

			// set dropdown disable states
			$dropdown1.dropdown().find(".menu").find(".item").each(function() { $(this).removeClass("disabled"); });
			$dropdown1.dropdown().find(".menu").find(".item[data-value='" + ix[2] + "']")
				.addClass("disabled");
			$dropdown2.dropdown().find(".menu").find(".item").each(function() { $(this).removeClass("disabled"); });
			$dropdown2.dropdown().find(".menu").find(".item[data-value='" + ix[0] + "']")
				.addClass("disabled");
			$dropdown2.dropdown().find(".menu").find(".item[data-value='" + ix[1] + "']")
				.addClass("disabled");

			if(types[0] == "numeric" && types[1] == "nominal") {
				types[0] = "nominal"; types[1] = "numeric";
				var temp = ix[0]; ix[0] = ix[1]; ix[1] = temp;
			}
			if(types[0] == "nominal" && types[1] == "numeric" && types[2] == "numeric") {
				types[0] = "numeric"; types[2] = "nominal";
				var temp = ix[0]; ix[0] = ix[2]; ix[2] = temp;
			}

			var columnData = ix.map(function(columnIx) {
				return module.getColumn(columnIx);
			});
			columnData = module.trimBadData(columnData, types);

			// obtain modules that needs rendering
			var names = [];
			if(types.join("-") == "numeric-numeric-numeric") {
				names = ["bubble-chart"];
			}
			else if(types.join("-") == "nominal-nominal-nominal") {
				names = ["stacked-column-chart"];
			}
			else if(types.join("-") == "numeric-numeric-nominal") {
				names = ["scatter-plot"];
			}
			else if(types.join("-") == "nominal-nominal-numeric") {
				names = ["heatmap"];
			}
			else if(types.join("-") == "nominal-numeric-nominal") {
				names = ["grouped-column-chart"];
			}
			else {
				module.renderNoGraph();
				return;
			}

			// initialize necessary modules
			names.forEach(function(name) {
				// TIME_KEEPING
				// console.log("Trivariate " + name + " Starts: " + ((new Date())-window.ST));

				var moduleName = name.replace(/-/g,"");
				var $divToRender = $div.find("." + name);
				var columnNames = ix.map(function(columnIx) {
					return data["attribute"][columnIx]["name"];
				});
				var columnCategories = ix.map(function(columnIx) {
					return data["attribute"][columnIx]["type"]["oneof"] || {};
				});

				$divToRender["dashboard_trivariate_" + moduleName](
					columnNames,
					columnData,
					columnCategories
				);

				// TIME_KEEPING
				// console.log("Trivariate " + name + " Ends: " + ((new Date())-window.ST));
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

		// @brief	hide all graphs and show a no graph message
		module.renderNoGraph = function() {
			plotTypes.forEach(function(type) {
				var typeName = encodingToDisplay(type.replace(/-/g, " "));
				$div.find("." + type).addClass("hidden");
				$menu.find("a.item:contains('" + typeName.replace(/-/g, " ") + "')").addClass("hidden");
			});
			$div.find(".no-graph").removeClass("hidden");
		}

		module.getColumn = function(ix) {
			return data["data"].map(function(val) {
				return val[data["attribute"][ix]["name"]];
			});
		};

		// @brief	reset the module
		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$div.find(".col-dropdown").html(""
				+ "<div class='field'>"
					+ "<label>Axes</label>"
					+ "<select multiple='' class='ui fluid dropdown'>"
					+   "<option value=''>Select Axes</option>"
					+ "</select>"
				+ "</div>"
				+ "<div class='field'>"
					+ "<label>Additional Column</label>"
					+ "<select class='ui fluid dropdown'>"
					+   "<option value=''>Select Additional Column</option>"
					+ "</select>"
				+ "</div>"
			);

			plotTypes.forEach(function(name) {
				name = name.replace(/-/g,"");
				if(module[name]) {
					module[name].reset();
				}
			});
		};

		module.description = function() {
			var activeType = $menu.find(".active.item").html();
			if(!$div.find(".no-graph").hasClass("hidden") || ix == null || ix.length != 3) {
				return "No Graph";
			}
			else {
				var names = ix.map(function(val) { return  data["attribute"][val]["name"]});
				return activeType + " of " + names[0] + " and " + names[1] + " grouped by " + names[2];
			}
		};

		module.init(renderTo, dataCopy);
	};

	$.fn.dashboard_trivariate = function () {
		var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
				if($.data($(this), "module-data") !== undefined) {
        			$.data($(this), "module-data")[args[0]].apply(null, args.slice(1));
        		}        	
        	}
        	else {
        		(new (Function.prototype.bind.apply(Trivariate, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));