$(document).ready(function() {
	/* Setup */
	hideAllGraphs();
	showBody();
	addSidebarAnimation();

	/* Load Data from Url */
	loadDataFromUrl();

	/* Load Chart Types */
	window.chartTypeData = loadChartTypes();

	/* Header */
	initDataSelectionDropdown();
	disableFileUploadIfNecessary();

	/* Modules */
	initControlButtons();

	/* Settings */
	initSettings();
	initAddModuleDropdown();

	/* Modals */
	initExportModal();

	/* Finishing */
	removeDimmer();
});

function hideAllGraphs() {
	$(".graph-content > .column").addClass("hidden");
}

function showBody() {
	$("body").show();
}

function addSidebarAnimation() {
	$(".launch.icon").click(function(){
		$(".sidebar.toc").sidebar('toggle');
	});
}

function loadDataFromUrl() {
	/* Function that analyzes url parameters */
	/* Code source: http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript */
	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	var encodedUrl = getParameterByName("data");
	if(encodedUrl != null) {
		var json = JSON.parse(encodedUrl);
		$(".global.data.dropdown").addClass("hidden");
		var urlSource = json.map((val) => (val.url));
		downloadData(urlSource);
		var names = json.map((val) => (val.name));
		showDatasetNames(urlSource, names);
	}
}

function showDatasetNames(urls, names) {
	$(".names-content").html("").removeClass().addClass("ui " + numberToEnglish(names.length) + " column grid names-content");
	names.forEach(function(name, ix) {
		$(".names-content").append(
			$("<div>").addClass("column").append(
				$("<h4>").addClass("ui center aligned header").append(
					$("<a>").addClass("ui header").text(name).attr("href", urls[ix]).attr("target", "_blank")
				)
			)
		);
	});
	$(".dataset-names").removeClass("hidden").sticky({
		offset: 40,
		setSize: true,
		context: $(".graph-content").closest(".ui.vertical.segment"),
		onStick: function() {
			$(".graph-content").closest(".ui.vertical.segment").css("margin-top", $(".dataset-names").outerHeight());
		},
		onUnstick: function() {
			$(".graph-content").closest(".ui.vertical.segment").css("margin-top", 0);
		}
	});
	$(".graph-content").closest(".ui.vertical.segment").resize(function() {
		$(".dataset-names").removeClass("hidden").sticky("refresh");
	});
}

function loadChartTypes() {
	var chartTypes = [];
	var chartTypeHtml = {};
	$(".graph-content > .column").each(function() {
		var classNames = $(this)
			.attr("class")
			.split(' ')
			.filter(function(val) {
				return val != "column"
					&& val != "hidden"
					&& val != "settings"
					&& val != "default-module";
			});
		for(var ix in classNames) {
			chartTypes.push(classNames[ix]);
			chartTypeHtml[classNames[ix]] = $(this).html();
		}
	});
	return {
		types: chartTypes,
		html: chartTypeHtml
	}
}

