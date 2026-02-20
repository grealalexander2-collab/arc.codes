/**
 * Arc Copy Module
 * Copy-to-clipboard functionality for Arc routes and ARNs
 */

export class ArcCopy {
  constructor(options = {}) {
    this.toastDuration = options.toastDuration || 2000;
    this.toastContainer = options.toastContainer || null;
  }

  /**
   * Copy text to clipboard
   */
  async copy(text) {
    try {
      // Try native Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.showToast(`Copied: ${text}`, 'success');
        return true;
      } else {
        // Fallback for non-secure contexts
        return this.copyUsingExecCommand(text);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      this.showToast('Failed to copy', 'error');
      return false;
    }
  }

  /**
   * Fallback: copy using execCommand
   */
  copyUsingExecCommand(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showToast(`Copied: ${text}`, 'success');
      } else {
        this.showToast('Failed to copy', 'error');
      }
      return successful;
    } catch (error) {
      console.error('Copy fallback failed:', error);
      this.showToast('Failed to copy', 'error');
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Copy route ARN
   */
  async copyArn(method, path, region = 'us-east-1') {
    // Format: arn:aws:lambda:region:account-id:function:functionName
    // For Arc, we simplify to: arn:arc:route:{method}:{path}
    const arn = `arn:arc:route:${method}:${path}`;
    return this.copy(arn);
  }

  /**
   * Copy route definition
   */
  async copyRoute(method, path) {
    const route = `${method} ${path}`;
    return this.copy(route);
  }

  /**
   * Copy function name/path
   */
  async copyFunctionName(functionName) {
    return this.copy(functionName);
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `arc-toast arc-toast-${type}`;
    toast.textContent = message;
    
    const container = this.toastContainer || document.body;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('arc-toast-show');
    }, 10);

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('arc-toast-show');
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, this.toastDuration);
  }

  /**
   * Create a copy button for a route
   */
  createCopyButton(method, path, options = {}) {
    const button = document.createElement('button');
    button.className = 'arc-copy-btn';
    button.title = `Copy: ${method} ${path}`;
    button.textContent = options.label || '📋';
    
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const originalText = button.textContent;
      button.textContent = '✓';
      button.disabled = true;
      
      await this.copyRoute(method, path);
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, this.toastDuration);
    });

    return button;
  }

  /**
   * Create a copy button for ARN
   */
  createArnButton(method, path, options = {}) {
    const button = document.createElement('button');
    button.className = 'arc-copy-arn-btn';
    button.title = `Copy ARN: ${method}:${path}`;
    button.textContent = options.label || '🔗';
    
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const originalText = button.textContent;
      button.textContent = '✓';
      button.disabled = true;
      
      await this.copyArn(method, path);
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, this.toastDuration);
    });

    return button;
  }
}

/**
 * Standalone copy function
 */
export async function copyToClipboard(text) {
  const copier = new ArcCopy();
  return copier.copy(text);
}

/**
 * Copy route helper
 */
export async function copyRoute(method, path) {
  const copier = new ArcCopy();
  return copier.copyRoute(method, path);
}

/**
 * Copy ARN helper
 */
export async function copyArn(method, path) {
  const copier = new ArcCopy();
  return copier.copyArn(method, path);
}

export default ArcCopy;
