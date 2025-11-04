import pathlib from 'node:path'

const __dirname = import.meta.dirname

export const PORT = 44979
export const DATA_ROOT = pathlib.join(__dirname, '../dist/data')
export const META_FILENAME = 'meta.json'
