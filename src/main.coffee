
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
join                      = ( me, P... ) -> PATH.resolve PATH.join me.base_path, P...
read                      = ( me, path ) -> await FSP.readFile path, { encoding: 'utf-8', }
clear                     = ( me ) -> await FSP.writeFile me.target_path, ''
write                     = ( me, text ) -> await FSP.appendFile me.target_path, text.toString()
comment                   = ( text ) -> '<!-- ' + ( text.toString().replace /--/g, '-_' ) + ' -->\n'
unquote                   = ( text ) -> text.replace /^(['"])(.*)\1$/, '$2'

#-----------------------------------------------------------------------------------------------------------
@interpret_inserts = ( me, token ) ->
  for d in PGT.HTML.grammar.parse token.text
    switch d.$key
      when '<document', '>document' then null
      when '^text'
        await write me, d.text
      when '^tag'
        unless d.name is 'insert'
          await write me, d.text
          continue
        await write me, comment d.text
        await write me, comment d.atrs.src
        path  = PATH.join me.base_path, unquote d.atrs.src ### TAINT should be done by HTML parser ###
        await write me, await read me, path
      else throw new Error "^4776^ unknown token $key #{rpr d.$key}"
  return null

#-----------------------------------------------------------------------------------------------------------
@compile_readme = ->
  me = {}
  me.base_path    = PATH.resolve PATH.join __dirname, '..'
  me.source_path  = join me, 'main.md'
  me.target_path  = join me, 'README.md'
  me.source       = await read me, me.source_path
  #.........................................................................................................
  await clear me
  for d in PGT.RXWS.grammar.parse me.source
    # info d
    switch d.$key
      when '<document', '>document' then null
      when '^blank'
        await write me, d.text
      when '^block'
        unless d.text.startsWith '<insert'
          await write me, d.text
          continue
        await @interpret_inserts me, d
      else throw new Error "^4776^ unknown token $key #{rpr d.$key}"
  return me


############################################################################################################
if module is require.main then do =>
  await @compile_readme()
