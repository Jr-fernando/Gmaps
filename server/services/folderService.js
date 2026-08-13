import { dbService } from './dbService.js';

const SETTINGS_KEY = 'lead_folders';
const MAX_FOLDERS = 50;
const MAX_LEADS_PER_FOLDER = 5000;

const cleanFolders = (value) => {
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value || '[]'); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.slice(0, MAX_FOLDERS).map((folder) => ({
    id: String(folder.id || ''),
    name: String(folder.name || '').trim().slice(0, 60),
    leadIds: [...new Set((folder.leadIds || []).map(String).filter(Boolean))].slice(0, MAX_LEADS_PER_FOLDER),
    createdAt: folder.createdAt || new Date().toISOString(),
    updatedAt: folder.updatedAt || folder.createdAt || new Date().toISOString(),
  })).filter((folder) => folder.id && folder.name);
};

const readFolders = async () => cleanFolders(await dbService.settings.getSettingByKey(SETTINGS_KEY));
const saveFolders = async (folders) => {
  await dbService.settings.saveSettings({ [SETTINGS_KEY]: JSON.stringify(cleanFolders(folders)) });
  return cleanFolders(folders);
};

export const folderService = {
  list: readFolders,

  create: async (name) => {
    const cleanName = String(name || '').trim().slice(0, 60);
    if (!cleanName) throw new Error('Informe um nome para a pasta.');
    const folders = await readFolders();
    const duplicate = folders.find((folder) => folder.name.toLocaleLowerCase('pt-BR') === cleanName.toLocaleLowerCase('pt-BR'));
    if (duplicate) return duplicate;
    if (folders.length >= MAX_FOLDERS) throw new Error(`O limite é de ${MAX_FOLDERS} pastas.`);
    const now = new Date().toISOString();
    const folder = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: cleanName, leadIds: [], createdAt: now, updatedAt: now };
    await saveFolders([folder, ...folders]);
    return folder;
  },

  rename: async (id, name) => {
    const cleanName = String(name || '').trim().slice(0, 60);
    if (!cleanName) throw new Error('Informe um nome para a pasta.');
    const folders = await readFolders();
    const folder = folders.find((item) => item.id === String(id));
    if (!folder) throw new Error('Pasta não encontrada.');
    folder.name = cleanName;
    folder.updatedAt = new Date().toISOString();
    await saveFolders(folders);
    return folder;
  },

  remove: async (id) => {
    const folders = await readFolders();
    const next = folders.filter((folder) => folder.id !== String(id));
    if (next.length === folders.length) throw new Error('Pasta não encontrada.');
    await saveFolders(next);
  },

  addLeads: async (id, leadIds) => {
    const folders = await readFolders();
    const folder = folders.find((item) => item.id === String(id));
    if (!folder) throw new Error('Pasta não encontrada.');
    const validLeads = await dbService.leads.getLeadsByIds((leadIds || []).map(String).slice(0, 100));
    folder.leadIds = [...new Set([...folder.leadIds, ...validLeads.map((lead) => String(lead.id))])].slice(0, MAX_LEADS_PER_FOLDER);
    folder.updatedAt = new Date().toISOString();
    await saveFolders(folders);
    return folder;
  },

  removeLeads: async (id, leadIds) => {
    const folders = await readFolders();
    const folder = folders.find((item) => item.id === String(id));
    if (!folder) throw new Error('Pasta não encontrada.');
    const removeIds = new Set((leadIds || []).map(String));
    folder.leadIds = folder.leadIds.filter((leadId) => !removeIds.has(String(leadId)));
    folder.updatedAt = new Date().toISOString();
    await saveFolders(folders);
    return folder;
  },
};
