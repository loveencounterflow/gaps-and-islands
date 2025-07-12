<!-- coffeescript-infinite-proxies.md -->

## Infinite Proxies

* A **proxy**, of course, is a device to capture / manage / deflect / instrument access to a specific, some
  or all properties of a given object;

* an **infinite proxy** (or, more precisely, an **infinite-chain proxy**) is a proxy that allows building
  arbitrarily deep 'as hoc' chains of properties on a managed object.

* Below we show a partial implementation for a proxy inspired by
  [`webdiscus/ansis`](https://github.com/webdiscus/ansis), a CLI color library that enables users to write,
  say, `console.log ansis.bold.underline.red "warning"`; here, `ansis` would be our proxied `base` object (a
  function), and `.bold.underline.red()` is a chain of properties that describe the desired style of output
  to apply to the text which forms the argument of the call.

* `webdiscus/ansis` also enables stuff like `ansis.underlin.hex('#5afb33').underline"text"` which we will
  not discuss here.

* The proxy as shown below uses a variable `stack` to record all property accesses on the proxy;

* it returns (essentially) itself (i.e. property access on this proxy returns the same proxy).

* Since the 'target' (viewpoint of the proxy) respectively the 'base' (viewpoint of the user) is a function,
  the property chain can be ended at any point and arguments can be added, so `p.bold.red 'x'` accesses
  `bold` (stack is `[ 'bold', ]`), then `red` (stack is `[ 'bold', 'red', ]`), and finally calls the base
  with argument `'x'`.

* The base will pop all names from the stack, decide (in the real world) what ANSI codes to use to implement
  the desired styles, or else (in this demo) just report the stacked names in the output.

```coffee
#===========================================================================================================
demo_proxy = ->
  stack     = []
  get_proxy = Symbol 'get_proxy'
  #.........................................................................................................
  template =
    base:                     null
    is_initial:               true
    empty_stack_on_new_chain: true
  #.........................................................................................................
  new_infiniproxy = nfa { template, }, ( base, is_initial, cfg ) ->
    is_initial = false unless cfg.empty_stack_on_new_chain
    proxy = new Proxy base,
      get: ( target, key ) ->
        return new_infiniproxy { base, is_initial: false, } if key is get_proxy
        return target[ key ] if ( typeof key ) is 'symbol'
        stack.length = 0 if is_initial
        stack.push key
        return R
    if is_initial then  R = new_infiniproxy { base, is_initial: false, }
    else                R = proxy
    return proxy
  #.........................................................................................................
  base = ( P... ) ->
    R = "#{stack.join '.'}::#{rpr P}"
    stack.length = 0
    return R
  #.........................................................................................................
  ### These calls will be `stack`ed but then get thrown away as soon as any property of `p` is used: ###
  do =>
    echo '——————————————————————————————————————————————————————————————————————————————'
    p = new_infiniproxy base, { empty_stack_on_new_chain: true } ### default ###
    p.ooops;  debug 'Ω___1', stack
    p.wat;    debug 'Ω___2', stack
    p.nö;     debug 'Ω___3', stack
    info 'Ω___4', p.more_of_this"some text"
    debug 'Ω___5', stack
    return null
  #.........................................................................................................
  ### These calls will be `stack`ed and remain on the stack until `p` is called: ###
  do =>
    echo '——————————————————————————————————————————————————————————————————————————————'
    p = new_infiniproxy base, { empty_stack_on_new_chain: false } ### opt-in ###
    p.ooops;  debug 'Ω___6', stack
    p.wat;    debug 'Ω___7', stack
    p.nö;     debug 'Ω___8', stack
    info 'Ω___9', p.more_of_this"some text"
    debug 'Ω__10', stack
    return null
  #.........................................................................................................
  do =>
    echo '——————————————————————————————————————————————————————————————————————————————'
    p = new_infiniproxy base
    info 'Ω__11', p.red.bold.underline"some text"
    ### Some random property retrievals without call... ###
    p.bold.underline
    p.strikethrough.inverse
    ### ...won't influence the meaning of the next property chain: ###
    info 'Ω__12', p.yellow"finally, a call"
    ### But if needed, can always reference a proxy from an intermediate result and build a property chain
    on that; here we used a special unique value `get_proxy` that produces an intermediate result *without*
    adding it to the property chain: ###
    proxy = p[ get_proxy ]
    ### Imagine we go through some branching if/then clauses to decide whether to add some styles: ###
    proxy.bold.underline
    proxy.strikethrough
    proxy.inverse
    proxy.yellow
    ### Finally, we're ready to print: ###
    info 'Ω__13', proxy"this will be printed in bold + underline + strikethrough + inverse + yellow"
    return null
  return null
```

---------------------------------


> **Note** OT but the example uses `nfa { template, }, ( base, is_initial, cfg ) ->` to declare the
> signature of `new_infiniproxy()`; 'NFA' stands for **N**ormalize **F**unction **A**rguments and is
> available (also on NPM) as
> [`loveencounterflow/normalize-function-arguments`](https://github.com/loveencounterflow/normalize-function-arguments);
> the effect of `fn = nfa { template, } ( a, b, cfg ) ->` is that `fn()` can now be called as `fn x1`, `fn
> x1, x2` or `fn x1, x2, { x3: 'other value', y: ..., z: ..., }` and `nfa` will take care that the
> positional arguments and the named values in the `cfg` object will always be consistent (`x1 === cfg.x1`
> and so on), among other things.


