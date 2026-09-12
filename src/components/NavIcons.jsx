// Shared icon set for anything that lists nav items — the desktop side
// nav and the mobile drawer both render the same icons for the same
// labels, so they're defined once here instead of twice.
export default function NavIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path
            d="M4 11l8-6 8 6v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path
            d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path
            d="M4 5h16v11H8l-4 4V5z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "user-plus":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.4" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M2.5 20c1.2-4 4-6 6.5-6s5.3 2 6.5 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="M18 7.5v6M15 10.5h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "user-check":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.4" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M2.5 20c1.2-4 4-6 6.5-6s5.3 2 6.5 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M14.7 12.7l2 2 4-4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path
            d="M12 21s-7-6.2-7-11.2A7 7 0 0112 3a7 7 0 017 6.8C19 14.8 12 21 12 21z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9.8" r="2.4" stroke="currentColor" strokeWidth="1.9" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8.5 8V6.5A2.5 2.5 0 0111 4h2a2.5 2.5 0 012.5 2.5V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M3 13h18" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "cap":
      return (
        <svg {...common}>
          <path
            d="M12 4.5L2.5 9 12 13.5 21.5 9 12 4.5z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M6.5 11.3v4c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M21 9.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "gear":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M9.5 9.3a2.5 2.5 0 114.4 1.7c-.7.7-1.4 1.1-1.4 2.3"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17" r="0.9" fill="currentColor" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8.5" r="2.8" stroke="currentColor" strokeWidth="2.1" />
          <path
            d="M3.5 19c1-3.2 3-4.8 5.5-4.8s4.5 1.6 5.5 4.8"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M15.5 6.2a2.6 2.6 0 010 5.1M18 19c-.6-2-1.7-3.4-3.2-4.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path
            d="M12 21.5c4 0 6.5-2.7 6.5-6.5 0-3-1.7-4.8-3-6.2.3 2-1 3.2-2.2 3.2-1.6 0-2.4-1.4-1.7-3.3C12.2 6.5 12 4 10.5 2c0 3-3 4.8-3 8.5-1 1-2 2.7-2 4.5 0 3.8 2.5 6.5 6.5 6.5z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path
            d="M7 4h10v5a5 5 0 01-10 0V4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 5H4v1a4 4 0 003.5 4M17 5h3v1a4 4 0 01-3.5 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M12 14v3M9 20h6M9.5 20c0-1.8.7-2.6 2.5-3 1.8.4 2.5 1.2 2.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arcade":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="9" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M7 10.5v4M5 12.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="15.5" cy="11" r="1.1" fill="currentColor" />
          <circle cx="18" cy="13.5" r="1.1" fill="currentColor" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.1" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <path d="M12 11v6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "scale":
      return (
        <svg {...common}>
          <path d="M12 3v17M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 7h6M14 7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M4 7l-2.4 5A2.6 2.6 0 004 15a2.6 2.6 0 002.4-3L4 7zM20 7l-2.4 5a2.6 2.6 0 002.4 3 2.6 2.6 0 002.4-3L20 7z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path
            d="M7 3h7l3 3v15H7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M14 3v3h3M9.5 12h5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg {...common}>
          <path
            d="M12 19V6M6 11l6-6 6 6"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...common}>
          <path
            d="M12 5v13M6 13l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="18" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="2" />
          <circle cx="6" cy="12" r="2.3" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="18.5" r="2.3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8.1 10.7l7.8-4.3M8.1 13.3l7.8 4.3"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...common}>
          <path
            d="M7 4h10v16l-5-4-5 4V4z"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" stroke="currentColor" strokeWidth="2.1" />
          <circle cx="8.5" cy="9.5" r="1.6" fill="currentColor" />
          <path
            d="M4.5 16.5l5-5 3.5 3.5 2.5-2.5 4 4"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      );
    case "dots":
      return (
        <svg {...common}>
          <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="18.5" r="1.6" fill="currentColor" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path
            d="M14.5 5.5L7.5 12l7 6.5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path
            d="M11.5 3.5H5a1.5 1.5 0 00-1.5 1.5v6.5c0 .4.16.78.44 1.06l8 8a1.5 1.5 0 002.12 0l6.5-6.5a1.5 1.5 0 000-2.12l-8-8a1.5 1.5 0 00-1.06-.44z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="8.2" cy="8.2" r="1.4" fill="currentColor" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path
            d="M10 4H5a1 1 0 00-1 1v14a1 1 0 001 1h5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M15 8l4 4-4 4M19 12H9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "github":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.9-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.9 3H21.6L15.6 10 22.7 21H17.2L12.9 14.6 8 21H5.3L11.7 13.5 4.9 3H10.5L14.4 8.9 18.9 3zM17.9 19.3H19.4L9.8 4.6H8.2L17.9 19.3z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="8.2" cy="8.3" r="1.3" fill="currentColor" />
          <rect x="7" y="10.6" width="2.4" height="7" fill="currentColor" />
          <path
            d="M12 10.6h2.3v1.2c.5-.8 1.4-1.4 2.6-1.4 2 0 3.1 1.3 3.1 3.8v3.8h-2.4v-3.4c0-1.1-.4-1.9-1.5-1.9-.8 0-1.3.5-1.5 1-.1.2-.1.5-.1.8v3.5H12V10.6z"
            fill="currentColor"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      );
    case "pinterest":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 00-3.64 19.3c-.05-.82-.1-2.08.02-2.98.11-.8.72-5.1.72-5.1s-.18-.37-.18-.9c0-.85.49-1.48 1.1-1.48.52 0 .77.39.77.86 0 .52-.33 1.31-.5 2.03-.14.61.3 1.1.9 1.1 1.08 0 1.91-1.14 1.91-2.78 0-1.45-1.05-2.47-2.54-2.47-1.73 0-2.75 1.3-2.75 2.64 0 .52.2 1.08.45 1.39a.18.18 0 01.04.17c-.05.19-.15.61-.17.7-.03.11-.09.14-.21.08-.78-.36-1.27-1.5-1.27-2.41 0-1.96 1.42-3.76 4.11-3.76 2.16 0 3.83 1.54 3.83 3.59 0 2.14-1.35 3.87-3.22 3.87-.63 0-1.22-.33-1.42-.71 0 0-.31 1.19-.38 1.48-.14.53-.51 1.2-.76 1.6A10 10 0 1012 2z" />
        </svg>
      );
    default:
      return null;
  }
}
