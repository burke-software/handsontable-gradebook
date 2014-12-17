/**
 * Installation:
 * 1. Install Grunt CLI (`npm install -g grunt-cli`)
 * 1. Install Grunt 0.4.0 and other dependencies (`npm install`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where Gruntfile.js is)
 * To execute automatically after each change, execute `grunt --force default watch`
 * To execute build followed by the test run, execute `grunt test`
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */
module.exports = function (grunt) {
	grunt.initConfig({

      pkg: grunt.file.readJSON('package.json'),


      html2js: {
        commonDirectives: {
          options: {
            module: 'gradebook.templates',      // ANGULAR MODULE NAME
            base: 'src/app/directives/',          // REMOVE PATH FROM FILE
            htmlmin: {
              collapseWhitespace: true,
              removeComments: true
            }
          },
          dest: 'tmp/commonDirectives.js',
          src: [
            'src/app/directives/**/**/**/*.html'
          ]
        }
      },

      sass: {
        dist: {
          files: {
            'dist/css/style.css': 'src/scss/style.scss'
          }
        }
      },

      copy: {
        index: {
          files: [
            {
              src: 'src/index.html',
              dest: 'dist/index.html'
            }
          ]
        },
        main: {
          files: [
            {
              expand: true,
              cwd: 'src/fonts/',
              src: ['**'],
              dest: 'dist/fonts/'
            },
            {
              expand: true,
              cwd: 'src/img/',
              src: ['**'],
              dest: 'dist/img/'
            },
            {
              expand: true,
              cwd: 'src/lib/',
              src: ['**'],
              dest: 'dist/lib/'
            }
          ]
        }
      },

      app: {
        all: [
          'src/app/directives/**/*.js',
          'src/app/modules/**/*.js'

        ]
      },

      concat: {
        dist: {
          files: {
            'dist/app/gradebook.js': [
              'src/app/gradebook.js',
              '<%= app.all %>',
              'tmp/commonDirectives.js'

            ]
          }
        }
      },

      uglify: {
        my_target: {
          options: {
            mangle: false
          },
          files: {
            'dist/app/gradebook.min.js': ['dist/app/gradebook.js']
          }
        }
      },

      watch: {
        options: {
          livereload: true //works with Chrome LiveReload extension. See: https://github.com/gruntjs/grunt-contrib-watch
        },
        files: [
          'src/*.html',
          'src/scss/*.scss',
          'src/app/modules/**/**/*.html',
          'src/app/modules/**/**/*.js',
          'src/app/*.js',
          'src/app/**/*.js',
          'src/app/**/**/*.js',
          'src/app/**/**/**/*.js',
          'src/app/**/**/*.html'
        ],
        tasks: ['default']
      },

      clean: {
        dist: ['tmp']
      },

      replace: {
        dist: {
          options: {
            variables: {
              version: "<%= pkg.version %>",
              timestamp: "<%= (new Date()).toString() %>"
            }
          }
        }
      },

      connect: {
        dev: {
          options: {
            port: 9000,
            hostname: "0.0.0.0",
            base: "dist",
            keepalive: true
          }
        }
      }
    }
  );

	// DEFAULT TASKS
  grunt.registerTask('default', [
    "html2js",
    "sass",
    "replace:dist",
    "concat",
    "copy",
    "clean"
  ]);

  //grunt.registerTask('default', [
  //  "copy:conf",
  //  "dist"
  //]);

  //grunt.registerTask('build', [
  //  "mkdir",
  //  "dist"
  //]);

	//grunt.registerTask('default', ['html2js', 'sass', 'concat', 'clean']);
	//grunt.registerTask('build', ['default', 'copy', 'uglify']);

  grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-html2js');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-replace');

};
