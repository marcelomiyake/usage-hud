// Holds the project to the gate SonarQube Cloud's free plan cannot assign to
// it: no open issue of any type or severity and every security hotspot
// reviewed, on all code and not only new code; coverage of 80% or more and
// duplication of 3% or less. The built-in gate (Sonar way) still judges new
// code: sonar.qualitygate.wait makes the scan fail on it first.
//
//   SONAR_TOKEN=... node scripts/check-sonar-gate.mjs
//
// In a GitHub Actions pull request run it checks that pull request's
// analysis; anywhere else, the branch it runs on (main outside CI).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIN_COVERAGE = 80
const MAX_DUPLICATION = 3
/** The one host the token is ever sent to, whatever sonar-project.properties says. */
const SONARCLOUD = 'https://sonarcloud.io'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const properties = readFileSync(join(root, 'sonar-project.properties'), 'utf8')
const project = propertyOf('sonar.projectKey')
if (propertyOf('sonar.host.url') !== SONARCLOUD) {
  console.error(`sonar.host.url must be ${SONARCLOUD}: the token is sent nowhere else.`)
  process.exit(1)
}
const token = process.env.SONAR_TOKEN
if (!token) {
  console.error('Set SONAR_TOKEN to a SonarQube Cloud token that can browse the project.')
  process.exit(1)
}

const scope = scopeOf(process.env)
const isPullRequest = 'pullRequest' in scope
const metrics = isPullRequest
  ? { coverage: 'new_coverage', duplication: 'new_duplicated_lines_density' }
  : { coverage: 'coverage', duplication: 'duplicated_lines_density' }

const issues = await api('issues/search', { componentKeys: project, resolved: 'false', ps: '1' })
const hotspots = await api('hotspots/search', { projectKey: project, status: 'TO_REVIEW', ps: '1' })
const measures = await api('measures/component', {
  component: project,
  metricKeys: `${metrics.coverage},${metrics.duplication}`,
})

const openIssues = countOf(issues.total)
const unreviewedHotspots = countOf(hotspots.paging.total)
const coverage = measureOf(measures, metrics.coverage)
const duplication = measureOf(measures, metrics.duplication)
const failures = [
  openIssues > 0 ? `${openIssues} open issue(s)` : undefined,
  unreviewedHotspots > 0 ? `${unreviewedHotspots} security hotspot(s) to review` : undefined,
  coverage !== undefined && coverage < MIN_COVERAGE ? `coverage ${coverage}% is under ${MIN_COVERAGE}%` : undefined,
  duplication !== undefined && duplication > MAX_DUPLICATION
    ? `duplication ${duplication}% is over ${MAX_DUPLICATION}%`
    : undefined,
].filter(failure => failure !== undefined)

console.log(
  `${isPullRequest ? 'Pull request' : 'Branch'} analysis: ${openIssues} issues, ${unreviewedHotspots} hotspots to review, ` +
    `coverage ${coverage ?? 'n/a'}%, duplication ${duplication ?? 'n/a'}%`,
)
if (failures.length > 0) {
  console.error(`Gate failed: ${failures.join('; ')}.`)
  process.exit(1)
}
console.log('Gate passed: zero issues, every hotspot reviewed.')

function propertyOf(name) {
  const line = properties.split('\n').find(entry => entry.startsWith(`${name}=`))
  if (line === undefined) {
    throw new Error(`sonar-project.properties has no ${name}`)
  }
  return line.slice(name.length + 1).trim()
}

/** The analysis to read: a pull request's in a pull request run, else the branch's. */
function scopeOf(env) {
  const pullRequest = env.GITHUB_EVENT_NAME === 'pull_request' ? env.GITHUB_REF?.split('/')[2] : undefined
  if (pullRequest !== undefined) {
    return { pullRequest }
  }
  return env.GITHUB_REF_NAME === undefined ? {} : { branch: env.GITHUB_REF_NAME }
}

async function api(path, params) {
  const url = new URL(`api/${path}`, `${SONARCLOUD}/`)
  for (const [key, value] of Object.entries({ ...params, ...scope })) {
    url.searchParams.set(key, value)
  }
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    throw new Error(`GET ${url.pathname} answered ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

/** A count the API reported, as a number: the response is never echoed as it came. */
function countOf(value) {
  const count = Number(value)
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new TypeError('The API reported a count that is not a whole number')
  }
  return count
}

function measureOf(response, metric) {
  const found = response.component.measures.find(measure => measure.metric === metric)
  const value = found?.value ?? found?.periods?.[0]?.value ?? found?.period?.value
  return value === undefined ? undefined : Number(value)
}
