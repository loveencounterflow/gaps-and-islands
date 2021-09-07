

## Types and Constants Per Class Instance


This is a pattern to construct classes such that

* constants are accessible through the class
* types can be declared based on user-supplied configuration (not shown here)
* types are accessible through the / any instance
* in theory, one could call the class method `create_types()` with any instance / object (provided that if
  it has a `cfg` property, it does validate)


```coffee
'use strict'

{ lets
  freeze }                = require 'letsfreezethat'

#-----------------------------------------------------------------------------------------------------------
class _Hollerith_proto

  #---------------------------------------------------------------------------------------------------------
  ### Constants are a class property so we can access them without having an instance: ###
  @C: freeze
    u32_sign_delta:   0x80000000  ### used to lift negative numbers to non-negative                      ###
    u32_width:        4           ### bytes per element                                                  ###
    u32_nr_min:       -0x80000000 ### smallest possible VNR element                                      ###
    u32_nr_max:       +0x7fffffff ### largest possible VNR element                                       ###
    #.......................................................................................................
    defaults:
      hlr_constructor_cfg:
        vnr_width:    5           ### maximum elements in VNR vector ###
        validate:     false
        # autoextend: false
        format:       'u32'

  #---------------------------------------------------------------------------------------------------------
  @create_types: ( instance ) ->
    types = new ( require 'intertype' ).Intertype()
    #.......................................................................................................
    ### declare the `cfg` type for the constructor configuration and immediately put it to use: ###
    types.declare 'hlr_constructor_cfg', tests:
      "x is a object":                    ( x ) -> @isa.object x
      "@isa.cardinal x.vnr_width":        ( x ) -> @isa.cardinal x.vnr_width
      "@isa.boolean x.validate":          ( x ) -> @isa.boolean x.validate
      "x.format in [ 'u32', 'bcd', ]":    ( x ) -> x.format in [ 'u32', 'bcd', ]
    types.validate.hlr_constructor_cfg instance.cfg
    #.......................................................................................................
    ### declare other types as needed: ###
    types.declare 'hlr_vnr', ...
    #.......................................................................................................
    ### return the `Intertype` instance which will become an instance property: ###
    return types

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    ### derive effective `cfg` from defaults and argument, make it an instance property, then instantiate
    `types` and make it an instance property as well. This will fail if `cfg` should not validate. We
    are free to declare types in `create_types()` that are parametrized from consumer-provided or default
    configuration properties: ###
    @cfg    = { @constructor.C.defaults.hlr_constructor_cfg..., cfg..., }
    @types  = @constructor.create_types @
    ### freeze `cfg` b/c we won't support live `cfg` changes (can still use `lets` tho where called for) ###
    @cfg    = freeze @cfg
    return undefined


#-----------------------------------------------------------------------------------------------------------
class @Hollerith extends _Hollerith_proto

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super cfg
    ### 'compile' (i.e. choose) method into instance to eschew run-time switches: ###
    @encode = switch @cfg.format
      when 'u32' then @_encode_u32
      when 'bcd' then @_encode_bcd
    return undefined

#===========================================================================================================
### make constants a module-global for faster, easier access: ###
C           = _Hollerith_proto.C
### Export class, this allows consumers to instantiate with custom properties: ###
@Hollerith  = freeze @Hollerith
### Export all-uppercase (== stateless) instance with default `cfg` for wash-n-go usage: ###
@HOLLERITH  = new @Hollerith()
```


