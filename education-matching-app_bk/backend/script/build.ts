import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, copyFile, readdir } from "fs/promises";
import { join } from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("copying templates...");
  // Copy all template files from server/utils/templates to dist/templates
  const sourceTemplatesDir = join("server", "utils", "templates");
  const destTemplatesDir = join("dist", "templates");
  await mkdir(destTemplatesDir, { recursive: true });
  
  // Read all files from the templates directory
  const templateFiles = await readdir(sourceTemplatesDir);
  
  // Copy all template files concurrently
  await Promise.all(
    templateFiles.map((file) =>
      copyFile(
        join(sourceTemplatesDir, file),
        join(destTemplatesDir, file)
      )
    )
  );
  console.log(`copied ${templateFiles.length} template file(s) successfully`);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
