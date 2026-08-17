// src/utils/CustomErrors.ts

export interface ICustomError {
  statusCode: number;
  message: string;
  errorField: string;
}

export class CustomError extends Error implements ICustomError {
  public statusCode: number;
  public errorField: string;

  constructor({ statusCode, message, errorField }: ICustomError) {
    super(message);
    this.statusCode = statusCode;
    this.errorField = errorField;
    this.name = 'CustomError';
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string, errorField = 'resource') {
    super({ statusCode: 404, message, errorField });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, errorField = 'validation') {
    super({ statusCode: 400, message, errorField });
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string, errorField = 'authorization') {
    super({ statusCode: 401, message, errorField });
    this.name = 'UnauthorizedError';
  }
}
