const StorageKeys = {
  USERS: 'pv_users',
  SESSION: 'pv_session',
  MODEL: 'pv_model',
  PREDICTIONS: 'pv_predictions'
};

function seedApp() {
  if (!localStorage.getItem(StorageKeys.USERS)) {
    const users = [
      { id: crypto.randomUUID(), fullName: 'System Admin', username: 'admin', email: 'admin@local.test', password: 'admin123', role: 'admin' },
      { id: crypto.randomUUID(), fullName: 'Main Analyst', username: 'analyst', email: 'analyst@local.test', password: 'analyst123', role: 'analyst' },
      { id: crypto.randomUUID(), fullName: 'Standard User', username: 'user', email: 'user@local.test', password: 'user123', role: 'user' }
    ];
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(users));
  }
  if (!localStorage.getItem(StorageKeys.PREDICTIONS)) {
    localStorage.setItem(StorageKeys.PREDICTIONS, JSON.stringify([]));
  }
}
seedApp();

const readJson = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getUsers = () => readJson(StorageKeys.USERS, []);
const saveUsers = users => writeJson(StorageKeys.USERS, users);
const getSession = () => readJson(StorageKeys.SESSION, null);
const saveSession = session => writeJson(StorageKeys.SESSION, session);
const clearSession = () => localStorage.removeItem(StorageKeys.SESSION);
const getModel = () => readJson(StorageKeys.MODEL, null);
const saveModel = model => writeJson(StorageKeys.MODEL, model);
const clearModel = () => localStorage.removeItem(StorageKeys.MODEL);
const getPredictions = () => readJson(StorageKeys.PREDICTIONS, []);
const savePredictions = rows => writeJson(StorageKeys.PREDICTIONS, rows);

function requireAuth() {
  const session = getSession();
  if (!session) {
    location.href = 'index.html';
    return null;
  }
  return session;
}

function attachCommonUi() {
  const session = requireAuth();
  if (!session) return null;
  document.querySelectorAll('.admin-only').forEach(el => {
    if (session.role !== 'admin') el.remove();
  });
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      location.href = 'index.html';
    });
  }
  return session;
}
