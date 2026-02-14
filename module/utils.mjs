export function registerSystemSheet(
  documentClass,
  sheetClass,
  types,
  options = {},
) {
  types = Array.isArray(types) ? types : [types];
  options.makeDefault ??= true;
  return foundry.applications.apps.DocumentSheetConfig.registerSheet(
    documentClass,
    "wiedzmin_yze",
    sheetClass,
    {
      types,
      ...options,
    },
  );
}
