
#-----------------------------------------------------------------------------------------------------------

log = console.log

get_beautified_calculator_1 = ( f ) ->
  return ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'

get_beautified_calculator_2 = ( f ) ->
  return beautified = ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'

add = ( a, b ) -> a + b

add_beauty_1 = get_beautified_calculator_1 add
add_beauty_2 = get_beautified_calculator_2 add
log get_beautified_calculator_1   # [Function: get_beautified_calculator_1]   — 💚 OK
log get_beautified_calculator_2   # [Function: get_beautified_calculator_2]   — 💚 OK
log add                           # [Function: add]                           — 💚 OK
log add_beauty_1                  # [Function (anonymous)]                    — ❌ not OK
log add_beauty_2                  # [Function: beautified]                    — ❌ not OK

#-----------------------------------------------------------------------------------------------------------

log { x: 42, }                # { x: 42 }
log { f: ( -> ), }            # { f: [Function: f] }     — ❢ function picks up name `f`

my_name = 'wow'

log { "#{my_name}": 42, }     # { wow: 42 }              — ❢❢ can use computed keys
log { "#{my_name}": ( -> ), } # { wow: [Function: wow] } — ❢❢❢ function picks up computed name

#-----------------------------------------------------------------------------------------------------------

get_beautified_calculator_3 = ( name, f ) ->
  return { "#{name}": ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'
  }[ name ]

get_beautified_calculator_4 = ( f ) ->
  name = "beautified_#{f.name}"
  return { "#{name}": ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'
  }[ name ]

add = ( a, b ) -> a + b

add_beauty_3 = get_beautified_calculator_3 'a beautified add function', add
add_beauty_4 = get_beautified_calculator_4 add
log add_beauty_3              # 💚💚💚 [Function: a beautified add function] 💚💚💚
log add_beauty_4              # 💚💚💚 [Function: beautified_add]            💚💚💚



