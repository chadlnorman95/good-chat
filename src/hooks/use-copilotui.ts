"use client";

import { useEffect } from "react";

/**
 * Auto-resize the main Copilot textarea and set ripple origins.
 * Call inside your Layout component.
 */
export function useCopilotUI() {
  useEffect(() => {
    // --- Textarea autosize ---
    const ta = document.getElementById(
      "copilot-textarea",
    ) as HTMLTextAreaElement | null;
    const autosize = (el: HTMLTextAreaElement) => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    };
    if (ta) {
      const onInput = () => autosize(ta);
      ta.addEventListener("input", onInput);
      requestAnimationFrame(() => autosize(ta));
      // Cleanup
      return () => ta.removeEventListener("input", onInput);
    }

    return;
  }, []);

  useEffect(() => {
    // --- Ripple origin (for .copilot-pressable) ---
    const handler = (e: PointerEvent) => {
      const t = (e.target as HTMLElement)?.closest(
        ".copilot-pressable",
      ) as HTMLElement | null;
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--x", `${e.clientX - r.left}px`);
      t.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointerdown", handler, { passive: true });
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
}

/**
 * Append a new ink message to the main conversation <section>.
 * Evaporates the last active turn and marks it as previous.
 */
export function appendInkMessage(text: string) {
  const section = document.querySelector("main section");
  if (!section) return;

  const last = section.querySelector(
    ".ink-message:not(.ink-previous):last-of-type",
  ) as HTMLElement | null;
  if (last) {
    last.style.animation = "ink-evaporate 0.6s ease-in-out forwards";
    last.classList.add("ink-previous");
  }

  const div = document.createElement("div");
  div.className = "ink-message ink-complete";
  div.textContent = text;
  section.appendChild(div);
}

/**
 * Wire a submit button to post the textarea contents as an ink message.
 * Pass the button’s id and optional textarea id (defaults to "copilot-textarea").
 */
export function bindSendButton(
  buttonId: string,
  textareaId = "copilot-textarea",
) {
  const btn = document.getElementById(buttonId);
  const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
  if (!btn || !ta) return;

  const onClick = () => {
    const val = ta.value.trim();
    if (!val) return;
    appendInkMessage(val);
    ta.value = "";
    // reflow height
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  };

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}
