$(document).ready(function() {
	/* Setup */
	hideAllGraphs();
	showBody();
	addSidebarAnimation();

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
		$(".settings .add.module.dropdown > .menu").append(
			"<div class='item' value='" + ix + "'>" + toTitleCase(type) + "</div>"
		);
	});
	$(".settings .add.module.dropdown").dropdown();
	$(".add.module.button:not(.dropdown)").click(function() {
		$(this).addClass("loading");
		setTimeout(function() {
			var chartType = $(".settings .add.module.dropdown").dropdown("get value");
			if(chartType == "") return;
			$(".graph-content").append(
				"<div class='column " + chartType + "'>"
				+ chartTypeData.html[chartType]
				+ "</div>"
			);
			var $moduleToDraw = $(".graph-content").children().last(".column");
			Dashboard.drawModule($moduleToDraw, chartType);
			$moduleToDraw.addControlButtons();
			$(".masonry.grid").masonry('appended', $moduleToDraw);
			$('.masonry.grid .column').resize(function() {
				$(".masonry.grid").masonry('layout');
			});
			updateSampleNotice();
			$(".add.module.button:not(.dropdown)").removeClass("loading");
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
	$('.global.data.dropdown').dropdown('setting', 'onChange', function(){
		var newValue = $('.global.data.dropdown').dropdown('get value');
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
			downloadData(newValue.split(","));
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
		+	"<div class='ui fluid basic button export-graph-button'>"
		+		"<i class='left floated save icon'></i>&nbsp;Export Graph"
		+	"</div>"
		+	"<div style='display: block; width: 100%; height: 10px;'></div>"
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
		// $(this).find(".link.export-graph-button").on("click", function() {
		// 	var $chart = $(this).closest(".column").find(".content.has-menu > div:not(.menu):not(.hidden) .chart.image").find("svg").parent();
		// 	var $canvas = $(".export.modal canvas");
		// 	$.data($canvas.get(0), "svgdata", $chart.html());
		// 	$canvas.attr("width", $canvas.width());
		// 	$canvas.attr("height", $canvas.height());
		// 	$canvas.css("display", "block");
		// 	$canvas.css("margin", "auto");
		// 	canvg($canvas.get(0), $chart.html());
		// 	$(".export.modal .ui.dropdown").dropdown();
		// 	$(".export.modal").modal("show");
		// });
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
		window[operaton]();
		$('.global.settings.dropdown').dropdown("restore default");
	});
}

// function initExportModal() {
// 	$(".export.modal .ui.form").form({
// 		fields: {
// 			"file-name": "empty",
// 			"file-format": "empty"
// 		},
// 		onSuccess: function() {
// 			var format = $(".export.modal .ui.dropdown").dropdown("get value");
// 			var fileName = $(".export.modal input[name='file-name']").val();
// 			if(format == "svg") {
// 				var svgData = $.data($(".export.modal canvas").get(0), "svgdata");
// 				saveFile(fileName + ".svg", svgData, "image/svg+xml");
// 			}
// 			if(format == "png") {	
// 				var pngData = atob($(".export.modal canvas").get(0).toDataURL("image/png").split(',')[1]);
// 				var asArray = new Uint8Array(pngData.length);
// 				for( var i = 0, len = pngData.length; i < len; i++) {
// 					asArray[i] = pngData.charCodeAt(i);
// 				}
// 				saveFile(fileName + ".png", asArray.buffer, "image/png");
// 			}
// 			if(format == "jpg") {
// 				var jpgData = atob($(".export.modal canvas").get(0).toDataURL("image/jpeg", 1.0).split(',')[1]);
// 				var asArray = new Uint8Array(jpgData.length);
// 				for( var i = 0, len = jpgData.length; i < len; i++) {
// 					asArray[i] = jpgData.charCodeAt(i);
// 				}
// 				saveFile(fileName + ".jpg", asArray.buffer, "image/jpeg");
// 			}
// 			$(".export.modal").modal("hide");
// 		}
// 	});
// 	$(".export.modal .primary.button").click(function() {
// 		$(".export.modal .ui.form").submit();
// 	});
// 	$(".export.modal .deny.button").click(function() {
// 		$(".export.modal").modal("hide");
// 		$(".export.modal .form").form("reset");
// 	});
// }

function showDimmer() {
	$("body.dimmable > .ui.dimmer").addClass("active");
}

function removeDimmer() {
	$("body.dimmable > .ui.dimmer").removeClass("active");
}

$.fn.showNoData = function() {
	$(this).html("No Data");
	$(this)
		.css("height", "500px")
		.css("color", "gray")
		.css("font-size", "24px")
		.css("line-height", "500px")
		.css("font-weight", "bold");
}

$.fn.showModuleError = function(msg) {
	$(this).html(msg);
	$(this)
		.css("height", "500px")
		.css("color", "gray")
		.css("font-size", "24px")
		.css("line-height", "500px")
		.css("font-weight", "bold");
};

// @brief	converts a number to english
// @param	num 	input number
// @return 	converted string (null if not supported)
window.numberToEnglish = function(num) {
	var eng = ["zero", "one", "two", "three", "four", "five", "six"];
	if(num >= 0 && num <= 6) return eng[num];
	else return null;
}
