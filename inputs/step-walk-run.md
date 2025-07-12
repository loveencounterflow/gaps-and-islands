


## An Iterative API pattern: `step()` ➺ `walk()` ➺ `run()`

* `step()` is a function that, for each call, returns either (as the case may be)
  * the next item of the iteration, or, when the iteration has terminated,
    * `null`, or else
    * a special `end`
      [`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
  * a list of zero or more item**s**. When the iteration has terminated, then either
    * an empty list,
    * `null`,
    * or an `end` symbol can be returned, as seen appropriate.

* `walk()` is a generator function that calls `step()` until it recognized that function's termination
  signal (be it `null`, and empty list, or an `end` symbol). `walk()` will typically have a very minimal
  implementation; it is only there to take a tiny bit of boilerplate out of the consumer's code and enable
  `for x from walk()`, `yield from walk()` constructs

* `run()` is a function that returns (on each call or only when first called) a list of all items of the
  iteration, so, in essence, just `[ walk()..., ]`

* one could implement a universal `run()` method that, when given an iterator / generator / list of values `w`
  returns the same turned into a list, so `run w ≡ [ w..., ]`

