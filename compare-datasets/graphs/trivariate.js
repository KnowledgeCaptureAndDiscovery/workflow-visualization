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
			if(type === undefined || type == null) {
				return null;
			}
			else if(type["type"] == "numeric" || type["type"] == "nominal") {
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
			$dropdown1 = $div.find(".col-dropdown").first().find(".fluid.dropdown");
			$dropdown2 = $div.find(".col-dropdown").last().find(".fluid.dropdown");
			$plotDropdown = $div.find(".ui.settings.popup").find(".plot-dropdown").find(".fluid.dropdown");
			module.initPlotTypes();

			var availableIx = module.initGraphOptionDropdown();

			if(availableIx.length >= 3) {
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
		// @param	columnDataArray		the column data to be trimmed
		// @param	types 				data types of the 2 columns
		// @return	trimmed column data
		module.trimBadData = function(columnDataArray, types) {
			var $missingNotice = $div.find(".missing-notice");

			if(types[0].indexOf("numeric") == -1) {
				$missingNotice.addClass("hidden");
			}

			else {
				$missingNotice.html("<div class='ui " + numberToEnglish(columnDataArray.length) + " column grid'></div>");
				var showing = false;

				columnDataArray = columnDataArray.map((singleData) => (d3.transpose(singleData)));

				columnDataArray.forEach(function(columnData, ix) {
					columnData[0].forEach(function(columnDataSample) {
						if(columnDataSample == null) {
							$missingNotice.find(".grid").append(
								"<div class='column'> <i class='warning circle icon'></i> No Data </div>"
							);
							return;
						}
					});

					var originalLength = columnData.length;

					types.forEach(function(type, typeIx) {
						if(type == "numeric" || type == "discrete") {
							columnData = columnData.filter(function(val) {
								return (typeof val[typeIx] === 'number');
							});
						}
					});

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
							"<div class='column'> <i class='info circle icon'></i> No Missing Data </div>"
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

			return columnDataArray;
		};

		// @brief	init modules and set module visibility
		module.render = function() {
			ix = $dropdown1.dropdown("get value").slice(0, -1);
			if(ix.length != 2) {
				$div.find(".header-description").text("Error");
				$div.find(".plot.wrapper").showModuleError("No graph to show.");
				return;
			}
			ix.push(($dropdown2.dropdown("get value"))[0]);
			var indices = data.map(function(singleData) {
				return ix.map(function(ixn) {
					return singleData["attribute"].findIndex(function(item) {
						return item["name"] == ixn;
					});
				});
			});

			var types = ix.map(function(_, axisIndex) {
				return indices.map(function(plotColumnIndexInDataset, datasetIx) {
					var typeToCheck = (plotColumnIndexInDataset[axisIndex] == -1) ? null : data[datasetIx]["attribute"][plotColumnIndexInDataset[axisIndex]]["type"];
					return getType(typeToCheck);
				});
			});

			var plotTypeInconsistent = false;
			types.forEach(function(type) {
				var typesNotNull = Array.from(new Set(type.filter((val) => (val != null))));
				if(typesNotNull.length != 1) {
					$div.find(".header-description").text("Error");
					$div.find(".plot.wrapper").showModuleError("Error: column data type inconsistent.");
					plotTypeInconsistent = true;
				}
			});
			if(plotTypeInconsistent) return;

			// reduce elements of types, which used to be set of types, to single type values
			types = types.map((type) => (type.filter((val) => (val != null)))[0]);

			// rearrange plot type order to fit in plot types
			if(types[0] == "numeric" && types[1] == "nominal") {
				indices = indices.map(function(ix) {
					types[0] = "nominal"; types[1] = "numeric";
					var temp = ix[0]; ix[0] = ix[1]; ix[1] = temp;
					return ix;
				});
			}
			if(types[0] == "nominal" && types[1] == "numeric" && types[2] == "numeric") {
				indices = indices.map(function(ix) {
					types[0] = "numeric"; types[2] = "nominal";
					var temp = ix[0]; ix[0] = ix[2]; ix[2] = temp;
					return ix;
				});
			}

			// get corresponding column data and remove bad data
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
			columnData = module.trimBadData(columnData, types);
			columnData = columnData.map((singleData) => ((singleData[0] == null) ? null : singleData));

			// obtain modules that needs rendering
			var names = [];
			if(types.join("-") == "numeric-numeric-numeric") {
				names = ["bubble-chart"];
			}
			else if(types.join("-") == "nominal-nominal-nominal") {
				names = ["stacked-column-chart"];
			}
			// else if(types.join("-") == "numeric-numeric-nominal") {
			// 	names = ["scatter-plot"];
			// }
			else if(types.join("-") == "nominal-nominal-numeric") {
				names = ["heatmap"];
			}
			else if(types.join("-") == "nominal-numeric-nominal") {
				names = ["grouped-column-chart"];
			}
			else {
				$div.find(".header-description").text("Error");
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
				var columnNames = ix;
				var columnCategories = indices.map((indice, ix) => (
					indice.map(function(colIndex) {
						if(colIndex == -1) {
							return null;
						}
						else {
							var oneof = data[ix]["attribute"][colIndex]["type"]["oneof"];
							if(oneof != undefined) {
								return oneof.map((val) => ("" + val));
							}
							else {
								return null;
							}
						}
					})
				));

				$divToRender["dashboard_trivariate_" + moduleName](
					columnNames,
					columnData,
					columnCategories
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

			$div.find(".col-dropdown").html(""
				+ "<select class='ui fluid dropdown'>"
				+   "<option value=''>Select Columns</option>"
				+ "</select>"
			);
			$div.find(".col-dropdown").first().find(".ui.dropdown").attr("multiple", "");

			plotTypes.forEach(function(name) {
				name = name.replace(/-/g,"");
				if(module[name]) {
					module[name].reset();
				}
			});
		};

		module.updateDescription = function() {
			$div.find(".header-description").text(module.description());
		};

		module.description = function() {
			var activeType = $plotDropdown.dropdown("get text");
			if(ix == null || ix.length != 3) {
				return "No Graph";
			}
			else {
				return activeType + " of "
					 + $dropdown1.dropdown("get text")[0] 
					 + " and " 
					 + $dropdown1.dropdown("get text")[1] 
					 + " grouped by " 
					 + $dropdown2.dropdown("get text")[0];
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