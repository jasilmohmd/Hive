const ErrorMessage = Object.freeze({
  REQUIRED_CREDENTIALS_NOT_GIVEN: "Provide all required details.",
  INTERNAL_SERVER_ERROR: "Internal Server Error.",
  EMAIL_NOT_VALID: "Not a valid email.",
  PASSWORD_MISMATCH: "Password and confirm password are different.",
  USERNAME_ALREADY_TAKEN: "Username already taken.",
  EMAIL_ALREADY_TAKEN: "Email already taken.",
  USER_NOT_FOUND: "No user with that email.",
  PASSWORD_INCORRECT: "Password incorrect.",
  PASSWORD_MIN_LENGTH_NOT_MET: "Should contain at least 8 characters.",
  NOT_AUTHENTICATED: "Not authenticated.",
  TOKEN_EXPIRED: "Token expired.",
  OTP_NOT_SENT: "Error sending OTP.",
  OTP_EXPIRED: "OTP has expired. Please request a new one.",
  OTP_INCORRECT: "OTP is incorrect. Please check and try again.",
  OTP_NOT_VERIFIED: "OTP verification failed. Please enter a valid OTP.",
  INVALID_OTP: "Invalid OTP. Please try again.",
  USER_ALREADY_VERIFIED: "User is already verified.",
  UNAUTHORIZED_ACCESS: "Unauthorized access. Please login again.",
  EMAIL_VERIFICATION_FAILED: "Email verification failed. Please try again.",
  OTP_VERIFICATION_FAILED: "OTP verification failed. Please check the OTP and try again.",
  UNKNOWN_ERROR: "An unknown error occurred.",
  INVALID_USER_ID: "Invalid user ID format",

  FRIEND_REQUEST_PENDING: "Friend request already sent.",
  ALREADY_FRIENDS: "You are already friends.",
  CANNOT_FRIEND_SELF: "You cannot send a friend request to yourself"
});

export default ErrorMessage;
