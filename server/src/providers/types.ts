export interface PostResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface SocialProvider {
  post(content: string, profile: { accessToken: string }): Promise<PostResult>;
  like(targetId: string, profile: { accessToken: string }): Promise<PostResult>;
  comment(targetId: string, content: string, profile: { accessToken: string }): Promise<PostResult>;
  share(targetId: string, profile: { accessToken: string }): Promise<PostResult>;
  follow(targetId: string, profile: { accessToken: string }): Promise<PostResult>;
}
