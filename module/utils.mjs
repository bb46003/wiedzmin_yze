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
/**
 * Recursively transforms an ES module to a regular, writable object.
 *
 * @template T
 * @param {T} module - The ES module to transform.
 * @returns {T} The transformed module.
 */
export function moduleToObject(module) {
  const result = {};
  for (const key in module) {
    if (Object.prototype.toString.call(module[key]) === "[object Module]") {
      result[key] = moduleToObject(module[key]);
    } else {
      result[key] = module[key];
    }
  }
  return result;
}

/**
 * Converts a string to be ID-safe.
 *
 * @template {string} T
 * @param {T} id - The string to convert
 * @returns {IdSafe<T>} - The converted string
 */
export function staticID(id) {
  if (id.length >= 16) return id.substring(0, 16);
  return id.padEnd(16, "0");
}

export function addHtmlEventListener(
  html,
  eventNames,
  selector,
  eventHandler,
  ...extraArgs
) {
  const container = html.jquery ? html[0] : html;

  for (const eventName of eventNames.split(" ")) {
    const wrappedHandler = (e) => {
      if (!e.target) return;

      const target = e.target.closest(selector);
      if (target) {
        eventHandler.call(target, e, ...extraArgs);
      }
    };

    container.addEventListener(eventName, wrappedHandler);
  }
}
export function toLabelObject(
  obj,
  { localize = true, labelAttribute = "label", sort = false } = {},
) {
  let entries;
  if (
    Array.isArray(obj) &&
    obj.every((entry) => Array.isArray(entry) && entry.length === 2)
  )
    entries = obj;
  else if (foundry.utils.getType(obj) === "Object")
    entries = Object.entries(obj);

  const result = entries.map(([key, value]) => {
    if (foundry.utils.getType(value) === "string") {
      return [key, localize ? game.i18n.localize(value) : value];
    }
    if (foundry.utils.getType(value) === "Object") {
      return [
        key,
        localize
          ? game.i18n.localize(value[labelAttribute])
          : value[labelAttribute],
      ];
    }
    return [];
  });

  if (sort) result.sort((a, b) => a[1].localeCompare(b[1]));
  return Object.fromEntries(result);
}
export async function _onEditText(_event, target) {
  const { fieldPath, propertyPath } = target.dataset;
  // If there is a document (e.g. an item) to be found in a parent element, assume the field is relative to that
  const doc = (await this.getDocument?.(target)) ?? this.document;
  // Get field from schema
  const field = doc.system.schema.getField(
    fieldPath.replace(/^system\./, "") ?? propertyPath.replace(/^system\./, ""),
  );
  const editor = new TextEditorApplication({ document: doc, field });
  editor.render({ force: true });
}
