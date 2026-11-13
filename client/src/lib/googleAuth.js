import firebaseConfig from '../../../firebase-applet-config.json';

// Dynamically load Google Identity Services (GIS)
export const loadGoogleGIS = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts.oauth2);
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.accounts?.oauth2));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts?.oauth2);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
};

export const signInWithGoogleOAuth = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const oauth2 = await loadGoogleGIS();
      if (!oauth2) {
        return reject(new Error('Google Identity Services unavailable'));
      }

      const client = oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          try {
            // Fetch verified user profile from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await userInfoRes.json();

            resolve({
              accessToken: tokenResponse.access_token,
              email: profile.email,
              name: profile.name || profile.given_name || 'Google User',
              photoURL: profile.picture || '',
              sub: profile.sub,
            });
          } catch (fetchErr) {
            // Even if userinfo fetch fails, we have valid token
            resolve({
              accessToken: tokenResponse.access_token,
              email: '',
              name: 'Google User',
            });
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Google popup closed or blocked'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};
