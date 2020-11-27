


<!-- coffeescript-class-instance-properties.md -->

## Properties with Getters and Setters for (ES6) Classes

CoffeeScript has kind of an issue with ES6 `get()`ters and `set()`ters and also no built-in way to define
properties with getters and setters, not for classes and not otherwise. OTOH it's surprisingly simple and
straightforward to recruit `Object.defineProperties()` for the job:

```coffee
class Person

  constructor: ( @first_name, @last_name ) ->

  new_properties @, favnumber:
    get: -> 42

  Object.defineProperties @prototype,
    full_name:
      get:                -> "#{@first_name} #{@last_name}"
      set: ( full_name  ) -> [ @first_name, @last_name ] = full_name.split ' '
```

It is certainly possible to define a helper function to make that even a bit easier:

```coffee
new_properties = ( me, P... ) -> Object.defineProperties me.prototype, P...

class Person
  ...
  new_properties @, favnumber:
    get: -> 42
```

but whether that is worth the trouble is another question. See
[coffeescript-class-instance-properties.coffee](./src/coffeescript-class-instance-properties.coffee) (or
[the corrresponding JS](./lib/coffeescript-class-instance-properties.js)) for a working example.


