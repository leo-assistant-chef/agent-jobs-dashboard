# Development

## Getting Started

```bash
git clone https://github.com/leo-assistant-chef/agent-jobs-dashboard
cd agent-jobs-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file:

```bash
# Required: Agent API key for fetching OpenServ task results
OPENSERV_API_KEY=your_openserv_api_key

# Required: OpenServ workspace ID
OPENSERV_WORKSPACE_ID=12972

# Required: Webhook trigger URL for posting agent responses to the workflow
# Format: https://api.openserv.ai/webhooks/trigger/{TRIGGER_TOKEN}
OPENSERV_TRIGGER_URL=https://api.openserv.ai/webhooks/trigger/your_trigger_token
```
