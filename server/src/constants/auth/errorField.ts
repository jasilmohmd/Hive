export const ErrorField = Object.freeze({
  USER: "user",
  EMAIL: "email",
  FRIEND_REQUEST: "FRIEND_REQUEST",
  PASSWORD_AND_CONFIRM_PASSWORD: "confirmPassword",
  PASSWORD: "password",
  USERNAME: "userName",
  HABITNAME: "habitName",
  DATESCOMPLETED: "datesCompleted",
  OTP: "otp",
  EMAIL_VERIFICATION: "emailVerification",  // For email verification related errors
  TOKEN: "token",                           // For token related errors
  OTP_EXPIRED: "otpExpired",                // For OTP expiration
  INVALID_OTP: "invalidOtp",                // For invalid OTP
  USER_ALREADY_VERIFIED: "userAlreadyVerified", // When the user is already verified
  UNAUTHORIZED: "unauthorizedAccess"       // For unauthorized access errors
});
