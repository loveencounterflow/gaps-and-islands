



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
generate_lines_of_text = ( delay, stream_nr ) -> new Promise ( done ) =>
  process.stdout.write "generating lines with delay: #{rpr delay}\n"
  sleep = ( dts ) -> new Promise ( done ) => setTimeout done, dts * 1000
  text  = """just a generator demo for stream_nr: #{stream_nr} ###"""
  if module is require.main then do =>
    process.stdout.write 'helo' + '\n'
    words = text.split /\s+/
    for word in words
      process.stdout.write '\n'
      process.stdout.write JSON.stringify { $key: '^line', stream_nr, word, }
      if delay isnt 0
        await sleep delay
    process.stdout.write '\n'
    process.stderr.write "and hello over the other channel!\n"


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Receiver # extends Object
  constructor: ->
    @collector            = []
    @[ Symbol.iterator ]  = -> yield from @collector; @collector = []
    @_resolve             = ->
    @done                 = false
    @initializer          = null
    @is_first             = true
    @send                 = _send.bind @
    @advance              = _advance.bind @
    @ratchet              = new Promise ( resolve ) => @_resolve = resolve
    return null

  #---------------------------------------------------------------------------------------------------------
  add_data_channel: ( eventemitter, eventname, $key ) ->
    switch type = types.type_of $key
      when 'text'
        types.validate.nonempty_text $key
        handler = ( $value ) =>
          @send freeze { $key, $value, }
          @advance()
      when 'function'
        handler = ( $value ) =>
          @send $key $value
          @advance()
      when 'generatorfunction'
        handler = ( $value ) =>
          @send d for d from $key $value
          @advance()
      else
        throw new Error "^receiver/add_data_channel@445^ expected a text, a function, or a generatorfunction, got a #{type}"
    eventemitter.on eventname, handler
    return null

  #---------------------------------------------------------------------------------------------------------
  ### TAINT make `$key` behave as in `add_data_channel()` ###
  add_initializer: ( $key ) ->
    ### Send a datom before any other data. ###
    types.validate.nonempty_text $key
    @initializer = freeze { $key, }

  #---------------------------------------------------------------------------------------------------------
  ### TAINT make `$key` behave as in `add_data_channel()` ###
  add_terminator: ( eventemitter, eventname, $key = null ) ->
    ### Terminates async iterator after sending an optional datom to mark termination in stream. ###
    eventemitter.on eventname, =>
      @send freeze { $key, } if $key?
      @advance false

  #---------------------------------------------------------------------------------------------------------
  @from_child_process: ( cp, settings ) ->
    # defaults  = {}
    # settings  = { defaults..., }
    ### TAINT validate settings ###
    rcv       = new Receiver()
    rcv.add_initializer   '<cp'
    rcv.add_data_channel cp.stdout, 'data', '^stdout'
    rcv.add_data_channel cp.stderr, 'data', '^stderr'
    rcv.add_terminator cp, 'close', '>cp'
    while not rcv.done
      await rcv.ratchet; yield from rcv
    return null

#-----------------------------------------------------------------------------------------------------------
_send = ( d ) ->
  if @is_first
    @is_first = false
    @collector.push @initializer if @initializer?
  @collector.push d

#-----------------------------------------------------------------------------------------------------------
_advance  = ( go_on = true ) ->
  @done     = not go_on
  @_resolve()
  @ratchet  = new Promise ( resolve ) => @_resolve = resolve


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
custom_receiver_from_child_process = ( cp ) ->
  rcv           = new Receiver()
  #.........................................................................................................
  ### Add an initializer (data to be always sent once before any other): ###
  rcv.add_initializer   '<cp'
  #.........................................................................................................
  ### Use a `$key` for the datom to be sent: ###
  rcv.add_data_channel cp.stdout, 'data', '^stdout'
  #.........................................................................................................
  ### Can also use an iterator to send anything in response to `$value`: ###
  rcv.add_data_channel cp.stderr, 'data', ( $value ) ->
    yield "next event is from stderr"
    yield freeze { $key: '^stderr', $value, }
  #.........................................................................................................
  ### Add a terminator, otherwise stream will not close properly; here, we make it also send a datom after
  all regular data has been sent: ###
  rcv.add_terminator cp, 'close', '>cp'
  #.........................................................................................................
  while not rcv.done
    await rcv.ratchet; yield from rcv
  help "^8743^ receiver: no more data"
  return null

#-----------------------------------------------------------------------------------------------------------
create_receiving_pipeline = ( delay ) -> new Promise ( resolve_outer, reject_outer ) =>
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
      return send d if ( not d? ) or ( not types.isa.buffer d.$value )
      send ( freeze { $key, $value, } ) for $value from SL.walk_lines ctx, $value
      return null
  #---------------------------------------------------------------------------------------------------------
  source      = SP.new_push_source()
  pipeline    = []
  pipeline.push source
  pipeline.push $split_channels()
  pipeline.push $watch ( d ) ->
    ### TAINT not a good way to find out whether $value should be parsed ###
    try info JSON.parse d.$value catch error then urge d
  pipeline.push $drain ->
    help "^3776^ pipeline: finished"
    return resolve_outer()
  SP.pull pipeline...
  #.........................................................................................................
  { spawn }   = require 'child_process'
  cp          = spawn 'node', [ __filename, 'generate', '--nr', '1', '--delay', "#{delay}", ]
  source.send x for await x from Receiver.from_child_process cp
  cp          = spawn 'node', [ __filename, 'generate', '--nr', '2', '--delay', "#{delay}", ]
  source.send x for await x from custom_receiver_from_child_process cp
  source.end()
  return null

#-----------------------------------------------------------------------------------------------------------
cli = -> new Promise ( done ) =>
  #.........................................................................................................
  runner = ( d ) =>
    delay = d.verdict.parameters.delay
    nr    = d.verdict.parameters.nr
    switch d.verdict.cmd
      when 'generate' then await generate_lines_of_text delay, nr
      when 'receive'  then await create_receiving_pipeline delay
      else throw new Error "^cli@33336^ unknown command #{rpr d.verdict.cmd}"
    done()
  #.........................................................................................................
  jobdefs =
    commands:
      #.....................................................................................................
      'generate':
        description:  "generate series of words in different speeds"
        flags:
          'delay':  { alias: 'd', fallback: 0, type: Number, description: "seconds to pause between each chunk of data", }
          'nr':     { fallback: 1, description: "stream identifier to be used", }
        runner: runner
      #.....................................................................................................
      'receive':
        description:  "spawn subprocess and process signals it emits"
        flags:
          'delay':  { alias: 'd', fallback: 0, type: Number, description: "seconds to pause between each chunk of data", }
        runner: runner
  #.........................................................................................................
  MIXA.run jobdefs, process.argv
  return null

############################################################################################################
if module is require.main then do =>
  # await demo_receiver()
  await cli()


