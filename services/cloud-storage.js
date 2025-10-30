// === CLOUD STORAGE SERVICE ===
// Sync local storage to cloud (Supabase/Railway persistent storage)

const fs = require('fs').promises;
const path = require('path');

const STORAGE_DIR = './data';
const AUTH_DIR = './auth_info_baileys';

/**
 * Check if Railway volumes are available
 */
function hasRailwayVolumes() {
  // Railway volumes are mounted at specific paths
  return process.env.RAILWAY_VOLUME_MOUNT_PATH !== undefined;
}

/**
 * Ensure directories exist
 */
async function ensureDirectories() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(AUTH_DIR, { recursive: true });
    console.log('📁 Storage directories created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create directories:', error.message);
    return false;
  }
}

/**
 * Check if running in production (Railway)
 */
function isProduction() {
  return process.env.NODE_ENV === 'production' || 
         process.env.RAILWAY_ENVIRONMENT !== undefined ||
         process.env.RENDER !== undefined;
}

/**
 * Get storage info
 */
async function getStorageInfo() {
  const info = {
    environment: isProduction() ? 'production' : 'development',
    hasVolumes: hasRailwayVolumes(),
    dataDir: STORAGE_DIR,
    authDir: AUTH_DIR,
    persistent: false
  };

  try {
    // Check if data directory exists and has files
    const dataFiles = await fs.readdir(STORAGE_DIR).catch(() => []);
    const authFiles = await fs.readdir(AUTH_DIR).catch(() => []);
    
    info.dataFiles = dataFiles.length;
    info.authFiles = authFiles.length;
    info.persistent = dataFiles.length > 0 || authFiles.length > 0;
  } catch (error) {
    console.error('Error checking storage:', error.message);
  }

  return info;
}

/**
 * Log storage status
 */
async function logStorageStatus() {
  const info = await getStorageInfo();
  
  console.log('\n📦 Storage Status:');
  console.log(`   Environment: ${info.environment}`);
  console.log(`   Volumes: ${info.hasVolumes ? '✅ Enabled' : '⚠️  Not configured'}`);
  console.log(`   Data files: ${info.dataFiles}`);
  console.log(`   Auth files: ${info.authFiles}`);
  console.log(`   Persistent: ${info.persistent ? '✅ Yes' : '⚠️  No (will reset on redeploy)'}`);
  
  if (!info.hasVolumes && isProduction()) {
    console.log('\n⚠️  WARNING: Railway volumes not configured!');
    console.log('   Session and data will be lost on redeploy.');
    console.log('   Setup guide: See RAILWAY-VOLUMES.md\n');
  }
}

module.exports = {
  ensureDirectories,
  getStorageInfo,
  logStorageStatus,
  isProduction,
  hasRailwayVolumes,
  STORAGE_DIR,
  AUTH_DIR
};
