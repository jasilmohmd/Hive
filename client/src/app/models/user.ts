export interface IRegisterationCredentials {
  userName: string | undefined;
  email: string | undefined;
  password: string | undefined;
  confirmPassword: string | undefined;
}

export interface ILoginCredentials {
  email: string | undefined;
  password: string | undefined;
}

export interface IUser {
  _id?: string;
  imageUrl?: string | undefined;
  userName: string;
  email: string | undefined;
  // password: string | undefined;
}