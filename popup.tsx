/// <reference types="chrome" />
import { useEffect, useState } from "react";

import "./popup.css";

const STORAGE_KEY = "extensionEnabled";

function IndexPopup() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      if (!chrome?.storage?.local) {
        return;
      }

      const stored = await chrome.storage.local.get(STORAGE_KEY);
      setEnabled(stored[STORAGE_KEY] ?? true);
    };

    loadState();
  }, []);

  const toggleExtension = async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    if (!chrome?.storage?.local) {
      return;
    }

    await chrome.storage.local.set({
      [STORAGE_KEY]: nextEnabled
    });

    if (chrome?.tabs?.query && chrome?.tabs?.sendMessage) {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      const activeTab = tabs[0];

      if (activeTab?.id != null) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: "setEnabled",
          enabled: nextEnabled
        });
      }
    }
  };

  return (
    <div className="popup">
      <div className="popup__glow" />
      <div className="popup__content">
        <div className="popup__icon">🍮</div>
        <h1 className="popup__title">Kyun-UMS</h1>
        <p className="popup__subtitle">quietly dealing with portal nonsense.</p>
        <button onClick={toggleExtension} className="popup__toggle">
          {enabled ? "Turn Off" : "Turn On"}
        </button>
      </div>
      <div className="popup__footer">
        <p className="popup__byline">made by kaushik</p>
        <a href="https://github.com/24kaushik/Kyun-UMS" target="_blank" className="popup__link">
          github
        </a>
      </div>
    </div>
  );
}

export default IndexPopup;
