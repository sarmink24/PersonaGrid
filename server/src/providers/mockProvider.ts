import crypto from 'node:crypto';
import type { SocialProvider, PostResult } from './types.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mockResult(): PostResult {
  return { success: true, externalId: `mock-${crypto.randomUUID()}` };
}

export const MockProvider: SocialProvider = {
  async post(content, profile) {
    console.log(`[MockProvider] POST  | token=${profile.accessToken?.slice(0, 8) ?? 'none'}… | content="${content.slice(0, 80)}"`);
    await delay(500);
    return mockResult();
  },

  async like(targetId, profile) {
    console.log(`[MockProvider] LIKE  | token=${profile.accessToken?.slice(0, 8) ?? 'none'}… | target=${targetId}`);
    await delay(500);
    return mockResult();
  },

  async comment(targetId, content, profile) {
    console.log(`[MockProvider] COMMENT | token=${profile.accessToken?.slice(0, 8) ?? 'none'}… | target=${targetId} | content="${content.slice(0, 80)}"`);
    await delay(500);
    return mockResult();
  },

  async share(targetId, profile) {
    console.log(`[MockProvider] SHARE | token=${profile.accessToken?.slice(0, 8) ?? 'none'}… | target=${targetId}`);
    await delay(500);
    return mockResult();
  },

  async follow(targetId, profile) {
    console.log(`[MockProvider] FOLLOW | token=${profile.accessToken?.slice(0, 8) ?? 'none'}… | target=${targetId}`);
    await delay(500);
    return mockResult();
  },
};
