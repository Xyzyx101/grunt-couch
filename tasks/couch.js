/*
 * grunt-couch
 * https://github.com/jo/grunt-couch
 *
 * Copyright (c) 2013 Johannes J. Schmidt, TF
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var path = require('path');
  var mime = require('mime');

  function compileDocs(dirs, options) {
    return {
      docs: dirs.map(function(dir) {
        return compile(dir, options);
      })
    };
  }

  function compile(dir, options) {
    var doc = {};

    grunt.log.write('Compiling ' + dir + '...');

    var files = grunt.file.expand({
      filter: 'isFile',
      matchBase: true,
      cwd: dir
    }, options.pattern);

    files.forEach(function(filename) {
      var name;
      var parts = filename.split('/');
      var abspath = path.join(dir, filename);

      if (parts[0] === '_attachments') {
        parts.shift();
        name = parts.join('/');
        doc._attachments = doc._attachments || {};
        doc._attachments[name] = {
          data: grunt.file.read(abspath, { encoding: null }).toString('base64'),
          content_type: mime.lookup(abspath)
        };
      } else {
        name = parts.pop().replace(/\.[^\.]*$/, '');
        var part = parts.reduce(function(result, key) {
          result[key] = result[key] || {};
          return result[key];
        }, doc);

        if (filename.match(/\.json$/)) {
          part[name] = grunt.file.readJSON(abspath);
        } else {
          part[name] = grunt.file.read(abspath).trim();
        }
      }
    });

    grunt.log.ok();
    
    return doc;
  }

  grunt.registerMultiTask('couch', 'Compile CouchDB JSON documents from directory tree.', function() {
    var options = this.options({
      pattern: '*'
    });

    this.files.forEach(function(file) {
      // only use dirs where an _id file is present
      var sources = file.src.filter(function(dir) {
        return grunt.file.isFile(path.join(dir, '_id'));
      });
      var docs = compileDocs(sources, options);

      grunt.log.write('Writing ' + file.dest + '...');
      grunt.file.write(file.dest, JSON.stringify(docs, '\n', '  '));
      grunt.log.ok();
      grunt.log.ok(sources.length + ' doc' + (file.src.length === 1 ? '' : 's') + ' compiled');
    });
  });
};