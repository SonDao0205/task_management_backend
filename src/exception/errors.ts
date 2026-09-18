export class BadRequest extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "BadRequest";

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFound extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "NotFound";

    Error.captureStackTrace(this, this.constructor);
  }
}

export class Authenticate extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "Authenticate";

    Error.captureStackTrace(this, this.constructor);
  }
}

export class Authorization extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "Authorization";

    Error.captureStackTrace(this, this.constructor);
  }
}
