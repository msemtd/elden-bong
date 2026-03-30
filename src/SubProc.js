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

export function awaitableSubProcess (exe, args, cwd, prefix, notifyFunc) {
  const s = {
    exe,
    args,
    cwd,
    prefix,
    collectedOutput: '',
    collectedStdout: '',
    collectedStderr: '',
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
    s.collectedStderr += `${data}\n`
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
        const eMsg = s.collectedStdout.trimEnd()
        resolve(eMsg)
      } else {
        const eMsg = s.collectedStderr.trimEnd()
        const err = new Error(`${eMsg}`)
        err.code = code
        reject(err)
      }
    })
  })
  promise.s = s
  return promise
}

/**
 * Spawns a child process and returns a promise that resolves when the process exits.
 * @param {string} executablePath - The path to the executable to run.
 * @param {string[]} [args=[]] - An array of arguments to pass to the executable.
 * @param {object} [options={}] - Options to pass to the spawn function.
 * @param {function} [onStdout] - A callback function that is called with each line of stdout output.
 * @param {function} [onStderr] - A callback function that is called with each line of stderr output.
 * @param {function} [onExit] - A callback function that is called when the process exits.
 * @returns {Promise<{code: number, signal: string}>} A promise that resolves with the exit code and signal when the process exits.
 */
export function spawnProc (executablePath, args = [], options = {}, onStdout, onStderr, onExit) {
  let immediateError = ''
  const childProcess = spawn(executablePath, args, options)
  const stdoutLine = readline.createInterface({ input: childProcess.stdout, crlfDelay: Infinity })
  stdoutLine.on('line', (msg) => { onStdout?.(msg) })
  const stderrLine = readline.createInterface({ input: childProcess.stderr, crlfDelay: Infinity })
  stderrLine.on('line', (err) => { onStderr?.(err) })
  childProcess.on('close', (code, signal) => { onExit?.(Number(code), signal || immediateError) })
  childProcess.on('error', (err) => { immediateError = err.message })
  return childProcess
}

export function spawnProcessPromise (executablePath, args = [], options = {}, onStdout, onStderr) {
  return new Promise((resolve, reject) => {
    try {
      const onExit = (code, signal) => {
        resolve({ code, signal })
      }
      // eslint-disable-next-line no-unused-vars
      const childProcess = spawnProc(executablePath, args, options, onStdout, onStderr, onExit)
    } catch (error) {
      reject((error instanceof Error) ? error : Error(`${error}`))
    }
  })
}

/**
   * Thin convenience wrapper around `ExternalProcess.spawnProcessPromise` to run
   * a command and log the output with a prefix.
   * Throws if the process exits with a non-zero code.
   * @param {string} prefix log prefix to identify the source of the output
   * @param {string} exe path to the executable to run
   * @param {string[]} args arguments to pass to the executable
   * @param {any} options options to pass to spawnProcessPromise (e.g. { cwd: 'someDir' })
   * @param {Function} [outHandler] function to handle output with the prefix
   * @returns {Promise<void>} resolves when the process exits successfully, rejects if it exits with a non-zero code
   */
export async function execSubProc (prefix, exe, args = [], options = {}, outHandler) {
  const stdOut = (msg) => {
    if (!msg) { return }
    outHandler(`${prefix}stdout ${msg}`)
  }
  const stdErr = (msg) => {
    if (!msg) { return }
    outHandler(`${prefix}stderr ${msg}`)
  }
  const exitInfo = await spawnProcessPromise(exe, args, options, stdOut, stdErr)
  const sig = (exitInfo.signal ? ` and signal ${exitInfo.signal}` : '')
  const msg = `${prefix}exitCode ${exitInfo.code}${sig}`
  outHandler(msg)
  if (exitInfo.code !== 0) {
    throw Error(msg)
  }
}
