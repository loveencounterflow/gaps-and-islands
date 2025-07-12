
## Event Emitter as Async Generator

In (blob/master/src/event-emitter-as-async-generator/main.coffee)[event-emitter-as-async-generator], we
demonstrate how to turn a NodeJS `EventEmitter` into an asynchronous iterator. The solution is based on
StackOverflow user [mpen](https://stackoverflow.com/users/65387/mpen)'s
[suggestion](https://stackoverflow.com/a/59347615/7568091) how to do such a thing, and the idea has been
turned into a NodeJS module, [JfEE](https://github.com/loveencounterflow/jfee); this, in turn, has made the
implementation of SteamPipes' `source_from_child_process()` possible.

