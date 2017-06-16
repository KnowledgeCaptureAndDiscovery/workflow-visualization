(function($) {

	function Univariate(renderTo, dataCopy) {
	
		/* Private Variables */
		var module = this,
			$div,
			$dropdown,
			$menu,
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
			
			$dropdown = $div.find(".fluid.dropdown");
			$menu = $div.find(".has-menu").find(".menu");
			module.initPlotTypes();

			var firstAvailableIx = module.initGraphOptionDropdown();

			if(firstAvailableIx != -1) {
				// define dropdown action events
				$dropdown.dropdown("setting", "onChange", function() {
					module.render();
				});

				$dropdown.dropdown("set selected", firstAvailableIx);

				module.render();

				$div.removeClass("hidden");
			}
			else {
				console.log("No univariate graph to show");
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
		// @return	first column index that is shown in the dropdown
		module.initGraphOptionDropdown = function() {
			var columnOptions = "";
			var firstAvailableIx = -1;
			for(ix in data["attribute"]) {
				var type = getType(data["attribute"][ix]["type"]);
				if(type != "others") {
					// set first available index if necessary
					if(firstAvailableIx == -1) firstAvailableIx = ix;

					// populate column selection dropdown
					$dropdown.append($("<option>")
						.attr("value",ix)
						.text(data["attribute"][ix]["name"]));
				}
			}
			return firstAvailableIx;
		};

		// @brief	delete bad data in a numeric data column
		//			add bad data notice in the module
		// @param	columnData	the column data to be trimmed
		// @param	type 		data type of the column
		// @return	trimmed column data
		module.trimBadData = function(columnData, type) {
			var $missingNotice = $div.find(".missing-notice");

			if(type != "numeric") {
				$missingNotice.addClass("hidden");
			}

			else {
				var originalLength = columnData.length;
				columnData = columnData.filter(function(val) {
					return (typeof val === 'number');
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
			}

			return columnData;
		};

		// @brief 	calculate column meta information used by all visualizations
		// @param	columnData 	column data
		// @return	an object including all meta data
		module.calculateDataInfo = function(columnData) {
			columnData = columnData.sort(function(a,b) { return a - b; });

			var meta = {};

			meta.min = columnData[0];
			meta.max = columnData[columnData.length - 1];
			meta.median = d3.median(columnData);
			meta.q1 = d3.quantile(columnData, 0.25);
			meta.q3 = d3.quantile(columnData, 0.75);
			meta.iqr = meta.q3 - meta.q1;
			meta.upperFence = Math.min(
				meta.q3 + 1.5*meta.iqr, 
				meta.max
			);
			meta.lowerFence = Math.max(
				meta.q1 - 1.5*meta.iqr, 
				meta.min
			);

			return meta;
		};

		// @brief	init modules and set module visibility
		module.render = function() {
			var ix = ($dropdown.dropdown("get value"))[0];
			var type = getType(data["attribute"][ix]["type"]);

			var columnData = data["data"].map(function(val) {
				return val[data["attribute"][ix]["name"]];
			});

			// obtain modules that needs rendering
			var names = [];
			if(type == "numeric") {
				names = ["box-plot", "histogram"];
			}
			else if(type == "nominal") {
				names = ["pie-chart", "column-chart"];
			}
			else {
				return;
			}

			// trim bad data
			columnData = module.trimBadData(columnData, type);

			// initialize necessary modules
			names.forEach(function(name) {
				var moduleName = name.replace("-", "");
				if(type == "numeric") {
					var meta = module.calculateDataInfo(columnData);
					$div.find("." + name)["dashboard_univariate_" + moduleName](
						columnData,
						meta
					);
				}
				else {
					$div.find("." + name)["dashboard_univariate_" + moduleName](
						columnData, 
						data["attribute"][ix]["type"]["oneof"]
					);
				}
			});

			// toggle show and hide
			plotTypes.forEach(function(type) {
				var typeName = encodingToDisplay(type.replace('-', ' '));
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
				var firstVisibleType = encodingToDisplay(typeToActivate.replace('-', ' '));
				$menu.find("a.item:contains('" + firstVisibleType + "')").click();
			}
			else {
				$activeItem.click();
			}
		};

		// @brief	reset the module
		module.reset = function() {
			// if init has not been run, do nothing
			if(!$div) return;

			$div.find(".col-dropdown").html(""
				+ "<select class='ui fluid dropdown'>"
				+   "<option value=''>Select Columns</option>"
				+ "</select>"
			);

			plotTypes.forEach(function(name) {
				var moduleName = name.replace("-", "");
				$div.find("." + name)["dashboard_univariate_" + moduleName]("reset");
			});
		};

		module.description = function() {
			return $menu.find(".active.item").html() + " of " 
				+ data["attribute"][$dropdown.dropdown("get value")[0]]["name"];
		};

		module.init(renderTo, dataCopy);

	};

	$.fn.dashboard_univariate = function () {
		var args = Array.prototype.slice.call(arguments);
        return this.each(function () {
        	if(typeof args[0] == "string") {
				if($.data($(this), "module-data") !== undefined) {
        			$.data($(this), "module-data")[args[0]].apply(null, args.slice(1));
        		}        	
        	}
        	else {
        		(new (Function.prototype.bind.apply(Univariate, [null, $(this)].concat(args))));
        	}
        });
    };

}(jQuery));