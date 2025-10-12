# 🤖 Droidusage - Factory AI Usage Analytics

**Comprehensive usage analytics and cost tracking for Factory AI sessions**

Droidusage is a powerful CLI tool and web dashboard for analyzing Factory AI usage patterns, costs, and efficiency. Track your AI spending, identify optimization opportunities, and gain deep insights into your usage patterns.

## 🌟 Features

### 📊 **Comprehensive Analysis**
- **Cost Analysis**: Track spending by model and provider, calculate burn rates, identify cost optimization opportunities
- **Usage Patterns**: Discover peak hours, busiest days, session duration patterns, and usage spikes
- **Efficiency Metrics**: Calculate efficiency scores, analyze cache utilization, identify value leaders
- **Trend Analysis**: Compare current vs previous periods with percentage changes and trend indicators

### 💻 **Dual Interface**
- **CLI**: Powerful command-line interface with formatted tables and charts
- **Web Dashboard**: Modern, responsive web interface with auto-refresh and interactive visualizations

### 🚀 **Performance Optimized**
- Parallel batch processing for 1000+ sessions
- Smart log caching for faster analysis
- In-memory aggregation for sub-5-second analysis times

Stop manual spreadsheet tracking and start making data-driven decisions about your AI usage!

## 📦 Installation

```bash
npm install -g droidusage
```

Or use directly with npx:
```bash
npx droidusage
```

## 🚀 Quick Start

### CLI Usage

```bash
# View daily usage summary
droidusage daily

# View with trends compared to previous period
droidusage daily --trends

# Analyze top expensive sessions
droidusage top --by cost --limit 10

# Run comprehensive analysis
droidusage analyze --all

# Filter by date range
droidusage daily --since 2024-01-01 --until 2024-01-31
```

### Web Dashboard

```bash
# Launch interactive web dashboard
droidusage --web

# Specify custom port
droidusage --web --port 3500
```

The dashboard will automatically open in your browser at `http://localhost:3000`

## 📖 Commands

### Basic Commands

| Command | Description |
|---------|-------------|
| `droidusage daily` | Show daily usage grouped by model |
| `droidusage sessions` | List all sessions with details |
| `droidusage top` | Show top sessions by cost, tokens, or duration |
| `droidusage analyze` | Run comprehensive analysis |
| `droidusage --web` | Launch web dashboard |

### Analysis Commands

```bash
# Cost analysis
droidusage analyze --cost

# Usage pattern analysis
droidusage analyze --patterns

# Efficiency analysis
droidusage analyze --efficiency

# Run all analyses
droidusage analyze --all
```

### Advanced Options

| Option | Description |
|--------|-------------|
| `--since <date>` | Filter sessions since date (YYYY-MM-DD) |
| `--until <date>` | Filter sessions until date (YYYY-MM-DD) |
| `--trends` | Show trend analysis vs previous period |
| `--blocks` | Group sessions into 5-hour blocks |
| `--by <criteria>` | Sort by: cost, tokens, duration, inefficient, outliers |
| `--limit <number>` | Number of results to show |
| `--json` | Output as JSON |

## 📊 Analysis Features

### Cost Analysis
- **Burn Rate Tracking**: Daily, weekly, monthly, and annual projections
- **Model Comparison**: Cost per million tokens by model
- **Provider Breakdown**: Spending by AI provider
- **Cost Distribution**: Input, output, cache read, and cache write costs
- **Trend Detection**: Identify cost spikes and patterns

### Pattern Analysis
- **Peak Hours**: Identify busiest times of day
- **Day of Week Patterns**: Find busiest days
- **Session Duration**: Analyze session length patterns and anomalies
- **Model Preferences**: See which models are used when
- **Usage Spikes**: Detect days with unusual activity

### Efficiency Analysis
- **Efficiency Scores**: 0-100 score based on output per dollar
- **Cache Utilization**: Track prompt cache hit rates
- **Cost Per Token**: Compare models and find most efficient
- **Value Leaders**: Identify best-performing sessions
- **Recommendations**: Get actionable optimization suggestions

### Cross-Analyzer Insights
The orchestrator correlates findings across all analyzers to surface deeper insights:
- Cost and timing correlations
- Efficiency and spending patterns
- Duration and efficiency relationships

## 🌐 Web Dashboard

The web dashboard provides an interactive, visual interface for analyzing your usage data with 5 main pages:

### Overview Page
- Executive summary cards (total cost, tokens, sessions, averages)
- Quick stats at a glance
- Recent activity overview

### Cost Analysis Page
- Cost breakdown by model and provider
- Burn rate projections (daily, weekly, monthly, annual)
- Cost trends over time with interactive charts
- Token cost distribution (input/output/cache)

