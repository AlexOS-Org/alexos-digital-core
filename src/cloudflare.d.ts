declare module "cloudflare:workers" {
  interface WorkersAiBinding {
    run<T = unknown>(model: string, input: Record<string, unknown>): Promise<T>;
  }

  export const env: {
    AI?: WorkersAiBinding;
  };
}
