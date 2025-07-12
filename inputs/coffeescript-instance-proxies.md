<!-- coffeescript-infinite-proxies.md -->

## Instance Proxies

* Below we show a `class D` whose instances will *only* have properties that are managed by a proxy.

* The line `return target[ key ] if ( typeof key ) is 'symbol'` is there to ensure that all of JS's internal
  lookups that use symbols are redirected to the proper property owner. 

* The line `return Reflect.get target, key if Reflect.has target, key` falls back to using the proxy
  target's existing properties where a given property exists; all unknown property keys are countered with 
  a message string. In both cases, additional behavior could be implemented. 

* Trying to set the prototype of the return value (e.g. with `Object.setPrototypeOf R, @`) is not needed and
  indeed results in `TypeError: Cyclic __proto__ value`; as the debugging line marked `Ω___6` shows, the
  instance `d` is indeed an instance of `D`.


```coffee
#-----------------------------------------------------------------------------------------------------------
class D
  #.........................................................................................................
  constructor: ->
    @other_prop = 'OTHER_PROP'
    R = new Proxy @,
      get: ( target, key ) ->
        return target[ key ] if ( typeof key ) is 'symbol'
        return Reflect.get target, key if Reflect.has target, key
        return "something else: #{rpr key}"
    return R
  #.........................................................................................................
  method_of_d: -> 'METHOD_OF_D'
  property_of_d: 'PROPERTY_OF_D'
#...........................................................................................................
d = new D()
debug 'Ω___1', d                # D { other_prop: 'OTHER_PROP' }
debug 'Ω___2', d.other_prop     # OTHER_PROP
debug 'Ω___3', d.method_of_d()  # METHOD_OF_D
debug 'Ω___4', d.property_of_d  # PROPERTY_OF_D
debug 'Ω___5', d.unknown_key    # something else: 'unknown_key'
debug 'Ω___6', d instanceof D   # true
```
