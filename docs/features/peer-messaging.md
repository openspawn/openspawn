# Peer-to-Peer Agent Messaging

Enables agents to message each other directly (not just parent-child).

## Database

- `recipientId` column added to Message entity
- Indexed for efficient DM queries

## GraphQL API

- `conversations(orgId, agentId)` - Get all conversations
- `directMessages(orgId, agent1Id, agent2Id)` - Get messages
- `sendDirectMessage(orgId, input)` - Send a DM
- `markMessagesAsRead(orgId, agentId, otherAgentId)` - Mark as read
- `directMessageCreated` subscription - Real-time updates

Closes #107
