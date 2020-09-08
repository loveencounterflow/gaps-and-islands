



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
{ freeze, }               = Object


### thx to https://stackoverflow.com/a/59347615/7568091

Seems to be working so far.

i.e. you create a dummy promise like in Khanh's solution so that you can wait for the first result, but then
because many results might come in all at once, you push them into an array and reset the promise to wait
for the result (or batch of results). It doesn't matter if this promise gets overwritten dozens of times
before its ever awaited.

Then we can yield all the results at once with yield* and flush the array for the next batch.

###


#-----------------------------------------------------------------------------------------------------------
generate_lines_of_text = ( delay ) -> new Promise ( done ) =>
  process.stdout.write "generating lines with delay: #{rpr delay}\n"
  sleep = ( dts ) -> new Promise ( done ) => setTimeout done, dts * 1000
  text  = """just a generator demo ###"""
  if module is require.main then do =>
    process.stdout.write 'helo' + '\n'
    words = text.split /\s+/
    for word in words
      process.stdout.write '\n'
      process.stdout.write word
      if delay isnt 0
        await sleep delay
    process.stdout.write '\n'
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
_advance  = ( go_on = true ) ->
  @done     = not go_on
  @_resolve()
  @ratchet  = new Promise ( resolve ) => @_resolve = resolve


#===========================================================================================================
#
#---------------------------------------------------------------------------------------------------------
new_receiver = ( delay ) ->
  { spawn } = require 'child_process'
  S             = new Controller()
  cp            = spawn 'node', [ __filename, 'generate', '--delay', "#{delay}", ]
  #.......................................................................................................
  new_catcher = ( $key ) ->
    return ( $value ) =>
      S.send freeze { $key, $value, }
      S.advance()
  #.......................................................................................................
  cp.stdout.on  'data', new_catcher '^stdout'
  cp.stderr.on  'data', new_catcher '^stderr'
  cp.on 'close', =>
    help "^7399^ receiver: CP closed"
    S.advance false
  #.......................................................................................................
  cp.on 'error', ( error ) ->
    if has_finished
      warn "^3366^ #{rpr error}"
      return null
    has_finished = true
    warn "^3977^ receiver: reject_outer"
    reject_outer error
  #.......................................................................................................
  while not S.done
    await S.ratchet; yield from S
  help "^8743^ receiver: no more data"
  return null

#-----------------------------------------------------------------------------------------------------------
demo_receiver = ( delay ) -> new Promise ( resolve_outer, reject_outer ) =>
  #---------------------------------------------------------------------------------------------------------
  SP = require 'steampipes'
  { $
    $watch
    $drain }  = SP.export()
  #---------------------------------------------------------------------------------------------------------
  $split_channels = ->
    splitliners = {}
    last        = Symbol 'last'
    return $ { last, }, ( d, send ) =>
      { $key, $value, } = d
      unless ( ctx = splitliners[ $key ] )?
        ctx = splitliners[ $key ] = SL.new_context()
      if d is last
        send ( freeze { $key, $value, } ) for $value from SL.flush ctx
        return null
      send ( freeze { $key, $value, } ) for $value from SL.walk_lines ctx, $value
      return null
  #---------------------------------------------------------------------------------------------------------
  source      = SP.new_push_source()
  pipeline    = []
  pipeline.push source
  pipeline.push $split_channels()
  pipeline.push $watch ( d ) -> urge d
  pipeline.push $drain ->
    help "^3776^ pipeline: finished"
    return resolve_outer()
  SP.pull pipeline...
  #.........................................................................................................
  source.send x for await x from new_receiver delay
  source.end()
  return null

#-----------------------------------------------------------------------------------------------------------
cli = -> new Promise ( done ) =>
  #.........................................................................................................
  runner = ( d ) =>
    delay = d.verdict.parameters.delay ? 0
    switch d.verdict.cmd
      when 'generate' then await generate_lines_of_text delay
      when 'receive'  then await demo_receiver delay
      else throw new Error "^cli@33336^ unknown command #{rpr d.verdict.cmd}"
    done()
  #.........................................................................................................
  jobdefs =
    commands:
      #.....................................................................................................
      'generate':
        description:  "generate series of words in different speeds"
        flags:
          'delay':  { alias: 'd', type: Number, description: "seconds to pause between each chunk of data", }
        runner: runner
      #.....................................................................................................
      'receive':
        description:  "spawn subprocess and process signals it emits"
        flags:
          'delay':  { alias: 'd', fallback: null, type: Number, description: "seconds to pause between each chunk of data", }
        runner: runner
  #.........................................................................................................
  MIXA.run jobdefs, process.argv
  return null

############################################################################################################
if module is require.main then do =>
  # await demo_receiver()
  await cli()


