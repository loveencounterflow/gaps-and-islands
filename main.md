

# Gaps and Islands

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
This part to be updated by running `doctoc README.md`
<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# SQL

## The Gaps-And-Islands Pattern

* https://stackoverflow.com/questions/17046204/how-to-find-the-boundaries-of-groups-of-contiguous-sequential-numbers
* https://stackoverflow.com/questions/tagged/gaps-and-islands
* https://www.xaprb.com/blog/2006/03/22/find-contiguous-ranges-with-sql/

```sql

<insert src='./inputs/gaps-and-islands.icql'/>

```

## Maximum Value in Group / Biggest X in Subgroup

https://stackoverflow.com/a/8749095

```sql
create view combifont as select
    V1.linenr           as linenr,
    V1.iclabel          as iclabel,
    V1.styletag         as styletag,
    V1.fontnick         as fontnick,
    V1.glyphstyle       as glyphstyle
  from            all_glyphs_and_stylerules as V1
  left outer join all_glyphs_and_stylerules as V2 on ( true
    and V1.iclabel  = V2.iclabel
    and V1.styletag = V2.styletag
    --  ^^^^^^^^^^^^^^^^^^^^^^^^^  join condition to narrow down on group
    and V1.linenr   < V2.linenr )
    --  ^^^^^^^^^^^^^^^^^^^^^^^    comparison that fails for V2 when V1 selector is maximal
  where V2.linenr is null
  --    ^^^^^^^^^^^^^^^^^ select maximum (or minimum w/ inverted comparator)
  order by iclabel, styletag;
```


## Find RegEx Match in a Text Array

Postgres has `array_position( a, v )` to locate the first occurrence of a given value `v` in an array `a`;
there is no corresponding function to do the same matching a regular expression againts an array of texts.
It can be done in SQL:

```sql
create function FM._array_regex_position( ¶texts text[], ¶regex text )
  returns bigint immutable parallel safe language sql as $$
    select nr from unnest( ¶texts ) with ordinality x ( d, nr )
    where d ~ ¶regex order by nr limit 1; $$;

select FM._array_regex_position( array[ 'foo', 'bar', 'baz' ], '^b' );  -- gives 2
select FM._array_regex_position( array[ 'foo', 'bar', 'baz' ], 'a'  );  -- gives 2
select FM._array_regex_position( array[ 'foo', 'bar', 'baz' ], '.'  );  -- gives 1
select FM._array_regex_position( array[ 'foo', 'bar', 'baz' ], 'X'  );  -- gives null
select FM._array_regex_position( array[ 'foo', 'bar', 'baz' ], 'az' );  -- gives 3
```

<insert src='./inputs/immutable-columns-in-sql.md'/>

## Using `lateral` Replacement in SQLite

Given this toy table with a few numbers:

```sql
create table a ( d int );
insert into a values ( 1 ), ( 2 ), ( 3 ), ( 5 ), ( 7 ), ( 11 );
```

we want to get a table with these numbers to gether with their square roots and their
square roots multiplied by two. The naive approach is to repeat the common part in both
columns:

```sql
select
    d               as d,
    sqrt( d )       as e,
    sqrt( d ) * 2   as f
  from a;
```

This solution is the more unsatisfying the more expensive the function call gets and the
more often we wish to re-use its result in our view. In Postgres, the better solution
is to use `lateral` function calls. `lateral` clauses can be appended to the list of
references in the `from` clause, like this:

```sql
select
    a.d             as d,
    r.e             as e,
    r.e * 2         as f
  from a,
  lateral sqrt( d ) as r ( e );
```

Especially when expressions get longer, putting them into the `from` part of the
statement also helps legibility somewhat.

Unfortunately, `lateral` is not part of SQLite's version of SQL (as of early 2022), so we
need to look for another solution. Turns out a `join` can be used as replacement:

```sql
select
    a.d             as d,
    r.e             as e,
    r.e * 2         as f
  from a
  join ( select d, sqrt( d ) as e from a ) as r using ( d );
```

## SQLite DB with All Function Names

