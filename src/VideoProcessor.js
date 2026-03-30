import { awaitableSubProcess, execSubProc } from './SubProc'
import fs from 'fs-extra'
import path from 'path'
import { identifyDataParse, rxBetween, tileFile, xyToIndex, getPad } from './util'
import os from 'node:os'

/**
 * Uses Node APIs and so operates in the main thread (or worker)
 */
export class VideoProcessor {
  constructor (exePath, ffmpegPath, nodePath) {
    // various video downloading/processing tools can be used here: yt-dlp, ffmpeg, etc
    // https://github.com/yt-dlp/yt-dlp
    // get it on windows...
    // curl -L  https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp.exe
    // https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
    // install
    // node available and decent version

    this.exePath = exePath || ''
    this.ffmpegPath = ffmpegPath || ''
    this.nodePath = nodePath || ''
  }

  // NB: to be run in main thread...
  // external tools download - use DataDir? nah!
  async getVid (url) {
    const exe = this.exePath
    // TODO: can I set the path in the env of the sub-process?
    // can provide it on command line
    // SET PATH=ffmpeg-master-latest-win64-gpl\bin;%PATH%
    // @ECHO OFF
    // SET SP= %~dp0
    // SET FFMPEG=%SP%\ffmpeg-master-latest-win64-gpl\bin
    // SET PATH=%FFMPEG%;%PATH%
    // REM ~ %SP%\yt-dlp.exe  --help
    // REM ~ %SP%\yt-dlp.exe  --help > yt-dlp.help.txt
    // REM ~ %SP%\yt-dlp.exe  --extractor-descriptions
    // REM ~ %SP%\yt-dlp.exe  --list-extractors
    // REM ~ -x, --extract-audio             Convert video files to audio-only files
    //                             REM ~ (requires ffmpeg and ffprobe)
    // REM ~ --audio-format FORMAT           Format to convert the audio to when -x is
    //                             REM ~ used. (currently supported: best (default),
    //                             REM ~ aac, alac, flac, m4a, mp3, opus, vorbis,
    //                             REM ~ wav). You can specify multiple rules using
    //                             REM ~ similar syntax as --remux-video
    // REM Use a JS runtime...
    // REM ~ where node
    // %SP%\yt-dlp.exe --js-runtimes node:"C:\Program Files\Volta\node.exe" --ffmpeg-location %FFMPEG% --extract-audio --audio-format mp3 https://www.youtube.com/watch?v=SOCjkXBeKRs

    // TODO: where to download? User home dir will do for now...
    const info = os.userInfo()
    const dir = info.homedir
    const options = { cwd: dir }
    const lines = []
    // the output handler could be sending progress messages back to renderer!
    const outHandler = (msg) => {
      lines.push(msg)
    }
    if (url === 'help') {
      await execSubProc('getVid:help:', exe, ['--help'], options, outHandler)
    } else {
      await execSubProc('getVid:url:', exe, [url], options, outHandler)
    }
    return lines.join('\n')
  }
}
