# AI Genesis Backend

This is the backend service for AI Genesis, a learning research assistant powered by LangGraph and Google's Gemini model.

## Prerequisites

- Python 3.12 or higher
- Docker (optional, for containerized deployment)

## Setup

1. Clone the repository
2. Navigate to the backend directory
3. Setup using uv (a fast Python package installer and resolver):
   ```bash
   # Install uv if you don't have it yet
   # Follow instructions at https://docs.astral.sh/uv/getting-started/installation
   
   # Navigate to the backend directory and sync dependencies
   cd backend
   uv sync --all-packages
   ```
5. Copy the `.env.example` file to `.env` and fill in the required API keys (see API Keys section below)
6. Start the langgraph dev server - useful for debugging the agent:
   ```bash
   uv run langgraph dev
   ```
   alternatively you can run the app using docker:
   ```bash
   docker compose up -d backend
   ```

7. Start the FastAPI server:
   ```bash
   fastapi run app.server:app --reload
   ```
   alternatively you can run the app using docker:
   ```bash
   docker compose up -d backend
   ```

## API Keys

The backend requires several API keys to function properly. Here's how to obtain each one:

1. Gemini API Key: visit https://aistudio.google.com/apikey
2. Tavily API Key: visit https://app.tavily.com/home
3. LangSmith API Key: visit https://smith.langchain.com/

## Project Structure

- `app/`: Main application directory
  - `main.py`: FastAPI application entry point
  - `graph.py`: LangGraph agent definition
  - `tools.py`: Custom tools for the agent
  - `prompts.py`: System prompts for the agent
  - `configuration.py`: Configuration and state definition
  - `schema.py`: Data models and schemas
  - `utils.py`: Utility functions
  - `server.py`: Server entry point


- API docs in http://127.0.0.1:2024/docs
- agent studio https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024