// utils/fetchWithAuth.js
import { decryptPayload, encryptPayload } from "./encryption";
const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";
export const fetchWithAuth = async (url, options = {}, context) => {
  const { token, refreshToken, saveToken, saveRefreshToken, signOut } = context;

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let res = await fetch(url, options);
  if (res.status === 401) {
    // Access token expired, try refresh
    try {
      const body = encryptPayload({ refresh_token: refreshToken });
      const refreshRes = await fetch(`${USER_API}/user/refresh/token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!refreshRes.ok) {
        signOut(); // Both tokens expired, logout
      }

      const data = await refreshRes.json(); // { access_token, refresh_token }
      saveToken(data.access_token);
      saveRefreshToken(data.refresh_token);

      // Retry original request with new access token
      options.headers.Authorization = `Bearer ${data.access_token}`;
      res = await fetch(url, options);
    } catch (err) {
      signOut(); // Both tokens expired, logout
      throw err;
    }
  }

  return res;
};
