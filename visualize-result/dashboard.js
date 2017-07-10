var Dashboard = (function ($) {

    var module = {};

    var data = {};
    var transposedData = {};
    var transposing = false;
    var currentData = {};
    var div = "";
    var chartTypes = [];

    module.init = function(inputData, types) {
      // TIME_KEEPING
      // console.log("--- Dashboard Script Starts Loading ---");
      // window.ST = (new Date());
      // console.log("Dashboard init: " + 0);

      chartTypes = types;
      module.reset();

      var dataReader = new DataReader(inputData);
      if(dataReader.success) {
        data = dataReader.data;
      }
      else {
        module.handleError(dataReader.error);
      }
      return dataReader.success;

      // TIME_KEEPING
      // console.log("Dashboard init: " + ((new Date())-window.ST));
      // console.log("--- Dashboard Script Ends Loading ---");
    };

    // @brief error handler for the parsing process
    //        shows the error and resets progress
    // @param errMsg  error message to be shown in the error message modal
    module.handleError = function(errMsg) {
      $(".ui.look.button").addClass("disabled");
      var $errmsg = $(".errmsg.modal");
      $errmsg.find('.description').text(errMsg);
      $errmsg.modal('settings', {
        closable  : false
      }).modal('show');
      module.progress.set(-1);
      module.reset();    
      $(".header-dropdown").dropdown('restore defaults');
    };

    // @brief initialize all graph drawing modules
    // @param divCode   the div selector name where graph drawing modules reside
    module.draw = function(divCode = ".graph-content") {
      div = divCode;
      currentData = transposing ? transposedData : data;

      if($(".settings .clustering.content .checkbox").checkbox("is checked")) {
        currentData = module.addClusterData(currentData);
      }
      for(ix in chartTypes) {
        var funcName = chartTypes[ix];
        $(div + ' .column.' + funcName + ':not(.hoarded)').each(function() {
          $(this)["dashboard_" + funcName](currentData);
        });
      }
    };

    // @brief draw a single module only
    // @param divCode         the div selector name where graph drawing modules reside
    // @param moduleTypeCode  the identifier of the module type
    module.drawModule = function(divCode, moduleTypeCode) {
      $(divCode)["dashboard_" + moduleTypeCode](currentData);
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
            $(".header-dropdown").addClass("disabled");
            $(".look.button").addClass("disabled");
            $(".downloading.button").addClass("disabled");
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
            $(".header-dropdown").removeClass("disabled");
            $(".look.button").removeClass("disabled");
          }
          else {
            $(".graphs").removeClass("hidden");
            $(".graphs + .ui.dimmer").removeClass("active");
            $(".header-dropdown").removeClass("disabled");
            $(".look.button").removeClass("disabled");
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

    // @brief add clustering data as a column of the original data
    // @param dataToDraw  data to be visualized
    // @return            manipulated data
    module.addClusterData = function(dataToDrawOrigin) {
      var dataToDraw = module.clone(dataToDrawOrigin);

      // preparation
      var dataForClustering = [];
      dataToDraw["attribute"].forEach(function(column) {
        if(column.type.type == "numeric" || column.type.type == "discrete") {
          dataForClustering.push(dataToDraw["data"].map(function(item) {
            return item[column["name"]];
          }));
        }
        else if(column.type.type == "nominal") {
          column.type.oneof.forEach(function(category) {
            dataForClustering.push(dataToDraw["data"].map(function(item) {
              return (item[column["name"]] == category) ? 1 : 0;
            }));
          });
        }
      });
      var dataExtremes = dataForClustering.map(function(dimension) {
        return { min: d3.min(dimension), max: d3.max(dimension) };
      });
      dataForClustering = d3.transpose(dataForClustering);

      // init means
      var numDimensions = dataExtremes.length;
      var means = [];
      var numMeans = $(".settings .clustering.content .ui.range").data("ionRangeSlider").result.from;
      for(var i = 0; i < numMeans; i++) {
        means.push(dataExtremes.map(function(extremes) {
          return extremes.min + Math.random() * (extremes.max - extremes.min);
        }));
      }

      // clustering
      var clusters = ML.Clust
        .kmeans(dataForClustering, numMeans, {initialization: means})
        .clusters
        .map(function(val) {
          return "Cluster " + (val + 1);
        });

      dataToDraw["attribute"].push({
        name: "Clusters",
        type: {
          type: "nominal",
          oneof: means.map(function(_, ix) {
            return "Cluster " + (ix + 1);
          })
        }
      });

      dataToDraw["data"] = dataToDraw["data"].map(function(val, ix) {
        val["Clusters"] = clusters[ix];
        return val;
      });

      return dataToDraw;
    }

    // @brief transpose dataset and display visualizations for the processed data
    // @param titleColumn column to be used as new column titles
    // @param dataType    data types of the rows
    // @param rows        row names
    module.setTransposeData = function(titleColumn, dataType, rows) {
      transposedData = {};
      var columnNames = data["data"].map(function(dataRow) {
        return dataRow[titleColumn];
      });
      transposedData.data = rows.map(function(rowName, ix) {
        var row = {};
        row["Index"] = rowName;
        data["data"].forEach(function(originalRow) {
          row[originalRow[titleColumn]] = originalRow[rows[ix]];
        });
        return row;
      });
      transposedData.attribute = columnNames.map(function(columnName) {
        var thisAttribute = {
          name: columnName,
          type: {
            type: dataType
          }
        };
        if(dataType == "nominal") {
          thisAttribute.type.oneof = new Set(transposedData.data.map(function(row) {
            return row[columnName];
          })).values();
        }
        return thisAttribute;
      });
      transposing = true;
    };

    // @brief set   the transposing flag
    // @param flag  the new value to be set to transposing
    module.setTransposing = function(flag) {
      transposing = flag;
    };

    // @brief get currently rendered data in table format
    module.getDataTable = function() {
      var table = $('<table></table>');
      var thead = $('<thead></thead>').append($('<tr></tr>').append(
        data["attribute"].map(function(attr) {
          return "<th>" + attr["name"] + "</th>";
        }).join("")
      ));
      table.append(thead);
      var tbody = $('<tbody></tbody>').append(
        data["data"].map(function(row) {
          return "<tr>" + Object.keys(row).map(function(name) {
            return "<td>" + row[name] + "</td>"
          }).join("") + "</tr>";
        }).join("")
      );
      table.append(tbody);
      return table;
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
      data = {};

      /* hide all graphs */
      $(".graph-content > .column").addClass("hidden");

      /* reset all graphs */
      for(ix in chartTypes) {
        var funcName = chartTypes[ix];
        $(div + ' .column.' + funcName).each(function() {
          $(this)["dashboard_" + funcName]("reset");
        });
      }
    };

    return module;

}(jQuery));

