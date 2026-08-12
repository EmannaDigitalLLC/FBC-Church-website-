/* ============================================================
   FIRST BAPTIST CHURCH OF RANCHO CORDOVA — AI Chat Widget (text + voice)
   Talks to a Cloudflare Worker that proxies Claude API.
   ============================================================ */

const CHAT_ENDPOINT = "https://fbc-rancho-chat.emannadigital.workers.dev";

(function () {
  const state = {
    open: false,
    history: [],
    voiceOn: true,
    listening: false,
    sending: false,
  };

  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportsSTT = !!SpeechRecognitionImpl;
  const supportsTTS = "speechSynthesis" in window;
  let speechUnlocked = false;

  // A single reusable <audio> element for playing the realistic ElevenLabs
  // voice. Reusing one element (rather than a new Audio() per reply) makes
  // the mobile-autoplay "unlock" below actually stick for later async plays.
  const ttsAudio = new Audio();
  ttsAudio.preload = "auto";

  // iOS/Safari (and some Android browsers) only allow audio/speech to start
  // playing when triggered synchronously inside a real user gesture
  // (tap/click). Our actual reply comes back later from an async network
  // call, so without this, playback would be silently blocked on those
  // browsers. Playing a near-silent sound directly inside a tap "unlocks"
  // both the <audio> element and speechSynthesis for the rest of the session.
  function unlockSpeechOnGesture() {
    if (speechUnlocked) return;
    speechUnlocked = true;
    if (supportsTTS) {
      const unlock = new SpeechSynthesisUtterance(" ");
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
    // Tiny valid silent WAV — playing a real (if silent) source is what
    // actually satisfies the browser's "was this gesture-triggered?" check.
    ttsAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    const p = ttsAudio.play();
    if (p && p.catch) p.catch(() => {});
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function buildWidget() {
    const root = el("div", "chat-widget");

    const launcher = el(
      "button",
      "chat-launcher",
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>'
    );
    launcher.setAttribute("aria-label", "Chat with First Baptist Church of Rancho Cordova");
    launcher.setAttribute("aria-expanded", "false");

    const panel = el("div", "chat-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat with First Baptist Church of Rancho Cordova");

    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-title">
          <img src="assets/img/fbc-logo-light.png" alt="" class="chat-header-logo">
          <span>Ask FBC Rancho Cordova</span>
        </div>
        <div class="chat-header-actions">
          <button class="chat-voice-toggle" aria-pressed="true" aria-label="Turn off spoken replies" title="Toggle spoken replies">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a9 9 0 0 1 0 12"/></svg>
          </button>
          <button class="chat-close" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="chat-messages" aria-live="polite"></div>
      <div class="chat-input-row">
        <button class="chat-mic-btn" aria-label="Speak your question" title="Speak your question" ${supportsSTT ? "" : "hidden"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
        </button>
        <textarea class="chat-input" placeholder="Ask about service times, ministries, or giving…" rows="1" maxlength="600"></textarea>
        <button class="chat-send-btn" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
      <p class="chat-disclaimer">AI assistant — may not always be accurate. For official info, call <a href="tel:19166354672">(916) 635-4672</a>.</p>
    `;

    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    return { root, launcher, panel };
  }

  function addMessage(container, role, text) {
    const wrap = el("div", `chat-msg chat-msg-${role}`);
    const bubble = el("div", "chat-bubble", "");
    bubble.textContent = text;
    wrap.appendChild(bubble);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    return wrap;
  }

  function addTyping(container) {
    const wrap = el(
      "div",
      "chat-msg chat-msg-bot chat-typing",
      '<div class="chat-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
    );
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    return wrap;
  }

  function speakWithBrowserVoice(text) {
    if (!supportsTTS) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }

  function base64ToBlob(base64, mime) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  // Prefers the realistic ElevenLabs voice (audioBase64, generated server-side)
  // and falls back to the free browser voice if it's missing or fails to play.
  function playVoice(text, audioBase64) {
    if (!state.voiceOn) return;

    if (audioBase64) {
      try {
        const blob = base64ToBlob(audioBase64, "audio/mpeg");
        const url = URL.createObjectURL(blob);
        ttsAudio.src = url;
        ttsAudio.onended = () => URL.revokeObjectURL(url);
        const p = ttsAudio.play();
        if (p && p.catch) {
          p.catch(() => speakWithBrowserVoice(text));
        }
        return;
      } catch (e) {
        /* fall through to browser voice below */
      }
    }
    speakWithBrowserVoice(text);
  }

  async function sendMessage(container, text) {
    if (!text.trim() || state.sending) return;
    state.sending = true;
    addMessage(container, "user", text);
    state.history.push({ role: "user", content: text });

    const typingEl = addTyping(container);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: state.history.slice(-20) }),
      });
      const data = await res.json();
      typingEl.remove();

      if (!res.ok || !data.reply) {
        addMessage(container, "bot", "Sorry, something went wrong on my end. Please try again in a moment, or call (916) 635-4672.");
      } else {
        addMessage(container, "bot", data.reply);
        state.history.push({ role: "assistant", content: data.reply });
        playVoice(data.reply, data.audio);
      }
    } catch (err) {
      typingEl.remove();
      addMessage(container, "bot", "I'm having trouble connecting right now. Please try again shortly.");
    } finally {
      state.sending = false;
    }
  }

  function initSpeechRecognition(micBtn, input, container) {
    if (!supportsSTT) return;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      state.listening = true;
      micBtn.classList.add("listening");
    };
    recognition.onend = () => {
      state.listening = false;
      micBtn.classList.remove("listening");
    };
    recognition.onerror = () => {
      state.listening = false;
      micBtn.classList.remove("listening");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      input.value = transcript;
      sendMessage(container, transcript);
      input.value = "";
    };

    micBtn.addEventListener("click", () => {
      unlockSpeechOnGesture();
      if (state.listening) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (e) {
          /* already started */
        }
      }
    });
  }

  function init() {
    if (CHAT_ENDPOINT.includes("PLACEHOLDER")) {
      console.warn("FBC chat widget: CHAT_ENDPOINT is not configured yet.");
    }

    const { launcher, panel } = buildWidget();
    const messages = panel.querySelector(".chat-messages");
    const input = panel.querySelector(".chat-input");
    const sendBtn = panel.querySelector(".chat-send-btn");
    const micBtn = panel.querySelector(".chat-mic-btn");
    const closeBtn = panel.querySelector(".chat-close");
    const voiceToggle = panel.querySelector(".chat-voice-toggle");

    function openPanel() {
      state.open = true;
      panel.classList.add("open");
      launcher.setAttribute("aria-expanded", "true");
      if (messages.children.length === 0) {
        addMessage(
          messages,
          "bot",
          "Hi! I'm here to help with questions about our service times, ministries, giving, or how to get in touch. What would you like to know?"
        );
      }
      input.focus();
    }
    function closePanel() {
      state.open = false;
      panel.classList.remove("open");
      launcher.setAttribute("aria-expanded", "false");
    }

    launcher.addEventListener("click", () => {
      unlockSpeechOnGesture();
      state.open ? closePanel() : openPanel();
    });
    closeBtn.addEventListener("click", closePanel);

    voiceToggle.addEventListener("click", () => {
      state.voiceOn = !state.voiceOn;
      voiceToggle.setAttribute("aria-pressed", String(state.voiceOn));
      voiceToggle.classList.toggle("muted", !state.voiceOn);
      if (!state.voiceOn) {
        if (supportsTTS) window.speechSynthesis.cancel();
        ttsAudio.pause();
      }
    });

    sendBtn.addEventListener("click", () => {
      unlockSpeechOnGesture();
      const text = input.value;
      input.value = "";
      input.style.height = "auto";
      sendMessage(messages, text);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });

    initSpeechRecognition(micBtn, input, messages);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
