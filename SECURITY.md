# Security policy

## Supported versions

usage-hud is maintained on its latest release only. Security fixes land on `main` and ship in the next release of the Claude Code plugin.

| Version        | Supported |
| -------------- | --------- |
| 0.1.x (latest) | Yes       |
| Older          | No        |

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately in one of these ways:

- [Open a private security advisory](https://github.com/marcelomiyake/usage-hud/security/advisories/new) on GitHub.
- Email [marcelo.m.miyake@gmail.com](mailto:marcelo.m.miyake@gmail.com) with "usage-hud security" in the subject.

Include what you found, the steps to reproduce it, the plugin and Claude Code versions, and the impact you expect. You will get a reply within 5 business days. Once the problem is confirmed, a fix is released as soon as possible, and the advisory is published with credit to you unless you ask to stay anonymous.

## Scope

In scope: the code in this repository, including the bundled plugin in `hooks/register.js`, and the CI workflow. The plugin reads the usage figures Claude Code holds for the session and draws them in the status line. It makes no network requests, runs no commands, and reads and writes no files. A way to make it do any of those, or to show anything but those figures, is a vulnerability.

Out of scope: Claude Code itself, the Anthropic API, and SonarQube Cloud. Report Claude Code and API problems to Anthropic through its [responsible disclosure program](https://www.anthropic.com/responsible-disclosure-policy).

## Safety review

Reviewed on October 23, 2026, for usage-hud 0.1.0 on Claude Code 2.1.309. Re-run it whenever the mod's engine calls, hooks, dependencies or CI change.

### How it was checked

- **Static.** `claude plugin validate .` lists every hook and engine call the bundle makes: hooks `session.start` and `session.measure`, calls `$.clock.every`, `$.clock.now`, `$.session.usage` and `$.ui.status`, and nothing else. A search of `hooks/register.js` finds no `eval`, `new Function`, dynamic `import()`, `require`, `fetch`, `process`, or any other `$` namespace.
- **Dynamic.** `claude plugin test .` runs the bundle in Claude Code's own engine. A vitest case feeds the hooks figures no real engine would send: terminal escape sequences and markup in `kind` and `resetsAt`, `NaN`, `Infinity` and negative counts. It checks that the line holds only the mod's own icons, digits and unit letters.
- **Dependencies.** No runtime dependencies: the bundle is this repository's own code, built by esbuild and not minified. `npm audit` reports 0 vulnerabilities in the development dependencies.
- **Secrets.** A scan of the repository for key and token formats found none. The SonarQube token is not in the git history.
- **CI.** Read `.github/workflows/ci.yml` and `scripts/check-sonar-gate.mjs` for where the token goes.

### Findings

| Question                                             | Answer                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What does it read?                                   | The context window's size and fill, and each rate-limit window's `kind`, `percentUsed` and `resetsAt`, from `$.session.usage()` and the `session.measure` input. Claude Code's clock. The session's cost comes with those figures and is ignored. It reads no files, environment variables, settings, credentials, prompts, transcript, plugin store or session state. |
| What does it send anywhere?                          | Nothing. It never calls `$.http`, `$.model`, `$.agent`, `$.session.send`, `$.session.append` or `$.telemetry`. `$.session.usage()` without `breakdown` reads figures the engine already holds and sends no request.                                                                                                                                                    |
| What does it write?                                  | Its own status line, with `$.ui.status`. No files, store, state, prompt box, clipboard or transcript.                                                                                                                                                                                                                                                                  |
| Does it execute anything from user-controlled input? | No. Nothing is evaluated, spawned or registered: no `$.process`, no slash commands, no tools, no prompt or tool-call hooks. The only strings it receives (`kind`, `resetsAt`) are used as a map key and parsed into a date. The line is built only from numbers, fixed icons and unit letters, so no text it is handed, terminal escapes included, reaches the screen. |
| What does it cost to run?                            | One `$.clock.every` of 60 seconds, replaced (never doubled) when the session starts over and dropped by the engine on reload.                                                                                                                                                                                                                                          |
| Reset offers (🎁)                                    | Not read. The only sources are Claude Code's own claude.ai call with the account's OAuth token, `/limit-reset` (which spends the reset), and a cache in `~/.claude.json`. Reading credentials, calling a private endpoint, running that command or reading that file would each break the guarantees above, so the mod does none of them.                              |

Fixed during the review:

1. **CI token scope.** `SONAR_TOKEN` was set for the whole job, so `npm ci` install scripts and the tests could read it. It is now set only on the two SonarQube steps. A separate step reports only whether the token is present.
2. **Persisted Git credentials.** `actions/checkout` left the job's GitHub token in `.git/config`. It now runs with `persist-credentials: false`.
3. **Token destination.** `scripts/check-sonar-gate.mjs` sent the token to whatever `sonar.host.url` named. It now refuses any host but `https://sonarcloud.io`.
4. **Log injection (S5145).** The same script echoed API counts as they came. It now logs only counts it has checked are whole numbers.

### Residual risks

- The mod relies on Claude Code's mod sandbox (no DOM, no Node, `$` as the only way out) and on its early-access API, which can change between releases.
- `hooks/register.js` is generated code that is committed, because a marketplace install runs it as is. CI fails when it differs from a fresh build of `src/`.
- A marketplace install takes `main` as it stands. `main` accepts changes only through pull requests with every review conversation resolved.
