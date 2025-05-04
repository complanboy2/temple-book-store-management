
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import translationTE from './locales/te/translation.json';
import translationTA from './locales/ta/translation.json';
import translationKN from './locales/kn/translation.json';
import translationMR from './locales/mr/translation.json';

// Additional translations
const additionalTranslationsEN = {
  common: {
    seller: "Seller",
    printingInstitute: "Printing Institute",
    contactPerson: "Contact Person",
    orderedBy: "Ordered By",
    lowStock: "Low Stock",
    addLowStock: "Add Low Stock",
    createOrder: "Create Order",
    processOrder: "Process Order",
    quantityThreshold: "Quantity Threshold",
    startDate: "Start Date",
    endDate: "End Date",
    generateReport: "Generate Report",
    profile: "Profile",
    settings: "Settings",
    languages: "Languages",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    system: "System",
    notifications: "Notifications",
    security: "Security",
    changePassword: "Change Password",
    logout: "Logout",
    confirmDelete: "Confirm Delete",
    areYouSure: "Are you sure you want to delete this item?",
    cantBeUndone: "This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    update: "Update",
    create: "Create",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    asc: "Ascending",
    desc: "Descending",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    noResults: "No results found",
    loadMore: "Load More",
    reload: "Reload",
    refresh: "Refresh",
    close: "Close",
    open: "Open"
  }
};

// Merge additional translations with existing ones
const mergedEN = {
  ...translationEN,
  common: {
    ...translationEN.common,
    ...additionalTranslationsEN.common
  },
  settings: {
    title: "Settings",
    language: "Language",
    appearance: "Appearance",
    notifications: "Notifications",
    security: "Security",
    about: "About"
  },
  languages: {
    english: "English",
    hindi: "Hindi",
    telugu: "Telugu",
    tamil: "Tamil",
    kannada: "Kannada",
    marathi: "Marathi"
  }
};

