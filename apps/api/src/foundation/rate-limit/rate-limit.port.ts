export interface RateLimitPort {
  hit(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}
