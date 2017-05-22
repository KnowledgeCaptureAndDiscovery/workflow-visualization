var Dashboard = (function ($) {
    var module = {};

    var data = {};
    var div = "";
    var chartTypes = [];

    // delete quotes and replace punctuation to spaces
    module.formatString = function(str) {
      if(str[0] == '"' && str[0] == str[str.length - 1]) {
        str = str.substring(1, str.length - 1);
      }
      return str.replace(/([a-zA-Z]+)[.]([a-zA-Z]+)/g, "$1 $2");
    }

    module.init = function(inputData, types) {
      chartTypes = types;
      module.reset();
      module.initWithType(inputData, module.identifyType(inputData));
    }

    module.initWithType = function(inputData, type) {
      switch(type) {
      case "csv":
        module.readCsvData(inputData);
        break;
      case "arff":
        module.readArffData(inputData);
        break;
      default:
        console.log("Error document type!");
        return;
      }
    }

    module.identifyType = function(inputData) {
      function isArffData(data) {
        if (!data.match(/@relation/i)) {
          return false;
        }
        if (!data.match(/@attribute/i)) {
          return false;
        }
        if (!data.match(/@data/i)) {
          return false;
        }
        return true;
      }

      if(isArffData(inputData)) return "arff";
      else return "csv";
    }

    module.readCsvData = function(csvString) {
      // list of possible delimiters of csv string
      var possibleDelimiters = [",", "\t", "\s"];

      // function that guesses possible delimiter of given data
      function guessDelimiters (text, possibleDelimiters) {
          return possibleDelimiters.filter(weedOut);

          function weedOut (delimiter) {
              var cache = -1;
              return text.split('\n').every(checkLength);

              function checkLength (line) {
                  if (!line) {
                      return true;
                  }

                  var exp = new RegExp('(".*?"|[^"' + delimiter + '\s]+)(?=\s*' + delimiter + '|\s*$)', "g");
                  var matches = line.match(exp) || [];
                  var length = matches.length;
                  if (cache < 0) {
                      cache = length;
                  }
                  return cache === length && length > 1;
              }
          }
      }

      // check if the given data is a single column of data
      // in which case guess delimiters fails
      function checkSingleColumnData (text) {
          var splitted = text.split('\n');

          for(var ix = 0; ix < splitted.length; ix++) {
            if(splitted[ix].trim().match(/\s/g)) return false;
          }

          return true;
      }

      // check if the first row is header
      //
      // Criteria: if all row items in the 1st and 2nd rows are same
      //            then return true
      function hasHeader (data, headerArray, secondRow) {
        for(var ix = 0; ix < headerArray.length; ix++) {
          var mappedData = data.map(function(val) {
            return val[ix];
          });

          var matches = mappedData.filter(function(val) {
            return val == headerArray[ix];
          });

          if(isNaN(headerArray[ix]) != isNaN(secondRow[ix])) {
            return true;
          }
          else if(isNaN(headerArray[ix]) && matches.length == 1) {
            return true;
          }
        }
        return false;
      }

      // guess delimiters
      possibleDelimiters = guessDelimiters(csvString, possibleDelimiters);

      // if guess delimiters fails, check single column or exit
      if(possibleDelimiters.length == 0) {
        if(checkSingleColumnData(csvString)) {
          possibleDelimiters[0] = ',';
        }
        else {
          var msg = "Your file seems to be a CSV file "
            + "but has unclear delimiter. "
            + "Please check the format of your file "
            + "and upload again.";
          module.handleError(msg);
          return;
        }
      }

      // prepare for csv parsing
      var csvArray  = [];
      var csvRows   = csvString.match(/[^\r\n]+/g);
      var csvHeader = [];

      var csvHasHeader = hasHeader(
        csvRows.map(function(val) { return val.split(possibleDelimiters[0]); }),
        csvRows[0].split(possibleDelimiters[0]), 
        csvRows[1].split(possibleDelimiters[0])
      );

      if(csvHasHeader) {
        csvHeader = csvRows.shift().split(possibleDelimiters[0]).map(module.formatString);
      }
      else {
        var columnCount = csvRows[0].split(possibleDelimiters[0]).length;
        for(var ix = 0; ix < columnCount; ix++) {
          csvHeader.push("Column " + (ix+1));
        }
      }

      // prepare empty result object
      data = { 'relation': [], 'attribute': [], 'data': [] };

      // parse each row into the result
      for(var rowIndex = 0; rowIndex < csvRows.length; rowIndex++) {
        var delimiter = possibleDelimiters[0];
        var exp = new RegExp('(".*?"|[^"' + delimiter + '\s]+)(?=\s*' + delimiter + '|\s*$)', "g");
        var rowArray = csvRows[rowIndex].match(exp) || [];
        var parsed = {};
        for(var colIndex = 0; colIndex < rowArray.length; colIndex++) {
          // check if the data is number or string
          if(!isNaN(rowArray[colIndex])) {
            parsed[csvHeader[colIndex]] = parseFloat(rowArray[colIndex]);
          }
          else {
            parsed[csvHeader[colIndex]] = module.formatString(rowArray[colIndex]);
          }
        }
        csvArray.push(parsed);
      }

      // set module's data member
      data['data'] = csvArray;

      // set attribute types
      for(colIndex = 0; colIndex < rowArray.length; colIndex++) {
        if(!isNaN(rowArray[colIndex])) {
          data['attribute'].push({
            "name": csvHeader[colIndex],
            "type": {
              "type": "numeric"
            }
          });
        }
        else {
          function onlyUnique(value, index, self) { 
            return self.indexOf(value) === index;
          }
          var uniqueArray = data['data'].map(function(item) { return item[csvHeader[colIndex]]; });
          uniqueArray = uniqueArray.filter(onlyUnique);
          if(uniqueArray.length < 10) {
            data['attribute'].push({
              "name": csvHeader[colIndex],
              "type": {
                "type": "nominal",
                "oneof": uniqueArray
              }
            });
          }
          else {
            data['attribute'].push({
              "name": csvHeader[colIndex],
              "type": {
                "type": "string"
              }
            });
          }
        }
      }

      // for debug: print the parsed data
      // console.log(data);
    }

    module.readArffData = function(csvString) {
      var section;
      var parsed = { 'relation': [], 'attribute': [], 'data': [] };

      function readLine(line) {
          if (!section) section = 'header';

          var chunks = line.trim().split(/[\s]+/);

          // skip blank lines and comments
          if (chunks.length === 1 && chunks[0] === '') return true;
          else if (/^%/.test(chunks[0])) {
            return true;
          }

          // relation name
          else if (/^@RELATION/i.test(chunks[0])) {
            if (section !== 'header') {
              console.log('@RELATION found outside of header');
              return false;
            }
            parsed['relation'].push(chunks[1]);
          }

          // attribute spec
          else if (/^@ATTRIBUTE/i.test(chunks[0])) {
            if (section != 'header') {
              console.log('@ATTRIBUTE found outside of header section');
              return false;
            }
            var name = chunks[1].replace(/['"]|:$/g, '');
            var type = parseAttributeType(chunks.slice(2).join(' '));
            parsed['attribute'].push({ "name": module.formatString(name), "type": type });
          }

          else if (/^@DATA/i.test(chunks[0])) {
            if (section == 'data') {
              console.log('@DATA found after DATA');
              return false;
            }
            section = 'data';
          }
          else {
            if (section == 'data') {
              var dataRow = chunks.join('').replace(/['"]/g, '').split(',');
              var parsedRow = {};
              for(var ix = 0; ix < dataRow.length; ix++) {
                var entryName = parsed["attribute"][ix]["name"];
                if(parsed["attribute"][ix]["type"]["type"] == "numeric") {
                  parsedRow["" + entryName] = parseFloat(dataRow[ix]);
                }
                else {
                  parsedRow["" + entryName] = dataRow[ix];
                }
              }
              parsed['data'].push(parsedRow);
            }
          }
          return true;
      }

      function parseAttributeType(type) {
        var finaltype = { "type": type };
        var parts;

        if (/^date/i.test(type)) {
          parts = type.split(/[\s]+/);
          var format = "yyyy-MM-dd'T'HH:mm:ss";
          if (parts.length > 1) {
            format = parts[1];
          }
          finaltype = {
            "type": 'date',
            "format": format
          }
        }
        else if (parts = type.match(/^{([^}]*)}$/)) {
          finaltype["type"] = 'nominal';
          finaltype["oneof"] = parts[1].replace(/[\s'"]/g, '').split(/,/);
        }
        else if (/^numeric|^integer|^real|^continuous/i.test(type)) {
          finaltype["type"] = 'numeric';
        }
        else if (/string/i.test(type)) {
          finaltype["type"] = 'string';
        }

        return finaltype;
      }

      var lines = csvString.match(/[^\r\n]+/g);

      for(lineIndex in lines) {
          if((lines[lineIndex].replace(/\s/g,''))[0] == '%') continue;
          if(readLine(lines[lineIndex]) == false) return;
      }

      // for debug: log parsed data
      // console.log(parsed);

      data = parsed;
    }

    /* handle error */
    module.handleError = function(errMsg) {
      $(".ui.look.button").addClass("disabled");
      var $errmsg = $(".errmsg.modal");
      $errmsg.find('.description').text(errMsg);
      $errmsg.modal('settings', {
        closable  : false
      }).modal('show');
      module.reset();    
      $(".header-dropdown").dropdown('restore defaults');
    }

    /* plotting */

    module.draw = function(divCode = ".graph-content") {
      div = divCode;

      for(ix in chartTypes) {
        var funcName = chartTypes[ix];
        module[funcName].init($(div + ' .' + funcName), data);
      }
    }

    module.reset = function() {
      data = {};

      /* hide all graphs */
      $(".graph-content > .column").addClass("hidden");

      /* reset all graphs */
      for(ix in chartTypes) {
        var funcName = chartTypes[ix];
        module[funcName].reset();
      }
    }

    /* Code source: http://stackoverflow.com/questions/6074833/load-and-execute-javascript-code-synchronously */
    module.loadScriptSync = function(src) {
      var s = document.createElement('script');
      s.src = src;
      s.type = "text/javascript";
      s.async = false;
      document.getElementsByTagName('head')[0].appendChild(s);
    }

    return module;

}(jQuery));

