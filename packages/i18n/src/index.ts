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
  | "identity.phoneSignInTitle"
  | "identity.phoneSignInBody"
  | "identity.localDemoCode"
  | "identity.requestCode"
  | "identity.verifyCode"
  | "identity.codeSent"
  | "identity.authError"
  | "identity.signOut"
  | "identity.localSession"
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
  | "marketplace.lifecycle.departed"
  | "marketplace.lifecycle.arrived"
  | "marketplace.lifecycle.inProgress"
  | "marketplace.lifecycle.completed"
  | "marketplace.lifecycle.contactVisible"
  | "marketplace.admin.activeOrderCancellation"
  | "chat.title"
  | "chat.disputeEvidence"
  | "chat.attachmentAccess"
  | "admin.chat.disputeReview"
  | "maps.liveTracking"
  | "maps.customerMarker"
  | "maps.providerMarker"
  | "maps.staleState"
  | "maps.helpNow"
  | "maps.orders"
  | "maps.profile"
  | "maps.location"
  | "maps.pickPoint"
  | "maps.createOrder"
  | "maps.closePanel"
  | "maps.customerMode"
  | "maps.online"
  | "maps.noActiveOrders"
  | "maps.categoriesLoading"
  | "maps.categoriesError"
  | "maps.orderCategory"
  | "maps.chooseCategory"
  | "maps.orderLandmark"
  | "maps.orderLandmarkPlaceholder"
  | "maps.orderDescription"
  | "maps.orderDescriptionPlaceholder"
  | "maps.orderPublish"
  | "maps.orderPublishing"
  | "maps.orderPublished"
  | "maps.publishError"
  | "maps.selectLocationFirst"
  | "admin.maps.activeOrderTracking"
  | "reputation.review"
  | "reputation.customerReliability"
  | "reputation.providerRating"
  | "reputation.publicReliability"
  | "reputation.completedOrders"
  | "reputation.cancellationRate"
  | "admin.sanctions.title"
  | "admin.sanctions.appeals"
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
  | "common.skipToContent"
  | "monitoring.errorTitle"
  | "monitoring.errorBody"
  | "monitoring.retry"
  | "monitoring.reported"
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
  "identity.phoneSignInTitle": "Войти в TezHelp",
  "identity.phoneSignInBody": "Введите номер телефона, чтобы открыть помощь на карте Алматы.",
  "identity.localDemoCode": "Локальный деморежим: код подтверждения 123456",
  "identity.requestCode": "Получить код",
  "identity.verifyCode": "Подтвердить и войти",
  "identity.codeSent": "Код отправлен. Введите шесть цифр.",
  "identity.authError": "Не удалось выполнить вход. Проверьте данные и попробуйте снова.",
  "identity.signOut": "Выйти",
  "identity.localSession": "Локальная демосессия",
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
  "marketplace.lifecycle.departed": "Исполнитель выехал",
  "marketplace.lifecycle.arrived": "Исполнитель прибыл",
  "marketplace.lifecycle.inProgress": "Работа началась",
  "marketplace.lifecycle.completed": "Заказ завершён",
  "marketplace.lifecycle.contactVisible": "Контакты открыты после выезда",
  "marketplace.admin.activeOrderCancellation": "Отмена активного заказа",
  "chat.title": "Чат заказа",
  "chat.disputeEvidence": "Переписка хранится для разбора споров",
  "chat.attachmentAccess": "Фото и голос открываются по аудируемой ссылке",
  "admin.chat.disputeReview": "Чат заказа для разбора спора",
  "maps.liveTracking": "Живое отслеживание",
  "maps.customerMarker": "Точка клиента",
  "maps.providerMarker": "Метка исполнителя",
  "maps.staleState": "Показана последняя известная точка",
  "maps.helpNow": "Нужна помощь",
  "maps.orders": "Заказы",
  "maps.profile": "Профиль",
  "maps.location": "Моё местоположение",
  "maps.pickPoint": "Нажмите на карту, чтобы указать место",
  "maps.createOrder": "Создать заказ",
  "maps.closePanel": "Закрыть",
  "maps.customerMode": "Режим клиента",
  "maps.online": "На связи",
  "maps.noActiveOrders": "Активных заказов пока нет",
  "maps.categoriesLoading": "Загружаем услуги",
  "maps.categoriesError": "Не удалось загрузить услуги",
  "maps.orderCategory": "Что случилось?",
  "maps.chooseCategory": "Выберите услугу",
  "maps.orderLandmark": "Ориентир или адрес",
  "maps.orderLandmarkPlaceholder": "Например, проспект Абая, рядом с АЗС",
  "maps.orderDescription": "Что нужно сделать",
  "maps.orderDescriptionPlaceholder": "Коротко опишите ситуацию",
  "maps.orderPublish": "Опубликовать заказ",
  "maps.orderPublishing": "Публикуем",
  "maps.orderPublished": "Заказ опубликован",
  "maps.publishError": "Не удалось опубликовать заказ. Попробуйте снова.",
  "maps.selectLocationFirst": "Сначала укажите точку на карте",
  "admin.maps.activeOrderTracking": "Отслеживание активного заказа",
  "reputation.review": "Отзыв после завершения заказа",
  "reputation.customerReliability": "Надежность клиента",
  "reputation.providerRating": "Рейтинг исполнителя по категории",
  "reputation.publicReliability": "Публичная надежность исполнителя",
  "reputation.completedOrders": "Завершенные заказы",
  "reputation.cancellationRate": "Доля отмен исполнителем",
  "admin.sanctions.title": "Санкции исполнителей",
  "admin.sanctions.appeals": "Апелляции по санкциям",
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
  "common.skipToContent": "Перейти к содержанию",
  "monitoring.errorTitle": "Что-то пошло не так",
  "monitoring.errorBody":
    "Мы подготовили безопасный отчет об ошибке без личных данных. Попробуйте обновить этот экран.",
  "monitoring.retry": "Попробовать снова",
  "monitoring.reported": "Отчет об ошибке подготовлен",
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
  "identity.phoneSignInTitle": "TezHelp жүйесіне кіру",
  "identity.phoneSignInBody": "Алматы картасындағы көмекті ашу үшін телефон нөмірін енгізіңіз.",
  "identity.localDemoCode": "Жергілікті деморежим: растау коды 123456",
  "identity.requestCode": "Код алу",
  "identity.verifyCode": "Растау және кіру",
  "identity.codeSent": "Код жіберілді. Алты санды енгізіңіз.",
  "identity.authError": "Кіру орындалмады. Деректерді тексеріп, қайта көріңіз.",
  "identity.signOut": "Шығу",
  "identity.localSession": "Жергілікті демосессия",
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
  "marketplace.lifecycle.departed": "Орындаушы жолға шықты",
  "marketplace.lifecycle.arrived": "Орындаушы келді",
  "marketplace.lifecycle.inProgress": "Жұмыс басталды",
  "marketplace.lifecycle.completed": "Тапсырыс аяқталды",
  "marketplace.lifecycle.contactVisible": "Байланыс жолға шыққаннан кейін ашылады",
  "marketplace.admin.activeOrderCancellation": "Белсенді тапсырысты тоқтату",
  "chat.title": "Тапсырыс чаты",
  "chat.disputeEvidence": "Хат алмасу дауды қарау үшін сақталады",
  "chat.attachmentAccess": "Фото мен дауыс аудителетін сілтемемен ашылады",
  "admin.chat.disputeReview": "Дауды қарауға арналған тапсырыс чаты",
  "maps.liveTracking": "Тікелей бақылау",
  "maps.customerMarker": "Клиент нүктесі",
  "maps.providerMarker": "Орындаушы белгісі",
  "maps.staleState": "Соңғы белгілі нүкте көрсетілді",
  "maps.helpNow": "Көмек керек",
  "maps.orders": "Тапсырыстар",
  "maps.profile": "Профиль",
  "maps.location": "Менің орналасуым",
  "maps.pickPoint": "Орынды көрсету үшін картаны басыңыз",
  "maps.createOrder": "Тапсырыс жасау",
  "maps.closePanel": "Жабу",
  "maps.customerMode": "Клиент режимі",
  "maps.online": "Байланыста",
  "maps.noActiveOrders": "Белсенді тапсырыстар әзірге жоқ",
  "maps.categoriesLoading": "Қызметтер жүктелуде",
  "maps.categoriesError": "Қызметтерді жүктеу мүмкін болмады",
  "maps.orderCategory": "Не болды?",
  "maps.chooseCategory": "Қызметті таңдаңыз",
  "maps.orderLandmark": "Бағдар немесе мекенжай",
  "maps.orderLandmarkPlaceholder": "Мысалы, Абай даңғылы, жанармай бекетінің жанында",
  "maps.orderDescription": "Не істеу керек",
  "maps.orderDescriptionPlaceholder": "Жағдайды қысқаша сипаттаңыз",
  "maps.orderPublish": "Тапсырысты жариялау",
  "maps.orderPublishing": "Жариялануда",
  "maps.orderPublished": "Тапсырыс жарияланды",
  "maps.publishError": "Тапсырысты жариялау мүмкін болмады. Қайта көріңіз.",
  "maps.selectLocationFirst": "Алдымен картадан нүктені таңдаңыз",
  "admin.maps.activeOrderTracking": "Белсенді тапсырысты бақылау",
  "reputation.review": "Тапсырыс аяқталғаннан кейінгі пікір",
  "reputation.customerReliability": "Клиент сенімділігі",
  "reputation.providerRating": "Санат бойынша орындаушы рейтингі",
  "reputation.publicReliability": "Орындаушының ашық сенімділігі",
  "reputation.completedOrders": "Аяқталған тапсырыстар",
  "reputation.cancellationRate": "Орындаушы тоқтатқан үлес",
  "admin.sanctions.title": "Орындаушылар санкциялары",
  "admin.sanctions.appeals": "Санкциялар бойынша апелляциялар",
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
  "common.skipToContent": "Мазмұнға өту",
  "monitoring.errorTitle": "Бірдеңе дұрыс болмады",
  "monitoring.errorBody":
    "Жеке дерексіз қауіпсіз қате есебі дайындалды. Экранды қайта жүктеп көріңіз.",
  "monitoring.retry": "Қайта көру",
  "monitoring.reported": "Қате есебі дайын",
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
  "identity.phoneSignInTitle": "Sign in to TezHelp",
  "identity.phoneSignInBody": "Enter your phone number to open roadside help on the Almaty map.",
  "identity.localDemoCode": "Local demo mode: confirmation code 123456",
  "identity.requestCode": "Get code",
  "identity.verifyCode": "Verify and sign in",
  "identity.codeSent": "Code sent. Enter the six digits.",
  "identity.authError": "Sign-in failed. Check the details and try again.",
  "identity.signOut": "Sign out",
  "identity.localSession": "Local demo session",
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
  "marketplace.lifecycle.departed": "Provider departed",
  "marketplace.lifecycle.arrived": "Provider arrived",
  "marketplace.lifecycle.inProgress": "Work started",
  "marketplace.lifecycle.completed": "Order completed",
  "marketplace.lifecycle.contactVisible": "Contacts open after departure",
  "marketplace.admin.activeOrderCancellation": "Active order cancellation",
  "chat.title": "Order chat",
  "chat.disputeEvidence": "Conversation is retained for dispute review",
  "chat.attachmentAccess": "Photos and voice are opened through audited links",
  "admin.chat.disputeReview": "Order chat for dispute review",
  "maps.liveTracking": "Live tracking",
  "maps.customerMarker": "Customer point",
  "maps.providerMarker": "Provider marker",
  "maps.staleState": "Last known point is shown",
  "maps.helpNow": "Need help",
  "maps.orders": "Orders",
  "maps.profile": "Profile",
  "maps.location": "My location",
  "maps.pickPoint": "Tap the map to choose the location",
  "maps.createOrder": "Create order",
  "maps.closePanel": "Close",
  "maps.customerMode": "Customer mode",
  "maps.online": "Online",
  "maps.noActiveOrders": "There are no active orders yet",
  "maps.categoriesLoading": "Loading services",
  "maps.categoriesError": "Services could not be loaded",
  "maps.orderCategory": "What happened?",
  "maps.chooseCategory": "Choose a service",
  "maps.orderLandmark": "Landmark or address",
  "maps.orderLandmarkPlaceholder": "For example, Abay Avenue near the fuel station",
  "maps.orderDescription": "What needs to be done",
  "maps.orderDescriptionPlaceholder": "Briefly describe the situation",
  "maps.orderPublish": "Publish order",
  "maps.orderPublishing": "Publishing",
  "maps.orderPublished": "Order published",
  "maps.publishError": "The order could not be published. Try again.",
  "maps.selectLocationFirst": "Choose a point on the map first",
  "admin.maps.activeOrderTracking": "Active order tracking",
  "reputation.review": "Review after completed order",
  "reputation.customerReliability": "Customer reliability",
  "reputation.providerRating": "Provider rating by category",
  "reputation.publicReliability": "Public provider reliability",
  "reputation.completedOrders": "Completed orders",
  "reputation.cancellationRate": "Provider cancellation rate",
  "admin.sanctions.title": "Provider sanctions",
  "admin.sanctions.appeals": "Sanction appeals",
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
  "common.skipToContent": "Skip to main content",
  "monitoring.errorTitle": "Something went wrong",
  "monitoring.errorBody":
    "A privacy-safe error report was prepared without personal data. Try refreshing this screen.",
  "monitoring.retry": "Try again",
  "monitoring.reported": "Error report prepared",
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
