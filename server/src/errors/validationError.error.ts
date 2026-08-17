import { IValidationErrorDetails } from "../interfaces/errors/IValidationError.interface";


export default class ValidationError extends Error {
    public details: IValidationErrorDetails;
    constructor(details: IValidationErrorDetails) {
        super(details.message);
        this.details = details;
    }
}