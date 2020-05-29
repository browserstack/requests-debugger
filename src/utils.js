var cp = require('child_process');
var os = require('os');
var fs = require('fs');

var proxyAuthToBase64 = function (proxyObj) {
  if (typeof proxyObj === 'object') {
    var base64Auth = Buffer.from(proxyObj.username + ":" + proxyObj.password);
  } else if (typeof proxyObj === 'string') {
    var base64Auth = Buffer.from(proxyObj);
  }
  return "Basic " + base64Auth.toString('base64');
}

/**
 * Fetch the property value from the string array of content, each separated by a separator
 * @param {Array<String>} content 
 * @param {String} propertyToFetch 
 * @param {String} separator 
 */
var fetchPropertyValue = function (content, propertyToFetch, separator) {
  separator = separator || ':';
  propertyToFetch = propertyToFetch.toLowerCase();
  for (var line of content) {
    var modifiedLine = line.toLowerCase().replace(/\t/g, '');
    if (modifiedLine.startsWith(propertyToFetch)) {
      var splitModifiedLine = modifiedLine.split(separator);
      if (splitModifiedLine.length >= 2) {
        splitModifiedLine.shift();
        return splitModifiedLine.join(separator).trim();
      } else {
        return '';
      }
    }
  }
  return '';
}

var formatAndBeautifyLine = function (line, prefix, suffix, idealLength, newLine) {
  line = safeToString(line) || 'null/undefined';
  if (line) {
    var lineLength = line.length;
    idealLength = idealLength || 70;
    newLine = newLine || false;
    if (lineLength > idealLength) return (newLine ? line + os.EOL : line);

    var remainingCharacters = idealLength - lineLength;
    var prefixCharacters = parseInt(remainingCharacters/2);
    var suffixCharacters = remainingCharacters % 2 == 0 ? prefixCharacters : prefixCharacters + 1;
    if (prefix && suffix) {
      line = prefix.toString().repeat(prefixCharacters) + " " + line + " " + suffix.toString().repeat(suffixCharacters);
    } else if (prefix) {
      line = prefix.toString().repeat(remainingCharacters) + " " + line;
    } else if (suffix) {
      line = line + " " + suffix.toString().repeat(remainingCharacters);
    }

    return newLine ? line + os.EOL : line;
  }
}

/**
 * 
 * @param {String} content 
 * @param {String} title 
 * @param {Date} generatedAt 
 * @param {Date} startTime 
 */
var generateHeaderAndFooter = function (content, title, generatedAt, startTime) {
  if (typeof content === 'undefined' || !content.toString()) return 'NO_CONTENT_PROVIDED';
  title = title || "NO_TITLE_PROVIDED"

  startTime = new Date(startTime);
  startTime = startTime.toString === 'Invalid Date' ? new Date().toISOString() : startTime.toISOString();

  generatedAt = new Date(generatedAt);
  generatedAt = generatedAt.toString === 'Invalid Date' ? startTime : generatedAt.toISOString();

  content = os.EOL + formatAndBeautifyLine("=", "*", "*", 90, true)
                   + formatAndBeautifyLine("Title: " + title, "", "=", 90, true)
                   + formatAndBeautifyLine("Start Time: " + startTime, "", "=", 90, true)
                   + formatAndBeautifyLine("Generated At: " + generatedAt, "", "=", 90, true)
                   + formatAndBeautifyLine("=", "*", "*", 90, true)
                   + content.toString()
                   + formatAndBeautifyLine("=", "*", "*", 90, true);

  return content;
}

var execMultiple = function (commands, callback) {
  if (!Array.isArray(commands)) {
    return "COMMANDS_IS_NOT_AN_ARRAY";
  }

  var resultArray = new Array(commands.length);
  var totalCommandsCompleted = 0;

  commands.forEach(function (cmd, index) {
    cp.exec(cmd, function (err, result) {
      if (!err) {
        resultArray[index] = { content: result, generatedAt: new Date() }
      } else {
        resultArray[index] = { content: "NO_RESULT_GENERATED" + os.EOL, generatedAt: new Date() };
      }

      if (++totalCommandsCompleted === commands.length) {
        callback(resultArray);
      } 
    })
  })
}

