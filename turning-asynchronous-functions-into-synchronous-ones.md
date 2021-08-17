
## Turning Asynchronous functions into Synchronous ones


See
  * [*A future for SQL on the web*](https://lobste.rs/s/1ylnel/future_for_sql_on_web)
  * [*A future for SQL on the web* by James Long (August 12, 2021)](https://jlongster.com/future-sql-web)

> The biggest problem is when sqlite does a read or write, the API is totally synchronous because it’s based
> on the C API. Accessing IndexedDB is always async, so how do we get around that?
>
> We spawn a worker process and give it a SharedArrayBuffer and then use the
> [`Atomics`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) API
> to communicate via the buffer. For example, our backend writes a read request into the shared buffer, and
> the worker reads it, performs the read async, and then writes the result back.
>
> I wrote a small [channel
> abstraction](https://github.com/jlongster/absurd-sql/blob/master/src/indexeddb/shared-channel.js) to send
> different types of data across a SharedArrayBuffer.
>
> The real magic is the
> [`Atomics.wait`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait)
> API. It’s a beautiful thing. When you call it, it completely blocks JS until the condition is met. You use
> it to wait on some data in the SharedArrayBuffer, and this is what enables us to turn the async read/write
> into a sync one. The backend calls it to wait on the result from the worker and blocks until it’s
> done.—[*A future for SQL on the web* by James Long (August 12,
> 2021)](https://jlongster.com/future-sql-web)

Unfortunately it turns out that the `Atomics` API is quite hard to use by itself.

> [Lin
> Clark](https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/)
> says so. See [*A cartoon intro to SharedArrayBuffers Articles* by Lin Clark (June
> 2017)](https://hacks.mozilla.org/category/code-cartoons/a-cartoon-intro-to-sharedarraybuffers/) for a
> thorough discussion.

In
[`hengist/async-to-sync-with-atomics-wait`](https://github.com/loveencounterflow/hengist/blob/master/dev/snippets/src/async-to-sync-with-atomics-wait.coffee)
I tried to get a working solution but didn't quite succeed.

What *did* work immediately is [`abbr/deasync`](https://github.com/abbr/deasync); here's a code sample:

```coffee
#-----------------------------------------------------------------------------------------------------------
demo_deasync_2 = ->
  after                 = ( dts, f ) -> setTimeout  f, dts * 1000
  deasync_callbackable  = require 'deasync'
  #.........................................................................................................
  deasync_awaitable = ( fn_with_promise ) ->
    return deasync_callbackable ( handler ) =>
      result = await fn_with_promise()
      handler null, result
      return null
  #.........................................................................................................
  frob_async = -> new Promise ( resolve ) =>
    after 1, -> warn '^455-1^', "frob_async done"; resolve()
  #.........................................................................................................
  frob_sync = deasync_awaitable frob_async
  frob_sync()
  info '^455-3^', "call to frob_sync done"
  return null


############################################################################################################
if module is require.main then do =>
  demo_deasync_2()
  urge '^803-1^', "demo_deasync_2 done"
```

On its own, `deasync` will only accept async functions that keep to the NodeJS custom of making async
functions accept a callback function as last argument that will call the callback with an optional error
first and result value last. It is straightforward to convert `Promise`-based functions to that style, so
that's what I did above. Note the output of the above is

```
^455-1^ frob_async done
^455-3^ call to frob_sync done
^803-1^ demo_deasync_2 done
```

which means that indeed although `frob_async()` uses `setTimeout()`, it can be called (in its wrapped
incarnation) without an explicit callback or `await` and still behave like a synchronous function.


