$(document).ready(function() {
	/* Setup */
	initEmbedMode();
	hideAllGraphs();
	initMasonry();
	showBody();
	addSidebarAnimation();

	/* Load Chart Types */
	window.chartTypeData = loadChartTypes();

	/* Header */
	initDataSelectionDropdown();
	initQuicklook();
	disableFileUploadIfNecessary();

	/* Modules */
	initControlButtons();

	/* Settings */
	initSettings();
	initAddModuleDropdown();
	initClusteringBlock();

	/* Modals */
	initTransposeModal();
	initExportModal();

	/* Finishing */
	removeDimmer();
});

function initEmbedMode() {
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

	var encodedUrl = getParameterByName("url");
	if(encodedUrl != null) {
		$("body").css("background-color", "white");
		$(".full.height").css("background-color", "white");
		$(".main-content").css("margin", "0").css("background", "none");
		$(".toc").hide();
		$(".toc-copy").hide();
		$(".inverted.main.menu").hide();
		$(".header-content").hide();
		var urlSource = decodeURIComponent(encodedUrl);
		downloadData(urlSource);
	}
}

function hideAllGraphs() {
	$(".graph-content > .column").addClass("hidden");
}

function initMasonry() {
	$(".masonry.grid").masonry({
		itemSelector: '.column:not(.ui):not(.not-masonry)',
		percentPosition: true
	});
	$('.masonry.grid .column').resize(function() {
		$(".masonry.grid").masonry('layout');
	});
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

function initClusteringBlock() {
	$(".settings .clustering.content .checkbox").checkbox({
		onChecked: function() {
			$(".settings .clustering.content .range-container").removeClass("hidden");
			drawCharts();
		},
		onUnchecked: function() {
			$(".settings .clustering.content .range-container").addClass("hidden");
			drawCharts();
		}
	});
	
	$(".settings .clustering.content .range-container").css("padding-top", "10px");
	$(".settings .clustering.content .range-container").addClass("hidden");
	$(".settings .clustering.content .ui.range").ionRangeSlider({
		min: 2,
		max: 10,
		from: 3,
		step: 1,
		postfix: ' clusters',
		grid: false
	});
	$(".settings .clustering.content .ui.range").data("ionRangeSlider").update({
		onFinish: (function() {
			var count = 0;
			return function() {
				if(count != 0) drawCharts();
				count++;
			};
		})()
	});
}

function drawCharts(raw = null, transpose = false) {
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
				$(".ui.look.button").removeClass("disabled");
				$(".ui.downloading.button").click(function () {
					saveFile('data.txt', raw, 'text/csv');
				});
				$(".ui.downloading.button").removeClass("disabled");

				$(".column.settings").removeClass("hidden");

				$(".fold.all.button").trigger("click");

				$(".masonry.grid").masonry('layout');

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

function downloadData(url) {
	Dashboard.progress.set(0);
	setTimeout(function() {
		$.ajax({
			type: 'GET',
			url: url,
			dataType: "text",
			success: function(raw) {
				drawCharts(raw);
			}
		});
	}, 1);
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
	$('.header-dropdown').dropdown('setting', 'onChange', function(){
		var newValue = $('.header-dropdown').dropdown('get value');
		$(".sample-notice").addClass("hidden");
		Dashboard.setTransposing(false);
		if(newValue == "upload") {
			DragAndDrop.init(drawCharts);
			$(".ui.upload.modal").modal('setting', {
				closable  	: false,
				onDeny		: function() {
					$(".header-dropdown").dropdown('restore defaults');
					$(".graph-content > .column").addClass("hidden");
					$(".ui.look.button").addClass("disabled");
					$(".ui.downloading.button").addClass("disabled");
				}
			}).modal("show");
		}
		else if(newValue != "") {
			downloadData(newValue);
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
		$(".header-dropdown .item[data-value='upload']").addClass("disabled");
	}
}

function initControlButtons() {
	$.fn.addControlButtons = function() {
		var customizationButtons = ""
		+	"<div style='position: absolute; top: 10px; right: 5px; display: block'>"
		+		"<i class='right floated close link icon close-module-button'></i>"
		+		"<i class='right floated circle link icon fold-module-button'></i>"
		+		"<i class='right floated save link icon export-graph-button'></i>"
		+	"</div>"
		;
		$(this).find(".fluid.card").prepend(customizationButtons);
		if($(this).hasClass("basic")) {
			$(this).find(".fluid.card .save.icon").addClass("hidden");
		}
		$(this).find(".fold-module-button").on("click", function() {
			var $column = $(this).closest(".column");

			if($column.hasClass("folded")) {
				unfoldModule($column);
			}
			else {
				foldModule($column);
			}
		});
		$(this).find(".close-module-button").on("click", function() {
			var $column = $(this).closest(".column");
			if($column.hasClass("default-module")) {
				$column.addClass("hoarded");
			}
			else {
				$column.remove();
			}
			updateSampleNotice();
			$(".masonry.grid").masonry('layout');
		});
		$(this).find(".link.export-graph-button").on("click", function() {
			var $chart = $(this).closest(".column").find(".content.has-menu > div:not(.menu):not(.hidden) .chart.image").find("svg").parent();
			var $canvas = $(".export.modal canvas");
			$.data($canvas.get(0), "svgdata", $chart.html());
			$canvas.attr("width", $canvas.width());
			$canvas.attr("height", $canvas.height());
			$canvas.css("display", "block");
			$canvas.css("margin", "auto");
			canvg($canvas.get(0), $chart.html());
			$(".export.modal .ui.dropdown").dropdown();
			$(".export.modal").modal("show");
		});
	};
	$(".graph-content > .column:not(.settings)").each(function() {
		$(this).addClass("default-module");
		$(this).addControlButtons();
	});
}

/* Module Folding and Unfolding */
var foldModule = function($divToFold) {
	var $button = $divToFold.find(".fold-module-button");
	$button.addClass("thin");
	$divToFold.addClass("folded");
	var description = jQuery.data($divToFold[0], "module-data").description();
	$divToFold.find(".ui.card").prepend(
		"<div class='folding state content'><div class='header'>" 
		+ description 
		+ "</div></div>"
	);
};
var unfoldModule = function($divToUnfold) {
	var $button = $divToUnfold.find(".fold-module-button");
	$button.removeClass("thin");
	$divToUnfold.removeClass("folded");
	$divToUnfold.find(".folding.state.content").remove();
};

function initSettings() {
	$(".fold.all.button").click(function() {
		$(".graph-content > .column:not(.settings)").each(function() {
			if(!$(this).hasClass("folded")) {
				foldModule($(this));
			}
		});
	});
	$(".unfold.all.button").click(function() {
		$(".graph-content > .column:not(.settings)").each(function() {
			if($(this).hasClass("folded")) {
				unfoldModule($(this));
			}
		});
	});
	$(".transpose.button").click(function() {
		$transposeModal = $(".ui.transpose.modal");

		var $titleDropdown = $transposeModal.find(".transpose.title").find(".dropdown");
		$titleDropdown.replaceWith("<select name='transpose-title' class='ui selection dropdown'></select>");
		$titleDropdown = $transposeModal.find(".transpose.title").find(".dropdown");
		$titleDropdown.html($("<option />").val("").text("Select Title Column"));
		Dashboard.getColumns().forEach(function(column) {
			$titleDropdown.append($("<option />").val(column).text(column))
		});
		$titleDropdown.dropdown();

		var $rowDropdown = $transposeModal.find(".transpose.rows").find(".dropdown");
		$rowDropdown.replaceWith("<select multiple='' name='transpose-rows' class='ui selection dropdown'></select>");
		$rowDropdown = $transposeModal.find(".transpose.rows").find(".dropdown");
		$rowDropdown.html($("<option />").val("").text("Select Rows"));
		$rowDropdown.addClass("disabled");
		$rowDropdown.dropdown();

		$transposeModal.find(".transpose.type").find(".dropdown").dropdown("clear");

		updateForm();

		$transposeModal.modal('setting', {
			autofocus: false
		}).modal("show");
	});
	$(".revert.button").click(function() {
		Dashboard.setTransposing(false);
		drawCharts();
		$(".masonry.grid").masonry('layout');
	});
	$(".clear.modules.button").click(function() {
		$(".graph-content > .column:not(.settings)").each(function() {
			$(this).find(".close-module-button").trigger("click");
		});
		updateSampleNotice();
	});
	$(".restore.default.button").click(function() {
		$(".graph-content > .column:not(.settings)").each(function() {
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
		$(".masonry.grid").masonry('layout');
	});	
}

function initQuicklook() {
	var initQuicklookData = function() {
		return new Promise(function(resolve, reject) {
			$(".look.button").addClass("loading");
			setTimeout(function() {
				$(".quicklook.modal").find(".content").html("<table class='ui compact celled table'></table>");
				$(".quicklook.modal").find("table").html(Dashboard.getDataTable().html());
				$(".quicklook.modal").find("table").DataTable();
				$(".quicklook.modal").resize(function() {
					$(".quicklook.modal").modal("refresh");
				});
				resolve();
			}, 1);
		});
	};
	$(".ui.look.button").click(function() {
		initQuicklookData()
			.then(function() {
				$(".look.button").removeClass("loading");
				$(".quicklook.modal").modal('setting', {
					inverted: true,
					autofocus: false
				}).modal("show");
			});
	});
}

function initTransposeModal() {
	$(".transpose.modal .type.field .dropdown").dropdown({
		onChange: function(specifiedType) {
			if(specifiedType == "") return;
			var $rowDropdown = $transposeModal.find(".transpose.rows").find(".dropdown");
			$rowDropdown.replaceWith("<select multiple='' name='transpose-rows' class='ui selection dropdown'></select>");
			$rowDropdown = $transposeModal.find(".transpose.rows").find(".dropdown");
			$rowDropdown.append($("<option />").val("").text("Select Title Column"));
			Dashboard.getColumns(specifiedType).forEach(function(column) {
				$rowDropdown.append($("<option />").val(column).text(column));
			});
			$rowDropdown.removeClass("disabled");
			$rowDropdown.dropdown({
				onChange: function() {
					$(".transpose.modal").modal("refresh");
				}
			});

			updateForm();
		}
	});
	$(".transpose.modal .primary.button").click(function() {
		$(".transpose.modal .ui.form").submit();
	});
}

function updateForm() {
	$(".transpose.modal .ui.form").form({
		fields: {
			"transpose-title": "empty",
			"transpose-type": "empty",
			"transpose-rows": "empty"
		},
		onSuccess: function() {
			var titleColumn = $transposeModal.find(".transpose.title").find(".dropdown").dropdown("get value")[0];
			var dataType = $transposeModal.find(".transpose.type").find(".dropdown").dropdown("get value")[0];
			var rows = $transposeModal.find(".transpose.rows").find(".dropdown").dropdown("get value").slice(0, -1);
			Dashboard.setTransposeData(titleColumn, dataType, rows);
			$(".transpose.modal").modal("hide");
			drawCharts(null, true);
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
