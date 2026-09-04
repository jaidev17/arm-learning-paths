(async () => {
  const chatOpenStateKey = "learn.chatAi.isOpen";

  const readChatOpenState = () => {
    try {
      return window.sessionStorage.getItem(chatOpenStateKey) === "true";
    } catch (error) {
      console.warn("Unable to read chatbot display state:", error);
      return false;
    }
  };

  const writeChatOpenState = (isOpen) => {
    try {
      window.sessionStorage.setItem(chatOpenStateKey, String(isOpen));
    } catch (error) {
      console.warn("Unable to save chatbot display state:", error);
    }
  };

  const persistChatOpenState = (chatAi) => {
    const toggle = chatAi.shadowRoot?.querySelector(".ipxc-toggle");

    if (!toggle) {
      return false;
    }

    const isOpen = () => /\sclose$/i.test(toggle.getAttribute("aria-label") || "");
    const saveState = () => writeChatOpenState(isOpen());

    const toggleObserver = new MutationObserver(saveState);
    toggleObserver.observe(toggle, {
      attributes: true,
      attributeFilter: ["aria-label"],
    });

    window.addEventListener("pagehide", saveState);

    if (readChatOpenState() && !isOpen()) {
      toggle.click();
    }

    return true;
  };

  const restoreChatOpenState = (chatAi) => {
    if (persistChatOpenState(chatAi)) {
      return;
    }

    if (!chatAi.shadowRoot) {
      return;
    }

    const mountObserver = new MutationObserver(() => {
      if (persistChatOpenState(chatAi)) {
        mountObserver.disconnect();
      }
    });

    mountObserver.observe(chatAi.shadowRoot, {
      childList: true,
      subtree: true,
    });
  };

  try {
    await initAuth();

    const account = getAccount();
    const claims = await getIdTokenClaimsForAccount(account);
    const email = getEmailClaimValue(claims);
    const chatbotApiUrl = atob(window.chatbotApiUrlEncoded || "");

    if (!chatbotApiUrl) {
      throw new Error("HUGO_CHATBOT_API is not configured");
    }

    if (email) {
      // Create and append chat-ai element only after successful auth
      const chatAi = document.createElement("chat-ai");
      chatAi.id = "chat-ai";
      chatAi.setAttribute("theme", "dark");
      chatAi.setAttribute("title", "Arm Virtual Assistant");
      chatAi.setAttribute("current-page", "true");
      chatAi.setAttribute(
        "content",
        `<strong>Discover the right technical content faster</strong><br><br>
         Arm Virtual Assistant helps developers find relevant Learning Paths, tools, and implementation guidance across AI, cloud, and multi-architecture development.<br><br>
         Use of the Arm Virtual Assistant is subject to the terms of the <a href="/terms-and-conditions/arm-virtual-assistant/" target="_blank" rel="noopener noreferrer"><strong>Arm Virtual Assistant Terms and Conditions of Use</strong></a>.`
      );
      chatAi.setAttribute("app-name", "learning-paths");
      chatAi.setAttribute("api-url", chatbotApiUrl);
      chatAi.setAttribute("tnc-url", "/terms-and-conditions/arm-virtual-assistant/");
      chatAi.setAttribute("stream", "false");
      chatAi.setAttribute("login-hint", email);
      chatAi.setAttribute("redirect-url", window.location.origin + "/");
      chatAi.setAttribute("login-on-load", "true");
      
      document.body.appendChild(chatAi);
      window.chatAiRef = chatAi;
      restoreChatOpenState(chatAi);
    }
  } catch (error) {
    console.warn("Unable to authenticate:", error);
  }
})();
