(function() {
  'use strict';
  var CND, MIXA, PATH, SL, badge, cli, debug, demo_receiver, echo, generate_lines_of_text, help, info, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'EVENTS-AS-GENERATOR';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  PATH = require('path');

  // FS                        = require 'fs'
  types = new (require('intertype')).Intertype();

  MIXA = require('mixa');

  SL = require('intertext-splitlines');

  //-----------------------------------------------------------------------------------------------------------
  // resolve_project_path = ( path ) -> PATH.resolve PATH.join __dirname, '../../..', path

  //-----------------------------------------------------------------------------------------------------------
  generate_lines_of_text = function(pause) {
    return new Promise((done) => {
      var sleep, text;
      process.stdout.write(`generating lines with pause: ${rpr(pause)}\n`);
      sleep = function(dts) {
        return new Promise((done) => {
          return setTimeout(done, dts * 1000);
        });
      };
      text = `just a generator demo`;
      if (module === require.main) {
        return (async() => {
          var i, len, word, words;
          process.stdout.write('helo' + '\n');
          words = text.split(/\s+/);
          for (i = 0, len = words.length; i < len; i++) {
            word = words[i];
            process.stdout.write('\n');
            process.stdout.write(word);
            if (pause !== 0) {
              await sleep(pause);
            }
          }
          return process.stderr.write("and hello over the other channel!\n");
        })();
      }
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  demo_receiver = function(pause) {
    return new Promise(async(resolve_outer, reject_outer) => {
      var $, $drain, $watch, SP, g, has_finished, pipeline, ref, source, x;
      //---------------------------------------------------------------------------------------------------------
      g = async function*() {
        /* thx to https://stackoverflow.com/a/59347615/7568091 */
        var cp, done, has_finished, new_catcher, promise, resolve, results, results1, spawn, splitliners, x;
        ({spawn} = require('child_process'));
        has_finished = false;
        results = [];
        resolve = () => {
          return null;
        };
        promise = new Promise((r) => {
          return resolve = r;
        });
        done = false;
        cp = spawn('node', [__filename, 'generate', '--pause', `${pause}`]);
        splitliners = {};
        //.......................................................................................................
        new_catcher = function($key) {
          splitliners[$key] = SL.new_context();
          return (data) => {
            var $value, ref;
            ref = SL.walk_lines(splitliners[$key], data);
            for ($value of ref) {
              results.push(Object.freeze({$key, $value}));
            }
            resolve();
            return promise = new Promise((r) => {
              return resolve = r;
            });
          };
        };
        //.......................................................................................................
        cp.stdout.on('data', new_catcher('^stdout'));
        cp.stderr.on('data', new_catcher('^stderr'));
        debug('^1776^', splitliners);
        //.......................................................................................................
        cp.stdout.on('end', function() {
          var $key, $value, ref;
          $key = '^stdout';
          ref = SL.flush(splitliners[$key]);
          for ($value of ref) {
            results.push(Object.freeze({$key, $value}));
          }
          resolve();
          return promise = new Promise((r) => {
            return resolve = r;
          });
        });
        //.......................................................................................................
        cp.stderr.on('end', function() {
          var $key, $value, ref;
          $key = '^stderr';
          ref = SL.flush(splitliners[$key]);
          for ($value of ref) {
            results.push(Object.freeze({$key, $value}));
          }
          resolve();
          return promise = new Promise((r) => {
            return resolve = r;
          });
        });
        //.......................................................................................................
        cp.on('error', function(error) {
          if (has_finished) {
            warn(error);
            return null;
          }
          has_finished = true;
          return reject_outer(error);
        });
        //.......................................................................................................
        cp.on('close', () => {
          return done = true;
        });
        results1 = [];
        //.......................................................................................................
        while (!done) {
          await promise;
// debug '^334455^', rpr results
          for (x of results) {
            yield x;
          }
          results1.push(results = []);
        }
        return results1;
      };
      //---------------------------------------------------------------------------------------------------------
      SP = require('steampipes');
      ({$, $watch, $drain} = SP.export());
      source = SP.new_push_source();
      pipeline = [];
      pipeline.push(source);
      // pipeline.push SP.$split()
      pipeline.push($watch(function(d) {
        return urge(d);
      }));
      pipeline.push($drain(function() {
        return done();
      }));
      SP.pull(...pipeline);
      ref = g();
      for await (x of ref) {
        source.send(x);
      }
      //.........................................................................................................
      if (!has_finished) {
        has_finished = true;
        return resolve_outer();
      }
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  cli = function() {
    return new Promise((done) => {
      var jobdefs, runner;
      //.........................................................................................................
      runner = async(d) => {
        var pause, ref;
        pause = (ref = d.verdict.parameters.pause) != null ? ref : 0;
        switch (d.verdict.cmd) {
          case 'generate':
            await generate_lines_of_text(pause);
            break;
          case 'receive':
            await demo_receiver(pause);
            break;
          default:
            throw new Error(`^cli@33336^ unknown command ${rpr(d.verdict.cmd)}`);
        }
        return done();
      };
      //.........................................................................................................
      jobdefs = {
        commands: {
          //.....................................................................................................
          'generate': {
            description: "generate series of words in different speeds",
            flags: {
              'pause': {
                alias: 'p',
                type: Number,
                description: "seconds to pause between each chunk of data"
              }
            },
            runner: runner
          },
          //.....................................................................................................
          'receive': {
            description: "spawn subprocess and process signals it emits",
            flags: {
              'pause': {
                alias: 'p',
                fallback: null,
                type: Number,
                description: "seconds to pause between each chunk of data"
              }
            },
            runner: runner
          }
        }
      };
      //.........................................................................................................
      MIXA.run(jobdefs, process.argv);
      return null;
    });
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      // await demo_receiver()
      return (await cli());
    })();
  }

}).call(this);

//# sourceMappingURL=main.js.map