# Diagnosis

Runs a series of client-side health checks. Basically a wrapper around
[Mocha](http://mochajs.org/) with
[Chai](http://chaijs.com/) and
[Chai as Promised](http://chaijs.com/plugins/chai-as-promised).

## Usage

Use [Grunt](http://gruntjs.com/) to build. Describe tests as you usually would
with Mocha and Chai.

The `examples` folder contains some sample tests. Note that Chai's `describe`
and `it` are being aliased to the more applicable `feature` and `task`. You can
easily run the examples by invoking `grunt develop`.

## Development

This is just a little side project I whipped up for a work thing. Feel free to
fork it and mess with it as you wish.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
