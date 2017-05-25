/*!
 * Code adapted from https://css-tricks.com/drag-and-drop-file-uploading/
 */
DragAndDrop = (function ($, document, window) {
	var module = {};

	module.init = function (action) {
		var $form 		= $('.box');
		var $input 		= $form.find('input[type="file"]');
		var $label		 = $form.find('label');
		var $errorMsg	 = $form.find('.box__error span');
		var $restart	 = $form.find('.box__restart');
		var droppedFiles = false;

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
			$label.text(droppedFiles[0].name);
			submitForm();
		});

		$input.on('change', function(e) {
			droppedFiles = e.target.files;
			if(!checkFileCount(droppedFiles)) return;
			$label.text(droppedFiles[0].name);
			submitForm();
		});

		var checkFileCount = function(files) {
			if(files.length == 1) {
				return true;
			}
			else if(files.length == 0) {
				$errorMsg.html('No file uploaded.');
				$form.addClass('is-error');
				console.log("no file dropped");
			}
			else {
				$errorMsg.html('Please only upload one file.');
				$form.addClass('is-error');
				console.log("dropped too many files");
			}
			return false;
		}

		function submitForm() {
			if ($form.hasClass('is-uploading')) return false;

			$(".ui.modal").modal('hide');

			$form.addClass('is-uploading').removeClass('is-error');

			var reader = new FileReader();
			reader.readAsText(droppedFiles[0], "UTF-8");
			reader.onload = function (e) {
				$form.removeClass('is-uploading');

				var data = e.target.result;
				action(data);
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