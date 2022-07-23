
## Programmatic Functions with Correct Names


* Problem: sometimes one wants to produce functions in a programmatic way. Silly example:

```coffee
log = console.log

get_beautified_calculator = ( f ) ->
  beautified = ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'

add = ( a, b ) -> a + b

add_beauty = get_beautified_calculator add
log get_beautified_calculator   # [Function: get_beautified_calculator]   — 💚 OK
log add                         # [Function: add]                         — 💚 OK
log add_beauty                  # [Function: beautified]                  — ❌ not OK
```


