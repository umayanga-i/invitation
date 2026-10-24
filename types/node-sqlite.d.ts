declare module 'node:sqlite' {
  interface StatementSync {
    run(...values: (string | number | bigint | null)[]): { changes: number };
    get(...values: (string | number | bigint | null)[]): Record<string, unknown> | undefined;
    all(...values: (string | number | bigint | null)[]): Record<string, unknown>[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
