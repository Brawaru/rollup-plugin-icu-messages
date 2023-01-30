import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { rollup } from 'rollup'
import json from '@rollup/plugin-json'
import { describe, expect, it } from 'vitest'
import icuMessages from '..'

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

  // TODO: add more tests
})
