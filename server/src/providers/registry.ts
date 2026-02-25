import type { SocialProvider } from './types.js';
import { MockProvider } from './mockProvider.js';

const providers: Record<string, SocialProvider> = {
  twitter: MockProvider,
  instagram: MockProvider,
  facebook: MockProvider,
  linkedin: MockProvider,
};

export function getProvider(platform: string): SocialProvider {
  const provider = providers[platform];
  if (!provider) {
    throw new Error(`No provider registered for platform: ${platform}`);
  }
  return provider;
}
