
'use strict'

############################################################################################################
CND                       = require 'cnd'
badge                     = 'GAPS-AND-ISLANDS'
rpr                       = CND.rpr
log                       = CND.get_logger 'plain',     badge
info                      = CND.get_logger 'info',      badge
whisper                   = CND.get_logger 'whisper',   badge
alert                     = CND.get_logger 'alert',     badge
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
_echo                     = CND.echo.bind CND
echo                      = ( text ) -> _echo text.replace /\n$/, ''
#...........................................................................................................
{ assign
  jr }                    = CND
# types                     = require '../../../apps/paragate/lib/types'
# { isa }                   = types
PATH                      = require 'path'
FSP                       = ( require 'fs' ).promises
PGT                       = require 'paragate'
resolve_path              = ( path ) -> PATH.resolve PATH.join __dirname, path
read_file                 = ( path ) -> await FSP.readFile ( resolve_path path ), { encoding: 'utf-8', }


#-----------------------------------------------------------------------------------------------------------
@interpret_inserts = ( me, token ) ->
  for d in PGT.HTML.grammar.parse token.text
    switch d.$key
      when '<document', '>document' then null
      when '^text'
        echo d.text
      when '^tag'
        unless d.name is 'insert'
          echo d.text
          continue
        echo CND.reverse CND.blue d
      else throw new Error "^4776^ unknown token $key #{rpr d.$key}"
  return null

#-----------------------------------------------------------------------------------------------------------
@compile_readme = ->
  me =
    target_path:  resolve_path '../README.md'
    source:       await read_file '../main.md'
  #.........................................................................................................
  for d in PGT.RXWS.grammar.parse source
    # info d
    switch d.$key
      when '<document', '>document' then null
      when '^blank'
        echo d.text
      when '^block'
        unless d.text.startsWith '<insert'
          echo CND.blue d.text
          continue
        @interpret_inserts me, d
      else throw new Error "^4776^ unknown token $key #{rpr d.$key}"
  return me


############################################################################################################
if module is require.main then do =>
  await @compile_readme()