### Usage Patterns Page
- Peak hour analysis with hourly distribution
- Busiest days with visual highlights
- Session duration patterns
- Model preference by time of day
- Usage spike detection

### Efficiency Analysis Page
- Efficiency score comparisons by model
- Cache utilization rates
- Cost per token analysis
- Value leader identification
- Actionable recommendations

### Top Sessions Page
- Sortable table of sessions
- Filter by cost, tokens, duration
- Session efficiency scores
- Warning indicators for expensive or long sessions

### Dashboard Features
- 🎨 **Dark Mode**: Toggle between light and dark themes
- 🔄 **Auto-Refresh**: Data updates every 60 seconds
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 📊 **Interactive Charts**: Powered by Chart.js
- ⚡ **Fast**: Sub-3-second load times

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is already in use, droidusage will automatically try ports 3001-3999. You can also specify a custom port:
```bash
droidusage --web --port 3500
```

### Browser Not Opening
If the browser doesn't open automatically, manually navigate to the URL shown in the console (e.g., `http://localhost:3000`).

### No Sessions Found
Make sure your Factory AI sessions directory exists. Default location:
- **macOS/Linux**: `~/.factoryai/sessions`
- **Windows**: `%USERPROFILE%\.factoryai\sessions`

Specify a custom directory:
```bash
droidusage daily --dir /path/to/sessions
```

### Empty or Incomplete Data
If data looks incomplete:
1. Check that session files are valid JSON
2. Ensure log files exist in `~/.factoryai/logs/droid-log-single.log`
3. Try refreshing the dashboard or re-running the CLI command

