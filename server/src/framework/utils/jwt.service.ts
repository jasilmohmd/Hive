import jwt, { SignOptions } from "jsonwebtoken"
import IJWTService, { IPayload } from "../../interfaces/utils/IJwt.service";


export default class JWTService implements IJWTService {
  sign(payload: IPayload , expiresIn: string | number): string | never {
    try {

      // Ensure compatibility with SignOptions
      const options: SignOptions = {
        expiresIn: expiresIn as SignOptions["expiresIn"], // Type assertion to match SignOptions
      };

      const token: string = jwt.sign(payload, process.env.JWT_SECRET_KEY!, options); // token expiresIn
      return token;
    } catch (error: any) {
      throw error;
    }
  }

  verifyToken(token: string): (IPayload  | never) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
      return decoded as IPayload;
    } catch (err: any) {
      throw err;
    }
  }
}