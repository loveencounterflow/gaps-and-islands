(function() {
  var debug, once, rpr, use_itxt_splitlines, use_readline;

  debug = console.log;

  rpr = (require('util')).inspect;

  ({once} = require('events'));

  // process.stdin.setEncoding null
  // for await (const line of rl) {

  //-----------------------------------------------------------------------------------------------------------
  use_readline = async function() {
    var readline, rl;
    readline = require('readline');
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: 0,
      crlfDelay: 2e308,
      terminal: false
    });
    rl.on('line', (line) => {
      // debug rpr line
      line = line.replace(/([\ue000-\uefff])/g, '$1 ');
      return process.stdout.write(line + '\n');
    });
    return (await once(rl, 'close'));
  };

  //-----------------------------------------------------------------------------------------------------------
  use_itxt_splitlines = function() {
    return new Promise(async(resolve, reject) => {
      var SL, as_hex_literal, ctx, lnr, settings, stdin, stdout;
      SL = require('intertext-splitlines');
      ({stdin, stdout} = process);
      settings = {
        decode: false,
        keep_newlines: false
      };
      as_hex_literal = function(buffer) {
        return '\\x' + (buffer.toString('hex'));
      };
      ctx = SL.new_context(settings);
      lnr = 0;
      //.........................................................................................................
      stdin.on('data', function(d) {
        var line, ref, results;
        ref = SL.walk_lines(ctx, d);
        results = [];
        for (line of ref) {
          lnr++;
          results.push(stdout.write(`\"dsk\",${lnr},` + (as_hex_literal(line)) + '\n'));
        }
        return results;
      });
      //.........................................................................................................
      await process.stdin.once('end', function() {
        var line, ref, results;
        ref = SL.flush(ctx);
        results = [];
        for (line of ref) {
          lnr++;
          stdout.write(`\"dsk\",${lnr},` + (as_hex_literal(line)) + '\n');
          results.push(resolve());
        }
        return results;
      });
      //.........................................................................................................
      return null;
    });
  };

  (async() => {    //###########################################################################################################
    // use_readline()
    return (await use_itxt_splitlines());
  })();

}).call(this);

//# sourceMappingURL=read-undecoded-lines-from-stdin.js.map