export function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }
  
  export function formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }
  
  export function formatDateTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
  
  export function formatPercentage(value: number, total: number): string {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }