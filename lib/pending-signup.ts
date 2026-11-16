// The password a professional chose in the signup window. It is kept only for this
// browser tab (sessionStorage, gone when the tab closes) so that refreshing the
// registration form changes nothing. It is removed as soon as the account is created.

const KEY = "professionalSignupPassword"

let pendingPassword = ""

export function setPendingPassword(password: string) {
  pendingPassword = password
  try {
    sessionStorage.setItem(KEY, password)
  } catch {}
}

export function getPendingPassword() {
  if (pendingPassword) return pendingPassword
  try {
    pendingPassword = sessionStorage.getItem(KEY) ?? ""
  } catch {}
  return pendingPassword
}

export function clearPendingPassword() {
  pendingPassword = ""
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
}
