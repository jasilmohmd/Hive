export default class RequiredCredentialsNotGiven extends Error {
  errMessage: string;
  errorCode: string;
  
  constructor(errMessage: string, errorCode: string) {
      super(errMessage);
      this.errMessage = errMessage;
      this.errorCode = errorCode;
  }
}