// Define resources with translations
const resources = {
  en: {
    translation: mergedEN
  },
  hi: {
    translation: {
      ...translationHI,
      common: {
        ...translationHI.common,
        seller: "विक्रेता",
        printingInstitute: "प्रिंटिंग संस्थान",
        contactPerson: "संपर्क व्यक्ति",
        orderedBy: "द्वारा आदेशित",
        lowStock: "कम स्टॉक",
        addLowStock: "कम स्टॉक जोड़ें",
        createOrder: "आदेश बनाएं",
        processOrder: "आदेश प्रोसेस करें"
      },
      settings: {
        title: "सेटिंग्स",
        language: "भाषा",
        appearance: "दिखावट",
        notifications: "सूचनाएँ",
        security: "सुरक्षा",
        about: "के बारे में"
      },
      languages: {
        english: "अंग्रेज़ी",
        hindi: "हिंदी",
        telugu: "तेलुगु",
        tamil: "तमिल",
        kannada: "कन्नड़",
        marathi: "मराठी"
      }
    }
  },
  te: {
    translation: {
      ...translationTE,
      common: {
        ...translationTE.common,
        seller: "విక్రేత",
        printingInstitute: "ప్రింటింగ్ సంస్థ",
        contactPerson: "సంప్రదింపు వ్యక్తి",
        orderedBy: "ఆర్డర్ చేసిన వ్యక్తి",
        lowStock: "తక్కువ స్టాక్",
        addLowStock: "తక్కువ స్టాక్ జోడించండి",
        createOrder: "ఆర్డర్ సృష్టించండి",
        processOrder: "ఆర్డర్ ప్రాసెస్ చేయండి"
      },
      settings: {
        title: "సెట్టింగ్‌లు",
        language: "భాష",
        appearance: "రూపం",
        notifications: "నోటిఫికేషన్లు",
        security: "భద్రత",
        about: "గురించి"
      },
      languages: {
        english: "ఆంగ్లం",
        hindi: "హిందీ",
        telugu: "తెలుగు",
        tamil: "తమిళం",
        kannada: "కన్నడ",
        marathi: "మరాఠీ"
      }
    }
  },
  ta: {
    translation: {
      ...translationTA,
      common: {
        ...translationTA.common,
        seller: "விற்பனையாளர்",
        printingInstitute: "அச்சகம் நிறுவனம்",
        contactPerson: "தொடர்பு நபர்",
        orderedBy: "உத்தரவிட்டவர்",
        lowStock: "குறைந்த சரக்கு",
        addLowStock: "குறைந்த சரக்கு சேர்க்க",
        createOrder: "ஆர்டர் உருவாக்க",
        processOrder: "ஆர்டரை செயலாக்க"
      },
      settings: {
        title: "அமைப்புகள்",
        language: "மொழி",
        appearance: "தோற்றம்",
        notifications: "அறிவிப்புகள்",
        security: "பாதுகாப்பு",
        about: "பற்றி"
      },
      languages: {
        english: "ஆங்கிலம்",
        hindi: "ஹிந்தி",
        telugu: "தெலுங்கு",
        tamil: "தமிழ்",
        kannada: "கன்னடம்",
        marathi: "மராத்தி"
      }
    }
  },
  kn: {
    translation: {
      ...translationKN,
      common: {
        ...translationKN.common,
        seller: "ಮಾರಾಟಗಾರ",
        printingInstitute: "ಮುದ್ರಣ ಸಂಸ್ಥೆ",
        contactPerson: "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ",
        orderedBy: "ಆದೇಶಿಸಿದವರು",
        lowStock: "ಕಡಿಮೆ ಸ್ಟಾಕ್",
        addLowStock: "ಕಡಿಮೆ ಸ್ಟಾಕ್ ಸೇರಿಸಿ",
        createOrder: "ಆದೇಶ ರಚಿಸಿ",
        processOrder: "ಆದೇಶವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿ"
      },
      settings: {
        title: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        language: "ಭಾಷೆ",
        appearance: "ಗೋಚರತೆ",
        notifications: "ಅಧಿಸೂಚನೆಗಳು",
        security: "ಭದ್ರತೆ",
        about: "ಬಗ್ಗೆ"
      },
      languages: {
        english: "ಇಂಗ್ಲಿಷ್",
        hindi: "ಹಿಂದಿ",
        telugu: "ತೆಲುಗು",
        tamil: "ತಮಿಳು",
        kannada: "ಕನ್ನಡ",
        marathi: "ಮರಾಠಿ"
      }
    }
  },
  mr: {
    translation: {
      ...translationMR,
      common: {
        ...translationMR.common,
        seller: "विक्रेता",
        printingInstitute: "मुद्रण संस्था",
        contactPerson: "संपर्क व्यक्ती",
        orderedBy: "यांनी ऑर्डर केली",
        lowStock: "कमी स्टॉक",
        addLowStock: "कमी स्टॉक जोडा",
        createOrder: "ऑर्डर तयार करा",
        processOrder: "ऑर्डर प्रक्रिया करा"
      },
      settings: {
        title: "सेटिंग्ज",
        language: "भाषा",
        appearance: "दिसणे",
        notifications: "सूचना",
        security: "सुरक्षितता",
        about: "बद्दल"
      },
      languages: {
        english: "इंग्रजी",
        hindi: "हिंदी",
        telugu: "तेलुगु",
        tamil: "तामिळ",
        kannada: "कन्नड",
        marathi: "मराठी"
      }
    }
  }
};

// Initialize i18next
i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    react: {
      useSuspense: false // This prevents issues with SSR and React 18
    }
  });

// Ensure default language is loaded
const savedLanguage = localStorage.getItem('i18nextLng');
if (savedLanguage) {
  i18n.changeLanguage(savedLanguage);
} else {
  i18n.changeLanguage('en');
}

export default i18n;
