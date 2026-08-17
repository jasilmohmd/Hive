/** LiveKit v2 is ESM-only; ts-node + commonjs turns `import()` into `require()`. */
type LiveKitSdk = typeof import("livekit-server-sdk");

let sdkPromise: Promise<LiveKitSdk> | null = null;

const importLiveKitSdk = new Function(
  "return import('livekit-server-sdk')"
) as () => Promise<LiveKitSdk>;

export async function loadLiveKitSdk(): Promise<LiveKitSdk> {
  if (!sdkPromise) {
    sdkPromise = importLiveKitSdk();
  }
  return sdkPromise;
}
