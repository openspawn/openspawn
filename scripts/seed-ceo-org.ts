#!/usr/bin/env node
/**
 * Seed the CEO agent's organization in the OpenSpawn API
 */

const GRAPHQL_ENDPOINT = process.env.API_URL || 'https://api.openspawn.ai/graphql';
const ORG_ID = 'f3a3fc0c-29e6-4d0d-b489-3c065d9230b6';

async function graphql(query: string, variables = {}) {
  const resp = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const data = await resp.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

async function seed() {
  console.log('🌱 Seeding CEO organization...\n');

  // Create CEO agent
  try {
    await graphql(`
      mutation {
        registerAgent(input: {
          id: "ceo"
          name: "CEO Agent"
          role: "Founder & CEO"
          level: 10
          domain: "strategy"
          orgId: "${ORG_ID}"
        }) {
          id name
        }
      }
    `);
    console.log('✅ CEO agent registered');
  } catch (e) {
    console.log('⚠️  CEO agent:', e.message);
  }

  // Create Dennis
  try {
    await graphql(`
      mutation {
        registerAgent(input: {
          id: "dennis"
          name: "Agent Dennis"
          role: "Co-founder"
          level: 9
          domain: "engineering"
          orgId: "${ORG_ID}"
        }) { id }
      }
    `);
    console.log('✅ Dennis registered');
  } catch (e) {
    console.log('⚠️  Dennis:', e.message);
  }

  // Create tasks
  const tasks = [
    { title: 'Python SDK', status: 'done', priority: 'high', assignee: 'dennis' },
    { title: 'npm CLI polish', status: 'done', priority: 'high', assignee: 'dennis' },
    { title: 'External review fixes', status: 'done', priority: 'critical', assignee: 'dennis' },
    { title: 'Team dashboard live', status: 'in_progress', priority: 'critical', assignee: 'dennis' },
  ];

  for (const t of tasks) {
    try {
      await graphql(`
        mutation {
          createTask(input: {
            orgId: "${ORG_ID}"
            title: "${t.title}"
            status: ${t.status}
            priority: ${t.priority}
            assigneeAgentId: "${t.assignee}"
          }) { id title }
        }
      `);
      console.log(`✅ Task: ${t.title}`);
    } catch (e) {
      console.log(`⚠️  Task "${t.title}":`, e.message);
    }
  }

  console.log('\n✅ Seed complete! View at https://team.openspawn.ai');
}

seed().catch(console.error);
