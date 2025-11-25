

# Gaps and Islands

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
This part to be updated by running `doctoc README.md`

- [SQL](#sql)
  - [The Gaps-And-Islands Pattern](#the-gaps-and-islands-pattern)
  - [Maximum Value in Group / Biggest X in Subgroup](#maximum-value-in-group--biggest-x-in-subgroup)
  - [Find RegEx Match in a Text Array](#find-regex-match-in-a-text-array)
  - [Immutable Columns in SQL](#immutable-columns-in-sql)
    - [SOLUTION A](#solution-a)
    - [SOLUTION B](#solution-b)
  - [Using `lateral` Replacement in SQLite](#using-lateral-replacement-in-sqlite)
  - [SQLite DB with All Function Names](#sqlite-db-with-all-function-names)
  - [ESSFRI: Improving Integrity Checks in SQLite](#essfri-improving-integrity-checks-in-sqlite)
- [Linux Shell / Bash](#linux-shell--bash)
  - [`find` patterns](#find-patterns)
- [better `df`](#better-df)
  - [Using `dutree`](#using-dutree)
  - [Bash Script for Cross-OS Temporary Directories](#bash-script-for-cross-os-temporary-directories)
- [NodeJS](#nodejs)
  - [Regular Expressions: How to Avoid Accidental String Substitutions (so-called A$$es)](#regular-expressions-how-to-avoid-accidental-string-substitutions-so-called-aes)
  - [Regular Expressions: Required Reading](#regular-expressions-required-reading)
  - [Regular Expressions: How to Test For Unicode-Compliant Boundaries](#regular-expressions-how-to-test-for-unicode-compliant-boundaries)
  - [Mixins](#mixins)
  - [Reading Text Files Line by Line](#reading-text-files-line-by-line)
    - [`GUY.fs.walk_lines()`, `GUY.str.walk_lines()` and `GUY.fs.walk_buffers()`](#guyfswalk_lines-guystrwalk_lines-and-guyfswalk_buffers)
    - [The Old Way](#the-old-way)
      - [<del>Pipestreaming Solution</del>](#delpipestreaming-solutiondel)
      - [<del>Node-Readlines</del>](#delnode-readlinesdel)
      - [<del>A Better Solution: InterText SplitLines</del>](#dela-better-solution-intertext-splitlinesdel)
  - [Event Emitter as Async Generator](#event-emitter-as-async-generator)
  - [Turning Asynchronous functions into Synchronous ones](#turning-asynchronous-functions-into-synchronous-ones)
  - [Context Managers](#context-managers)
  - [An Iterative API pattern: `step()` ➺ `walk()` ➺ `run()`](#an-iterative-api-pattern-step-%E2%9E%BA-walk-%E2%9E%BA-run)
  - [Turn ES `import` into CommonJS `require`](#turn-es-import-into-commonjs-require)
- [CSS](#css)
  - [CSS Variables with User Settings, Defaults](#css-variables-with-user-settings-defaults)
- [CoffeeScript](#coffeescript)
  - [Properties with Getters and Setters for (ES6) Classes](#properties-with-getters-and-setters-for-es6-classes)
  - [Callable Instances](#callable-instances)
    - [Solution 1: Base Class on Function](#solution-1-base-class-on-function)
    - [Solution 2: Set Prototype Explicitly](#solution-2-set-prototype-explicitly)
  - [Infinite Proxies](#infinite-proxies)
  - [Instance Proxies](#instance-proxies)
  - [Programmatic Functions with Computed Names (the ƒPOD pattern)](#programmatic-functions-with-computed-names-the-%C6%92pod-pattern)
  - [Pattern Matching in Plain JavaScript (but using CoffeeScript)](#pattern-matching-in-plain-javascript-but-using-coffeescript)
    - [Pattern Matching with Pre-Computed Values](#pattern-matching-with-pre-computed-values)
  - [Another Way to Build Mixins: Commutators](#another-way-to-build-mixins-commutators)
  - [Mixing Named ('Qualified') and Positional Arguments](#mixing-named-qualified-and-positional-arguments)
  - ['Private' / Hidden Class Fields in CoffeeScript](#private--hidden-class-fields-in-coffeescript)
  - [Preventing Accidental Unlicensed Calls](#preventing-accidental-unlicensed-calls)
- [Regular Expressions](#regular-expressions)
  - [Matching Anything but not this sequence](#matching-anything-but-not-this-sequence)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# SQL

## The Gaps-And-Islands Pattern

* https://stackoverflow.com/questions/17046204/how-to-find-the-boundaries-of-groups-of-contiguous-sequential-numbers
* https://stackoverflow.com/questions/tagged/gaps-and-islands
* https://www.xaprb.com/blog/2006/03/22/find-contiguous-ranges-with-sql/

```sql

-- .progress 1000

create table sequence ( id integer not null primary key );
insert into sequence values
  (  1 ), (  2 ), (  3 ), (  4 ), (  5 ),
  (  6 ), (  7 ), (  8 ), (  9 ), ( 10 ),
  ( 11 ), ( 12 ), ( 13 ), ( 14 ), ( 15 ),
  ( 16 ), ( 17 ), ( 18 ), ( 19 ), ( 20 );

delete from sequence where id in ( 5, 11, 12, 13, 14, 7 );

-- ---------------------------------------------------------------------------------------------------------
-- thx to https://www.xaprb.com/blog/2006/03/22/find-contiguous-ranges-with-sql/
create view ranges_with_subselect as select
    L.id                          as start,
    ( select
          min( A.id ) as id
        from sequence             as A
        left outer join sequence  as B on ( A.id = B.id - 1 )
        where true
          and B.id is null
          and A.id >= L.id )      as end
  from sequence             as L
  left outer join sequence  as R on R.id = L.id - 1
  where R.id is null;


-- ---------------------------------------------------------------------------------------------------------
-- thx to https://sqlblogcasts.com/blogs/sqlandthelike/archive/2009/08/27/sql-and-contiguous-data-ranges.aspx
create view ranges_with_window as with V1 as ( select
    id,
    row_number() over ( order by id desc ) as rownum
  from sequence )
  select
    id + V1.rownum as xxx,
    min( id ) as first_id,
    max( id ) as last_id
  from V1
  group by id + V1.rownum
  order by first_id;

-- ---------------------------------------------------------------------------------------------------------
-- A solution popularized by Itzik Ben Gan is to use the fact that row_number() OVER (ORDER BY number) -
-- number remains constant within an "island" and cannot appear in multiple islands.
-- NB: If number is not guaranteed to be unique replace row_number with dense_rank.
create view ranges_ala_bengan as with t as ( select
    -- row_number() over ( order by id ) - id as group_id,
    dense_rank() over ( order by id ) - id as group_id,
    id
  from sequence )
  select
    -- group_id    as group_id,
    min( id )   as first_id,
    max( id )   as last_id
  from   t
  group by group_id
  order by first_id;

-- ---------------------------------------------------------------------------------------------------------
.print ranges_with_subselect
select * from ranges_with_subselect;
.print ranges_with_window
select * from ranges_with_window;
.print ranges_ala_bengan
select * from ranges_ala_bengan;






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



## Immutable Columns in SQL

In the generic table `datoms`, created below, we want to have a field `stamped`, default `false`, that may
be set to `true` to indicate the record is outdated and is no longer in use; apart from that, we want to
prohibit any other update to any row, including setting `stamped` to `false` again (and thereby
re-activating the record).

We achieve that in **Solution A** by adding a `before update` trigger on the table; for convenience, we have
excluded all calls to `update datoms` by adding a clause `when ( old is distinct from new )` *to the `create
trigger` statement*; in other words, the trigger function will only be called when the conditions in the
`when` clause are met.

Using this technique, it is possible to shift *all* of the logic from the trigger function to the trigger
declaration, as we have done in **Solution B**. The first two conditions,

```sql
  for each row when (
    old is distinct from new and (
      ( old.stamped = true and new.stamped = false ) or
```

do look readable enough, however, the third one,

```sql
      ( array_length( akeys( hstore( new ) - hstore( old ) - array[ 'stamped' ] ), 1 ) > 0 ) ) )
```

is much harder to understand; maybe translating it to a function call could help.

**NOTE** As convenient as `when` conditions in trigger declarations may be, observe that **`when` conditions
may not be used for tables containing generated columns**. This is because those columns are only generated
until *after* the `before` triggers have been run (i.e. generated columns operate on the result of `before`
trigger functions, which is reasonable). Therefore, to avoid later rewrites in case a generated column
should be added to a table with a trigger, it seems to be better to always put the entire logic into the
trigger function.

**NOTE** A further consequence of the last point is this: When working with tables that have generated
columns, one should pay attention to the fact that these are (as of PGv12) always implicitly generated,
always stored, and can never be set explicitly. This means that calls to `IMMUTABLE.record_has_changed()`
must *always* at least include the name of auto-generated columns because they will be present in the `old`
row but absent from the `new` row. For example, when there is one column `stamped` that may be changed and
one column `_vnr0` that is generated in a table with immutable records, the correct call will be
`IMMUTABLE.record_has_changed( old, new, '{stamped,_vnr0}' )`. With `_vnr0` omitted, the call will *always*
return that the columns have changed (because `old._vnr0` is always present and `new._vnr0` is always
absent).

**UPDATE** implemented the above as `IMMUTABLE.record_has_changed( old, new )`,
`IMMUTABLE.record_has_changed( old, new, Array[ 'except-columns' ] )` in
[InterShop](https://github.com/loveencounterflow/intershop).


### SOLUTION A

```sql
begin transaction;
drop schema if exists IMMUTABLE cascade; create schema IMMUTABLE;
set role dba;
create extension if not exists hstore;
reset role;

-- ---------------------------------------------------------------------------------------------------------
create table IMMUTABLE.datoms (
  vnr         integer[],
  key         text,
  value       jsonb,
  stamped     boolean default false,
  primary key ( vnr ) );

-- ---------------------------------------------------------------------------------------------------------
create function IMMUTABLE.on_before_update_datoms() returns trigger language plpgsql as $$
  /* thx to https://stackoverflow.com/a/23792079/7568091 for the hstore thing */
  declare
    ¶changes text[];
  begin
    -- .....................................................................................................
    if old.stamped = true and new.stamped = false then
      raise sqlstate 'IMM01' using message = format(
        'illegal to set field %s of record %s to %s', 'stamped', old, true );
      end if;
    -- .....................................................................................................
    ¶changes := akeys( hstore( new ) - hstore( old ) - array[ 'stamped' ] );
    if array_length( ¶changes, 1 ) > 0 then
      raise sqlstate 'IMM02' using message = format(
        'illegal to update fields %s of record %s', ¶changes, old );
      end if;
    return new; end; $$;

-- ---------------------------------------------------------------------------------------------------------
create trigger on_before_update_datoms before update on IMMUTABLE.datoms
  for each row when ( old is distinct from new ) execute procedure IMMUTABLE.on_before_update_datoms();

-- ---------------------------------------------------------------------------------------------------------
insert into IMMUTABLE.datoms ( vnr, key, value ) values
  ( '{1}', '^foo', '{"$value":42}' ),
  ( '{2}', '^foo', '{"$value":42}' ),
  ( '{3}', '^foo', '{"$value":42}' ),
  ( '{4}', '^foo', '{"$value":42}' );

-- ---------------------------------------------------------------------------------------------------------
do $$ begin
  begin update IMMUTABLE.datoms set key     = '^other'       where vnr = '{3}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set value   = '{"foo":true}' where vnr = '{3}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set stamped = true           where vnr = '{4}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set stamped = false          where vnr = '{3}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set stamped = false          where vnr = '{4}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  end; $$;

rollback;
```

### SOLUTION B

```sql
create function IMMUTABLE.on_before_update_datoms() returns trigger language plpgsql as $$ begin
  raise sqlstate 'IMM04' using message = format( 'illegal to update record %s', old );
    end; $$;

-- ---------------------------------------------------------------------------------------------------------
/* thx to https://stackoverflow.com/a/23792079/7568091 for the hstore thing */
create trigger on_before_update_datoms before update on IMMUTABLE.datoms
  for each row when (
    old is distinct from new and (
      ( old.stamped = true and new.stamped = false ) or
      ( array_length( akeys( hstore( new ) - hstore( old ) - array[ 'stamped' ] ), 1 ) > 0 ) ) )
  execute procedure IMMUTABLE.on_before_update_datoms();

-- ---------------------------------------------------------------------------------------------------------
insert into IMMUTABLE.datoms ( vnr, key, value ) values
  ( '{1}', '^foo', '{"$value":42}' ),
  ( '{2}', '^foo', '{"$value":42}' ),
  ( '{3}', '^foo', '{"$value":42}' ),
  ( '{4}', '^foo', '{"$value":42}' );

-- ---------------------------------------------------------------------------------------------------------
-- select * from IMMUTABLE.datoms order by vnr;
do $$ begin
  begin update IMMUTABLE.datoms set key     = '^other'       where vnr = '{3}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set value   = '{"foo":true}' where vnr = '{3}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set stamped = true           where vnr = '{4}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set stamped = false          where vnr = '{3}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  begin update IMMUTABLE.datoms set stamped = false          where vnr = '{4}'; exception when others then raise notice '*error* (%) %', sqlstate, sqlerrm; end;
  end; $$;

select * from IMMUTABLE.datoms order by vnr;


rollback;
```







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


## Regular Expressions: How to Avoid Accidental String Substitutions (so-called A$$es)

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


## Mixins

* Thx to https://alligator.io/js/class-composition/
* Write mixins as functions that take an optional `clasz` argument which defaults to `Object` (or a custom
  `Base` class).
* Extend the top level class from a call chain of the mixins.
* In CoffeeScript, one can omit the braces for all calls except the final one.
* Can also write `class Main extends B_mixin A_mixin Object` instead of `class Main extends B_mixin
  A_mixin()`, The advantage being that the presence of `Object` gives a hint about the directionality of
  mixin application (important in the case of shadowing).

```coffee

#-----------------------------------------------------------------------------------------------------------
A_mixin = ( clasz = Object ) => class extends clasz
  constructor: ->
    super()
    # help '^343-1^', known_names = new Set ( k for k of @ )
    @a_mixin  = true
    @name     = 'a_mixin'

  introduce_yourself: -> urge "helo from class #{@name}"

#-----------------------------------------------------------------------------------------------------------
B_mixin = ( clasz = Object ) => class extends clasz
  constructor: ->
    super()
    # help '^343-2^', known_names = new Set ( k for k of @ )
    @b_mixin  = true
    @name     = 'b_mixin'


#-----------------------------------------------------------------------------------------------------------
class Main extends B_mixin A_mixin()
  constructor: ->
    super()
    @main     = true
    @name     = 'main'


############################################################################################################
if module is require.main then do =>
  d = new Main()
  d.introduce_yourself()

  # helo from class main

```



## Reading Text Files Line by Line

Reading a text file in a linewise fashion is a basic task, yet surprisingly hard to accomplish in NodeJS.
There's a package [`n-readlines`](https://github.com/nacholibre/node-readlines) which I used to use for some
years; however, when I wanted to fix an issue and had a look at the source code, I found it overly
convoluted and not easy to fix so naturally, I ended up re-inventing the wheel and wrote an entire family of
methods:

* **`GUY.fs.walk_buffers()`**
* **`GUY.fs.walk_buffers_with_positions()`**

* **`GUY.fs.walk_lines()`**
* **`GUY.fs.walk_lines_with_positions()`**

* **`GUY.str.walk_lines()`**
* **`GUY.str.walk_lines_with_positions()`**

Methods `walk_buffers()` and `walk_buffers_with_positions()` are the most basic; the latter just walks over
chunks of a given file, `yield`ing buffers along with a running bytecount. `fs.walk_lines_with_positions()`
uses these chunks and looks for occurrences of newline characters; these are ATM not configurable but do
include the ones that are or were common on Linux, Windows, and old MacOS; the algorithm has been carefully
adjusted to yield *exactly* the lines that many modern text editors (on Linux) recognize (when one looks
closer, there are some discrepancies with command line tools and e.g. Windows Notepad's behavior, so even
this basic task is, in fact, not [universally](https://xkcd.com/927/)
[standardized](https://www.explainxkcd.com/wiki/index.php/927:_Standards))

<figure>
  <img src="artwork/standards_2x.png" alt="how standards proliferate">
  <figcaption>*Fortunately, the charging one has been solved now that we've all standardized on mini-USB. Or is it micro-USB? Shit.*</figcaption>
</figure>

The objects `yield`ed by `fs.walk_lines_with_positions()` include 1-based line numbers and the one or two
characters that were recognized as line endings; it is possible to transparently trim trailing whitespace
from lines. These properties make the `GUY.*.walk_lines*()` family of methods a quite appropriate foundation
for tasks like lexing files, If I [may say so myself]().

The below is an excerpt of the [original Guy documentation, *🛠 A Guy of Many Trades
🛠*](https://github.com/loveencounterflow/guy#guyfswalk_lines-guystrwalk_lines-and-guyfswalk_buffers):

------------------------------------------------------------------------------------------------------------

### `GUY.fs.walk_lines()`, `GUY.str.walk_lines()` and `GUY.fs.walk_buffers()`

* **`GUY.fs.walk_lines = ( path, cfg ) ->`**—Given a `path`, return a *synchronous* iterator over file
  lines. This is the most hassle-free approach to synchronously obtain lines of text files in NodeJS that
  I'm aware of, yet. The optional `cfg` argument may be an object with a single property `decode`; when set
  to `false`, `walk_lines()` will iterate over buffers instead of strings.

  **Behavior regarding terminal newline characters**: The following invariant shall hold:

  ```coffee
  FS            = require 'node:fs'
  file_content  = FS.readFileSync path, { encoding: 'utf-8', }
  lines_1       = file_content.split '\n'
  lines_2       = [ ( GUY.fs.walk_lines path )..., ]
  ( JSON.stringify lines_1 ) == ( JSON.stringify lines_2 )
  ```

  In other words, the lines iterated over by `GUY.fs.walk_lines()` are the same lines as would be obtained
  by splitting the file content using `String::split()`, meaning that
    * newline characters right before the end-of-file (EOF) will generate an additional, empty line (because
      `( '\n' ).split /\r\n|\r|\n/` gives `[ '', '', ]`)
    * an empty file will generate a single empty string (because `( '' ).split '\n'` gives `[ '', ]`)
    * observe that the line counts reported by the Posix tool `wc` when used with the `--lines` option will
      often disagree with those obtained with `GUY.fs.walk_lines()` (or wplitting with `/\r\n|\r|\n/`).
      However, this should not be a cause for concern because a file containing the text `1\n2\n3` will be
      reported as having 2 lines by `wc`, and one will be hard pressed to find people who'd defend that
      design decision, or a text editor which will not show digits `1` to `3` on three separate lines
      numbered 1, 2, and 3.

* The newline character sequences recognized by `GUY.fs.walk_lines()` are
  * `\r` = U+000d Carriage Return (CR) (ancient Macs)
  * `\n` = U+000a Line Feed (LF) (Unix, Linux)
  * `\r\n` = U+000d U+00a0 Carriage Return followed by Line Feed (CRLF) (Windows)
  * i.e. a file containing only the characters `\r\r\n\r\n\n\n` will be parsed as `\r`, `\r\n`, `\r\n`,
    `\n`, `\n`, that is, as six empty lines, as two of the line feeds are pre-empted by the preceding
    carriage returns. This behavior is consistent with the text of the file being split as
    `'\r\r\n\r\n\n\n'.split /\r\n|\r|\n/`, which gives `[ '', '', '', '', '', '' ]`. This is, incidentally,
    also what `pico` and Sublime Text 4 (on Linux) and [Textpad
    8.15](https://www.textpad.com/download#TextPad8151) (on Wine under Linux) show, although Notepad (on
    Wine under Linux) thinks the file in question has only 5 lines.
* `GUY.str.walk_lines()` behaves like `GUY.fs.walk_lines()`, although it does not yield buffers (yet) amd
  has no way to set the chunk size
* both `GUY.str.walk_lines()` and `GUY.fs.walk_lines()` will return right-trimmed lines (i.e. remove
  whitespace from the end of the string) unless a setting `trim: false` is included as the second argument
  to the method (as in, `walk_lines path, { trim: false, }`). With `GUY.fs.walk_lines()`, trimming is only
  available if lines are decoded, so when one calls `walk_lines path, { trim: false, encoding: null, }` to
  get buffers, those will not be trimmed.

* **`GUY.fs.walk_buffers = ( path, cfg ) ->`**—Given a `path`, return a *synchronous* iterator over buffers
  representing the file contents, the invariant being that the concatenation of the buffers compares equal
  to reading the entire file in a single go:

  ```coffee
  ( Buffer.compare ( Buffer.concat [ ( GUY.fs.walk_buffers path )..., ] ), ( FS.readFileSync path ) ) == 0
  ```

  Where deemed necessary, `cfg.chunk_size` can be set to an arbitrary integer greater than 0 (default: 16
  KiB).

* **`GUY.fs.walk_lines_with_positions = ( path, cfg ) ->`**—Same as `GUY.fs.walk_lines()`, but yields
  objects of the shape `{ lnr, line, eol, }` where `lnr` is the 1-based line number, `line` is the (by
  default, when not requesting buffers) trimmed 'material' of the line (identical to what the `walk_lines()`
  methods yield), and `eol` represents the bytes or characters that were recognized as the line ending.
  `eol` may be a single `CR` (`\r`, U+000d), a single `LF` (`\n`, U+000a; standard on Linux), a two-byte
  `CRLF` (`\r\n`, standard on Windows), or an empty string or buffer (the latter only at the end of a string
  or file). None of these attributes will ever be `null`, so one can always reconstruct the entire file
  complete with positions indicated by line numbers, line-local or file-global [UTF-16 code unit
  indexes](https://mathiasbynens.be/notes/javascript-encoding), code point indexes or byte offsets, as seen
  appropriate.

* **`GUY.fs.walk_buffers_with_positions = ( path, cfg ) ->`**—Same as `GUY.fs.walk_buffers()`, but yields
  objects of the shape `{ buffer, byte_idx, }` where `byte_idx` is the 0-based byte index into the
  respective file.


------------------------------------------------------------------------------------------------------------

### The Old Way

<del>There are two good solutions:</del>


#### <del>Pipestreaming Solution</del>

<del>

Using basic [PipeStreams](https://github.com/loveencounterflow/pipestreams), the more fully-featured
[PipeDreams](https://github.com/loveencounterflow/pipedreams), or their successor (and WIP)
[SteamPipes](https://github.com/loveencounterflow/steampipes), a pipeline can be built with a file reader as
source, followed by a `$split()` transform.

The drawback here is that currently, there is no solution to do this synchronously, and, because
the lines of text become only available within stream transforms, it is not possible to build
an iterator. ATM it is not quite clear to me whether building iterators on top of a pipestreaming
solution is possible at all.

</del>

#### <del>Node-Readlines</del>

<del>

Luckily there's the [n-readlines](https://github.com/nacholibre/node-readlines) package. From the blurb:

> Reading file line by line may seem like a trivial problem, but in node, there is no straightforward way to
> do it. There are a lot of libraries using Transform Streams to achieve it, but it seems like a overkill,
> so I've wrote simple version using only the filesystem module of node. Note that this is synchronous
> library.

Usage is simple:

```coffee
@walk_lines = ( path ) ->
  Readlines = require 'n-readlines'
  liner     = new Readlines path
  while line = liner.next()
    # observe `line` is always a `Buffer`
    yield line.toString()
  return null
```

</del>

#### <del>A Better Solution: InterText SplitLines</del>

<del>

A 'better', that is, as-fast-but-more-flexible solution is implemented in
`src/read-undecoded-lines-from-stdin.coffee`. It uses `intertext-splitlines` to look for occurrences
of `\x0a` bytes in the `stdin` stream, which is accessed with event handlers. In this sample, we do a bit
of data processing as my problem at hand was to produce PostgreSQL `bytea` hexadecimal literals. The
program reads from `stdin` and writes to `stdout`, so one can use it as e.g.

```bash
time ( cat myinputdata.txt | node lib/read-undecoded-lines-from-stdin.js > /tmp/anything.txt )
```

```coffee
use_itxt_splitlines = -> new Promise ( resolve, reject ) =>
  SL              = require 'intertext-splitlines'
  { stdin
    stdout }      = process
  settings        = { decode: false, keep_newlines: false, }
  as_hex_literal  = ( buffer ) -> '\\x' + ( buffer.toString 'hex' )
  ctx             = SL.new_context settings
  lnr             = 0
  #.........................................................................................................
  stdin.on 'data', ( d ) ->
    for line from SL.walk_lines ctx, d
      lnr++
      stdout.write ( "\"dsk\",#{lnr}," ) + ( as_hex_literal line ) + '\n'
  #.........................................................................................................
  await process.stdin.once 'end', ->
    for line from SL.flush ctx
      lnr++
      stdout.write ( "\"dsk\",#{lnr}," ) + ( as_hex_literal line ) + '\n'
      resolve()
  #.........................................................................................................
  return null
```

</del>


## Event Emitter as Async Generator

In (blob/master/src/event-emitter-as-async-generator/main.coffee)[event-emitter-as-async-generator], we
demonstrate how to turn a NodeJS `EventEmitter` into an asynchronous iterator. The solution is based on
StackOverflow user [mpen](https://stackoverflow.com/users/65387/mpen)'s
[suggestion](https://stackoverflow.com/a/59347615/7568091) how to do such a thing, and the idea has been
turned into a NodeJS module, [JfEE](https://github.com/loveencounterflow/jfee); this, in turn, has made the
implementation of SteamPipes' `source_from_child_process()` possible.



## Turning Asynchronous functions into Synchronous ones


See
  * [*A future for SQL on the web*](https://lobste.rs/s/1ylnel/future_for_sql_on_web)
  * [*A future for SQL on the web* by James Long (August 12, 2021)](https://jlongster.com/future-sql-web)

> The biggest problem is when sqlite does a read or write, the API is totally synchronous because it’s based
> on the C API. Accessing IndexedDB is always async, so how do we get around that?
>
> We spawn a worker process and give it a SharedArrayBuffer and then use the
> [`Atomics`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) API
> to communicate via the buffer. For example, our backend writes a read request into the shared buffer, and
> the worker reads it, performs the read async, and then writes the result back.
>
> I wrote a small [channel
> abstraction](https://github.com/jlongster/absurd-sql/blob/master/src/indexeddb/shared-channel.js) to send
> different types of data across a SharedArrayBuffer.
>
> The real magic is the
> [`Atomics.wait`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait)
> API. It’s a beautiful thing. When you call it, it completely blocks JS until the condition is met. You use
> it to wait on some data in the SharedArrayBuffer, and this is what enables us to turn the async read/write
> into a sync one. The backend calls it to wait on the result from the worker and blocks until it’s
> done.—[*A future for SQL on the web* by James Long (August 12,
> 2021)](https://jlongster.com/future-sql-web)

Unfortunately it turns out that the `Atomics` API is quite hard to use by itself.

> [Lin
> Clark](https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/)
> says so. See [*A cartoon intro to SharedArrayBuffers Articles* by Lin Clark (June
> 2017)](https://hacks.mozilla.org/category/code-cartoons/a-cartoon-intro-to-sharedarraybuffers/) for a
> thorough discussion.
>
> For a shorter yet very readable intro to `Atomics.wait()` and friends, see [*Shared memory - a brief
> tutorial*](https://github.com/tc39/ecmascript_sharedmem/blob/master/TUTORIAL.md).

In
[`hengist/async-to-sync-with-atomics-wait`](https://github.com/loveencounterflow/hengist/blob/master/dev/snippets/src/async-to-sync-with-atomics-wait.coffee)
I tried to get a working solution but didn't quite succeed.

What *did* work immediately is [`abbr/deasync`](https://github.com/abbr/deasync); here's a code sample:

```coffee
#-----------------------------------------------------------------------------------------------------------
demo_deasync_2 = ->
  after                 = ( dts, f ) -> setTimeout  f, dts * 1000
  deasync_callbackable  = require 'deasync'
  #.........................................................................................................
  deasync_awaitable = ( fn_with_promise ) ->
    return deasync_callbackable ( handler ) =>
      result = await fn_with_promise()
      handler null, result
      return null
  #.........................................................................................................
  frob_async = -> new Promise ( resolve ) =>
    after 1, -> warn '^455-1^', "frob_async done"; resolve()
  #.........................................................................................................
  frob_sync = deasync_awaitable frob_async
  frob_sync()
  info '^455-3^', "call to frob_sync done"
  return null


############################################################################################################
if module is require.main then do =>
  demo_deasync_2()
  urge '^803-1^', "demo_deasync_2 done"
```

On its own, `deasync` will only accept async functions that keep to the NodeJS custom of making async
functions accept a callback function as last argument that will call the callback with an optional error
first and result value last. It is straightforward to convert `Promise`-based functions to that style, so
that's what I did above. Note the output of the above is

```
^455-1^ frob_async done
^455-3^ call to frob_sync done
^803-1^ demo_deasync_2 done
```

which means that indeed although `frob_async()` uses `setTimeout()`, it can be called (in its wrapped
incarnation) without an explicit callback or `await` and still behave like a synchronous function.





## Context Managers

Context managers are well known from [Python](https://docs.python.org/3/library/contextlib.html) and are
used to ensure that a given piece of code is always run with certain pre- and post-conditions fulfilled and
may also define their own error handling.

While JavaScript does not have syntactic support for context managers (à la `with cxm( 'foo' ) as frob:
...`), it's still straightforward to implement them as plain functions. ICQL-DBA currently offers three
context managers: `dba.with_transaction()`, `dba.with_unsafe_mode()`, and `dba.with_foreign_keys_off()`. All
three allow to pass in any number of custom arguments and a required named or anonymous function that must
come last.

Here's an example from the [ICQL-DBA](https://github.com/loveencounterflow/icql-dba) package:

```coffee
class Dba
  #-----------------------------------------------------------------------------------------
  with_foreign_keys_off: ( P..., f ) ->
    #.......................................................................................
    # Precoditions:
    @types.validate.function f                              # validate arguments
    prv_in_foreign_keys_state = @_get_foreign_keys_state()  # remember previous state
    @_set_foreign_keys_state false                          # set state
    #.......................................................................................
    try                                                     # ensure we catch errors
      R = f P...                                            # call f with RTAs
    #.......................................................................................
    finally                                                 # ensure this code always runs
      @_set_foreign_keys_state prv_in_foreign_keys_state    # re-set previous state
    #.......................................................................................
    return R
```

(Stupid) usage example: create two tables `a`, `b` with an integer field that references the integer field
in the other table; this ensures that both tables must have the exact same rows at all times. As it stands,
it also prohibits the user from *inserting* any rows because no matter which table you insert a row into,
that integer will not yet be in the other table. This kind of mutual dependency is fairly common in
relational DBs, which is why you can disable foreign keys checks. But of course, when inserts have been
accomplished, one will want to ensure that foreign keys are checked for again. A context manager is a good
fit for this situation:

```coffee
dba   = new Dba()
dba.execute SQL"""
  create table a ( n integer not null primary key references b ( n ) );
  create table b ( n integer not null primary key references a ( n ) );
  """
#.......................................................................................................
dba.with_foreign_keys_off ->
  dba.execute SQL"insert into a ( n ) values ( 1 );"
  dba.execute SQL"insert into a ( n ) values ( 2 );"
  dba.execute SQL"insert into a ( n ) values ( 3 );"
  dba.execute SQL"insert into b ( n ) values ( 1 );"
  dba.execute SQL"insert into b ( n ) values ( 2 );"
  dba.execute SQL"insert into b ( n ) values ( 3 );"
```






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

# CSS

## CSS Variables with User Settings, Defaults

CSS variables (a.k.a. 'custom properties') can be set by declaring them like any other
CSS property:


```css
:root {
  --xy-border-width:      1mm;
  }
```

They can then be referenced using the `var()` construct. Inside the parentheses of `var()`, there are two
fields, the first being the name of a custom property, and the second a literal fallback value. The fallback
can, in turn, reference *another* variable but only if it is written itself as a `var()` reference.

When more than one declarations of the same variable are applicable, then the most recent one will win
(assuming their specificity is the same). This is usually the desired behavior. However, in a website where
you want to load a stylesheet upfront that contains variable declarations filled out by the user, such that
those values can be used throughout the components of the site, one would prefer to have a way to set
default values within components that will be overridden by user settings *where present*. In an imperative
language, we might be able to express 'set x to this default value unless it has already been set to a value
before' by something like

```coffee
x = x ? 42
```

where `x ? y` evaluates to the value left of the `?` existential operator when `x` is bound to any value
other than the base value, and to the value right of the operator otherwise. Some languages taht lack an
existential operator might need you to write a full `if` / `then` / `else` statement; on the other hand, there are
languages that offer

```coffee
x ?= 42
```

or else

```js
x == null ? 42 : x;
```

which are just variations on the theme. Unfortunately, CSS does not have any of these constructs, so one
would hope that a construct like `property-x: var(--some-variable, default value)` which *does* allow
fallbacks in property-value binding declarations would help. However, the catch with that is that **the CSS
`var()` construct does not allow to reference the *same* variable on the left-hand side and on the
right-hand side**, so this is not allowed:

```css
/* in `variables.css`: */
:root { --xy-border-width: 1mm; }

/* in `component-xy.css`: */
:root { --xy-border-width: var(--xy-border-width, 2mm); }
.xy   { border-width: var(--xy-border-width); }

```

If this worked, its meaning would be: 'use a default `border-width` of `2mm` for component `xy`, but just in
case it has not already been set to a value at that point'.

One way to circumvent this restriction is to avoid using user-configurable CSS variable names in your styles
and, instead, use a variant formed by adding a prefix or suffix, such as `CFG`:

```css
/* in `variables.css`: */
:root { --xy-border-width: 1mm; }

/* in `component-xy.css`: */
:root { --xy-border-width-CFG: var(--xy-border-width, 2mm); }
.xy   { border-width: var(--xy-border-width-CFG); }
```

This way, we avoid using the left-hand name on the right-hand side in `--xy-border-width-CFG:
var(--xy-border-width, 2mm)` but do get a chance to declare a default value, everything in a single,
manageable line of CSS. One good thing one could say about this pattern is that we now have an obvious way
to search all the spots in our styles where user-configurable variables are used, and what their names are.





# CoffeeScript




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




## Callable Instances

Sometimes it is desirable to create function-like, callable objects from a class declaration.

### Solution 1: Base Class on Function

In JavaScript, it is possible to declare a class that extends `Function()`:

```coffee
#===========================================================================================================
class Fn extends Function

  #---------------------------------------------------------------------------------------------------------
  @class_method: ( self ) ->
    self._me.prop_11 = 'prop_11'
    return null

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    ### Call the `Function` prototype ###
    super '...P', 'return this._me.do(...P)'
    ### Define `@_me` as the bound version of `this`: ###
    @_me = @bind @
    ### Confusingly, instance attributes like `@_me.prop_7` must be tacked onto `@_me` *here*, but the
    `this` value within methods is `@_me`, so they refer to the *same* attribute as `@_me.prop_7`: ###
    guy.props.def @_me, 'prop_6', enumerable: true, value: 'prop_6'
    @_me.prop_7 =                                          'prop_7'
    @constructor.class_method @
    return @_me

  #---------------------------------------------------------------------------------------------------------
  do: ( a = 0, b = 0, c = 0 ) ->
    debug '^8-1^', @
    help '^8-2^', @prop_6
    help '^8-3^', @prop_7
    help '^8-4^', @prop_11
    help '^8-4^', @_me ### undefined ###
    return a + b + c

  #---------------------------------------------------------------------------------------------------------
  other_method: ->
    urge '^8-5^', @
    urge '^8-6^', @prop_6
    urge '^8-7^', @prop_7
    urge '^8-8^', @prop_11
    help '^8-4^', @_me ### undefined ###
    return null

#-----------------------------------------------------------------------------------------------------------
test = ->
  fn = new Fn()
  info '^8-9^', fn
  info '^8-10^', fn.prop_6
  info '^8-11^', fn.prop_7
  info '^8-12^', fn.prop_11
  info '^8-13^', fn 3, 4, 5
  info '^8-14^', fn.do 3, 4, 5
  info '^8-15^', fn.other_method()
  info '^8-15^', fn._me ### undefined ###
  return null
```

Note that because we return `@_me` (instead of `undefined` or `@`) from the `Fn::constructor()`, the
`this`/`@` value seen inside the constructor differs from the one seen from the outside of it. Consequently,
instance attributes must be attached to `@_me` in the constructor, while the `this` value available from
methods is this very `@_me`, and so attributes from that point of view *can* be accessed derictly through
`this`/`@`.

* originally thx to https://stackoverflow.com/a/40878674/256361
* also see https://hackernoon.com/creating-callable-objects-in-javascript-d21l3te1


### Solution 2: Set Prototype Explicitly


```coffee
class Type

  constructor: ( callable ) ->
    Object.setPrototypeOf callable, @
    return callable
```

<!-- coffeescript-infinite-proxies.md -->

## Infinite Proxies

* A **proxy**, of course, is a device to capture / manage / deflect / instrument access to a specific, some
  or all properties of a given object;

* an **infinite proxy** (or, more precisely, an **infinite-chain proxy**) is a proxy that allows building
  arbitrarily deep 'ad hoc' chains of properties on a managed object.

* Below we show a partial implementation for a proxy inspired by
  [`webdiscus/ansis`](https://github.com/webdiscus/ansis), a CLI color library that enables users to write,
  say, `console.log ansis.bold.underline.red "warning"`; here, `ansis` would be our proxied `base` object (a
  function), and `.bold.underline.red()` is a chain of properties that describe the desired style of output
  to apply to the text which forms the argument of the call.

* `webdiscus/ansis` also enables stuff like `ansis.underlin.hex('#5afb33').underline"text"` which we will
  not discuss here.

* The proxy as shown below uses a state variable `stack` to record all property accesses on the proxy.

* The proxy returns (essentially) itself (i.e. property access on this proxy returns the same proxy).

* Since the 'target' (viewpoint of the proxy)—respectively, the 'base' (viewpoint of the user)—is a
  function, the property chain can be ended at any point and arguments to a function call can be added, so
  `p.bold.red 'x'` accesses `bold` (stack is `[ 'bold', ]`), then `red` (stack is `[ 'bold', 'red', ]`), and
  finally calls the base with argument `'x'`.

* The base function is to be provided by the user according to intended purposes; it can handle the stack
  as seen fit. A more complete implementation would probably provide the stack as additional argument or
  make it accessible by similar means.

* The base shown in this demo will pop all names from the stack; in a real world application it could then
  interpolate ANSI codes to implement the desired styles. In the demo, we just report the stacked names in
  the output.

```coffee
#===========================================================================================================
demo_proxy = ->
  stack     = []
  get_proxy = Symbol 'get_proxy'
  #.........................................................................................................
  template =
    base:                     null
    is_initial:               true
    empty_stack_on_new_chain: true
  #.........................................................................................................
  new_infiniproxy = nfa { template, }, ( base, is_initial, cfg ) ->
    is_initial = false unless cfg.empty_stack_on_new_chain
    proxy = new Proxy base,
      get: ( target, key ) ->
        return new_infiniproxy { base, is_initial: false, } if key is get_proxy
        return target[ key ] if ( typeof key ) is 'symbol'
        stack.length = 0 if is_initial
        stack.push key
        return R
    if is_initial then  R = new_infiniproxy { base, is_initial: false, }
    else                R = proxy
    return proxy
  #.........................................................................................................
  base = ( P... ) ->
    R = "#{stack.join '.'}::#{rpr P}"
    stack.length = 0
    return R
  #.........................................................................................................
  ### These calls will be `stack`ed but then get thrown away as soon as any property of `p` is used: ###
  do =>
    echo '——————————————————————————————————————————————————————————————————————————————'
    p = new_infiniproxy base, { empty_stack_on_new_chain: true } ### default ###
    p.ooops;  debug 'Ω___1', stack
    p.wat;    debug 'Ω___2', stack
    p.nö;     debug 'Ω___3', stack
    info 'Ω___4', p.more_of_this"some text"
    debug 'Ω___5', stack
    return null
  #.........................................................................................................
  ### These calls will be `stack`ed and remain on the stack until `p` is called: ###
  do =>
    echo '——————————————————————————————————————————————————————————————————————————————'
    p = new_infiniproxy base, { empty_stack_on_new_chain: false } ### opt-in ###
    p.ooops;  debug 'Ω___6', stack
    p.wat;    debug 'Ω___7', stack
    p.nö;     debug 'Ω___8', stack
    info 'Ω___9', p.more_of_this"some text"
    debug 'Ω__10', stack
    return null
  #.........................................................................................................
  do =>
    echo '——————————————————————————————————————————————————————————————————————————————'
    p = new_infiniproxy base
    info 'Ω__11', p.red.bold.underline"some text"
    ### Some random property retrievals without call... ###
    p.bold.underline
    p.strikethrough.inverse
    ### ...won't influence the meaning of the next property chain: ###
    info 'Ω__12', p.yellow"finally, a call"
    ### But if needed, can always reference a proxy from an intermediate result and build a property chain
    on that; here we used a special unique value `get_proxy` that produces an intermediate result *without*
    adding it to the property chain: ###
    proxy = p[ get_proxy ]
    ### Imagine we go through some branching if/then clauses to decide whether to add some styles: ###
    proxy.bold.underline
    proxy.strikethrough
    proxy.inverse
    proxy.yellow
    ### Finally, we're ready to print: ###
    info 'Ω__13', proxy"this will be printed in bold + underline + strikethrough + inverse + yellow"
    return null
  return null
```

---------------------------------


> **Note** OT but the example uses `nfa { template, }, ( base, is_initial, cfg ) ->` to declare the
> signature of `new_infiniproxy()`; 'NFA' stands for **N**ormalize **F**unction **A**rguments and is
> available (also on NPM) as
> [`loveencounterflow/normalize-function-arguments`](https://github.com/loveencounterflow/normalize-function-arguments);
> the effect of `fn = nfa { template, } ( a, b, cfg ) ->` is that `fn()` can now be called as `fn x1`, `fn
> x1, x2` or `fn x1, x2, { x3: 'other value', y: ..., z: ..., }` and `nfa` will take care that the
> positional arguments and the named values in the `cfg` object will always be consistent (`x1 === cfg.x1`
> and so on), among other things.



<!-- coffeescript-infinite-proxies.md -->

## Instance Proxies

* Below we show a `class D` whose instances will *only* have properties that are managed by a proxy.

* The line `return target[ key ] if ( typeof key ) is 'symbol'` is there to ensure that all of JS's internal
  lookups that use symbols are redirected to the proper property owner. 

* The line `return Reflect.get target, key if Reflect.has target, key` falls back to using the proxy
  target's existing properties where a given property exists; all unknown property keys are countered with 
  a message string. In both cases, additional behavior could be implemented. 

* Trying to set the prototype of the return value (e.g. with `Object.setPrototypeOf R, @`) is not needed and
  indeed results in `TypeError: Cyclic __proto__ value`; as the debugging line marked `Ω___6` shows, the
  instance `d` is indeed an instance of `D`.


```coffee
#-----------------------------------------------------------------------------------------------------------
class D
  #.........................................................................................................
  constructor: ->
    @other_prop = 'OTHER_PROP'
    R = new Proxy @,
      get: ( target, key ) ->
        return target[ key ] if ( typeof key ) is 'symbol'
        return Reflect.get target, key if Reflect.has target, key
        return "something else: #{rpr key}"
    return R
  #.........................................................................................................
  method_of_d: -> 'METHOD_OF_D'
  property_of_d: 'PROPERTY_OF_D'
#...........................................................................................................
d = new D()
debug 'Ω___1', d                # D { other_prop: 'OTHER_PROP' }
debug 'Ω___2', d.other_prop     # OTHER_PROP
debug 'Ω___3', d.method_of_d()  # METHOD_OF_D
debug 'Ω___4', d.property_of_d  # PROPERTY_OF_D
debug 'Ω___5', d.unknown_key    # something else: 'unknown_key'
debug 'Ω___6', d instanceof D   # true
```


## Programmatic Functions with Computed Names (the ƒPOD pattern)

> **Note** Always read the docs first! As pointed out by [the fine
> Manual](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name),
> "[t]he `name` property (of functions) is read-only and cannot be changed by the assignment operator [; t]o
> change it, use
> [`Object.defineProperty()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)."
> Ergo:
>
> ```coffee
> # create function in any way; name is inferred from lexical situation:
> f   = ( x ) -> x ** 2                                           # [Function: f]
>
> # optionally, bind it to an object; observe changed name in bound copy:
> ref = {}
> f   = f.bind ref                                                # [Function: bound f]
>
> # set name explicitly:
> Object.defineProperty f, 'name', { value: 'super name!!!', }    # [Function: super name!!!]
> ```
>
> **The solution outlined below is less flexible and syntactically less parsimonious, but maybe still
> interesting to see that JavaScript engines these days do consider computed keys when inferring a
> functions's name. Other than that, you'll probably want to use the simpler solution shown above.**


* Problem: sometimes one wants to produce functions in a programmatic way. Often, one then returns an
  anonymous function. Silly example in `get_beautified_calculator_1()`:

```coffee
log = console.log

get_beautified_calculator_1 = ( f ) ->
  return ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'

get_beautified_calculator_2 = ( f ) ->
  return beautified = ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'

add = ( a, b ) -> a + b

add_beauty_1 = get_beautified_calculator_1 add
add_beauty_2 = get_beautified_calculator_2 add
log get_beautified_calculator_1   # [Function: get_beautified_calculator_1]   — 💚 OK
log get_beautified_calculator_2   # [Function: get_beautified_calculator_2]   — 💚 OK
log add                           # [Function: add]                           — 💚 OK
log add_beauty_1                  # [Function (anonymous)]                    — ❌ not OK
log add_beauty_2                  # [Function: beautified]                    — ❌ not OK
```

* When one then prints that returned function to the console, the output will just say `[Function
  (anonymous)]` which tells you pretty much nothing; it's worse in error messages: *The error occurred in
    any of your many anonymous functions*.

* One can in a one-liner fashion prepend the function with an assignment to a throw-away local variable.
  Modern JS engines have for a decade or so now learned to pick up that name and tack it unto the function.
  In the above example, that's what we do in `get_beautified_calculator_2()` where our custom-built function
  is now called `beautified`. Much better.

* But—*all* functions returned by `get_beautified_calculator_2()` will be uniformly called `beautified`.
  Often, that's still not ideal.

* We would seemingly have to generate some JS source code and evaluate that to get our function named for
  the simple reason that we need an identifier on the LHS of the assignment. Needless to say, such a
  solution would be overkill, brittle and probably also create some kind of attack surface.

* Fortunately, there's a pretty straightforward way to **create functions with custom names**. Watch this:

```coffee
log { x: 42, }                # { x: 42 }
log { f: ( -> ), }            # { f: [Function: f] }     — ❢ function picks up name `f`

my_name = 'wow'

log { "#{my_name}": 42, }     # { wow: 42 }              — ❢❢ can use computed keys
log { "#{my_name}": ( -> ), } # { wow: [Function: wow] } — ❢❢❢ function picks up computed name
```

* And that's our solution—we just have to construct and object with a computed key and the new function as
  value, then retrieve that property from the object and return it, as in `get_beautified_calculator_3()`:

```coffee
get_beautified_calculator_3 = ( name, f ) ->
  return { "#{name}": ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'
  }[ name ]

get_beautified_calculator_4 = ( f ) ->
  name = "beautified_#{f.name}"
  return { "#{name}": ( a, b ) ->
    return '⁂' + ( f a, b ).toString() + '⁂'
  }[ name ]

add = ( a, b ) -> a + b

add_beauty_3 = get_beautified_calculator_3 'a beautified add function', add
add_beauty_4 = get_beautified_calculator_4 add
log add_beauty_3              # 💚💚💚 [Function: a beautified add function] 💚💚💚
log add_beauty_4              # 💚💚💚 [Function: beautified_add]            💚💚💚
```

* Observe that any sequence of characters will work in this solution—the function's name is purely for
  internal reference. Most of the time one will probably want something more practical; for example we could
  have computed the name of the returned function as shown in `get_beautified_calculator_4()`.

* For the JS-only folks who have reached this point, here's what the same looks like in JavaScript:

```js
get_beautified_calculator_4 = function(f) {
  var name;
  name = `beautified_${f.name}`;
  return {
    [`${name}`]: function(a, b) {
      return '⁂' + (f(a, b)).toString() + '⁂'; }
  }[name]; };
```

* call it the ƒPOD pattern ('eff-pod'; ƒ for *function*, POD for *plain old dictionary*)





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





## Another Way to Build Mixins: Commutators 

```coffee
#===========================================================================================================
demo_commutator = ->
  class TMP_no_such_key_error extends Error
  misfit = Symbol 'misfit'
  #===========================================================================================================
  class Commutator

    #---------------------------------------------------------------------------------------------------------
    constructor: ->
      @bearers  = []
      @cache    = new Map()
      return undefined

    #---------------------------------------------------------------------------------------------------------
    add_bearer: ( x ) -> @bearers.unshift x; return null

    #---------------------------------------------------------------------------------------------------------
    get: ( key, fallback = misfit ) ->
      return R if ( R = @cache.get key )?
      for bearer in @bearers
        continue unless Reflect.has bearer, key
        @cache.set key, R = { bearer, value: bearer[ key ], }
        return R
      return fallback unless fallback is misfit
      throw new TMP_no_such_key_error "Ω__31 unknown key #{rpr key}"

  #===========================================================================================================
  a = { k: 'K', l: 'not this', }
  b = { l: 'L', }
  c = new Commutator()
  c.add_bearer a
  c.add_bearer b
  debug 'Ω__32', c.get 'ttt', null
  debug 'Ω__33', c.get 'k'
  debug 'Ω__34', c.get 'l'
  return null
```


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

