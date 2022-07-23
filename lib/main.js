(function() {
  'use strict';
  var FSP, GUY, PATH, PGT, alert, clear, comment, debug, echo, help, info, inspect, join, log, plain, praise, read, rpr, unquote, urge, warn, whisper, write;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('GAPS-AND-ISLANDS'));

  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
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
          if (d.text.startsWith('<insert')) {
            await this.interpret_inserts(me, d);
            continue;
          }
          await write(me, d.text);
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

//# sourceMappingURL=main.js.map