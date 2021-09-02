
## Callable Instances

Sometimes it is desirable to create function-like, callable objects from a class declaration; one example
would be a Python-esque context manager that, under the hood, calls methods to acquire and release resources
before and after a user-provided block of custom code—the **kernel**—is executed.

Such a context manager can then be used e.g. to implicitly open a file, then—in the managed code
block—explicitly read form the file, and finally (whether an error occurred or not) implicitly close the
file before either returning the result or re-throwing the error.

Another example: SQLite normally prohibits write access to a database that is being read from, but it does
offer an 'unsafe mode' where one can still perform writes—these are safe as long as they do not alter any
records being iterated over. Most of the time, one will stick to 'safe mode', but sometimes it is both
convenient and safe to temporarily switch to 'unsafe mode' as long as one knows what one is doing. A
suitable context manager would come in handy to orchestrate the necessary steps (record the current mode,
switch to unsafe, perform reads and writes, finally switch back to previous mode).

Similarly, DB transactions should either `commit` or `rollback` depending on whether an error occurred in
the kernel.

```coffee
class Context_manager extends Function

  constructor: ( cfg ) ->
    super()
    @cfg = cfg
    return @manage

  enter: ( rtas... ) -> null

  exit: ( cx_value, rtas... ) -> null

  manage: ( foo, bar, rtas..., block ) =>
    validate.function block
    cx_value = @enter rtas...
    try
      block_value = block.call @, cx_value, rtas...
    finally
      @exit cx_value, rtas...
    return block_value
```

