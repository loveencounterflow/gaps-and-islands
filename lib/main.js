(function() {
  'use strict';
  var CND, FSP, PATH, PGT, _echo, alert, assign, badge, clear, comment, debug, echo, help, info, join, jr, log, read, rpr, unquote, urge, warn, whisper, write;

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

  join = function(me, ...P) {
    return PATH.resolve(PATH.join(me.base_path, ...P));
  };

  read = async function(me, path) {
    return (await FSP.readFile(path, {
      encoding: 'utf-8'
    }));
  };

  clear = async function(me) {
    return (await FSP.writeFile(me.target_path, ''));
  };

  write = async function(me, text) {
    return (await FSP.appendFile(me.target_path, text.toString()));
  };

  comment = function(text) {
    return '<!-- ' + (text.toString().replace(/--/g, '-_')) + ' -->\n';
  };

  unquote = function(text) {
    return text.replace(/^(['"])(.*)\1$/, '$2');
  };

  //-----------------------------------------------------------------------------------------------------------
  this.interpret_inserts = async function(me, token) {
    var d, i, len, path, ref;
    ref = PGT.HTML.grammar.parse(token.text);
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      switch (d.$key) {
        case '<document':
        case '>document':
          null;
          break;
        case '^text':
          await write(me, d.text);
          break;
        case '^tag':
          if (d.name !== 'insert') {
            await write(me, d.text);
            continue;
          }
          // await write me, comment d.text
          urge('^554^', `inserting ${d.atrs.src}`);
          path = PATH.join(me.base_path, unquote(d.atrs.src));
          await /* TAINT should be done by HTML parser */write(me, (await read(me, path)));
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
    me = {};
    me.base_path = PATH.resolve(PATH.join(__dirname, '..'));
    me.source_path = join(me, 'main.md');
    me.target_path = join(me, 'README.md');
    me.source = (await read(me, me.source_path));
    //.........................................................................................................
    await clear(me);
    ref = PGT.RXWS.grammar.parse(me.source);
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      switch (d.$key) {
        case '<document':
        case '>document':
          null;
          break;
        case '^blank':
          await write(me, d.text);
          break;
        case '^block':
          if (!d.text.startsWith('<insert')) {
            await write(me, d.text);
            continue;
          }
          await this.interpret_inserts(me, d);
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
