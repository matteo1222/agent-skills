---
name: fly-logs
description: Stream and search Fly.io application logs with filtering by instance, region, and time range.
---

# Fly Logs

Stream and search logs from Fly.io applications.

## Setup

Requires `flyctl` CLI. Check if installed:
```bash
fly version
```

If not installed:
```bash
brew install flyctl
```

Authenticate if needed:
```bash
fly auth login
```

## Usage

### Stream Live Logs

```bash
# Current directory app
fly logs

# Specific app
fly logs -a <app-name>

# Follow mode (default, Ctrl+C to stop)
fly logs -a <app-name>
```

### Filter by Instance/Region

```bash
# Specific instance
fly logs -a <app-name> -i <instance-id>

# Specific region
fly logs -a <app-name> -r <region>
```

### Historical Logs

```bash
# Don't follow, just show recent logs
fly logs -a <app-name> --no-tail
```

### JSON Output

```bash
# Machine-readable output
fly logs -a <app-name> --json
```

## Common Workflows

### Debug a Crashing App

```bash
# 1. Check recent logs
fly logs -a myapp --no-tail

# 2. Stream while reproducing issue
fly logs -a myapp
```

### Monitor Specific Instance

```bash
# 1. List instances
fly status -a myapp

# 2. Tail specific instance
fly logs -a myapp -i <instance-id>
```

### Export Logs for Analysis

```bash
fly logs -a myapp --no-tail --json > logs.json
```

## Output Format

Default format: `timestamp region instance level message`

Example:
```
2024-01-15T10:30:45Z [info] Starting server on port 8080
2024-01-15T10:30:46Z [warn] Connection pool approaching limit
```

## Tips

- Use `fly status -a <app>` to find instance IDs and regions
- Logs are retained for 7 days by default
- For persistent logging, configure a log drain: `fly logs drain create`
