import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
await build({
  entryPoints: ["tests/regression.test.jsx", "tests/audit.test.jsx"], outdir: "test-results", outExtension: {".js": ".cjs"},
  bundle: true, platform: "node", format: "cjs", packages: "external", jsx: "automatic",
  loader: { ".js": "jsx" }, tsconfig: "jsconfig.json",
  plugins: [{ name: "test-boundaries", setup(build) {
    build.onResolve({ filter: /^react-dom$/ }, args => args.importer.endsWith("/components/OnboardingTour.js") ? ({ path: "portal", namespace: "test-boundary" }) : undefined);
    build.onResolve({ filter: /^(next\/navigation|@\/lib\/(useLineProfile|liff)|@\/components\/(TopBar|OnboardingTour|EditTaskTour))$/ }, args => ({ path: args.path, namespace: "test-boundary" }));
    build.onLoad({ filter: /.*/, namespace: "test-boundary" }, ({ path }) => ({ contents:
      path === "portal" ? `export const createPortal=(children)=>children;`
      : path === "next/navigation" ? `export const useParams=()=>({id:'task-1'}); export const usePathname=()=>'/create'; export const useRouter=()=>({push(){},replace(){}}); export const useSearchParams=()=>new URLSearchParams();`
      : path.endsWith("useLineProfile") ? `export const useLineProfile=()=>({profile:globalThis.testProfile,loading:false,login(){}});`
      : path.endsWith("liff") ? `export const initLiff=async()=>{}; export const liff={isInClient:()=>false,getAccessToken:()=>"organizer"};`
      : path.endsWith("TopBar") ? `export const TopBar=()=>null; export const EmptyState=()=>null;`
      : path.endsWith("OnboardingTour") ? `export default ()=>null; export const getOnboardingState=()=>"done"; export const setOnboardingState=()=>{};`
      : `export default ()=>null; export const shouldOfferEditTaskTour=()=>false;`
    }));
  } }],
});
const result = spawnSync(process.execPath, ["--test", "test-results/regression.test.cjs", "test-results/audit.test.cjs"], {
  stdio: "inherit", env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon", SUPABASE_SERVICE_ROLE_KEY: "test-service", LINE_LOGIN_CHANNEL_ID: "test-channel" },
});
process.exitCode = result.status ?? 1;
