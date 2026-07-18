import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const desktopRoot = process.env.MOLDABLE_DESKTOP_REPO
  ? resolve(process.env.MOLDABLE_DESKTOP_REPO)
  : resolve(skillRoot, '..', 'moldable-desktop')

const sourceSkillRoot = resolve(skillRoot, 'skills', 'moldable-apps')
const bundledSkillRoot = resolve(
  desktopRoot,
  'desktop',
  'resources',
  'bundled-skills',
  'moldable-core-skills',
  'moldable-apps',
)

const sourceReferences = resolve(sourceSkillRoot, 'references')
const bundledReferences = resolve(bundledSkillRoot, 'references')

function nativeReferenceNames(entries) {
  return entries.filter((name) => /^native-.*\.md$/.test(name)).sort()
}

function nativeSkillLinks(contents) {
  return contents
    .split('\n')
    .filter((line) => line.includes('(references/native-'))
    .join('\n')
}

const [sourceEntries, bundledEntries] = await Promise.all([
  readdir(sourceReferences),
  readdir(bundledReferences),
])
const sourceNames = nativeReferenceNames(sourceEntries)
const bundledNames = nativeReferenceNames(bundledEntries)

const failures = []
if (JSON.stringify(sourceNames) !== JSON.stringify(bundledNames)) {
  const sourceSet = new Set(sourceNames)
  const bundledSet = new Set(bundledNames)
  const missingFromBundle = sourceNames.filter((name) => !bundledSet.has(name))
  const missingFromSource = bundledNames.filter((name) => !sourceSet.has(name))

  if (missingFromBundle.length > 0) {
    failures.push(`Missing from bundle: ${missingFromBundle.join(', ')}`)
  }
  if (missingFromSource.length > 0) {
    failures.push(`Missing from source: ${missingFromSource.join(', ')}`)
  }
}

for (const name of sourceNames.filter((entry) =>
  bundledNames.includes(entry),
)) {
  const [source, bundled] = await Promise.all([
    readFile(resolve(sourceReferences, name), 'utf8'),
    readFile(resolve(bundledReferences, name), 'utf8'),
  ])

  if (source !== bundled) {
    failures.push(`Reference differs: ${name}`)
  }
}

const [sourceSkill, bundledSkill] = await Promise.all([
  readFile(resolve(sourceSkillRoot, 'SKILL.md'), 'utf8'),
  readFile(resolve(bundledSkillRoot, 'SKILL.md'), 'utf8'),
])
if (nativeSkillLinks(sourceSkill) !== nativeSkillLinks(bundledSkill)) {
  failures.push(
    'Native reference links differ between source and bundled SKILL.md',
  )
}

if (failures.length > 0) {
  console.error('Native hardware skill parity check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log('Native hardware skill references match bundled copies.')
}
