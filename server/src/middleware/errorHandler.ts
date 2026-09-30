import { NextFunction, Request, RequestHandler, Response } from 'express';

/** An error that is safe to show to the client, with an HTTP status. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wraps an async route so rejected promises reach the error handler. */
export const asyncHandler =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (err?.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    return res.status(400).json({ message: messages.join(', ') || 'Invalid data' });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Resource already exists' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};
