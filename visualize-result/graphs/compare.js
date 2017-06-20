(function($) {

	var Compare = function(renderTo, dataCopy) {

		/* Private Variables */
		var module = this,
			$div,
			$dropdown1,
			$dropdownX,
			$menu,
			data = {},
			plotTypes = [],
			maxSelection = 10;

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
			if(type["type"] == "numeric" || type["type"] == "nominal" || type["type"] == "discrete") {
				return type["type"];
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
			$div.data("module-data", this);
			data = dataCopy;
			$menu = $div.find(".has-menu").find(".menu");

			module.reset();
			$dropdown1 = $div.find(".col-dropdown").find(".fluid.dropdown").first();
			$dropdownX = $div.find(".col-dropdown").find(".fluid.dropdown").last();
			module.initPlotTypes();

			var availableIx = module.initGraphOptionDropdown();

			if(availableIx.length >= 2) {
				// define dropdown action events
				$div.find(".col-dropdown").find(".fluid.dropdown").dropdown("setting", "onChange", function() {
					module.render();
				});

				var count = 0;
				availableIx.forEach(function(item) {
					if(count < 10) {
						$dropdownX.dropdown("set selected", item);
						count++;
					}
				});

				$dropdown1.dropdown("set value", "none");

				module.render();

				$div.removeClass("hidden");
			}
			else {
				console.log("No comparison graph to show");
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
				if(getType(type) == "numeric" || getType(type) == "discrete") {
					// set first available index if necessary
					availableIx.push(ix);

					// populate column selection dropdown
					$dropdownX.append($("<option>")
						.attr("value",ix)
						.text(data["attribute"][ix]["name"]));
				}
				if(getType(type) != "others") {
					$dropdown1.append($("<option>")
						.attr("value",ix)
						.attr("disabled", "")
						.text(data["attribute"][ix]["name"]));
				}
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

			if(types.indexOf("numeric") == -1 && types.indexOf("discrete") == -1) {
				$missingNotice.addClass("hidden");	
			}

			else {
				columnData = d3.transpose(columnData);

				var originalLength = columnData.length;

				for(var ix = 0; ix < types.length; ix++) {
					if(types[ix] == "numeric" || types[ix] == "discrete") {
						columnData = columnData.filter(function(val) {
							return (typeof val[ix] === 'number');
						});
					}
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
			var viewpoint = $dropdown1.dropdown("get value")[0];
			var targets = $dropdownX.dropdown("get value").slice(0,-1);
			var targetTypes = targets.map(function(val) { return getType(data["attribute"][val]["type"]); });

			var columnData = targets.map(function(val) { return module.getColumn(val); });
			var columnTypes = targetTypes;
			var columnNames = targets.map(function(val) { return data["attribute"][val]["name"]; });
			if(viewpoint != "none") {
				columnData = columnData.splice(0, 0, module.getColumn(viewpoint));
				columnTypes = columnTypes.splice(0, 0, getType(data["attribute"][viewpoint]["type"]));
				columnNames = columnNames.splice(0, 0, data["attribute"][viewpoint]["name"]);
			}
			columnData = module.trimBadData(columnData, columnTypes);

			// obtain modules that needs rendering
			var names = [];
			if(viewpoint == "none") {
				names = ["area-plot"];
			}
			else {
				names = ["multiple-line-chart"];
			}

			// initialize necessary modules
			names.forEach(function(name) {
				var moduleName = name.replace(/-/g,"");
				var $divToRender = $div.find("." + name);
				var columnNames = targets.map(function(val) { return data["attribute"][val]["name"]; });
				if(viewpoint != "none") {
					columnNames.splice(0, 0, data["attribute"][viewpoint]["name"]);
				}
				$divToRender["dashboard_compare_" + moduleName](
					columnNames,
					columnData,
					columnTypes
				);
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

			$div.find(".col-dropdown .field").first().html(""
				+ "<label>Viewpoint</label>"
				+ "<select class='ui fluid dropdown'>"
				+   "<option value='none'>Coming Soon</option>"
				+ "</select>"
			);

			$div.find(".col-dropdown .field").last().html(""
				+ "<label>Targets</label>"
				+ "<select multiple='' class='ui fluid dropdown'>"
				+   "<option value=''>Select Targets</option>"
				+ "</select>"
			);
		};

		module.description = function() {
			var activeType = $menu.find(".active.item").html();
			var activeIx = $dropdown.dropdown("get value").slice(0,-1);
			var activeIxLength = activeIx.length;
			var firstActiveName = data["attribute"][activeIx[0]]["name"];

			if(activeIxLength >= 3) {
				return activeType + " of " + firstActiveName + " and " + (activeIxLength-1) + " Other Columns";
			}
			else {
				return activeType + " of " 
					+ activeIx
						.map(function(val) { return  data["attribute"][val]["name"]})
						.join(" and ");
			}
		};

		module.init(renderTo, dataCopy);

	};


	$.fn.dashboard_compare = function () {
		var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "module-data") !== undefined) {
        			$.data($(this), "module-data")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Compare, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));