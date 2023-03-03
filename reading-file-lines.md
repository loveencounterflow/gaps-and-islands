

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
  <figcaption>Fortunately, the charging one has been solved now that we've all standardized on mini-USB. Or is it micro-USB? Shit.</figcaption>
</figure>



------------------------------------------------------------------------------------------------------------

### `GUY.fs.walk_lines()`, `GUY.str.walk_lines()` and `GUY.fs.walk_buffers()`

* **`GUY.fs.walk_lines = ( path, cfg ) ->`**—Given a `path`, return a *synchronous* iterator over file
  lines. This is the most hassle-free approach to synchronously obtain lines of text files in NodeJS that
  I'm aware of, yet. The optional `cfg` argument may be an object with a single property `decode`; when set
  to `false`, `walk_lines()` will iterate over buffers instead of strings. Observe that currently the
  newline character is always assumed to be `\n` (i.e. U+00a0).

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
