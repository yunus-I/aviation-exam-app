import HomePage from "@/app/home/page";

/**
 * Root entry page — directly renders the portal without full-page browser redirects.
 * This preserves Telegram's tgWebAppData hash fragment, prevents WebViews from aborting
 * on navigation, and makes opening the mini app instantaneous.
 */
export default function EntryPage() {
  return <HomePage />;
}
