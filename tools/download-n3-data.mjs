#!/usr/bin/env node
/**
 * Downloads Nioh 3 item and effect data from the reference project:
 * https://github.com/alfizari/Nioh-3-Save-Editor
 *
 * Run from the workspace root:
 *   node tools/download-n3-data.mjs
 */

import { createWriteStream, mkdirSync } from 'fs'
import { get } from 'https'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, '../src/data')

const FILES = [
  {
    url: 'https://raw.githubusercontent.com/alfizari/Nioh-3-Save-Editor/main/items_little_endian.json',
    dest: join(dataDir, 'items-n3.json')
  },
  {
    url: 'https://raw.githubusercontent.com/alfizari/Nioh-3-Save-Editor/main/effects_big_endian.json',
    dest: join(dataDir, 'effects-n3.json')
  }
]

function download(url, dest) {
  return new Promise((resolve, reject) => {
    mkdirSync(dirname(dest), { recursive: true })
    const file = createWriteStream(dest)
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', reject)
  })
}

for (const { url, dest } of FILES) {
  process.stdout.write(`Downloading ${url} …`)
  await download(url, dest)
  console.log(' done')
}

console.log('Nioh 3 data files written to src/data/')
