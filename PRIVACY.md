# Privacy policy

Effective date: October 23, 2026

This policy covers usage-hud, the Claude Code plugin published from <https://github.com/marcelomiyake/usage-hud> by Marcelo Masahiko Miyake ("I" below). It explains what data the plugin reads, what it sends, what it stores, and for how long.

## Summary

usage-hud has no server, no account, no analytics, and no telemetry. It makes no network requests at all. It reads the usage figures Claude Code already holds for your session and draws them in the status line. I never receive anything about you or your usage.

## What the plugin reads

Through Claude Code's mod API (`$.session.usage()` and the `session.measure` event), it reads only:

- The context window's size and how many tokens of it the last response used.
- The usage percentage and reset time of your 5-hour and weekly windows, when you are on a subscription.
- The current time, from Claude Code's clock.

These figures come from the response headers of requests Claude Code already made for your conversation. Reading them sends nothing.

It does not read your prompts, your conversation, your files, environment variables, settings files, credentials, API keys, or `~/.claude.json`. Claude Code also hands it the session's cost, the window's fill percentage, and the other rate-limit windows. The plugin drops them without using or keeping them.

## What it sends, and to whom

Nothing. The plugin does not use `$.http`, `$.model`, or any other way to reach the network. It does not send data to me, to Anthropic, or to any third party.

## What it stores, and for how long

| Data                                                | Where                                    | How long                                         |
| --------------------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| The status line text, such as `🪟 45.2k/1M  🕔 23%` | Claude Code's status line for the plugin | Until the next update, or until the session ends |
| The figures it is drawing                           | Memory                                   | For the moment it takes to draw them             |

The plugin writes no files and uses neither Claude Code's plugin store nor its session state.

## How the data is used

Only to draw the status line on your own screen. It is not used for advertising, profiling, or training models, and it is not sold or shared.

## Your choices

- Uninstall or disable the plugin with `/plugin`, or with `claude plugin uninstall usage-hud`. It then stops reading anything.
- For the usage data itself, use Anthropic's controls and policy: [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy).

## Children

usage-hud is a developer tool and is not directed at children.

## Changes

Changes to this policy are made in this file, and its history is public in the repository. The effective date above changes with each update.

## Contact

Questions about this policy or your data: email [marcelo.m.miyake@gmail.com](mailto:marcelo.m.miyake@gmail.com), or open an issue at <https://github.com/marcelomiyake/usage-hud/issues>.
