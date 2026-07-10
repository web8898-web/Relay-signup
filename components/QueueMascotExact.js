"use client";

import { useEffect } from "react";

const MASCOT_DATA = "data:image/png;base64,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[... ELLIPSIZATION ...]7kbQpZR0FUFFPxrKmIz52CVp2BtNywSyoVeAOf1eJrbyn2FVtyo7SFIAjtuJrEWrrXPpzEU864lMedY2gozaS9Rja/hddrbaOieFwvnTR3x1sXXbLSAO71yYqE1yfVxPDjRiJqlEJ8pV+pl9Y0bPnQzqZ907oGe2c7WsVAXtFIa9haI8u5RiIJhgOXzi3ZHdfmrjWNhIwhRu7gG1OYMLz+9lyI4Kt+6ADGDQvQsT9gkwFZaqD+wrGwx7fg+Nad6GtpCynOFz6YOQKz5g/5CY9lyBkTITcpgAvUVxAd15v3pxxkgTw/lfNPYejc98S+yknNhHGoWzwXor4UGa1hkgEpDUjp9oYL6YZKMpjNzh7sHNIsDigvfoGQkdGOR4enHLrIfiE3lysKNtwwztMWBhFIChTFk3p8Ve3uxRNn/XH+qEn3ANgUGMfrmO4+pGEqKegJ1vzyRTMWTDrW03Feb3YwqZVmpW0uj5eKPa2Hr3t8z8tnZ2yLi4wEzRs1xm3K8ZQXtzQd4l5lE5Q+cu70M26bUzexY1BlpCHikMKtpmsAQmhoDSi4o6a1VrADhF8HFWCp3aTTEAKO1qi7rMp+4b77Zv/+lz9/F8Ap5b4xDVfFZeY8JXWOzFUPiJZBDUNHQM/wBNgTHuFZOBSe+ecZGoU0sZjznByz1pqEIOe6t95819IrLl3XfOywIcx4qGAlcpWr3NUJug5l6LIpuG3PgIYkcmxtj/3Dlufe3ZXpr4mTwbPrx1CxGYPSLkt4T0sTmvt6ICVhzqhJj589edEjveleoeAaZiIWR1VRmRpbXr4GwEYiskO52+u6YcoIf1HfSIioF8AW7xEcccPEc3s3TpCGcbaTyYAMoDiWQIxkoDRuSMnEiqDRXFtd94PZ4yY1v9of+q7f/OYiIY0blO2kbNs6ofeg/CaL/OCH8owhJD1HuZFB0doF/QmIf7iCHR586tddlEY8HncSAvdPKKn47at5vZh55n1bVl8DIWqIBJfHk1RkxGAzIy4lBARsrSCkiaSRfGH+2In/eSLB6jdST7rIK2KxfwGY/WmQoJUrVwoAlLEtI+No4TjanTPODizHQsaxkFEWLKXAgsCCQJKop7/DDL/+z33ceOONEgD1DloGE8GxbQz097k+xyMrhqv+QxCqfAMpdI999EsQyBCBoqQQNAQFoFD/R0RyuLCMXk5HLGy8JFwNXtYgEgwFn4suX63rdaDlqOnnCUICDmtkVBZZx0Ja2cgqB7ZyQ11L2cJmPfR8DPLXxRvFOIYYSNhQiCgYIrFq1aocPUdrsGI3LFII0TT8ZFwEbZ9l8fjQ1/8Zj9mzZzMAHlVTw6YZR3pgEK3HWwB44xG08nrkEd2tg+p5FL8KjXYtGC75jGSXPi+GJN5hLxQRqPakRn2ZU84rJuaPZuhob4NjW0glkrKqtlYC4JUrV75q18s0i5g8AThBAqYhYUgJQe6AJGaGo70wWWuY0hh6PgIH6+INdBiv9AXuvAjlSfkoSBIwhatT6xYPBSQLmOr0oRqjxo1CqqgYnc1N6O3qCRA1OaRZKS/ciqTKuQXOyMtTvP+Nx+JeUxcFcHJkxjvnDSvl/DMgTxA/l7qHq87Hm5pgWxZKysqaJs2Y0fjqXzHLBRGka+xx00RSmJDChuFJNPlCDg40Ro6TeJCTZaM+sY/ZbRxKxeNIxROIm3EYwnT7s0kgieRp+dCTJ0/j0rIytmwLXR1tIU9BYcJwHpKFSMU8wkMiKlBEcYdnCk+fSzkqD/ANw1JhMIw86kh4SBBFqvgEePJH7pn6ervYNCWEIdfV19evAwDP6756h2a3jkVu0TYmTLeyLmMwpAQEezpaYsQq/iwD0a5b9httfNUTU0iYHtXkdB9lZcWyvLpaamgc2rcHmcFBSOnpP4lhvhUVTj8K5duCJLRW2LNrJ4QQyGTSaDx8eEgeU4jBGoF0qfDz3IFbGkJIpAcHcHjvPiTicVTX1FkArNNxzZh95jEHSvDS6240pYQ03DxLjNjHn+tB3LjcNCRihuGphoiAeOg2HQFCMHD65hJ1jBoz/ngqVYwjhw+itaUFUrhaWfnV7EgERJwbr4zoYJvA2xDBiBno7+tF05HDMAy3sWl/w243xNQ6mrOEGMG5oTgh/tUwkSYrhjQMHNy3D/v3NCBVUowzlp4lcBoYsZYFt71Zua3PrHVAKBOCPMq6hGG6Ci1v4Ilrf76BCI+kJ4XhVmg94YUgmc3nNL2KR4jrs3XOwoX31Y4a47S1HKfd27d6YV10tFn+T5yoZTo3eRPEwNFDh9B2vAlExFIS9u7agWw2C9MwoqGa34OSl9wD4d53GhKaScP9vJvXreW+3l6RKC7pn7Vw4QueB3nVkSINl87jsMdc8MdFIDcWQpLhdWWOHH+ygZhBr7PrMRCMPMv1RrMnDp0+DTmIBzNaS889+w/jJ089LBhY/eTjnBkchGGagQpKuPU1YOISD9sG6/K/vGo+ETasXYPuzi7E4kmKJ1PYt3cXdm3b6r5H3jAeZo3C225Oh9gP5bR2pZCkaaCvpxsvPfcMBDRGTZjSMm3GjDVEpFeuXPmq7y6ucJwDhkdMZNdIcgqLDEmA0IVDxxEDOVUDkSYMMnIhi1focpSG43gPfwJt5vSNfjSBg2ecfe6+kvIK7N66hV945ikIIWBblieXk6uW5/qJhhpHePKUYzsQUqKzrQ2rn3oSUBpLVlzaOX7qjHRXezs/8eB9Qf+3dlTQdQlwZA5j1JVEK/faa6UlEB69/z4c3N2AktIyLFx23moAh09Lgg6PTsIE1pTrHfF6P/x+F/YHuoBGLONPNRCH4UnzUzBezAkmNTmwtOMaizo9GYgXehCAthWXXfWHKXMWZDLZjPjtL3/ORw4fQiKZhOM43tDR6ADR4SBg9uaTuOPMBO66/RdoPnyIK6tr0xdcc/3dC846b3siUUzPPf4Yr37qScRiMTjK8YYCwRu7nAvnwrlN8LtnWEo5SKZSOLB3N/545x3acRRNmD732JXXvPlOIuo6HeFVvw0wDPjaNIRcy7DWHIRcjmY42sFIEvJnGIhytKcengtLlPI1r5Tbp63cnckfJHMawiwQka4uS9y34tKr7igqr3IOH9iP//rql9He2op4IgHluGPRtMqFQlTIOLSG8sStYzETD9x9Jx6//36VTCRo8YWXNiyYN+V/V1x6+Q8nz57f1NPdRT/+3nd417ZtSCSTUNrJdRuGkveAfxWi9NuOA9uyEE8k0dnehh98+z/5+LEmVI4eh8ve+s5H43G8EIGlX8Wj2ARibu94VP7Hl/rxDYYByxmpg/x5SToMV7DE70NwQgNp4PU3BOLIp6cOEuKNHbvksgt/cO6lVx+Ix5O0bd1L6kuf+QTv270LZizuqrsrx+0z8Sj1SqlAbd6n2MeTSQCMO3/5U/ziv7/PKj0oJ89Z2HPtO993G4DNY+qrbr/qxnf+R/24KQONhw/iG1/4PK9d/Tzi8YQ7jtoXYgudV3nsXNezKnfkWyKBAw278LV/+yxvXfcyUiXl4sI33/jHCy8851tE1Hv6aBwxxIRkU7q0GUk5rTPpQfPEAtAE5cKPI4d3vFLIgsGwVdZiMJCxLbQP9mNsSRVMAhr7utGdHoCUgmOI8dSK0af1wzMzHQJ2XPfuv/9WV3vHrS8/++iorRvX43P/8k98w83voIuuuBI1daMKeZ/g/9u2hR1bN+HuX9+Gtc8+raEgZsxd2H39LR/5xtTxdT/yFqzDzHd3d3Vdfu8vf3zl0YMH+Ztf+Ly+5vrrxVXX3+DK9kQSYk8XLIQItbUcxzOPPYL77voNHzvSiNLKWrrg6uv++HcfeM//I6LdpyO08o84xYRBhmGShGKNnswgystqEBNAWmv0ZNMwyQVe4hiBsSKb8StZjIIE72/rvvbONff8uGmwpVaaho6BqL6oCkzA0e52OKy1LSAnF4/b8Jmr3n4dER093QQ3ZjaPtnS/57f/9z8feeHZx+Z1dbSY0MwzZs3GsnPPw4zZc1A7ejSKS8tcjS2l0NXWin27d2L75k1Y/9Ja7mxvp7LSMpq96Kyu697xoW8uPWvO94ho0JfT9LoOF99/78PfePCeOy46vHcHrGwa4ydP5TPPOhuz5y/AhMlTUVRSAincKbYDA31oPHQQu7ZuxUtrX8SBPQ1sCCnGTJiG86667o/v/8AtnyGihtN1fUIzXybd9vzjv9ze0nAeSdYJIWhiRS2SsQQae7rQ1NvFFjSSFMu8eeElnz5v2qwfIBivM2Igr/Rilz++dcvXn2x47gM9uk8awghabokkHFaoMIrtK2Zf+L0LZs1eRUT9fwkG6NPMxgXA1LvuuPsTa5587MYjB3aX9Xa1Qzk2ilJFKC2vQKqk1B0Galno6+1Gb1cXHMtCqqQMtWMnYsHS5U++6aZbbp84vupuIuor9LmZeeHal7e954k/3nP17q0vT2s73ggrk0FJSQnKKyqRTBWBBEFrhfTgIHq6OtDf3w/DjKO6bhQmTZt74NI3v+2OCy5adtvpNA7fqLXWBEDsaGz554c3P/mtY+lmAXLRNBBBk68XYGB+/YwX37v8sluIaP8bjbX7ZxtIxEgGedwjDZtXrTuy+e0d6U7DnRTJEERcESvfd860JfdcNHv+/xDR8b/EhQ6/BzPXHDnSduGap5+8qWHHthWNR/eXDXR1MGnltpM67iCbeFERSsoqqLi0sm/c5Glbzjj7/J3Lly/4HyLamX/OAptE3AbOePKBJ2/Ysm7NNc1Nhyf3dneyle6Hk81CaeVqSEkDyZJSlFVUoXr0mF0Lzly+Z9n5l/6utty4h4j0X/LaDDJP2Nxw8J+e27P6Tcf6WybY7E7CkoakEpkYmFM3a92F887+v1ElqT/4MypHjj8D8GbmCbsb2y9vaD6Y7Mn0aA2Haooq+cyJ8zbUVibXhbvO/lJHnqHUdvbj4oP7dtU1HTqgOttbaKC7GxqAEY9jVO0oHjV5shw/eVrXqKqiZwC0EFEGuTmNp/IeMRs4e//+Ywubj+znY4f3o7u7GwIuqzmeTGLU+CkYO3kaz5w6+mUAOwAM/LVaVZk50dDYvXzrkS3zjvd3MAlweapEzBo9rWfxxIlPEdGREZOIHv8fWexO0zQyyNoAAAAASUVORK5CYII=";
const STYLE_ID = "queue-exact-mascot-style";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes queueExactBreathe {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    @keyframes queueExactFirst {
      0%, 100% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-5px) scale(1.04); }
      70% { transform: translateY(0) scale(.99); }
    }
    .queue-exact-mascot {
      position: relative;
      width: 96px;
      height: 83px;
      margin: 0 auto 8px;
      animation: queueExactBreathe 3.2s ease-in-out infinite;
      transform-origin: center bottom;
    }
    .queue-exact-mascot.queue-exact-first {
      animation: queueExactFirst 560ms ease-out 1, queueExactBreathe 3.2s ease-in-out 560ms infinite;
    }
    .queue-exact-mascot img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .queue-exact-eyelid {
      position: absolute;
      top: 37.8%;
      width: 5px;
      height: 2px;
      border-radius: 999px;
      background: #5a463f;
      opacity: 0;
      transform: scaleX(.2);
      transition: opacity 55ms ease, transform 90ms ease;
      pointer-events: none;
    }
    .queue-exact-eyelid.left { left: 28.4%; }
    .queue-exact-eyelid.right { left: 44.7%; }
    .queue-exact-mascot.queue-exact-blink .queue-exact-eyelid {
      opacity: 1;
      transform: scaleX(1);
    }
    @media (prefers-reduced-motion: reduce) {
      .queue-exact-mascot,
      .queue-exact-mascot.queue-exact-first {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function blink(mascot) {
  if (!(mascot instanceof HTMLElement) || !mascot.isConnected) return;
  mascot.classList.add("queue-exact-blink");
  window.setTimeout(() => mascot.classList.remove("queue-exact-blink"), 120);
  if (Math.random() < 0.2) {
    window.setTimeout(() => {
      if (!mascot.isConnected) return;
      mascot.classList.add("queue-exact-blink");
      window.setTimeout(() => mascot.classList.remove("queue-exact-blink"), 120);
    }, 230);
  }
}

function scheduleBlink(mascot) {
  if (!(mascot instanceof HTMLElement) || mascot.dataset.exactBlink === "true") return;
  mascot.dataset.exactBlink = "true";
  const next = () => {
    if (!mascot.isConnected) return;
    const delay = 4000 + Math.floor(Math.random() * 8001);
    const timer = window.setTimeout(() => {
      blink(mascot);
      next();
    }, delay);
    mascot.dataset.exactBlinkTimer = String(timer);
  };
  next();
}

function installExactMascot(root = document.body) {
  if (!root || !(root instanceof Element || root === document.body)) return;
  ensureStyles();

  const labels = [];
  if (root instanceof HTMLElement && root.textContent?.trim() === "目前等待順位") labels.push(root);
  root.querySelectorAll?.("*").forEach((el) => {
    if (el instanceof HTMLElement && el.textContent?.trim() === "目前等待順位") labels.push(el);
  });

  labels.forEach((label) => {
    const slot = label.previousElementSibling;
    if (!(slot instanceof HTMLElement)) return;

    const card = label.closest("div.bg-gradient-to-br") || label.parentElement;
    const isFirst = card?.textContent?.includes("第 1 位");

    if (slot.dataset.exactMascotInstalled !== "true") {
      slot.dataset.exactMascotInstalled = "true";
      slot.className = "";
      slot.removeAttribute("style");
      slot.innerHTML = `
        <div class="queue-exact-mascot ${isFirst ? "queue-exact-first" : ""}" data-queue-waiting-mascot data-exact-queue-mascot role="img" aria-label="坐著等待的可愛人物">
          <img src="${MASCOT_DATA}" alt="" />
          <span class="queue-exact-eyelid left" aria-hidden="true"></span>
          <span class="queue-exact-eyelid right" aria-hidden="true"></span>
        </div>
      `;
    }

    const mascot = slot.querySelector("[data-exact-queue-mascot]");
    if (mascot instanceof HTMLElement) {
      mascot.classList.toggle("queue-exact-first", Boolean(isFirst));
      scheduleBlink(mascot);
    }
  });
}

export default function QueueMascotExact() {
  useEffect(() => {
    installExactMascot();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) installExactMascot(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.querySelectorAll("[data-exact-queue-mascot]").forEach((mascot) => {
        const timer = Number(mascot.dataset.exactBlinkTimer);
        if (timer) window.clearTimeout(timer);
      });
    };
  }, []);

  return null;
}
