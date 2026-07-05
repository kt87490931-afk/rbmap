const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'stores.json');
const storesConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

function getStoreId() {
  return process.env.STORE_ID || 'ganji';
}

function getStoreDef(storeId) {
  const store = storesConfig.stores.find((s) => s.id === storeId);
  if (!store) throw new Error(`알 수 없는 STORE_ID: ${storeId}`);
  return store;
}

function resolveDataPath(store) {
  const root = path.join(__dirname, '..');
  return path.isAbsolute(store.dataFile) ? store.dataFile : path.join(root, store.dataFile);
}

function readEnvList(envKey, legacyKey) {
  const raw = process.env[envKey] || (legacyKey ? process.env[legacyKey] : '') || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** db.js require 전에 호출 — ATTENDANCE_DATA_PATH 설정 */
function loadStoreRuntime() {
  const storeId = getStoreId();
  const store = getStoreDef(storeId);
  const dataPath = resolveDataPath(store);
  process.env.ATTENDANCE_DATA_PATH = dataPath;
  process.env.STORE_DEFAULT_NAME = store.defaultStoreName;

  let token = process.env[store.botTokenEnv];
  if (!token && storeId === 'ganji') {
    token =
      process.env.ATTENDANCE_BOT_TOKEN || process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  }

  let adminIds = readEnvList(store.adminIdsEnv);
  if (adminIds.length === 0 && storeId === 'ganji') {
    adminIds = readEnvList('ATTENDANCE_ADMIN_IDS', 'ADMIN_IDS');
  }

  let channelId = process.env[store.channelIdEnv] || '';
  if (!channelId && storeId === 'ganji') {
    channelId = process.env.TELEGRAM_CHANNEL_ID || '';
  }

  return { storeId, store, dataPath, token, adminIds, channelId };
}

function listStores() {
  return storesConfig.stores;
}

module.exports = { loadStoreRuntime, getStoreId, getStoreDef, listStores, resolveDataPath };
