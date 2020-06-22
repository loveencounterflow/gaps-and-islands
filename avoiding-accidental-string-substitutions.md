
### Avoiding Accidental String Substitutions (so-called A$$es)

JavaScript's `String::replace()` function has that sometimes-useful feature that is replacement patterns in
the replacement string; for example, when you do `'abc'.replace /(b)/g, '==$1=='`, you'll get `'a==b==c'`.

Less thoughts are often spent on that feature opening a startling backdoor for things to go wrong: Of
course, if some characters in the replacement may trigger special feature, that means that inevitably there
will be times when all goes well until some kind of unexpected input cause weird things to happen.

Today that happened to me. Due to my SQL adapter not accepting SQL values tuples (that you need for queries
like `select * from t where x in ( 'a', 'b', 'c' )`), I had to roll my own. That wasn't too hard given that
I had already implemented basic SQL value interpolation for a related project:

```coffee
glyphs_tuple  = generate_sql_values_tuple glyphs
sql           = sql_template.replace /\?glyphs\?/g, glyphs_tuple
```

Now that query had already run thousands of times without problems—but today was the first time the `glyphs`
variable contained a `$` dollar sign; the `glyphs_tuple` then looked like `( '#', '!', '$', '%' )`. Should
be no problem! But it is: as [the
docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
clearly state:

> `$'` [i.e. dollar, quote]  inserts the portion of the string that follows the matched substring.

So when you do `'abc'.replace /(b)/g, "$"`, you get `'a$c'`, no problem indeed. But add a quote as in
`'abc'.replace /(b)/g, "$'"`, and suddenly the result is `'acc'`.

This particular aspect—that only *some* sequences cause special behavior—makes the feature even more
insidious. Even worse, `'abc'.replace /(b)/g, "$1"` gives `'abc'` as expected, but any number beyond `1` is
not special, so `'abc'.replace /(b)/g, "$2"` gives `'a$2c'` and so. This is because there is no second group
in *this* pattern; use another pattern with two groups and `$2` *will* become special.

Now, this isn't rocket science, but certainly obnoxious. Because the odds are so small that a random string
will contain one of the problematic sequences, likewise, the odds are small that you'd even catch this with
testing unless you're throwing insane amounts of test data against each `replace()` instance.

It's probably better to heed this piecve of advice:

> If a feature is sometimes useful and sometimes dangerous and if there is a better option then always use
> the better option.—[D. Crockford](https://blog.gisspan.com/2016/07/Constructor-Vs-Factory.html)

Luckily, There's a way out: use a function: As per the docs, `String.replace ( ... ) -> ...` is free from
these surprising effects:

> [t]he function's result (return value) will be used as the replacement string. [...] [t]he [...] special
> replacement patterns do not apply in this case.)

Therefore, the fix is simple:

```coffee
# sql = sql_template.replace /\?glyphs\?/g,    glyphs_tuple
sql   = sql_template.replace /\?glyphs\?/g, -> glyphs_tuple
```



