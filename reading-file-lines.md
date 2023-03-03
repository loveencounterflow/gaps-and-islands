

## Reading Text Files Line by Line

Reading a text file in a linewise fashion is a basic task, yet surprisingly hard to
accomplish in NodeJS.


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
