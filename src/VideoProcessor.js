import { awaitableSubProcess } from './SubProc'
import fs from 'fs-extra'
import path from 'path'
import { identifyDataParse, rxBetween, tileFile, xyToIndex, getPad } from './util'
import os from 'node:os';

export class VideoProcessor {
  constructor (exePath, ffmpegPath) {
    // https://github.com/yt-dlp/yt-dlp
    this.exePath = exePath
    this.ffmpegPath = ffmpegPath
    // 
  }

  // NB: to be run in main thread...
  // external tools download - use DataDir? nah!
  async getVid (url = 'https://www.youtube.com/watch?v=0Ssi-9wS1so') {
    const exe = 'C:/Users/msemt/Documents/dev/yt-dlp/yt-dlp.exe'
    // TODO: can I set the path in the env of the sub-process?
    // SET PATH=ffmpeg-master-latest-win64-gpl\bin;%PATH%
    // TODO: where to download? User home dir will do for now...
    const info = os.userInfo()
    const dir = info.homedir

    const s = await awaitableSubProcess(exe, [url], dir, 'getVid')
    console.dir(s)
    const k = identifyDataParse(s)
    console.dir(k)
    return s
  }
}
