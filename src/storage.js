const writeToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const readFromStorage = (key) => JSON.parse(localStorage.getItem(key)) || null;

export { readFromStorage, writeToStorage };
