(function() {
  var expect = chai.expect;

  feature('Feature 2', function() {
    feature('Subfeature X', function() {
      this.timeout(2000);
      task('It just works', function() {
        var promise = new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({
              foo: 'bar'
            });
          }, 1000);
        });
        return expect(promise).to.eventually.have.property('foo');
      });

      task('Unknown');
    });

    feature('Subfeature Y', function() {
      task('Broken task', function() {
        var promise = new Promise(function(resolve, reject) {
          reject(new Error('No worky'));
        });
        return expect(promise).to.eventually.have.property('foo');
      });
    });
  });
})();