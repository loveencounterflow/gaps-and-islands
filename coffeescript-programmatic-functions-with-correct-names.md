
## Programmatic Functions with Computed Names (the ƒPOD pattern)


* Problem: sometimes one wants to produce functions in a programmatic way. Often, one then returns an
  anonymous function. Silly example in `get_beautified_calculator_1()`:

```coffee
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
```

* When one then prints that returned function to the console, the output will just say `[Function
  (anonymous)]` which tells you pretty much nothing; it's worse in error messages: *The error occurred in
    any of your many anonymous functions*.

* One can in a one-liner fashion prepend the function with an assignment to a throw-away local variable.
  Modern JS engines have for a decade or so now learned to pick up that name and tack it unto the function.
  In the above example, that's what we do in `get_beautified_calculator_2()` where our custom-built function
  is now called `beautified`. Much better.

* But—*all* functions returned by `get_beautified_calculator_2()` will be uniformly called `beautified`.
  Often, that's still not ideal.

* We would seemingly have to generate some JS source code and evaluate that to get our function named for
  the simple reason that we need an identifier on the LHS of the assignment. Needless to say, such a
  solution would be overkill, brittle and probably also create some kind of attack surface.

* Fortunately, there's a pretty straightforward way to **create functions with custom names**. Watch this:

```coffee
log { x: 42, }                # { x: 42 }
log { f: ( -> ), }            # { f: [Function: f] }     — ❢ function picks up name `f`

my_name = 'wow'

log { "#{my_name}": 42, }     # { wow: 42 }              — ❢❢ can use computed keys
log { "#{my_name}": ( -> ), } # { wow: [Function: wow] } — ❢❢❢ function picks up computed name
```

* And that's our solution—we just have to construct and object with a computed key and the new function as
  value, then retrieve that property from the object and return it, as in `get_beautified_calculator_3()`:

```coffee
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
```

* Observe that any sequence of characters will work in this solution—the function's name is purely for
  internal reference. Most of the time one will probably want something more practical; for example we could
  have computed the name of the returned function as shown in `get_beautified_calculator_4()`.

* For the JS-only folks who have reached this point, here's what the same looks like in JavaScript:

```js
get_beautified_calculator_4 = function(f) {
  var name;
  name = `beautified_${f.name}`;
  return {
    [`${name}`]: function(a, b) {
      return '⁂' + (f(a, b)).toString() + '⁂'; }
  }[name]; };
```

* call it the ƒPOD pattern ('eff-pod'; ƒ for *function*, POD for *plain old dictionary*)


