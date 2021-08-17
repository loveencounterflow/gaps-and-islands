
## Mixins

* Thx to https://alligator.io/js/class-composition/
* Write mixins as functions that take an optional `clasz` argument which defaults to `Object` (or a custom
  `Base` class).
* Extend the top level class from a call chain of the mixins.
* In CoffeeScript, one can omit the braces for all calls except the final one.
* Can also write `class Main extends B_mixin A_mixin Object` instead of `class Main extends B_mixin
  A_mixin()`, The advantage being that the presence of `Object` gives a hint about the directionality of
  mixin application (important in the case of shadowing).

```coffee

#-----------------------------------------------------------------------------------------------------------
A_mixin = ( clasz = Object ) => class extends clasz
  constructor: ->
    super()
    # help '^343-1^', known_names = new Set ( k for k of @ )
    @a_mixin  = true
    @name     = 'a_mixin'

  introduce_yourself: -> urge "helo from class #{@name}"

#-----------------------------------------------------------------------------------------------------------
B_mixin = ( clasz = Object ) => class extends clasz
  constructor: ->
    super()
    # help '^343-2^', known_names = new Set ( k for k of @ )
    @b_mixin  = true
    @name     = 'b_mixin'


#-----------------------------------------------------------------------------------------------------------
class Main extends B_mixin A_mixin()
  constructor: ->
    super()
    @main     = true
    @name     = 'main'


############################################################################################################
if module is require.main then do =>
  d = new Main()
  d.introduce_yourself()

  # helo from class main

```

## Callable Instances

```coffee
class Myclass extends Function

  constructor: ->
    super()
    Object.setPrototypeOf @mymethod, Myclass.prototype
    return @mymethod

  mymethod: ( ... ) => ...

```

