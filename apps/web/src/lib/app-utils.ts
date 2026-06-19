/**
 * Format a number as currency
 */
/**
 * @description formatCurrency — core logic for ${NAME}
 * @returns Result of formatCurrency computation
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate an address for display
 */
/**
 * @description truncateAddress — core logic for ${NAME}
 * @returns Result of truncateAddress computation
 */
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Check if a string is a valid Ethereum address
 */
/**
 * @description isValidAddress — core logic for ${NAME}
 * @returns Result of isValidAddress computation
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Sleep for a given number of milliseconds
 */
/**
 * @description sleep — core logic for ${NAME}
 * @returns Result of sleep computation
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
