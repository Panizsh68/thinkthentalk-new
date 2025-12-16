#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

const PNPM_DIR = path.join(__dirname, '..', 'node_modules', '.pnpm');

async function listPnpmEntries(prefix) {
  try {
    const entries = await fs.readdir(PNPM_DIR);
    return entries.filter((entry) => entry.startsWith(prefix));
  } catch (error) {
    console.warn(`[postinstall] ${PNPM_DIR} missing: ${error.message}`);
    return [];
  }
}

async function patchZeptomatch() {
  const sourceCjs = path.join(__dirname, 'patches', 'zeptomatch', 'index.cjs');
  const targets = await listPnpmEntries('zeptomatch@');
  if (targets.length === 0) {
    console.warn('[patch-zeptomatch] No zeptomatch package located under node_modules/.pnpm.');
    return;
  }

  for (const entry of targets) {
    const packageDir = path.join(PNPM_DIR, entry, 'node_modules', 'zeptomatch');
    const distDir = path.join(packageDir, 'dist');
    const targetCjs = path.join(distDir, 'index.cjs');
    const packageJsonPath = path.join(packageDir, 'package.json');

    try {
      await fs.mkdir(distDir, { recursive: true });
      await fs.copyFile(sourceCjs, targetCjs);

      const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const expectedExports = {
        import: './dist/index.js',
        require: './dist/index.cjs',
      };
      const needsUpdate =
        typeof pkg.exports !== 'object' ||
        pkg.exports.import !== expectedExports.import ||
        pkg.exports.require !== expectedExports.require;

      if (needsUpdate) {
        pkg.exports = expectedExports;
        if (!pkg.main) {
          pkg.main = './dist/index.js';
        }
        await fs.writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
      }
      console.info(`[patch-zeptomatch] Patched ${entry}`);
    } catch (error) {
      console.warn(`[patch-zeptomatch] Failed to patch ${entry}:`, error.message);
    }
  }
}

async function ensurePrismaTypeStubs() {
  const clientTargets = await listPnpmEntries('@prisma+client@');
  if (clientTargets.length === 0) {
    console.warn('[patch-prisma] No @prisma/client package located under node_modules/.pnpm.');
    return;
  }

  const sourceDir = path.join(
    PNPM_DIR,
    clientTargets[0],
    'node_modules',
    '@prisma',
    'client',
  );
  const targetDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');

  try {
    await fs.access(targetDir);
  } catch {
    console.warn('[patch-prisma] Target client directory missing, skipping type restore.');
    return;
  }

  const files = (await fs.readdir(sourceDir)).filter((file) => file.endsWith('.d.ts'));
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.copyFile(path.join(sourceDir, file), path.join(targetDir, file));
      } catch (error) {
        console.warn(`[patch-prisma] Failed to copy ${file}:`, error.message);
      }
    }),
  );
  console.info('[patch-prisma] Ensured Prisma Client .d.ts files are present.');
}

async function main() {
  await patchZeptomatch();
  await ensurePrismaTypeStubs();
}

main().catch((error) => {
  console.error('[postinstall] Unexpected error:', error);
  process.exitCode = 1;
});
