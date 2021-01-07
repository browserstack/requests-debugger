var cp = require('child_process');
var os = require('os');
var fs = require('fs');

/**
 * Returns the value for authorization header by performing
 * base64 operation on the proxy auth params.
 * Input can be in the form of:
 * 1. 'user:pass'
 * 2. { username: 'user', password: 'pass' }
 * @param {String|{username: String, password: String, host: String, port: String|Number}} proxyObj
 * @returns {String}
 */
var proxyAuthToBase64 = function (proxyObj) {
  var base64Auth;
  if (typeof proxyObj === 'object') {
    base64Auth = new Buffer(proxyObj.username + ":" + proxyObj.password);
  } else if (typeof proxyObj === 'string') {
    base64Auth = new Buffer(proxyObj);
  }
  return "Basic " + base64Auth.toString('base64');
};

/**
 * Fetch the property value from the string array of content, each separated by a separator
 * @param {Array<String>} content
 * @param {String} propertyToFetch
 * @param {String} separator
 * @returns {String}
 */
var fetchPropertyValue = function (content, propertyToFetch, separator) {
  separator = separator || ':';
  propertyToFetch = propertyToFetch.toLowerCase();
  for (var index in content) {
    var modifiedLine = content[index].toLowerCase().replace(/\t/g, '');
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
};

/**
 * Beautifies the lines and add prefix/suffix characters to make the line of the required length.
 * @param {String} line
 * @param {String} prefix
 * @param {String} suffix
 * @param {Number} idealLength
 * @param {Boolean} newLine
 * @returns {String}
 */
var formatAndBeautifyLine = function (line, prefix, suffix, idealLength, newLine) {
  line = safeToString(line);
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
  }
  return newLine ? line + os.EOL : line;
};

/**
 * Generates header and footer for the given content.
 * @param {String} content
 * @param {String} title
 * @param {Date} generatedAt
 * @param {Date} startTime
 * @returns {String}
 */
var generateHeaderAndFooter = function (content, title, generatedAt, startTime) {
  if (typeof content === 'undefined' || !content.toString()) return 'NO_CONTENT_PROVIDED';
  title = title || "NO_TITLE_PROVIDED";

  startTime = new Date(startTime);
  startTime = startTime.toString === 'Invalid Date' ? new Date().toISOString() : startTime.toISOString();

  generatedAt = new Date(generatedAt);
  generatedAt = generatedAt.toString === 'Invalid Date' ? startTime : generatedAt.toISOString();

  content = os.EOL + formatAndBeautifyLine("=", "*", "*", 90, true)
                   + formatAndBeautifyLine("Title: " + title, "", "=", 90, true)
                   + formatAndBeautifyLine("Start Time: " + startTime, "", "=", 90, true)
                   + formatAndBeautifyLine("Generated At: " + generatedAt, "", "=", 90, true)
                   + formatAndBeautifyLine("=", "*", "*", 90, true)
                   + content.toString() + os.EOL
                   + formatAndBeautifyLine("=", "*", "*", 90, true);

  return content;
};

/**
 * Performs multiple exec commands asynchronously and returns the
 * result in the same order of the commands array.
 * @param {Array<String>} commands
 * @param {Function} callback
 * @returns {Array<Object>}
 */
var execMultiple = function (commands, callback) {
  if (!Array.isArray(commands)) {
    throw Error("COMMANDS_IS_NOT_AN_ARRAY");
  }

  var resultArray = new Array(commands.length);
  var totalCommandsCompleted = 0;

  commands.forEach(function (cmd, index) {
    cp.exec(cmd, function (err, result) {
      if (!err) {
        resultArray[index] = { content: result, generatedAt: new Date() };
      } else {
        resultArray[index] = { content: "NO_RESULT_GENERATED" + os.EOL, generatedAt: new Date() };
      }

      if (++totalCommandsCompleted === commands.length) {
        if (isValidCallback(callback)) callback(resultArray);
      }
    });
  });
};

/**
 * Fetches the WMIC path in Windows
 * @returns {String}
 */
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
};

/**
 * Beautifies the whole object and returns in a format which can be logged and read easily.
 * Can take an object or array of objects as input.
 * @param {Object|Array<Object>} obj
 * @param {String} keysTitle
 * @param {String} valuesTitle
 * @param {Number} maxKeyLength Optional
 * @param {Number} maxValLength Optional
 * @returns {String}
 */
var beautifyObject = function (obj, keysTitle, valuesTitle, maxKeyLength, maxValLength) {
  if (typeof obj !== 'object') return 'Not an Object' + os.EOL;
  if (Array.isArray(obj)) {
    var longestKeyOfAll = 0;
    var longestValOfAll = 0;
    for (var index in obj) {
      if (typeof obj[index] !== 'object' && !Array.isArray(obj[index])) continue;
      var indObjKeyLength = getLongestVal(Object.keys(obj[index]));
      var indObjValLength = getLongestVal(Object.keys(obj[index]).map(function (key) { return obj[index][key]; }));
      longestKeyOfAll = indObjKeyLength > longestKeyOfAll ? indObjKeyLength : longestKeyOfAll;
      longestValOfAll = indObjValLength > longestValOfAll ? indObjValLength : longestValOfAll;
    }

    var aggResult = '';
    for (var ind in obj) {
      aggResult += beautifyObject(obj[ind], keysTitle, valuesTitle, longestKeyOfAll, longestValOfAll);
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
                    + formatAndBeautifyLine("-", "-", "", longestKey + longestVal, true);

  Object.keys(obj).forEach(function (key) {
    finalResult += formatAndBeautifyLine(key, " ", " ", longestKey, false)
                + ' : '
                + formatAndBeautifyLine(obj[key], " ", " ", longestVal, true);
  });

  return os.EOL + finalResult + os.EOL;
};

/**
 * Returns the length of the longest entry in the Array
 * @param {Array} arr
 * @returns {Number}
 */
var getLongestVal = function (arr) {
  var longest = arr.reduce(function (prevValue, currValue) {
    if (safeToString(currValue).length > prevValue) {
      return safeToString(currValue).length;
    }
    return prevValue;
  }, 0);
  return longest;
};

/**
 * Returns string value by trying .toString() & JSON.stringify()
 * @param {any} val
 */
var safeToString = function (val) {
  try {
    val = val.toString() || 'empty/no data';
  } catch (e) {
    val = JSON.stringify(val) || 'undefined';
  }
  return val;
};

var isValidCallback = function (checkCallback) {
  return (checkCallback && typeof checkCallback === 'function');
};

/**
 * Add Delay to async calls
 * @param {Number} ms Milliseconds to delay the resolving of Promise
 * @returns {Promise}
 */
var delay = function (ms) {
  ms = parseFloat(ms);
  if (isNaN(ms) || ms < 0) {
    ms = 0;
  }
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, ms);
  });
};

module.exports = {
  proxyAuthToBase64: proxyAuthToBase64,
  fetchPropertyValue: fetchPropertyValue,
  formatAndBeautifyLine: formatAndBeautifyLine,
  generateHeaderAndFooter: generateHeaderAndFooter,
  execMultiple: execMultiple,
  getWmicPath: getWmicPath,
  beautifyObject: beautifyObject,
  isValidCallback: isValidCallback,
  safeToString: safeToString,
  delay: delay
};
