/**
 * Arc Search Module
 * Fuzzy search for routes, lambdas, and tables in Arc Viewer
 */

// Import Fuse.js for fuzzy search
// Note: This assumes Fuse is available globally via <script> tag or module import

export class ArcSearch {
  constructor(options = {}) {
    this.options = {
      threshold: 0.3, // 0 = exact, 1 = very fuzzy
      keys: ['name', 'path', 'method'],
      ignoreLocation: true,
      minMatchCharLength: 1,
      ...options,
    };
    this.fuse = null;
    this.lastResults = null;
  }

  /**
   * Initialize search with Arc data
   */
  init(arcData) {
    // Flatten Arc data into searchable items
    const items = [];

    if (arcData.routes) {
      items.push(...arcData.routes.map(route => ({
        type: 'route',
        name: `${route.method} ${route.path}`,
        path: route.path,
        method: route.method,
        functionName: route.functionName,
        searchText: `${route.method} ${route.path} ${route.functionName}`,
      })));
    }

    if (arcData.lambdas) {
      items.push(...arcData.lambdas.map(lambda => ({
        type: 'lambda',
        name: lambda.name,
        searchText: lambda.name,
      })));
    }

    if (arcData.tables) {
      items.push(...arcData.tables.map(table => ({
        type: 'table',
        name: table.name,
        searchText: table.name,
      })));
    }

    // Create Fuse instance
    try {
      // Try to use Fuse if available globally
      if (typeof Fuse !== 'undefined') {
        this.fuse = new Fuse(items, {
          threshold: this.options.threshold,
          keys: ['searchText'],
          ignoreLocation: this.options.ignoreLocation,
          minMatchCharLength: this.options.minMatchCharLength,
        });
      } else {
        // Fallback: simple substring search
        this.items = items;
        console.warn('Arc Search: Fuse.js not available, using simple search');
      }
    } catch (error) {
      console.error('Arc Search: Failed to initialize Fuse:', error);
      this.items = items;
    }
  }

  /**
   * Search for items
   */
  search(query) {
    if (!query || query.trim() === '') {
      this.lastResults = null;
      return [];
    }

    if (this.fuse) {
      const results = this.fuse.search(query);
      this.lastResults = results.map(r => r.item);
      return this.lastResults;
    } else {
      // Simple substring search fallback
      const lowerQuery = query.toLowerCase();
      const results = this.items.filter(item =>
        item.searchText.toLowerCase().includes(lowerQuery)
      );
      this.lastResults = results;
      return results;
    }
  }

  /**
   * Get results grouped by type
   */
  getGroupedResults(query) {
    const results = this.search(query);
    const grouped = {
      routes: [],
      lambdas: [],
      tables: [],
    };

    results.forEach(item => {
      if (item.type === 'route') {
        grouped.routes.push(item);
      } else if (item.type === 'lambda') {
        grouped.lambdas.push(item);
      } else if (item.type === 'table') {
        grouped.tables.push(item);
      }
    });

    return grouped;
  }

  /**
   * Get last search results
   */
  getLastResults() {
    return this.lastResults || [];
  }
}

/**
 * Standalone search function
 */
export function search(arcData, query, options = {}) {
  const searcher = new ArcSearch(options);
  searcher.init(arcData);
  return searcher.search(query);
}

/**
 * Simple substring search (no Fuse dependency)
 */
export function simpleSearch(arcData, query) {
  if (!query || query.trim() === '') {
    return { routes: [], lambdas: [], tables: [] };
  }

  const lowerQuery = query.toLowerCase();
  const results = {
    routes: [],
    lambdas: [],
    tables: [],
  };

  if (arcData.routes) {
    results.routes = arcData.routes.filter(route => {
      const searchText = `${route.method} ${route.path} ${route.functionName}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }

  if (arcData.lambdas) {
    results.lambdas = arcData.lambdas.filter(lambda =>
      lambda.name.toLowerCase().includes(lowerQuery)
    );
  }

  if (arcData.tables) {
    results.tables = arcData.tables.filter(table =>
      table.name.toLowerCase().includes(lowerQuery)
    );
  }

  return results;
}

export default ArcSearch;
