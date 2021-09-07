

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


