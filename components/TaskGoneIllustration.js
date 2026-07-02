export default function TaskGoneIllustration() {
  return (
    <svg width="168" height="168" viewBox="0 0 168 168" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="84" cy="84" r="80" fill="#F3F4F6" />

      {/* sparkle accents suggesting it vanished */}
      <path d="M32 44l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#D1FAE5" />
      <path d="M136 108l2.4 6.4 6.4 2.4-6.4 2.4-2.4 6.4-2.4-6.4-6.4-2.4 6.4-2.4z" fill="#D1FAE5" />
      <circle cx="128" cy="46" r="4" fill="#D1FAE5" />

      {/* clipboard body */}
      <rect x="48" y="38" width="72" height="98" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="3" />
      {/* clip */}
      <rect x="70" y="30" width="28" height="16" rx="6" fill="#E5E7EB" />
      <rect x="76" y="34" width="16" height="8" rx="3" fill="#FFFFFF" />

      {/* faded list lines */}
      <rect x="60" y="62" width="34" height="6" rx="3" fill="#E5E7EB" />
      <rect x="60" y="78" width="48" height="6" rx="3" fill="#E5E7EB" />
      <rect x="60" y="94" width="26" height="6" rx="3" fill="#E5E7EB" />

      {/* removed badge */}
      <circle cx="120" cy="118" r="24" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="3" />
      <path d="M111 109l18 18M129 109l-18 18" stroke="#FB7185" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