### Performance Issues
For slow analysis with many sessions (>1000):
- The tool uses parallel batch processing (50 sessions/batch)
- Analysis should complete in <5 seconds for 1000 sessions
- If slower, check disk I/O and available memory

    ![Example of generating tasks from PRD](https://pbs.twimg.com/media/Go6FITbWkAA-RCT?format=jpg&name=medium)

### 3️⃣ Examine Your Task List

You'll now have a well-structured task list, often with tasks and sub-tasks, ready for the AI to start working on. This provides a clear roadmap for implementation.

![Example of a generated task list](https://pbs.twimg.com/media/Go6GNuOWsAEcSDm?format=jpg&name=medium)

### 4️⃣ Instruct the AI to Work Through Tasks (and Mark Completion)

To ensure methodical progress and allow for verification, we'll use `process-task-list.md`. This command instructs the AI to focus on one task at a time and wait for your go-ahead before moving to the next.

1. Create or ensure you have the `process-task-list.md` file accessible.
2. In your AI tool, tell the AI to start with the first task (e.g., `1.1`):

    ```text
    Please start on task 1.1 and use @process-task-list.md
    ```
    *(Important: You only need to reference `@process-task-list.md` for the *first* task. The instructions within it guide the AI for subsequent tasks.)*

    The AI will attempt the task and then prompt you to review.

    ![Example of starting on a task with process-task-list.md](https://pbs.twimg.com/media/Go6I41KWcAAAlHc?format=jpg&name=medium)

### 5️⃣ Review, Approve, and Progress ✅

As the AI completes each task, you review the changes.

* If the changes are good, simply reply with "yes" (or a similar affirmative) to instruct the AI to mark the task complete and move to the next one.
* If changes are needed, provide feedback to the AI to correct the current task before moving on.

You'll see a satisfying list of completed items grow, providing a clear visual of your feature coming to life!

![Example of a progressing task list with completed items](https://pbs.twimg.com/media/Go6KrXZWkAA_UuX?format=jpg&name=medium)

While it's not always perfect, this method has proven to be a very reliable way to build out larger features with AI assistance.

### Video Demonstration 🎥

If you'd like to see this in action, I demonstrated it on [Claire Vo's "How I AI" podcast](https://www.youtube.com/watch?v=fD4ktSkNCw4).

![Demonstration of AI Dev Tasks on How I AI Podcast](https://img.youtube.com/vi/fD4ktSkNCw4/maxresdefault.jpg)

## 🗂️ Files in this Repository

* **`create-prd.md`**: Guides the AI in generating a Product Requirement Document for your feature.
* **`generate-tasks.md`**: Takes a PRD markdown file as input and helps the AI break it down into a detailed, step-by-step implementation task list.
* **`process-task-list.md`**: Instructs the AI on how to process the generated task list, tackling one task at a time and waiting for your approval before proceeding. (This file also contains logic for the AI to mark tasks as complete).

## 🌟 Benefits

* **Structured Development:** Enforces a clear process from idea to code.
* **Step-by-Step Verification:** Allows you to review and approve AI-generated code at each small step, ensuring quality and control.
* **Manages Complexity:** Breaks down large features into smaller, digestible tasks for the AI, reducing the chance of it getting lost or generating overly complex, incorrect code.
* **Improved Reliability:** Offers a more dependable approach to leveraging AI for significant development work compared to single, large prompts.
* **Clear Progress Tracking:** Provides a visual representation of completed tasks, making it easy to see how much has been done and what's next.

## 🛠️ How to Use

1. **Clone or Download:** Get these `.md` files into your project or a central location where your AI tool can access them.
   ```bash
   git clone https://github.com/snarktank/ai-dev-tasks.git
   ```
2. **Follow the Workflow:** Systematically use the `.md` files in your AI assistant as described in the workflow above.
3. **Adapt and Iterate:**
    * Feel free to modify the prompts within the `.md` files to better suit your specific needs or coding style.
    * If the AI struggles with a task, try rephrasing your initial feature description or breaking down tasks even further.

## Tool-Specific Instructions

### Cursor

Cursor users can follow the workflow described above, using the `.md` files directly in the Agent chat:

1. Ensure you have the files from this repository accessible
2. In Cursor's Agent chat, reference files with `@` (e.g., `@create-prd.md`)
3. Follow the 5-step workflow as outlined above
4. **MAX Mode for PRDs:** Using MAX mode in Cursor for PRD creation can yield more thorough results if your budget supports it

### Claude Code

To use these tools with Claude Code:

1. **Copy files to your repo**: Copy the three `.md` files to a subdirectory in your project (e.g., `/ai-dev-tasks`)

2. **Reference in CLAUDE.md**: Add these lines to your project's `./CLAUDE.md` file:
   ```
   # AI Dev Tasks
   Use these files when I request structured feature development using PRDs:
   /ai-dev-tasks/create-prd.md
   /ai-dev-tasks/generate-tasks.md
   /ai-dev-tasks/process-task-list.md
   ```

3. **Create custom commands** (optional): For easier access, create these files in `.claude/commands/`:
   - `.claude/commands/create-prd.md` with content:
     ```
     Please use the structured workflow in /ai-dev-tasks/create-prd.md to help me create a PRD for a new feature.
     ```
   - `.claude/commands/generate-tasks.md` with content:
     ```
     Please generate tasks from the PRD using /ai-dev-tasks/generate-tasks.md
     If not explicitly told which PRD to use, generate a list of PRDs and ask the user to select one under `/tasks` or create a new one using `create-prd.md`:
     - assume it's stored under `/tasks` and has a filename starting with `[n]-prd-` (e.g., `0001-prd-[name].md`)
     - it should not already have a corresponding task list in `/tasks` (e.g., `tasks-0001-prd-[name].md`)
     - **always** ask the user to confirm the PRD file name before proceeding
     Make sure to provide options in number lists so I can respond easily (if multiple options).
     ```
   - `.claude/commands/process-task-list.md` with content:
     ```
     Please process the task list using /ai-dev-tasks/process-task-list.md
     ```

   Make sure to restart Claude Code after adding these files (`/exit`).
   Then use commands like `/create-prd` to quickly start the workflow.
   Note: This setup can also be adopted for a global level across all your projects, please refer to the Claude Code documentation [here](https://docs.anthropic.com/en/docs/claude-code/memory) and [here](https://docs.anthropic.com/en/docs/claude-code/common-workflows#create-personal-slash-commands).

### Other Tools

For other AI-powered IDEs or CLIs:

1. Copy the `.md` files to your project
2. Reference them according to your tool's documentation
3. Follow the same workflow principles

## 💡 Tips for Success

* **Be Specific:** The more context and clear instructions you provide (both in your initial feature description and any clarifications), the better the AI's output will be.
* **Use a Capable Model:** The free version of Cursor currently uses less capable AI models that often struggle to follow the structured instructions in this workflow. For best results, consider upgrading to the Pro plan to ensure consistent, accurate task execution.
* **MAX Mode for PRDs:** As mentioned, using MAX mode in Cursor for PRD creation (`create-prd.mdc`) can yield more thorough and higher-quality results if your budget supports it.
* **Correct File Tagging:** Always ensure you're accurately tagging the PRD filename (e.g., `@MyFeature-PRD.md`) when generating tasks.
* **Patience and Iteration:** AI is a powerful tool, but it's not magic. Be prepared to guide, correct, and iterate. This workflow is designed to make that iteration process smoother.

## 🤝 Contributing

Got ideas to improve these `.md` files or have new ones that fit this workflow? Contributions are welcome!

Please feel free to:

* Open an issue to discuss changes or suggest new features.
* Submit a pull request with your enhancements.

---

Happy AI-assisted developing!
