// Inlined from previously-shared constants
export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const APP_TITLE = "Centrika OnePortal";

// Use the logo placed in `frontend/public/logo/centrikaLogo.png`.
// Files in `frontend/public` are served at the site root, so reference as `/logo/centrikaLogo.png`.
export const APP_LOGO = "/logo/logo1.png";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;

  // If OAuth server is not configured, fall back to local login page
  if (!oauthPortalUrl || oauthPortalUrl === "undefined") {
    return "/login";
  }

  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
