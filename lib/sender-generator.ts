/**
 * Generates random email addresses on a configurable domain
 */

const adjectives = [
  "test", "demo", "sample", "load", "stress", "random", "temp", "dev",
  "alpha", "beta", "gamma", "delta", "echo", "foxtrot", "golf", "hotel",
  "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa"
];

const nouns = [
  "user", "sender", "mailer", "client", "agent", "bot", "system", "service",
  "app", "tool", "script", "runner", "worker", "task", "job", "process"
];

const randomWords = [
  "quick", "fast", "slow", "big", "small", "red", "blue", "green", "yellow",
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface SenderOptions {
  pattern?: "random" | "test-prefix" | "word-combo" | "numeric";
}

/**
 * Generates a random email address on the configured domain
 */
export function generateRandomSender(options: SenderOptions = {}): string {
  const domain = process.env.SENDER_DOMAIN || "sauerdev.com";
  const pattern = options.pattern || "random";
  let username: string;

  switch (pattern) {
    case "test-prefix":
      username = `test-${randomString(8)}`;
      break;
    case "word-combo":
      username = `${randomElement(adjectives)}-${randomElement(nouns)}-${randomNumber(100, 999)}`;
      break;
    case "numeric":
      username = `user${randomNumber(1000, 999999)}`;
      break;
    case "random":
    default:
      username = `${randomElement(adjectives)}${randomElement(nouns)}${randomNumber(100, 999)}${randomString(4)}`;
      break;
  }

  return `${username}@${domain}`;
}

/**
 * Generates multiple random sender addresses
 */
export function generateRandomSenders(
  count: number,
  options: SenderOptions = {}
): string[] {
  const senders = new Set<string>();
  
  // Ensure uniqueness
  while (senders.size < count) {
    senders.add(generateRandomSender(options));
  }
  
  return Array.from(senders);
}

