# rollup-plugin-icu-messages

> Transform files containing ICU MessageFormat messages.

## Summary

This Rollup plugin adds a transform hook that pre-parses all messages in JSON file to an AST that can be used in runtime without need to bring parser, which allows to cut bundle size. Read more about how does this work [on Format.JS website →](https://formatjs.io/docs/guides/advanced-usage#pre-compiling-messages)

## Installation

With package manager of your choice:

**npm**

```sh
npm i -D @braw/rollup-plugin-icu-messages
```

**yarn**

```sh
yarn add -D @braw/rollup-plugin-icu-messages
```

**pnpm**

```sh
pnpm i -D @braw/rollup-plugin-icu-messages
```

## Usage

In your Rollup file import the default export from the `@braw/rollup-plugin-icu-messages` and then use it as a function in your `plugins` config array.

Example configuration:

```ts
import { defineConfig } from 'rollup'
import { icuMessages } from '@braw/rollup-plugin-icu-messages'

export default defineConfig({
  input: './src/index.mjs',
  output: { dir: './dist' },
  plugins: [
    icuMessages({
      include: './i18n/*.json',
      format: 'crowdin',
    }),
  ],
})
```

The following options are supported:

- `include` (optional, default: `'**/*.messages.json'`) — either single glob string or regular expression, or an array of those, which file ID must match to be included for transformation.
- `exclude` (optional, default: `undefined`) — either single glob string or regular expression, or an array of those, which file ID must NOT to be included for transformation.
- `indent` (optional, default: `'\t'`) — string or a number of spaces used for indentation.
- `parse` (optional, default: `(code) => JSON.parse(code)`) — a function that accepts file contents and ID, parses it and returns the JS object that will be passed to `format` function.
- `format` (optional, default: `default`) — either a string with built-in formatter name or a function that accepts parsed file contents (using `parse` function) and produces a record of messages keyed by their IDs. For list of built-in formatters [see `@formatjs/cli` documentation →](https://formatjs.io/docs/tooling/cli#builtin-formatters)
- `parserOptions` (optional, default: `undefined`) — an object which keys are message IDs and values are parsing options for those messages.

## Usage with other JSON plugins

Your configuration probably already includes a plugin that handles JSON or other files, which may cause conflict with this plugin.

You can configure this plugin to include files with other extensions and store your messages in, say, `.messages` files. Just change `options.include` to `**/*.messages` in this case.

Alternatively you can use a separate plugin in this package — `icuMessagesWrapPlugins`, exported from `@braw/rollup-plugin-icu-messages/wrap-plugins`.

<details>
<summary>Example configuration</summary>

```ts
import { defineConfig } from 'rollup'
import json from '@rollup/plugin-json'
import { icuMessages } from '@braw/rollup-plugin-icu-messages'
import { icuMessagesWrapPlugins } from '@braw/rollup-plugin-icu-messages/wrap-plugins'

export default defineConfig({
  input: './src/index.mjs',
  output: { dir: './dist' },
  plugins: [
    json(),
    icuMessages({
      include: './i18n/*.json',
      format: 'crowdin',
    }),
    icuMessagesWrapPlugins({
      extendDefaults: true,
      wrappers: {
        'my-plugin'(plugin, filter) {
          // implement plugin wrapping here
          // use filter to check if the file is handled by icuMessages plugin
        },
      },
    }),
  ],
})
```

</details>
