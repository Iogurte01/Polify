declare global {
  interface Window {
    google: any;
  }
}

let initialized = false;

type LoginResult = {
  credential: string;
};

export function initializeGoogleLogin(
  callback: (result: LoginResult) => void
) {
  if (initialized) return;

  if (!window.google) {
    throw new Error("Google Identity Services não carregado.");
  }

  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  initialized = true;
}

export function promptGoogleLogin() {
  if (!window.google) {
    throw new Error("Google Identity Services não carregado.");
  }

  window.google.accounts.id.prompt();
}