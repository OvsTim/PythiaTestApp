import type {Message} from '../../api';

function roleRank(role: Message['role']): number {
  // Same created_at (mock stamps user + reply together): keep user before reply.
  return role === 'user' ? 0 : 1;
}

/** Upsert by id, then stable chronological order with a role tie-break. */
export function mergeMessages(
  existing: Message[] | undefined,
  incoming: Message[],
): Message[] {
  const byId = new Map<string, Message>();
  for (const message of existing ?? []) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const byTime = a.created_at.localeCompare(b.created_at);
    if (byTime !== 0) {
      return byTime;
    }
    const byRole = roleRank(a.role) - roleRank(b.role);
    if (byRole !== 0) {
      return byRole;
    }
    return a.id.localeCompare(b.id);
  });
}
