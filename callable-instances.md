
## Callable Instances

```coffee
class Myclass extends Function

  constructor: ->
    super()
    Object.setPrototypeOf @mymethod, Myclass.prototype
    return @mymethod

  mymethod: ( ... ) => ...

```

