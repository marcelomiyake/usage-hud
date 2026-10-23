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
