module.exports = function(grunt) {
  'use strict';

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  var jsSources = [
    'bower_components/base64/base64.js',
    'bower_components/es6-promise/promise.js',
    'bower_components/mocha/mocha.js',
    'bower_components/chai/chai.js',
    'bower_components/chai-as-promised/lib/chai-as-promised.js',
    'src/js/main.js'
  ];

  grunt.initConfig({
    jshint: {
      all: 'src/js/**/*.js'
    },
    clean: {
      debug: 'build/debug',
      release: 'build/release'
    },
    mkdir: {
      debug: 'build/debug',
      release: 'build/release'
    },
    copy: {
      examples_debug: {
        files: [{
          cwd: 'examples',
          src: '**',
          expand: true,
          filter: 'isFile',
          dest: 'build/debug/examples/'
        }]
      },
      html_debug: {
        files: {
          'build/debug/index.html': 'src/html/index.html'
        }
      }
    },
    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true
      },
      release: {
        files: {
          'build/release/index.html': 'src/html/index.html'
        }
      }
    },
    sass: {
      options: {
        loadPath: ['bower_components/normalize-scss']
      },
      debug: {
        options: {
          sourcemap: 'inline',
          style: 'expanded'
        },
        files: {
          'build/debug/app.css': 'src/css/main.scss'
        }
      },
      release: {
        options: {
          sourcemap: 'none',
          style: 'compressed'
        },
        files: {
          'build/release/app.css': 'src/css/main.scss'
        }
      }
    },
    uglify: {
      debug: {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'build/debug/app.js': jsSources
        }
      },
      release: {
        files: {
          'build/release/app.js': jsSources
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      html: {
        files: ['src/html/index.html'],
        tasks: ['copy:html_debug']
      },
      css: {
        files: ['src/css/**/*.scss'],
        tasks: ['sass:debug']
      },
      js: {
        files: ['src/js/**/*.js'],
        tasks: ['jshint:all', 'uglify:debug']
      },
      examples: {
        files: ['examples/**'],
        tasks: ['copy:examples_debug']
      }
    },
    express: {
      develop: {
        options: {
          port: 8000,
          bases: ['build/debug'],
          livereload: true
        }
      }
    },
    open: {
      examples: {
        path: 'http://localhost:8000/?' + encodeURIComponent(JSON.stringify({
          tests: ['/examples/feature1.js', '/examples/feature2.js']
        }))
      }
    }
  });

  grunt.registerTask('debug', [
    'jshint:all',
    'mkdir:debug',
    'copy:html_debug',
    'sass:debug',
    'uglify:debug'
  ]);

  grunt.registerTask('develop', [
    'clean:debug',
    'debug',
    'copy:examples_debug',
    'express:develop',
    'open:examples',
    'watch'
  ]);

  grunt.registerTask('release', [
    'jshint:all',
    'mkdir:release',
    'htmlmin:release',
    'sass:release',
    'uglify:release'
  ]);

  grunt.registerTask('default', 'develop');
};