/**
 * openserv-client.ts
 *
 * SDK-powered client for OpenServ platform API calls.
 *
 * The @openserv-labs/sdk Agent class is designed to run as a persistent HTTP server.
 * In a serverless Next.js API route we need the platform methods (getTasks, uploadFile,
 * requestHumanAssistance) without starting an Express server.
 *
 * Solution: extend Agent, override start() with a lightweight init() that only
 * sets up the internal axios apiClient — exactly what the platform methods need.
 * This keeps every API call going through the official SDK code paths (auth headers,
 * error handling, type safety) without booting a server.
 */

import { Agent } from '@openserv-labs/sdk'
import axios from 'axios'

const OPENSERV_API_URL = process.env.OPENSERV_API_URL ?? 'https://api.openserv.ai'
const OPENSERV_WORKSPACE_ID_STR = process.env.OPENSERV_WORKSPACE_ID ?? '12972'
export const OPENSERV_WORKSPACE_ID = parseInt(OPENSERV_WORKSPACE_ID_STR, 10)

// ---------------------------------------------------------------------------
// ClientAgent — Agent subclass safe for serverless use
// ---------------------------------------------------------------------------

class ClientAgent extends Agent {
  /** Initialize only the axios apiClient (no Express server). */
  init(apiKey: string): void {
    this.setCredentials({ apiKey })
    // @ts-expect-error — apiClient is private in Agent; we init it here for serverless use
    this.apiClient = axios.create({
      baseURL: OPENSERV_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-openserv-key': apiKey,
      },
    })
  }
}

// ---------------------------------------------------------------------------
// Lazy singleton
// ---------------------------------------------------------------------------

let _client: ClientAgent | null = null

function getClient(): ClientAgent {
  if (_client) return _client

  const apiKey = process.env.OPENSERV_API_KEY
  if (!apiKey) throw new Error('OPENSERV_API_KEY is not configured.')

  const agent = new ClientAgent({
    systemPrompt: 'AI Job Finder — serverless SDK client for OpenServ platform API calls.',
    apiKey,
  })
  agent.init(apiKey)

  _client = agent
  return agent
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OpenServTask = {
  id: number
  status?: string
  latest_task_execution_record?: {
    output?: { value?: string }
  }
}

// ---------------------------------------------------------------------------
// Platform API wrappers (via SDK)
// ---------------------------------------------------------------------------

/**
 * Fetch all tasks for the configured workspace via the OpenServ SDK.
 * Replaces: raw fetch(`${BASE_URL}/workspaces/${id}/tasks?apiKey=...`)
 */
export async function fetchTasks(): Promise<OpenServTask[]> {
  const client = getClient()
  const response = await client.getTasks({ workspaceId: OPENSERV_WORKSPACE_ID })
  return (response as unknown as OpenServTask[]) ?? []
}

/**
 * Trigger the OpenServ webhook workflow.
 *
 * Webhooks are a platform UI concept (not an SDK method), so we use fetch here.
 * Auth header (x-openserv-key) is consistent with how the SDK authenticates.
 */
export async function triggerWebhook(
  triggerUrl: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: string }> {
  const apiKey = process.env.OPENSERV_API_KEY
  if (!apiKey) throw new Error('OPENSERV_API_KEY is not configured.')

  const response = await fetch(triggerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openserv-key': apiKey,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const body = await response.text()
  return { ok: response.ok, status: response.status, body }
}

/**
 * Upload structured job search results to the OpenServ workspace via the SDK.
 * Creates a persistent, shareable artifact of every search run.
 */
export async function uploadResultsFile(
  filename: string,
  content: string,
  taskIds?: number[]
): Promise<void> {
  const client = getClient()
  await client.uploadFile({
    workspaceId: OPENSERV_WORKSPACE_ID,
    path: filename,
    file: Buffer.from(content, 'utf-8'),
    ...(taskIds ? { taskIds } : {}),
    skipSummarizer: true,
  })
}
