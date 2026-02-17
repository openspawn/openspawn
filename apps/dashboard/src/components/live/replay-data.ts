// ── Agent definitions ────────────────────────────────────────────────────────

export interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  avatarUrl?: string;
}

const av = (name: string) => `/avatars/${name}.png`;

export const AGENTS: Record<string, AgentDef> = {
  'mr-krabs': { id: 'mr-krabs', name: 'Mr. Krabs', emoji: '🦀', avatarUrl: av('mr-krabs') },
  'spongebob-squarepants': { id: 'spongebob-squarepants', name: 'SpongeBob', emoji: '🧽', avatarUrl: av('spongebob') },
  'squidward-tentacles': { id: 'squidward-tentacles', name: 'Squidward', emoji: '🐙', avatarUrl: av('squidward') },
  'squilliam-fancyson': { id: 'squilliam-fancyson', name: 'Squilliam', emoji: '🎩', avatarUrl: av('squilliam') },
  'sandy-cheeks': { id: 'sandy-cheeks', name: 'Sandy', emoji: '🐿️', avatarUrl: av('sandy') },
  'karen': { id: 'karen', name: 'Karen', emoji: '🖥️', avatarUrl: av('karen') },
  'pearl-krabs': { id: 'pearl-krabs', name: 'Pearl', emoji: '🐳', avatarUrl: av('pearl') },
  'perch-perkins': { id: 'perch-perkins', name: 'Perch Perkins', emoji: '🐟' },
  'mermaid-man': { id: 'mermaid-man', name: 'Mermaid Man', emoji: '🦸‍♂️', avatarUrl: av('mermaid-man') },
  'plankton-jr': { id: 'plankton-jr', name: 'Plankton Jr', emoji: '🧫' },
  'patrick-star': { id: 'patrick-star', name: 'Patrick', emoji: '⭐', avatarUrl: av('patrick') },
  'gary': { id: 'gary', name: 'Gary', emoji: '🐌', avatarUrl: av('gary') },
  'plankton': { id: 'plankton', name: 'Plankton', emoji: '🦠', avatarUrl: av('plankton') },
  'barnacle-boy': { id: 'barnacle-boy', name: 'Barnacle Boy', emoji: '🦸', avatarUrl: av('barnacle-boy') },
  'larry-the-lobster': { id: 'larry-the-lobster', name: 'Larry', emoji: '🦞', avatarUrl: av('larry') },
  'bubble-bass': { id: 'bubble-bass', name: 'Bubble Bass', emoji: '🐡' },
  'dennis': { id: 'dennis', name: 'Dennis', emoji: '🕶️' },
  'flying-dutchman': { id: 'flying-dutchman', name: 'Flying Dutchman', emoji: '👻', avatarUrl: av('flying-dutchman') },
  'fred-1': { id: 'fred-1', name: 'Fred', emoji: '🧑' },
  'fred-2': { id: 'fred-2', name: 'Fred 2', emoji: '🧑' },
  'fred-3': { id: 'fred-3', name: 'Fred 3', emoji: '🧑' },
  'mrs-puff': { id: 'mrs-puff', name: 'Mrs. Puff', emoji: '🐠', avatarUrl: av('mrs-puff') },
};

// ── Stats ────────────────────────────────────────────────────────────────────

export interface Stats {
  kitchenRate: number;
  queueSize: number;
  deliveryRate: number;
  revenue: number;
  margin: number;
  budgetUsed: number;
  pattiesProduced: number;
  pattiesDelivered: number;
}

// ── Acts ─────────────────────────────────────────────────────────────────────

export const ACTS = [
  { num: 1, name: 'Act I: The Order', narrative: 'Plankton walks in with the order of a lifetime.' },
  { num: 2, name: 'Act II: Hiring the Kitchen', narrative: 'SpongeBob spins up 20 sous-chef instances. The org chart explodes.' },
  { num: 3, name: 'Act III: The Bottleneck', narrative: 'Squidward can\'t keep up. The queue grows. Tensions rise.' },
  { num: 4, name: 'Act IV: The Decision', narrative: 'Mr. Krabs reorganizes. Reinforcements arrive.' },
  { num: 5, name: 'Act V: Victory', narrative: 'The last patty delivered. Bikini Bottom celebrates.' },
];

