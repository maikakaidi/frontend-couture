import { Storage } from '@capacitor/storage';

// Sauvegarder des données
export async function saveData(key, data) {
  await Storage.set({
    key,
    value: JSON.stringify(data),
  });
}

// Lire des données
export async function loadData(key) {
  const { value } = await Storage.get({ key });
  return value ? JSON.parse(value) : null;
}
