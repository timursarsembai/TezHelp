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
  | "providerModeration.title"
  | "providerModeration.subtitle"
  | "providerModeration.generalProfile"
  | "providerModeration.categorySelection"
  | "providerModeration.documents"
  | "providerModeration.perCategoryStatus"
  | "providerModeration.rejectionReason"
  | "providerModeration.resubmit"
  | "marketplace.order.title"
  | "marketplace.order.publish"
  | "marketplace.provider.discovery"
  | "marketplace.provider.offer"
  | "marketplace.provider.wallet"
  | "marketplace.admin.ledger"
  | "marketplace.admin.commercialConfig"
  | "admin.title"
  | "admin.authRequired"
  | "admin.authRequiredBody"
  | "admin.moderation.title"
  | "admin.moderation.queue"
  | "admin.moderation.filters"
  | "admin.moderation.overdue"
  | "admin.moderation.review"
  | "admin.moderation.approve"
  | "admin.moderation.reject"
  | "admin.moderation.suspend"
  | "admin.moderation.audit"
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
  "providerModeration.title": "Модерация услуг исполнителя",
  "providerModeration.subtitle":
    "Заполните общий профиль, выберите категории и отправьте документы на отдельную проверку.",
  "providerModeration.generalProfile": "Общий профиль",
  "providerModeration.categorySelection": "Категории услуг",
  "providerModeration.documents": "Приватные документы",
  "providerModeration.perCategoryStatus": "Статус по каждой категории",
  "providerModeration.rejectionReason": "Причина отказа",
  "providerModeration.resubmit": "Отправить повторно",
  "marketplace.order.title": "Заказ помощи на дороге",
  "marketplace.order.publish": "Опубликовать заказ",
  "marketplace.provider.discovery": "Лента доступных заказов",
  "marketplace.provider.offer": "Отправить отклик",
  "marketplace.provider.wallet": "Баланс и бесплатные отклики",
  "marketplace.admin.ledger": "Журнал кошелька",
  "marketplace.admin.commercialConfig": "Тарифы и комиссии категорий",
  "admin.title": "Администрирование TezHelp",
  "admin.authRequired": "Требуется вход администратора",
  "admin.authRequiredBody":
    "Foundation не реализует fake auth. Реальная авторизация будет добавлена отдельной задачей.",
  "admin.moderation.title": "Ручная модерация исполнителей",
  "admin.moderation.queue": "Очередь проверок",
  "admin.moderation.filters": "Фильтры",
  "admin.moderation.overdue": "Просрочено SLA",
  "admin.moderation.review": "Проверка профиля и документов",
  "admin.moderation.approve": "Одобрить",
  "admin.moderation.reject": "Отклонить",
  "admin.moderation.suspend": "Приостановить категорию",
  "admin.moderation.audit": "История аудита",
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
  "providerModeration.title": "Орындаушы қызметтерін модерациялау",
  "providerModeration.subtitle":
    "Жалпы профильді толтырып, санаттарды таңдаңыз және құжаттарды бөлек тексеруге жіберіңіз.",
  "providerModeration.generalProfile": "Жалпы профиль",
  "providerModeration.categorySelection": "Қызмет санаттары",
  "providerModeration.documents": "Жеке құжаттар",
  "providerModeration.perCategoryStatus": "Әр санаттың мәртебесі",
  "providerModeration.rejectionReason": "Бас тарту себебі",
  "providerModeration.resubmit": "Қайта жіберу",
  "marketplace.order.title": "Жолдағы көмекке тапсырыс",
  "marketplace.order.publish": "Тапсырысты жариялау",
  "marketplace.provider.discovery": "Қолжетімді тапсырыстар лентасы",
  "marketplace.provider.offer": "Ұсыныс жіберу",
  "marketplace.provider.wallet": "Баланс және тегін жауаптар",
  "marketplace.admin.ledger": "Әмиян журналы",
  "marketplace.admin.commercialConfig": "Санат тарифтері мен комиссиялары",
  "admin.title": "TezHelp әкімшілігі",
  "admin.authRequired": "Әкімші ретінде кіру қажет",
  "admin.authRequiredBody":
    "Foundation fake auth қоспайды. Нақты авторизация бөлек тапсырмада қосылады.",
  "admin.moderation.title": "Орындаушыларды қолмен модерациялау",
  "admin.moderation.queue": "Тексеру кезегі",
  "admin.moderation.filters": "Сүзгілер",
  "admin.moderation.overdue": "SLA мерзімі өтті",
  "admin.moderation.review": "Профиль мен құжаттарды тексеру",
  "admin.moderation.approve": "Мақұлдау",
  "admin.moderation.reject": "Қабылдамау",
  "admin.moderation.suspend": "Санатты тоқтату",
  "admin.moderation.audit": "Аудит тарихы",
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
  "providerModeration.title": "Provider service moderation",
  "providerModeration.subtitle":
    "Complete the general profile, choose categories, and submit private documents for separate review.",
  "providerModeration.generalProfile": "General profile",
  "providerModeration.categorySelection": "Service categories",
  "providerModeration.documents": "Private documents",
  "providerModeration.perCategoryStatus": "Per-category status",
  "providerModeration.rejectionReason": "Rejection reason",
  "providerModeration.resubmit": "Resubmit",
  "marketplace.order.title": "Roadside assistance order",
  "marketplace.order.publish": "Publish order",
  "marketplace.provider.discovery": "Available order feed",
  "marketplace.provider.offer": "Submit offer",
  "marketplace.provider.wallet": "Balance and free responses",
  "marketplace.admin.ledger": "Wallet ledger",
  "marketplace.admin.commercialConfig": "Category tariffs and commissions",
  "admin.title": "TezHelp administration",
  "admin.authRequired": "Administrator sign-in required",
  "admin.authRequiredBody":
    "The foundation does not implement fake auth. Real authorization comes in a separate task.",
  "admin.moderation.title": "Manual provider moderation",
  "admin.moderation.queue": "Review queue",
  "admin.moderation.filters": "Filters",
  "admin.moderation.overdue": "SLA overdue",
  "admin.moderation.review": "Profile and document review",
  "admin.moderation.approve": "Approve",
  "admin.moderation.reject": "Reject",
  "admin.moderation.suspend": "Suspend category",
  "admin.moderation.audit": "Audit history",
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
