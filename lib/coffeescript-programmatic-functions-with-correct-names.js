(function() {
  var add, add_beauty, get_beautified_calculator, log;

  log = console.log;

  get_beautified_calculator = function(f) {
    var beautified;
    return beautified = function(a, b) {
      return '⁂' + (f(a, b)).toString() + '⁂';
    };
  };

  add = function(a, b) {
    return a + b;
  };

  add_beauty = get_beautified_calculator(add);

  log(get_beautified_calculator); // [Function: get_beautified_calculator]   — 💚 OK

  log(add); // [Function: add]                         — 💚 OK

  log(add_beauty); // [Function: beautified]                  — ❌ not OK

}).call(this);

//# sourceMappingURL=coffeescript-programmatic-functions-with-correct-names.js.map