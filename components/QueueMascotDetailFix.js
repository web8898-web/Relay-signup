"use client";

import { useEffect } from "react";

const STYLE_ID = "queue-mascot-detail-fix-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .queue-reference-drink .queue-reference-normal-mouth{opacity:0!important}
    .queue-reference-drink-mouth{opacity:0}
    .queue-reference-drink .queue-reference-drink-mouth{opacity:1}

    .queue-reference-phone .queue-reference-eye,
    .queue-reference-read .queue-reference-eye{
      transform:translateY(3px)!important;
    }

    .queue-reference-watch .queue-reference-eye{
      transform:translate(-2px,2px)!important;
    }
  `;
  document.head.appendChild(style);
}

function refineMascot(mascot) {
  if (!(mascot instanceof HTMLElement)) return;

  const phone = mascot.querySelector(".queue-reference-phone-prop");
  if (phone instanceof SVGElement && phone.dataset.backApplied !== "true") {
    phone.innerHTML = `
      <rect x="78" y="78" width="19" height="30" rx="4" fill="#55B786" stroke="#3D8F6D" stroke-width="3"/>
      <circle cx="83.5" cy="84" r="2.8" fill="#173D38" stroke="#DDF3EA" stroke-width="1"/>
      <circle cx="83.5" cy="84" r="1" fill="#F8FAFC"/>
    `;
    phone.dataset.backApplied = "true";
  }

  const drink = mascot.querySelector(".queue-reference-drink-prop");
  if (drink instanceof SVGElement && drink.dataset.strawApplied !== "true") {
    drink.innerHTML = `
      <rect x="78" y="75" width="22" height="31" rx="5" fill="#55B786" stroke="#3D8F6D" stroke-width="3"/>
      <path d="M89 75V60" stroke="#6A574F" stroke-width="3" stroke-linecap="round"/>
    `;
    drink.dataset.strawApplied = "true";
  }

  const head = mascot.querySelector(".queue-reference-head");
  if (head instanceof SVGElement && !head.querySelector(".queue-reference-drink-mouth")) {
    const mouth = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    mouth.setAttribute("class", "queue-reference-drink-mouth");
    mouth.setAttribute("cx", "89");
    mouth.setAttribute("cy", "59");
    mouth.setAttribute("rx", "3.6");
    mouth.setAttribute("ry", "2.8");
    mouth.setAttribute("fill", "#6A574F");
    head.appendChild(mouth);
  }
}

function applyFixes() {
  document.querySelectorAll("[data-reference-queue-mascot]").forEach(refineMascot);
}

export default function QueueMascotDetailFix() {
  useEffect(() => {
    ensureStyles();
    applyFixes();

    let frame = 0;
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyFixes);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
