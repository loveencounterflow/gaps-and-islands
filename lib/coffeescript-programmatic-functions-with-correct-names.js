(function() {
  //-----------------------------------------------------------------------------------------------------------
  var add, add_beauty_1, add_beauty_2, get_beautified_calculator_1, get_beautified_calculator_2, log, my_name;

  log = console.log;

  get_beautified_calculator_1 = function(f) {
    return function(a, b) {
      return '⁂' + (f(a, b)).toString() + '⁂';
    };
  };

  get_beautified_calculator_2 = function(f) {
    var beautified;
    return beautified = function(a, b) {
      return '⁂' + (f(a, b)).toString() + '⁂';
    };
  };

  add = function(a, b) {
    return a + b;
  };

  add_beauty_1 = get_beautified_calculator_1(add);

  add_beauty_2 = get_beautified_calculator_2(add);

  log(get_beautified_calculator_1); // [Function: get_beautified_calculator_1]   — 💚 OK

  log(get_beautified_calculator_2); // [Function: get_beautified_calculator_2]   — 💚 OK

  log(add); // [Function: add]                           — 💚 OK

  log(add_beauty_1); // [Function (anonymous)]                    — ❌ not OK

  log(add_beauty_2); // [Function: beautified]                    — ❌ not OK

  
  //-----------------------------------------------------------------------------------------------------------
  log({
    x: 42 // { x: 42 }
  });

  log({
    f: (function() {}) // { f: [Function: f] }                      — ❢ function picks up name `f`
  });

  my_name = 'spiderman';

  log({
    [`${my_name}`]: 42 // # { spiderman: 42 }                       — ❢❢ can use computed keys
  });

  log({
    [`${my_name}`]: (function() {}) // # { spiderman: [Function: spiderman] }    — ❢❢❢ function picks up computed name
  });

}).call(this);

//# sourceMappingURL=coffeescript-programmatic-functions-with-correct-names.js.map