(function($) {

	function Bivariate(renderTo, dataCopy) {

		/* Private Variables */
		var module = this,
			$div,
			$dropdown1,
			$dropdown2,
			$plotDropdown,
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
			if(type === undefined || type == null) {
				return null;
			}
			else if(type["type"] == "numeric" || type["type"] == "nominal" || type["type"] == "discrete") {
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
			$div.data("module-data", module);
			data = dataCopy;

			module.reset();

			$dropdown1 = $div.find(".col-dropdown").first().find(".fluid.dropdown");
			$dropdown2 = $div.find(".col-dropdown").last().find(".fluid.dropdown");
			$plotDropdown = $div.find(".ui.settings.popup").find(".plot-dropdown").find(".fluid.dropdown");
			module.initPlotTypes();

			var availableIx = module.initGraphOptionDropdown();

			if(availableIx.length >= 2) {
				// init popup
				$div.find(".right.floated.meta").find(".link.icon").popup({
					popup: $div.find(".ui.settings.popup"),
					on: "click",
					position: "bottom right",
					variation: "wide"
				});

				// define dropdown action events
				$div.find(".col-dropdown").find(".fluid.dropdown").dropdown("setting", "onChange", function() {
					module.render();
					module.updateDescription();
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
			$plotDropdown.find("option").each(function() {
				plotTypes.push($(this).attr("value"));
			});
			$plotDropdown.dropdown("setting", "onChange", function(value) {
				module.updatePlotVisibility(value);
				module.updateDescription();
			});
			$plotDropdown = $div.find(".ui.settings.popup").find(".plot-dropdown").find(".fluid.dropdown");
		};

		module.updatePlotVisibility = function(value) {
			plotTypes.forEach(function(type) {
				$div.find(".plot.wrapper").find("." + type).addClass("hidden");
				$div.find(".settings.popup .plot.options").find("." + type).addClass("hidden");
			});
			$div.find(".plot.wrapper").find("." + value).removeClass("hidden");
			$div.find(".settings.popup .plot.options").find("." + value).removeClass("hidden");
		};

		// @brief	populate graph option dropdown based on column data types
		// @return	column indices that are shown in the dropdown
		module.initGraphOptionDropdown = function() {
			var columnOptions = "";
			var availableIx = [];
			var columns = [];
			data.forEach(function(singleData) {
				singleData["attribute"].forEach(function(singleAttr) {
					var type = singleAttr["type"];
					if(type != "others") {
						columns.push(singleAttr["name"]);
					}
				});
			});
			var uniqueColumns = Array.from(new Set(columns));
			uniqueColumns.forEach(function(name) {
				availableIx.push(name);

				// populate column selection dropdown
				$dropdown1.append(
					$("<option>").val(name).text(name)
				);
			});
			$dropdown2.html($dropdown1.html());
			return availableIx;
		};

		// @brief	delete bad data in a numeric data column
		//			add bad data notice in the module
		// @param	columnDataArray		the array of column data to be trimmed
		// @param	types 				data types of the 2 columns
		// @return	trimmed column data
		module.trimBadData = function(columnDataArray, types) {
			var $missingNotice = $div.find(".missing-notice");

			if(types[0] != "numeric" && types[0] != "discrete" && types[1] != "numeric" && types[1] != "discrete") {
				$missingNotice.addClass("hidden");
			}

			else {
				$missingNotice.html("<div class='ui " + numberToEnglish(columnDataArray.length) + " column grid'></div>");
				var showing = false;

				columnDataArray = columnDataArray.map((singleData) => (d3.transpose(singleData)));

				columnDataArray.forEach(function(columnData, ix) {
					if(columnData[0][ix] == null) {
						$missingNotice.find(".grid").append(
							"<div class='column'> <i class='warning info icon'></i> No Data </div>"
						);
						return;
					}

					var originalLength = columnData.length;

					if(types[0] == "numeric" || types[0] == "discrete") {
						columnData = columnData.filter(function(val) {
							return (typeof val[0] === 'number');
						});
					}

					if(types[1] == "numeric" || types[1] == "discrete") {
						columnData = columnData.filter(function(val) {
							return (typeof val[1] === 'number');
						});
					}

					var trimmedLength = columnData.length;

					if(trimmedLength != originalLength) {
						$missingNotice.find(".grid").append(
							"<div class='column'>"
							+ "<i class='warning sign icon'></i> " + (originalLength - trimmedLength) 
								+ " of " + originalLength 
								+ " data points are identified as problematic data and are omitted."
							+ "</div>"
						);
						showing = true;
					}
					else {
						$missingNotice.find(".grid").append(
							"<div class='column'> <i class='warning info icon'></i> No Missing Data </div>"
						);
					}

					columnDataArray[ix] = columnData;
				});

				if(showing) {
					$missingNotice.removeClass("hidden");
				}
				else {
					$missingNotice.addClass("hidden");
				}

				columnDataArray = columnDataArray.map((singleData) => (d3.transpose(singleData)));
			}

			console.log(columnDataArray);

			return columnDataArray;
		};

		// @brief	init modules and set module visibility
		module.render = function() {
			var ix1 = ($dropdown1.dropdown("get value"))[0];
			var ix2 = ($dropdown2.dropdown("get value"))[0];
			ix = [ix1, ix2];
			var indices = data.map(function(singleData) {
				return ix.map(function(ixn) {
					return singleData["attribute"].findIndex(function(item) {
						return item["name"] == ixn;
					});
				});
			});

			console.log(indices);

			var type1 = indices.map(function(colIndex, ix) {
				var typeToCheck = (colIndex[0] == -1) ? null : data[ix]["attribute"][colIndex[0]]["type"];
				return getType(typeToCheck);
			});
			var type2 = indices.map(function(colIndex, ix) {
				var typeToCheck = (colIndex[1] == -1) ? null : data[ix]["attribute"][colIndex[1]]["type"];
				return getType(typeToCheck);
			});

			var type1NotNull = Array.from(new Set(type1.filter((val) => (val != null))));
			var type2NotNull = Array.from(new Set(type1.filter((val) => (val != null))));
			if(type1NotNull.length != 1 || type2NotNull.length != 1) {
				$div.find(".plot.wrapper").showModuleError("Error: column data type inconsistent.");
				return;
			}

			type1 = (type1.filter((val) => (val != null)))[0];
			type2 = (type2.filter((val) => (val != null)))[0];
			var columnData = [];
			columnData = indices.map(function(indice, ix) {
				return indice.map(function(colIndex) {
					var dataObjToExtract = (colIndex == -1) ? null : data[ix]["data"];
					if(dataObjToExtract == null) return data[ix]["data"].map((_) => (null));
					return dataObjToExtract.map(function(val) {
						return val[data[ix]["attribute"][colIndex]["name"]];
					});
				});
			});

			console.log(columnData);

			columnData = module.trimBadData(columnData, [type1, type2]);
			columnData = columnData.map((singleData) => ((singleData[0] == null) ? null : singleData));

			// obtain modules that needs rendering
			var names = [];
			var type = type1 + "-" + type2;
			if(type == "numeric-numeric" || type == "discrete-discrete" || type == "numeric-discrete" || type == "discrete-numeric") {
				// if(columnData[0].length > 1000) {
				// 	names.push("heatmap");
				// }
				// if(columnData[0].length < 10000) {
					names.push("scatter-plot");
				// }
			}
			else {
			// if(type == "nominal-nominal" || type == "discrete-discrete" || type == "discrete-nominal" || type == "nominal-discrete") {
			// 	names.push("donut-chart");
			// 	names.push("stacked-column-chart");
			// }
			// if(type == "nominal-numeric" || type == "discrete-numeric" || type == "nominal-discrete") {
			// 	names.push("line-chart");
			// }
			// if(type == "numeric-nominal" || type == "numeric-discrete" || type == "discrete-nominal") {
			// 	names.push("stacked-histogram");
			// }
			// if(type1 == "others" || type2 == "others") {
				$div.find(".plot.wrapper").showModuleError("This data type cannot be plotted.");
				return;
			}

			// initialize necessary modules
			var plotWrapper = $div.find(".plot.wrapper");
			plotWrapper.html("");
			names.forEach(function(name) {
				var moduleName = name.replace(/-/g,"");
				plotWrapper.append($("<div>").addClass(name).html($div.find(".plot.templates").find("." + name).html()));
				var $divToRender = plotWrapper.find("." + name);
				var columnNames = [ix1, ix2];
				var oneofs = indices.map((indice) => (
					indice.map(function(colIndex, ix) {
						return (colIndex == -1) ? null : data[ix]["attribute"][colIndex]["type"]["oneof"];
					})
				));
				$divToRender["dashboard_bivariate_" + moduleName](
					columnNames, columnData,
					oneofs
				);
			});

			// toggle show and hide
			plotTypes.forEach(function(type) {
				if(names.indexOf(type) != -1) {
					$plotDropdown.find(".item[data-value='" + type + "']").removeClass("disabled");
				}
				else {
					$plotDropdown.find(".item[data-value='" + type + "']").addClass("disabled");
				}
			});

			// set tab status
			if(names.indexOf($plotDropdown.dropdown("get value")) == -1) {
				$plotDropdown.dropdown("set selected", names[0]);
			}

			module.updatePlotVisibility($plotDropdown.dropdown("get value"));
			module.updateDescription();
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
			);

			// plotTypes.forEach(function(name) {
			// 	name = name.replace(/-/g,"");
			// 	if(module[name]) {
			// 		module[name].reset();
			// 	}
			// });
		};

		module.updateDescription = function() {
			$div.find(".header-description").text(module.description());
		};

		module.description = function() {
			var activeType = $plotDropdown.dropdown("get text");
			if(ix.length != 2) {
				return "No Graph";
			}
			else {
				return activeType + " of " 
					+ $dropdown1.dropdown("get text")[0] 
					+ " and " 
					+ $dropdown2.dropdown("get text")[0];
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