function initAddModuleDropdown() {
	chartTypeData.types.forEach(function(type, ix) {
		function toTitleCase(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
		$(".settings .add.module.item > .menu").append(
			"<div class='item' value='" + ix + "'>" + toTitleCase(type) + "</div>"
		);
	});
	$(".settings .add.module.item").dropdown("setting", "onChange", function() {
		setTimeout(function() {
			var chartType = $(".settings .add.module.item").dropdown("get value");
			if(chartType == "") return;
			$(".graph-content").append(
				"<div class='column " + chartType + "'>"
				+ chartTypeData.html[chartType]
				+ "</div>"
			);
			var $moduleToDraw = $(".graph-content").children().last(".column");
			Dashboard.drawModule($moduleToDraw, chartType);
			$moduleToDraw.addControlButtons();
			updateSampleNotice();
			$("body").animate({ scrollTop: $(document).height() }, "fast");
		}, 1);
	});
}

function drawCharts(raw = null) {
	var parseFile = function() {
		return new Promise(function(resolve, reject) {
			Dashboard.progress.set(1);
			setTimeout(function() {
				if(Dashboard.init(raw, chartTypeData.types)) {
					resolve();
				}
			}, 1);
		});
	};

	var generatePlots = function() {
		return new Promise(function(resolve, reject) {
			Dashboard.progress.set(2);
			setTimeout(function() {
				Dashboard.draw();
				resolve();
			}, 1);
		});
	};

	var finishUp = function() {
		return new Promise(function(resolve, reject) {
			Dashboard.progress.set(3);
			setTimeout(function() {
				$(".global.settings.dropdown").removeClass("disabled");

				$(".ui.modal").modal('hide');

				// show sample data notice if needed
				updateSampleNotice();

				resolve();
			}, 1);
		});
	};

	if(raw != null) {
		parseFile()
			.catch(function(e) {})
			.then(generatePlots)
			.then(finishUp);
	}
	else {
		Dashboard.progress.set(0);
		generatePlots().then(finishUp);
	}
}

function updateSampleNotice() {
	if($(".content.has-menu > div:not(.hidden) .render-detail:not(.hidden)").length) {
		$(".sample-notice").removeClass("hidden");
	}
	else {
		$(".sample-notice").addClass("hidden");
	}
}

function downloadData(urls) {
	Dashboard.progress.set(0);
	toLoad = urls.length;
	dataLoaded = [];
	for(var i = 0; i < toLoad; i++) {
		dataLoaded.push(null);
	}
	dataLoaded.forEach(function(val, ix) {
		setTimeout(function() {
			$.ajax({
				type: 'GET',
				url: urls[ix],
				dataType: "text",
				success: function(raw) {
					dataLoaded[ix] = raw;
					checkLoaded();
				}
			});
		}, 1);
	});
}

var toLoad = 0;
var dataLoaded = [];
function checkLoaded() {
	toLoad--;
	if(toLoad == 0) {
		drawCharts(dataLoaded);
	}
}

function saveFile(filename, data, type) {
	var blob = new Blob([data], {type: type});
	if(window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveBlob(blob, filename);
	}
	else{
		var elem = window.document.createElement('a');
		elem.href = window.URL.createObjectURL(blob);
		elem.target = '_blank';
		elem.download = filename;
		document.body.appendChild(elem);
		elem.click();        
		document.body.removeChild(elem);
	}
}

function initDataSelectionDropdown() {
	$('.global.data.dropdown').dropdown('setting', 'onChange', function() {
		var newValue = $('.global.data.dropdown').dropdown('get value');
		$(".dataset-names").addClass("hidden");
		$(".sample-notice").addClass("hidden");
		if(newValue == "upload") {
			DragAndDrop.init(drawCharts, true);
			$(".ui.upload.modal").modal('setting', {
				closable  	: false,
				onDeny		: function() {
					$(".global.data.dropdown").dropdown('restore defaults');
					$(".graph-content > .column").addClass("hidden");
					$(".global.settings.dropdown").addClass("disabled");
				}
			}).modal("show");
		}
		else if(newValue != "") {
			var urls = newValue.split(",");
			downloadData(urls);
			showDatasetNames(urls, urls.map((url) => (url.substring(url.lastIndexOf('/')+1))));
		}
	});
}

function disableFileUploadIfNecessary() {
	var div = document.createElement('div');
	var isAdvancedUpload = (
		('draggable' in div) 
		|| ('ondragstart' in div && 'ondrop' in div)
	) && 'FormData' in window && 'FileReader' in window;
	if(!isAdvancedUpload) {
		$(".global.data.dropdown .item[data-value='upload']").addClass("disabled");
	}
}

function initControlButtons() {
	$.fn.addControlButtons = function() {
		var customizationButtons = ""
		+	"<div class='ui fluid basic button export-graph-button' style='margin-bottom: 10px'>"
		+		"<i class='left floated save icon'></i>&nbsp;Export Graph"
		+	"</div>"
		+	"<div class='ui fluid basic button close-module-button'>"
		+		"<i class='left floated close icon'></i>&nbsp;Delete Module"
		+	"</div>"
		;
		$(this).find(".control.options").html(customizationButtons);
		if($(this).hasClass("basic")) {
			$(this).find(".control.options").find(".export-graph-button").addClass("hidden");
		}
		$(this).find(".close-module-button").on("click", function() {
			var $column = $(this).closest(".column");
			if($column.hasClass("default-module")) {
				$column.addClass("hoarded");
			}
			else {
				$column.remove();
			}
			updateSampleNotice();
		});
		$(this).find(".export-graph-button").on("click", function() {
			var $charts = [];
			$(this).closest(".column").find(".plot.wrapper > div:not(.hidden) .column.grid div[class^='block']").each(function() {
				if($(this).find("svg").length) {
					$charts.push($(this).find("svg"));
				}
				else {
					console.log($(this).text());
					$charts.push($("<svg>")
						.attr("width", $(this).width())
						.attr("height", $(this).height())
						.css("background", "white")
						.append(
							$("<text>")
								.attr("x", $(this).width() / 2)
								.attr("y", $(this).height() / 2)
								.attr("text-anchor", "middle")
								.attr("alignment-baseline", "central")
								.attr("fill", "gray")
								.css("font-size", "18px")
								.css("font-family", "Lato")
								.html($(this).text())
								.prop("outerHTML")
						)
					)
				}
			});
			if($charts.length == 0) return;
			var chartWidth = parseFloat($charts[0].attr("width"));
			var chartHeight = parseFloat($charts[0].attr("height"));
			var titleHeight = 80;
			var subtitleHeight = 40;
			var chartHtml = $("<svg>")
				.attr("width", chartWidth * $charts.length)
				.attr("height", chartHeight + titleHeight + subtitleHeight)
				.attr("style", $charts[0].attr("style"))
				.attr("xmlns", $charts[0].attr("xmlns"))
				.css("background", "white")
				// charts
				.append($charts.map(function($chart, ix) {
					return $("<g>")
						.attr("transform", "translate(" + (chartWidth * ix) + ", " + (titleHeight + subtitleHeight) + ")")
						.append($chart.prop("outerHTML"))
						.prop("outerHTML");
				}).join(""))
				// title
				.append(
					$("<text>")
						.attr("x", chartWidth * $charts.length / 2)
						.attr("y", titleHeight / 2)
						.attr("text-anchor", "middle")
						.attr("alignment-baseline", "central")
						.css("font-size", "20px")
						.css("font-family", "Lato")
						.html($(this).closest(".column").find(".header-description").text())
						.prop("outerHTML")
				)
				// subtitle
				.append(
					$charts.map(function($chart, ix) {
						return $("<text>")
							.attr("x", chartWidth * (ix + 0.5))
							.attr("y", titleHeight + subtitleHeight / 2)
							.attr("text-anchor", "middle")
							.attr("alignment-baseline", "central")
							.css("font-size", "16px")
							.css("font-family", "Lato")
							.html($(".names-content .column:nth-of-type(" + (ix + 1) + ") a.ui.header").html())
							.prop("outerHTML");
					}).join("")
				);
			var $canvas = $(".export.modal canvas");
			$.data($canvas.get(0), "svgdata", chartHtml.prop('outerHTML'));
			$canvas.attr("width", $canvas.width());
			$canvas.attr("height", $canvas.height());
			$canvas.css("display", "block");
			$canvas.css("margin", "auto");
			canvg($canvas.get(0), chartHtml.prop('outerHTML'));
			$(".export.modal .ui.dropdown").dropdown();
			$(".ui.popup").popup("hide all");
			$(".export.modal").modal("show");
		});
	};
	$(".graph-content > .column").each(function() {
		$(this).addClass("default-module");
		$(this).addControlButtons();
	});
}

/* Module Operations */
var clearModules = function() {
	$(".graph-content > .column").each(function() {
		$(this).find(".close-module-button").trigger("click");
	});
	updateSampleNotice();
};
var restoreDefault = function() {
	$(".graph-content > .column").each(function() {
		$(this).removeClass("hoarded");
		if($(this).hasClass("default-module")) {
			if($(this).hasClass("folded")) {
				unfoldModule($(this));
			}
		}
		else {
			$(this).remove();
		}
	});
	drawCharts();
};

function initSettings() {
	$(".global.settings.dropdown").dropdown('setting', 'onChange', function() {
		var operaton = $('.global.settings.dropdown').dropdown('get value');
		if(operaton != "") {
			if(window[operaton]) window[operaton]();
			$('.global.settings.dropdown').dropdown("clear");
		}
	});
}

function initExportModal() {
	$(".export.modal .ui.form").form({
		fields: {
			"file-name": "empty",
			"file-format": "empty"
		},
		onSuccess: function() {
			var format = $(".export.modal .ui.dropdown").dropdown("get value");
			var fileName = $(".export.modal input[name='file-name']").val();
			if(format == "svg") {
				var svgData = $.data($(".export.modal canvas").get(0), "svgdata");
				saveFile(fileName + ".svg", svgData, "image/svg+xml");
			}
			if(format == "png") {	
				var pngData = atob($(".export.modal canvas").get(0).toDataURL("image/png").split(',')[1]);
				var asArray = new Uint8Array(pngData.length);
				for( var i = 0, len = pngData.length; i < len; i++) {
					asArray[i] = pngData.charCodeAt(i);
				}
				saveFile(fileName + ".png", asArray.buffer, "image/png");
			}
			if(format == "jpg") {
				var jpgData = atob($(".export.modal canvas").get(0).toDataURL("image/jpeg", 1.0).split(',')[1]);
				var asArray = new Uint8Array(jpgData.length);
				for( var i = 0, len = jpgData.length; i < len; i++) {
					asArray[i] = jpgData.charCodeAt(i);
				}
				saveFile(fileName + ".jpg", asArray.buffer, "image/jpeg");
			}
			$(".export.modal").modal("hide");
		}
	});
	$(".export.modal .primary.button").click(function() {
		$(".export.modal .ui.form").submit();
	});
	$(".export.modal .deny.button").click(function() {
		$(".export.modal").modal("hide");
		$(".export.modal .form").form("reset");
	});
}

function showDimmer() {
	$("body.dimmable > .ui.dimmer").addClass("active");
}

function removeDimmer() {
	$("body.dimmable > .ui.dimmer").removeClass("active");
}

$.fn.showNoData = function() {
	$(this).html("<div>No Data</div>");
	$(this).find("div")
		.css("height", "300px")
		.css("text-align", "center")
		.css("color", "gray")
		.css("font-size", "18px")
		.css("line-height", "300px");
};

$.fn.showModuleError = function(msg) {
	$(this).html("<div>" + msg + "</div>");
	$(this).find("div")
		.css("height", "300px")
		.css("text-align", "center")
		.css("color", "gray")
		.css("font-size", "18px")
		.css("line-height", "300px");
};

// @brief	converts a number to english
// @param	num 	input number
// @return 	converted string (null if not supported)
window.numberToEnglish = function(num) {
	var eng = ["zero", "one", "two", "three", "four", "five", "six"];
	if(num >= 0 && num <= 6) return eng[num];
	else return null;
};


// @brief	get the type of a column with an array of datasets
// @param	datasets 	array of datasets
// @param	columnName 	the column name that is requested
// @return	the type of the requested column
window.getTypeOfColumn = function(datasets, columnName) {
  var indices = datasets.map(function(singleDataset) {
    return singleDataset["attribute"].findIndex(function(item) {
      return item["name"] == columnName;
    });
  });

  var types = indices.map(function(colIndex, ix) {
    var typeToCheck = (colIndex == -1) ? null : datasets[ix]["attribute"][colIndex]["type"]["type"];
    return typeToCheck;
  });

  // identify column type inconsistency error
  var typesNotNull = Array.from(new Set(types.filter((val) => (val != null))));
  if(typesNotNull.length != 1) {
    return "mixed";
  }
  else {
    return (types.filter((val) => (val != null)))[0];
  }
};