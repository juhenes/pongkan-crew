import { randomUUID } from 'node:crypto';
import { TERMINAL } from './tasks.js';

export class ChatSessions {
  constructor(crew) {
    this.crew = crew;
  }
  get(id) {
    const chat = this.crew.state.conversations.find(c => c.id === id);
    if (!chat) throw new Error('Unknown conversation. Use /conversation list.');
    return chat;
  }
  create(target, title, { activate = true } = {}) {
    if (!title?.trim() || title.length > 120) throw new Error('Use a conversation title of 1–120 characters.');
    if (target !== 'group') this.crew.member(target);
    const chat = {
      id: randomUUID().slice(0, 8),
      title: title.trim(),
      kind: target === 'group' ? 'group' : 'direct',
      member: target === 'group' ? null : target,
      messages: [],
      threadId: null,
      status: 'ready',
      createdAt: Date.now(),
      archived: false,
    };
    this.crew.state.conversations.push(chat);
    if (activate) this.open(chat.id);
    else this.crew.save();
    return chat;
  }
  open(id) {
    const chat = this.get(id);
    if (chat.archived) throw new Error('Conversation is archived. Use /conversation restore ID first.');
    if (chat.kind === 'group') this.crew.state.activeGroupConversation = id;
    else {
      this.crew.member(chat.member);
      this.crew.state.activeConversations[chat.member] = id;
    }
    this.crew.save();
    return chat;
  }
  archive(id, archived = true) {
    const chat = this.get(id);
    if (
      archived &&
      (this.crew.state.workflows.some(
        f => !TERMINAL.has(f.status) && Object.values(f.conversations || {}).includes(id),
      ) ||
        this.crew.state.schedules.some(s => s.enabled && s.conversationId === id))
    )
      throw new Error('Pause the schedule or finish this conversation’s workflow before archiving.');
    if (
      archived &&
      this.crew.state.tasks.some(
        t =>
          !TERMINAL.has(t.status) &&
          (t.conversationId === id ||
            (t.discussionId && this.crew.state.discussions.find(d => d.id === t.discussionId)?.conversationId === id)),
      )
    ) {
      throw new Error('Finish or cancel this conversation’s tasks before archiving.');
    }
    chat.archived = archived;
    if (archived) {
      if (this.crew.state.activeGroupConversation === id) this.crew.state.activeGroupConversation = null;
      if (this.crew.state.activeConversations[chat.member] === id)
        delete this.crew.state.activeConversations[chat.member];
    }
    this.crew.save();
    return chat;
  }
  member(name, id = this.crew.state.activeConversations[name]) {
    const profile = this.crew.member(name);
    if (!id) return profile;
    const chat = this.get(id);
    if (chat.member !== name || chat.kind !== 'direct') throw new Error('Conversation belongs to another teammate.');
    const local = new Set(['messages', 'threadId', 'status', 'progress']);
    return new Proxy(profile, {
      get: (target, key) => (local.has(key) ? chat[key] : target[key]),
      set: (target, key, value) => {
        (local.has(key) ? chat : target)[key] = value;
        return true;
      },
    });
  }
}
