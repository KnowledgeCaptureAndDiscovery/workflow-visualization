var Dashboard = (function ($) {

    var module = {};

    var data = [];
    var div = "";
    var chartTypes = [];

    module.init = function(inputData, types) {
      chartTypes = types;
      module.reset();

      var success;

      inputData.forEach(function(individualInputData) {
        var dataReader = new DataReader(individualInputData);
        if(dataReader.success) {
          data.push(dataReader.data);
        }
        else {
          module.handleError(dataReader.error);
        }
        success = success && dataReader.success;
      });

      return success;
    };

    // @brief error handler for the parsing process
    //        shows the error and resets progress
    // @param errMsg  error message to be shown in the error message modal
    module.handleError = function(errMsg) {
      var $errmsg = $(".errmsg.modal");
      $errmsg.find('.description').text(errMsg);
      $errmsg.modal('settings', {
        closable  : false
      }).modal('show');
      module.progress.set(-1);
      module.reset();    
      $(".global.data.dropdown").dropdown('restore defaults');
    };

    // @brief initialize all graph drawing modules
    // @param divCode   the div selector name where graph drawing modules reside
    module.draw = function(divCode = ".graph-content") {
      div = divCode;

      for(ix in chartTypes) {
        var funcName = chartTypes[ix];
        $(div + ' .column.' + funcName + ':not(.hoarded)').each(function() {
          $(this)["dashboard_" + funcName](data);
        });
      }
    };

    // @brief draw a single module only
    // @param divCode         the div selector name where graph drawing modules reside
    // @param moduleTypeCode  the identifier of the module type
    module.drawModule = function(divCode, moduleTypeCode) {
      $(divCode)["dashboard_" + moduleTypeCode](data);
    };

    // @brief variable to deal with visualizing loading indicator
    //        progress = 0 : loading starts, old graphs are hidden and indicator starts
    //        progress = 1 : downloading finishes, data parsing starts
    //        progress = 2 : parsing ends, module initialization starts
    //        progress = 3 : all work done, indicator is hidden and graphs are shown
    //        progress = -1 : bad things happened. Reset everything. Error message is handled elsewhere.
    module.progress = (function() {
      var progress = 0;
      var text = "";
      return {
        set: function(val) {
          progress = val;

          if(val == 0) {
            $(".graphs").addClass("hidden");
            $(".graphs + .ui.dimmer").addClass("active");
            $(".global.data.dropdown").addClass("disabled");
            $(".global.settings.dropdown").addClass("disabled");
            text = "Downloading File";
          }
          else if(val == 1) {
            text = "Parsing Data";
          }
          else if(val == 2) {
            text = "Loading Visualizations";
          }
          else if(val == 3) {
            $(".graphs + .ui.dimmer").removeClass("active");
            $(".graphs").removeClass("hidden");
            $(".global.data.dropdown").removeClass("disabled");
            $(".global.settings.dropdown").removeClass("disabled");
          }
          else {
            $(".graphs").removeClass("hidden");
            $(".graphs + .ui.dimmer").removeClass("active");
            $(".global.data.dropdown").removeClass("disabled");
            $(".global.settings.dropdown").removeClass("disabled");
            progress = 0;
            text = "";
          }
          $(".graphs + .ui.dimmer > .text.loader").text(text);
        },
        get: function() {
          return progress;
        }
      };
    }());

    // @brief get data currently stored in the module
    module.getColumns = function(type = "") {
      return data["attribute"].filter(function(val) {
        return type == "" || val["type"]["type"] == type;
      }).map(function(val) {
        return val["name"];
      });
    };

    module.clone = function(obj) {
      var copy;

      // Handle the 3 simple types, and null or undefined
      if (null == obj || "object" != typeof obj) return obj;

      // Handle Date
      if (obj instanceof Date) {
          copy = new Date();
          copy.setTime(obj.getTime());
          return copy;
      }

      // Handle Array
      if (obj instanceof Array) {
          copy = [];
          for (var i = 0, len = obj.length; i < len; i++) {
              copy[i] = module.clone(obj[i]);
          }
          return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
          copy = {};
          for (var attr in obj) {
              if (obj.hasOwnProperty(attr)) copy[attr] = module.clone(obj[attr]);
          }
          return copy;
      }

      throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    // @brief reset the module, which includes reseting and hiding all submodules
    module.reset = function() {
      data = [];

      /* hide all graphs */
      $(".graph-content > .column").addClass("hidden");

      /* reset all graphs */
      for(ix in chartTypes) {
        var funcName = chartTypes[ix];
        $(div + ' .column.' + funcName).each(function() {
          $(this)["dashboard_" + funcName]("reset");
        });
      }

      Highcharts.setOptions({
        chart: {
          height: "300px"
        }
      });
    };

    return module;

}(jQuery));

