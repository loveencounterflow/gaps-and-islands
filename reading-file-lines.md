

### Reading Text Files Line by Line

Reading a text file in a linewise fashion is a basic task, yet surprisingly hard to
accomplish in NodeJS. There are two good solutions:

#### Pipestreaming Solution

Using basic [PipeStreams](https://github.com/loveencounterflow/pipestreams), the more fully-featured
[PipeDreams](https://github.com/loveencounterflow/pipedreams), or their successor (and WIP)
[SteamPipes](https://github.com/loveencounterflow/steampipes), a pipeline can be built with a file reader as
source, followed by a `$split()` transform.

The drawback here is that currently, there is no solution to do this synchronously, and, because
the lines of text become only available within stream transforms, it is not possible to build
an iterator. ATM it is not quite clear to me whether building iterators on top of a pipestreaming
solution is possible at all.

#### Node-Readlines

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



