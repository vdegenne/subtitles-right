#!/usr/bin/env node
import {subtitlesToSRT} from '@vdegenne/subtitles'
import fs, {writeFileSync} from 'fs'
import pathlib from 'path'
import {SUBTITLES_FILENAME} from './constants.js'
const pwd = process.env.PWD
if (pwd) {
	const subFilepath = pathlib.join(pwd, SUBTITLES_FILENAME)
	if (!fs.existsSync(subFilepath)) {
		throw new Error('No subtitles file found in this directory.')
	}
	const subtitles = JSON.parse(fs.readFileSync(subFilepath).toString())
	writeFileSync('sub.srt', subtitlesToSRT(subtitles))
}
