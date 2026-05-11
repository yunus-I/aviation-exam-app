import type { RegistrationStatus } from "@/types/db";

export const MINI_APP_COPY = {
  heroKicker: "Telegram Entrance Dashboard",
  heroTitle: "Entrance Prep Hub",
  heroDescription:
    "A focused mobile workspace for registration, approval tracking, and department-based exam preparation inside Telegram.",
  loginTitle: "Open this inside Telegram",
  loginDescription:
    "This Mini App verifies your Telegram account before showing your exam dashboard.",
  loginHint:
    "Launch it from your Telegram bot after registration so we can identify your account securely.",
  loadingTitle: "Checking your access",
  loadingDescription:
    "We're verifying your Telegram account and loading your registration status.",
  notFoundTitle: "Registration not found",
  notFoundDescription:
    "We could not find a registration linked to this Telegram account yet.",
  notFoundAction: "Register through the bot first, then reopen the Mini App.",
  statusCards: {
    approved: {
      badge: "Approved",
      title: "Prep platform access is active",
      description: "",
      action: "",
    },
    pending_review: {
      badge: "Pending",
      title: "Your registration is under review",
      description:
        "Your payment receipt and registration details are waiting for admin approval.",
      action: "Please wait 30 minutes to 1 hour, then reopen this Mini App.",
    },
    rejected: {
      badge: "Rejected",
      title: "Your registration needs attention",
      description:
        "This account was reviewed but not approved yet. You may need to submit a clearer receipt or restart the registration.",
      action: "Return to the Telegram bot and register again.",
    },
    draft: {
      badge: "Not Submitted",
      title: "Your registration is incomplete",
      description:
        "We found your account, but your registration has not been submitted yet.",
      action: "Go back to the Telegram bot and complete the remaining steps.",
    },
    submitted: {
      badge: "Submitted",
      title: "Submission received",
      description:
        "Your registration was received and is being prepared for review.",
      action: "Please reopen the Mini App after approval.",
    },
  } satisfies Record<
    RegistrationStatus,
    {
      badge: string;
      title: string;
      description: string;
      action: string;
    }
  >,
};
