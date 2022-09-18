export class BadTimingException extends Error {
  constructor(message?: string) {
    super(`时机错误:${message}`);
  }
}

export class PermissionsException extends Error {
  constructor(message?: string) {
    super(`权限错误:${message}`);
  }
}
