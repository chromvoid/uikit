import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(packageRoot, 'src')
const scriptsRoot = path.join(packageRoot, 'scripts')
const docsRoot = path.join(packageRoot, 'docs')
const specsRoot = path.join(packageRoot, 'specs')

const codeExtensions = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'])
const markdownExtensions = new Set(['.md'])
const toolingFiles = [
  path.join(packageRoot, 'package.json'),
  path.join(packageRoot, '.npmrc'),
  path.join(packageRoot, 'README.md'),
  path.join(packageRoot, 'tsconfig.json'),
  path.join(packageRoot, 'tsconfig.build.json'),
  path.join(packageRoot, 'tsconfig.test.json'),
  path.join(packageRoot, 'vitest.config.ts'),
  path.join(packageRoot, 'uno.config.ts'),
  path.join(packageRoot, '.oxlintrc.json'),
  path.join(packageRoot, '.oxfmtrc.json'),
  path.join(packageRoot, 'docs', '.vitepress', 'config.ts'),
  path.join(packageRoot, 'docs', '.vitepress', 'theme', 'index.ts'),
  path.join(packageRoot, 'docs', 'guide', 'getting-started.md'),
  path.join(packageRoot, '.github', 'workflows', 'ci.yml'),
]

const forbiddenPackageSpecifiers = [
  /^@project\//,
  /^@chromvoid\/(?!headless-ui(?:\/|$)|uikit(?:\/|$))/,
  /^apps\//,
  /^packages\//,
  /^root\//,
]

const forbiddenToolingPatterns = [
  {pattern: /\.\.\/\.\.\//u, reason: 'tooling file references a path above the package root'},
  {
    pattern: /path\.(?:resolve|join)\([^)]*['"]\.\.['"]\s*,\s*['"]\.\.['"]/u,
    reason: 'tooling file resolves above the package root',
  },
  {pattern: /\bnpm run [^\n\r"]* -w /u, reason: 'workspace command is not allowed'},
  {pattern: /\bnpm i(?:nstall)? [^\n\r"]* -w /u, reason: 'workspace command is not allowed'},
  {pattern: /\bnpm --prefix \.\.\/headless\b/u, reason: 'tooling file references sibling headless package'},
  {pattern: /\bworkspace:\*/u, reason: 'workspace dependency is not allowed'},
  {pattern: /\bnpx\s+prettier\b/u, reason: 'prettier CLI is not allowed'},
  {pattern: /\bprettier\s+--/u, reason: 'prettier CLI is not allowed'},
  {pattern: /\.\.\/headless\/dist/u, reason: 'tooling file references sibling headless dist output'},
  {pattern: /\.\.\/\.\.\/\.oxlintrc\.json/u, reason: 'tooling file references a root oxlint config'},
  {pattern: /\.\.\/\.\.\/\.prettierrc/u, reason: 'tooling file references a root prettier config'},
  {pattern: /-w packages\/uikit/u, reason: 'tooling file references monorepo workspace commands'},
]

const forbiddenMarkdownPatterns = [
  {pattern: /\bnpm run [^\n\r`]* -w packages\/uikit\b/u, reason: 'markdown uses monorepo workspace command'},
  {
    pattern: /\bnpm i(?:nstall)? [^\n\r`]* -w packages\/uikit\b/u,
    reason: 'markdown uses monorepo workspace command',
  },
  {pattern: /\bnpm --prefix \.\.\/headless\b/u, reason: 'markdown references sibling headless package'},
  {pattern: /\.\.\/\.\.\/headless\//u, reason: 'markdown references sibling headless repo path'},
  {pattern: /\.\.\/\.\.\/\.\.\/headless\//u, reason: 'markdown references sibling headless repo path'},
]

const importLikeRegex =
  /(?:import|export)\s+(?:[^'"`]*?\sfrom\s*)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const writeStdout = (message) => {
  process.stdout.write(`${message}\n`)
}

const writeStderr = (message) => {
  process.stderr.write(`${message}\n`)
}

const isInsidePackage = (targetPath) => {
  const normalizedRoot = path.resolve(packageRoot)
  const normalizedTarget = path.resolve(targetPath)
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)
}

const walkFiles = async (dirPath, allowedExtensions) => {
  if (!existsSync(dirPath)) {
    return []
  }

  const entries = await readdir(dirPath, {withFileTypes: true})
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath, allowedExtensions)))
      continue
    }

    const ext = path.extname(entry.name)
    if (allowedExtensions.has(ext)) {
      files.push(fullPath)
    }
  }

  return files
}

if (!existsSync(srcRoot)) {
  writeStdout('uikit-boundaries: no src directory, skipping')
  process.exit(0)
}

const files = await walkFiles(srcRoot, codeExtensions)
const scriptFiles = await walkFiles(scriptsRoot, codeExtensions)
const docsCodeFiles = await walkFiles(path.join(docsRoot, '.vitepress'), codeExtensions)
const markdownFiles = [
  ...(await walkFiles(docsRoot, markdownExtensions)),
  ...(await walkFiles(specsRoot, markdownExtensions)),
  path.join(packageRoot, 'README.md'),
]
const violations = []

for (const filePath of [
  ...files,
  ...scriptFiles,
  ...docsCodeFiles,
  path.join(packageRoot, 'vitest.config.ts'),
  path.join(packageRoot, 'uno.config.ts'),
]) {
  if (!existsSync(filePath)) continue

  const content = await readFile(filePath, 'utf8')
  importLikeRegex.lastIndex = 0

  for (;;) {
    const match = importLikeRegex.exec(content)
    if (!match) break

    const specifier = match[1] ?? match[2] ?? match[3]
    if (!specifier) continue

    if (forbiddenPackageSpecifiers.some((rx) => rx.test(specifier))) {
      violations.push({
        filePath,
        specifier,
        reason: 'forbidden internal monorepo import alias',
      })
      continue
    }

    if (specifier.startsWith('/')) {
      violations.push({
        filePath,
        specifier,
        reason: 'absolute filesystem import is not allowed',
      })
      continue
    }

    if (!specifier.startsWith('.')) continue

    const resolvedPath = path.resolve(path.dirname(filePath), specifier)
    if (!isInsidePackage(resolvedPath)) {
      violations.push({
        filePath,
        specifier,
        reason: 'relative import escapes package boundary',
      })
    }
  }
}

for (const filePath of toolingFiles) {
  if (!existsSync(filePath)) continue

  const content = await readFile(filePath, 'utf8')

  for (const {pattern, reason} of forbiddenToolingPatterns) {
    if (!pattern.test(content)) continue

    violations.push({
      filePath,
      specifier: pattern.source,
      reason,
    })
  }
}

for (const filePath of markdownFiles) {
  if (!existsSync(filePath)) continue

  const content = await readFile(filePath, 'utf8')

  for (const {pattern, reason} of forbiddenMarkdownPatterns) {
    if (!pattern.test(content)) continue

    violations.push({
      filePath,
      specifier: pattern.source,
      reason,
    })
  }
}

if (violations.length > 0) {
  writeStderr('uikit-boundaries: FAILED')
  for (const violation of violations) {
    const relativeFilePath = path.relative(packageRoot, violation.filePath)
    writeStderr(`- ${relativeFilePath}: '${violation.specifier}' (${violation.reason})`)
  }
  process.exit(1)
}

writeStdout('uikit-boundaries: OK')
