
# Gaps and Islands

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
This part to be updated by running `doctoc REDME.md`
<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# SQL

## The Gaps-And-Islands Pattern

* https://stackoverflow.com/questions/17046204/how-to-find-the-boundaries-of-groups-of-contiguous-sequential-numbers
* https://stackoverflow.com/questions/tagged/gaps-and-islands
* https://www.xaprb.com/blog/2006/03/22/find-contiguous-ranges-with-sql/

```sql

<insert src='./gaps-and-islands.icql'/>

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

<insert src='./immutable-columns-in-sql.md'/>

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

<insert src='./avoiding-accidental-string-substitutions.md'/>
<insert src='./mixins.md'/>
<insert src='./callable-instances.md'/>
<insert src='./reading-file-lines.md'/>
<insert src='./event-emitter-as-async-generator.md'/>
<insert src='./turning-asynchronous-functions-into-synchronous-ones.md'/>
<insert src='./context-managers.md'/>

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

<insert src='./css.md'/>



# CoffeeScript

<insert src='./coffeescript-class-instance-properties.md'/>
<insert src='./coffeescript-types-and-constants-per-class-instance.md'/>
<insert src='./coffeescript-programmatic-functions-with-correct-names.md'/>







