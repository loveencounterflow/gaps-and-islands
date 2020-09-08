(function() {
  'use strict';
  var CND, Controller, MIXA, PATH, SL, _advance, _send, badge, cli, debug, demo_receiver, echo, freeze, generate_lines_of_text, help, info, new_receiver, rpr, types, urge, warn, whisper;

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

  ({freeze} = Object);

  /* thx to https://stackoverflow.com/a/59347615/7568091

  Seems to be working so far.

  i.e. you create a dummy promise like in Khanh's solution so that you can wait for the first result, but then
  because many results might come in all at once, you push them into an array and reset the promise to wait
  for the result (or batch of results). It doesn't matter if this promise gets overwritten dozens of times
  before its ever awaited.

  Then we can yield all the results at once with yield* and flush the array for the next batch.

  */
  //-----------------------------------------------------------------------------------------------------------
  generate_lines_of_text = function(delay) {
    return new Promise((done) => {
      var sleep, text;
      process.stdout.write(`generating lines with delay: ${rpr(delay)}\n`);
      sleep = function(dts) {
        return new Promise((done) => {
          return setTimeout(done, dts * 1000);
        });
      };
      text = `just a generator demo ###`;
      if (module === require.main) {
        return (async() => {
          var i, len, word, words;
          process.stdout.write('helo' + '\n');
          words = text.split(/\s+/);
          for (i = 0, len = words.length; i < len; i++) {
            word = words[i];
            process.stdout.write('\n');
            process.stdout.write(word);
            if (delay !== 0) {
              await sleep(delay);
            }
          }
          process.stdout.write('\n');
          return process.stderr.write("and hello over the other channel!\n");
        })();
      }
    });
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  Controller = class Controller { // extends Object
    constructor() {
      this.collector = [];
      this[Symbol.iterator] = function*() {
        yield* this.collector;
        return this.collector = [];
      };
      this._resolve = function() {};
      this.done = false;
      this.send = _send.bind(this);
      this.advance = _advance.bind(this);
      this.ratchet = new Promise((resolve) => {
        return this._resolve = resolve;
      });
      return null;
    }

  };

  //...........................................................................................................
  _send = function(d) {
    return this.collector.push(d);
  };

  _advance = function(go_on = true) {
    this.done = !go_on;
    this._resolve();
    return this.ratchet = new Promise((resolve) => {
      return this._resolve = resolve;
    });
  };

  //===========================================================================================================

  //---------------------------------------------------------------------------------------------------------
  new_receiver = async function*(delay) {
    var S, cp, new_catcher, spawn;
    ({spawn} = require('child_process'));
    S = new Controller();
    cp = spawn('node', [__filename, 'generate', '--delay', `${delay}`]);
    //.......................................................................................................
    new_catcher = function($key) {
      return ($value) => {
        S.send(freeze({$key, $value}));
        return S.advance();
      };
    };
    //.......................................................................................................
    cp.stdout.on('data', new_catcher('^stdout'));
    cp.stderr.on('data', new_catcher('^stderr'));
    cp.on('close', () => {
      help("^7399^ receiver: CP closed");
      return S.advance(false);
    });
    //.......................................................................................................
    cp.on('error', function(error) {
      var has_finished;
      if (has_finished) {
        warn(error);
        return null;
      }
      has_finished = true;
      warn("^3977^ receiver: reject_outer");
      return reject_outer(error);
    });
    //.......................................................................................................
    while (!S.done) {
      await S.ratchet;
      yield* S;
    }
    help("^8743^ receiver: no more data");
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  demo_receiver = function(delay) {
    return new Promise(async(resolve_outer, reject_outer) => {
      var $, $drain, $split_channels, $watch, SP, pipeline, ref, source, x;
      //---------------------------------------------------------------------------------------------------------
      SP = require('steampipes');
      ({$, $watch, $drain} = SP.export());
      //---------------------------------------------------------------------------------------------------------
      $split_channels = function() {
        var last, splitliners;
        splitliners = {};
        last = Symbol('last');
        return $({last}, (d, send) => {
          var $key, $value, ctx, ref, ref1;
          debug('^3334^', d);
          ({$key, $value} = d);
          if ((ctx = splitliners[$key]) == null) {
            ctx = splitliners[$key] = SL.new_context();
          }
          if (d === last) {
            ref = SL.flush(ctx);
            for ($value of ref) {
              send(freeze({$key, $value}));
            }
            return null;
          }
          ref1 = SL.walk_lines(ctx, $value);
          for ($value of ref1) {
            send(freeze({$key, $value}));
          }
          return null;
        });
      };
      //---------------------------------------------------------------------------------------------------------
      source = SP.new_push_source();
      pipeline = [];
      pipeline.push(source);
      pipeline.push($split_channels());
      pipeline.push($watch(function(d) {
        return urge(d);
      }));
      pipeline.push($drain(function() {
        help("^3776^ pipeline: finished");
        return resolve_outer();
      }));
      SP.pull(...pipeline);
      ref = new_receiver(delay);
      //.........................................................................................................
      for await (x of ref) {
        // whisper "^6786^ sending #{( rpr x )[ .. 50 ]}..."
        source.send(x);
      }
      whisper("^6786^ calling source.end()");
      source.end();
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  cli = function() {
    return new Promise((done) => {
      var jobdefs, runner;
      //.........................................................................................................
      runner = async(d) => {
        var delay, ref;
        delay = (ref = d.verdict.parameters.delay) != null ? ref : 0;
        switch (d.verdict.cmd) {
          case 'generate':
            await generate_lines_of_text(delay);
            break;
          case 'receive':
            await demo_receiver(delay);
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
              'delay': {
                alias: 'd',
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
              'delay': {
                alias: 'd',
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