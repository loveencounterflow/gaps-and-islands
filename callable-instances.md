
## Callable Instances

Sometimes it is desirable to create function-like, callable objects from a class declaration. In JavaScript,
it is possible to declare a class that extends `Function()`:

```coffee
### thx to https://stackoverflow.com/a/40878674/256361 ###
class Fn extends Function
  constructor: ->
    super '...P', 'return this._self._call(...P)'
    self = @bind @
    @_self = self
    return self
  _call: ( a = 0, b = 0, c = 0 ) ->
    log '^4-1^', @
    return a + b + c
  other_method: -> urge '^4-2^', @

fn = new Fn()
log '^4-3^', fn
log '^4-4^', fn 3, 4, 5
log '^4-5^', fn.other_method
log '^4-6^', fn.other_method()
```

