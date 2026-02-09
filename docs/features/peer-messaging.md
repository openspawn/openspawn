# Peer-to-Peer Agent Messaging

Enables agents to message each other directly (peer-to-peer, not just parent-child).

## Database
- `recipientId` column added to Message entity for direct messages
- Indexed for efficient DM queries

## GraphQL API
- `conversations(orgId, agentId)` - Get all conversations for an agent
- `directMessages(orgId, agent1Id, agent2Id)` - Get messages between agents
- `sendDirectMessage(orgId, input)` - Send a direct message
- `markMessagesAsRead(orgId, agentId, otherAgentId)` - Mark as read
- `directMessageCreated` subscription - Real-time updates

Closes #107
