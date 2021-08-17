
# Gaps and Islands

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
This part to be updated by running `doctoc REDME.md`

- [SQL](#sql)
  - [The Gaps-And-Islands Pattern](#the-gaps-and-islands-pattern)
  - [Maximum Value in Group / Biggest X in Subgroup](#maximum-value-in-group--biggest-x-in-subgroup)
  - [Find RegEx Match in a Text Array](#find-regex-match-in-a-text-array)
  - [Immutable Columns in SQL](#immutable-columns-in-sql)
    - [SOLUTION A](#solution-a)
    - [SOLUTION B](#solution-b)
- [Linux Shell / Bash](#linux-shell--bash)
  - [`find` patterns](#find-patterns)
- [better `df`](#better-df)
  - [Using `dutree`](#using-dutree)
  - [Bash Script for Cross-OS Temporary Directories](#bash-script-for-cross-os-temporary-directories)
- [NodeJS](#nodejs)
  - [Avoiding Accidental String Substitutions (so-called A$$es)](#avoiding-accidental-string-substitutions-so-called-aes)
  - [Mixins](#mixins)
  - [Callable Instances](#callable-instances)
  - [Reading Text Files Line by Line](#reading-text-files-line-by-line)
    - [Pipestreaming Solution](#pipestreaming-solution)
    - [Node-Readlines](#node-readlines)
    - [A Better Solution: InterText SplitLines](#a-better-solution-intertext-splitlines)
  - [Event Emitter as Async Generator](#event-emitter-as-async-generator)
  - [Turning Asynchronous functions into Synchronous ones](#turning-asynchronous-functions-into-synchronous-ones)
- [CSS](#css)
  - [CSS Variables with User Settings, Defaults](#css-variables-with-user-settings-defaults)
- [CoffeeScript](#coffeescript)
  - [Properties with Getters and Setters for (ES6) Classes](#properties-with-getters-and-setters-for-es6-classes)

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


## Avoiding Accidental String Substitutions (so-called A$$es)

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


## Callable Instances

```coffee
class Myclass extends Function

  constructor: ->
    super()
    Object.setPrototypeOf @mymethod, Myclass.prototype
    return @mymethod

  mymethod: ( ... ) => ...

```




## Reading Text Files Line by Line

Reading a text file in a linewise fashion is a basic task, yet surprisingly hard to
accomplish in NodeJS. There are two good solutions:

### Pipestreaming Solution

Using basic [PipeStreams](https://github.com/loveencounterflow/pipestreams), the more fully-featured
[PipeDreams](https://github.com/loveencounterflow/pipedreams), or their successor (and WIP)
[SteamPipes](https://github.com/loveencounterflow/steampipes), a pipeline can be built with a file reader as
source, followed by a `$split()` transform.

The drawback here is that currently, there is no solution to do this synchronously, and, because
the lines of text become only available within stream transforms, it is not possible to build
an iterator. ATM it is not quite clear to me whether building iterators on top of a pipestreaming
solution is possible at all.

### Node-Readlines

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

### A Better Solution: InterText SplitLines

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

Unfortunately it turns out that the `Atomics` API is quite hard to use by itself; this is definitely
something I can agree with [*Avoiding race conditions in SharedArrayBuffers with Atomics* by Lin Clark (June
2017)](https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/).

> Also probably a good read: The entire series [*A cartoon intro to SharedArrayBuffers Articles* by Lin
> Clark (June
> 2017)](https://hacks.mozilla.org/category/code-cartoons/a-cartoon-intro-to-sharedarraybuffers/)

In
[`hengist/async-to-sync-with-atomics-wait`](https://github.com/loveencounterflow/hengist/blob/master/dev/snippets/src/async-to-sync-with-atomics-wait.coffee)
I tried to get a working solution but didn't quite succeed. What did work immediately is
[`abbr/deasync`](https://github.com/abbr/deasync); here's a code sample:

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










