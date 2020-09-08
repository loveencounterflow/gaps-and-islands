



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


#-----------------------------------------------------------------------------------------------------------
# resolve_project_path = ( path ) -> PATH.resolve PATH.join __dirname, '../../..', path

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


#-----------------------------------------------------------------------------------------------------------
demo_receiver = ( pause ) -> new Promise ( resolve_outer, reject_outer ) =>
  #---------------------------------------------------------------------------------------------------------
  g = ->
    ### thx to https://stackoverflow.com/a/59347615/7568091 ###
    { spawn } = require 'child_process'
    has_finished  = false
    results       = []
    resolve       = () => null
    promise       = new Promise ( r ) => resolve = r
    done          = false
    cp            = spawn 'node', [ __filename, 'generate', '--pause', "#{pause}", ]
    splitliners   = {}
    #.......................................................................................................
    new_catcher = ( $key ) ->
      splitliners[ $key ] = SL.new_context()
      return ( data ) =>
        for $value from SL.walk_lines splitliners[ $key ], data
          results.push Object.freeze { $key, $value, }
        resolve()
        promise = new Promise ( r ) => resolve = r
    #.......................................................................................................
    cp.stdout.on  'data',   new_catcher '^stdout'
    cp.stderr.on  'data',   new_catcher '^stderr'
    debug '^1776^', splitliners
    #.......................................................................................................
    cp.stdout.on  'end',    ->
      $key = '^stdout'
      for $value from SL.flush splitliners[ $key ]
        results.push Object.freeze { $key, $value, }
      resolve()
      promise = new Promise ( r ) => resolve = r
    #.......................................................................................................
    cp.stderr.on  'end',    ->
      $key = '^stderr'
      for $value from SL.flush splitliners[ $key ]
        results.push Object.freeze { $key, $value, }
      resolve()
      promise = new Promise ( r ) => resolve = r
    #.......................................................................................................
    cp.on 'error', ( error ) ->
      if has_finished
        warn error
        return null
      has_finished = true
      reject_outer error
    #.......................................................................................................
    cp.on 'close', =>
      done = true
    #.......................................................................................................
    while not done
      await promise
      # debug '^334455^', rpr results
      for x from results
        yield x
      results = []
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


