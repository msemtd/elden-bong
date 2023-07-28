// API used by electron renderer processes to access handy functions exposed by
// context bridge in preload...

const handy = window.handy

const pathParse = handy.pathParse
const pathJoin = handy.pathJoin
const pickFile = handy.pickFile
const slurp = handy.slurp
const readDir = handy.readDir
const outputFile = handy.outputFile

export { pathJoin, pathParse, pickFile, slurp, readDir, outputFile }

async function loadJsonFile (fp) { return await slurp(fp, { json: true }) }
async function loadTextFile (fp) { return await slurp(fp, { text: true }) }
async function loadBinaryFile (fp) { return await slurp(fp, { text: false }) }
async function loadTextFileLines (fp) { return await slurp(fp, { text: true, split: '\n' }) }

export { loadJsonFile, loadTextFile, loadBinaryFile, loadTextFileLines }
