# Droid Forge - One-Shot Mode Setup

This project has been configured with Droid Forge One-Shot Autonomous Execution Mode.

## Quick Start

### 1. Prerequisites

Ensure you have the Factory.ai CLI installed:
```bash
# Check if installed
droid --version

# If not installed, visit:
# https://docs.factory.ai/cli/getting-started/quickstart
```

### 2. Using One-Shot Mode

Start the manager orchestrator and select "one-shot" when prompted:

```bash
droid
> Ask manager-orchestrator-droid-forge to execute my tasks
```

When asked about execution mode, respond with **"one-shot"** for autonomous execution.

### 3. Configuration

Review and customize `droid-forge.yaml` for your project:
- Adjust delegation rules
- Configure git workflow patterns
- Set quality gate thresholds
- Customize one-shot mode settings

### 4. Creating Tasks

1. Copy the template:
   ```bash
   cp tasks/template.md tasks/my-feature.md
   ```

2. Edit your task file with specific requirements

3. Run the manager orchestrator to execute tasks

## Files Installed

- `.factory/droids/` - All Droid Forge droids
- `tools/` - Execution tools and utilities
- `tests/` - Test framework
- `tasks/` - Task directory (with template)
- `droid-forge.yaml` - Configuration
- `AGENTS.md` - Coding guidelines for AI agents
- `DROID-FORGE-SETUP.md` - This file

## Documentation

- **AGENTS.md** - Complete guide for AI agents using Droid Forge
- **droid-forge.yaml** - Configuration reference with comments

## Support

For issues or questions:
- GitHub: https://github.com/tgerighty/Droid-Forge
- Docs: See AGENTS.md for comprehensive usage guide

## What is One-Shot Mode?

One-Shot Mode enables fully autonomous task execution:
- No confirmation prompts between sub-tasks
- Automatic test generation and execution
- Quality gate enforcement (linting, security, coverage)
- Auto-commit and push after each sub-task
- Automated PR creation and iterative review
- Error recovery with retry logic

Perfect for well-defined features where you want complete automation!
