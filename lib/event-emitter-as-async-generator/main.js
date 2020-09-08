(function() {
  'use strict';
  var CND, MIXA, PATH, Receiver, SL, _advance, _send, badge, cli, create_receiving_pipeline, custom_receiver_from_child_process, debug, echo, freeze, generate_lines_of_text, help, info, rpr, types, urge, warn, whisper;

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
  generate_lines_of_text = function(delay, stream_nr) {
    return new Promise((done) => {
      var sleep, text;
      process.stdout.write(`generating lines with delay: ${rpr(delay)}\n`);
      sleep = function(dts) {
        return new Promise((done) => {
          return setTimeout(done, dts * 1000);
        });
      };
      text = `just a generator demo for stream_nr: ${stream_nr} ###`;
      if (module === require.main) {
        return (async() => {
          var i, len, word, words;
          process.stdout.write('helo' + '\n');
          words = text.split(/\s+/);
          for (i = 0, len = words.length; i < len; i++) {
            word = words[i];
            process.stdout.write('\n');
            process.stdout.write(JSON.stringify({
              $key: '^line',
              stream_nr,
              word
            }));
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
  Receiver = class Receiver { // extends Object
    constructor() {
      this.collector = [];
      this[Symbol.iterator] = function*() {
        yield* this.collector;
        return this.collector = [];
      };
      this._resolve = function() {};
      this.done = false;
      this.initializer = null;
      this.is_first = true;
      this.send = _send.bind(this);
      this.advance = _advance.bind(this);
      this.ratchet = new Promise((resolve) => {
        return this._resolve = resolve;
      });
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    add_data_channel(eventemitter, eventname, $key) {
      var handler, type;
      switch (type = types.type_of($key)) {
        case 'text':
          types.validate.nonempty_text($key);
          handler = ($value) => {
            this.send(freeze({$key, $value}));
            return this.advance();
          };
          break;
        case 'function':
          handler = ($value) => {
            this.send($key($value));
            return this.advance();
          };
          break;
        case 'generatorfunction':
          handler = ($value) => {
            var d, ref;
            ref = $key($value);
            for (d of ref) {
              this.send(d);
            }
            return this.advance();
          };
          break;
        default:
          throw new Error(`^receiver/add_data_channel@445^ expected a text, a function, or a generatorfunction, got a ${type}`);
      }
      eventemitter.on(eventname, handler);
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT make `$key` behave as in `add_data_channel()` */
    add_initializer($key) {
      /* Send a datom before any other data. */
      types.validate.nonempty_text($key);
      return this.initializer = freeze({$key});
    }

    //---------------------------------------------------------------------------------------------------------
    /* TAINT make `$key` behave as in `add_data_channel()` */
    add_terminator(eventemitter, eventname, $key = null) {
      /* Terminates async iterator after sending an optional datom to mark termination in stream. */
      return eventemitter.on(eventname, () => {
        if ($key != null) {
          this.send(freeze({$key}));
        }
        return this.advance(false);
      });
    }

    //---------------------------------------------------------------------------------------------------------
    static async * from_child_process(cp, settings) {
      var rcv;
      // defaults  = {}
      // settings  = { defaults..., }
      /* TAINT validate settings */
      rcv = new Receiver();
      rcv.add_initializer('<cp');
      rcv.add_data_channel(cp.stdout, 'data', '^stdout');
      rcv.add_data_channel(cp.stderr, 'data', '^stderr');
      rcv.add_terminator(cp, 'close', '>cp');
      while (!rcv.done) {
        await rcv.ratchet;
        yield* rcv;
      }
      return null;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  _send = function(d) {
    if (this.is_first) {
      this.is_first = false;
      if (this.initializer != null) {
        this.collector.push(this.initializer);
      }
    }
    return this.collector.push(d);
  };

  //-----------------------------------------------------------------------------------------------------------
  _advance = function(go_on = true) {
    this.done = !go_on;
    this._resolve();
    return this.ratchet = new Promise((resolve) => {
      return this._resolve = resolve;
    });
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  custom_receiver_from_child_process = async function*(cp) {
    var rcv;
    rcv = new Receiver();
    //.........................................................................................................
    /* Add an initializer (data to be always sent once before any other): */
    rcv.add_initializer('<cp');
    //.........................................................................................................
    /* Use a `$key` for the datom to be sent: */
    rcv.add_data_channel(cp.stdout, 'data', '^stdout');
    //.........................................................................................................
    /* Can also use an iterator to send anything in response to `$value`: */
    rcv.add_data_channel(cp.stderr, 'data', function*($value) {
      yield "next event is from stderr";
      return (yield freeze({
        $key: '^stderr',
        $value
      }));
    });
    //.........................................................................................................
    /* Add a terminator, otherwise stream will not close properly; here, we make it also send a datom after
     all regular data has been sent: */
    rcv.add_terminator(cp, 'close', '>cp');
    //.........................................................................................................
    while (!rcv.done) {
      await rcv.ratchet;
      yield* rcv;
    }
    help("^8743^ receiver: no more data");
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  create_receiving_pipeline = function(delay) {
    return new Promise(async(resolve_outer, reject_outer) => {
      var $, $drain, $split_channels, $watch, SP, cp, pipeline, ref, ref1, source, spawn, x;
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
          if ((d == null) || (!types.isa.buffer(d.$value))) {
            return send(d);
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
        var error;
        try {
          /* TAINT not a good way to find out whether $value should be parsed */
          return info(JSON.parse(d.$value));
        } catch (error1) {
          error = error1;
          return urge(d);
        }
      }));
      pipeline.push($drain(function() {
        help("^3776^ pipeline: finished");
        return resolve_outer();
      }));
      SP.pull(...pipeline);
      //.........................................................................................................
      ({spawn} = require('child_process'));
      cp = spawn('node', [__filename, 'generate', '--nr', '1', '--delay', `${delay}`]);
      ref = Receiver.from_child_process(cp);
      for await (x of ref) {
        source.send(x);
      }
      cp = spawn('node', [__filename, 'generate', '--nr', '2', '--delay', `${delay}`]);
      ref1 = custom_receiver_from_child_process(cp);
      for await (x of ref1) {
        source.send(x);
      }
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
        var delay, nr;
        delay = d.verdict.parameters.delay;
        nr = d.verdict.parameters.nr;
        switch (d.verdict.cmd) {
          case 'generate':
            await generate_lines_of_text(delay, nr);
            break;
          case 'receive':
            await create_receiving_pipeline(delay);
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
                fallback: 0,
                type: Number,
                description: "seconds to pause between each chunk of data"
              },
              'nr': {
                fallback: 1,
                description: "stream identifier to be used"
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
                fallback: 0,
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