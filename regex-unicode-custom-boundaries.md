
## Regular Expressions: Required Reading


* [RexEgg](https://www.rexegg.com):

  * [*Regex Boundaries and Delimiters—Standard and Advanced*](https://www.rexegg.com/regex-boundaries.html)

  * [*Reducing (? … ) Syntax Confusion*](https://www.rexegg.com/regex-disambiguation.html). This article
    provides a handy cross-language discussion of the semantics of all functionalities that are triggered by
    the 'paren, question mark' `(?...)` notation of regexes. While a majority of these do *not* apply to
    JavaScript, it's still education to see what people have come up with, and the discussion might also
    provide clues how to port a cryptic non-JS regex to JS.


* [MDN](https://developer.mozilla.org)—The Mozilla Developers Network has some amazing documentation, but
  it is also a maze, literally. The part that deals with regexes alone is hard to navigate, and I sometimes
  wish someone would put it on a single page to make it easier to locate topics. Here are some entry points:

  * [*RegExp*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

  * [The *Regular Expressions* chapter in the *JavaScript
    Guide*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)

  * [*Character
    Classes*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes)

  * [*Assertions*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Assertions)

## Regular Expressions: How to Test For Unicode-Compliant Boundaries

Until such time that I do a writeup, let's just dump some code with a few remarks:

* `\b` in regexes marks a boundary
* more spefically, the place *between* two characters where on one side `\w` matches but not on the other side
* `\w` and its negation `\W` are only defined for 7bit ASCII
* therefore, a `\b` boundary is recognized in, say, `'a,'`, but *not* in `'日,'`. *This is because `日` is
  considered a non-word character*. This is, of course, nonsense. It's understandable that `\w` did not get
  extended to Unicode because in the general case it's not an easy thing to do, but it also means that a lot
  of regexes will pass simple tests and fail once they get to see input beyond `[a-zA-Z0-9]`.

```coffee
'ba,de'.match /.\b./u   # [ 'a,', index: 1, input: 'ba,de', groups: undefined ]
'bä,de'.match /.\b./u   # [ 'bä', index: 0, input: 'bä,de', groups: undefined ]
'b日,de'.match /.\b./u  # [ 'b日', index: 0, input: 'b日,de', groups: undefined ]
```


```coffee
#-----------------------------------------------------------------------------------------------------------
@_dbay_macros_custom_regex_boundaries = ( T, done ) ->
  ### see [*Regex Boundaries and Delimiters—Standard and
  Advanced*](https://www.rexegg.com/regex-boundaries.html) ###
  probe_3 = "cat,dog cat123 bird 45 cat"
  probe_4 = "42cat,dog cat123 bird 45 cat99"
  #.........................................................................................................
  do ->
    whisper '^82-1^ ——————————————————————————————————————————————————————————————————————————————————————————————'
    info '^82-2^', "DIY Boundary: between an ASCII letter and a non-ASCII letter"
    A1_re   = ///
                  (?:
                    (?: (?<= ^ ) | (?<! [a-z] ) )
                    (?= [a-z]   )
                    |
                    (?<= [a-z] )
                    (?: (?= $ ) | (?! [a-z] ) )
                    )
                ///
    A1      = A1_re.source
    cat_re  = /// #{A1} cat #{A1} ///g
    help '^82-3^', cat_re
    info '^82-4^', probe_3
    urge '^82-5^', match for match from probe_3.matchAll cat_re
  #.........................................................................................................
  do ->
    whisper '^82-6^ ——————————————————————————————————————————————————————————————————————————————————————————————'
    new_boundary = ( pattern ) ->
      return ///
        (?:
          (?: (?<= ^ ) | (?<! (?! #{pattern}) ) )
          (?= #{pattern} )
          |
          (?<= #{pattern} | )
          (?: (?= $ ) | (?! #{pattern} ) )
          )
      ///.source
    LB      = new_boundary '[a-zA-Z]'
    word_re = /// #{LB} cat #{LB} ///g
    help '^82-7^', word_re
    urge '^82-8^', match for match from probe_3.matchAll word_re
    nr_re   = /// #{LB} \d+ #{LB} ///g
    help '^82-9^', nr_re
    urge '^82-10^', match for match from probe_3.matchAll nr_re
    #.......................................................................................................
    head    = '[a-zA-Z_]'
    tail    = '[a-zA-Z0-9_]'
    name_b  = new_boundary head
    name_re = /// #{LB} (?<name> #{head}#{tail}* ) #{LB} ///g
    help '^82-11^', name_re
    urge '^82-12^', match for match from probe_3.matchAll name_re
    #.......................................................................................................
    pattern = '[a-zA-Z_][a-zA-Z0-9_]*'
    name_b  = new_boundary pattern
    name_re = /// #{LB} (?<name> #{pattern} ) #{LB} ///g
    help '^82-13^', name_re
    urge '^82-14^', match for match from probe_3.matchAll name_re
    #.......................................................................................................
    help '^82-13^', name_re
    urge '^82-14^', match for match from probe_4.matchAll name_re
  #.........................................................................................................
  done?()
```
