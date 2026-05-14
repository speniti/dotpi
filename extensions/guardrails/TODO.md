# TODO

## Test refactoring

I test stanno diventando difficili da manutenere per ripetizione e verbosità.

### `tests/matchers.test.ts`

Ogni matcher ha il suo `describe` con istanza dedicata e assert quasi identici. Valutare:

- **Table-driven tests** — un array di `{ command, expected, description }` per ogni matcher
- **Test factory** — una funzione `testMatcher(matcher, cases)` che genera i `it()` automaticamente

### `tests/bash-parser.test.ts`

Molti test seguono lo schema `parseBash(x).toEqual([{ name: ..., args: ... }])`. Valutare:

- **Helper `expectParse(input, expected)`** — ridurre il boilerplate
- **Snapshot testing** — per output complessi (pipeline, redirect, strutture annidate)

### `tests/bash.test.ts`

Il mock di `parseBash` e `matchDangerous` richiede setup esplicito in ogni test. Valutare:

- **Test factory per scenari** — e.g. `testSafeCommand(cmd)`, `testDangerousCommand(cmd, expected)`, `testUnparseableCommand(cmd)`
- Raggruppare meglio i casi fail-closed vs structural matching
