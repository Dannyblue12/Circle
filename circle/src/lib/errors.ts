/** An error with an HTTP status, turned into a JSON response by `handle()` in api.ts. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
