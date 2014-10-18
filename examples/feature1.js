(function() {
  var expect = chai.expect;

  feature('Feature 1', function() {
    task('Square', function() {
      expect(4 * 4).to.equal(16);
    });
  });
})();