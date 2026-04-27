import type { AppLanguage } from "@/types/db";

type CopyTree = {
  welcome: string;
  chooseLanguage: string;
  languageChanged: string;
  askFullName: string;
  askDepartment: string;
  askRegion: string;
  askPhone: string;
  invalidPhone: string;
  askPassword: string;
  invalidPassword: string;
  paymentInstructions: string;
  receiptOnly: string;
  pendingReview: string;
  alreadyApproved: string;
  rejectedStatus: string;
  adminOnly: string;
  adminApproved: string;
  adminRejected: string;
  userApproved: string;
  userRejected: string;
  reviewCaptionLabel: string;
};

export const BOT_COPY: Record<AppLanguage, CopyTree> = {
  en: {
    welcome:
      "👋 Welcome! / እንኳን ደህና መጡ!\n\nTo begin, please select your language.",
    chooseLanguage: "Choose your language below.",
    languageChanged: "Language selected. Let's continue your registration.",
    askFullName: "Please enter your full name.",
    askDepartment: "Which department do you want to join?",
    askRegion: "Which region of Ethiopia are you from?",
    askPhone: "Please send your phone number.",
    invalidPhone:
      "Please enter a valid phone number. Example: 09XXXXXXXX or +2519XXXXXXXX.",
    askPassword:
      "Create a password with at least 4 digits. Numbers only are recommended for easy login.",
    invalidPassword:
      "Your password must be at least 4 digits and contain numbers only.",
    paymentInstructions:
      "💸 Payment required: 200 Birr\n\n🏦 CBE: 1000293836648 (Admassu Yano)\n📱 Telebirr: 0907667755 (Admassu Yano)\n\n📸 Please upload the screenshot of your payment receipt.",
    receiptOnly: "Please upload the receipt as an image.",
    pendingReview:
      "Your registration is under review. Please wait 30 minutes to 1 hour for approval.",
    alreadyApproved:
      "Your registration is already approved. You will be able to use the exam Mini App.",
    rejectedStatus:
      "Your previous registration was rejected. You can start again and submit a new receipt.",
    adminOnly: "This action is only available to approved admins.",
    adminApproved: "The registration has been approved and the user has been notified.",
    adminRejected: "The registration has been rejected and the user has been notified.",
    userApproved:
      "✅ Your registration has been approved. You can now access the exam Mini App.",
    userRejected:
      "❌ Your registration was not approved. Please contact support or submit again with a valid receipt.",
    reviewCaptionLabel: "Registration review",
  },
  am: {
    welcome:
      "👋 Welcome! / እንኳን ደህና መጡ!\n\nለመጀመር ቋንቋዎን ይምረጡ።",
    chooseLanguage: "እባክዎ ቋንቋዎን ከታች ይምረጡ።",
    languageChanged: "ቋንቋው ተመርጧል። ምዝገባውን እንቀጥል።",
    askFullName: "እባክዎ ሙሉ ስምዎን ያስገቡ።",
    askDepartment: "የሚፈልጉት ዲፓርትመንት የትኛው ነው?",
    askRegion: "ከየትኛው የኢትዮጵያ ክልል ነዎት?",
    askPhone: "እባክዎ ስልክ ቁጥርዎን ያስገቡ።",
    invalidPhone: "እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ። ለምሳሌ 09XXXXXXXX ወይም +2519XXXXXXXX.",
    askPassword:
      "ቢያንስ 4 አሃዝ ያለው የይለፍ ቃል ያዘጋጁ። ለመግቢያ አሃዞች ብቻ መጠቀም ይመከራል።",
    invalidPassword: "የይለፍ ቃሉ ቢያንስ 4 አሃዝ መሆን እና አሃዞች ብቻ መያዝ አለበት።",
    paymentInstructions:
      "💸 ክፍያ ያስፈልጋል: 200 ብር\n\n🏦 ንግድ ባንክ: 1000293836648 (Admassu Yano)\n📱 ቴሌብር: 0907667755 (Admassu Yano)\n\n📸 የከፈሉበትን ደረሰኝ ስክሪንሾት ይላኩ።",
    receiptOnly: "እባክዎ ደረሰኙን እንደ ምስል ይላኩ።",
    pendingReview: "ምዝገባዎ በምርመራ ላይ ነው። እባክዎ ለፍቃድ 30 ደቂቃ እስከ 1 ሰዓት ይጠብቁ።",
    alreadyApproved: "ምዝገባዎ ተፈቅዷል። የፈተናውን Mini App መጠቀም ይችላሉ።",
    rejectedStatus: "የቀድሞ ምዝገባዎ አልተፈቀደም። እንደገና መጀመር እና አዲስ ደረሰኝ ማስገባት ይችላሉ።",
    adminOnly: "ይህን እርምጃ ማድረግ የሚችሉት ፈቃድ ያላቸው አስተዳዳሪዎች ብቻ ናቸው።",
    adminApproved: "ምዝገባው ተፈቅዷል እና ተጠቃሚው ተገልጿል።",
    adminRejected: "ምዝገባው ተከልክሏል እና ተጠቃሚው ተገልጿል።",
    userApproved: "✅ ምዝገባዎ ተፈቅዷል። አሁን የፈተናውን Mini App መጠቀም ይችላሉ።",
    userRejected: "❌ ምዝገባዎ አልተፈቀደም። እባክዎ ድጋፍ ያግኙ ወይም ትክክለኛ ደረሰኝ ጋር እንደገና ያስገቡ።",
    reviewCaptionLabel: "የምዝገባ ግምገማ",
  },
};

export function getCopy(language: AppLanguage) {
  return BOT_COPY[language];
}
