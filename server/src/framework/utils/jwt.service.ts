import jwt, { SignOptions } from "jsonwebtoken"
import IJWTService, { IPayload } from "../../interfaces/utils/IJwt.service";

/** Pin HS256 on both sign and verify so a token can't be forged with `alg: none`. */
const JWT_ALGORITHM = "HS256" as const;

export default class JWTService implements IJWTService {
  sign(payload: IPayload , expiresIn: string | number): string | never {
    try {

      // Ensure compatibility with SignOptions
      const options: SignOptions = {
        expiresIn: expiresIn as SignOptions["expiresIn"], // token expiresIn
        algorithm: JWT_ALGORITHM,
      };

      const token: string = jwt.sign(payload, process.env.JWT_SECRET_KEY!, options);
      return token;
    } catch (error: any) {
      throw error;
    }
  }

  verifyToken(token: string): (IPayload  | never) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!, { algorithms: [JWT_ALGORITHM] });
      return decoded as IPayload;
    } catch (err: any) {
      throw err;
    }
  }
}