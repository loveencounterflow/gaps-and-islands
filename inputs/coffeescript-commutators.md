

## Another Way to Build Mixins: Commutators 

```coffee
#===========================================================================================================
demo_commutator = ->
  class TMP_no_such_key_error extends Error
  misfit = Symbol 'misfit'
  #===========================================================================================================
  class Commutator

    #---------------------------------------------------------------------------------------------------------
    constructor: ->
      @bearers  = []
      @cache    = new Map()
      return undefined

    #---------------------------------------------------------------------------------------------------------
    add_bearer: ( x ) -> @bearers.unshift x; return null

    #---------------------------------------------------------------------------------------------------------
    get: ( key, fallback = misfit ) ->
      return R if ( R = @cache.get key )?
      for bearer in @bearers
        continue unless Reflect.has bearer, key
        @cache.set key, R = { bearer, value: bearer[ key ], }
        return R
      return fallback unless fallback is misfit
      throw new TMP_no_such_key_error "Ω__31 unknown key #{rpr key}"

  #===========================================================================================================
  a = { k: 'K', l: 'not this', }
  b = { l: 'L', }
  c = new Commutator()
  c.add_bearer a
  c.add_bearer b
  debug 'Ω__32', c.get 'ttt', null
  debug 'Ω__33', c.get 'k'
  debug 'Ω__34', c.get 'l'
  return null
```
