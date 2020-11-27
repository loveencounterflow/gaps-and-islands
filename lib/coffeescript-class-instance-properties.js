(function() {
  'use strict';
  var Mathematician, Person, log, m, new_properties, p;

  // thx to https://stackoverflow.com/a/15509083/256361

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  log = console.log;

  //-----------------------------------------------------------------------------------------------------------
  new_properties = function(me, ...P) {
    return Object.defineProperties(me.prototype, ...P);
  };

  Person = (function() {
    //===========================================================================================================

    //-----------------------------------------------------------------------------------------------------------
    class Person {
      //---------------------------------------------------------------------------------------------------------
      constructor(first_name, last_name) {
        this.first_name = first_name;
        this.last_name = last_name;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    new_properties(Person, {
      favnumber: {
        get: function() {
          return 42;
        }
      }
    });

    //---------------------------------------------------------------------------------------------------------
    Object.defineProperties(Person.prototype, {
      full_name: {
        get: function() {
          return `${this.first_name} ${this.last_name}`;
        },
        set: function(full_name) {
          return [this.first_name, this.last_name] = full_name.split(' ');
        }
      }
    });

    return Person;

  }).call(this);

  Mathematician = (function() {
    //===========================================================================================================

    //-----------------------------------------------------------------------------------------------------------
    class Mathematician extends Person {};

    //---------------------------------------------------------------------------------------------------------
    new_properties(Mathematician, {
      favnumber: {
        get: function() {
          return 2e308;
        }
      }
    });

    return Mathematician;

  }).call(this);

  //-----------------------------------------------------------------------------------------------------------
  p = new Person('Robert', 'Paulson');

  log(p.full_name); // Robert Paulson

  log(p.full_name = 'Space Monkey');

  log(p.last_name); // Monkey

  log(p.favnumber);

  //-----------------------------------------------------------------------------------------------------------
  m = new Mathematician('Bill', 'Finite');

  log(m.favnumber);

  log(m.first_name);

  log(m.last_name);

  log(m.full_name);

  log(m.full_name = 'Zeta Cardinal');

  log(m);

}).call(this);

//# sourceMappingURL=coffeescript-class-instance-properties.js.map