
'use strict'

############################################################################################################
GUY                       = require 'guy'
{ alert
  debug
  help
  info
  plain
  praise
  urge
  warn
  whisper }               = GUY.trm.get_loggers 'GAPS-AND-ISLANDS'
{ rpr
  inspect
  echo
  log     }               = GUY.trm
#...........................................................................................................
PATH                      = require 'node:path'
FSP                       = ( require 'node:fs' ).promises
PGT                       = require 'paragate'
join                      = ( me, P...  ) -> PATH.resolve PATH.join me.base_path, P...
read                      = ( me, path  ) -> await FSP.readFile path, { encoding: 'utf-8', }
clear                     = ( me        ) -> await FSP.writeFile me.target_path, ''
write                     = ( me, text  ) -> await FSP.appendFile me.target_path, text.toString()
comment                   = ( text      ) -> '<!-- ' + ( text.toString().replace /--/g, '-_' ) + ' -->\n'
unquote                   = ( text      ) -> text.replace /^(['"])(.*)\1$/, '$2'

#-----------------------------------------------------------------------------------------------------------
@interpret_inserts = ( me, token ) ->
  for d in PGT.HTML.grammar.parse token.text
    switch d.$key
      when '<document', '>document' then null
      when '^text'
        dent = '  '.repeat d.level ? 0
        for line in d.text.split /\n/
          await write me, dent + line + '\n'
      when '^tag'
        unless d.name is 'insert'
          await write me, d.text
          continue
        # await write me, comment d.text
        urge '^554^', "inserting #{d.atrs.src}"
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
    switch d.$key
      when '<document', '>document' then null
      when '^blank'
        await write me, d.text
      when '^block'
        if d.text.startsWith '<insert'
          await @interpret_inserts me, d
          continue
        dent = '  '.repeat d.level ? 0
        for line in d.text.split /\n/
          await write me, dent + line + '\n'
      else throw new Error "^4776^ unknown token $key #{rpr d.$key}"
  return me


############################################################################################################
if module is require.main then do =>
  await @compile_readme()

