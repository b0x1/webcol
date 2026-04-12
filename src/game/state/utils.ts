export const random = (): number => Math.random();

export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
