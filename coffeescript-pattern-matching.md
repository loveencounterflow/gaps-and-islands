

## Pattern Matching in Plain JavaScript (but using CoffeeScript)

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

### Pattern Matching with Pre-Computed Values

When an expression should be matched against multiple values one can use a `do` closure:

```coffee
for a in [ 0 .. 12 ]
  do ( b = a + 1 ) =>
    switch true
      when b is 0       then  debug '^989-1^', b, 'none'
      when b is 1       then  debug '^989-1^', b, 'single'
      when b is 2       then  debug '^989-2^', b, 'double'
      when 3 < b < 10   then  debug '^989-3^', b, 'many'
      else                    debug '^989-4^', b, 'lots'
return null
```