// ── Replay Event ─────────────────────────────────────────────────────────────

export type NodeStatus = 'idle' | 'working' | 'busy' | 'overwhelmed';

export interface SpawnedAgent {
  id: string;
  name: string;
  emoji: string;
  avatarUrl?: string;
  parentId: string;
}

export interface ReplayEvent {
  tick: number;
  type: 'message' | 'delegation' | 'escalation' | 'completion' | 'stat_update' | 'act_change' | 'node_status' | 'reassign' | 'spawn' | 'despawn';
  data: {
    from?: string;
    to?: string;
    text?: string;
    act?: number;
    agent?: string;
    status?: NodeStatus;
    stats?: Partial<Stats>;
    pattiesProduced?: number;
    pattiesDelivered?: number;
    queueSize?: number;
    // spawn fields
    spawnAgent?: SpawnedAgent;
  };
}

// ── Timeline ─────────────────────────────────────────────────────────────────

export const TIMELINE: ReplayEvent[] = [
  // ═══ ACT 1: The Order (ticks 0-10) ═══
  { tick: 0, type: 'act_change', data: { act: 0 } },
  { tick: 1, type: 'message', data: { from: 'plankton', text: 'I need 10,000 Krabby Patties. By end of day. 💰💰💰' } },
  { tick: 2, type: 'message', data: { from: 'mr-krabs', text: '10,000?! 💰💰💰 MONEY MONEY MONEY!' } },
  { tick: 2, type: 'node_status', data: { agent: 'mr-krabs', status: 'working' } },
  { tick: 3, type: 'stat_update', data: { stats: { kitchenRate: 0, deliveryRate: 0, queueSize: 0, revenue: 0, margin: 0, budgetUsed: 0, pattiesProduced: 0, pattiesDelivered: 0 } } },
  { tick: 4, type: 'delegation', data: { from: 'mr-krabs', to: 'spongebob-squarepants', text: 'SpongeBob! Fire up every grill! 10,000 patties!' } },
  { tick: 4, type: 'node_status', data: { agent: 'spongebob-squarepants', status: 'working' } },
  { tick: 6, type: 'delegation', data: { from: 'mr-krabs', to: 'squidward-tentacles', text: 'Squidward! You\'re on delivery. Move it!' } },
  { tick: 6, type: 'node_status', data: { agent: 'squidward-tentacles', status: 'working' } },
  { tick: 8, type: 'delegation', data: { from: 'mr-krabs', to: 'squilliam-fancyson', text: 'Squilliam — track every penny. I want P&L on my desk.' } },
  { tick: 8, type: 'node_status', data: { agent: 'squilliam-fancyson', status: 'working' } },
  { tick: 10, type: 'message', data: { from: 'spongebob-squarepants', text: 'I\'M READY! I\'M READY! I\'M READY!' } },

  // ═══ ACT 2: Hiring the Kitchen (ticks 11-40) ═══
  { tick: 11, type: 'act_change', data: { act: 1 } },
  { tick: 12, type: 'message', data: { from: 'spongebob-squarepants', text: '10,000 patties?! I can\'t do this with just Patrick and Sandy...' } },
  { tick: 13, type: 'escalation', data: { from: 'spongebob-squarepants', to: 'mr-krabs', text: 'Mr. Krabs! I need to spin up sous-chef instances. 20 of them!' } },
  { tick: 14, type: 'message', data: { from: 'mr-krabs', text: '20?! That\'s 50 credits each! 💸💸💸' } },
  { tick: 15, type: 'message', data: { from: 'spongebob-squarepants', text: 'It\'s 1,000 credits... or we miss the order and lose 50,000.' } },
  { tick: 16, type: 'message', data: { from: 'mr-krabs', text: '...fine. But they\'re TEMPORARY! sessions_spawn, 20 instances. Go!' } },
  { tick: 17, type: 'delegation', data: { from: 'spongebob-squarepants', to: 'sandy-cheeks', text: 'Sandy — architect the pipeline. I\'m spinning up the team!' } },
  { tick: 17, type: 'node_status', data: { agent: 'sandy-cheeks', status: 'working' } },
  { tick: 18, type: 'message', data: { from: 'sandy-cheeks', text: '3-stage pipeline: prep → grill → plate. Each sous-chef gets a lane.' } },
  // ── Sous-chefs spawn rapidly (ticks 19-28) — one per half-tick ──
  { tick: 19, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-1', name: 'Sous Chef #1', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 19, type: 'stat_update', data: { stats: { kitchenRate: 5, pattiesProduced: 10, deliveryRate: 8, pattiesDelivered: 5, queueSize: 5, revenue: 25, budgetUsed: 5 } } },
  { tick: 19, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-2', name: 'Sous Chef #2', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 20, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-3', name: 'Sous Chef #3', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 20, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-4', name: 'Sous Chef #4', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 20, type: 'stat_update', data: { stats: { kitchenRate: 15, pattiesProduced: 40, queueSize: 20 } } },
  { tick: 20, type: 'message', data: { from: 'karen', text: 'Running security scan on Plankton\'s order... 🔒' } },
  { tick: 20, type: 'node_status', data: { agent: 'karen', status: 'working' } },
  { tick: 21, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-5', name: 'Sous Chef #5', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 21, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-6', name: 'Sous Chef #6', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 21, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-7', name: 'Sous Chef #7', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 22, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-8', name: 'Sous Chef #8', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 22, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-9', name: 'Sous Chef #9', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 22, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-10', name: 'Sous Chef #10', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 22, type: 'stat_update', data: { stats: { kitchenRate: 40, pattiesProduced: 150, queueSize: 80, revenue: 375, budgetUsed: 10 } } },
  { tick: 22, type: 'message', data: { from: 'spongebob-squarepants', text: '10 sous-chefs online! Production RAMPING! 🚀' } },
  { tick: 23, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-11', name: 'Sous Chef #11', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 23, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-12', name: 'Sous Chef #12', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 23, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-13', name: 'Sous Chef #13', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 24, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-14', name: 'Sous Chef #14', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 24, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-15', name: 'Sous Chef #15', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 24, type: 'stat_update', data: { stats: { kitchenRate: 65, pattiesProduced: 400, queueSize: 250, revenue: 1000, budgetUsed: 15 } } },
  { tick: 25, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-16', name: 'Sous Chef #16', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 25, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-17', name: 'Sous Chef #17', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 25, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-18', name: 'Sous Chef #18', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 26, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-19', name: 'Sous Chef #19', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 26, type: 'spawn', data: { spawnAgent: { id: 'sous-chef-20', name: 'Sous Chef #20', emoji: '⭐', avatarUrl: '/avatars/patrick.png', parentId: 'spongebob-squarepants' }} },
  { tick: 26, type: 'stat_update', data: { stats: { kitchenRate: 100, pattiesProduced: 700, queueSize: 500, revenue: 1750, budgetUsed: 20 } } },
  { tick: 27, type: 'message', data: { from: 'spongebob-squarepants', text: '🔥 ALL 20 SOUS-CHEFS ONLINE! Production at 100/tick! I\'M READY!' } },
  { tick: 27, type: 'node_status', data: { agent: 'patrick-star', status: 'working' } },
  { tick: 28, type: 'delegation', data: { from: 'sandy-cheeks', to: 'gary', text: 'Gary — QA every 10th patty. Reject anything substandard.' } },
  { tick: 28, type: 'node_status', data: { agent: 'gary', status: 'working' } },
  { tick: 28, type: 'message', data: { from: 'gary', text: 'Meow. 🔍 (QA initialized)' } },
  { tick: 29, type: 'message', data: { from: 'perch-perkins', text: '📺 BREAKING: SpongeBob just hired 20 SOUS-CHEFS! Kitchen is a MACHINE!' } },
  { tick: 29, type: 'node_status', data: { agent: 'perch-perkins', status: 'working' } },
  { tick: 30, type: 'stat_update', data: { stats: { kitchenRate: 100, pattiesProduced: 1100, pattiesDelivered: 180, queueSize: 920, revenue: 2750, budgetUsed: 22 } } },
  { tick: 32, type: 'message', data: { from: 'gary', text: 'Meow! ✅ Batch 4 passed. ❌ Batch 5 rejected — bun alignment off.' } },
  { tick: 34, type: 'message', data: { from: 'squidward-tentacles', text: 'Table 7... table 12... table 3... why are there SO MANY patties?! *sigh*' } },
  { tick: 36, type: 'message', data: { from: 'squilliam-fancyson', text: 'Sous-chef costs: 1,000cr. Kitchen throughput: 100/tick. ROI looks solid. 📊' } },
  { tick: 38, type: 'stat_update', data: { stats: { kitchenRate: 100, pattiesProduced: 1900, pattiesDelivered: 450, queueSize: 1450, revenue: 4750, margin: 4.2, budgetUsed: 28 } } },
  { tick: 40, type: 'stat_update', data: { stats: { kitchenRate: 100, pattiesProduced: 2500, pattiesDelivered: 600, queueSize: 1900, revenue: 6250, budgetUsed: 32 } } },

  // ═══ ACT 3: The Bottleneck (ticks 41-90) ═══
  { tick: 41, type: 'act_change', data: { act: 2 } },
  { tick: 42, type: 'message', data: { from: 'squidward-tentacles', text: 'These patties are piling up faster than I can carry them!' } },
  { tick: 42, type: 'node_status', data: { agent: 'squidward-tentacles', status: 'busy' } },
  { tick: 45, type: 'stat_update', data: { stats: { queueSize: 1200, pattiesProduced: 2000, pattiesDelivered: 600, revenue: 3000 } } },
  { tick: 48, type: 'message', data: { from: 'squidward-tentacles', text: 'ORDER UP! ...wait, wrong table. 😤' } },
  { tick: 50, type: 'stat_update', data: { stats: { queueSize: 1500, pattiesProduced: 2600, pattiesDelivered: 800, revenue: 4000, budgetUsed: 35 } } },
  { tick: 52, type: 'message', data: { from: 'barnacle-boy', text: '⚠️ Support tickets spiking! Customers complaining about wait times.' } },
  { tick: 52, type: 'node_status', data: { agent: 'barnacle-boy', status: 'working' } },
  { tick: 55, type: 'stat_update', data: { stats: { queueSize: 1800, pattiesProduced: 3200, pattiesDelivered: 1000, kitchenRate: 50, deliveryRate: 8 } } },
  { tick: 56, type: 'message', data: { from: 'squidward-tentacles', text: 'My back... my feet... my will to live... 😩' } },
  { tick: 56, type: 'node_status', data: { agent: 'squidward-tentacles', status: 'overwhelmed' } },
  { tick: 58, type: 'message', data: { from: 'flying-dutchman', text: '👻 Even I wouldn\'t haunt someone working this hard.' } },
  { tick: 60, type: 'stat_update', data: { stats: { queueSize: 2100, pattiesProduced: 3800, pattiesDelivered: 1200, revenue: 6000, budgetUsed: 42 } } },
  { tick: 62, type: 'message', data: { from: 'larry-the-lobster', text: 'Squidward looks like he needs a protein shake... and a stretcher.' } },
  { tick: 65, type: 'stat_update', data: { stats: { queueSize: 2400, pattiesProduced: 4300, pattiesDelivered: 1400 } } },
  { tick: 68, type: 'message', data: { from: 'squidward-tentacles', text: 'That\'s IT. I can\'t take it anymore!' } },
  { tick: 70, type: 'escalation', data: { from: 'squidward-tentacles', to: 'mr-krabs', text: '🚨 I CAN\'T DELIVER 10,000 BY MYSELF! THE QUEUE IS AT 2500!' } },
  { tick: 70, type: 'stat_update', data: { stats: { queueSize: 2500 } } },
  { tick: 72, type: 'message', data: { from: 'spongebob-squarepants', text: 'Kitchen team is idling... nowhere to PUT the patties! Pipeline backed up.' } },
  { tick: 72, type: 'stat_update', data: { stats: { kitchenRate: 30 } } },
  { tick: 75, type: 'message', data: { from: 'mr-krabs', text: 'Hmm... we have a delivery bottleneck. Think, Krabs, think! 🤔' } },
  { tick: 78, type: 'message', data: { from: 'perch-perkins', text: '📺 UPDATE: Delays reported at Krusty Krab. Customers growing restless.' } },
  { tick: 80, type: 'stat_update', data: { stats: { queueSize: 2600, pattiesProduced: 5000, pattiesDelivered: 1800, kitchenRate: 25, revenue: 9000, budgetUsed: 50 } } },
  { tick: 82, type: 'message', data: { from: 'bubble-bass', text: 'You forgot my PICKLES! And I\'ve been waiting 45 MINUTES!' } },
  { tick: 85, type: 'message', data: { from: 'barnacle-boy', text: '⚠️ 47 open support tickets. Satisfaction dropping fast.' } },
  { tick: 88, type: 'message', data: { from: 'karen', text: 'Plankton accessed our order API 23 times so far. Monitoring... 👀' } },
  { tick: 90, type: 'stat_update', data: { stats: { queueSize: 2700, pattiesProduced: 5500, pattiesDelivered: 2100, revenue: 10500, margin: 3.8, budgetUsed: 55 } } },

  // ═══ ACT 4: The Decision (ticks 91-120) ═══
  { tick: 91, type: 'act_change', data: { act: 3 } },
  { tick: 92, type: 'message', data: { from: 'mr-krabs', text: 'I\'ve made me decision! Pearl! Fred! You\'re on delivery NOW!' } },
  { tick: 93, type: 'message', data: { from: 'squilliam-fancyson', text: '⚠️ Overtime costs will eat into margins, sir.' } },
  { tick: 94, type: 'message', data: { from: 'mr-krabs', text: 'Better thin margins than NO margins! MOVE IT!' } },
  { tick: 95, type: 'reassign', data: { from: 'mr-krabs', to: 'pearl-krabs', text: 'Pearl reassigned to delivery team' } },
  { tick: 95, type: 'node_status', data: { agent: 'pearl-krabs', status: 'working' } },
  { tick: 96, type: 'reassign', data: { from: 'mr-krabs', to: 'fred-1', text: 'Fred reassigned to delivery team' } },
  { tick: 96, type: 'node_status', data: { agent: 'fred-1', status: 'working' } },
  { tick: 97, type: 'message', data: { from: 'pearl-krabs', text: 'Ugh, FINE daddy. But I\'m getting overtime pay! 💅' } },
  { tick: 98, type: 'message', data: { from: 'fred-1', text: 'MY LEG— I mean, I\'m on it!' } },
  { tick: 100, type: 'stat_update', data: { stats: { deliveryRate: 15, queueSize: 2500, pattiesDelivered: 2500, kitchenRate: 35, revenue: 12500, budgetUsed: 60 } } },
  { tick: 103, type: 'message', data: { from: 'squidward-tentacles', text: 'Oh thank Neptune, reinforcements!' } },
  { tick: 103, type: 'node_status', data: { agent: 'squidward-tentacles', status: 'busy' } },
  { tick: 105, type: 'stat_update', data: { stats: { deliveryRate: 20, queueSize: 2200, pattiesProduced: 6200, pattiesDelivered: 3200, revenue: 16000 } } },
  { tick: 108, type: 'stat_update', data: { stats: { deliveryRate: 25, queueSize: 1800, pattiesDelivered: 3800, revenue: 19000, budgetUsed: 68 } } },
  { tick: 110, type: 'message', data: { from: 'spongebob-squarepants', text: 'Queue is draining! Kitchen back to full speed! 🔥' } },
  { tick: 110, type: 'stat_update', data: { stats: { kitchenRate: 50, queueSize: 1500, pattiesProduced: 6800, pattiesDelivered: 4500, revenue: 22500 } } },
  { tick: 113, type: 'stat_update', data: { stats: { queueSize: 1200, pattiesDelivered: 5200, revenue: 26000 } } },
  { tick: 115, type: 'message', data: { from: 'squilliam-fancyson', text: 'Delivery throughput tripled. Costs up 18% but revenue recovering. 📈' } },
  { tick: 118, type: 'stat_update', data: { stats: { queueSize: 800, pattiesProduced: 7500, pattiesDelivered: 6200, revenue: 31000, budgetUsed: 75 } } },
  { tick: 118, type: 'node_status', data: { agent: 'squidward-tentacles', status: 'working' } },
  { tick: 120, type: 'stat_update', data: { stats: { queueSize: 500, pattiesProduced: 8000, pattiesDelivered: 7000, revenue: 35000, margin: 3.6, budgetUsed: 80 } } },

  // ═══ ACT 5: Victory (ticks 121-150) ═══
  { tick: 121, type: 'act_change', data: { act: 4 } },
  { tick: 122, type: 'stat_update', data: { stats: { queueSize: 300, pattiesProduced: 8500, pattiesDelivered: 7800, revenue: 39000 } } },
  { tick: 125, type: 'stat_update', data: { stats: { queueSize: 150, pattiesProduced: 9000, pattiesDelivered: 8500, revenue: 42500, budgetUsed: 85 } } },
  { tick: 127, type: 'message', data: { from: 'karen', text: 'Plankton accessed our API 47 times. No breach detected. He just really likes patties. 🔒' } },
  { tick: 128, type: 'stat_update', data: { stats: { queueSize: 50, pattiesProduced: 9500, pattiesDelivered: 9200, revenue: 46000 } } },
  { tick: 130, type: 'stat_update', data: { stats: { queueSize: 20, pattiesProduced: 9800, pattiesDelivered: 9600 } } },
  { tick: 132, type: 'message', data: { from: 'perch-perkins', text: '📺 RECORD ORDER at the Krusty Krab! 10,000 patties — unprecedented!' } },
  { tick: 135, type: 'stat_update', data: { stats: { queueSize: 0, kitchenRate: 0, deliveryRate: 0, pattiesProduced: 10000, pattiesDelivered: 9800, revenue: 49000, budgetUsed: 90 } } },
  { tick: 137, type: 'stat_update', data: { stats: { pattiesDelivered: 10000, revenue: 50000 } } },
  { tick: 138, type: 'completion', data: { from: 'spongebob-squarepants', text: '🎉 10,000 KRABBY PATTIES DELIVERED! WE DID IT!' } },
  { tick: 139, type: 'message', data: { from: 'squilliam-fancyson', text: 'Final P&L — Revenue: 50,000cr. Costs: 48,200cr. Margin: 3.6%. 📊' } },
  { tick: 140, type: 'stat_update', data: { stats: { margin: 3.6, budgetUsed: 96 } } },
  { tick: 141, type: 'message', data: { from: 'mr-krabs', text: 'I\'ll take it! 💰💰💰 Every penny counts!' } },
  { tick: 143, type: 'message', data: { from: 'squidward-tentacles', text: '*collapses behind the counter* ...never again. 😵' } },
  { tick: 143, type: 'node_status', data: { agent: 'squidward-tentacles', status: 'idle' } },
  { tick: 145, type: 'message', data: { from: 'patrick-star', text: 'Can we do 20,000 tomorrow? 🤩' } },
  { tick: 146, type: 'message', data: { from: 'squidward-tentacles', text: 'NO.' } },
  { tick: 147, type: 'message', data: { from: 'plankton', text: 'Hmm... next time I\'ll order 20,000. HAHAHAHA!' } },
  // Final — all nodes green
  { tick: 148, type: 'node_status', data: { agent: 'mr-krabs', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'spongebob-squarepants', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'squilliam-fancyson', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'sandy-cheeks', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'karen', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'patrick-star', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'gary', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'pearl-krabs', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'perch-perkins', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'barnacle-boy', status: 'idle' } },
  { tick: 148, type: 'node_status', data: { agent: 'fred-1', status: 'idle' } },
  { tick: 150, type: 'completion', data: { from: 'mr-krabs', text: 'Operation: 10,000 Krabby Patties — COMPLETE. 🍔' } },
];
