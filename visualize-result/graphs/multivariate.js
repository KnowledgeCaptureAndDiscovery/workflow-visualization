(function($) {

	var Multivariate = function(renderTo, dataCopy) {

		/* Private Variables */
		var module = this,
			$div,
			$dropdown,
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
			$dropdown = $div.find(".col-dropdown").find(".fluid.dropdown");
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
						$dropdown.dropdown("set selected", item);
						count++;
					}
				});

				module.render();

				$div.removeClass("hidden");
			}
			else {
				console.log("No multivariate graph to show");
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
					$dropdown.append($("<option>")
						.attr("value",ix)
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
			var ix = $dropdown.dropdown("get value").slice(0,-1);
			var types = ix.map(function(val) { return getType(data["attribute"][val]["type"]); });

			var columnData = ix.map(function(val) { return module.getColumn(val); });
			columnData = module.trimBadData(columnData, types);

			// obtain modules that needs rendering
			var names = [];
			if(types.find(function(type) { return type != "numeric"; }) == null) {
				names = ["parallel-coordinate", "heatmap"];
			}
			else if(types.find(function(type) { 
				return type != "numeric" 
					&& type != "nominal" 
					&& type != "discrete"; 
			}) == null) {
				names = ["parallel-coordinate"];
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
				var columnNames = ix.map(function(val) { return data["attribute"][val]["name"] });
				$divToRender["dashboard_multivariate_" + moduleName](
					columnNames,
					columnData,
					types
				);

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

			$div.find(".col-dropdown").html(""
				+ "<select multiple='' class='ui fluid dropdown'>"
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


	$.fn.dashboard_multivariate = function () {
		var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
        		if($.data($(this), "module-data") !== undefined) {
        			$.data($(this), "module-data")[args[0]].apply(null, args.slice(1));
        		}
        	}
        	else {
        		(new (Function.prototype.bind.apply(Multivariate, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));