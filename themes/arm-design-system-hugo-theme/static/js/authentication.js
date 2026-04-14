// ----------------------------------------------------------------------
//                 Azure AD B2C Configuration
// ----------------------------------------------------------------------
const POLICY          = "b2c_1a_arm_accounts.susi";
const ENV             = "prod"; // Change to "test" for testing environment

const CLIENT_ID_TEST       = "20ede7b2-aeb1-43d4-81f9-fc1b7fbfca5e";
const CLIENT_ID_PROD       = "8234ed8a-6728-4a0b-bb7d-b2e5933e581d";
const CLIENT_ID            = ENV === "prod" ? CLIENT_ID_PROD : CLIENT_ID_TEST;

const TENANT_DOMAIN_TEST   = "armb2ctest.onmicrosoft.com";
const TENANT_DOMAIN_PROD   = "armb2c.onmicrosoft.com";
const TENANT_DOMAIN        = ENV === "prod" ? TENANT_DOMAIN_PROD : TENANT_DOMAIN_TEST;

const TENANT_ID_TEST       = "f15a8617-9b4e-41dd-8614-adea42784599";
const TENANT_ID_PROD       = "1eb62d43-db15-492b-beab-8a32f6d90351";
const TENANT_ID            = ENV === "prod" ? TENANT_ID_PROD : TENANT_ID_TEST;

const B2C_DOMAIN      = "account.arm.com";

const REDIRECT_URI    = window.location.origin + "/";
//const REDIRECT_URI    = "http://localhost/";
// const REDIRECT_URI = "https://internal.learn.arm.com/"
// const REDIRECT_URI = "https://learn.arm.com/";

const AUTHORITY = `https://${B2C_DOMAIN}/tfp/${TENANT_DOMAIN}/${POLICY}/`;

window.msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    knownAuthorities: [B2C_DOMAIN],      
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: REDIRECT_URI,
    navigateToLoginRequestUrl: false  // prevents our MSAL consuming fragments intended for chat-ai's MSAL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: true  // required for Safari ITP: stores MSAL state in cookie not sessionStorage
  },
  system: {
    allowRedirectInIframe: false,
  }
};

window.loginRequest = {
  authority: AUTHORITY,
  scopes: [
    "openid",
  ]
};

if (!window.msalInstance) {
    window.msalInstance = new msal.PublicClientApplication(window.msalConfig);
}
const msalInstance = window.msalInstance;

// Resolves once initAuth() completes (success or failure).
// Created at module load so arm-top-navigation-ready can always await it,
// even if the event fires before the page-boot IIFE calls initAuth().
let _resolveAuthReady;
const authReadyPromise = new Promise(resolve => { _resolveAuthReady = resolve; });

// Show the chat-ai widget when signed in; remove it when signed out.
// redirect-url uses window.location.origin so it works on localhost,
// internal.learn.arm.com, and learn.arm.com without any configuration changes.
// login-hint passes the user's email so the widget's internal MSAL can
// complete ssoSilent without prompting the user to log in again.
async function ensureChatAiLoaded() {
  const signedIn = isUserSignedIn();
  const existingWidget = document.querySelector("chat-ai");

  if (!signedIn) {
    if (existingWidget) existingWidget.remove();
    return;
  }

  if (!existingWidget) {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    const widget = document.createElement("chat-ai");
    widget.setAttribute("app-name", "learning-paths");
    widget.setAttribute("redirect-url", window.location.origin + "/");

    // Resolve the user's email from claims to use as login-hint.
    // account.username in B2C may be an OID, not an email, so we pull
    // it from idTokenClaims using the same helper used elsewhere.
    const claims = await getIdTokenClaimsForAccount(account);
    const email = getEmailClaimValue(claims) || account?.username;
    if (email) {
      widget.setAttribute("login-hint", email);
    }

    document.body.appendChild(widget);
  }
}


// ----------------------------------------------------------------------
//                 Authentication Functions
// ----------------------------------------------------------------------

function ensureDigitalDataRoot() {
  if (!window.digitalData || typeof window.digitalData !== "object") {
    window.digitalData = {};
  }
  return window.digitalData;
}

function clearDigitalDataUser() {
  const digitalData = ensureDigitalDataRoot();
  delete digitalData.user_contact_email;
  delete digitalData.user;
}

function getEmailClaimValue(claims) {
  if (!claims) return undefined;

  const value =
    claims["signInNames.emailAddress"] ||
    claims.email ||
    claims.preferred_username ||
    claims.emails;

  const emailValue = Array.isArray(value) ? value.find(Boolean) : value;
  if (typeof emailValue === "string") {
    return emailValue.trim().toLowerCase();
  }

  return undefined;
}

async function getIdTokenClaimsForAccount(account) {
  if (!account) return null;

  if (account.idTokenClaims && typeof account.idTokenClaims === "object") {
    return account.idTokenClaims;
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...window.loginRequest,
      account
    });
    return tokenResponse?.idTokenClaims || null;
  } catch (error) {
    console.log("Unable to acquire token claims silently:", error);
    return null;
  }
}

