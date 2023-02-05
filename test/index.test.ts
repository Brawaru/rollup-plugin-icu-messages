import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { rollup } from 'rollup'
import json from '@rollup/plugin-json'
import { describe, expect, it } from 'vitest'
import { AnyMessage, icuMessages } from '..'

describe('plugin', () => {
  it('should generate bundle', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/normal/input.mjs',
        ),
      ],
      plugins: [icuMessages({ format: 'crowdin' })],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('should fail with unresolved formatter', async () => {
    let err: unknown
    try {
      await rollup({
        input: [
          resolve(
            dirname(fileURLToPath(import.meta.url)),
            'fixtures/normal/input.mjs',
          ),
        ],
        plugins: [icuMessages({ format: 'non-existent' })],
      })
    } catch (err_) {
      err = err_
    }

    expect(err).toHaveProperty('code', 'ROLLUP_ICU_FORMATTER_RESOLVE_ERROR')
  })

  it('should fail with pre-compiled JSON', async () => {
    let err: unknown

    try {
      const { generate } = await rollup({
        input: [
          resolve(
            dirname(fileURLToPath(import.meta.url)),
            'fixtures/normal/input.mjs',
          ),
        ],
        plugins: [json(), icuMessages({ format: 'crowdin' })],
      })

      await generate({
        format: 'esm',
      })
    } catch (err_) {
      err = err_
    }

    expect(err).toHaveProperty('pluginCode', 'ROLLUP_ICU_TRANSFORM_ERROR')
  })

  it('should prevent json plugins if specified', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/with-json/input.mjs',
        ),
      ],
      plugins: [
        json(),
        icuMessages({
          format: 'crowdin',
          experimental: { wrapJSONPlugins: true },
        }),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  it('respects parser options', async () => {
    const { generate } = await rollup({
      input: [
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          'fixtures/tagless-parsing/input.mjs',
        ),
      ],
      plugins: [
        json(),
        icuMessages({
          format: 'crowdin',
          parserOptions: {
            [AnyMessage]: {
              ignoreTag: true,
            },
            'invalid-key': {
              ignoreTag: false,
            },
          },
          experimental: {
            wrapJSONPlugins: true,
          },
        }),
      ],
    })

    const { output } = await generate({
      format: 'esm',
    })

    expect(output).toHaveLength(1)
    expect(output[0]?.code).toMatchSnapshot()
  })

  // TODO: add more tests
})