```bash
$ sqlite3 /tmp/sqlite-with-fiunctions-list.sqlite "create view f as select * from pragma_function_list order by name;"
$ sqlite3 /tmp/sqlite-with-fiunctions-list.sqlite "select * from f;"
$ sqlite3 /tmp/sqlite-with-fiunctions-list.sqlite "select count(*) from f;" # (A)
$ sqlitebrowser ~/temp/sqlite-with-fiunctions-list.sqlite                   # (B)
```

(1) gives me 198 functions, but open the same DB in [`sqlitebrowser`](https://sqlitebrowser.org), and their
SQLite client library has only 119 functions.

## ESSFRI: Improving Integrity Checks in SQLite

Whereas Postgres is very strict in almost all aspects, allows no forward references and complains when it
encounters a view DDL that declares an unknown column, SQLite is more forgiving when it comes to `create
view` statements. For example, in an empty SQLite DB you can declare the following view:

```sql
drop view if exists bb_kw;
create view if not exists bb_kw as select
    a,
    b
  from nosuchtable;
```

without getting any hint that the view depends on a non-existant relation `nosuchtable` with non-existant
fields `a` and `b`. You *will* get an error, eventually, but only when you try to *use* the view, which may
happen at any arbitrary point in the future, or never. To improve this situation, there's a simple
workaround: use the view immediately! So instead of code like shown above, always add a `select` like so:

```sql
drop view if exists bb_kw;
create view if not exists bb_kw as select
    a,
    b
  from nosuchtable;
select * from bb_kw where false;
```

This line will do nothing and produce no output when the view DDL is referentially sound, but it will cause
the SQLite engine to compile a statement and complain with an error if any referenced relation or field is
not known at this point in time, which brings SQLite's behavior a bit closer to the way it should have
always been. Superficial tests have convinced me that tables are scrutinized more closely at creation time
so for the time being the 'empty select statement for referential integrity' (ESSFRI) is only useful when
applied to views.

## The Fastest Inserts in the Universe

**The Dual-Statement + App Code Approach:** A common pattern to do insert rows in an SQLite application is
to iterate over the rows of an SQL `select` statement, then process that data in JavaScript because maybe
you need additional stuff from outside the database or it's just much easier to process the data in
JavaScript than in SQL for the particular case, and then for every resulting row, you call a separate SQL
`insert` staement to persist the data.

One obvious problem with this approach is of course that it only works when `pragma journal_mode` has to be
set to `WAL`, and even then, you need to open a second connection (in the same process, to the same DB) that
does the writing.

**The SQL-only Approach:** In one case I wanted to split some strings into their constituent parts to get
the rows for another table; SQLite has no built-in table function for splitting strings, so you'd *think*
you can do that with a recursive CTE, but it turns out that while technically possible, the solution will be
many, many lines of convoluted SQL long, still take several intermediate views in more hairy cases, and best
of all, now you have a wonderful, hairy beast of a string-splitting SQL implementation and you still can't
apply it to the next occasion where you also want to split string but from a different source—because you
can't do 'parametrized views' a.k.a. 'stored procedures' (?) a.k.a. 'functions' written in SQL, in SQLite;
this is clearly one point where I miss Postgres because not only does it offer UDFs (user-defined
functions), and not only can you choose whether you want to write them in pure SQL or in PL/pgSQL—in this
case you likely wouldn't have to write your own table-valued function because Postgres already offers that
(along with arrays &cpp).

**Back to the Dual-Statement Approach:** So at least writing the string-splitting part made in JavaScript
was highly desirable (essentially the difference between `String::split()` and dozens upon dozens of lines
of poorly-tested recursive SQL), and the obvious way to integrate JavaScript and SQL was the
'dual-statement' way, as outlined above. It worked, but it did make me wonder whether something was wrong
with the code as I only reached up to 2,000Hz (rows per second), and as I pulled in more data that figure
fell below 800Hz, which is abysmal; a quick web search convinced me that it should be more in the range of
several 10,000Hz. By the way, adding explicit `begin transaction` and `commit` statements did in this case
do almost nothing (although it's always good advice to not rely on autocommit when writing lots of rows).

**The Single-Statement With Inline-Call-To-App Approach:** I then remembered another similar case and
rewrote the processing, and **here comes the essential part**: *it's not only possible to write a single SQL
statement that does **both** the data selection and the data insertion part, you can also still delegate
some or all of the processing work*, and this is what it looks like:

```sql
insert into target_table ( rowid, ref, s, v, o )
  select
      gt.rowid_out    as rowid,
      gt.ref          as ref,
      gt.s            as s,
      gt.v            as v,
      gt.o            as o
    from source_table                                                   as ml
    join do_processing( ml.rowid, ml.field_1, ml.field_2, ml.field_3 )  as gt
    where true -- needed by SQLite's parser
      -- more conditions here
  on conflict ( ref, s, v, o ) do nothing -- or whatever is appropriate
  ;
```

The central part of this statement is the call to `do_processing()` which is a user-defined table-valued
function written in JS and declared on the DB connection (here I used CoffeeScript and my own DB adapter
with a customized way to declare functions, but I could've just as well used JavaScript and
[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)'s [`table()`
API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#tablename-definition---this)):

```coffee
@create_table_function
  name:         'do_processing'
  parameters:   [ 'rowid_in', 'field_1', 'field_2', 'field_3', 'field_4', ]
  columns:      [ 'rowid_out', 'ref', 's', 'v', 'o', ]
  rows: ( rowid_in, field_1, field_2, field_3, field_4 ) ->
    yield from me.do_processing rowid_in, field_1, field_2, field_3, field_4
    ;null
```

Observe that this function does nothing but delegate the processing to a more suitable place and return an
iterator over the results.

To conclude: **The Single-Statement With Inline-Call-To-App Approach turned out to work at a whopping
100,000Hz, being a 100x performance gain over the Dual-Statement Approach.**

## SQLite: Safe Integers with Infinity and Type Checking

**Problem**: Working in NodeJS with (`better-sqlite3`)[https://github.com/WiseLibs/better-sqlite3], you want
to have a column for integer numbers that also accept `Infinity` as in JavaScript numbers; you want to
reject unsafe integers and fractional numbers.

**Solution**:

* As a nice surprise, SQLite's `real` storage type does include IEEE754 'infinity'. It will only appear as
  `Inf` or `-Inf` in query results; otherwise, we have to write an 'exceedingly big' number, for which
  `9e999` is conventionally used (based on StackOverflow answers; indeed, SQLite's `.dump` command will
  similarly use `9.0e+999` and `-9.0e+999` for exceedingly small or big `real`s).

* `better-sqlite3` does recognize JS `Infinity` in parametrized queries and correctly translates from and to
  SQLite's `Inf` / `9e999`. We will ignore here the amusing and bewildering fact that JS `Infinity` is
  equivalent to `2e308` which will likewise be translated to `9e999`.

* To ensure we remain within safe numerical bounds, we don't want to use numbers that exceed the range of JS
  'safe integers' (beyond safe integers, JS's IEEE754 implementation gives consecutive integers that are
  ever more sparsely distributed, so incrementing an unsafe integer `n` does not necessarily give you
  `n+1`).

* To check for numbers being not fractional, a traditional test is `n % 1 == 0`. That does work in
  JavaScript, which uses fractional modulo, but it does not work in SQLite, which uses integer modulo even
  for fractional values (meaning `select 4.5 % 1 as r` gives you `r: 0.0`). Instead we use the `cast()`
  function / operator.

Here is a minimal table with a single column that fulfills our requirements:

```sql
create table numbers (
  n real not null,
  constraint "Ωconstraint_113" check (
    ( abs( n ) = 9e999 ) or (
      ( n = cast( n as integer ) )
      and (      #{Number.MIN_SAFE_INTEGER} <= n )
      and ( n <= #{Number.MAX_SAFE_INTEGER} ) ) )
   ) strict;
```

The entire table is declared `strict`, so no type coercion shenanigans should occur. Our column `n` is
declared as `real not null` so as to include `infinity` which we would not get with a column type `integer`.
The `check` constraint accepts values with a nominal absolute magnitude of `9e999`, which accounts for
`+Infinity` and `-Infinity`. We use `cast( n as integer )` to check that the fractional part of `n` is zero.
Lastly, we check whether `n` is between the bounds for JavaScript safe integers. The above `create table`
statement uses interpolation; written out as integer literals the bounds become:

```js
Number.MIN_SAFE_INTEGER: -9007199254740991
Number.MAX_SAFE_INTEGER: +9007199254740991
```

# Linux Shell / Bash

## `find` patterns

find all files by name, matching any pattern:

```bash
find -L ~/ \( -iname '*vagrant*' -o -iname '*akreg*' -o -iname '*virtualb*' \) > ~/temp/my-files.txt
```

find all files resolving symlinks, print out as size, space, path:

```bash
find -L ~/jzr -type f -printf "%s %p\n" | less -SRN
```

# better `df`

List all drives, inlcuding unmounted:
```bash
sudo blkid -o list
```

```bash
df --block-size=1 --all --output='size,used,fstype,source,target'
lsblk --all --bytes --fs --paths
lsblk --all --bytes --fs --paths --json
lsblk --all --bytes --fs --paths --list
```

## Using `dutree`

```bash
sudo curl https://sh.rustup.rs -sSf | sh
source $HOME/.cargo/env
cargo install --git https://github.com/nachoparker/dutree.git
```

```bash
dutree --no-hidden --depth=2 --aggr=10M ~/jzr/ | less -SRN
```

## Bash Script for Cross-OS Temporary Directories

From
[`unix.stackexchange`](https://unix.stackexchange.com/questions/30091/fix-or-alternative-for-mktemp-in-os-x):

> [T]he following is what I ended up using to reliably create a temporary directory that works on both Linux
> and Darwin (Mac OS X), without hardcoding either `$TMPDIR` or `/tmp`:
>
> ```sh
> mytmpdir=$(mktemp -d 2>/dev/null || mktemp -d -t 'mytmpdir')
> ```
>
> The first part is for Linux. This command will fail on Darwin (Mac OS X) with error status code `1`
> responding with "usage: ...". That's why we ignore stderr and instead then execute the Mac variant. The
> `mytmpdir` prefix is only used on Mac (where that option is required to be set).

# NodeJS

<insert src='./inputs/avoiding-accidental-string-substitutions.md'/>
<insert src='./inputs/regex-unicode-custom-boundaries.md'/>
<insert src='./inputs/mixins.md'/>
<insert src='./inputs/reading-file-lines.md'/>
<insert src='./inputs/event-emitter-as-async-generator.md'/>
<insert src='./inputs/turning-asynchronous-functions-into-synchronous-ones.md'/>
<insert src='./inputs/context-managers.md'/>
<insert src='./inputs/step-walk-run.md'/>

## Turn ES `import` into CommonJS `require`

* https://git.cryto.net/joepie91/fix-esm.git
* https://www.npmjs.com/package/fix-esm
* https://gist.github.com/joepie91/bca2fda868c1e8b2c2caf76af7dfcad3

```coffee
require_import            = ( name ) ->   ( require 'fix-esm' ).require name
require_import_default    = ( name ) -> ( ( require 'fix-esm' ).require name ).default
path_as_url               = require_import_default 'file-url'
console.log path_as_url './foo/bar'
```

<insert src='./inputs/css.md'/>



# CoffeeScript

<insert src='./inputs/coffeescript-class-instance-properties.md'/>
<insert src='./inputs/coffeescript-callable-instances.md'/>
<insert src='./inputs/coffeescript-infinite-proxies.md'/>
<insert src='./inputs/coffeescript-instance-proxies.md'/>
<insert src='./inputs/coffeescript-programmatic-functions-with-correct-names.md'/>
<insert src='./inputs/coffeescript-pattern-matching.md'/>
<insert src='./inputs/coffeescript-commutators.md'/>

## Mixing Named ('Qualified') and Positional Arguments

```coffee
#.........................................................................................................
demo_named_and_positional = ->
  #.......................................................................................................
  f = ({ 0: x_, 1: base_, x, base, k..., }) ->
    # debug 'Ωbrbr_248', [ arguments..., ], { x, base, x_, base_, }
    x     = x_    unless x_     is undefined
    base  = base_ unless base_  is undefined
    debug 'Ωbrbr_249', { x, base, }
    return null
  #.......................................................................................................
  g = ({ Q..., }) ->
    # debug 'Ωbrbr_250', { Q, }
    x     = if Q.x    isnt undefined then Q.x     else Q[ 0 ]
    base  = if Q.base isnt undefined then Q.base  else Q[ 1 ]
    debug 'Ωbrbr_251', { x, base, }
    return null
  #.......................................................................................................
  h = ({ Q..., }) ->
    { x,
      base, } = get_pq_arguments Q, 'x', 'base'
    debug 'Ωbrbr_252', { x, base, }
    return null
  #.......................................................................................................
  coalesce = ( x, names... ) ->
    for name in names
      return R if ( R = x[ name ] ) isnt undefined
    return undefined
  #.......................................................................................................
  get_pq_arguments = ( Q, names... ) -> Object.fromEntries \
    ( [ name, ( coalesce Q, name, idx ), ] for name, idx in names )
  #.......................................................................................................
  f [ 5, 16, ]
  f { x: 5, base: 16, }
  f { x: 5, base: 16, arc: 16, bo: 11, }
  echo 'Ωbrbr_253 ———————————'
  g [ 5, 16, ]
  g { x: 5, base: 16, }
  g { x: 5, base: 16, arc: 16, bo: 11, }
  echo 'Ωbrbr_254 ———————————'
  h [ 5, 16, ]
  h { x: 5, base: 16, }
  h { x: 5, base: 16, arc: 16, bo: 11, }
  echo 'Ωbrbr_254 ———————————'
  h [ 5, ]
  h { x: 5, }
  h { x: 5, arc: 16, bo: 11, }
  return null
demo_named_and_positional()
```

## 'Private' / Hidden Class Fields in CoffeeScript

> **NOTE** To Be Written

```coffee
class SomeClass
  # this line is identical to `publicMethod: ->`
  this::publicMethod = -> '*' + privateMethod() + '*'
  privateProperty = 'foo'
  privateMethod = -> privateProperty

x = new SomeClass()
for key from GUY.props.walk_keys x, { hidden: true, symbols: true, builtins: true, }
debug '^342-1^', key
info '^343-2^', x.publicMethod()
```

* https://crimefighter.svbtle.com/using-private-methods-in-coffeescript
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields

## Preventing Accidental Unlicensed Calls

In order to keep users from accidentally using a given method, use a private symbol as one of the arguments.
That private symbol can still be exported, e.g. I've come to always include an `internals` object in the
exports and one of the exports could be a variable `magic = Symbol 'magic'`; then, I can declare a method
like `do_dangerous_internal_stuff: ( key, foo, bar, ... ) ->`, that will throw an exception when `key` isn't
`magic`.

In most cases this trick should not be really necessary when private methods are marked as such by
prepending their name with an `_` underscore. However, there's one compelling use case that actually
happened in NodeJS. When the `Buffer` class was first conceived in NodeJS, for some reason the constructor's
behavior got screwed up with the result that it was easy to pass arguments to `new Buffer ...` and get
unexpected behavior; for that reason, using the `Buffer::constructor()` method directly was deprecated in
favor of a new static `Buffer.from()` method that behaves in less surprising ways.

In such a case—when the `constructor()` method of a class should be kept private—demanding an obscure if not
unobtainable special value to unlock the method could be a nice way to ensure users don't trip up.

# Regular Expressions

## Matching Anything but not this sequence

Using negated character classes is basic RegEx Know-How. But how to avoid entire sequences or complex
patterns? Predictably, the solution lies in using a negative lookahead, butit turns out the way it's used is
not intuitive. Following the proposal made in [this top-rated SO
answer](https://stackoverflow.com/a/977294/7568091)), in order to match anything except, say, any `the`, `a`
or `an` that precedes a word boundary `\b`, the pattern should be

```reges
  /^(?:(?!\b(?:the|an?)\b).)+/
```

That's a negative lookahead containing the pattern to be avoided, `(?! AVOID )`; this is nested in a
non-capturing group `(?: ... )+` which may repeat one or more times; *behind* the negative lookahead there's
the pattern to be matched positively, in this case `.` a dot for 'any character'.

