

### Immutable Columns in SQL

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


#### SOLUTION A

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

#### SOLUTION B

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





