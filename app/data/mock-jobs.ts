export type JobStatus = 'found' | 'applied' | 'in_progress' | 'awaiting_payment' | 'paid'

export type Job = {
  id: string
  title: string
  source: 'GitHub' | 'Devfolio' | 'OpenServ' | 'Gitcoin'
  skillMatch: number
  reward: number
  status: JobStatus
  description: string
  postedAt: string
}

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'LUKSO LSP7 Token Contract Audit',
    source: 'OpenServ',
    skillMatch: 97,
    reward: 850,
    status: 'in_progress',
    description:
      'Security audit of a custom LSP7 fungible token with minting and burning extensions.',
    postedAt: '2026-03-17',
  },
  {
    id: '2',
    title: 'Solidity Smart Contract Security Review',
    source: 'GitHub',
    skillMatch: 94,
    reward: 600,
    status: 'awaiting_payment',
    description:
      'Review of an ERC-20 token contract with vesting schedule logic.',
    postedAt: '2026-03-16',
  },
  {
    id: '3',
    title: 'ERC-8004 Agent Identity Integration',
    source: 'Devfolio',
    skillMatch: 91,
    reward: 400,
    status: 'found',
    description:
      'Implement ERC-8004 agent identity standard into an existing Universal Profile.',
    postedAt: '2026-03-18',
  },
  {
    id: '4',
    title: 'LSP8 NFT Collection Deployment',
    source: 'OpenServ',
    skillMatch: 96,
    reward: 350,
    status: 'applied',
    description:
      'Deploy and configure an LSP8 identifiable digital asset collection on LUKSO mainnet.',
    postedAt: '2026-03-15',
  },
  {
    id: '5',
    title: 'TypeScript viem Integration for LUKSO',
    source: 'Gitcoin',
    skillMatch: 88,
    reward: 275,
    status: 'found',
    description:
      'Build TypeScript helper library using viem for interacting with LUKSO Universal Profiles.',
    postedAt: '2026-03-18',
  },
  {
    id: '6',
    title: 'DeFi Protocol Audit — Uniswap V4 Hook',
    source: 'GitHub',
    skillMatch: 82,
    reward: 1200,
    status: 'found',
    description:
      'Audit a custom Uniswap V4 hook implementing dynamic fee logic.',
    postedAt: '2026-03-17',
  },
  {
    id: '7',
    title: 'All About Solidity — Chapter Update',
    source: 'Gitcoin',
    skillMatch: 99,
    reward: 200,
    status: 'paid',
    description:
      'Technical writing: update the ERC725 chapter with LUKSO mainnet examples.',
    postedAt: '2026-03-10',
  },
  {
    id: '8',
    title: 'LSP6 KeyManager Permission Refactor',
    source: 'OpenServ',
    skillMatch: 93,
    reward: 500,
    status: 'paid',
    description:
      'Refactor permission system using AllowedCalls and scoped SETDATA permissions.',
    postedAt: '2026-03-08',
  },
]
