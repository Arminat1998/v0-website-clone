// The password a professional chose in the signup window. It is kept in memory only
// (never in storage) until the registration form creates the account. After a page
// reload it is gone and the form asks for it again.

let pendingPassword = ""

export function setPendingPassword(password: string) {
  pendingPassword = password
}

export function getPendingPassword() {
  return pendingPassword
}

export function clearPendingPassword() {
  pendingPassword = ""
}
