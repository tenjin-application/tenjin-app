# So you don't bust a nut trying to set this up:
- Clone the repo
- run `npm install` in both client/ and server/. 
- Copy .env.example to .env, then run `createdb tenjin` and `npm run migrate`.

Extra note: shared is specifically for TypeScript types, or for anything that might be shared. ALL types should be defined here.

You may import them in client / server by using:
`import type { Group } from '../../shared/types'.