import pathlib from 'node:path'

const __dirname = import.meta.dirname

export const PORT = 44979
export const DATA_ROOT = pathlib.join(__dirname, '../dist/data')
export const META_FILENAME = 'meta.json'
export const SUBTITLES_FILENAME = 'sub.json'
export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm']
export const TERMINAL_BIN_NAME = 'kitty'
