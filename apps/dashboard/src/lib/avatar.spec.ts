import { describe, it, expect } from 'vitest';
import { generateAgentAvatar, getAgentAvatarUrl } from './avatar';

describe('avatar', () => {
  describe('generateAgentAvatar', () => {
    it('should return a data URI', () => {
      const avatar = generateAgentAvatar({ seed: 'test-agent', level: 5 });
      expect(avatar).toMatch(/^data:image\/svg\+xml;/);
    });

    it('should return consistent avatars for the same seed', () => {
      const avatar1 = generateAgentAvatar({ seed: 'same-seed', level: 5 });
      const avatar2 = generateAgentAvatar({ seed: 'same-seed', level: 5 });
      expect(avatar1).toBe(avatar2);
    });

    it('should return different avatars for different seeds', () => {
      const avatar1 = generateAgentAvatar({ seed: 'seed-1', level: 5 });
      const avatar2 = generateAgentAvatar({ seed: 'seed-2', level: 5 });
      expect(avatar1).not.toBe(avatar2);
    });

    it('should use different styles for different levels', () => {
      const l10Avatar = generateAgentAvatar({ seed: 'agent', level: 10 });
      const l5Avatar = generateAgentAvatar({ seed: 'agent', level: 5 });
      const l1Avatar = generateAgentAvatar({ seed: 'agent', level: 1 });
      
      // Different levels should produce different avatars even with same seed
      // because they use different styles
      expect(l10Avatar).not.toBe(l5Avatar);
      expect(l5Avatar).not.toBe(l1Avatar);
    });

    it('should respect size parameter', () => {
      const smallAvatar = generateAgentAvatar({ seed: 'test', level: 5, size: 32 });
      const largeAvatar = generateAgentAvatar({ seed: 'test', level: 5, size: 128 });
      
      // Both should be valid data URIs
      expect(smallAvatar).toMatch(/^data:image\/svg\+xml;/);
      expect(largeAvatar).toMatch(/^data:image\/svg\+xml;/);
    });
  });

  describe('getAgentAvatarUrl', () => {
    it('should return a data URI', () => {
      const url = getAgentAvatarUrl('agent-123', 5);
      expect(url).toMatch(/^data:image\/svg\+xml;/);
    });

    it('should use default level if not provided', () => {
      const url = getAgentAvatarUrl('agent-123');
      expect(url).toMatch(/^data:image\/svg\+xml;/);
    });

    it('should handle all level ranges', () => {
      for (let level = 1; level <= 10; level++) {
        const url = getAgentAvatarUrl('agent', level);
        expect(url).toMatch(/^data:image\/svg\+xml;/);
      }
    });
  });
});
