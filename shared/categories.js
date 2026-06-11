// Category names are stored in English in the backend database.
// This maps a raw category name to its translation key so the UI can
// display it in the active language. Components should fall back to the
// raw name for categories that have no translation entry:
//   t(categoryKey(name), { defaultValue: name })
export const categoryKey = (name) =>
  'categories.' +
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
