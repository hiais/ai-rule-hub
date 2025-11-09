// Quick test runner to verify StarterInstaller copies missing files from resources/starter
const path = require('node:path');
const fs = require('node:fs/promises');

async function main() {
  const { StarterInstaller } = require('../dist/core/startup/StarterInstaller.js');
  const { StorageManager } = require('../dist/core/storage/StorageManager.js');
  const { MetadataManager } = require('../dist/core/metadata/MetadataManager.js');

  const tmpBase = path.join(__dirname, '..', '.tmp', 'hub');
  await fs.mkdir(tmpBase, { recursive: true });

  const config = {
    version: '1.0.0',
    storagePath: tmpBase,
    categories: {
      rule: { enabled: true, fileExtensions: ['.md'] },
      prompt: { enabled: true, fileExtensions: ['.md'] },
      mcp: { enabled: true, fileExtensions: ['.json'] },
      agent: { enabled: true, fileExtensions: ['.md'] },
      workflow: { enabled: true, fileExtensions: ['.md'] },
    },
    features: { autoRefresh: true, showFileCounts: true, enableSearch: true },
  };

  const storage = new StorageManager();
  const metadata = new MetadataManager();
  await storage.initialize(config);
  await metadata.initialize(config.storagePath);

  const fakeContext = {
    asAbsolutePath: (rel) => path.join(__dirname, '..', rel),
  };

  await new StarterInstaller().installFromResources(fakeContext, config, storage, metadata);

  const cats = Object.keys(config.categories);
  for (const cat of cats) {
    const dir = path.join(tmpBase, 'categories', cat);
    const exists = await pathExists(dir);
    const files = exists ? await fs.readdir(dir) : [];
    console.log(`[${cat}]`, files);
  }
}

async function pathExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
