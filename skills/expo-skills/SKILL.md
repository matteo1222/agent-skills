---
name: expo-skills
description: Official Expo Claude Code skills for app design, deployment, and SDK upgrades.
---

# Expo Official Skills

Official Claude Code skills from the Expo team (by Evan Bacon, creator of Expo Router).

## Installation

### Via Claude Code Marketplace

```
/plugin marketplace add expo/skills

/plugin install expo-app-design
/plugin install expo-deployment
/plugin install upgrading-expo
```

### Via Any Agent (bunx)

```bash
bunx add-skill expo/skills
```

## Available Skills

### 1. expo-app-design

App design patterns and best practices for Expo apps:
- Apple HIG compliance
- Safe areas handling
- Dynamic Type support
- Dark mode implementation
- Accessibility patterns
- Liquid Glass materials (iOS 26+)
- App Store readiness

### 2. expo-deployment

Deployment workflows for Expo apps:
- EAS Build configuration
- EAS Submit to App Store / Play Store
- OTA updates with EAS Update
- Environment management
- Release channels
- CI/CD integration

### 3. upgrading-expo

Help with Expo SDK version upgrades:
- Breaking changes guidance
- Migration paths
- Dependency compatibility
- Common upgrade issues
- Version-specific fixes

## When to Use

**expo-app-design:**
- Building new screens/components
- Implementing design systems
- Ensuring platform conventions
- Preparing for App Store review

**expo-deployment:**
- First time deploying to stores
- Setting up CI/CD
- Managing multiple environments
- Troubleshooting build failures

**upgrading-expo:**
- Bumping SDK versions
- Stuck on upgrade errors
- Checking breaking changes
- Planning upgrade strategy

## Source

From Evan Bacon (@Baconbrix):
> "Three Claude Code skills / plugins I've been using for all my @Expo apps over the past few weeks. Can't imagine going back."

Original tweet: https://x.com/Baconbrix/status/2011862532320084329

## Related

See also: `paulius-claude-code-expo-skills.md` in knowledge base for community Expo skills.
