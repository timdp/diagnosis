(function() {
  var mainContainer = null;

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

  var rowToCsv = function(row) {
    return row.map(function(obj) {
      var str = (obj === null || typeof obj === 'undefined') ? '' :
        (typeof obj === 'object') ? JSON.stringify(obj) :
        '' + obj;
      return '"' + str.replace(/"/g, '""', str) + '"';
    }).join(',');
  };

  var toCsv = function(table) {
    return table.map(rowToCsv).join('\n');
  };

  var toDownloadLink = function(link, filename, mimeType, data) {
    var blob = ('Blob' in window) ? new Blob([data]) : null;
    if ('msSaveBlob' in navigator) {
      link.onclick = function(e) {
        navigator.msSaveBlob(blob, filename);
        return false;
      };
    } else {
      var url = (blob && 'URL' in window) ?
        URL.createObjectURL(blob) :
        'data:' + mimeType + ',' + encodeURI(data);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
    }
  };

  var getReporter = function() {
    return function(runner) {
      Mocha.reporters.Base.call(this, runner);

      var stats = runner.stats;

      var startTime;

      var reportData = [];
      var currentResults = null;

      var statusText = mainContainer.querySelector('.status');
      var exportLink = mainContainer.querySelector('.export');
      var reportContainer = mainContainer.querySelector('.report');
      var sections = [reportContainer];
      var pendingResultNodes = null;

      var templates = {};
      ['section', 'report'].forEach(function(name) {
        var node = mainContainer.querySelector('.' + name + '-template');
        templates[name] = node.innerHTML;
      });

      var setStatus = function(text) {
        while (statusText.firstChild) {
          statusText.removeChild(statusText.firstChild);
        }
        statusText.appendChild(document.createTextNode(text));
      };

      var createSection = function(title, level) {
        var nodes = renderTemplate('section', {
          title: title,
          level: level
        }, sections[0]);
        var contentNode = null;
        var i = 0;
        while (i < nodes.length && contentNode === null) {
          if (nodes[i].nodeType === 1) {
            contentNode = nodes[i].querySelector('.content');
          }
          ++i;
        }
        return contentNode;
      };

      var renderResults = function() {
        if (pendingResultNodes) {
          pendingResultNodes.forEach(function(node) {
            node.parentNode.removeChild(node);
          });
        }
        pendingResultNodes = renderTemplate('report', {
          results: currentResults
        }, sections[0]);
      };

      var renderTemplate = function(id, data, into) {
        var html = Mustache.render(templates[id], data);
        var el = document.createElement('div');
        el.innerHTML = html;
        var clones = Array.prototype.map.call(el.childNodes, function(child) {
          return child.cloneNode(true);
        });
        clones.forEach(function(cl) {
          into.appendChild(cl);
        });
        return clones;
      };

      runner.on('suite', function(suite) {
        if (suite.root) {
          return;
        }
        var sectionContent = createSection(suite.title, sections.length);
        sections.unshift(sectionContent);
        currentResults = [];
      });

      runner.on('suite end', function(suite) {
        if (suite.root) {
          var csv = toCsv(reportData);
          toDownloadLink(exportLink, 'report.csv', 'text/csv', csv);
          statusText.style.display = 'none';
          exportLink.style.display = 'block';
          return;
        }
        sections.shift();
        pendingResultNodes = null;
      });

      runner.on('fail', function(test, err) {
        if (test.type === 'hook') {
          runner.emit('test end', test);
        }
      });

      runner.on('test', function(test) {
        startTime = new Date();
        currentResults.push({
          title: test.title
        });
        renderResults();
      });

      runner.on('test end', function(test) {
        if (test.pending) {
          runner.emit('test', test);
        }
        var ms = new Date() - startTime;
        setStatus('Completed: ' + stats.tests + '/' + runner.total);
        //var sec = (ms / 1000).toFixed(2);
        var res;
        if (test.state === 'passed') {
          res = 'succeeded';
          reportData.push([test.title, res, ms]);
        } else if (test.pending) {
          res = 'pending';
        } else {
          res = 'failed';
          var err;
          if (test.err) {
            err = {};
            err.message = test.err.message;
            if (test.err.stack) {
              err.stack = test.err.stack;
            }
          }
          reportData.push([test.title, res, ms, err]);
        }
        var currentResult = currentResults[currentResults.length - 1];
        currentResult.complete = true;
        currentResult[res] = true;
        currentResult.time = ms;
        renderResults();
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
    config = config || {};
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