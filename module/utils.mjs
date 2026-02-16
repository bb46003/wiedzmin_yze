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
