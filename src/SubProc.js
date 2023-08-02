import { spawn } from 'child_process'
import readline from 'readline'

export function subProcess (exe, args, options, stdoutCallback, stderrCallback, exitCallback) {
  const proc = spawn(exe, args, { ...options })
  if (typeof stdoutCallback === 'function') {
    const stdoutLine = readline.createInterface({ input: proc.stdout, crlfDelay: Infinity })
    stdoutLine.on('line', stdoutCallback)
  }
  if (typeof stderrCallback === 'function') {
    const stderrLine = readline.createInterface({ input: proc.stderr, crlfDelay: Infinity })
    stderrLine.on('line', stderrCallback)
  }
  if (typeof exitCallback === 'function') {
    proc.on('close', (code, signal) => {
      exitCallback(code, signal)
    })
  }
  return proc
}