var getWmicPath = function () {
  if (os.type() === 'Windows_NT') {
    var wmicPath = process.env.WINDIR + '\\system32\\wbem\\wmic.exe';
    if (!fs.existsSync(wmicPath)) {
      try {
        var whereWmicArray = cp.execSync('WHERE WMIC').toString().split('\r\n');
        if (whereWmicArray && whereWmicArray[0]) {
          wmicPath = whereWmicArray[0];
        } else {
          wmicPath = 'wmic';
        }
      } catch (e) {
        wmicPath = 'wmic';
      }
    }
    return wmicPath + ' ';
  } else {
    throw Error('Not Windows Platform');
  }
}

var beautifyObject = function (obj, keysTitle, valuesTitle, maxKeyLength, maxValLength) {
  if (typeof obj !== 'object') return 'No Object Passed' + os.EOL;
  if (Array.isArray(obj)) {
    var longestKeyOfAll = 0;
    var longestValOfAll = 0;
    for (var indObj of obj) {
      if (typeof indObj !== 'object' && !Array.isArray(indObj)) continue;
      var indObjKeyLength = getLongestVal(Object.keys(indObj));
      var indObjValLength = getLongestVal(Object.keys(indObj).map(function (key) { return indObj[key] }));
      longestKeyOfAll = indObjKeyLength > longestKeyOfAll ? indObjKeyLength : longestKeyOfAll;
      longestValOfAll = indObjValLength > longestValOfAll ? indObjValLength : longestValOfAll;
    }

    var aggResult = '';
    for (var indObj of obj) {
      aggResult += beautifyObject(indObj, keysTitle, valuesTitle, longestKeyOfAll, longestValOfAll);
    }
    return os.EOL + aggResult;
  }

  keysTitle = keysTitle || "KEY";
  valuesTitle = valuesTitle || "VALUE";
  var longestKey = maxKeyLength || getLongestVal(Object.keys(obj));
  var longestVal = maxValLength || getLongestVal(Object.keys(obj).map(function (key) { return obj[key]; }));

  longestKey = keysTitle.length > longestKey ? keysTitle.length : longestKey;
  longestVal = valuesTitle.length > longestVal ? valuesTitle.length : longestVal;

  var finalResult = formatAndBeautifyLine(keysTitle, " ", " ", longestKey, false)
                    + ' : '
                    + formatAndBeautifyLine(valuesTitle, " ", " ", longestVal, true)
                    + formatAndBeautifyLine("-", "-", "", 90, true);

  Object.keys(obj).forEach(function (key) {
    finalResult += formatAndBeautifyLine(key, " ", " ", longestKey, false)
                + ' : '
                + formatAndBeautifyLine(obj[key], " ", " ", longestVal, true);
  });

  return os.EOL + finalResult + os.EOL;
}

var getLongestVal = function (arr) {
  var longest = arr.reduce(function (prevValue, currValue) {
    if (safeToString(currValue).length > prevValue) {
      return safeToString(currValue).length;
    }
    return prevValue;
  }, 0);
  return longest;
}

var safeToString = function (val) {
  try {
    val = val.toString();
  } catch (e) {
    val = JSON.stringify(val);
  }
  return val;
}

var isValidCallback = function (checkCallback) {
  return (checkCallback && typeof checkCallback === 'function');
}

module.exports = {
  proxyAuthToBase64,
  fetchPropertyValue,
  formatAndBeautifyLine,
  generateHeaderAndFooter,
  execMultiple,
  getWmicPath,
  beautifyObject,
  isValidCallback,
  safeToString
}