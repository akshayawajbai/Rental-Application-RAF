const base = import.meta.env.VITE_API_BASE_URL || ''

function p(s) {
  return s ? base + s : base
}

export const API = {
  base,
  users: p(import.meta.env.VITE_API_PATH_USERS),
  usersLogin: p(import.meta.env.VITE_API_PATH_USERS_LOGIN),
  usersProfile: p(import.meta.env.VITE_API_PATH_USERS_PROFILE),
  usersProfileImage: p(import.meta.env.VITE_API_PATH_USERS_PROFILE_IMAGE),
  usersUpdateImage: p(import.meta.env.VITE_API_PATH_USERS_UPDATE_IMAGE),
  usersForgotPassword: p(import.meta.env.VITE_API_PATH_USERS_FORGOT_PASSWORD),
  usersResetPassword: p(import.meta.env.VITE_API_PATH_USERS_RESET_PASSWORD),
  usersGetUserRole: p(import.meta.env.VITE_API_PATH_USERS_GET_USER_ROLE),
  rentalGetAllYears: p(import.meta.env.VITE_API_PATH_RENTAL_GET_ALL_YEARS),
  rentalGetMonthsByYear: p(import.meta.env.VITE_API_PATH_RENTAL_GET_MONTHS_BY_YEAR),
  rentalGetMonthlySummary: p(import.meta.env.VITE_API_PATH_RENTAL_GET_MONTHLY_SUMMARY),
  rentalCreateMonthlyRent: p(import.meta.env.VITE_API_PATH_RENTAL_CREATE_MONTHLY_RENT),
  rentalSetOwnerPaidDate: p(import.meta.env.VITE_API_PATH_RENTAL_SET_OWNER_PAID_DATE),
  rentalGetMonthlyRent: p(import.meta.env.VITE_API_PATH_RENTAL_GET_MONTHLY_RENT),
  rentalUpdateUserPayment: p(import.meta.env.VITE_API_PATH_RENTAL_UPDATE_USER_PAYMENT),
  rentalGetActiveMonthlyRent: p(import.meta.env.VITE_API_PATH_RENTAL_GET_ACTIVE_MONTHLY_RENT),
  purchaseGetByMonth: p(import.meta.env.VITE_API_PATH_PURCHASE_GET_BY_MONTH),
  purchaseAdd: p(import.meta.env.VITE_API_PATH_PURCHASE_ADD),
  purchaseUpdate: p(import.meta.env.VITE_API_PATH_PURCHASE_UPDATE),
  currentbillGet: p(import.meta.env.VITE_API_PATH_CURRENTBILL_GET),
  currentbillAdd: p(import.meta.env.VITE_API_PATH_CURRENTBILL_ADD),
  currentbillUpdate: p(import.meta.env.VITE_API_PATH_CURRENTBILL_UPDATE),
}
