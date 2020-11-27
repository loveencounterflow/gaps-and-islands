
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

# NodeJS

<insert src='./reading-file-lines.md'/>
<insert src='./avoiding-accidental-string-substitutions.md'/>



<insert src='./css.md'/>


# CoffeeScript

<insert src='./coffeescript-class-instance-properties.md'/>







