import type { Locale } from "@tezhelp/types";

export type MessageKey =
  | "app.brand"
  | "web.customer.title"
  | "web.customer.subtitle"
  | "web.provider.title"
  | "web.provider.subtitle"
  | "web.nav.customer"
  | "web.nav.provider"
  | "identity.title"
  | "identity.subtitle"
  | "identity.google"
  | "identity.phone"
  | "identity.phonePlaceholder"
  | "identity.otp"
  | "identity.otpPlaceholder"
  | "identity.completePhone"
  | "identity.role"
  | "identity.roleCustomer"
  | "identity.roleProvider"
  | "identity.locale"
  | "identity.submit"
  | "admin.title"
  | "admin.authRequired"
  | "admin.authRequiredBody"
  | "common.status.foundation"
  | "common.language";

type Dictionary = Readonly<Record<MessageKey, string>>;

const ru: Dictionary = {
  "app.brand": "TezHelp",
  "web.customer.title": "Помощь на дороге рядом",
  "web.customer.subtitle":
    "Мобильная оболочка клиента готова к будущему API без бизнес-логики в интерфейсе.",
  "web.provider.title": "Рабочее место исполнителя",
  "web.provider.subtitle":
    "Отдельная оболочка провайдера подготовлена для будущих заказов и откликов.",
  "web.nav.customer": "Клиент",
  "web.nav.provider": "Исполнитель",
  "identity.title": "Вход и профиль",
  "identity.subtitle": "Подтвердите телефон, завершите профиль после Google и выберите роль.",
  "identity.google": "Войти через Google",
  "identity.phone": "Телефон",
  "identity.phonePlaceholder": "+77001234567",
  "identity.otp": "Код из SMS",
  "identity.otpPlaceholder": "123456",
  "identity.completePhone": "Телефон обязателен после Google",
  "identity.role": "Текущая роль",
  "identity.roleCustomer": "Клиент",
  "identity.roleProvider": "Исполнитель",
  "identity.locale": "Язык интерфейса",
  "identity.submit": "Продолжить",
  "admin.title": "Администрирование TezHelp",
  "admin.authRequired": "Требуется вход администратора",
  "admin.authRequiredBody":
    "Foundation не реализует fake auth. Реальная авторизация будет добавлена отдельной задачей.",
  "common.status.foundation": "Foundation готов",
  "common.language": "Язык",
};

const kk: Dictionary = {
  "app.brand": "TezHelp",
  "web.customer.title": "Жолдағы көмек жақын жерде",
  "web.customer.subtitle":
    "Клиенттің мобильді қабығы болашақ API үшін дайын, бизнес ережелері интерфейсте жоқ.",
  "web.provider.title": "Орындаушының жұмыс орны",
  "web.provider.subtitle": "Провайдер қабығы болашақ тапсырыстар мен ұсыныстарға дайындалды.",
  "web.nav.customer": "Клиент",
  "web.nav.provider": "Орындаушы",
  "identity.title": "Кіру және профиль",
  "identity.subtitle":
    "Телефонды растаңыз, Google-дан кейін профильді аяқтаңыз және рөлді таңдаңыз.",
  "identity.google": "Google арқылы кіру",
  "identity.phone": "Телефон",
  "identity.phonePlaceholder": "+77001234567",
  "identity.otp": "SMS коды",
  "identity.otpPlaceholder": "123456",
  "identity.completePhone": "Google-дан кейін телефон міндетті",
  "identity.role": "Ағымдағы рөл",
  "identity.roleCustomer": "Клиент",
  "identity.roleProvider": "Орындаушы",
  "identity.locale": "Интерфейс тілі",
  "identity.submit": "Жалғастыру",
  "admin.title": "TezHelp әкімшілігі",
  "admin.authRequired": "Әкімші ретінде кіру қажет",
  "admin.authRequiredBody":
    "Foundation fake auth қоспайды. Нақты авторизация бөлек тапсырмада қосылады.",
  "common.status.foundation": "Foundation дайын",
  "common.language": "Тіл",
};

const en: Dictionary = {
  "app.brand": "TezHelp",
  "web.customer.title": "Roadside help nearby",
  "web.customer.subtitle":
    "The mobile customer shell is ready for the future API without UI-owned business rules.",
  "web.provider.title": "Provider workspace",
  "web.provider.subtitle": "The provider shell is prepared for future orders and offers.",
  "web.nav.customer": "Customer",
  "web.nav.provider": "Provider",
  "identity.title": "Sign in and profile",
  "identity.subtitle": "Verify a phone, complete Google sign-in, and choose a role.",
  "identity.google": "Continue with Google",
  "identity.phone": "Phone",
  "identity.phonePlaceholder": "+77001234567",
  "identity.otp": "SMS code",
  "identity.otpPlaceholder": "123456",
  "identity.completePhone": "Phone is required after Google",
  "identity.role": "Current role",
  "identity.roleCustomer": "Customer",
  "identity.roleProvider": "Provider",
  "identity.locale": "Interface language",
  "identity.submit": "Continue",
  "admin.title": "TezHelp administration",
  "admin.authRequired": "Administrator sign-in required",
  "admin.authRequiredBody":
    "The foundation does not implement fake auth. Real authorization comes in a separate task.",
  "common.status.foundation": "Foundation ready",
  "common.language": "Language",
};

export const dictionaries: Readonly<Record<Locale, Dictionary>> = { ru, kk, en };

export const defaultLocale: Locale = "ru";

export function resolveLocale(locale: string | undefined): Locale {
  if (locale === "ru" || locale === "kk" || locale === "en") {
    return locale;
  }

  return defaultLocale;
}

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries[defaultLocale][key];
}
