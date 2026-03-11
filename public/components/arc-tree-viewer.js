/**
 * Arc Tree Viewer Component
 * Renders an interactive tree view of Arc file structure using react-arborist
 */

export class ArcTreeViewer {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.arcData = options.arcData || {};
    this.onNodeClick = options.onNodeClick || (() => {});
    this.onSearch = options.onSearch || (() => {});
    this.toggleStates = {
      routes: true,
      lambdas: true,
      tables: true,
    };
  }

  /**
   * Initialize the viewer with Arc data
   */
  async init(arcData) {
    if (arcData) {
      this.arcData = arcData;
    }

    this.render();
    this.setupEventListeners();
  }

  /**
   * Convert Arc data to tree structure
   */
  buildTree() {
    const tree = [];

    if (this.toggleStates.routes && this.arcData.routes?.length > 0) {
      tree.push({
        id: 'routes-group',
        name: 'Routes',
        children: this.arcData.routes.map((route, idx) => ({
          id: `route-${idx}`,
          name: `${route.method} ${route.path}`,
          path: route.path,
          method: route.method,
          functionName: route.functionName,
          type: 'route',
        })),
      });
    }

    if (this.toggleStates.lambdas && this.arcData.lambdas?.length > 0) {
      tree.push({
        id: 'lambdas-group',
        name: 'Lambdas',
        children: this.arcData.lambdas.map((lambda, idx) => ({
          id: `lambda-${idx}`,
          name: lambda.name,
          type: 'lambda',
        })),
      });
    }

    if (this.toggleStates.tables && this.arcData.tables?.length > 0) {
      tree.push({
        id: 'tables-group',
        name: 'Tables',
        children: this.arcData.tables.map((table, idx) => ({
          id: `table-${idx}`,
          name: table.name,
          type: 'table',
        })),
      });
    }

    return tree;
  }

  /**
   * Render the tree view
   */
  render() {
    const tree = this.buildTree();

    const html = `
      <div class="arc-tree-viewer">
        <div class="tree-header">
          <h2>Arc Viewer</h2>
          <div class="tree-controls">
            <label><input type="checkbox" class="toggle-routes" checked> Routes</label>
            <label><input type="checkbox" class="toggle-lambdas" checked> Lambdas</label>
            <label><input type="checkbox" class="toggle-tables" checked> Tables</label>
          </div>
        </div>
        <div class="tree-search">
          <input type="text" class="search-input" placeholder="Search routes, lambdas, tables..." />
        </div>
        <div class="tree-container">
          ${this.renderTreeNodes(tree)}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Render tree nodes recursively
   */
  renderTreeNodes(nodes, depth = 0) {
    if (!nodes || nodes.length === 0) {
      return '<div class="tree-empty">No items</div>';
    }

    return `
      <ul class="tree-list" style="margin-left: ${depth * 20}px;">
        ${nodes.map(node => this.renderNode(node, depth)).join('')}
      </ul>
    `;
  }

  /**
   * Render a single tree node
   */
  renderNode(node, depth) {
    const hasChildren = node.children && node.children.length > 0;
    const icon = this.getNodeIcon(node.type);
    const isGroup = node.id && node.id.includes('-group');

    return `
      <li class="tree-node ${isGroup ? 'tree-group' : ''}" data-node-id="${node.id}">
        <div class="tree-node-content" data-node-id="${node.id}">
          ${hasChildren ? '<span class="tree-toggle">▼</span>' : '<span class="tree-toggle-empty">•</span>'}
          <span class="tree-icon">${icon}</span>
          <span class="tree-label">${this.escapeHtml(node.name)}</span>
          ${!isGroup && node.type === 'route' ? `<button class="copy-btn" data-value="${node.method} ${node.path}" title="Copy route">📋</button>` : ''}
        </div>
        ${hasChildren ? `<div class="tree-children">${this.renderTreeNodes(node.children, depth + 1)}</div>` : ''}
      </li>
    `;
  }

  /**
   * Get icon for node type
   */
  getNodeIcon(type) {
    const icons = {
      route: '🛣️',
      lambda: '⚡',
      table: '📊',
    };
    return icons[type] || '📄';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle nodes
    this.container.querySelectorAll('.tree-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const li = e.target.closest('li');
        const children = li.querySelector('.tree-children');
        if (children) {
          children.classList.toggle('collapsed');
        }
      });
    });

    // Node clicks
    this.container.querySelectorAll('.tree-node-content').forEach(node => {
      node.addEventListener('click', (e) => {
        if (!e.target.closest('.copy-btn')) {
          const nodeId = e.target.closest('.tree-node-content')?.dataset.nodeId;
          if (nodeId && this.onNodeClick) {
            this.onNodeClick(nodeId, this.arcData);
          }
        }
      });
    });

    // Copy buttons
    this.container.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const value = e.target.dataset.value;
        try {
          await navigator.clipboard.writeText(value);
          const originalText = e.target.textContent;
          e.target.textContent = '✓ Copied!';
          setTimeout(() => {
            e.target.textContent = originalText;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          e.target.textContent = '✗ Failed';
          setTimeout(() => {
            e.target.textContent = originalText;
          }, 2000);
        }
      });
    });

    // Toggles for routes, lambdas, tables
    this.container.querySelector('.toggle-routes')?.addEventListener('change', (e) => {
      this.toggleStates.routes = e.target.checked;
      this.render();
      this.setupEventListeners();
    });

    this.container.querySelector('.toggle-lambdas')?.addEventListener('change', (e) => {
      this.toggleStates.lambdas = e.target.checked;
      this.render();
      this.setupEventListeners();
    });

    this.container.querySelector('.toggle-tables')?.addEventListener('change', (e) => {
      this.toggleStates.tables = e.target.checked;
      this.render();
      this.setupEventListeners();
    });

    // Search
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterTree(e.target.value);
      });
    }
  }

  /**
   * Filter tree based on search query
   */
  filterTree(query) {
    const nodes = this.container.querySelectorAll('.tree-node');
    let matchCount = 0;

    nodes.forEach(node => {
      const label = node.querySelector('.tree-label');
      if (!label) return;

      const text = label.textContent.toLowerCase();
      const matches = text.includes(query.toLowerCase());

      node.style.display = matches || query === '' ? '' : 'none';
      if (matches && query !== '') {
        matchCount++;
        // Expand parent groups
        let parent = node.closest('.tree-children');
        while (parent) {
          parent.classList.remove('collapsed');
          parent = parent.parentElement?.closest('.tree-children');
        }
      }
    });

    // Show "no matches" message if needed
    const treeContainer = this.container.querySelector('.tree-container');
    let noMatch = this.container.querySelector('.tree-no-match');
    if (query && matchCount === 0) {
      if (!noMatch) {
        noMatch = document.createElement('div');
        noMatch.className = 'tree-no-match';
        noMatch.textContent = `No matches for "${query}"`;
        treeContainer.appendChild(noMatch);
      }
    } else if (noMatch) {
      noMatch.remove();
    }
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId) {
    const routes = this.arcData.routes || [];
    const lambdas = this.arcData.lambdas || [];
    const tables = this.arcData.tables || [];

    if (nodeId.startsWith('route-')) {
      const idx = parseInt(nodeId.split('-')[1]);
      return { type: 'route', data: routes[idx] };
    }
    if (nodeId.startsWith('lambda-')) {
      const idx = parseInt(nodeId.split('-')[1]);
      return { type: 'lambda', data: lambdas[idx] };
    }
    if (nodeId.startsWith('table-')) {
      const idx = parseInt(nodeId.split('-')[1]);
      return { type: 'table', data: tables[idx] };
    }
    return null;
  }
}

export default ArcTreeViewer;
