const { cleanupAll, db } = require('./db');

(async () => {
  const result = await cleanupAll();
  console.log('Cleanup complete:', result);
  await db.$disconnect();
})();
