import { IJWTTokenErrorDetails } from "../interfaces/errors/IJWTTokenError.interface";



export default class JWTTokenError extends Error {
    public details: IJWTTokenErrorDetails;
    constructor(details: IJWTTokenErrorDetails) {
        super(details.message);
        this.details = details;
    }
}