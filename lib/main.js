(function() {
  'use strict';
  var CND, FSP, PATH, PGT, _echo, alert, assign, badge, debug, echo, help, info, jr, log, read_file, resolve_path, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  badge = 'GAPS-AND-ISLANDS';

  rpr = CND.rpr;

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  _echo = CND.echo.bind(CND);

  echo = function(text) {
    return _echo(text.replace(/\n$/, ''));
  };

  //...........................................................................................................
  ({assign, jr} = CND);

  // types                     = require '../../../apps/paragate/lib/types'
  // { isa }                   = types
  PATH = require('path');

  FSP = (require('fs')).promises;

  PGT = require('paragate');

  resolve_path = function(path) {
    return PATH.resolve(PATH.join(__dirname, path));
  };

  read_file = async function(path) {
    return (await FSP.readFile(resolve_path(path), {
      encoding: 'utf-8'
    }));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.interpret_inserts = function(me, token) {
    var d, i, len, ref;
    ref = PGT.HTML.grammar.parse(token.text);
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      switch (d.$key) {
        case '<document':
        case '>document':
          null;
          break;
        case '^text':
          echo(d.text);
          break;
        case '^tag':
          if (d.name !== 'insert') {
            echo(d.text);
            continue;
          }
          echo(CND.reverse(CND.blue(d)));
          break;
        default:
          throw new Error(`^4776^ unknown token $key ${rpr(d.$key)}`);
      }
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.compile_readme = async function() {
    var d, i, len, me, ref;
    me = {
      target_path: resolve_path('../README.md'),
      source: (await read_file('../main.md'))
    };
    ref = PGT.RXWS.grammar.parse(source);
    //.........................................................................................................
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      // info d
      switch (d.$key) {
        case '<document':
        case '>document':
          null;
          break;
        case '^blank':
          echo(d.text);
          break;
        case '^block':
          if (!d.text.startsWith('<insert')) {
            echo(CND.blue(d.text));
            continue;
          }
          this.interpret_inserts(me, d);
          break;
        default:
          throw new Error(`^4776^ unknown token $key ${rpr(d.$key)}`);
      }
    }
    return me;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await this.compile_readme());
    })();
  }

}).call(this);
