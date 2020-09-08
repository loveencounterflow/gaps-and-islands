



'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'EVENTS-AS-GENERATOR'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
PATH                      = require 'path'
# FS                        = require 'fs'
types                     = new ( require 'intertype' ).Intertype()
MIXA                      = require 'mixa'
SL                        = require 'intertext-splitlines'

### thx to https://stackoverflow.com/a/59347615/7568091

Seems to be working so far.

i.e. you create a dummy promise like in Khanh's solution so that you can wait for the first result, but then
because many results might come in all at once, you push them into an array and reset the promise to wait
for the result (or batch of results). It doesn't matter if this promise gets overwritten dozens of times
before its ever awaited.

Then we can yield all the results at once with yield* and flush the array for the next batch.

###


#-----------------------------------------------------------------------------------------------------------
generate_lines_of_text = ( pause ) -> new Promise ( done ) =>
  process.stdout.write "generating lines with pause: #{rpr pause}\n"
  sleep = ( dts ) -> new Promise ( done ) => setTimeout done, dts * 1000
  text  = """just a generator demo"""
  if module is require.main then do =>
    process.stdout.write 'helo' + '\n'
    words = text.split /\s+/
    for word in words
      process.stdout.write '\n'
      process.stdout.write word
      if pause isnt 0
        await sleep pause
    process.stderr.write "and hello over the other channel!\n"


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Controller # extends Object
  constructor: ->
    @collector            = []
    @[ Symbol.iterator ]  = -> yield from @collector; @collector = []
    @_resolve             = ->
    @done                 = false
    @send                 = _send.bind @
    @advance              = _advance.bind @
    @ratchet              = new Promise ( resolve ) => @_resolve = resolve
    return null
#...........................................................................................................
_send     = ( d ) -> @collector.push d
_advance  = -> @_resolve(); @ratchet = new Promise ( resolve ) => @_resolve = resolve


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
demo_receiver = ( pause ) -> new Promise ( resolve_outer, reject_outer ) =>
  #---------------------------------------------------------------------------------------------------------
  g = ->
    { spawn } = require 'child_process'
    S             = new Controller()
    debug '^3328345^', S
    has_finished  = false
    cp            = spawn 'node', [ __filename, 'generate', '--pause', "#{pause}", ]
    splitliners   = {}
    #.......................................................................................................
    new_catcher = ( $key ) ->
      splitliners[ $key ] = SL.new_context()
      return ( data ) =>
        for $value from SL.walk_lines splitliners[ $key ], data
          S.send Object.freeze { $key, $value, }
        S.advance()
    #.......................................................................................................
    new_ender = ( $key ) ->
      return ->
        for $value from SL.flush splitliners[ $key ]
          S.send Object.freeze { $key, $value, }
        S.advance()
    #.......................................................................................................
    cp.stdout.on  'data', new_catcher '^stdout'
    cp.stderr.on  'data', new_catcher '^stderr'
    cp.stdout.on  'end',  new_ender   '^stdout'
    cp.stderr.on  'end',  new_ender   '^stderr'
    #.......................................................................................................
    cp.on 'error', ( error ) ->
      if has_finished
        warn error
        return null
      has_finished = true
      reject_outer error
    #.......................................................................................................
    cp.on 'close', => S.done = true
    #.......................................................................................................
    while not S.done then await S.ratchet; yield from S # .collector;
  #---------------------------------------------------------------------------------------------------------
  SP = require 'steampipes'
  { $
    $watch
    $drain }  = SP.export()
  source      = SP.new_push_source()
  pipeline    = []
  pipeline.push source
  # pipeline.push SP.$split()
  pipeline.push $watch ( d ) -> urge d
  pipeline.push $drain -> done()
  SP.pull pipeline...
  for await x from g()
    source.send x
  #.........................................................................................................
  unless has_finished
    has_finished = true
    return resolve_outer()
  return null

#-----------------------------------------------------------------------------------------------------------
cli = -> new Promise ( done ) =>
  #.........................................................................................................
  runner = ( d ) =>
    pause = d.verdict.parameters.pause ? 0
    switch d.verdict.cmd
      when 'generate' then await generate_lines_of_text pause
      when 'receive'  then await demo_receiver pause
      else throw new Error "^cli@33336^ unknown command #{rpr d.verdict.cmd}"
    done()
  #.........................................................................................................
  jobdefs =
    commands:
      #.....................................................................................................
      'generate':
        description:  "generate series of words in different speeds"
        flags:
          'pause':  { alias: 'p', type: Number, description: "seconds to pause between each chunk of data", }
        runner: runner
      #.....................................................................................................
      'receive':
        description:  "spawn subprocess and process signals it emits"
        flags:
          'pause':  { alias: 'p', fallback: null, type: Number, description: "seconds to pause between each chunk of data", }
        runner: runner
  #.........................................................................................................
  MIXA.run jobdefs, process.argv
  return null

############################################################################################################
if module is require.main then do =>
  # await demo_receiver()
  await cli()


