(function() {
  var mainContainer = null;

  var getConfigFromURL = function() {
    var url = window.location.href;
    var pos = url.indexOf('?');
    if (pos < 0) {
      return;
    }
    var qs = decodeURIComponent(url.substr(pos + 1));
    var config;
    try {
      config = JSON.parse(qs);
    } catch (e) {}
    return config;
  };

  var addScript = function(src) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.addEventListener('load', function() {
        resolve(script);
      });
      script.addEventListener('error', function() {
        reject(new Error('Failed to load ' + src));
      });
      script.src = src;
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  };

  var loadScripts = function(urls) {
    return urls.reduce(function(curr, next) {
      return curr.then(function() {
        return addScript(next);
      });
    }, Promise.resolve());
  };

  var getReporter = function() {
    return function(runner) {
      Mocha.reporters.Base.call(this, runner);

      var createHeader = function(title, level) {
        var el = document.createElement('h' + level);
        el.appendChild(document.createTextNode(title));
        return el;
      };

      var createRow = function(labels, options) {
        options = options || {};
        var tag = options.header ? 'th' : 'td';
        var row = document.createElement('tr');
        for (var i = 0; i < labels.length; ++i) {
          var cell = document.createElement(tag);
          cell.appendChild(document.createTextNode(labels[i]));
          row.appendChild(cell);
        }
        return row;
      };

      var createContainer = function() {
        var table = document.createElement('table');
        var row = createRow(['Test', 'Result', 'Time'], {header: true});
        table.appendChild(row);
        return table;
      };

      var currentContainer = null;
      var currentRow = null;
      var level = 0;
      var startTime;

      runner.on('suite', function(suite) {
        if (suite.root) {
          return;
        }
        mainContainer.appendChild(createHeader(suite.title, ++level));
        currentContainer = null;
        currentRow = null;
      });

      runner.on('suite end', function(suite) {
        if (suite.root) {
          return;
        }
        currentContainer = null;
        currentRow = null;
        --level;
      });

      runner.on('fail', function(test, err) {
        if (test.type === 'hook') {
          runner.emit('test end', test);
        }
      });

      runner.on('test', function(test) {
        startTime = new Date();
        if (!currentContainer) {
          currentContainer = createContainer();
          mainContainer.appendChild(currentContainer);
        }
        currentRow = createRow([test.title, '', '']);
        currentContainer.appendChild(currentRow);
      });

      runner.on('test end', function(test) {
        if (test.pending) {
          runner.emit('test', test);
        }
        var ms = new Date() - startTime;
        //var sec = (ms / 1000).toFixed(2);
        var result, cl;
        if (test.state === 'passed') {
          result = 'OK';
          cl = 'success';
        } else if (test.pending) {
          result = '?';
          cl = 'unknown';
        } else {
          result = 'Failed';
          cl = 'failure';
        }
        currentRow.className = cl;
        var cells = currentRow.childNodes;
        cells[1].appendChild(document.createTextNode(result));
        cells[2].appendChild(document.createTextNode(ms + ' ms'));
      });
    };
  };

  var bail = function(err) {
    var text = err ? err.toString() : 'Unknown error';
    var msg = document.createElement('div');
    msg.className = 'error';
    msg.appendChild(document.createTextNode(text));
    mainContainer.appendChild(msg);
  };

  var run = function(config) {
    if (typeof config !== 'object') {
      config = getConfigFromURL() || {};
    }
    mainContainer = config.container || document.body;
    if (Array.isArray(config.tests)) {
      mocha.reporter(getReporter());
      mocha.setup('bdd');
      window.feature = describe;
      window.task = it;
      loadScripts(config.tests).then(function() {
        mocha.run();
      }, bail);
    } else {
      bail(new Error('No tests configured'));
    }
  };

  window.diagnosis = {
    run: run
  };
})();