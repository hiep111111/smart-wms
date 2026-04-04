# Phase 2: AI Layer, Skills, and Agents Architecture

## 1. AI Layer Configuration (Tech Stack & Integration)
Since the project uses Next.js and Prisma, the AI Layer should be lightweight and edge-compatible.
* **AI Framework:** Vercel AI SDK (Recommended for Next.js - provides seamless React hooks like `useChat` and backend streaming). LangChain can be used if complex chains are needed later.
* **LLM Provider:** OpenAI (gpt-4o / gpt-4o-mini) or Anthropic (Claude 3.5 Haiku/Sonnet) for function calling and reasoning.
* **Context Management:** * Short-term: Vercel AI SDK state management.
    * Long-term (RAG): If we need the AI to read Warehouse SOPs (Standard Operating Procedures), we will need a Vector Store (e.g., Pinecone or simple pgvector) later.

## 2. Defined AI Skills (Function Calling / Tools)
*These skills must map directly to the API Interfaces defined in Step 1. The AI will use these tools to interact with the WMS database.*

* **`search_inventory`**: 
    * *Input:* `query` (string - SKU, product name, or category).
    * *Output:* List of matching items, current quantity, and warehouse location.
* **`get_stock_status`**:
    * *Input:* `sku` (string).
    * *Output:* Detailed stock status, including incoming shipments and reserved quantities.
* **`create_transfer_order`** (Actionable Skill):
    * *Input:* `sku` (string), `from_zone` (string), `to_zone` (string), `quantity` (number).
    * *Output:* Transfer ticket ID and status.
* **`analyze_demand`**:
    * *Input:* `category` (string), `timeframe` (string - e.g., "next_7_days").
    * *Output:* Predictive analysis on what items might run out of stock soon.

## 3. Multi-Agent Architecture
Instead of a single monolithic AI, we divide responsibilities into specific agents to reduce hallucinations and token costs.

* **Agent 1: WMS Copilot (The Router & Assistant)**
    * *Role:* The main chat interface for warehouse staff. It understands natural language (e.g., "Where are the new iPhones stored?") and routes the request to the correct skill or sub-agent.
    * *Equipped Skills:* `search_inventory`, `get_stock_status`.
* **Agent 2: Inventory Optimizer (Background/Analytical Agent)**
    * *Role:* Analyzes inventory health. Can be triggered manually or via CRON jobs.
    * *Equipped Skills:* `analyze_demand`.
* **Agent 3: Operations Manager (Action Agent)**
    * *Role:* Has write-access to create tasks or move inventory. Requires human-in-the-loop confirmation before executing.
    * *Equipped Skills:* `create_transfer_order`.

## 4. Execution & Testing Plan (Incremental Steps)
To ensure everything is testable and bug-free:
* **Task 2.1:** Install `ai` (Vercel AI SDK) and `@ai-sdk/openai`.
* **Task 2.2:** Create a basic `/api/chat` route with a simple Echo/Text LLM (No tools yet). **[TEST: Verify Chat UI works]**
* **Task 2.3:** Implement just ONE read-only tool (`search_inventory`) using mock data (matching Step 1 interfaces). **[TEST: Ask AI to find a mock item]**
* **Task 2.4:** Connect `search_inventory` tool to Prisma DB. **[TEST: Ask AI to find a real item from SQLite dev.db]**
* **Task 2.5:** Add actionable tools and implement confirmation dialogs on the frontend.