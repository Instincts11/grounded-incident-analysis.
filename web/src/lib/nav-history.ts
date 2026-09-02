const STACK_KEY = "incident-nav-stack";
const LAST_PATH_KEY = "incident-nav-last";
const LAST_SCROLL_KEY = "incident-nav-last-scroll";
const PENDING_SCROLL_KEY = "incident-nav-pending-scroll";
const GOING_BACK_KEY = "incident-nav-going-back";

type NavEntry = {
  path: string;
  scroll: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readNavStack(): NavEntry[] {
  const parsed = readJson<unknown>(STACK_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is NavEntry => {
    return (
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as NavEntry).path === "string" &&
      typeof (item as NavEntry).scroll === "number"
    );
  });
}

function writeNavStack(stack: NavEntry[]) {
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
}

function currentPath(pathname: string) {
  return pathname + window.location.search;
}

export function recordNavigation(pathname: string) {
  const here = currentPath(pathname);
  if (consumeGoingBack()) {
    sessionStorage.setItem(LAST_PATH_KEY, here);
    const pending = sessionStorage.getItem(PENDING_SCROLL_KEY);
    if (pending != null) {
      sessionStorage.removeItem(PENDING_SCROLL_KEY);
      const top = Number(pending);
      requestAnimationFrame(() => window.scrollTo(0, Number.isFinite(top) ? top : 0));
    }
    return;
  }

  const last = sessionStorage.getItem(LAST_PATH_KEY);
  if (last && last !== here) {
    const stack = readNavStack();
    if (stack[stack.length - 1]?.path !== last) {
      stack.push({
        path: last,
        scroll: Number(sessionStorage.getItem(LAST_SCROLL_KEY) ?? 0) || 0,
      });
      writeNavStack(stack);
    }
  } else if (!last) {
    seedFromReferrer(here);
  }

  sessionStorage.setItem(LAST_PATH_KEY, here);
}

export function rememberScroll() {
  sessionStorage.setItem(LAST_SCROLL_KEY, String(window.scrollY));
}

function popPreviousPage(): NavEntry | null {
  const stack = readNavStack();
  const entry = stack.pop() ?? null;
  writeNavStack(stack);
  return entry;
}

export function navigateBack(push: (href: string) => void) {
  rememberScroll();
  const entry = popPreviousPage();
  markGoingBack();
  if (entry) {
    sessionStorage.setItem(PENDING_SCROLL_KEY, String(entry.scroll));
    push(entry.path);
    return;
  }
  push("/");
}

export function markGoingBack() {
  sessionStorage.setItem(GOING_BACK_KEY, "1");
}

function consumeGoingBack() {
  const flagged = sessionStorage.getItem(GOING_BACK_KEY) === "1";
  if (flagged) sessionStorage.removeItem(GOING_BACK_KEY);
  return flagged;
}

function seedFromReferrer(here: string) {
  try {
    const referrer = document.referrer;
    if (!referrer) return;
    const url = new URL(referrer);
    if (url.origin !== window.location.origin) return;
    const path = url.pathname + url.search;
    if (!path || path === here) return;
    writeNavStack([{ path, scroll: 0 }]);
  } catch {
    /* ignore invalid referrer */
  }
}
