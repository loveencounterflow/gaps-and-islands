

debug     = console.log
rpr       = ( require 'util' ).inspect
{ once }  = require 'events'


# process.stdin.setEncoding null
# for await (const line of rl) {

#-----------------------------------------------------------------------------------------------------------
use_readline = ->
  readline  = require 'readline'
  rl = readline.createInterface {
    input:        process.stdin
    output:       process.stdout
    historySize:  0
    crlfDelay:    Infinity
    terminal:     false }
  rl.on 'line', ( line ) =>
    # debug rpr line
    line = line.replace /([\ue000-\uefff])/g, '$1 '
    process.stdout.write line + '\n'
  await once rl, 'close'

#-----------------------------------------------------------------------------------------------------------
use_itxt_splitlines = -> new Promise ( resolve, reject ) =>
  SL              = require 'intertext-splitlines'
  { stdin
    stdout }      = process
  settings        = { decode: false, keep_newlines: false, }
  as_hex_literal  = ( buffer ) -> '\\x' + ( buffer.toString 'hex' )
  ctx             = SL.new_context settings
  lnr             = 0
  #.........................................................................................................
  stdin.on 'data', ( d ) ->
    for line from SL.walk_lines ctx, d
      lnr++
      stdout.write ( "\"dsk\",#{lnr}," ) + ( as_hex_literal line ) + '\n'
  #.........................................................................................................
  await process.stdin.once 'end', ->
    for line from SL.flush ctx
      lnr++
      stdout.write ( "\"dsk\",#{lnr}," ) + ( as_hex_literal line ) + '\n'
      resolve()
  #.........................................................................................................
  return null


############################################################################################################
do =>
  # use_readline()
  await use_itxt_splitlines()



