/**
 * Arc File Linker
 * Maps Arc nodes to their corresponding source files
 */

/**
 * Get the file path for a given Arc node
 * @param {string} nodeType - 'route', 'lambda', or 'table'
 * @param {string} nodeName - Name or path of the node
 * @returns {string} Path to the source file
 */
export function getLinkPath(nodeType, nodeName) {
  switch (nodeType) {
    case 'route':
      // Routes map to src/http/{functionName}
      // Format: "GET /api/users" -> "src/http/get-api-users"
      return routeToPath(nodeName);
    
    case 'lambda':
      // Lambdas map to src/lambdas/{name}
      return `src/lambdas/${nodeName}`;
    
    case 'table':
      // Tables map to src/tables/{name}.ts
      return `src/tables/${nodeName}.ts`;
    
    default:
      return null;
  }
}

/**
 * Convert route definition to file path
 * Format: "GET /api/users" -> "src/http/get-api-users/index.mjs"
 */
function routeToPath(routeDefinition) {
  // routeDefinition format: "GET /path" or just "/path"
  const parts = routeDefinition.trim().split(/\s+/);
  let method = 'get';
  let path = routeDefinition;

  if (parts.length === 2) {
    method = parts[0].toLowerCase();
    path = parts[1];
  }

  // Convert path to folder name: /api/users -> api-users
  const pathSegments = path
    .split('/')
    .filter(Boolean)
    .join('-')
    .toLowerCase();

  return `src/http/${method}-${pathSegments}/index.mjs`;
}

/**
 * Get a clickable link element for a node
 */
export function createLinkElement(nodeType, nodeName, onLinkClick) {
  const linkPath = getLinkPath(nodeType, nodeName);
  const a = document.createElement('a');
  a.href = '#';
  a.className = 'arc-link';
  a.textContent = `📁 ${linkPath}`;
  a.title = `Open: ${linkPath}`;

  a.addEventListener('click', (e) => {
    e.preventDefault();
    if (onLinkClick) {
      onLinkClick(linkPath);
    } else {
      // Default: log or show in UI
      console.log('Linked file:', linkPath);
    }
  });

  return a;
}

/**
 * Check if a file exists (client-side check via fetch)
 */
export async function checkFileExists(filePath) {
  try {
    const response = await fetch(`/api/file-exists?path=${encodeURIComponent(filePath)}`);
    return response.ok;
  } catch (err) {
    console.error('Error checking file:', err);
    return false;
  }
}

/**
 * Create an Arc file linker instance
 */
export class ArcFileLinker {
  constructor(options = {}) {
    this.onLinkClick = options.onLinkClick || this.defaultLinkHandler;
    this.cache = new Map();
  }

  /**
   * Default link handler
   */
  defaultLinkHandler(filePath) {
    console.log('Opening file:', filePath);
    // Can be overridden by user
  }

  /**
   * Get link for a node
   */
  getLink(nodeType, nodeName) {
    const key = `${nodeType}:${nodeName}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const link = getLinkPath(nodeType, nodeName);
    this.cache.set(key, link);
    return link;
  }

  /**
   * Create a link element
   */
  createLink(nodeType, nodeName) {
    return createLinkElement(nodeType, nodeName, this.onLinkClick);
  }

  /**
   * Navigate to a file (browser-specific)
   */
  navigateToFile(filePath) {
    this.onLinkClick(filePath);
  }
}

export default ArcFileLinker;
