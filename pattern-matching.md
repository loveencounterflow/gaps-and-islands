

## Pattern Matching in Plain JavaScript

A [2020 blog post entitled *Pattern Matching in JavaScript*](https://kyleshevlin.com/pattern-matching)
showed a solution how to do sort-of kind-of [pattern
matching](https://github.com/tc39/proposal-pattern-matching) in plain JavaScript, and, by extension, in
CoffeeScript. The idea is simple: just use the switch statement and set its 'sentinel' (orwhatchamaycallit)
to `true`; then at each branch, perform a test that produces `true` (*not* another truthy value); the first
matching branch will win. A simple example:

```coffee
for a in [ 0 .. 12 ]
  switch true
    when a is 0       then  debug '^989-1^', a, 'none'
    when a is 1       then  debug '^989-1^', a, 'single'
    when a is 2       then  debug '^989-2^', a, 'double'
    when 3 < a < 10   then  debug '^989-3^', a, 'many'
    else                    debug '^989-4^', a, 'lots'
return null
```

The default branch could also be written as `when true then ...`, but that's less clear so make it `else`.



