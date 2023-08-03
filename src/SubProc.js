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

export function awaitableSubProc (exe, args, cwd, prefix, notifyFunc) {
  const s = {
    exe,
    args,
    cwd,
    prefix,
    collectedOutput: '',
    collectedStdout: '',
    subProc: null,
    running: true,
    exitCode: 0,
    exitSignal: null,
  }
  const n = notifyFunc instanceof Function ? notifyFunc : (msg) => { console.log(msg) }
  s.subProc = spawn(exe, args, { cwd })
  const stdoutLine = readline.createInterface({ input: s.subProc.stdout, crlfDelay: Infinity })
  const stderrLine = readline.createInterface({ input: s.subProc.stderr, crlfDelay: Infinity })
  stdoutLine.on('line', (data) => {
    if (!data) { return }
    const msg = `${s.prefix} stdout: ${data}`
    s.collectedOutput += msg + '\n'
    s.collectedStdout += `${data}\n`
    n(msg)
  })
  stderrLine.on('line', (data) => {
    if (!data) { return }
    const msg = `${s.prefix} stderr: ${data}`
    s.collectedOutput += msg + '\n'
    n(msg)
  })
  const promise = new Promise((resolve, reject) => {
    s.subProc.on('close', (code, signal) => {
      s.exitCode = code
      s.exitSignal = signal
      s.running = false
      const msg = `${s.prefix} code=${code} signal=${signal}`
      s.collectedOutput += msg + '\n'
      n(msg)
      // allow subProc GC - makes s simple object
      s.subProc = null
      if (code === 0) {
        resolve(s)
      } else {
        const err = new Error(`subProc exited with code ${code}`)
        err.code = code
        err.s = s
        reject(err)
      }
    })
  })
  promise.s = s
  return promise
}
