\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Harness capabilities

An agent harness is a combination of several different capabilities that make building long-running agents easier:

\* \[Planning capabilities\](\#planning-capabilities)  
\* \[Virtual filesystem\](\#virtual-filesystem-access)  
\* \[Task delegation (subagents)\](\#task-delegation-subagents)  
\* \[Context and token management\](\#context-management)  
\* \[Code execution\](\#code-execution)  
\* \[Human-in-the-loop\](\#human-in-the-loop)

Alongside these capabilities, Deep Agents use \[Skills\](\#skills) and \[Memory\](\#memory) for additional context and instructions.

\#\# Planning capabilities

The harness provides a \`write\_todos\` tool that agents can use to maintain a structured task list.

\*\*Features:\*\*

\* Track multiple tasks with statuses (\`'pending'\`, \`'in\_progress'\`, \`'completed'\`)  
\* Persisted in agent state  
\* Helps agent organize complex multi-step work  
\* Useful for long-running tasks and planning

\#\# Virtual filesystem access

The harness provides a configurable virtual filesystem which can be backed by different pluggable backends.  
The backends support the following file system operations:

| Tool         | Description                                                                                                                                                                                                              |  
| \------------ | \------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |  
| \`ls\`         | List files in a directory with metadata (size, modified time)                                                                                                                                                            |  
| \`read\_file\`  | Read file contents with line numbers, supports offset/limit for large files. Also supports returning multimodal content blocks for non-text files (images, video, audio, and documents). See supported extensions below. |  
| \`write\_file\` | Create new files                                                                                                                                                                                                         |  
| \`edit\_file\`  | Perform exact string replacements in files (with global replace mode)                                                                                                                                                    |  
| \`glob\`       | Find files matching patterns (e.g., \`\*\*/\*.py\`)                                                                                                                                                                           |  
| \`grep\`       | Search file contents with multiple output modes (files only, content with context, or counts)                                                                                                                            |  
| \`execute\`    | Run shell commands in the environment (available with \[sandbox backends\](/oss/python/deepagents/sandboxes) only)                                                                                                         |

\<Accordion title="Supported multimodal file extensions"\>  
  | Type                                                                 | Extensions                                                                |  
  | \-------------------------------------------------------------------- | \------------------------------------------------------------------------- |  
  | \[Image\](/oss/python/langchain/messages\#multimodal:imagecontentblock) | \`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\`, \`.webp\`, \`.heic\`, \`.heif\`                |  
  | \[Video\](/oss/python/langchain/messages\#multimodal:videocontentblock) | \`.mp4\`, \`.mpeg\`, \`.mov\`, \`.avi\`, \`.flv\`, \`.mpg\`, \`.webm\`, \`.wmv\`, \`.3gpp\` |  
  | \[Audio\](/oss/python/langchain/messages\#multimodal:audiocontentblock) | \`.wav\`, \`.mp3\`, \`.aiff\`, \`.aac\`, \`.ogg\`, \`.flac\`                          |  
  | \[File\](/oss/python/langchain/messages\#multimodal:filecontentblock)   | \`.pdf\`, \`.ppt\`, \`.pptx\`                                                   |  
\</Accordion\>

The virtual filesystem is used by several other harness capabilities such as skills, memory, code execution, and context management.  
You can also use the file system when building custom tools and middleware for Deep Agents.

For more information, see \[backends\](/oss/python/deepagents/backends).

\#\# Task delegation (subagents)

The harness allows the main agent to create ephemeral "subagents" for isolated multi-step tasks.

\*\*Why it's useful:\*\*

\* \*\*Context isolation\*\* \- Subagent's work doesn't clutter main agent's context  
\* \*\*Parallel execution\*\* \- Multiple subagents can run concurrently  
\* \*\*Specialization\*\* \- Subagents can have different tools/configurations  
\* \*\*Token efficiency\*\* \- Large subtask context is compressed into a single result

\*\*How it works:\*\*

\* Main agent has a \`task\` tool  
\* When invoked, it creates a fresh agent instance with its own context  
\* Subagent executes autonomously until completion  
\* Returns a single final report to the main agent  
\* Subagents are stateless (can't send multiple messages back)

\*\*Default subagent:\*\*

\* "general-purpose" subagent automatically available  
\* Has filesystem tools by default  
\* Can be customized with additional tools/middleware

\*\*Custom subagents:\*\*

\* Define specialized subagents with specific tools  
\* Example: code-reviewer, web-researcher, test-runner  
\* Configure via \`subagents\` parameter

\#\# Context management

The harness manages context so deep agents can handle long-running tasks within token limits while retaining the information they need.

\*\*How it works:\*\*

\* \*\*Input context\*\* — System prompt, memory, skills, and tool prompts shape what the agent knows at startup  
\* \*\*Compression\*\* — Built-in offloading and summarization keep context within window limits as tasks progress  
\* \*\*Isolation\*\* — Subagents quarantine heavy work and return only results (see \[Task delegation\](\#task-delegation-subagents))  
\* \*\*Long-term memory\*\* — Persistent storage across threads via the virtual filesystem

\*\*Why it's useful:\*\*

\* Enables multi-step tasks that exceed a single context window  
\* Keeps the most relevant information in scope without manual trimming  
\* Reduces token usage through automatic summarization and offloading

For configuration details, see \[Context engineering\](/oss/python/deepagents/context-engineering).

\#\# Code execution

When you use a \[sandbox backend\](/oss/python/deepagents/sandboxes), the harness exposes an \`execute\` tool that lets the agent run shell commands in an isolated environment. This enables the agent to install dependencies, run scripts, and execute code as part of its task.

\*\*How it works:\*\*

\* Sandbox backends implement the \`SandboxBackendProtocolV2\` — when detected, the harness adds the \`execute\` tool to the agent's available tools  
\* Without a sandbox backend, the agent only has filesystem tools (\`read\_file\`, \`write\_file\`, etc.) and cannot run commands  
\* The \`execute\` tool returns combined stdout/stderr, exit code, and truncates large outputs (saving to a file for the agent to read incrementally)

\*\*Why it's useful:\*\*

\* \*\*Security\*\* — Code runs in isolation, protecting your host system from the agent's operations  
\* \*\*Clean environments\*\* — Use specific dependencies or OS configurations without local setup  
\* \*\*Reproducibility\*\* — Consistent execution environments across teams

For setup, providers, and file transfer APIs, see \[Sandboxes\](/oss/python/deepagents/sandboxes).

\#\# Human-in-the-loop

The harness can pause agent execution at specified tool calls to allow human approval or modification. This feature is opt-in via the \`interrupt\_on\` parameter.

\*\*Configuration:\*\*

\* Pass \`interrupt\_on\` to \`create\_deep\_agent\` with a mapping of tool names to interrupt configurations  
\* Example: \`interrupt\_on={"edit\_file": True}\` pauses before every edit  
\* You can provide approval messages or modify tool inputs when prompted

\*\*Why it's useful:\*\*

\* Safety gates for destructive operations  
\* User verification before expensive API calls  
\* Interactive debugging and guidance

\#\# Skills

The harness supports skills that provide specialized workflows and domain knowledge to your deep agent.

\*\*How it works:\*\*

\* Skills follow the \[Agent Skills standard\](https://agentskills.io/)  
\* Each skill is a directory containing a \`SKILL.md\` file with instructions and metadata  
\* Skills can include additional scripts, reference docs, templates, and other resources  
\* Skills use progressive disclosure—they are only loaded when the agent determines they're useful for the current task  
\* Agent reads frontmatter from each \`SKILL.md\` file at startup, then reviews full skill content when needed

\*\*Why it's useful:\*\*

\* Reduces token usage by only loading relevant skills when needed  
\* Bundles capabilities together into larger actions with additional context  
\* Provides specialized expertise without cluttering the system prompt  
\* Enables modular, reusable agent capabilities

For more information, see \[Skills\](/oss/python/deepagents/skills).

\#\# Memory

The harness supports persistent memory files that provide extra context to your deep agent across conversations.  
These files often contain general coding style, preferences, conventions, and guidelines that help the agent understand how to work with your codebase and follow your preferences.

\*\*How it works:\*\*

\* Uses \[\`AGENTS.md\` files\](https://agents.md/) to provide persistent context  
\* Memory files are always loaded (unlike skills, which use progressive disclosure)  
\* Pass one or more file paths to the \`memory\` parameter when creating your agent  
\* Files are stored in the agent's backend (StateBackend, StoreBackend, or FilesystemBackend)  
\* The agent can update memory based on your interactions, feedback, and identified patterns

\*\*Why it's useful:\*\*

\* Provides persistent context that doesn't need to be re-specified each conversation  
\* Useful for storing user preferences, project guidelines, or domain knowledge  
\* Always available to the agent, ensuring consistent behavior

For configuration details and examples, see \[Memory\](/oss/python/deepagents/customization\#memory).

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/harness.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Context engineering in Deep Agents

\> Control what context your deep agent has access to and how it is managed across long-running tasks

Context engineering is providing the right information and tools in the right format so your deep agent can accomplish tasks reliably.

Deep agents have access to several kinds of context.  
Some sources are provided to the agent at startup; others become available during runtime, such as user input.  
Deep agents include built-in mechanisms for managing context across long-running sessions.

This page provides an overview of the different kinds of context your deep agent has access to and manages.

\<Tip\>  
  New to context engineering? See the \[conceptual overview\](/oss/python/concepts/context) for the different types of context and when to use them.  
\</Tip\>

\#\# Types of context

| Context Type                                               | What You Control                                                                  | Scope                             |  
| \---------------------------------------------------------- | \--------------------------------------------------------------------------------- | \--------------------------------- |  
| \*\*\[Input context\](\#input-context)\*\*                        | What goes into the agent's prompt at startup (system prompt, memory, skills)      | Static, applied each run          |  
| \*\*\[Runtime context\](\#runtime-context)\*\*                    | Static configuration passed at invoke time (user metadata, API keys, connections) | Per run, propagates to subagents  |  
| \*\*\[Context compression\](\#context-compression)\*\*            | Built-in offloading and summarization to keep context within window limits        | Automatic, when limits approached |  
| \*\*\[Context isolation\](\#context-isolation-with-subagents)\*\* | Use subagents to quarantine heavy work, returning only results to the main agent  | Per subagent, when delegated      |  
| \*\*\[Long-term memory\](\#long-term-memory)\*\*                  | Persistent storage across threads using the virtual filesystem                    | Persistent across conversations   |

\#\# Input context

Input context is information provided to your deep agent at startup that becomes part of its system prompt. The final prompt consists of several sources:

\<CardGroup cols={2}\>  
  \<Card title="System prompt" icon="message-2" href="\#system-prompt"\>  
    Custom instructions you provide plus built-in agent guidance.  
  \</Card\>

  \<Card title="Memory" icon="database" href="\#memory"\>  
    Persistent \`AGENTS.md\` files always loaded when configured.  
  \</Card\>

  \<Card title="Skills" icon="tool" href="\#skills"\>  
    On-demand capabilities loaded when relevant (progressive disclosure).  
  \</Card\>

  \<Card title="Tool prompts" icon="list" href="\#tool-prompts"\>  
    Instructions for using built-in tools or custom tools.  
  \</Card\>  
\</CardGroup\>

\#\#\# System prompt

Your custom system prompt is prepended to the built-in system prompt, which includes guidance for planning, filesystem tools, and subagents. Use it to define the agent's role, behavior, and knowledge:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    system\_prompt=(  
        "You are a research assistant specializing in scientific literature. "  
        "Always cite sources. Use subagents for parallel research on different topics."  
    ),  
)  
\`\`\`

The \`system\_prompt\` parameter is static which means it does not change per invocation.  
For some use cases you may want a dynamic prompt: for example, to tell the model "You have admin access" vs "You have read-only access," or to inject user preferences like "User prefers concise responses" from \[long-term memory\](\#long-term-memory).  
If your prompt depends on context or \`runtime.store\`, use \`@dynamic\_prompt\` to build context-aware instructions. Your middleware can read \`request.runtime.context\` and \`request.runtime.store\`.  
See \[Customization\](/oss/python/deepagents/customization\#middleware) for adding \[custom middleware\](/oss/python/langchain/middleware) and the \[LangChain context engineering\](/oss/python/langchain/context-engineering\#system-prompt) guide for examples.

You do \*\*not\*\* need middleware when tools alone use context or \`runtime.store\`; tools receive the \[ToolRuntime\](https://reference.langchain.com/python/langchain/tools/\#langchain.tools.ToolRuntime) object (including \`runtime.context\` and \`runtime.store\`) directly. Add middleware only when tools should be packaged with an update to the system prompt.

\#\#\# Memory

Memory files (\[\`AGENTS.md\`\](https://agents.md/)) provide persistent context that is \*\*always loaded\*\* into the system prompt. Use memory for project conventions, user preferences, and critical guidelines that should apply to every conversation:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    memory=\["/project/AGENTS.md", "\~/.deepagents/preferences.md"\],  
)  
\`\`\`

Unlike skills, memory is always injected—there is no progressive disclosure. Keep memory minimal to avoid context overload; use \[skills\](/oss/python/deepagents/skills) for detailed workflows and domain-specific content. See \[Memory\](/oss/python/deepagents/customization\#memory) for configuration details.

\#\#\# Skills

Skills provide \*\*on-demand\*\* capabilities. The agent reads frontmatter from each \`SKILL.md\` at startup, then loads full skill content only when it determines the skill is relevant. This reduces token usage while still providing specialized workflows:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    skills=\["/skills/research/", "/skills/web-search/"\],  
)  
\`\`\`

Keep each skill focused on a single workflow or domain; broad or overlapping skills dilute relevance and bloat context when loaded. Within a skill, keep the main content concise and move detailed reference material to separate files that are referenced in the skill file. Put always-relevant conventions in \[memory\](\#memory). See \[Skills\](/oss/python/deepagents/skills) for authoring and configuration.

\#\#\# Tool prompts

\[Tool\](/oss/python/langchain/tools) prompts are instructions that shape how the model uses tools. All tools expose metadata the model sees in its prompt—typically a schema and a description. Tools you pass via the \`tools\` parameter surface that tool metadata (schema and descriptions) to the model. Deep Agents built-in tools are packaged in middleware and typically also update the system prompt with more guidance for those tools.

\*\*Built-in tools\*\* – Middleware that adds harness capabilities (planning, filesystem, subagents) automatically appends tool-specific instructions to the system prompt, creating tool prompts that explain how to use those tools effectively:

\* Planning prompt – Instructions for \`write\_todos\` to maintain a structured task list  
\* Filesystem prompt – Documentation for \`ls\`, \`read\_file\`, \`write\_file\`, \`edit\_file\`, \`glob\`, \`grep\` (and \`execute\` when using a sandbox backend)  
\* Subagent prompt – Guidance for delegating work with the \`task\` tool  
\* Human-in-the-loop prompt – Usage for pausing at specified tool calls (when \`interrupt\_on\` is set)  
\* Local context prompt – Current directory and project info (CLI only)

\*\*Tools you provide\*\* – Tools passed via the \`tools\` parameter get their descriptions (from the tool schema) sent to the model. You can also add \[custom middleware\](/oss/python/langchain/middleware) that adds tools and appends its own system prompt instructions.

For tools you provide, make sure to provide a clear name, description, and argument descriptions. These guide the model's reasoning about when and how to use the tool. Include \*when\* to use the tool in the description and describe what each argument does.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
@tool(parse\_docstring=True)  
def search\_orders(  
    user\_id: str,  
    status: str,  
    limit: int \= 10  
) \-\> str:  
    """Search for user orders by status.

    Use this when the user asks about order history or wants to check  
    order status. Always filter by the provided status.

    Args:  
        user\_id: Unique identifier for the user  
        status: Order status: 'pending', 'shipped', or 'delivered'  
        limit: Maximum number of results to return  
    """  
    \# Implementation here  
    ...  
\`\`\`

See \[Harness\](/oss/python/deepagents/harness) for built-in capabilities and \[Customization\](/oss/python/deepagents/customization\#tools) for passing tools directly.

\#\#\# Complete system prompt

The deep agent's system message—the assembled system prompt the model receives at the start of a run—consists of the following parts:

1\. Custom \`system\_prompt\` (if provided)  
2\. \[Base agent prompt\](https://github.com/langchain-ai/deepagents/blob/e18e9dcd0e6edc72c0a4a5b76ae752c4bc539752/libs/deepagents/deepagents/graph.py\#L37)  
3\. To-do list prompt: Instructions for how to plan with to do lists  
4\. Memory prompt: \`AGENTS.md\` \+ memory usage guidelines (only when \`memory\` provided)  
5\. Skills prompt: Skills locations \+ list of skills with frontmatter information \+ usage (only when skills provided)  
6\. Virtual filesystem prompt (filesystem \+ execute tool docs if applicable)  
7\. Subagent prompt: Task tool usage  
8\. User-provided middleware prompts (if custom middleware is provided)  
9\. Human-in-the-loop prompt (when \`interrupt\_on\` is set)

\#\# Runtime context

Runtime context is per-run configuration you pass when you invoke the agent. It is not automatically included in the model prompt; the model only sees it if a tool, middleware, or other logic reads it and adds it to messages or the system prompt. Use runtime context for user metadata (IDs, preferences, roles), API keys, database connections, feature flags, or other values your tools and harness need.

Define the shape of that data with \`context\_schema\`: use a \`dataclasses.dataclass\` or \`typing.TypedDict\` class. Pass values with the \*\*\`context\`\*\* argument to \`invoke\` / \`ainvoke\`. See \[Runtime\](/oss/python/langchain/runtime) and \[LangGraph runtime context\](/oss/python/langgraph/graph-api\#runtime-context) for full detail.

Inside tools, read context from the injected \[ToolRuntime\](https://reference.langchain.com/python/langchain/tools/\#langchain.tools.ToolRuntime):

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from dataclasses import dataclass

from deepagents import create\_deep\_agent  
from langchain.tools import tool, ToolRuntime

@dataclass  
class Context:  
    user\_id: str  
    api\_key: str

@tool  
def fetch\_user\_data(query: str, runtime: ToolRuntime\[Context\]) \-\> str:  
    """Fetch data for the current user."""  
    user\_id \= runtime.context.user\_id  
    return f"Data for user {user\_id}: {query}"

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    tools=\[fetch\_user\_data\],  
    context\_schema=Context,  
)

result \= agent.invoke(  
    {"messages": \[{"role": "user", "content": "Get my recent activity"}\]},  
    context=Context(user\_id="user-123", api\_key="sk-..."),  
)  
\`\`\`

Runtime context \*\*propagates to all subagents\*\*. When a subagent runs, it receives the same runtime context as the parent. See \[Subagents\](/oss/python/deepagents/subagents\#context-management) for per-subagent context (namespaced keys).

\#\# Context compression

Long-running tasks produce large tool outputs and long conversation history.  
Context compression reduces the size of information in an agent's working memory while preserving details relevant to the task.  
The following techniques are the built-in mechanisms to ensure the context passed to LLMs stays within its context window limit:

\<CardGroup cols={2}\>  
  \<Card title="Offloading" icon="file-export" href="\#offloading"\>  
    Large tool inputs and results are stored in the filesystem and replaced with references.  
  \</Card\>

  \<Card title="Summarization" icon="article" href="\#summarization"\>  
    Old messages are compressed into an LLM-generated summary when limits are approached.  
  \</Card\>  
\</CardGroup\>

\#\#\# Offloading

Deep Agents use the \[built-in filesystem tools\](\#virtual-filesystem-access) to automatically offload content and to search and retrieve that offloaded content as needed.  
Content offloading happens when tool call inputs or results exceed a token threshold (default 20,000):

1\. \*\*Tool call inputs exceed 20,000 tokens\*\*: File write and edit operations leave behind tool calls containing the complete file content in the agent's conversation history.  
   Since this content is already persisted to the filesystem, it's often redundant.  
   As the session context crosses 85% of the model's available window, deep agents truncate older tool calls, replacing them with a pointer to the file on disk and reducing the size of the active context.

   \<img src="https://mintcdn.com/langchain-5e9cc07a/0G7fpRWZQ2tFN1wL/oss/images/deepagents/offloading-inputs.png?fit=max\&auto=format\&n=0G7fpRWZQ2tFN1wL\&q=85\&s=fa18372080684d661965ea6f5ed1edd0" alt="An example of offloading showing a large input which is saved to disk and the truncated version is used for the tool call" width="1091" height="814" data-path="oss/images/deepagents/offloading-inputs.png" /\>

2\. \*\*Tool call results exceed 20,000 tokens\*\*: When this occurs, the deep agent offloads the response to the configured backend and substitutes it with a file path reference and a preview of the first 10 lines. Agents can then re-read or search the content as needed.

   \<img src="https://mintcdn.com/langchain-5e9cc07a/0G7fpRWZQ2tFN1wL/oss/images/deepagents/offloading-results.png?fit=max\&auto=format\&n=0G7fpRWZQ2tFN1wL\&q=85\&s=11f3da2f37cae63b8aa4c440549f1a67" alt="An example of offloading showing a large tool response that is replaced with a message about the location of the offloaded results and the first 10 lines of the result" width="1360" height="922" data-path="oss/images/deepagents/offloading-results.png" /\>

\#\#\# Summarization

When the context size crosses the model's context window limit (for example 85% of \`max\_input\_tokens\`), and there is no more context eligible for offloading, the deep agent summarizes the message history.

This process has two components:

\* \*\*In-context summary\*\*: An LLM generates a structured summary of the conversation including session intent, artifacts created, and next steps—which replaces the full conversation history in the agent's working memory.  
\* \*\*Filesystem preservation\*\*: The complete, original conversation messages are written to the filesystem as a canonical record.

This dual approach ensures the agent maintains awareness of its goals and progress (via the summary) while preserving the ability to recover specific details when needed (via filesystem search).

\<img src="https://mintcdn.com/langchain-5e9cc07a/0G7fpRWZQ2tFN1wL/oss/images/deepagents/summarization.png?fit=max\&auto=format\&n=0G7fpRWZQ2tFN1wL\&q=85\&s=a8fea59d4365dd688e49ce118e706e76" alt="An example of summarization showing an agent's conversation history, where several steps get compacted" width="1000" height="587" data-path="oss/images/deepagents/summarization.png" /\>

\*\*Configuration:\*\*

\* Triggers at 85% of the model's \`max\_input\_tokens\` from its \[model profile\](/oss/python/langchain/models\#model-profiles)  
\* Keeps 10% of tokens as recent context  
\* Falls back to 170,000-token trigger / 6 messages kept if model profile is unavailable  
\* If any model call raises a standard \[ContextOverflowError\](https://reference.langchain.com/python/langchain-core/exceptions/ContextOverflowError), Deep Agents immediately falls back to summarization and retries with summary \+ recent preserved messages  
\* Older messages are summarized by the model

\#\#\#\#\# Summarization Tool

Deep Agents includes an optional \[tool\](/oss/python/langchain/tools) for summarization, enabling agents to trigger summarization at opportune times—such as between tasks—instead of at fixed token intervals.

You can enable this tool by appending it to the middleware list:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent  
from deepagents.backends import StateBackend  
from deepagents.middleware.summarization import (  
    create\_summarization\_tool\_middleware,  
)

backend \= StateBackend  \# if using default backend

model \= "openai:gpt-5.4"  
agent \= create\_deep\_agent(  
    model=model,  
    middleware=\[  \# \[\!code highlight\]  
        create\_summarization\_tool\_middleware(model, backend),  \# \[\!code highlight\]  
    \],  \# \[\!code highlight\]  
)  
\`\`\`

Enabling this feature does not disable the default summarization action at 85% of the model's context limit.

See the \[\`SummarizationToolMiddleware\`\](https://reference.langchain.com/python/deepagents/middleware/summarization/SummarizationToolMiddleware) API reference for details.

\#\# Context isolation with subagents

Subagents solve the \*\*context bloat problem\*\*. When the main agent uses tools with large outputs (web search, file reads, database queries), the context window fills quickly. Subagents isolate this work—the main agent receives only the final result, not the dozens of tool calls that produced it. You can also configure each subagent separately from the main agent (for example, model, tools, system prompt, and skills).

\*\*How it works:\*\*

\* Main agent has a \`task\` tool to delegate work  
\* Subagent runs with its own fresh context  
\* Subagent executes autonomously until completion  
\* Subagent returns a single final report to the main agent  
\* Main agent's context stays clean

\*\*Best practices:\*\*

1\. \*\*Delegate complex tasks\*\*: Use subagents for multi-step work that would clutter the main agent's context.

2\. \*\*Keep subagent responses concise\*\*: Instruct subagents to return summaries, not raw data:

   \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
   research\_subagent \= {  
       "name": "researcher",  
       "description": "Conducts research on a topic",  
       "system\_prompt": """You are a research assistant.  
       IMPORTANT: Return only the essential summary (under 500 words).  
       Do NOT include raw search results or detailed tool outputs.""",  
       "tools": \[web\_search\],  
   }  
   \`\`\`

3\. \*\*Use the filesystem for large data\*\*: Subagents can write results to files; the main agent reads what it needs.

See \[Subagents\](/oss/python/deepagents/subagents) for configuration and \[context management\](/oss/python/deepagents/subagents\#context-management) for runtime context propagation and per-subagent namespacing.

\#\# Long-term memory

When using the default filesystem, your deep agent stores its working memory files in agent state, which only persists within a single thread.  
Long-term memory enables your deep agent to persist information across different threads and conversations.  
Deep agents can use long-term memory for storing user preferences, accumulated knowledge, research progress, or any information that should persist beyond a single session.

To use long-term memory, you must use a \`CompositeBackend\` that routes specific paths (typically \`/memories/\`) to a LangGraph Store, which provides durable cross-thread persistence.  
The \`CompositeBackend\` is a hybrid storage system where some files persist indefinitely while others remain scoped to a single thread.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent  
from deepagents.backends import CompositeBackend, StateBackend, StoreBackend  
from langgraph.store.memory import InMemoryStore

def make\_backend(runtime):  
    return CompositeBackend(  
        default=StateBackend(runtime),  
        routes={"/memories/": StoreBackend(runtime)},  
    )

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    store=InMemoryStore(),  
    backend=make\_backend,  
    system\_prompt="""When users tell you their preferences, save them to  
    /memories/user\_preferences.txt so you remember them in future conversations.""",  
)  
\`\`\`

You do not need to pre-populate \`/memories/\` with files.  
You provide the backend config, store, and system prompt instructions that tell the agent \*what\* to save and \*where\*.  
For example, you may prompt the agent to store preferences in \`/memories/preferences.txt\`.  
The path starts empty and the agent creates files on demand using its filesystem tools (\`write\_file\`, \`edit\_file\`) when users share information worth remembering.

To pre-seed memories, use the \[Store API\](/langsmith/custom-store) when deploying on LangSmith.  
See \[Long-term memory\](/oss/python/deepagents/memory) for setup and use cases.

\#\# Best practices

1\. \*\*Start with the right input context\*\* – Keep memory minimal for always-relevant conventions; use focused skills for task-specific capabilities.  
2\. \*\*Leverage subagents for heavy work\*\* – Delegate multi-step, output-heavy tasks to keep the main agent's context clean.  
3\. \*\*Adjust subagent outputs in configuration\*\* – If you notice when debugging that subagents generate long output, you can add guidance to the subagent's \`system\_prompt\` to create summaries and synthesized findings.  
4\. \*\*Use the filesystem\*\* – Persist large outputs to files (for example subagent writes or \[automatic offloading\](\#offloading)) so the active context stays small; the model can pull in fragments with \`read\_file\` and \`grep\` when it needs details.  
5\. \*\*Document long-term memory structure\*\* – Tell the agent what lives in \`/memories/\` and how to use it.  
6\. \*\*Pass runtime context for tools\*\* – Use \`context\` for user metadata, API keys, and other static configuration that tools need.

\#\# Related resources

\* \[Harness\](/oss/python/deepagents/harness) – Context management overview, offloading, summarization  
\* \[Subagents\](/oss/python/deepagents/subagents) – Context isolation, runtime context propagation  
\* \[Long-term memory\](/oss/python/deepagents/memory) – Cross-thread persistence  
\* \[Skills\](/oss/python/deepagents/skills) – Progressive disclosure and skill authoring  
\* \[Backends\](/oss/python/deepagents/backends) – Filesystem backends and CompositeBackend  
\* \[Context conceptual overview\](/oss/python/concepts/context) – Context types and lifecycle

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/context-engineering.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Subagents

\> Learn how to use subagents to delegate work and keep context clean

Deep Agents can create subagents to delegate work. You can specify custom subagents in the \`subagents\` parameter. Subagents are useful for \[context quarantine\](https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html\#context-quarantine) (keeping the main agent's context clean) and for providing specialized instructions.

This page covers \*\*synchronous\*\* subagents, where the supervisor blocks until the subagent finishes. For long-running tasks, parallel workstreams, or cases where you need mid-flight steering and cancellation, see \[Async subagents\](/oss/python/deepagents/async-subagents).

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph TB  
    Main\[Main Agent\] \--\> |task tool| Sub\[Subagent\]

    Sub \--\> Research\[Research\]  
    Sub \--\> Code\[Code\]  
    Sub \--\> General\[General\]

    Research \--\> |isolated work| Result\[Final Result\]  
    Code \--\> |isolated work| Result  
    General \--\> |isolated work| Result

    Result \--\> Main  
\`\`\`

\#\# Why use subagents?

Subagents solve the \*\*context bloat problem\*\*. When agents use tools with large outputs (web search, file reads, database queries), the context window fills up quickly with intermediate results. Subagents isolate this detailed work—the main agent receives only the final result, not the dozens of tool calls that produced it.

\*\*When to use subagents:\*\*

\* ✅ Multi-step tasks that would clutter the main agent's context  
\* ✅ Specialized domains that need custom instructions or tools  
\* ✅ Tasks requiring different model capabilities  
\* ✅ When you want to keep the main agent focused on high-level coordination

\*\*When NOT to use subagents:\*\*

\* ❌ Simple, single-step tasks  
\* ❌ When you need to maintain intermediate context  
\* ❌ When the overhead outweighs benefits

\#\# Configuration

\`subagents\` should be a list of dictionaries or \[\`CompiledSubAgent\`\](https://reference.langchain.com/python/deepagents/middleware/subagents/CompiledSubAgent) objects. There are two types:

\#\#\# SubAgent (Dictionary-based)

For most use cases, define subagents as dictionaries matching the \[\`SubAgent\`\](https://reference.langchain.com/python/deepagents/middleware/subagents/SubAgent) spec with the following fields:

| Field           | Type                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |  
| \--------------- | \------------------------ | \-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |  
| \`name\`          | \`str\`                    | Required. Unique identifier for the subagent. The main agent uses this name when calling the \`task()\` tool. The subagent name becomes metadata for \`AIMessage\`s and for streaming, which helps to differentiate between agents.                                                                                                                                                                                                                                                                                                                                                                                                                                      |  
| \`description\`   | \`str\`                    | Required. Description of what this subagent does. Be specific and action-oriented. The main agent uses this to decide when to delegate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |  
| \`system\_prompt\` | \`str\`                    | Required. Instructions for the subagent. Custom subagents must define their own. Include tool usage guidance and output format requirements.\<br /\>Does not inherit from main agent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |  
| \`tools\`         | \`list\[Callable\]\`         | Required. Tools the subagent can use. Custom subagents specify their own. Keep this minimal and include only what's needed.\<br /\>Does not inherit from main agent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |  
| \`model\`         | \`str\` \\| \`BaseChatModel\` | Optional. Overrides the main agent's model. Omit to use the main agent's model.\<br /\>Inherits from main agent by default. You can pass either a model identifier string like \`'openai:gpt-5'\` (using the \`'provider:model'\` format) or a LangChain chat model object (\`init\_chat\_model("gpt-5")\` or \`ChatOpenAI(model="gpt-5")\`).                                                                                                                                                                                                                                                                                                                                    |  
| \`middleware\`    | \`list\[Middleware\]\`       | Optional. Additional middleware for custom behavior, logging, or rate limiting.\<br /\>Does not inherit from main agent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |  
| \`interrupt\_on\`  | \`dict\[str, bool\]\`        | Optional. Configure \[human-in-the-loop\](/oss/python/deepagents/human-in-the-loop) for specific tools. Subagent value overrides main agent. Requires checkpointer.\<br /\>Inherits from main agent by default. Subagent value overrides the default.                                                                                                                                                                                                                                                                                                                                                                                                                    |  
| \`skills\`        | \`list\[str\]\`              | Optional. \[Skills\](/oss/python/deepagents/skills) source paths. When specified, the subagent will load skills from these directories (e.g., \`\["/skills/research/", "/skills/web-search/"\]\`). This allows subagents to have different skill sets than the main agent.\<br /\>Does not inherit from main agent. Only the general-purpose subagent inherits the main agent's skills. When a subagent has skills, it runs its own independent \[\`SkillsMiddleware\`\](https://reference.langchain.com/python/deepagents/middleware/skills/SkillsMiddleware) instance. Skill state is fully isolated—a subagent's loaded skills are not visible to the parent, and vice versa. |

\<Tip\>  
  \*\*CLI users:\*\* You can also define subagents as \`AGENTS.md\` files on disk instead of in code. The \`name\`, \`description\`, and \`model\` fields map to YAML frontmatter, and the markdown body becomes the \`system\_prompt\`. See \[Custom subagents\](/oss/python/deepagents/cli/overview\#subagents) for the file format.  
\</Tip\>

\#\#\# CompiledSubAgent

For complex workflows, use a prebuilt LangGraph graph as a \[\`CompiledSubAgent\`\](https://reference.langchain.com/python/deepagents/middleware/subagents/CompiledSubAgent):

| Field         | Type       | Description                                                                                                                                                       |  
| \------------- | \---------- | \----------------------------------------------------------------------------------------------------------------------------------------------------------------- |  
| \`name\`        | \`str\`      | Required. Unique identifier for the subagent. The subagent name becomes metadata for \`AIMessage\`s and for streaming, which helps to differentiate between agents. |  
| \`description\` | \`str\`      | Required. What this subagent does.                                                                                                                                |  
| \`runnable\`    | \`Runnable\` | Required. A compiled LangGraph graph (must call \`.compile()\` first).                                                                                              |

\#\# Using SubAgent

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
import os  
from typing import Literal  
from tavily import TavilyClient  
from deepagents import create\_deep\_agent

tavily\_client \= TavilyClient(api\_key=os.environ\["TAVILY\_API\_KEY"\])

def internet\_search(  
    query: str,  
    max\_results: int \= 5,  
    topic: Literal\["general", "news", "finance"\] \= "general",  
    include\_raw\_content: bool \= False,  
):  
    """Run a web search"""  
    return tavily\_client.search(  
        query,  
        max\_results=max\_results,  
        include\_raw\_content=include\_raw\_content,  
        topic=topic,  
    )

research\_subagent \= {  
    "name": "research-agent",  
    "description": "Used to research more in depth questions",  
    "system\_prompt": "You are a great researcher",  
    "tools": \[internet\_search\],  
    "model": "openai:gpt-5.2",  \# Optional override, defaults to main agent model  
}  
subagents \= \[research\_subagent\]

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    subagents=subagents  
)  
\`\`\`

\#\# Using CompiledSubAgent

For more complex use cases, you can provide your custom subagents with \[\`CompiledSubAgent\`\](https://reference.langchain.com/python/deepagents/middleware/subagents/CompiledSubAgent).  
You can create a custom subagent using LangChain's \[\`create\_agent\`\](https://reference.langchain.com/python/langchain/agents/factory/create\_agent) or by making a custom LangGraph graph using the \[graph API\](/oss/python/langgraph/graph-api).

If you're creating a custom LangGraph graph, make sure that the graph has a \[state key called \`"messages"\`\](/oss/python/langgraph/quickstart\#2-define-state):

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent, CompiledSubAgent  
from langchain.agents import create\_agent

\# Create a custom agent graph  
custom\_graph \= create\_agent(  
    model=your\_model,  
    tools=specialized\_tools,  
    prompt="You are a specialized agent for data analysis..."  
)

\# Use it as a custom subagent  
custom\_subagent \= CompiledSubAgent(  
    name="data-analyzer",  
    description="Specialized agent for complex data analysis tasks",  
    runnable=custom\_graph  
)

subagents \= \[custom\_subagent\]

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    tools=\[internet\_search\],  
    system\_prompt=research\_instructions,  
    subagents=subagents  
)  
\`\`\`

\#\# Streaming

When streaming tracing information agents' names are available as \`lc\_agent\_name\` in metadata.  
When reviewing tracing information, you can use this metadata to differentiate which agent the data came from.

The following example creates a deep agent with the name \`main-agent\` and a subagent with the name \`research-agent\`:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
import os  
from typing import Literal  
from tavily import TavilyClient  
from deepagents import create\_deep\_agent

tavily\_client \= TavilyClient(api\_key=os.environ\["TAVILY\_API\_KEY"\])

def internet\_search(  
    query: str,  
    max\_results: int \= 5,  
    topic: Literal\["general", "news", "finance"\] \= "general",  
    include\_raw\_content: bool \= False,  
):  
    """Run a web search"""  
    return tavily\_client.search(  
        query,  
        max\_results=max\_results,  
        include\_raw\_content=include\_raw\_content,  
        topic=topic,  
    )

research\_subagent \= {  
    "name": "research-agent",  
    "description": "Used to research more in depth questions",  
    "system\_prompt": "You are a great researcher",  
    "tools": \[internet\_search\],  
    "model": "claude-sonnet-4-6",  \# Optional override, defaults to main agent model  
}  
subagents \= \[research\_subagent\]

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    subagents=subagents,  
    name="main-agent"  
)  
\`\`\`

As you prompt your deepagents, all agent runs executed by a subagent or deep agent will have the agent name in their metadata.  
In this case the subagent with the name \`"research-agent"\`, will have \`{'lc\_agent\_name': 'research-agent'}\` in any associated agent run metadata:

\<img src="https://mintcdn.com/langchain-5e9cc07a/IlqYrcANJ39avG84/oss/images/deepagents/deepagents-langsmith.png?fit=max\&auto=format\&n=IlqYrcANJ39avG84\&q=85\&s=4c3a1512fb27abc30da37751aee19afd" alt="LangSmith Example trace showing the metadata" width="907" height="866" data-path="oss/images/deepagents/deepagents-langsmith.png" /\>

\#\# Structured output

All subagents support \[structured output\](/oss/python/langchain/structured-output) which you can use to validate the subagent's output.

You can set a desired structured output schema by passing it as the \`response\_format\` argument to the call to \`create\_agent()\`.  
When the model generates the structured data, it’s captured and validated.  
The structured object itself is not returned to the parent agent.  
When using structured output with subagents, include the structured data in the \`ToolMessage\`.

For more information, see \[response format\](/oss/python/langchain/structured-output\#response-format).

\#\# The general-purpose subagent

In addition to any user-defined subagents, Deep Agents have access to a \`general-purpose\` subagent at all times. This subagent:

\* Has the same system prompt as the main agent  
\* Has access to all the same tools  
\* Uses the same model (unless overridden)  
\* Inherits skills from the main agent (when skills are configured)

\#\#\# Override the general-purpose subagent

Include a subagent with \`name="general-purpose"\` in your \`subagents\` list to replace the default. Use this to configure a different model, tools, or system prompt for the general-purpose subagent:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

\# Main agent uses Claude; general-purpose subagent uses GPT  
agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    tools=\[internet\_search\],  
    subagents=\[  
        {  
            "name": "general-purpose",  
            "description": "General-purpose agent for research and multi-step tasks",  
            "system\_prompt": "You are a general-purpose assistant.",  
            "tools": \[internet\_search\],  
            "model": "openai:gpt-4o",  \# Different model for delegated tasks  
        },  
    \],  
)  
\`\`\`

When you provide a subagent with the general-purpose name, the default general-purpose subagent is not added. Your spec fully replaces it.

\#\#\# When to use it

The general-purpose subagent is ideal for context isolation without specialized behavior. The main agent can delegate a complex multi-step task to this subagent and get a concise result back without bloat from intermediate tool calls.

\<Card title="Example"\>  
  Instead of the main agent making 10 web searches and filling its context with results, it delegates to the general-purpose subagent: \`task(name="general-purpose", task="Research quantum computing trends")\`. The subagent performs all the searches internally and returns only a summary.  
\</Card\>

\#\#\# Skills inheritance

When configuring \[skills\](/oss/python/deepagents/skills) with \`create\_deep\_agent\`:

\* \*\*General-purpose subagent\*\*: Automatically inherits skills from the main agent  
\* \*\*Custom subagents\*\*: Do NOT inherit skills by default—use the \`skills\` parameter to give them their own skills

\<Note\>  
  Only subagents configured with skills get a \`SkillsMiddleware\` instance—custom subagents without a \`skills\` parameter do not. When present, skill state is fully isolated in both directions: the parent's skills are not visible to the child, and the child's skills are not propagated back to the parent.  
\</Note\>

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

\# Research subagent with its own skills  
research\_subagent \= {  
    "name": "researcher",  
    "description": "Research assistant with specialized skills",  
    "system\_prompt": "You are a researcher.",  
    "tools": \[web\_search\],  
    "skills": \["/skills/research/", "/skills/web-search/"\],  \# Subagent-specific skills  
}

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    skills=\["/skills/main/"\],  \# Main agent and GP subagent get these  
    subagents=\[research\_subagent\],  \# Gets only /skills/research/ and /skills/web-search/  
)  
\`\`\`

\#\# Best practices

\#\#\# Write clear descriptions

The main agent uses descriptions to decide which subagent to call. Be specific:

✅ \*\*Good:\*\* \`"Analyzes financial data and generates investment insights with confidence scores"\`

❌ \*\*Bad:\*\* \`"Does finance stuff"\`

\#\#\# Keep system prompts detailed

Include specific guidance on how to use tools and format outputs:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
research\_subagent \= {  
    "name": "research-agent",  
    "description": "Conducts in-depth research using web search and synthesizes findings",  
    "system\_prompt": """You are a thorough researcher. Your job is to:

    1\. Break down the research question into searchable queries  
    2\. Use internet\_search to find relevant information  
    3\. Synthesize findings into a comprehensive but concise summary  
    4\. Cite sources when making claims

    Output format:  
    \- Summary (2-3 paragraphs)  
    \- Key findings (bullet points)  
    \- Sources (with URLs)

    Keep your response under 500 words to maintain clean context.""",  
    "tools": \[internet\_search\],  
}  
\`\`\`

\#\#\# Minimize tool sets

Only give subagents the tools they need. This improves focus and security:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\# ✅ Good: Focused tool set  
email\_agent \= {  
    "name": "email-sender",  
    "tools": \[send\_email, validate\_email\],  \# Only email-related  
}

\# ❌ Bad: Too many tools  
email\_agent \= {  
    "name": "email-sender",  
    "tools": \[send\_email, web\_search, database\_query, file\_upload\],  \# Unfocused  
}  
\`\`\`

\#\#\# Choose models by task

Different models excel at different tasks:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
subagents \= \[  
    {  
        "name": "contract-reviewer",  
        "description": "Reviews legal documents and contracts",  
        "system\_prompt": "You are an expert legal reviewer...",  
        "tools": \[read\_document, analyze\_contract\],  
        "model": "claude-sonnet-4-6",  \# Large context for long documents  
    },  
    {  
        "name": "financial-analyst",  
        "description": "Analyzes financial data and market trends",  
        "system\_prompt": "You are an expert financial analyst...",  
        "tools": \[get\_stock\_price, analyze\_fundamentals\],  
        "model": "openai:gpt-5",  \# Better for numerical analysis  
    },  
\]  
\`\`\`

\#\#\# Return concise results

Instruct subagents to return summaries, not raw data:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
data\_analyst \= {  
    "system\_prompt": """Analyze the data and return:  
    1\. Key insights (3-5 bullet points)  
    2\. Overall confidence score  
    3\. Recommended next actions

    Do NOT include:  
    \- Raw data  
    \- Intermediate calculations  
    \- Detailed tool outputs

    Keep response under 300 words."""  
}  
\`\`\`

\#\# Common patterns

\#\#\# Multiple specialized subagents

Create specialized subagents for different domains:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

subagents \= \[  
    {  
        "name": "data-collector",  
        "description": "Gathers raw data from various sources",  
        "system\_prompt": "Collect comprehensive data on the topic",  
        "tools": \[web\_search, api\_call, database\_query\],  
    },  
    {  
        "name": "data-analyzer",  
        "description": "Analyzes collected data for insights",  
        "system\_prompt": "Analyze data and extract key insights",  
        "tools": \[statistical\_analysis\],  
    },  
    {  
        "name": "report-writer",  
        "description": "Writes polished reports from analysis",  
        "system\_prompt": "Create professional reports from insights",  
        "tools": \[format\_document\],  
    },  
\]

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    system\_prompt="You coordinate data analysis and reporting. Use subagents for specialized tasks.",  
    subagents=subagents  
)  
\`\`\`

\*\*Workflow:\*\*

1\. Main agent creates high-level plan  
2\. Delegates data collection to data-collector  
3\. Passes results to data-analyzer  
4\. Sends insights to report-writer  
5\. Compiles final output

Each subagent works with clean context focused only on its task.

\#\# Context management

When you invoke a parent agent with \[runtime context\](/oss/python/langchain/runtime), that context automatically propagates to all subagents. Each subagent run receives the same runtime context you passed on the parent \`invoke\` / \`ainvoke\` call.

This means tools running inside any subagent can access the same context values you provided to the parent:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from dataclasses import dataclass

from deepagents import create\_deep\_agent  
from langchain.messages import HumanMessage  
from langchain.tools import tool, ToolRuntime

@dataclass  
class Context:  
    user\_id: str  
    session\_id: str

@tool  
def get\_user\_data(query: str, runtime: ToolRuntime\[Context\]) \-\> str:  
    """Fetch data for the current user."""  
    user\_id \= runtime.context.user\_id  
    return f"Data for user {user\_id}: {query}"

research\_subagent \= {  
    "name": "researcher",  
    "description": "Conducts research for the current user",  
    "system\_prompt": "You are a research assistant.",  
    "tools": \[get\_user\_data\],  
}

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    subagents=\[research\_subagent\],  
    context\_schema=Context,  
)

\# Context flows to the researcher subagent and its tools automatically  
result \= await agent.invoke(  
    {"messages": \[HumanMessage("Look up my recent activity")\]},  
    context=Context(user\_id="user-123", session\_id="abc"),  
)  
\`\`\`

\#\#\# Per-subagent context

All subagents receive the same parent context. To pass configuration that is specific to a particular subagent, use \*\*namespaced keys\*\* (prefix keys with the subagent name, for example \`researcher:max\_depth\`) in a flat \`context\` mapping, \*\*or\*\* model those settings as separate fields on your context type:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from dataclasses import dataclass

from langchain.messages import HumanMessage  
from langchain.tools import tool, ToolRuntime

@dataclass  
class Context:  
    user\_id: str  
    researcher\_max\_depth: int | None \= None  
    fact\_checker\_strict\_mode: bool | None \= None

result \= await agent.invoke(  
    {"messages": \[HumanMessage("Research this and verify the claims")\]},  
    context=Context(  
        user\_id="user-123",  
        researcher\_max\_depth=3,  
        fact\_checker\_strict\_mode=True,  
    ),  
)

@tool  
def verify\_claim(claim: str, runtime: ToolRuntime\[Context\]) \-\> str:  
    """Verify a factual claim."""  
    strict\_mode \= runtime.context.fact\_checker\_strict\_mode or False  
    if strict\_mode:  
        return strict\_verification(claim)  
    return basic\_verification(claim)  
\`\`\`

\#\#\# Identifying which subagent called a tool

When the same tool is shared between the parent and multiple subagents, you can use the \`lc\_agent\_name\` metadata (the same value used in \[streaming\](\#streaming)) to determine which agent initiated the call:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langchain.tools import tool, ToolRuntime

@tool  
def shared\_lookup(query: str, runtime: ToolRuntime) \-\> str:  
    """Look up information."""  
    agent\_name \= runtime.config.get("metadata", {}).get("lc\_agent\_name")  
    if agent\_name \== "fact-checker":  
        return strict\_lookup(query)  
    return general\_lookup(query)  
\`\`\`

You can combine both patterns—read agent-specific settings from \`runtime.context\` and read \`lc\_agent\_name\` from \`runtime.config\` metadata when branching tool behavior.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langchain.tools import tool, ToolRuntime

@tool  
def flexible\_search(query: str, runtime: ToolRuntime\[Context\]) \-\> str:  
    """Search with agent-specific settings."""  
    agent\_name \= runtime.config.get("metadata", {}).get("lc\_agent\_name", "unknown")  
    ctx \= runtime.context  
    if agent\_name \== "researcher":  
        max\_results \= ctx.researcher\_max\_depth or 5  
    else:  
        max\_results \= 5  
    include\_raw \= False

    return perform\_search(query, max\_results=max\_results, include\_raw=include\_raw)  
\`\`\`

\#\# Troubleshooting

\#\#\# Subagent not being called

\*\*Problem\*\*: Main agent tries to do work itself instead of delegating.

\*\*Solutions\*\*:

1\. \*\*Make descriptions more specific:\*\*

   \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
   \# ✅ Good  
   {"name": "research-specialist", "description": "Conducts in-depth research on specific topics using web search. Use when you need detailed information that requires multiple searches."}

   \# ❌ Bad  
   {"name": "helper", "description": "helps with stuff"}  
   \`\`\`

2\. \*\*Instruct main agent to delegate:\*\*

   \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
   agent \= create\_deep\_agent(  
       system\_prompt="""...your instructions...

       IMPORTANT: For complex tasks, delegate to your subagents using the task() tool.  
       This keeps your context clean and improves results.""",  
       subagents=\[...\]  
   )  
   \`\`\`

\#\#\# Context still getting bloated

\*\*Problem\*\*: Context fills up despite using subagents.

\*\*Solutions\*\*:

1\. \*\*Instruct subagent to return concise results:\*\*

   \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
   system\_prompt="""...

   IMPORTANT: Return only the essential summary.  
   Do NOT include raw data, intermediate search results, or detailed tool outputs.  
   Your response should be under 500 words."""  
   \`\`\`

2\. \*\*Use filesystem for large data:\*\*

   \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
   system\_prompt="""When you gather large amounts of data:  
   1\. Save raw data to /data/raw\_results.txt  
   2\. Process and analyze the data  
   3\. Return only the analysis summary

   This keeps context clean."""  
   \`\`\`

\#\#\# Wrong subagent being selected

\*\*Problem\*\*: Main agent calls inappropriate subagent for the task.

\*\*Solution\*\*: Differentiate subagents clearly in descriptions:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
subagents \= \[  
    {  
        "name": "quick-researcher",  
        "description": "For simple, quick research questions that need 1-2 searches. Use when you need basic facts or definitions.",  
    },  
    {  
        "name": "deep-researcher",  
        "description": "For complex, in-depth research requiring multiple searches, synthesis, and analysis. Use for comprehensive reports.",  
    }  
\]  
\`\`\`

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/subagents.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>  
\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Async subagents

\> Launch background subagents that run concurrently while the supervisor continues interacting with the user

Async subagents let a supervisor agent launch background tasks that return immediately, so the supervisor can continue interacting with the user while subagents work concurrently. The supervisor can check progress, send follow-up instructions, or cancel tasks at any point.

This builds on \[subagents\](/oss/python/deepagents/subagents), which run synchronously and block the supervisor until completion. Use async subagents when tasks are long-running, parallelizable, or need mid-flight steering.

\<Note\>  
  Async subagents are a preview feature available in \`deepagents\` 0.5.0. Preview features are under active development and APIs may change.  
\</Note\>

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph TB  
    User(\[User\]) \--\> Supervisor\[Supervisor Agent\]

    Supervisor \--\> |launch| Researcher\[Researcher\]  
    Supervisor \--\> |launch| Coder\[Coder\]

    Researcher \--\> |check| Supervisor  
    Coder \--\> |check| Supervisor  
\`\`\`

\<Note\>  
  Async subagents communicate with any server that implements the \[Agent Protocol\](https://github.com/langchain-ai/agent-protocol). You can use \[LangSmith Deployments\](/langsmith/deployment), or self-host any Agent Protocol-compatible server. Each subagent runs independently of the supervisor, which controls them through the SDK to launch, check, update, and cancel.  
\</Note\>

\#\# When to use async subagents

| Dimension            | Sync subagents                                                  | Async subagents                                                   |  
| \-------------------- | \--------------------------------------------------------------- | \----------------------------------------------------------------- |  
| \*\*Execution model\*\*  | Supervisor blocks until subagent completes                      | Returns job ID immediately; supervisor continues                  |  
| \*\*Concurrency\*\*      | Parallel but blocking                                           | Parallel and non-blocking                                         |  
| \*\*Mid-task updates\*\* | Not possible                                                    | Send follow-up instructions via \`update\_async\_task\`               |  
| \*\*Cancellation\*\*     | Not possible                                                    | Cancel running tasks via \`cancel\_async\_task\`                      |  
| \*\*Statefulness\*\*     | Stateless \-- no persistent state between invocations            | Stateful \-- maintains state on its own thread across interactions |  
| \*\*Best for\*\*         | Tasks where the agent should wait for results before continuing | Long-running, complex tasks managed interactively in a chat       |

\#\# Configure async subagents

Define async subagents as a list of \[\`AsyncSubAgent\`\](https://reference.langchain.com/python/deepagents/middleware/async\_subagents/AsyncSubAgent) specs, each pointing to an Agent Protocol server:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import AsyncSubAgent, create\_deep\_agent

async\_subagents \= \[  
    AsyncSubAgent(  
        name="researcher",  
        description="Research agent for information gathering and synthesis",  
        graph\_id="researcher",  
        \# No url → ASGI transport (co-deployed in the same deployment)  
    ),  
    AsyncSubAgent(  
        name="coder",  
        description="Coding agent for code generation and review",  
        graph\_id="coder",  
        \# url="https://coder-deployment.langsmith.dev"  \# Optional: HTTP transport for remote  
    ),  
\]

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    subagents=async\_subagents,  
)  
\`\`\`

| Field         | Type             | Description                                                                                                                                                     |  
| \------------- | \---------------- | \--------------------------------------------------------------------------------------------------------------------------------------------------------------- |  
| \`name\`        | \`str\`            | Required. Unique identifier. The supervisor uses this when launching tasks.                                                                                     |  
| \`description\` | \`str\`            | Required. What this subagent does. The supervisor uses this to decide which agent to delegate to.                                                               |  
| \`graph\_id\`    | \`str\`            | Required. The graph ID (or assistant ID) on the Agent Protocol server. For LangGraph-based deployments, this must match a graph registered in \`langgraph.json\`. |  
| \`url\`         | \`str\`            | Optional. When omitted, uses ASGI transport (in-process). When set, uses HTTP transport to a remote Agent Protocol server.                                      |  
| \`headers\`     | \`dict\[str, str\]\` | Optional. Additional headers for requests to the remote server. Use for custom authentication with self-hosted Agent Protocol servers.                          |

For LangGraph-based deployments, register all graphs in the same \`langgraph.json\` for co-deployed setups:

\`\`\`json  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
{  
  "graphs": {  
    "supervisor": "./src/supervisor.py:graph",  
    "researcher": "./src/researcher.py:graph",  
    "coder": "./src/coder.py:graph"  
  }  
}  
\`\`\`

\#\# Use the async subagent tools

The \[\`AsyncSubAgentMiddleware\`\](https://reference.langchain.com/python/deepagents/middleware/async\_subagents/AsyncSubAgentMiddleware) gives the supervisor five tools:

| Tool                | Purpose                                   | Returns                       |  
| \------------------- | \----------------------------------------- | \----------------------------- |  
| \`start\_async\_task\`  | Start a new background task               | Task ID (immediately)         |  
| \`check\_async\_task\`  | Get current status and result of a task   | Status \+ result (if complete) |  
| \`update\_async\_task\` | Send new instructions to a running task   | Confirmation \+ updated status |  
| \`cancel\_async\_task\` | Stop a running task                       | Confirmation                  |  
| \`list\_async\_tasks\`  | List all tracked tasks with live statuses | Summary of all tasks          |

The supervisor's LLM calls these tools like any other tool. The middleware handles thread creation, run management, and state persistence automatically.

\#\#\# Understand the lifecycle

A typical interaction follows this sequence:

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
sequenceDiagram  
    participant User  
    participant Supervisor  
    participant Platform as Agent Protocol Server

    User-\>\>Supervisor: "Research topic X"  
    Supervisor-\>\>Platform: launch(researcher, "topic X")  
    Platform--\>\>Supervisor: task\_id: abc123

    Note over Platform: Researcher working...

    Supervisor--\>\>User: "Started task abc123"

    Note over User,Platform: User continues conversation

    User-\>\>Supervisor: "How's the research going?"  
    Supervisor-\>\>Platform: check(abc123)  
    Platform--\>\>Supervisor: status: success, result: "findings..."  
    Supervisor--\>\>User: "Here are the results"  
\`\`\`

\* \*\*Launch\*\* creates a new thread on the server, starts a run with the task description as input, and returns the thread ID as the task ID. The supervisor reports this ID to the user and does not poll for completion.  
\* \*\*Check\*\* fetches the current run status. If the run succeeded, it retrieves the thread state to extract the subagent's final output. If still running, it reports that to the user.  
\* \*\*Update\*\* creates a new run on the same thread with an interrupt multitask strategy. The previous run is interrupted, and the subagent restarts with the full conversation history plus the new instructions. The task ID stays the same.  
\* \*\*Cancel\*\* calls \`runs.cancel()\` on the server and marks the task as \`"cancelled"\`.  
\* \*\*List\*\* iterates over all tracked tasks. For non-terminal tasks, it fetches live status from the server in parallel. Terminal statuses (\`success\`, \`error\`, \`cancelled\`) are returned from cache.

\#\# Understand state management

Task metadata is stored in a dedicated state channel (\`async\_tasks\`) on the supervisor's graph, separate from the message history. This is critical because deep agents \[compact their message history\](/oss/python/deepagents/customization\#summarization) when the context window fills up \-- if task IDs were only in tool messages, they would be lost during compaction. The dedicated channel ensures the supervisor can always recall its tasks through \`list\_async\_tasks\`, even after multiple rounds of summarization.

Each tracked task records the task ID, agent name, thread ID, run ID, status, and timestamps (\`created\_at\`, \`last\_checked\_at\`, \`last\_updated\_at\`).

\#\# Choose a transport

\#\#\# ASGI transport (co-deployed)

When a subagent spec omits the \`url\` field, the LangGraph SDK uses ASGI transport \-- SDK calls are routed through in-process function calls rather than HTTP. For LangGraph-based deployments, this requires both graphs to be registered in the same \`langgraph.json\`.

ASGI transport eliminates network latency and requires no additional auth configuration. The subagent still runs as a separate thread with its own state. This is the recommended default.

\#\#\# HTTP transport (remote)

Add a \`url\` field to switch to HTTP transport, where SDK calls go over the network to a remote Agent Protocol server:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
AsyncSubAgent(  
    name="researcher",  
    description="Research agent",  
    graph\_id="researcher",  
    url="https://my-research-deployment.langsmith.dev",  
)  
\`\`\`

For LangGraph deployments, authentication is handled by the LangGraph SDK using \`LANGSMITH\_API\_KEY\` (or \`LANGGRAPH\_API\_KEY\`) from environment variables. Self-hosted Agent Protocol servers may use a different authentication mechanism.

Use HTTP transport when subagents need independent scaling, different resource profiles, or are maintained by a different team.

\#\# Choose a deployment topology

\#\#\# Single deployment

A single deployment means all agents are co-deployed on the same server using ASGI transport. For LangGraph-based deployments, register all graphs in one \`langgraph.json\`. This is the recommended starting point \-- one server to manage, zero network latency between agents.

\#\#\# Split deployment

Supervisor on one server, subagents on another via HTTP transport. Use when subagents need different compute profiles or independent scaling.

\#\#\# Hybrid

In a split deployment, you have the supervisor on one server and subagents on another via HTTP transport. Use when subagents need different compute profiles or independent scaling.

\#\#\# Hybrid

In a hybrid deployment, some subagents are co-deployed via ASGI, others remote via HTTP:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
async\_subagents \= \[  
    AsyncSubAgent(  
        name="researcher",  
        description="Research agent",  
        graph\_id="researcher",  
        \# No url → ASGI (co-deployed)  
    ),  
    AsyncSubAgent(  
        name="coder",  
        description="Coding agent",  
        graph\_id="coder",  
        url="https://coder-deployment.langsmith.dev",  
        \# url present → HTTP (remote)  
    ),  
\]  
\`\`\`

\#\# Best practices

\#\#\# Size the worker pool for local development

When running locally with \`langgraph dev\`, increase the worker pool to accommodate concurrent subagent runs. Each active run occupies a worker slot. A supervisor with 3 concurrent subagent tasks requires 4 slots (1 supervisor \+ 3 subagents). Under-provisioning causes launches to queue.

\`\`\`bash  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
langgraph dev \--n-jobs-per-worker 10  
\`\`\`

\#\#\# Write clear subagent descriptions

The supervisor uses descriptions to decide which subagent to launch. Be specific and action-oriented:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\# Good  
AsyncSubAgent(  
    name="researcher",  
    description="Conducts in-depth research using web search. Use for questions requiring multiple searches and synthesis.",  
    graph\_id="researcher",  
)

\# Bad  
AsyncSubAgent(  
    name="helper",  
    description="helps with stuff",  
    graph\_id="helper",  
)  
\`\`\`

\#\#\# Trace with thread IDs

When using LangGraph-based deployments, every async subagent run is a standard LangGraph run, fully visible in LangSmith. The supervisor's trace shows tool calls for \`launch\`, \`check\`, \`update\`, \`cancel\`, and \`list\`. Each subagent run appears as a separate trace, linked by thread ID. Use the thread ID (task ID) to correlate supervisor orchestration traces with subagent execution traces.

\#\# Troubleshooting

\#\#\# Supervisor polls immediately after launch

\*\*Problem\*\*: The supervisor calls \`check\` in a loop right after launching, turning async execution into blocking.

\*\*Solution\*\*: The middleware injects system prompt rules to prevent this. If polling persists, reinforce the behavior in your supervisor's system prompt:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    system\_prompt="""...your instructions...

    After launching an async subagent, ALWAYS return control to the user.  
    Never call check\_async\_task immediately after launch.""",  
    subagents=async\_subagents,  
)  
\`\`\`

\#\#\# Supervisor reports stale status

\*\*Problem\*\*: The supervisor references a task status from earlier in conversation history instead of making a fresh \`check\` call.

\*\*Solution\*\*: The middleware prompt instructs the model that "task statuses in conversation history are always stale." If this still occurs, add explicit instructions to always call \`check\` or \`list\` before reporting status.

\#\#\# Task ID lookup failures

\*\*Problem\*\*: The supervisor truncates or reformats the task ID, causing \`check\` or \`cancel\` to fail.

\*\*Solution\*\*: The middleware prompt instructs the model to always use the full task ID. If truncation persists, this is typically a model-specific issue \-- try a different model or add "always show the full task\\\_id, never truncate or abbreviate it" to your system prompt.

\#\#\# Subagent launches queue instead of running

\*\*Problem\*\*: Launching a subagent hangs or takes a long time to start.

\*\*Solution\*\*: The worker pool is likely exhausted. Increase the pool size with \`--n-jobs-per-worker\`. See \[Size the worker pool\](\#size-the-worker-pool).

\#\# Reference implementation

The \[async-deep-agents\](https://github.com/langchain-ai/async-deep-agents) repository contains working examples in both Python and TypeScript that deploy to LangSmith Deployments. It demonstrates a supervisor with researcher and coder subagents running as background tasks.

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/async-subagents.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Human-in-the-loop

\> Learn how to configure human approval for sensitive tool operations

Some tool operations may be sensitive and require human approval before execution. Deep Agents support human-in-the-loop workflows through LangGraph's interrupt capabilities. You can configure which tools require approval using the \`interrupt\_on\` parameter.

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph LR  
    Agent\[Agent\] \--\> Check{Interrupt?}  
    Check \--\> |no| Execute\[Execute\]  
    Check \--\> |yes| Human{Human}

    Human \--\> |approve| Execute  
    Human \--\> |edit| Execute  
    Human \--\> |reject| Cancel\[Cancel\]

    Execute \--\> Agent  
    Cancel \--\> Agent

    classDef trigger fill:\#DCFCE7,stroke:\#16A34A,stroke-width:2px,color:\#14532D  
    classDef process fill:\#DBEAFE,stroke:\#2563EB,stroke-width:2px,color:\#1E3A8A  
    classDef decision fill:\#FEF3C7,stroke:\#F59E0B,stroke-width:2px,color:\#78350F  
    classDef alert fill:\#FEE2E2,stroke:\#DC2626,stroke-width:2px,color:\#7F1D1D

    class Agent trigger  
    class Check,Human decision  
    class Execute process  
    class Cancel alert  
\`\`\`

\#\# Basic configuration

The \`interrupt\_on\` parameter accepts a dictionary mapping tool names to interrupt configurations. Each tool can be configured with:

\* \*\*\`True\`\*\*: Enable interrupts with default behavior (approve, edit, reject allowed)  
\* \*\*\`False\`\*\*: Disable interrupts for this tool  
\* \*\*\`{"allowed\_decisions": \[...\]}\`\*\*: Custom configuration with specific allowed decisions

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langchain.tools import tool  
from deepagents import create\_deep\_agent  
from langgraph.checkpoint.memory import MemorySaver

@tool  
def delete\_file(path: str) \-\> str:  
    """Delete a file from the filesystem."""  
    return f"Deleted {path}"

@tool  
def read\_file(path: str) \-\> str:  
    """Read a file from the filesystem."""  
    return f"Contents of {path}"

@tool  
def send\_email(to: str, subject: str, body: str) \-\> str:  
    """Send an email."""  
    return f"Sent email to {to}"

\# Checkpointer is REQUIRED for human-in-the-loop  
checkpointer \= MemorySaver()

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    tools=\[delete\_file, read\_file, send\_email\],  
    interrupt\_on={  
        "delete\_file": True,  \# Default: approve, edit, reject  
        "read\_file": False,   \# No interrupts needed  
        "send\_email": {"allowed\_decisions": \["approve", "reject"\]},  \# No editing  
    },  
    checkpointer=checkpointer  \# Required\!  
)  
\`\`\`

\#\# Decision types

The \`allowed\_decisions\` list controls what actions a human can take when reviewing a tool call:

\* \*\*\`"approve"\`\*\*: Execute the tool with the original arguments as proposed by the agent  
\* \*\*\`"edit"\`\*\*: Modify the tool arguments before execution  
\* \*\*\`"reject"\`\*\*: Skip executing this tool call entirely

You can customize which decisions are available for each tool:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
interrupt\_on \= {  
    \# Sensitive operations: allow all options  
    "delete\_file": {"allowed\_decisions": \["approve", "edit", "reject"\]},

    \# Moderate risk: approval or rejection only  
    "write\_file": {"allowed\_decisions": \["approve", "reject"\]},

    \# Must approve (no rejection allowed)  
    "critical\_operation": {"allowed\_decisions": \["approve"\]},  
}  
\`\`\`

\#\# Handle interrupts

When an interrupt is triggered, the agent pauses execution and returns control. Check for interrupts in the result and handle them accordingly.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langchain\_core.utils.uuid import uuid7  
from langgraph.types import Command

\# Create config with thread\_id for state persistence  
config \= {"configurable": {"thread\_id": str(uuid7())}}

\# Invoke the agent  
result \= agent.invoke(  
    {"messages": \[{"role": "user", "content": "Delete the file temp.txt"}\]},  
    config=config,  
    version="v2",  \# \[\!code highlight\]  
)

\# Check if execution was interrupted  
if result.interrupts:  \# \[\!code highlight\]  
    \# Extract interrupt information  
    interrupt\_value \= result.interrupts\[0\].value  \# \[\!code highlight\]  
    action\_requests \= interrupt\_value\["action\_requests"\]  
    review\_configs \= interrupt\_value\["review\_configs"\]

    \# Create a lookup map from tool name to review config  
    config\_map \= {cfg\["action\_name"\]: cfg for cfg in review\_configs}

    \# Display the pending actions to the user  
    for action in action\_requests:  
        review\_config \= config\_map\[action\["name"\]\]  
        print(f"Tool: {action\['name'\]}")  
        print(f"Arguments: {action\['args'\]}")  
        print(f"Allowed decisions: {review\_config\['allowed\_decisions'\]}")

    \# Get user decisions (one per action\_request, in order)  
    decisions \= \[  
        {"type": "approve"}  \# User approved the deletion  
    \]

    \# Resume execution with decisions  
    result \= agent.invoke(  
        Command(resume={"decisions": decisions}),  
        config=config,  \# Must use the same config\!  
        version="v2",  
    )

\# Process final result  
print(result.value\["messages"\]\[-1\].content)  \# \[\!code highlight\]  
\`\`\`

\#\# Multiple tool calls

When the agent calls multiple tools that require approval, all interrupts are batched together in a single interrupt. You must provide decisions for each one in order.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
config \= {"configurable": {"thread\_id": str(uuid7())}}

result \= agent.invoke(  
    {"messages": \[{  
        "role": "user",  
        "content": "Delete temp.txt and send an email to admin@example.com"  
    }\]},  
    config=config,  
    version="v2",  \# \[\!code highlight\]  
)

if result.interrupts:  \# \[\!code highlight\]  
    interrupt\_value \= result.interrupts\[0\].value  \# \[\!code highlight\]  
    action\_requests \= interrupt\_value\["action\_requests"\]

    \# Two tools need approval  
    assert len(action\_requests) \== 2

    \# Provide decisions in the same order as action\_requests  
    decisions \= \[  
        {"type": "approve"},  \# First tool: delete\_file  
        {"type": "reject"}    \# Second tool: send\_email  
    \]

    result \= agent.invoke(  
        Command(resume={"decisions": decisions}),  
        config=config,  
        version="v2",  
    )  
\`\`\`

\#\# Edit tool arguments

When \`"edit"\` is in the allowed decisions, you can modify the tool arguments before execution:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
if result.interrupts:  \# \[\!code highlight\]  
    interrupt\_value \= result.interrupts\[0\].value  \# \[\!code highlight\]  
    action\_request \= interrupt\_value\["action\_requests"\]\[0\]

    \# Original args from the agent  
    print(action\_request\["args"\])  \# {"to": "everyone@company.com", ...}

    \# User decides to edit the recipient  
    decisions \= \[{  
        "type": "edit",  
        "edited\_action": {  
            "name": action\_request\["name"\],  \# Must include the tool name  
            "args": {"to": "team@company.com", "subject": "...", "body": "..."}  
        }  
    }\]

    result \= agent.invoke(  
        Command(resume={"decisions": decisions}),  
        config=config,  
        version="v2",  
    )  
\`\`\`

\#\# Subagent interrupts

When using subagents, you can use interrupts \[on tool calls\](\#interrupts-on-tool-calls) and \[within tool calls\](\#interrupts-within-tool-calls).

\#\#\# Interrupts on tool calls

Each subagent can have its own \`interrupt\_on\` configuration that overrides the main agent's settings:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
agent \= create\_deep\_agent(  
    tools=\[delete\_file, read\_file\],  
    interrupt\_on={  
        "delete\_file": True,  
        "read\_file": False,  
    },  
    subagents=\[{  
        "name": "file-manager",  
        "description": "Manages file operations",  
        "system\_prompt": "You are a file management assistant.",  
        "tools": \[delete\_file, read\_file\],  
        "interrupt\_on": {  
            \# Override: require approval for reads in this subagent  
            "delete\_file": True,  
            "read\_file": True,  \# Different from main agent\!  
        }  
    }\],  
    checkpointer=checkpointer  
)  
\`\`\`

When a subagent triggers an interrupt, the handling is the same—check for \`interrupts\` on the result and resume with \`Command\`.

\#\#\# Interrupts within tool calls

Subagent tools can call \`interrupt()\` directly to pause execution and await approval:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langchain.agents import create\_agent  
from langchain\_anthropic import ChatAnthropic  
from langchain.messages import HumanMessage  
from langchain.tools import tool  
from langgraph.checkpoint.memory import InMemorySaver  
from langgraph.types import Command, interrupt

from deepagents.graph import create\_deep\_agent  
from deepagents.middleware.subagents import CompiledSubAgent

@tool(description="Request human approval before proceeding with an action.")  
def request\_approval(action\_description: str) \-\> str:  
    """Request human approval using the interrupt() primitive."""  
    \# interrupt() pauses execution and returns the value passed to Command(resume=...)  
    approval \= interrupt({  
        "type": "approval\_request",  
        "action": action\_description,  
        "message": f"Please approve or reject: {action\_description}",  
    })

    if approval.get("approved"):  
        return f"Action '{action\_description}' was APPROVED. Proceeding..."  
    else:  
        return f"Action '{action\_description}' was REJECTED. Reason: {approval.get('reason', 'No reason provided')}"

def main():  
    checkpointer \= InMemorySaver()  
    model \= ChatAnthropic(  
        model\_name="claude-sonnet-4-6",  
        max\_tokens=4096,  
    )

    compiled\_subagent \= create\_agent(  
        model=model,  
        tools=\[request\_approval\],  
        name="approval-agent",  
    )

    parent\_agent \= create\_deep\_agent(  
        checkpointer=checkpointer,  
        subagents=\[  
            CompiledSubAgent(  
                name="approval-agent",  
                description="An agent that can request approvals",  
                runnable=compiled\_subagent,  
            )  
        \],  
    )

    thread\_id \= "test\_interrupt\_directly"  
    config \= {"configurable": {"thread\_id": thread\_id}}

    print("Invoking agent \- sub-agent will use request\_approval tool...")

    result \= parent\_agent.invoke(  
        {  
            "messages": \[  
                HumanMessage(  
                    content="Use the task tool to launch the approval-agent sub-agent. "  
                    "Tell it to use the request\_approval tool to request approval for 'deploying to production'."  
                )  
            \]  
        },  
        config=config,  
        version="v2",  \# \[\!code highlight\]  
    )

    \# Check for interrupt  
    if result.interrupts:  \# \[\!code highlight\]  
        interrupt\_value \= result.interrupts\[0\].value  \# \[\!code highlight\]  
        print(f"\\nInterrupt received\!")  
        print(f"  Type: {interrupt\_value.get('type')}")  
        print(f"  Action: {interrupt\_value.get('action')}")  
        print(f"  Message: {interrupt\_value.get('message')}")

        print("\\nResuming with Command(resume={'approved': True})...")  
        result2 \= parent\_agent.invoke(  
            Command(resume={"approved": True}),  
            config=config,  
            version="v2",  \# \[\!code highlight\]  
        )

        if not result2.interrupts:  \# \[\!code highlight\]  
            print("\\nExecution completed\!")  
            \# Find the tool response  
            tool\_msgs \= \[m for m in result2.value.get("messages", \[\]) if m.type \== "tool"\]  \# \[\!code highlight\]  
            if tool\_msgs:  
                print(f"  Tool result: {tool\_msgs\[-1\].content}")  
        else:  
            print("\\nAnother interrupt occurred")  
    else:  
        print("\\n  No interrupt \- the model may not have called request\_approval")

if \_\_name\_\_ \== "\_\_main\_\_":  
    main()  
\`\`\`

When run, this produces the following output:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
Invoking agent \- sub-agent will use request\_approval tool...

Interrupt received\!  
  Type: approval\_request  
  Action: deploying to production  
  Message: Please approve or reject: deploying to production

Resuming with Command(resume={'approved': True})...

Execution completed\!  
  Tool result: Great\! The approval request has been processed. The action \*\*"deploying to production"\*\* was \*\*APPROVED\*\*. You can now proceed with the production deployment.  
\`\`\`

\#\# Best practices

\#\#\# Always use a checkpointer

Human-in-the-loop requires a checkpointer to persist agent state between the interrupt and resume:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langgraph.checkpoint.memory import MemorySaver

checkpointer \= MemorySaver()  
agent \= create\_deep\_agent(  
    tools=\[...\],  
    interrupt\_on={...},  
    checkpointer=checkpointer  \# Required for HITL  
)  
\`\`\`

\#\#\# Use the same thread ID

When resuming, you must use the same config with the same \`thread\_id\`:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\# First call  
config \= {"configurable": {"thread\_id": "my-thread"}}  
result \= agent.invoke(input, config=config, version="v2")

\# Resume (use same config)  
result \= agent.invoke(Command(resume={...}), config=config, version="v2")  
\`\`\`

\#\#\# Match decision order to actions

The decisions list must match the order of \`action\_requests\`:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
if result.interrupts:  \# \[\!code highlight\]  
    interrupt\_value \= result.interrupts\[0\].value  \# \[\!code highlight\]  
    action\_requests \= interrupt\_value\["action\_requests"\]

    \# Create one decision per action, in order  
    decisions \= \[\]  
    for action in action\_requests:  
        decision \= get\_user\_decision(action)  \# Your logic  
        decisions.append(decision)

    result \= agent.invoke(  
        Command(resume={"decisions": decisions}),  
        config=config,  
        version="v2",  
    )  
\`\`\`

\#\#\# Tailor configurations by risk

Configure different tools based on their risk level:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
interrupt\_on \= {  
    \# High risk: full control (approve, edit, reject)  
    "delete\_file": {"allowed\_decisions": \["approve", "edit", "reject"\]},  
    "send\_email": {"allowed\_decisions": \["approve", "edit", "reject"\]},

    \# Medium risk: no editing allowed  
    "write\_file": {"allowed\_decisions": \["approve", "reject"\]},

    \# Low risk: no interrupts  
    "read\_file": False,  
    "list\_files": False,  
}  
\`\`\`

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/human-in-the-loop.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Memory

\> Add persistent memory to agents built with Deep Agents so they learn and improve across conversations

Memory lets your agent learn and improve across conversations. Deep Agents makes memory first class with filesystem-backed memory: the agent reads and writes memory as files, and you control where those files are stored using \[backends\](/oss/python/deepagents/backends).

\<Note\>  
  This page covers \*\*long-term memory\*\*: memory that persists across conversations. For short-term memory (conversation history and scratch files within a single session), see the \[context engineering\](/oss/python/deepagents/context-engineering) guide. Short-term memory is managed automatically as part of the agent's \[state\](/oss/python/langgraph/graph-api\#state).  
\</Note\>

\#\# How memory works

1\. \*\*Point the agent at memory files.\*\* Pass file paths to \`memory=\` when creating the agent. You can also pass \[skills\](/oss/python/deepagents/skills) via \`skills=\` for procedural memory (reusable instructions that tell the agent \*how\* to perform a task). A \[backend\](/oss/python/deepagents/backends) controls where files are stored and who can access them.  
2\. \*\*Agent reads memory.\*\* The agent can load memory files into the system prompt at startup, or read them on demand during the conversation. For example, \[skills\](/oss/python/deepagents/skills) use on-demand loading: the agent reads only skill descriptions at startup, then reads the full skill file only when it matches a task. This keeps context lean until a capability is needed.  
3\. \*\*Agent updates memory (optional).\*\* When the agent learns new information, it can use its built-in \`edit\_file\` tool to update memory files. Updates can happen during the conversation (the default) or in the background between conversations via \[background consolidation\](\#background-consolidation). Changes are persisted and available in the next conversation. Not all memory is writable: developer-defined \[skills\](/oss/python/deepagents/skills) and \[organization policies\](\#organization-level-memory) are typically read-only. See \[read-only vs writable memory\](\#read-only-vs-writable-memory) for details.

The two most common patterns are \[agent-scoped memory\](\#agent-scoped-memory) (shared across all users) and \[user-scoped memory\](\#user-scoped-memory) (isolated per user).

\#\# Scoped memory

Agent memory can be scoped so the same memory files are accessible to everyone using the agent or memory files can be individual to each user.

\#\#\# Agent-scoped memory

Give the agent its own persistent identity that evolves over time. Agent-scoped memory is shared across all users, so the agent builds up its own persona, accumulated knowledge, and learned preferences through every conversation. As it interacts with users, it develops expertise, refines its approach, and remembers what works. It can also learn and update \[skills\](/oss/python/deepagents/skills) when it has write access.

The key is the backend namespace: setting it to \`(assistant\_id,)\` means every conversation for this agent reads and writes to the same memory file.

\<Note\>  
  Accessing \`ctx.runtime.server\_info\` requires \`deepagents\>=0.5.0\`. On older versions, read the assistant ID from \`get\_config()\["metadata"\]\["assistant\_id"\]\` instead.  
\</Note\>

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent  
from deepagents.backends import CompositeBackend, StateBackend, StoreBackend

agent \= create\_deep\_agent(  
    memory=\["/memories/AGENTS.md"\],  
    skills=\["/skills/"\],  
    backend=CompositeBackend(  
        default=StateBackend(),  
        routes={  
            "/memories/": StoreBackend(  
                namespace=lambda ctx: (  
                    ctx.runtime.server\_info.assistant\_id,  \# \[\!code highlight\]  
                ),  
            ),  
            "/skills/": StoreBackend(  
                namespace=lambda ctx: (  
                    ctx.runtime.server\_info.assistant\_id,  \# \[\!code highlight\]  
                ),  
            ),  
        },  
    ),  
)  
\`\`\`

\<Accordion title="Full example: seed memory and invoke"\>  
  Populate the store with initial memories, then invoke the agent across two threads to see it remember and update what it learns.

  \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
  from langchain\_core.utils.uuid import uuid7

  from deepagents import create\_deep\_agent  
  from deepagents.backends import CompositeBackend, StateBackend, StoreBackend  
  from deepagents.backends.utils import create\_file\_data  
  from langgraph.store.memory import InMemoryStore

  store \= InMemoryStore()  \# Use platform store when deploying to LangSmith

  \# Seed the memory file  
  store.put(  
      ("my-agent",),  
      "/memories/AGENTS.md",  
      create\_file\_data("""\#\# Response style  
  \- Keep responses concise  
  \- Use code examples where possible  
  """),  
  )

  \# Seed a skill  
  store.put(  
      ("my-agent",),  
      "/skills/langgraph-docs/SKILL.md",  
      create\_file\_data("""---  
  name: langgraph-docs  
  description: Fetch relevant LangGraph documentation to provide accurate guidance.  
  \---

  \# langgraph-docs

  Use the fetch\_url tool to read https://docs.langchain.com/llms.txt, then fetch relevant pages.  
  """),  
  )

  agent \= create\_deep\_agent(  
      memory=\["/memories/AGENTS.md"\],  
      skills=\["/skills/"\],  
      backend=lambda rt: CompositeBackend(  
          default=StateBackend(rt),  
          routes={  
              "/memories/": StoreBackend(  
                  rt, namespace=lambda ctx: ("my-agent",)  
              ),  
              "/skills/": StoreBackend(  
                  rt, namespace=lambda ctx: ("my-agent",)  
              ),  
          },  
      ),  
      store=store,  
  )

  \# Thread 1: the agent learns a new preference and saves it to memory  
  config1 \= {"configurable": {"thread\_id": str(uuid7())}}  
  agent.invoke(  
      {"messages": \[{"role": "user", "content": "I prefer detailed explanations. Remember that."}\]},  
      config=config1,  
  )

  \# Thread 2: the agent reads memory and applies the preference  
  config2 \= {"configurable": {"thread\_id": str(uuid7())}}  
  agent.invoke(  
      {"messages": \[{"role": "user", "content": "Explain how transformers work."}\]},  
      config=config2,  
  )  
  \`\`\`  
\</Accordion\>

\#\#\# User-scoped memory

Give each user their own memory file. The agent remembers preferences, context, and history per user while core agent instructions stay fixed. Users can also have per-user \[skills\](/oss/python/deepagents/skills) if stored in a user-scoped backend.

The namespace uses \`(user\_id,)\` so each user gets an isolated copy of the memory file. User A's preferences never leak into User B's conversations.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent  
from deepagents.backends import CompositeBackend, StateBackend, StoreBackend

agent \= create\_deep\_agent(  
    memory=\["/memories/preferences.md"\],  
    skills=\["/skills/"\],  
    backend=CompositeBackend(  
        default=StateBackend(),  
        routes={  
            "/memories/": StoreBackend(  
                namespace=lambda ctx: (ctx.runtime.context.user\_id,),  
            ),  
            "/skills/": StoreBackend(  
                namespace=lambda ctx: (ctx.runtime.context.user\_id,),  
            ),  
        },  
    ),  
)  
\`\`\`

\<Accordion title="Full example: isolated memory across users"\>  
  Seed per-user memories and invoke the agent as two different users. Each user sees only their own preferences.

  \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
  from langchain\_core.utils.uuid import uuid7  
  from dataclasses import dataclass

  from deepagents import create\_deep\_agent  
  from deepagents.backends import CompositeBackend, StateBackend, StoreBackend  
  from deepagents.backends.utils import create\_file\_data  
  from langgraph.store.memory import InMemoryStore

  @dataclass  
  class Context:  
      user\_id: str

  store \= InMemoryStore()  \# Use platform store when deploying to LangSmith

  \# Seed preferences for two users  
  store.put(  
      ("user-alice",),  
      "/memories/preferences.md",  
      create\_file\_data("""\#\# Preferences  
  \- Likes concise bullet points  
  \- Prefers Python examples  
  """),  
  )  
  store.put(  
      ("user-bob",),  
      "/memories/preferences.md",  
      create\_file\_data("""\#\# Preferences  
  \- Likes detailed explanations  
  \- Prefers TypeScript examples  
  """),  
  )

  \# Seed a skill for Alice  
  store.put(  
      ("user-alice",),  
      "/skills/langgraph-docs/SKILL.md",  
      create\_file\_data("""---  
  name: langgraph-docs  
  description: Fetch relevant LangGraph documentation to provide accurate guidance.  
  \---

  \# langgraph-docs

  Use the fetch\_url tool to read https://docs.langchain.com/llms.txt, then fetch relevant pages.  
  """),  
  )

  agent \= create\_deep\_agent(  
      memory=\["/memories/preferences.md"\],  
      skills=\["/skills/"\],  
      context\_schema=Context,  
      backend=lambda rt: CompositeBackend(  
          default=StateBackend(rt),  
          routes={  
              "/memories/": StoreBackend(  
                  rt,  
                  namespace=lambda ctx: (ctx.runtime.context.user\_id,),  
              ),  
              "/skills/": StoreBackend(  
                  rt,  
                  namespace=lambda ctx: (ctx.runtime.context.user\_id,),  
              ),  
          },  
      ),  
      store=store,  
  )

  \# Alice's conversation — agent sees her preferences  
  agent.invoke(  
      {"messages": \[{"role": "user", "content": "How do I read a CSV file?"}\]},  
      config={"configurable": {"thread\_id": str(uuid7())}},  
      context=Context(user\_id="user-alice"),  
  )

  \# Bob's conversation — agent sees his preferences, not Alice's  
  agent.invoke(  
      {"messages": \[{"role": "user", "content": "How do I read a CSV file?"}\]},  
      config={"configurable": {"thread\_id": str(uuid7())}},  
      context=Context(user\_id="user-bob"),  
  )  
  \`\`\`  
\</Accordion\>

\#\# Advanced usage

On top of the basic configuration options for memory paths and scope, you can also configure more advanced parameters for memory:

| Dimension             | Question it answers             | Options                                                                                                                                                                                    |  
| \--------------------- | \------------------------------- | \------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |  
| \*\*Duration\*\*          | How long does it last?          | \[Short-term\](/oss/python/deepagents/context-engineering) (single conversation) or \[long-term\](\#quick-start) (across conversations)                                                         |  
| \*\*Information type\*\*  | What kind of information is it? | \[Episodic\](\#episodic-memory) (past experiences), \[procedural\](/oss/python/deepagents/skills) (instructions and skills), or \[semantic\](/oss/python/concepts/memory\#semantic-memory) (facts) |  
| \*\*Scope\*\*             | Who can see and modify it?      | \[User\](\#user-scoped-memory), \[agent\](\#agent-scoped-memory), or \[organization\](\#organization-level-memory)                                                                                  |  
| \*\*Update strategy\*\*   | When are memories written?      | During conversation (default) or \[between conversations\](\#background-consolidation)                                                                                                        |  
| \*\*Retrieval\*\*         | How are memories read?          | Loaded into prompt (default) or on demand (e.g., \[skills\](/oss/python/deepagents/skills))                                                                                                  |  
| \*\*Agent permissions\*\* | Can the agent write to memory?  | \[Read-write\](\#read-only-vs-writable-memory) (default) or \[read-only\](\#read-only-vs-writable-memory) (for shared policies)                                                                  |

\#\#\# Episodic memory

Episodic memory stores records of past experiences: what happened, in what order, and what the outcome was. Unlike semantic memory (facts and preferences stored in files like \`AGENTS.md\`), episodic memory preserves the full conversational context so the agent can recall \*how\* a problem was solved, not just \*what\* was learned from it.

Deep Agents already use \[checkpointers\](/oss/python/langgraph/persistence\#checkpoints) which is the mechanism that supports episodic memory: every conversation is persisted as a checkpointed thread.

To make past conversations searchable, wrap thread search in a tool. The \`user\_id\` is pulled from the runtime context rather than passed as a parameter:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langgraph\_sdk import get\_client  
from langchain.tools import tool, ToolRuntime

client \= get\_client(url="\<DEPLOYMENT\_URL\>")

@tool  
async def search\_past\_conversations(query: str, runtime: ToolRuntime) \-\> str:  
    """Search past conversations for relevant context."""  
    user\_id \= runtime.server\_info.user.identity  \# \[\!code highlight\]  
    threads \= await client.threads.search(  
        metadata={"user\_id": user\_id},  
        limit=5,  
    )  
    results \= \[\]  
    for thread in threads:  
        history \= await client.threads.get\_history(thread\_id=thread\["thread\_id"\])  
        results.append(history)  
    return str(results)  
\`\`\`

You can scope thread search by user or organization by adjusting the metadata filter:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\# Search conversations for a specific user  
threads \= await client.threads.search(  
    metadata={"user\_id": user\_id},  
    limit=5,  
)

\# Search conversations across an organization  
threads \= await client.threads.search(  
    metadata={"org\_id": org\_id},  
    limit=5,  
)  
\`\`\`

This is useful for agents that perform complex, multi-step tasks. For example, a coding agent can look back at a past debugging session and skip straight to the likely root cause.

\#\#\# Organization-level memory

Organization-level memory follows the same pattern as user-scoped memory, but with an organization-wide namespace instead of a per-user one. Use it for policies or knowledge that should apply across all users and agents in an organization.

Organization memory is typically \*\*read-only\*\* to prevent prompt injection via shared state. See \[read-only vs writable memory\](\#read-only-vs-writable-memory) for details.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent  
from deepagents.backends import CompositeBackend, StateBackend, StoreBackend

agent \= create\_deep\_agent(  
    memory=\[  
        "/memories/preferences.md",  
        "/policies/compliance.md",  
    \],  
    backend=CompositeBackend(  
        default=StateBackend(),  
        routes={  
            "/memories/": StoreBackend(  
                namespace=lambda ctx: (ctx.runtime.context.user\_id,),  
            ),  
            "/policies/": StoreBackend(  
                namespace=lambda ctx: (ctx.runtime.context.org\_id,),  
            ),  
        },  
    ),  
)  
\`\`\`

Populate organization memory from your application code:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langgraph\_sdk import get\_client  
from deepagents.backends.utils import create\_file\_data

client \= get\_client(url="\<DEPLOYMENT\_URL\>")

await client.store.put\_item(  
    (org\_id,),  
    "/compliance.md",  
    create\_file\_data("""\#\# Compliance policies  
\- Never disclose internal pricing  
\- Always include disclaimers on financial advice  
"""),  
)  
\`\`\`

Use \[policy hooks\](/oss/python/deepagents/backends\#add-policy-hooks) to enforce that org-level memory is read-only.

\#\#\# Background consolidation

By default, the agent writes memories during the conversation (hot path). An alternative is to process memories \*\*between conversations\*\* as a background task, sometimes called \*\*sleep time compute\*\*. A separate deep agent reviews recent conversations, extracts key facts, and merges them with existing memories.

| Approach                               | Pros                                                                 | Cons                                                                    |  
| \-------------------------------------- | \-------------------------------------------------------------------- | \----------------------------------------------------------------------- |  
| \*\*Hot path\*\* (during conversation)     | Memories available immediately, transparent to user                  | Adds latency, agent must multitask                                      |  
| \*\*Background\*\* (between conversations) | No user-facing latency, can synthesize across multiple conversations | Memories not available until next conversation, requires a second agent |

For most applications, the hot path is sufficient. Add background consolidation when you need to reduce latency or improve memory quality across many conversations.

The recommended pattern is to deploy a \*\*consolidation agent\*\* alongside your main agent — a deep agent that reads recent conversation history, extracts key facts, and merges them into the memory store — and trigger it on a \[cron schedule\](\#cron). Pick a cadence that reflects how often your users actually interact with the agent: a chat product with steady daily traffic might consolidate every few hours, while a tool used a handful of times per week only needs to run nightly or weekly. Consolidating much more often than users converse just burns tokens on no-op runs.

\#\#\#\# Consolidation agent

The consolidation agent reads recent conversation history and merges key facts into the memory store. Register it alongside your main agent in \`langgraph.json\`:

\`\`\`python consolidation\_agent.py theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from datetime import datetime, timedelta, timezone

from deepagents import create\_deep\_agent  
from langchain.tools import tool, ToolRuntime  
from langgraph\_sdk import get\_client

sdk\_client \= get\_client(url="\<DEPLOYMENT\_URL\>")

@tool  
async def search\_recent\_conversations(query: str, runtime: ToolRuntime) \-\> str:  
    """Search this user's conversations updated in the last 6 hours."""  
    user\_id \= runtime.server\_info.user.identity  \# \[\!code highlight\]

    since \= datetime.now(timezone.utc) \- timedelta(hours=6)  
    threads \= await sdk\_client.threads.search(  
        metadata={"user\_id": user\_id},  
        updated\_after=since.isoformat(),  
        limit=20,  
    )  
    conversations \= \[\]  
    for thread in threads:  
        history \= await sdk\_client.threads.get\_history(  
            thread\_id=thread\["thread\_id"\]  
        )  
        conversations.append(history\["values"\]\["messages"\])  
    return str(conversations)

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    system\_prompt="""Review recent conversations and update the user's memory file.  
Merge new facts, remove outdated information, and keep it concise.""",  
    tools=\[search\_recent\_conversations\],  
)  
\`\`\`

\`\`\`json langgraph.json theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
{  
  "dependencies": \["."\],  
  "graphs": {  
    "agent": "./agent.py:agent",  
    "consolidation\_agent": "./consolidation\_agent.py:agent"  
  },  
  "env": ".env"  
}  
\`\`\`

\#\#\#\# Cron

A \[cron job\](/langsmith/cron-jobs) runs the consolidation agent on a fixed schedule. The agent searches recent conversations and synthesizes them into memory. Match the schedule to your usage patterns so consolidation runs roughly track real activity.

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph LR  
    Store\[(Memory store)\] \-.-\>|reads| Conv1\[Conversation 1\]  
    Store \-.-\>|reads| Conv2\[Conversation 2\]  
    Cron\[Cron schedule\] \--\>|periodic| Agent\[Consolidation agent\]  
    Agent \--\>|writes| Store

    classDef trigger fill:\#DCFCE7,stroke:\#16A34A,stroke-width:2px,color:\#14532D  
    classDef process fill:\#DBEAFE,stroke:\#2563EB,stroke-width:2px,color:\#1E3A8A  
    classDef output fill:\#F3E8FF,stroke:\#9333EA,stroke-width:2px,color:\#581C87  
    classDef schedule fill:\#FEF3C7,stroke:\#D97706,stroke-width:2px,color:\#92400E

    class Conv1,Conv2 trigger  
    class Agent process  
    class Store output  
    class Cron schedule  
\`\`\`

Schedule the consolidation agent with a cron job:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langgraph\_sdk import get\_client

client \= get\_client(url="\<DEPLOYMENT\_URL\>")

cron\_job \= await client.crons.create(  
    assistant\_id="consolidation\_agent",  
    schedule="0 \*/6 \* \* \*",  
    input={"messages": \[{"role": "user", "content": "Consolidate recent memories."}\]},  
)  
\`\`\`

\<Note\>  
  All cron schedules are interpreted in \*\*UTC\*\*. See \[cron jobs\](/langsmith/cron-jobs) for details on managing and deleting cron jobs.  
\</Note\>

\<Warning\>  
  The cron interval must match the lookback window inside the consolidation agent. The example above runs every 6 hours (\`0 \*/6 \* \* \*\`) and the agent's \`search\_recent\_conversations\` tool looks back \`timedelta(hours=6)\` — keep these in sync. If the cron runs more often than the lookback, you'll reprocess the same conversations; if it runs less often, you'll drop memories that fall outside the window.  
\</Warning\>

For more on deploying agents with background processes, see \[going to production\](/oss/python/deepagents/going-to-production).

\#\#\# Read-only vs writable memory

By default, the agent can both read and write memory files. For shared state like organization policies or compliance rules, you may want to make memory \*\*read-only\*\* so the agent can reference it but not modify it. This prevents prompt injection via shared memory and ensures that only your application code controls what's in the file.

| Permission               | Use case                                                                                                                   | How it works                                                                                                                                                           |  
| \------------------------ | \-------------------------------------------------------------------------------------------------------------------------- | \---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |  
| \*\*Read-write\*\* (default) | User preferences, agent self-improvement, learned \[skills\](/oss/python/deepagents/skills)                                  | Agent updates files via \`edit\_file\` tool                                                                                                                               |  
| \*\*Read-only\*\*            | Organization policies, compliance rules, shared knowledge bases, developer-defined \[skills\](/oss/python/deepagents/skills) | Populate via application code or the \[Store API\](/langsmith/custom-store). Use \[policy hooks\](/oss/python/deepagents/backends\#add-policy-hooks) to block agent writes. |

\*\*Security considerations:\*\* If one user can write to memory that another user reads, a malicious user could inject instructions into shared state. To mitigate this:

\* \*\*Default to user scope\*\* \`(user\_id)\` unless you have a specific reason to share  
\* Use \*\*read-only memory\*\* for shared policies (populate via application code, not the agent)  
\* Add \*\*human-in-the-loop\*\* validation before the agent writes to shared memory. Use an \[interrupt\](/oss/python/langgraph/interrupts) to require human approval for writes to sensitive paths.

To enforce read-only memory, use \[policy hooks\](/oss/python/deepagents/backends\#add-policy-hooks) on the backend to reject write operations to specific paths.

\#\#\# Concurrent writes

Multiple threads can write to memory in parallel, but concurrent writes to the \*\*same file\*\* can cause last-write-wins conflicts. For user-scoped memory this is rare since users typically have one active conversation at a time. For agent-scoped or organization-scoped memory, consider using \[background consolidation\](\#background-consolidation) to serialize writes, or structure memory as separate files per topic to reduce contention.

In practice, if a write fails due to a conflict, the LLM is usually smart enough to retry or recover gracefully, so a single lost write is not catastrophic.

\#\#\# Multiple agents in the same deployment

To give each agent its own memory in a shared deployment, add \`assistant\_id\` to the namespace:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
StoreBackend(  
    namespace=lambda ctx: (  
        ctx.runtime.server\_info.assistant\_id,  \# \[\!code highlight\]  
        ctx.runtime.context.user\_id,  
    ),  
)  
\`\`\`

Use \`assistant\_id\` alone if you only need per-agent isolation without per-user scoping.

\<Tip\>  
  Use \[LangSmith tracing\](/langsmith/trace-with-langgraph) to audit what your agent writes to memory. Every file write appears as a tool call in the trace.  
\</Tip\>

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/memory.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Streaming

\> Stream real-time updates from deep agent runs and subagent execution

Deep Agents build on LangGraph's streaming infrastructure with first-class support for subagent streams. When a deep agent delegates work to subagents, you can stream updates from each subagent independently—tracking progress, LLM tokens, and tool calls in real time.

What's possible with deep agent streaming:

\* \<Icon icon="diagram-subtask" size={16} /\> \[\*\*Stream subagent progress\*\*\](\#subagent-progress)—track each subagent's execution as it runs in parallel.  
\* \<Icon icon="square-binary" size={16} /\> \[\*\*Stream LLM tokens\*\*\](\#llm-tokens)—stream tokens from the main agent and each subagent.  
\* \<Icon icon="screwdriver-wrench" size={16} /\> \[\*\*Stream tool calls\*\*\](\#tool-calls)—see tool calls and results from within subagent execution.  
\* \<Icon icon="table" size={16} /\> \[\*\*Stream custom updates\*\*\](\#custom-updates)—emit user-defined signals from inside subagent nodes.

\#\# Enable subgraph streaming

Deep Agents use LangGraph's subgraph streaming to surface events from subagent execution. To receive subagent events, enable \`stream\_subgraphs\` when streaming.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

agent \= create\_deep\_agent(  
    system\_prompt="You are a helpful research assistant",  
    subagents=\[  
        {  
            "name": "researcher",  
            "description": "Researches a topic in depth",  
            "system\_prompt": "You are a thorough researcher.",  
        },  
    \],  
)

for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Research quantum computing advances"}\]},  
    stream\_mode="updates",  
    subgraphs=True,  \# \[\!code highlight\]  
    version="v2",  \# \[\!code highlight\]  
):  
    if chunk\["type"\] \== "updates":  
        if chunk\["ns"\]:  
            \# Subagent event \- namespace identifies the source  
            print(f"\[subagent: {chunk\['ns'\]}\]")  
        else:  
            \# Main agent event  
            print("\[main agent\]")  
        print(chunk\["data"\])  
\`\`\`

\#\# Namespaces

When \`subgraphs\` is enabled, each streaming event includes a \*\*namespace\*\* that identifies which agent produced it. The namespace is a path of node names and task IDs that represents the agent hierarchy.

| Namespace                                  | Source                                                           |  
| \------------------------------------------ | \---------------------------------------------------------------- |  
| \`()\` (empty)                               | Main agent                                                       |  
| \`("tools:abc123",)\`                        | A subagent spawned by the main agent's \`task\` tool call \`abc123\` |  
| \`("tools:abc123", "model\_request:def456")\` | The model request node inside a subagent                         |

Use namespaces to route events to the correct UI component:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Plan my vacation"}\]},  
    stream\_mode="updates",  
    subgraphs=True,  
    version="v2",  
):  
    if chunk\["type"\] \== "updates":  
        \# Check if this event came from a subagent  
        is\_subagent \= any(  
            segment.startswith("tools:") for segment in chunk\["ns"\]  
        )

        if is\_subagent:  
            \# Extract the tool call ID from the namespace  
            tool\_call\_id \= next(  
                s.split(":")\[1\] for s in chunk\["ns"\] if s.startswith("tools:")  
            )  
            print(f"Subagent {tool\_call\_id}: {chunk\['data'\]}")  
        else:  
            print(f"Main agent: {chunk\['data'\]}")  
\`\`\`

\#\# Subagent progress

Use \`stream\_mode="updates"\` to track subagent progress as each step completes. This is useful for showing which subagents are active and what work they've completed.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

agent \= create\_deep\_agent(  
    system\_prompt=(  
        "You are a project coordinator. Always delegate research tasks "  
        "to your researcher subagent using the task tool. Keep your final response to one sentence."  
    ),  
    subagents=\[  
        {  
            "name": "researcher",  
            "description": "Researches topics thoroughly",  
            "system\_prompt": (  
                "You are a thorough researcher. Research the given topic "  
                "and provide a concise summary in 2-3 sentences."  
            ),  
        },  
    \],  
)

for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Write a short summary about AI safety"}\]},  
    stream\_mode="updates",  
    subgraphs=True,  
    version="v2",  
):  
    if chunk\["type"\] \== "updates":  
        \# Main agent updates (empty namespace)  
        if not chunk\["ns"\]:  
            for node\_name, data in chunk\["data"\].items():  
                if node\_name \== "tools":  
                    \# Subagent results returned to main agent  
                    for msg in data.get("messages", \[\]):  
                        if msg.type \== "tool":  
                            print(f"\\nSubagent complete: {msg.name}")  
                            print(f"  Result: {str(msg.content)\[:200\]}...")  
                else:  
                    print(f"\[main agent\] step: {node\_name}")

        \# Subagent updates (non-empty namespace)  
        else:  
            for node\_name, data in chunk\["data"\].items():  
                print(f"  \[{chunk\['ns'\]\[0\]}\] step: {node\_name}")  
\`\`\`

\`\`\`shell title="Output" theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\[main agent\] step: model\_request  
  \[tools:call\_abc123\] step: model\_request  
  \[tools:call\_abc123\] step: tools  
  \[tools:call\_abc123\] step: model\_request

Subagent complete: task  
  Result: \#\# AI Safety Report...  
\[main agent\] step: model\_request  
\`\`\`

\#\# LLM tokens

Use \`stream\_mode="messages"\` to stream individual tokens from both the main agent and subagents. Each message event includes metadata that identifies the source agent.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
current\_source \= ""

for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Research quantum computing advances"}\]},  
    stream\_mode="messages",  
    subgraphs=True,  
    version="v2",  
):  
    if chunk\["type"\] \== "messages":  
        token, metadata \= chunk\["data"\]

        \# Check if this event came from a subagent (namespace contains "tools:")  
        is\_subagent \= any(s.startswith("tools:") for s in chunk\["ns"\])

        if is\_subagent:  
            \# Token from a subagent  
            subagent\_ns \= next(s for s in chunk\["ns"\] if s.startswith("tools:"))  
            if subagent\_ns \!= current\_source:  
                print(f"\\n\\n--- \[subagent: {subagent\_ns}\] \---")  
                current\_source \= subagent\_ns  
            if token.content:  
                print(token.content, end="", flush=True)  
        else:  
            \# Token from the main agent  
            if "main" \!= current\_source:  
                print("\\n\\n--- \[main agent\] \---")  
                current\_source \= "main"  
            if token.content:  
                print(token.content, end="", flush=True)

print()  
\`\`\`

\#\# Tool calls

When subagents use tools, you can stream tool call events to display what each subagent is doing. Tool call chunks appear in the \`messages\` stream mode.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Research recent quantum computing advances"}\]},  
    stream\_mode="messages",  
    subgraphs=True,  
    version="v2",  
):  
    if chunk\["type"\] \== "messages":  
        token, metadata \= chunk\["data"\]

        \# Identify source: "main" or the subagent namespace segment  
        is\_subagent \= any(s.startswith("tools:") for s in chunk\["ns"\])  
        source \= next((s for s in chunk\["ns"\] if s.startswith("tools:")), "main") if is\_subagent else "main"

        \# Tool call chunks (streaming tool invocations)  
        if token.tool\_call\_chunks:  
            for tc in token.tool\_call\_chunks:  
                if tc.get("name"):  
                    print(f"\\n\[{source}\] Tool call: {tc\['name'\]}")  
                \# Args stream in chunks \- write them incrementally  
                if tc.get("args"):  
                    print(tc\["args"\], end="", flush=True)

        \# Tool results  
        if token.type \== "tool":  
            print(f"\\n\[{source}\] Tool result \[{token.name}\]: {str(token.content)\[:150\]}")

        \# Regular AI content (skip tool call messages)  
        if token.type \== "ai" and token.content and not token.tool\_call\_chunks:  
            print(token.content, end="", flush=True)

print()  
\`\`\`

\#\# Custom updates

Use \[\`get\_stream\_writer\`\](https://reference.langchain.com/python/langgraph/config/get\_stream\_writer) inside your subagent tools to emit custom progress events:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
import time  
from langchain.tools import tool  
from langgraph.config import get\_stream\_writer  
from deepagents import create\_deep\_agent

@tool  
def analyze\_data(topic: str) \-\> str:  
    """Run a data analysis on a given topic.

    This tool performs the actual analysis and emits progress updates.  
    You MUST call this tool for any analysis request.  
    """  
    writer \= get\_stream\_writer()

    writer({"status": "starting", "topic": topic, "progress": 0})  
    time.sleep(0.5)

    writer({"status": "analyzing", "progress": 50})  
    time.sleep(0.5)

    writer({"status": "complete", "progress": 100})  
    return (  
        f'Analysis of "{topic}": Customer sentiment is 85% positive, '  
        "driven by product quality and support response times."  
    )

agent \= create\_deep\_agent(  
    system\_prompt=(  
        "You are a coordinator. For any analysis request, you MUST delegate "  
        "to the analyst subagent using the task tool. Never try to answer directly. "  
        "After receiving the result, summarize it in one sentence."  
    ),  
    subagents=\[  
        {  
            "name": "analyst",  
            "description": "Performs data analysis with real-time progress tracking",  
            "system\_prompt": (  
                "You are a data analyst. You MUST call the analyze\_data tool "  
                "for every analysis request. Do not use any other tools. "  
                "After the analysis completes, report the result."  
            ),  
            "tools": \[analyze\_data\],  
        },  
    \],  
)

for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Analyze customer satisfaction trends"}\]},  
    stream\_mode="custom",  
    subgraphs=True,  
    version="v2",  
):  
    if chunk\["type"\] \== "custom":  
        is\_subagent \= any(s.startswith("tools:") for s in chunk\["ns"\])  
        if is\_subagent:  
            subagent\_ns \= next(s for s in chunk\["ns"\] if s.startswith("tools:"))  
            print(f"\[{subagent\_ns}\]", chunk\["data"\])  
        else:  
            print("\[main\]", chunk\["data"\])  
\`\`\`

\`\`\`shell title="Output" theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\[tools:call\_abc123\] {'status': 'starting', 'topic': 'customer satisfaction trends', 'progress': 0}  
\[tools:call\_abc123\] {'status': 'analyzing', 'progress': 50}  
\[tools:call\_abc123\] {'status': 'complete', 'progress': 100}  
\`\`\`

\#\# Stream multiple modes

Combine multiple stream modes to get a complete picture of agent execution:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\# Skip internal middleware steps \- only show meaningful node names  
INTERESTING\_NODES \= {"model\_request", "tools"}

last\_source \= ""  
mid\_line \= False  \# True when we've written tokens without a trailing newline

for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Analyze the impact of remote work on team productivity"}\]},  
    stream\_mode=\["updates", "messages", "custom"\],  
    subgraphs=True,  
    version="v2",  
):  
    is\_subagent \= any(s.startswith("tools:") for s in chunk\["ns"\])  
    source \= "subagent" if is\_subagent else "main"

    if chunk\["type"\] \== "updates":  
        for node\_name in chunk\["data"\]:  
            if node\_name not in INTERESTING\_NODES:  
                continue  
            if mid\_line:  
                print()  
                mid\_line \= False  
            print(f"\[{source}\] step: {node\_name}")

    elif chunk\["type"\] \== "messages":  
        token, metadata \= chunk\["data"\]  
        if token.content:  
            \# Print a header when the source changes  
            if source \!= last\_source:  
                if mid\_line:  
                    print()  
                    mid\_line \= False  
                print(f"\\n\[{source}\] ", end="")  
                last\_source \= source  
            print(token.content, end="", flush=True)  
            mid\_line \= True

    elif chunk\["type"\] \== "custom":  
        if mid\_line:  
            print()  
            mid\_line \= False  
        print(f"\[{source}\] custom event:", chunk\["data"\])

print()  
\`\`\`

\#\# Common patterns

\#\#\# Track subagent lifecycle

Monitor when subagents start, run, and complete:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
active\_subagents \= {}

for chunk in agent.stream(  
    {"messages": \[{"role": "user", "content": "Research the latest AI safety developments"}\]},  
    stream\_mode="updates",  
    subgraphs=True,  
    version="v2",  
):  
    if chunk\["type"\] \== "updates":  
        for node\_name, data in chunk\["data"\].items():  
            \# ─── Phase 1: Detect subagent starting ────────────────────────  
            \# When the main agent's model\_request contains task tool calls,  
            \# a subagent has been spawned.  
            if not chunk\["ns"\] and node\_name \== "model\_request":  
                for msg in data.get("messages", \[\]):  
                    for tc in getattr(msg, "tool\_calls", \[\]):  
                        if tc\["name"\] \== "task":  
                            active\_subagents\[tc\["id"\]\] \= {  
                                "type": tc\["args"\].get("subagent\_type"),  
                                "description": tc\["args"\].get("description", "")\[:80\],  
                                "status": "pending",  
                            }  
                            print(  
                                f'\[lifecycle\] PENDING  → subagent "{tc\["args"\].get("subagent\_type")}" '  
                                f'({tc\["id"\]})'  
                            )

            \# ─── Phase 2: Detect subagent running ─────────────────────────  
            \# When we receive events from a tools:UUID namespace, that  
            \# subagent is actively executing.  
            if chunk\["ns"\] and chunk\["ns"\]\[0\].startswith("tools:"):  
                pregel\_id \= chunk\["ns"\]\[0\].split(":")\[1\]  
                \# Check if any pending subagent needs to be marked running.  
                \# Note: the pregel task ID differs from the tool\_call\_id,  
                \# so we mark any pending subagent as running on first subagent event.  
                for sub\_id, sub in active\_subagents.items():  
                    if sub\["status"\] \== "pending":  
                        sub\["status"\] \= "running"  
                        print(  
                            f'\[lifecycle\] RUNNING  → subagent "{sub\["type"\]}" '  
                            f"(pregel: {pregel\_id})"  
                        )  
                        break

            \# ─── Phase 3: Detect subagent completing ──────────────────────  
            \# When the main agent's tools node returns a tool message,  
            \# the subagent has completed and returned its result.  
            if not chunk\["ns"\] and node\_name \== "tools":  
                for msg in data.get("messages", \[\]):  
                    if msg.type \== "tool":  
                        sub \= active\_subagents.get(msg.tool\_call\_id)  
                        if sub:  
                            sub\["status"\] \= "complete"  
                            print(  
                                f'\[lifecycle\] COMPLETE → subagent "{sub\["type"\]}" '  
                                f"({msg.tool\_call\_id})"  
                            )  
                            print(f"  Result preview: {str(msg.content)\[:120\]}...")

\# Print final state  
print("\\n--- Final subagent states \---")  
for sub\_id, sub in active\_subagents.items():  
    print(f"  {sub\['type'\]}: {sub\['status'\]}")  
\`\`\`

\#\# v2 streaming format

\<Note\>  
  Requires LangGraph \>= 1.1.  
\</Note\>

All examples on this page use the v2 streaming format (\`version="v2"\`), which is the recommended approach. Every chunk is a \`StreamPart\` dict with \`type\`, \`ns\`, and \`data\` keys — the same shape regardless of stream mode, number of modes, or subgraph settings.

The v2 format eliminates nested tuple unpacking, making it straightforward to handle subgraph streaming in Deep Agents. Compare the two formats:

\<CodeGroup\>  
  \`\`\`python v2 (recommended) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
  \# Unified format — no nested tuple unpacking  
  for chunk in agent.stream(  
      {"messages": \[{"role": "user", "content": "Research quantum computing"}\]},  
      stream\_mode=\["updates", "messages", "custom"\],  
      subgraphs=True,  
      version="v2",  
  ):  
      print(chunk\["type"\])  \# "updates", "messages", or "custom"  
      print(chunk\["ns"\])    \# () for main agent, ("tools:\<id\>",) for subagent  
      print(chunk\["data"\])  \# payload  
  \`\`\`

  \`\`\`python v1 (legacy) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
  \# Must handle (namespace, (mode, data)) nested tuples  
  for namespace, chunk in agent.stream(  
      {"messages": \[{"role": "user", "content": "Research quantum computing"}\]},  
      stream\_mode=\["updates", "messages", "custom"\],  
      subgraphs=True,  
  ):  
      mode, data \= chunk\[0\], chunk\[1\]  
      print(mode)       \# "updates", "messages", or "custom"  
      print(namespace)  \# () for main agent, ("tools:\<id\>",) for subagent  
      print(data)       \# payload  
  \`\`\`  
\</CodeGroup\>

See the \[LangGraph streaming docs\](/oss/python/langgraph/streaming\#stream-output-format-v2) for more details on the v2 format, including type narrowing and Pydantic/dataclass coercion.

\#\# Related

\* \[Subagents\](/oss/python/deepagents/subagents)—Configure and use subagents with Deep Agents  
\* \[Frontend streaming\](/oss/python/deepagents/streaming/frontend)—Build React UIs with \`useStream\` for Deep Agents  
\* \[LangChain streaming overview\](/oss/python/langchain/streaming/overview)—General streaming concepts with LangChain agents

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/streaming.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Skills

\> Learn how to extend your deep agent's capabilities with skills

Skills are reusable agent capabilities that provide specialized workflows and domain knowledge.

You can use \[Agent Skills\](https://agentskills.io/) to provide your deep agent with new capabilities and expertise. For ready-to-use skills that improve your agent's performance on LangChain ecosystem tasks, see the \[LangChain Skills\](https://github.com/langchain-ai/langchain-skills) repository.

Deep agent skills follow the \[Agent Skills specification\](https://agentskills.io/specification).

\#\# What are skills

Skills are a directory of folders, where each folder has one or more files that contain context the agent can use:

\* A \`SKILL.md\` file containing instructions and metadata about the skill  
\* Additional scripts (optional)  
\* Additional reference info, such as docs (optional)  
\* Additional assets, such as templates and other resources (optional)

\<Note\>  
  Any additional assets (scripts, docs, templates, or other resources) must be referenced in the \`SKILL.md\` file with information on what the file contains and how to use it so the agent can decide when to use them.  
\</Note\>

\#\# How skills work

When you create a deep agent, you can pass in a list of directories containing skills. As the agent starts, it reads through the frontmatter of each \`SKILL.md\` file.

When the agent receives a prompt, the agent checks if it can use any skills while fulfilling the prompt. If it finds a matching prompt, it then reviews the rest of the skill files. This pattern of only reviewing the skill information when needed is called \*progressive disclosure\*.

\#\# Example

You might have a skills folder that contains a skill to use a docs site in a certain way, as well as another skill to search the arXiv preprint repository of research papers:

\`\`\`plaintext  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    skills/  
    ├── langgraph-docs  
    │   └── SKILL.md  
    └── arxiv\_search  
        ├── SKILL.md  
        └── arxiv\_search.py \# code for searching arXiv  
\`\`\`

The \`SKILL.md\` file always follows the same pattern, starting with metadata in the frontmatter and followed by the instructions for the skill.

The following example shows a skill that gives instructions on how to provide relevant langgraph docs when prompted:

\`\`\`md  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\---  
name: langgraph-docs  
description: Use this skill for requests related to LangGraph in order to fetch relevant documentation to provide accurate, up-to-date guidance.  
\---

\# langgraph-docs

\#\# Overview

This skill explains how to access LangGraph Python documentation to help answer questions and guide implementation.

\#\# Instructions

\#\#\# 1\. Fetch the Documentation Index

Use the fetch\_url tool to read the following URL:  
https://docs.langchain.com/llms.txt

This provides a structured list of all available documentation with descriptions.

\#\#\# 2\. Select Relevant Documentation

Based on the question, identify 2-4 most relevant documentation URLs from the index. Prioritize:

\- Specific how-to guides for implementation questions  
\- Core concept pages for understanding questions  
\- Tutorials for end-to-end examples  
\- Reference docs for API details

\#\#\# 3\. Fetch Selected Documentation

Use the fetch\_url tool to read the selected documentation URLs.

\#\#\# 4\. Provide Accurate Guidance

After reading the documentation, complete the user's request.  
\`\`\`

For more example skills, see \[Deep Agent example skills\](https://github.com/langchain-ai/deepagents/tree/main/libs/cli/examples/skills).

\<Warning\>  
  \*\*Important\*\*

  Refer to the full \[Agent Skills Specification\](https://agentskills.io/specification) for information on constraints and best practices when authoring skill files. Notably:

  \* The \`description\` field is truncated to 1024 characters if it exceeds that length.  
  \* In Deep Agents, \`SKILL.md\` files must be under 10 MB. Files exceeding this limit are skipped during skill loading.  
\</Warning\>

\#\#\# Full example

The following example shows a \`SKILL.md\` file using all available frontmatter fields:

\`\`\`md expandable theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\---  
name: langgraph-docs  
description: Use this skill for requests related to LangGraph in order to fetch relevant documentation to provide accurate, up-to-date guidance.  
license: MIT  
compatibility: Requires internet access for fetching documentation URLs  
metadata:  
  author: langchain  
  version: "1.0"  
allowed-tools: fetch\_url  
\---

\# langgraph-docs

\#\# Overview

This skill explains how to access LangGraph Python documentation to help answer questions and guide implementation.

\#\# Instructions

\#\#\# 1\. Fetch the documentation index

Use the fetch\_url tool to read the following URL:  
https://docs.langchain.com/llms.txt

This provides a structured list of all available documentation with descriptions.

\#\#\# 2\. Select relevant documentation

Based on the question, identify 2-4 most relevant documentation URLs from the index. Prioritize:

\- Specific how-to guides for implementation questions  
\- Core concept pages for understanding questions  
\- Tutorials for end-to-end examples  
\- Reference docs for API details

\#\#\# 3\. Fetch selected documentation

Use the fetch\_url tool to read the selected documentation URLs.

\#\#\# 4\. Provide accurate guidance

After reading the documentation, complete the user's request.  
\`\`\`

\#\# Usage

Pass the skills directory when creating your deep agent:

\<Tabs\>  
  \<Tab title="StateBackend"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from urllib.request import urlopen  
    from deepagents import create\_deep\_agent  
    from deepagents.backends.utils import create\_file\_data  
    from langgraph.checkpoint.memory import MemorySaver

    checkpointer \= MemorySaver()

    skill\_url \= "https://raw.githubusercontent.com/langchain-ai/deepagents/refs/heads/main/libs/cli/examples/skills/langgraph-docs/SKILL.md"  
    with urlopen(skill\_url) as response:  
        skill\_content \= response.read().decode('utf-8')

    skills\_files \= {  
        "/skills/langgraph-docs/SKILL.md": create\_file\_data(skill\_content)  
    }

    agent \= create\_deep\_agent(  
        skills=\["/skills/"\],  
        checkpointer=checkpointer,  
    )

    result \= agent.invoke(  
        {  
            "messages": \[  
                {  
                    "role": "user",  
                    "content": "What is langgraph?",  
                }  
            \],  
            \# Seed the default StateBackend's in-state filesystem (virtual paths must start with "/").  
            "files": skills\_files  
        },  
        config={"configurable": {"thread\_id": "12345"}},  
    )  
    \`\`\`  
  \</Tab\>

  \<Tab title="StoreBackend"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from urllib.request import urlopen  
    from deepagents import create\_deep\_agent  
    from deepagents.backends import StoreBackend  
    from deepagents.backends.utils import create\_file\_data  
    from langgraph.store.memory import InMemoryStore

    store \= InMemoryStore()

    skill\_url \= "https://raw.githubusercontent.com/langchain-ai/deepagents/refs/heads/main/libs/cli/examples/skills/langgraph-docs/SKILL.md"  
    with urlopen(skill\_url) as response:  
        skill\_content \= response.read().decode('utf-8')

    store.put(  
        namespace=("filesystem",),  
        key="/skills/langgraph-docs/SKILL.md",  
        value=create\_file\_data(skill\_content)  
    )

    agent \= create\_deep\_agent(  
        backend=StoreBackend(),  
        store=store,  
        skills=\["/skills/"\]  
    )

    result \= agent.invoke(  
        {  
            "messages": \[  
                {  
                    "role": "user",  
                    "content": "What is langgraph?",  
                }  
            \]  
        },  
        config={"configurable": {"thread\_id": "12345"}},  
    )  
    \`\`\`  
  \</Tab\>

  \<Tab title="FilesystemBackend"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from deepagents import create\_deep\_agent  
    from langgraph.checkpoint.memory import MemorySaver  
    from deepagents.backends.filesystem import FilesystemBackend

    \# Checkpointer is REQUIRED for human-in-the-loop  
    checkpointer \= MemorySaver()

    agent \= create\_deep\_agent(  
        backend=FilesystemBackend(root\_dir="/Users/user/{project}"),  
        skills=\["/Users/user/{project}/skills/"\],  
        interrupt\_on={  
            "write\_file": True,  \# Default: approve, edit, reject  
            "read\_file": False,  \# No interrupts needed  
            "edit\_file": True    \# Default: approve, edit, reject  
        },  
        checkpointer=checkpointer,  \# Required\!  
    )

    result \= agent.invoke(  
        {  
            "messages": \[  
                {  
                    "role": "user",  
                    "content": "What is langgraph?",  
                }  
            \]  
        },  
        config={"configurable": {"thread\_id": "12345"}},  
    )  
    \`\`\`  
  \</Tab\>  
\</Tabs\>

\<ParamField body="skills" type="list\[str\]" optional\>  
  List of skill source paths.

  Paths must be specified using forward slashes and are relative to the backend's root.

  \* If omitted, no skills are loaded.  
  \* When using \`StateBackend\` (default), provide skill files with \`invoke(files={...})\`. Use \`create\_file\_data()\` from \`deepagents.backends.utils\` to format file contents; raw strings are not supported.  
  \* With \`FilesystemBackend\`, skills are loaded from disk relative to the backend's \`root\_dir\`.

  Later sources override earlier ones for skills with the same name (last one wins).  
\</ParamField\>

\<Note\>  
  The SDK only loads the sources you pass in \`skills\`. It does not automatically scan CLI directories such as \`\~/.deepagents/...\` or \`\~/.agents/...\`.

  For CLI storage conventions, see \[App data\](/oss/python/deepagents/data-locations).

  \<Accordion title="Emulating CLI source order in SDK"\>  
    If you want CLI-style layering in SDK code, pass all desired sources explicitly in lowest-to-highest precedence order:

    \`\`\`text  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    \[  
    "\<user-home\>/.deepagents/{agent}/skills/",  
    "\<user-home\>/.agents/skills/",  
    "\<project-root\>/.deepagents/skills/",  
    "\<project-root\>/.agents/skills/",  
    \]  
    \`\`\`

    Then pass that ordered list as \`skills\` when creating your agent.  
  \</Accordion\>  
\</Note\>

\#\# Source precedence

When multiple skill sources contain a skill with the same name, the skill from the source listed later in the \`skills\` array takes precedence (last one wins). This lets you layer skills from different origins.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
\# If both sources contain a skill named "web-search",  
\# the one from "/skills/project/" wins (loaded last).  
agent \= create\_deep\_agent(  
    skills=\["/skills/user/", "/skills/project/"\],  
    ...  
)  
\`\`\`

\#\# Skills for subagents

When you use \[subagents\](/oss/python/deepagents/subagents), you can configure which skills each type has access to:

\* \*\*General-purpose subagent\*\*: Automatically inherits skills from the main agent when you pass \`skills\` to \`create\_deep\_agent\`. No additional configuration is needed.  
\* \*\*Custom subagents\*\*: Do not inherit the main agent's skills. Add a \`skills\` parameter to each subagent definition with that subagent's skill source paths.

Skill state is fully isolated: the main agent's skills are not visible to subagents, and subagent skills are not visible to the main agent.

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from deepagents import create\_deep\_agent

research\_subagent \= {  
    "name": "researcher",  
    "description": "Research assistant with specialized skills",  
    "system\_prompt": "You are a researcher.",  
    "tools": \[web\_search\],  
    "skills": \["/skills/research/", "/skills/web-search/"\],  \# Subagent-specific skills  
}

agent \= create\_deep\_agent(  
    model="claude-sonnet-4-6",  
    skills=\["/skills/main/"\],  \# Main agent and GP subagent get these  
    subagents=\[research\_subagent\],  \# Researcher gets only its own skills  
)  
\`\`\`

For more information on subagent configuration and skills inheritance, see \[Subagents\](/oss/python/deepagents/subagents).

\#\# What the agent sees

When skills are configured, a "Skills System" section is injected into the agent's system prompt. The agent uses this information to follow a three-step process:

1\. \*\*Match\*\*—When a user prompt arrives, the agent checks whether any skill's description matches the task.  
2\. \*\*Read\*\*—If a skill applies, the agent reads the full \`SKILL.md\` file using the path shown in its skills list.  
3\. \*\*Execute\*\*—The agent follows the skill's instructions and accesses any supporting files (scripts, templates, reference docs) as needed.

\<Tip\>  
  Write clear, specific descriptions in your \`SKILL.md\` frontmatter. The agent decides whether to use a skill based on the description alone—detailed descriptions lead to better skill matching.  
\</Tip\>

\#\# Skills vs. memory

Skills and \[memory\](/oss/python/deepagents/customization\#memory) (\`AGENTS.md\` files) serve different purposes:

|              | Skills                                                           | Memory                                                        |  
| \------------ | \---------------------------------------------------------------- | \------------------------------------------------------------- |  
| \*\*Purpose\*\*  | On-demand capabilities discovered through progressive disclosure | Persistent context always loaded at startup                   |  
| \*\*Loading\*\*  | Read only when the agent determines relevance                    | Always injected into system prompt                            |  
| \*\*Format\*\*   | \`SKILL.md\` in named directories                                  | \`AGENTS.md\` files                                             |  
| \*\*Layering\*\* | User → project (last wins)                                       | User → project (combined)                                     |  
| \*\*Use when\*\* | Instructions are task-specific and potentially large             | Context is always relevant (project conventions, preferences) |

\#\# When to use skills and tools

These are a few general guidelines for using tools and skills:

\* Use skills when there is a lot of context to reduce the number of tokens in the system prompt.  
\* Use skills to bundle capabilities together into larger actions and provide additional context beyond single tool descriptions.  
\* Use tools if the agent does not have access to the file system.

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/skills.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.langchain.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Sandboxes

\> Execute code in isolated environments with sandbox backends

Agents generate code, interact with filesystems, and run shell commands. Because we can't predict what an agent might do, it's important that its environment is isolated so it can't access credentials, files, or the network. Sandboxes provide this isolation by creating a boundary between the agent's execution environment and your host system.

In Deep Agents, \*\*sandboxes are \[backends\](/oss/python/deepagents/backends)\*\* that define the environment where the agent operates. Unlike other backends (State, Filesystem, Store) which only expose file operations, sandbox backends also give the agent an \`execute\` tool for running shell commands. When you configure a sandbox backend, the agent gets:

\* All standard filesystem tools (\`ls\`, \`read\_file\`, \`write\_file\`, \`edit\_file\`, \`glob\`, \`grep\`)  
\* The \`execute\` tool for running arbitrary shell commands in the sandbox  
\* A secure boundary that protects your host system

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph LR  
    subgraph Agent  
        LLM \--\> Tools  
        Tools \--\> LLM  
    end

    Agent \<-- backend protocol \--\> Sandbox

    subgraph Sandbox  
        Filesystem  
        Bash  
        Dependencies  
    end

    classDef process fill:\#DBEAFE,stroke:\#2563EB,stroke-width:2px,color:\#1E3A8A  
    classDef output fill:\#F3E8FF,stroke:\#9333EA,stroke-width:2px,color:\#581C87

    class LLM,Tools process  
    class Filesystem,Bash,Dependencies output  
\`\`\`

\#\# Why use sandboxes?

Sandboxes are used for security.  
They let agents execute arbitrary code, access files, and use the network without compromising your credentials, local files, or host system.  
This isolation is essential when agents run autonomously.

Sandboxes are especially useful for:

\* Coding agents: Agents that run autonomously can use shell, git, clone repositories (many providers offer native git APIs, e.g., \[Daytona's git operations\](https://www.daytona.io/docs/en/git-operations/)), and run Docker-in-Docker for build and test pipelines  
\* Data analysis agents—Load files, install data analysis libraries (pandas, numpy, etc.), run statistical calculations, and create outputs like PowerPoint presentations in a safe, isolated environment

\<Tip\>  
  \*\*Using the Deep Agents CLI?\*\* The CLI has built-in sandbox support via the \`--sandbox\` flag. See \[Use remote sandboxes\](/oss/python/deepagents/cli/overview\#use-remote-sandboxes) for CLI-specific setup, flags (\`--sandbox-id\`, \`--sandbox-setup\`), and examples.  
\</Tip\>

\#\# Available providers

For provider-specific setup, authentication, and lifecycle details, see the provider integration pages:

\<CardGroup cols={2}\>  
  \<Card title="AgentCore" icon="https://mintcdn.com/langchain-5e9cc07a/CgeS38l6oQSuVQxz/images/providers/agentcore-icon.svg?fit=max\&auto=format\&n=CgeS38l6oQSuVQxz\&q=85\&s=3167301d786abe445a499df4d9dd05ee" href="/oss/python/integrations/providers/aws\#sandboxes" width="80" height="80" data-path="images/providers/agentcore-icon.svg"\>  
    AWS MicroVM isolation, Code Interpreter, Python.  
  \</Card\>

  \<Card title="Modal" icon="https://mintcdn.com/langchain-5e9cc07a/z7oQGiHwXv52HwOy/images/providers/modal-icon.svg?fit=max\&auto=format\&n=z7oQGiHwXv52HwOy\&q=85\&s=ad5e0a8abe949e2f5a6588b1de54d7ee" href="/oss/python/integrations/providers/modal" width="24" height="24" data-path="images/providers/modal-icon.svg"\>  
    ML/AI workloads, GPU access.  
  \</Card\>

  \<Card title="Daytona" icon="https://mintcdn.com/langchain-5e9cc07a/ZPKed1feKJ8F6LVo/images/providers/daytona-icon.svg?fit=max\&auto=format\&n=ZPKed1feKJ8F6LVo\&q=85\&s=f5207cf24ebd421cff00a66a611b3992" href="/oss/python/integrations/providers/daytona" width="66" height="60" data-path="images/providers/daytona-icon.svg"\>  
    TypeScript/Python development, fast cold starts.  
  \</Card\>

  \<Card title="Runloop" href="/oss/python/integrations/providers/runloop"\>  
    Disposable devboxes for isolated code execution.  
  \</Card\>  
\</CardGroup\>

If you provide a sandbox platform and want to contribute an integration, see \[Contributing a sandbox integration\](/oss/python/contributing/integrations-langchain).

\#\# Basic usage

These examples assume you have already created a sandbox/devbox using the provider's SDK and have credentials set up. For signup, authentication, and provider-specific lifecycle details, see \[Available providers\](\#available-providers).

\<Tabs\>  
  \<Tab title="Modal"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-modal  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-modal  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    import modal  
    from deepagents import create\_deep\_agent  
    from langchain\_anthropic import ChatAnthropic  
    from langchain\_modal import ModalSandbox

    app \= modal.App.lookup("your-app")  
    modal\_sandbox \= modal.Sandbox.create(app=app)  
    backend \= ModalSandbox(sandbox=modal\_sandbox)

    agent \= create\_deep\_agent(  
        model=ChatAnthropic(model="claude-sonnet-4-20250514"),  
        system\_prompt="You are a Python coding assistant with sandbox access.",  
        backend=backend,  
    )  
    try:  
        result \= agent.invoke(  
            {  
                "messages": \[  
                    {  
                        "role": "user",  
                        "content": "Create a small Python package and run pytest",  
                    }  
                \]  
            }  
        )  
    finally:  
        modal\_sandbox.terminate()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Runloop"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-runloop  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-runloop  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    import os

    from deepagents import create\_deep\_agent  
    from langchain\_anthropic import ChatAnthropic  
    from langchain\_runloop import RunloopSandbox  
    from runloop\_api\_client import RunloopSDK

    client \= RunloopSDK(bearer\_token=os.environ\["RUNLOOP\_API\_KEY"\])

    devbox \= client.devbox.create()  
    backend \= RunloopSandbox(devbox=devbox)

    agent \= create\_deep\_agent(  
        model=ChatAnthropic(model="claude-sonnet-4-20250514"),  
        system\_prompt="You are a Python coding assistant with sandbox access.",  
        backend=backend,  
    )

    try:  
        result \= agent.invoke(  
            {  
                "messages": \[  
                    {  
                        "role": "user",  
                        "content": "Create a small Python package and run pytest",  
                    }  
                \]  
            }  
        )  
    finally:  
        devbox.shutdown()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Daytona"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-daytona  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-daytona  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from daytona import Daytona  
    from deepagents import create\_deep\_agent  
    from langchain\_anthropic import ChatAnthropic  
    from langchain\_daytona import DaytonaSandbox

    sandbox \= Daytona().create()  
    backend \= DaytonaSandbox(sandbox=sandbox)

    agent \= create\_deep\_agent(  
        model=ChatAnthropic(model="claude-sonnet-4-20250514"),  
        system\_prompt="You are a Python coding assistant with sandbox access.",  
        backend=backend,  
    )

    try:  
        result \= agent.invoke(  
            {  
                "messages": \[  
                    {  
                        "role": "user",  
                        "content": "Create a small Python package and run pytest",  
                    }  
                \]  
            }  
        )  
    finally:  
        sandbox.stop()  
    \`\`\`  
  \</Tab\>  
\</Tabs\>

\#\# Lifecycle and scoping

Sandboxes consume resources and cost money until they're shut down. How you manage their lifecycle depends on your application.

Choose how sandbox lifecycles map to your application's resources. See \[going to production\](/oss/python/deepagents/going-to-production\#sandboxes) for more on this decision.

\#\#\# Thread-scoped (default)

Each conversation gets its own sandbox. The sandbox is created when the first run starts and reused for follow-up messages on the same thread. When the thread is cleaned up (or the sandbox TTL expires), the sandbox is destroyed. This is the right default for most agents.

Example: a data analysis bot where each conversation starts with a clean environment.

\#\#\# Assistant-scoped

All threads for a given \[assistant\](/langsmith/assistants) share one sandbox. The sandbox ID is stored on the assistant's configuration, so every conversation returns to the same environment. Files, installed packages, and cloned repositories persist across conversations. Use this when the agent maintains a long-running workspace.

Example: a coding assistant that maintains a cloned repo and installed dependencies across conversations.

\<Warning\>  
  Assistant-scoped sandboxes accumulate files, installed packages, and other in-sandbox state over time. Configure a TTL with your sandbox provider, use snapshots to reset periodically, or implement cleanup logic to prevent the sandbox's disk and memory from growing unbounded. Thread-scoped sandboxes avoid this by starting fresh each conversation.  
\</Warning\>

\#\#\# Basic lifecycle

\<Tabs\>  
  \<Tab title="AgentCore"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from bedrock\_agentcore.tools.code\_interpreter\_client import CodeInterpreter

    from langchain\_agentcore\_codeinterpreter import AgentCoreSandbox

    interpreter \= CodeInterpreter(region="us-west-2")  
    interpreter.start()

    backend \= AgentCoreSandbox(interpreter=interpreter)

    result \= backend.execute("echo hello")  
    \# ... use sandbox  
    interpreter.stop()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Modal"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    import modal

    from langchain\_modal import ModalSandbox

    app \= modal.App.lookup("your-app")  
    modal\_sandbox \= modal.Sandbox.create(app=app)  
    backend \= ModalSandbox(sandbox=modal\_sandbox)

    result \= backend.execute("echo hello")  
    \# ... use sandbox  
    modal\_sandbox.terminate()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Runloop"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from runloop\_api\_client import RunloopSDK

    from langchain\_runloop import RunloopSandbox

    client \= RunloopSDK(bearer\_token="...")  
    devbox \= client.devbox.create()  
    backend \= RunloopSandbox(devbox=devbox)

    result \= backend.execute("echo hello")  
    \# ... use sandbox  
    devbox.shutdown()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Daytona"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from daytona import Daytona

    from langchain\_daytona import DaytonaSandbox

    sandbox \= Daytona().create()  
    backend \= DaytonaSandbox(sandbox=sandbox)

    result \= backend.execute("echo hello")  
    \# ... use sandbox  
    sandbox.stop()  
    \`\`\`  
  \</Tab\>  
\</Tabs\>

\#\#\# Per-conversation lifecycle

In chat applications, a conversation is typically represented by a \`thread\_id\`.  
Generally, each \`thread\_id\` should use its own unique sandbox.

Store the mapping between sandbox ID and \`thread\_id\` in your application or with the sandbox if the sandbox provider allows attaching metadata to the sandbox.

\<Tip\>  
  \*\*TTL for chat applications.\*\* When users can re-engage after idle time, you often don't know if or when they'll return. Configure a time-to-live (TTL) on the sandbox—for example, TTL to archive or TTL to delete—so the provider automatically cleans up idle sandboxes. Many sandbox providers support this.  
\</Tip\>

The following example shows a get-or-create pattern using Daytona.  
For other providers, consult the sandbox provider API for the equivalent labels, metadata, and TTL options:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from langchain\_core.utils.uuid import uuid7

from daytona import CreateSandboxFromSnapshotParams, Daytona  
from deepagents import create\_deep\_agent  
from langchain\_daytona import DaytonaSandbox

client \= Daytona()  
thread\_id \= str(uuid7())

\# Get or create sandbox by thread\_id  
try:  
    sandbox \= client.find\_one(labels={"thread\_id": thread\_id})  
except Exception:  
    params \= CreateSandboxFromSnapshotParams(  
        labels={"thread\_id": thread\_id},  
        \# Add TTL so the sandbox is cleaned up when idle  
        auto\_delete\_interval=3600,  
    )  
    sandbox \= client.create(params)

backend \= DaytonaSandbox(sandbox=sandbox)  
agent \= create\_deep\_agent(  
    backend=backend,  
    system\_prompt="You are a coding assistant with sandbox access. You can create and run code in the sandbox.",  
)

try:  
    result \= agent.invoke(  
        {  
            "messages": \[  
                {  
                    "role": "user",  
                    "content": "Create a hello world Python script and run it",  
                }  
            \]  
        },  
        config={  
            "configurable": {  
                "thread\_id": thread\_id,  
            }  
        },  
    )  
    print(result\["messages"\]\[-1\].content)  
except Exception:  
    \# Optional: delete the sandbox proactively on an exception  
    client.delete(sandbox)  
    raise  
\`\`\`

\#\# Integration patterns

There are two architecture patterns for integrating agents with sandboxes, based on where the agent runs.

\#\#\# Agent in sandbox pattern

The agent runs inside the sandbox and you communicate with it over the network. You build a Docker or VM image with your agent framework pre-installed, run it inside the sandbox, and connect from outside to send messages.

Benefits:

\* ✅ Mirrors local development closely.  
\* ✅ Tight coupling between agent and environment.

Trade-offs:

\* 🔴 API keys must live inside the sandbox (security risk).  
\* 🔴 Updates require rebuilding images.  
\* 🔴 Requires infrastructure for communication (WebSocket or HTTP layer).

To run an agent in a sandbox, build an image and install deepagents on it.

\`\`\`dockerfile  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
FROM python:3.11  
RUN pip install deepagents-cli  
\`\`\`

Then run the agent inside the sandbox.  
To use the agent inside the sandbox you have to add additional infrastructure to handle communication between your application and the agent inside the sandbox.

\#\#\# Sandbox as tool pattern

The agent runs on your machine or server. When it needs to execute code, it calls sandbox tools (such as \`execute\`, \`read\_file\`, or \`write\_file\`) which invoke the provider's APIs to run operations in a remote sandbox.

Benefits:

\* ✅ Update agent code instantly without rebuilding images.  
\* ✅ Cleaner separation between agent state and execution.  
  \* API keys stay outside the sandbox.  
  \* Sandbox failures don't lose agent state.  
  \* Option to run tasks in multiple sandboxes in parallel.  
\* ✅ Pay only for execution time.

Trade-offs:

\* 🔴 Network latency on each execution call.

Example:

\`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
from daytona import Daytona  
from deepagents import create\_deep\_agent  
from dotenv import load\_dotenv  
from langchain\_daytona import DaytonaSandbox

load\_dotenv()

\# Can also do this with AgentCore, E2B, Runloop, Modal  
sandbox \= Daytona().create()  
backend \= DaytonaSandbox(sandbox=sandbox)

agent \= create\_deep\_agent(  
    backend=backend,  
    system\_prompt="You are a coding assistant with sandbox access. You can create and run code in the sandbox.",  
)

try:  
    result \= agent.invoke(  
        {  
            "messages": \[  
                {  
                    "role": "user",  
                    "content": "Create a hello world Python script and run it",  
                }  
            \]  
        }  
    )  
    print(result\["messages"\]\[-1\].content)  
except Exception:  
    \# Optional: delete the sandbox proactively on an exception  
    sandbox.stop()  
    raise  
\`\`\`

The examples in this doc use the sandbox as a tool pattern.  
Choose the agent in sandbox pattern when your provider's SDK handles the communication layer and you want production to mirror local development.  
Choose the sandbox as tool pattern when you need to iterate quickly on agent logic, keep API keys outside the sandbox, or prefer cleaner separation of concerns.

\#\# Available providers

For provider-specific setup, authentication, and lifecycle details, see the provider integration pages:

\<CardGroup cols={2}\>  
  \<Card title="AgentCore" icon="https://mintcdn.com/langchain-5e9cc07a/CgeS38l6oQSuVQxz/images/providers/agentcore-icon.svg?fit=max\&auto=format\&n=CgeS38l6oQSuVQxz\&q=85\&s=3167301d786abe445a499df4d9dd05ee" href="/oss/python/integrations/sandboxes/aws" width="80" height="80" data-path="images/providers/agentcore-icon.svg"\>  
    AWS MicroVM isolation, Code Interpreter, Python.  
  \</Card\>

  \<Card title="Modal" icon="https://mintcdn.com/langchain-5e9cc07a/z7oQGiHwXv52HwOy/images/providers/modal-icon.svg?fit=max\&auto=format\&n=z7oQGiHwXv52HwOy\&q=85\&s=ad5e0a8abe949e2f5a6588b1de54d7ee" href="/oss/python/integrations/sandboxes/modal" width="24" height="24" data-path="images/providers/modal-icon.svg"\>  
    ML/AI workloads, GPU access.  
  \</Card\>

  \<Card title="Daytona" icon="https://mintcdn.com/langchain-5e9cc07a/ZPKed1feKJ8F6LVo/images/providers/daytona-icon.svg?fit=max\&auto=format\&n=ZPKed1feKJ8F6LVo\&q=85\&s=f5207cf24ebd421cff00a66a611b3992" href="/oss/python/integrations/sandboxes/daytona" width="66" height="60" data-path="images/providers/daytona-icon.svg"\>  
    TypeScript/Python development, fast cold starts.  
  \</Card\>

  \<Card title="Runloop" href="/oss/python/integrations/sandboxes/runloop"\>  
    Disposable devboxes for isolated code execution.  
  \</Card\>  
\</CardGroup\>

If you provide a sandbox platform and want to contribute an integration, see \[Contributing a sandbox integration\](/oss/python/contributing/integrations-langchain).

\#\# How sandboxes work

\#\#\# Isolation boundaries

All sandbox providers protect your host system from the agent's filesystem and shell operations. The agent cannot read your local files, access environment variables on your machine, or interfere with other processes. However, sandboxes alone do \*\*not\*\* protect against:

\* \*\*Context injection\*\*: An attacker who controls part of the agent's input can instruct it to run arbitrary commands inside the sandbox. The sandbox is isolated, but the agent has full control within it.  
\* \*\*Network exfiltration\*\*: Unless network access is blocked, a context-injected agent can send data out of the sandbox over HTTP or DNS. Some providers support blocking network access (e.g., \`blockNetwork: true\` on Modal).

See \[security considerations\](\#security-considerations) for how to handle secrets and mitigate these risks.

\#\#\# The \`execute\` method

Sandbox backends have a simple architecture: the only method a provider must implement is \`execute()\`, which runs a shell command and returns its output. Every other filesystem operation (\`read\`, \`write\`, \`edit\`, \`ls\`, \`glob\`, \`grep\`) is built on top of \`execute()\` by the \[\`BaseSandbox\`\](https://reference.langchain.com/python/deepagents/backends/sandbox/BaseSandbox) base class, which constructs scripts and runs them inside the sandbox via \`execute()\`.

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph TB  
    subgraph "Agent tools"  
        Tools\["ls, read\_file, ..."\]  
        execute  
    end

    BaseSandbox\["BaseSandbox\<br/\>(uses execute)"\] \--\> Tools  
    execute\_method\["execute()"\] \--\> BaseSandbox  
    execute\_method \--\> execute  
    Provider\["Provider SDK"\] \--\> execute\_method

    classDef process fill:\#DBEAFE,stroke:\#2563EB,stroke-width:2px,color:\#1E3A8A  
    classDef trigger fill:\#DCFCE7,stroke:\#16A34A,stroke-width:2px,color:\#14532D

    class Tools,execute process  
    class BaseSandbox,execute\_method process  
    class Provider trigger  
\`\`\`

This design means:

\* \*\*Adding a new provider is straightforward.\*\* Implement \`execute()\`—the base class handles everything else.  
\* \*\*The \`execute\` tool is conditionally available.\*\* On every model call, the harness checks whether the backend implements \[\`SandboxBackendProtocol\`\](https://reference.langchain.com/python/deepagents/backends/protocol/SandboxBackendProtocol). If not, the tool is filtered out and the agent never sees it.

When the agent calls the \`execute\` tool, it provides a \`command\` string and gets back the combined stdout/stderr, exit code, and a truncation notice if the output was too large.

You can also call the backend \`execute()\` method directly in your application code.

\<Tabs\>  
  \<Tab title="AgentCore"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-agentcore-codeinterpreter  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-agentcore-codeinterpreter  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from bedrock\_agentcore.tools.code\_interpreter\_client import CodeInterpreter

    from langchain\_agentcore\_codeinterpreter import AgentCoreSandbox

    interpreter \= CodeInterpreter(region="us-west-2")  
    interpreter.start()

    backend \= AgentCoreSandbox(interpreter=interpreter)

    try:  
        result \= backend.execute("python3 \--version")  
        print(result.output)  
    finally:  
        interpreter.stop()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Modal"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    import modal

    from langchain\_modal import ModalSandbox

    app \= modal.App.lookup("your-app")  
    modal\_sandbox \= modal.Sandbox.create(app=app)  
    backend \= ModalSandbox(sandbox=modal\_sandbox)

    result \= backend.execute("python \--version")  
    print(result.output)  
    \`\`\`  
  \</Tab\>

  \<Tab title="Runloop"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-runloop  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-runloop  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from runloop\_api\_client import RunloopSDK

    from langchain\_runloop import RunloopSandbox

    api\_key \= "..."  
    client \= RunloopSDK(bearer\_token=api\_key)

    devbox \= client.devbox.create()  
    backend \= RunloopSandbox(devbox=devbox)

    try:  
        result \= backend.execute("python \--version")  
        print(result.output)  
    finally:  
        devbox.shutdown()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Daytona"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-daytona  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-daytona  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from daytona import Daytona

    from langchain\_daytona import DaytonaSandbox

    sandbox \= Daytona().create()  
    backend \= DaytonaSandbox(sandbox=sandbox)

    result \= backend.execute("python \--version")  
    print(result.output)  
    \`\`\`  
  \</Tab\>  
\</Tabs\>

For example:

\`\`\`  
4  
\[Command succeeded with exit code 0\]  
\`\`\`

\`\`\`  
bash: foobar: command not found  
\[Command failed with exit code 127\]  
\`\`\`

If a command produces very large output, the result is automatically saved to a file and the agent is instructed to use \`read\_file\` to access it incrementally. This prevents context window overflow.

\#\#\# Two planes of file access

There are two distinct ways files move in and out of a sandbox, and it's important to understand when to use each:

\*\*Agent filesystem tools\*\*: \`read\_file\`, \`write\_file\`, \`edit\_file\`, \`ls\`, \`glob\`, \`grep\`, and \`execute\` are the tools the LLM calls during its execution. These go through \`execute()\` inside the sandbox. The agent uses them to read code, write files, and run commands as part of its task.

\*\*File transfer APIs\*\*: the \`uploadFiles()\` and \`downloadFiles()\` methods that your application code calls. These use the provider's native file transfer APIs (not shell commands) and are designed for moving files between your host environment and the sandbox. Use these to:

\* \*\*Seed the sandbox\*\* with source code, configuration, or data before the agent runs  
\* \*\*Retrieve artifacts\*\* (generated code, build outputs, reports) after the agent finishes  
\* \*\*Pre-populate dependencies\*\* that the agent will need

\`\`\`mermaid  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
graph LR  
    subgraph "Your application"  
        App\[Application code\]  
    end

    subgraph "Agent"  
        LLM \--\> Tools\["read\_file, write\_file, ..."\]  
        Tools \--\> LLM  
    end

    subgraph "Sandbox"  
        FS\[Filesystem\]  
    end

    App \-- "Provider API" \--\> FS  
    Tools \-- "execute()" \--\> FS

    classDef trigger fill:\#DCFCE7,stroke:\#16A34A,stroke-width:2px,color:\#14532D  
    classDef process fill:\#DBEAFE,stroke:\#2563EB,stroke-width:2px,color:\#1E3A8A  
    classDef output fill:\#F3E8FF,stroke:\#9333EA,stroke-width:2px,color:\#581C87

    class App trigger  
    class LLM,Tools process  
    class FS output  
\`\`\`

\#\# Working with files

The deepagents sandbox backends support file transfer APIs for moving files between your application and the sandbox.

\#\#\# Seeding the sandbox

Use \`upload\_files()\` to populate the sandbox before the agent runs. Paths must be absolute and contents are \`bytes\`:

\<Tabs\>  
  \<Tab title="AgentCore"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-agentcore-codeinterpreter  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-agentcore-codeinterpreter  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from bedrock\_agentcore.tools.code\_interpreter\_client import CodeInterpreter

    from langchain\_agentcore\_codeinterpreter import AgentCoreSandbox

    interpreter \= CodeInterpreter(region="us-west-2")  
    interpreter.start()

    backend \= AgentCoreSandbox(interpreter=interpreter)

    backend.upload\_files(  
        \[  
            ("hello.py", b"print('Hello')\\n"),  
            ("data.csv", b"name,value\\na,1\\nb,2\\n"),  
        \]  
    )  
    \`\`\`  
  \</Tab\>

  \<Tab title="Modal"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    import modal

    from langchain\_modal import ModalSandbox

    app \= modal.App.lookup("your-app")  
    modal\_sandbox \= modal.Sandbox.create(app=app)  
    backend \= ModalSandbox(sandbox=modal\_sandbox)

    backend.upload\_files(  
        \[  
            ("/src/index.py", b"print('Hello')\\n"),  
            ("/pyproject.toml", b"\[project\]\\nname \= 'my-app'\\n"),  
        \]  
    )  
    \`\`\`  
  \</Tab\>

  \<Tab title="Runloop"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-runloop  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-runloop  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from runloop\_api\_client import RunloopSDK

    from langchain\_runloop import RunloopSandbox

    api\_key \= "..."  
    client \= RunloopSDK(bearer\_token=api\_key)

    devbox \= client.devbox.create()  
    backend \= RunloopSandbox(devbox=devbox)

    backend.upload\_files(  
        \[  
            ("/src/index.py", b"print('Hello')\\n"),  
            ("/pyproject.toml", b"\[project\]\\nname \= 'my-app'\\n"),  
        \]  
    )  
    \`\`\`  
  \</Tab\>

  \<Tab title="Daytona"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-daytona  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-daytona  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from daytona import Daytona

    from langchain\_daytona import DaytonaSandbox

    sandbox \= Daytona().create()  
    backend \= DaytonaSandbox(sandbox=sandbox)

    backend.upload\_files(  
        \[  
            ("/src/index.py", b"print('Hello')\\n"),  
            ("/pyproject.toml", b"\[project\]\\nname \= 'my-app'\\n"),  
        \]  
    )  
    \`\`\`  
  \</Tab\>  
\</Tabs\>

\#\#\# Retrieving artifacts

Use \`download\_files()\` to retrieve files from the sandbox after the agent finishes:

\<Tabs\>  
  \<Tab title="AgentCore"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-agentcore-codeinterpreter  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-agentcore-codeinterpreter  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from bedrock\_agentcore.tools.code\_interpreter\_client import CodeInterpreter

    from langchain\_agentcore\_codeinterpreter import AgentCoreSandbox

    interpreter \= CodeInterpreter(region="us-west-2")  
    interpreter.start()

    backend \= AgentCoreSandbox(interpreter=interpreter)

    results \= backend.download\_files(\["hello.py"\])  
    for result in results:  
        if result.content is not None:  
            print(f"{result.path}: {result.content.decode()}")  
        else:  
            print(f"Failed to download {result.path}: {result.error}")

    interpreter.stop()  
    \`\`\`  
  \</Tab\>

  \<Tab title="Modal"\>  
    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    import modal

    from langchain\_modal import ModalSandbox

    app \= modal.App.lookup("your-app")  
    modal\_sandbox \= modal.Sandbox.create(app=app)  
    backend \= ModalSandbox(sandbox=modal\_sandbox)

    results \= backend.download\_files(\["/src/index.py", "/output.txt"\])  
    for result in results:  
        if result.content is not None:  
            print(f"{result.path}: {result.content.decode()}")  
        else:  
            print(f"Failed to download {result.path}: {result.error}")  
    \`\`\`  
  \</Tab\>

  \<Tab title="Runloop"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-runloop  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-runloop  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from runloop\_api\_client import RunloopSDK

    from langchain\_runloop import RunloopSandbox

    api\_key \= "..."  
    client \= RunloopSDK(bearer\_token=api\_key)

    devbox \= client.devbox.create()  
    backend \= RunloopSandbox(devbox=devbox)

    results \= backend.download\_files(\["/src/index.py", "/output.txt"\])  
    for result in results:  
        if result.content is not None:  
            print(f"{result.path}: {result.content.decode()}")  
        else:  
            print(f"Failed to download {result.path}: {result.error}")  
    \`\`\`  
  \</Tab\>

  \<Tab title="Daytona"\>  
    \<CodeGroup\>  
      \`\`\`bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      pip install langchain-daytona  
      \`\`\`

      \`\`\`bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
      uv add langchain-daytona  
      \`\`\`  
    \</CodeGroup\>

    \`\`\`python  theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}  
    from daytona import Daytona

    from langchain\_daytona import DaytonaSandbox

    sandbox \= Daytona().create()  
    backend \= DaytonaSandbox(sandbox=sandbox)

    results \= backend.download\_files(\["/src/index.py", "/output.txt"\])  
    for result in results:  
        if result.content is not None:  
            print(f"{result.path}: {result.content.decode()}")  
        else:  
            print(f"Failed to download {result.path}: {result.error}")  
    \`\`\`  
  \</Tab\>  
\</Tabs\>

\<Note\>  
  Inside the sandbox, the agent uses filesystem tools (\`read\_file\`, \`write\_file\`). The \`upload\_files\` and \`download\_files\` methods are for your application code to move files across the boundary between your host and the sandbox.  
\</Note\>

\#\# Security considerations

Sandboxes isolate code execution from your host system, but they don't protect against \*\*context injection\*\*. An attacker who controls part of the agent's input can instruct it to read files, run commands, or exfiltrate data from within the sandbox. This makes credentials inside the sandbox especially dangerous.

\<Warning\>  
  \*\*Never put secrets inside a sandbox.\*\* API keys, tokens, database credentials, and other secrets injected into a sandbox (via environment variables, mounted files, or the \`secrets\` option) can be read and exfiltrated by a context-injected agent. This applies even to short-lived or scoped credentials—if an agent can access them, so can an attacker.  
\</Warning\>

\#\#\# Handling secrets safely

If your agent needs to call authenticated APIs or access protected resources, you have two options:

1\. \*\*Keep secrets in tools outside the sandbox.\*\* Define tools that run in your host environment (not inside the sandbox) and handle authentication there. The agent calls these tools by name, but never sees the credentials. This is the recommended approach.

2\. \*\*Use a network proxy that injects credentials.\*\* Some sandbox providers support proxies that intercept outgoing HTTP requests from the sandbox and attach credentials (e.g., \`Authorization\` headers) before forwarding them. The agent never sees the secret—it just makes plain requests to a URL. This approach is not yet widely available across providers.

\<Warning\>  
  If you must inject secrets into a sandbox (not recommended), take these precautions:

  \* Enable \[human-in-the-loop\](/oss/python/deepagents/human-in-the-loop) approval for \*\*all\*\* tool calls, not just sensitive ones  
  \* Block or restrict network access from the sandbox to limit exfiltration paths  
  \* Use the narrowest possible credential scope and shortest possible lifetime  
  \* Monitor sandbox network traffic for unexpected outbound requests

  Even with these safeguards, this remains an unsafe workaround. A sufficiently creative enough context injection attack can bypass output filtering and HITL review.  
\</Warning\>

\#\#\# General best practices

\* Review sandbox outputs before acting on them in your application  
\* Block sandbox network access when not needed  
\* Use \[middleware\](/oss/python/langchain/middleware) to filter or redact sensitive patterns in tool outputs  
\* Treat everything produced inside the sandbox as untrusted input

\*\*\*

\<div className="source-links"\>  
  \<Callout icon="edit"\>  
    \[Edit this page on GitHub\](https://github.com/langchain-ai/docs/edit/main/src/oss/deepagents/sandboxes.mdx) or \[file an issue\](https://github.com/langchain-ai/docs/issues/new/choose).  
  \</Callout\>

  \<Callout icon="terminal-2"\>  
    \[Connect these docs\](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.  
  \</Callout\>  
\</div\>

