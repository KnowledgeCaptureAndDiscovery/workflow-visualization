/*!
 * Code adapted from https://css-tricks.com/drag-and-drop-file-uploading/
 */
DragAndDrop = (function ($, document, window) {
	var module = {};

	module.init = function (action, multiple = false) {
		var $form 		= $('.box');
		var $input 		= $form.find('input[type="file"]');
		var $label		 = $form.find('label');
		var $errorMsg	 = $form.find('.box__error span');
		var $restart	 = $form.find('.box__restart');
		var droppedFiles = false;
		var toLoad = 0;
		var dataLoaded = [];

		$form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
			e.preventDefault();
			e.stopPropagation();
		})
		.on('dragover dragenter', function() {
			$form.addClass('is-dragover');
		})
		.on('dragleave dragend drop', function() {
			$form.removeClass('is-dragover');
		})
		.on('drop', function(e) {
			droppedFiles = e.originalEvent.dataTransfer.files;
			if(!checkFileCount(droppedFiles)) return;
			if(multiple) {
				$label.text("Uploading " + droppedFiles.length + " files.");
			}
			else {
				$label.text(droppedFiles[0].name);
			}
			submitForm();
		});

		$input.on('change', function(e) {
			droppedFiles = e.target.files;
			if(!checkFileCount(droppedFiles)) return;
			if(multiple) {
				$label.text("Uploading " + droppedFiles.length + " files.");
			}
			else {
				$label.text(droppedFiles[0].name);
			}
			submitForm();
		});

		var checkFileCount = function(files) {
			if(files.length == 1) {
				if(!multiple) {
					return true;
				}
				else {
					$errorMsg.html('Please upload more than one file.');
				}
			}
			else if(files.length == 0) {
				$errorMsg.html('No file uploaded.');
			}
			else {
				if(multiple) {
					return true;
				}
				else {
					$errorMsg.html('Please only upload one file.');
				}
			}
			$form.addClass('is-error');
			return false;
		}

		function submitForm() {
			if ($form.hasClass('is-uploading')) return false;

			$(".ui.modal").modal('hide');
			Dashboard.progress.set(0);

			$form.addClass('is-uploading').removeClass('is-error');

			toLoad = droppedFiles.length;
			dataLoaded = [];
			for(var i = 0; i < droppedFiles.length; i++) {
				dataLoaded.push(null);
			}

			dataLoaded.forEach(function (val, ix) {
				var reader = new FileReader();
				reader.readAsText(droppedFiles[ix], "UTF-8");
				reader.onload = function (e) {
					var data = e.target.result;
					dataLoaded[ix] = data;
					checkLoaded();
				}
			});
		}

		function checkLoaded() {
			toLoad--;
			if(toLoad == 0) {
				$form.removeClass('is-uploading');
				if(multiple) {
					action(dataLoaded);
				}
				else {
					action(dataLoaded[0]);
				}
			}
		}

		$restart.on('click', function(e) {
			e.preventDefault();
			$form.removeClass('is-error is-success is-uploading');
			$label.html('<strong>Choose a file</strong><span class="box__dragndrop"> or drag it here</span>.');
		})

		$restart.trigger('click');
	}

	return module;
	
}(jQuery, document, window));