
'use strict'

# thx to https://stackoverflow.com/a/15509083/256361

#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
log = console.log

#-----------------------------------------------------------------------------------------------------------
new_properties = ( me, P... ) ->
  Object.defineProperties me.prototype, P...


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Person

  #---------------------------------------------------------------------------------------------------------
  constructor: ( @first_name, @last_name ) ->

  #---------------------------------------------------------------------------------------------------------
  new_properties @, favnumber:
    get: -> 42

  #---------------------------------------------------------------------------------------------------------
  Object.defineProperties @prototype,
    full_name:
      get:                -> "#{@first_name} #{@last_name}"
      set: ( full_name  ) -> [ @first_name, @last_name ] = full_name.split ' '


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class Mathematician extends Person

  #---------------------------------------------------------------------------------------------------------
  new_properties @, favnumber:
    get: -> Infinity

#-----------------------------------------------------------------------------------------------------------
p = new Person 'Robert', 'Paulson'
log p.full_name # Robert Paulson
log p.full_name = 'Space Monkey'
log p.last_name # Monkey
log p.favnumber

#-----------------------------------------------------------------------------------------------------------
m = new Mathematician 'Bill', 'Finite'
log m.favnumber
log m.first_name
log m.last_name
log m.full_name
log m.full_name = 'Zeta Cardinal'
log m



