/**
 * Executes an asynchronous function with retries and exponential backoff.
 * 
 * @param fn The asynchronous function to execute
 * @param maxAttempts Maximum attempts (default 3)
 * @param delayMs Initial delay in milliseconds (default 1000)
 * @returns The resolved value of the promise
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let attempt = 1;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      console.warn(`⚠️ WhatsApp API Call Attempt ${attempt} failed. Retrying in ${delayMs}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempt++;
      delayMs *= 2; // Exponential backoff
    }
  }
}