async function updateDigitalDataForCurrentUser() {
  const account =
    msalInstance.getActiveAccount() ||
    msalInstance.getAllAccounts()[0];

  if (!account) {
    clearDigitalDataUser();
    return;
  }

  const claims = await getIdTokenClaimsForAccount(account);
  if (!claims) {
    clearDigitalDataUser();
    return;
  }

  const email = getEmailClaimValue(claims);
  const digitalData = ensureDigitalDataRoot();
  delete digitalData.user_contact_email;
  delete digitalData.user;

  if (email) {
    digitalData.user_contact_email = email;
  }
}

// Auth Init on pageload
let authInitPromise;
async function initAuth() {
    if (authInitPromise) return authInitPromise; // prevent double init on same page
    authInitPromise = (async () => {
        // await msalInstance.initialize(); // recommended in newer msal-browser docs, but we don't have newest version
    
        const result = await msalInstance.handleRedirectPromise(); // safe to call every load
    
        if (result?.account) {
          msalInstance.setActiveAccount(result.account);
        } else {
          getAccount();
        }

        await updateDigitalDataForCurrentUser();
    
        renderAuthInTopNav();
        await ensureChatAiLoaded();
      })().catch((e) => {
        console.log("Auth init failed:", e);
        clearDigitalDataUser();
        renderAuthInTopNav();
        ensureChatAiLoaded();
      }).finally(() => {
        _resolveAuthReady(); // signal auth is done regardless of outcome
      });
    
      return authInitPromise;
}


// Helper function
function getAccount() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length) {
      // Optional: pick a deterministic account if multiple
      msalInstance.setActiveAccount(accounts[0]);
      return accounts[0];
    }
    return null;
}
  


// Access signed-in user data, return it in format ads-top-nav expects
function getSignedInNavData() {
  if (!msalInstance) return null;

  const account =
    msalInstance.getActiveAccount() ||
    msalInstance.getAllAccounts()[0];

  if (!account) return null;

  const username =
    account.name ||
    account.username ||
    "Signed in";


  return {
    signInUsername: username,
    ctaBtnLogOff: {
      enableCallback: true,
      label: "Log out",
      url: 'https://developer.arm.com/user-logout' 
    }
  };
}


// Site-wide check for signed-in user
function isUserSignedIn() {
  const account = getAccount();
  return account !== null;
}

// UI update to top nav based on auth state (login or logout options)
function renderAuthInTopNav() {

  const topnav = document.querySelector("arm-top-navigation");
  const signInData = getSignedInNavData();
  if (topnav && signInData) {
      // This signInData will now appear in the top navigation when clicking the user icon
      topnav.signIn(signInData);
  }
  else {
     var loginRegisterData = {
      login: {
        title: "Login",
        description: "Login to your account",
        ctaBtn: {
          enableCallback: true,
          label: "Login",
          url: "####",
        },
      },
      register: {
        ctaBtn: {
          enableCallback: false,
          label: "register-label",
          url: "https://developer.arm.com/register",
        },
      },
    };
    topnav.loginRegister(loginRegisterData);
    // Add a message to inform the user about the registration option
    console.log("User is not signed in. Displaying login and registration options.");
  }

}




// ----------------------------------------------------------------------
//                 Auth Callback hooks in top nav
// ----------------------------------------------------------------------
document.addEventListener('arm-account-signout', (event) => {
    var shadowRoot = document.querySelector('arm-top-navigation').shadowRoot;
    if (shadowRoot) {
  
    const signOutButton = shadowRoot.querySelector('.js-signout-btn');
      if (signOutButton) {
        signOutButton.innerHTML = "Logging you out...";
      }
      else {
          console.log("Sign-out button not found in DOM.");
      }
    }

  clearDigitalDataUser();
    
  const account = getAccount();
  msalInstance.logoutRedirect({
    account,
    authority: AUTHORITY,
    postLogoutRedirectUri: REDIRECT_URI
  });

});

document.addEventListener('arm-account-signin', (event) => {
  
  var shadowRoot = document.querySelector('arm-top-navigation').shadowRoot;
  if (shadowRoot) {

      const signInButton = shadowRoot.querySelector('.c-utility-navigation-login__sign-in-button');
    if (signInButton) {
        signInButton.innerHTML = "Redirecting to login...";
    }
    else {
        console.log("Sign-in button not found in DOM.");
    }
  }


  msalInstance.loginRedirect({   // single-window login
    ...loginRequest
  });
});

document.addEventListener("arm-top-navigation-ready", async function (e) {
  // Reset theme immediately — arm-top-navigation may override it
  document.documentElement.setAttribute("theme", "dark");

  // Wait for MSAL to finish before updating auth UI and showing the widget.
  // authReadyPromise is created at module load, so this await always works
  // even when this event fires before the page-boot IIFE calls initAuth().
  await authReadyPromise;

  renderAuthInTopNav();
  await ensureChatAiLoaded();
});



// ----------------------------------------------------------------------
//                 Page Boot
// ----------------------------------------------------------------------
(async () => {
  await initAuth();   // IMPORTANT: await this before user clicks anything

})();