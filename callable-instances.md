
## Callable Instances

Sometimes it is desirable to create function-like, callable objects from a class declaration. In JavaScript,
it is possible to declare a class that extends `Function()`:

```coffee
#===========================================================================================================
### thx to https://stackoverflow.com/a/40878674/256361 ###
class Fn extends Function

  #---------------------------------------------------------------------------------------------------------
  @class_method: ( self ) ->
    self._me.prop_11 = 'prop_11'
    return null

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    ### Call the `Function` prototype ###
    super '...P', 'return this._me.do(...P)'
    ### Define `@_me` as the bound version of `this`: ###
    @_me = @bind @
    ### Confusingly, instance attributes like `@_me.prop_7` must be tacked onto `@_me` *here*, but the
    `this` value within methods is `@_me`, so they refer to the *same* attribute as `@_me.prop_7`: ###
    guy.props.def @_me, 'prop_6', enumerable: true, value: 'prop_6'
    @_me.prop_7 =                                          'prop_7'
    @constructor.class_method @
    return @_me

  #---------------------------------------------------------------------------------------------------------
  do: ( a = 0, b = 0, c = 0 ) ->
    debug '^8-1^', @
    help '^8-2^', @prop_6
    help '^8-3^', @prop_7
    help '^8-4^', @prop_11
    help '^8-4^', @_me ### undefined ###
    return a + b + c

  #---------------------------------------------------------------------------------------------------------
  other_method: ->
    urge '^8-5^', @
    urge '^8-6^', @prop_6
    urge '^8-7^', @prop_7
    urge '^8-8^', @prop_11
    help '^8-4^', @_me ### undefined ###
    return null

#-----------------------------------------------------------------------------------------------------------
test = ->
  fn = new Fn()
  info '^8-9^', fn
  info '^8-10^', fn.prop_6
  info '^8-11^', fn.prop_7
  info '^8-12^', fn.prop_11
  info '^8-13^', fn 3, 4, 5
  info '^8-14^', fn.do 3, 4, 5
  info '^8-15^', fn.other_method()
  info '^8-15^', fn._me ### undefined ###
  return null
```

Note that because we return `@_me` (instead of `undefined` or `@`) from the `Fn::constructor()`, the
`this`/`@` value seen inside the constructor differs from the one seen from the outside of it. Consequently,
instance attributes must be attached to `@_me` in the constructor, while the `this` value available from
methods is this very `@_me`, and so attributes from that point of view *can* be accessed derictly through
`this`/`@`.

