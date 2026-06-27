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
  | "providerOnboarding.title"
  | "providerOnboarding.loading"
  | "providerOnboarding.loadError"
  | "providerOnboarding.profileSaved"
  | "providerOnboarding.displayName"
  | "providerOnboarding.iin"
  | "providerOnboarding.city"
  | "providerOnboarding.taxStatus"
  | "providerOnboarding.chooseTaxStatus"
  | "providerOnboarding.taxIp"
  | "providerOnboarding.taxSelfEmployed"
  | "providerOnboarding.savingProfile"
  | "providerOnboarding.saveProfile"
  | "providerOnboarding.identityDocuments"
  | "providerOnboarding.facePhoto"
  | "providerOnboarding.identityDocument"
  | "providerOnboarding.chooseCategory"
  | "providerOnboarding.addCategory"
  | "providerOnboarding.submitError"
  | "providerOnboarding.submitting"
  | "providerOnboarding.submit"
  | "providerOnboarding.completeRequired"
  | "providerOnboarding.documentMissing"
  | "providerOnboarding.uploadError"
  | "providerOnboarding.uploading"
  | "providerOnboarding.replaceDocument"
  | "providerOnboarding.uploadDocument"
  | "providerOnboarding.status.draft"
  | "providerOnboarding.status.submitted"
  | "providerOnboarding.status.under_review"
  | "providerOnboarding.status.approved"
  | "providerOnboarding.status.rejected"
  | "providerOnboarding.status.suspended"
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
  | "chat.inputPlaceholder"
  | "chat.send"
  | "chat.empty"
  | "chat.openChat"
  | "chat.closeChat"
  | "admin.chat.disputeReview"
  | "maps.liveTracking"
  | "maps.customerMarker"
  | "maps.providerMarker"
  | "maps.staleState"
  | "maps.helpNow"
  | "maps.orders"
  | "maps.profile"
  | "maps.location"
  | "maps.locating"
  | "maps.locationError"
  | "maps.pickPoint"
  | "maps.createOrder"
  | "maps.closePanel"
  | "maps.customerMode"
  | "maps.providerMode"
  | "maps.switchToCustomer"
  | "maps.switchToProvider"
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
  | "offers.title"
  | "offers.empty"
  | "offers.select"
  | "offers.selecting"
  | "offers.arrival"
  | "offers.cancelOrder"
  | "offers.cancelReason"
  | "offers.confirmCancel"
  | "offers.selectError"
  | "offers.cancelError"
  | "review.title"
  | "review.prompt"
  | "review.commentPlaceholder"
  | "review.submit"
  | "review.submitting"
  | "review.submitted"
  | "review.skip"
  | "review.error"
  | "order.status.provider_selected"
  | "order.status.provider_en_route"
  | "order.status.provider_arrived"
  | "order.status.in_progress"
  | "order.status.completed"
  | "order.status.cancelled_by_customer"
  | "order.status.cancelled_by_provider"
  | "order.status.cancelled_by_admin"
  | "provider.feedTitle"
  | "provider.feedEmpty"
  | "provider.feedUnavailable"
  | "provider.walletBalance"
  | "provider.freeResponses"
  | "provider.offerCount"
  | "provider.distance"
  | "provider.openOrder"
  | "provider.offerPrice"
  | "provider.arrivalMinutes"
  | "provider.offerComment"
  | "provider.offerCommentPlaceholder"
  | "provider.submitOffer"
  | "provider.submittingOffer"
  | "provider.offerSubmitted"
  | "provider.offerError"
  | "provider.activeOrder"
  | "provider.depart"
  | "provider.arrive"
  | "provider.startWork"
  | "provider.complete"
  | "provider.cancelOrder"
  | "provider.cancelReason"
  | "provider.confirmCancel"
  | "provider.cancelError"
  | "provider.actionError"
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
  | "admin.developmentAccess"
  | "admin.developmentAccessBody"
  | "admin.moderation.title"
  | "admin.moderation.queue"
  | "admin.moderation.filters"
  | "admin.moderation.overdue"
  | "admin.moderation.review"
  | "admin.moderation.approve"
  | "admin.moderation.reject"
  | "admin.moderation.suspend"
  | "admin.moderation.audit"
  | "admin.moderation.statusFilter"
  | "admin.moderation.categoryFilter"
  | "admin.moderation.activeQueue"
  | "admin.moderation.allCategories"
  | "admin.moderation.loading"
  | "admin.moderation.loadError"
  | "admin.moderation.empty"
  | "admin.moderation.selectSubmission"
  | "admin.moderation.loadingDetail"
  | "admin.moderation.detailError"
  | "admin.moderation.iin"
  | "admin.moderation.city"
  | "admin.moderation.taxStatus"
  | "admin.moderation.documentVersion"
  | "admin.moderation.generalDocuments"
  | "admin.moderation.categoryDocuments"
  | "admin.moderation.noDocuments"
  | "admin.moderation.openDocument"
  | "admin.moderation.documentError"
  | "admin.moderation.noHistory"
  | "admin.moderation.decisionReason"
  | "admin.moderation.reasonPlaceholder"
  | "admin.moderation.startReview"
  | "admin.moderation.actionError"
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
  "providerOnboarding.title": "Профиль исполнителя",
  "providerOnboarding.loading": "Загружаем профиль",
  "providerOnboarding.loadError": "Не удалось загрузить профиль исполнителя.",
  "providerOnboarding.profileSaved": "Профиль сохранен",
  "providerOnboarding.displayName": "Имя или название",
  "providerOnboarding.iin": "ИИН",
  "providerOnboarding.city": "Город",
  "providerOnboarding.taxStatus": "Налоговый статус",
  "providerOnboarding.chooseTaxStatus": "Выберите статус",
  "providerOnboarding.taxIp": "Индивидуальный предприниматель",
  "providerOnboarding.taxSelfEmployed": "Самозанятый / специальный налоговый режим",
  "providerOnboarding.savingProfile": "Сохраняем",
  "providerOnboarding.saveProfile": "Сохранить профиль",
  "providerOnboarding.identityDocuments": "Документы личности",
  "providerOnboarding.facePhoto": "Фотография лица",
  "providerOnboarding.identityDocument": "Удостоверение личности",
  "providerOnboarding.chooseCategory": "Выберите категорию услуги",
  "providerOnboarding.addCategory": "Добавить категорию",
  "providerOnboarding.submitError": "Не удалось отправить категорию на модерацию.",
  "providerOnboarding.submitting": "Отправляем",
  "providerOnboarding.submit": "Отправить на модерацию",
  "providerOnboarding.completeRequired": "Заполните профиль и загрузите обязательные документы.",
  "providerOnboarding.documentMissing": "Документ не загружен",
  "providerOnboarding.uploadError": "Не удалось загрузить файл",
  "providerOnboarding.uploading": "Загрузка",
  "providerOnboarding.replaceDocument": "Заменить",
  "providerOnboarding.uploadDocument": "Загрузить",
  "providerOnboarding.status.draft": "Черновик",
  "providerOnboarding.status.submitted": "Отправлен",
  "providerOnboarding.status.under_review": "На проверке",
  "providerOnboarding.status.approved": "Одобрен",
  "providerOnboarding.status.rejected": "Отклонен",
  "providerOnboarding.status.suspended": "Приостановлен",
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
  "chat.inputPlaceholder": "Сообщение...",
  "chat.send": "Отправить",
  "chat.empty": "Напишите первое сообщение исполнителю",
  "chat.openChat": "Открыть чат",
  "chat.closeChat": "Закрыть чат",
  "admin.chat.disputeReview": "Чат заказа для разбора спора",
  "maps.liveTracking": "Живое отслеживание",
  "maps.customerMarker": "Точка клиента",
  "maps.providerMarker": "Метка исполнителя",
  "maps.staleState": "Показана последняя известная точка",
  "maps.helpNow": "Нужна помощь",
  "maps.orders": "Заказы",
  "maps.profile": "Профиль",
  "maps.location": "Моё местоположение",
  "maps.locating": "Определяем...",
  "maps.locationError": "Не удалось определить местоположение",
  "maps.pickPoint": "Нажмите на карту, чтобы указать место",
  "maps.createOrder": "Создать заказ",
  "maps.closePanel": "Закрыть",
  "maps.customerMode": "Режим клиента",
  "maps.providerMode": "Режим исполнителя",
  "maps.switchToCustomer": "Перейти в режим клиента",
  "maps.switchToProvider": "Перейти в режим исполнителя",
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
  "offers.title": "Отклики исполнителей",
  "offers.empty": "Ждём откликов…",
  "offers.select": "Выбрать",
  "offers.selecting": "Выбираем…",
  "offers.arrival": "мин",
  "offers.cancelOrder": "Отменить заказ",
  "offers.cancelReason": "Причина отмены",
  "offers.confirmCancel": "Подтвердить отмену",
  "offers.selectError": "Не удалось выбрать исполнителя. Попробуйте снова.",
  "offers.cancelError": "Не удалось отменить заказ.",
  "review.title": "Оцените исполнителя",
  "review.prompt": "Как прошёл заказ?",
  "review.commentPlaceholder": "Оставьте комментарий (необязательно)",
  "review.submit": "Отправить отзыв",
  "review.submitting": "Отправка...",
  "review.submitted": "Спасибо за отзыв!",
  "review.skip": "Пропустить",
  "review.error": "Не удалось отправить отзыв. Попробуйте снова.",
  "order.status.provider_selected": "Исполнитель выбран — ожидайте выезда",
  "order.status.provider_en_route": "Исполнитель едет к вам",
  "order.status.provider_arrived": "Исполнитель прибыл",
  "order.status.in_progress": "Выполняется",
  "order.status.completed": "Заказ выполнен",
  "order.status.cancelled_by_customer": "Вы отменили заказ",
  "order.status.cancelled_by_provider": "Исполнитель отменил заказ",
  "order.status.cancelled_by_admin": "Заказ отменён администратором",
  "provider.feedTitle": "Доступные заказы",
  "provider.feedEmpty": "Подходящих заказов пока нет",
  "provider.feedUnavailable": "Лента недоступна. Проверьте профиль и модерацию категорий.",
  "provider.walletBalance": "Доступный баланс",
  "provider.freeResponses": "Бесплатные отклики",
  "provider.offerCount": "Откликов",
  "provider.distance": "Расстояние",
  "provider.openOrder": "Открыть заказ",
  "provider.offerPrice": "Ваша цена, KZT",
  "provider.arrivalMinutes": "Прибытие, минут",
  "provider.offerComment": "Комментарий",
  "provider.offerCommentPlaceholder": "Уточните условия и время прибытия",
  "provider.submitOffer": "Отправить отклик",
  "provider.submittingOffer": "Отправляем",
  "provider.offerSubmitted": "Отклик опубликован",
  "provider.offerError": "Не удалось отправить отклик. Проверьте баланс и доступность профиля.",
  "provider.activeOrder": "Активный заказ",
  "provider.depart": "Выехал",
  "provider.arrive": "Прибыл",
  "provider.startWork": "Начать работу",
  "provider.complete": "Завершить заказ",
  "provider.cancelOrder": "Отменить заказ",
  "provider.cancelReason": "Причина отмены",
  "provider.confirmCancel": "Подтвердить отмену",
  "provider.cancelError": "Не удалось отменить заказ.",
  "provider.actionError": "Не удалось выполнить действие.",
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
  "admin.developmentAccess": "Локальный доступ",
  "admin.developmentAccessBody":
    "Войдите по тестовому OTP. Пользователь используется только как аудируемый модератор локальной среды.",
  "admin.moderation.title": "Ручная модерация исполнителей",
  "admin.moderation.queue": "Очередь проверок",
  "admin.moderation.filters": "Фильтры",
  "admin.moderation.overdue": "Просрочено SLA",
  "admin.moderation.review": "Проверка профиля и документов",
  "admin.moderation.approve": "Одобрить",
  "admin.moderation.reject": "Отклонить",
  "admin.moderation.suspend": "Приостановить категорию",
  "admin.moderation.audit": "История аудита",
  "admin.moderation.statusFilter": "Статус",
  "admin.moderation.categoryFilter": "Категория",
  "admin.moderation.activeQueue": "Активная очередь",
  "admin.moderation.allCategories": "Все категории",
  "admin.moderation.loading": "Загружаем очередь",
  "admin.moderation.loadError": "Не удалось загрузить очередь модерации.",
  "admin.moderation.empty": "Заявок по выбранным фильтрам нет",
  "admin.moderation.selectSubmission": "Выберите заявку слева для проверки",
  "admin.moderation.loadingDetail": "Загружаем заявку",
  "admin.moderation.detailError": "Не удалось загрузить заявку.",
  "admin.moderation.iin": "ИИН",
  "admin.moderation.city": "Город",
  "admin.moderation.taxStatus": "Налоговый статус",
  "admin.moderation.documentVersion": "Версия документов",
  "admin.moderation.generalDocuments": "Общие документы",
  "admin.moderation.categoryDocuments": "Документы категории",
  "admin.moderation.noDocuments": "Документы не загружены",
  "admin.moderation.openDocument": "Открыть",
  "admin.moderation.documentError": "Не удалось открыть документ",
  "admin.moderation.noHistory": "История пока пуста",
  "admin.moderation.decisionReason": "Причина решения",
  "admin.moderation.reasonPlaceholder": "Опишите основание решения",
  "admin.moderation.startReview": "Начать проверку",
  "admin.moderation.actionError": "Не удалось выполнить действие модерации.",
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
  "providerOnboarding.title": "Орындаушы профилі",
  "providerOnboarding.loading": "Профиль жүктелуде",
  "providerOnboarding.loadError": "Орындаушы профилін жүктеу мүмкін болмады.",
  "providerOnboarding.profileSaved": "Профиль сақталды",
  "providerOnboarding.displayName": "Аты немесе атауы",
  "providerOnboarding.iin": "ЖСН",
  "providerOnboarding.city": "Қала",
  "providerOnboarding.taxStatus": "Салық мәртебесі",
  "providerOnboarding.chooseTaxStatus": "Мәртебені таңдаңыз",
  "providerOnboarding.taxIp": "Жеке кәсіпкер",
  "providerOnboarding.taxSelfEmployed": "Өзін-өзі жұмыспен қамтыған / арнайы салық режимі",
  "providerOnboarding.savingProfile": "Сақталуда",
  "providerOnboarding.saveProfile": "Профильді сақтау",
  "providerOnboarding.identityDocuments": "Жеке бас құжаттары",
  "providerOnboarding.facePhoto": "Бет фотосуреті",
  "providerOnboarding.identityDocument": "Жеке куәлік",
  "providerOnboarding.chooseCategory": "Қызмет санатын таңдаңыз",
  "providerOnboarding.addCategory": "Санат қосу",
  "providerOnboarding.submitError": "Санатты модерацияға жіберу мүмкін болмады.",
  "providerOnboarding.submitting": "Жіберілуде",
  "providerOnboarding.submit": "Модерацияға жіберу",
  "providerOnboarding.completeRequired": "Профильді толтырып, міндетті құжаттарды жүктеңіз.",
  "providerOnboarding.documentMissing": "Құжат жүктелмеген",
  "providerOnboarding.uploadError": "Файлды жүктеу мүмкін болмады",
  "providerOnboarding.uploading": "Жүктелуде",
  "providerOnboarding.replaceDocument": "Ауыстыру",
  "providerOnboarding.uploadDocument": "Жүктеу",
  "providerOnboarding.status.draft": "Жоба",
  "providerOnboarding.status.submitted": "Жіберілді",
  "providerOnboarding.status.under_review": "Тексерілуде",
  "providerOnboarding.status.approved": "Мақұлданды",
  "providerOnboarding.status.rejected": "Қабылданбады",
  "providerOnboarding.status.suspended": "Тоқтатылды",
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
  "chat.inputPlaceholder": "Хабарлама...",
  "chat.send": "Жіберу",
  "chat.empty": "Орындаушыға алғашқы хабарламаны жіберіңіз",
  "chat.openChat": "Чатты ашу",
  "chat.closeChat": "Чатты жабу",
  "admin.chat.disputeReview": "Дауды қарауға арналған тапсырыс чаты",
  "maps.liveTracking": "Тікелей бақылау",
  "maps.customerMarker": "Клиент нүктесі",
  "maps.providerMarker": "Орындаушы белгісі",
  "maps.staleState": "Соңғы белгілі нүкте көрсетілді",
  "maps.helpNow": "Көмек керек",
  "maps.orders": "Тапсырыстар",
  "maps.profile": "Профиль",
  "maps.location": "Менің орналасуым",
  "maps.locating": "Анықталуда...",
  "maps.locationError": "Орналасуды анықтау мүмкін болмады",
  "maps.pickPoint": "Орынды көрсету үшін картаны басыңыз",
  "maps.createOrder": "Тапсырыс жасау",
  "maps.closePanel": "Жабу",
  "maps.customerMode": "Клиент режимі",
  "maps.providerMode": "Орындаушы режимі",
  "maps.switchToCustomer": "Клиент режиміне өту",
  "maps.switchToProvider": "Орындаушы режиміне өту",
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
  "offers.title": "Орындаушылардың жауаптары",
  "offers.empty": "Жауаптар күтілуде…",
  "offers.select": "Таңдау",
  "offers.selecting": "Таңдалуда…",
  "offers.arrival": "мин",
  "offers.cancelOrder": "Тапсырысты бас тарту",
  "offers.cancelReason": "Бас тарту себебі",
  "offers.confirmCancel": "Бас тартуды растау",
  "offers.selectError": "Орындаушыны таңдау мүмкін болмады. Қайта көріңіз.",
  "offers.cancelError": "Тапсырысты бас тарту мүмкін болмады.",
  "review.title": "Орындаушыны бағалаңыз",
  "review.prompt": "Тапсырыс қалай өтті?",
  "review.commentPlaceholder": "Пікір қалдырыңыз (міндетті емес)",
  "review.submit": "Пікір жіберу",
  "review.submitting": "Жіберілуде...",
  "review.submitted": "Пікіріңіз үшін рахмет!",
  "review.skip": "Өткізіп жіберу",
  "review.error": "Пікір жіберу мүмкін болмады. Қайта көріңіз.",
  "order.status.provider_selected": "Орындаушы таңдалды — шығуды күтіңіз",
  "order.status.provider_en_route": "Орындаушы сізге келе жатыр",
  "order.status.provider_arrived": "Орындаушы жетті",
  "order.status.in_progress": "Орындалуда",
  "order.status.completed": "Тапсырыс орындалды",
  "order.status.cancelled_by_customer": "Сіз тапсырысты бас тарттыңыз",
  "order.status.cancelled_by_provider": "Орындаушы тапсырысты бас тартты",
  "order.status.cancelled_by_admin": "Тапсырыс әкімші тарапынан бас тартылды",
  "provider.feedTitle": "Қолжетімді тапсырыстар",
  "provider.feedEmpty": "Сәйкес тапсырыстар әзірге жоқ",
  "provider.feedUnavailable": "Лента қолжетімсіз. Профиль мен санат модерациясын тексеріңіз.",
  "provider.walletBalance": "Қолжетімді баланс",
  "provider.freeResponses": "Тегін жауаптар",
  "provider.offerCount": "Жауаптар",
  "provider.distance": "Қашықтық",
  "provider.openOrder": "Тапсырысты ашу",
  "provider.offerPrice": "Сіздің бағаңыз, KZT",
  "provider.arrivalMinutes": "Келу уақыты, минут",
  "provider.offerComment": "Түсініктеме",
  "provider.offerCommentPlaceholder": "Шарттар мен келу уақытын жазыңыз",
  "provider.submitOffer": "Жауап жіберу",
  "provider.submittingOffer": "Жіберілуде",
  "provider.offerSubmitted": "Жауап жарияланды",
  "provider.offerError": "Жауап жіберілмеді. Баланс пен профиль қолжетімділігін тексеріңіз.",
  "provider.activeOrder": "Белсенді тапсырыс",
  "provider.depart": "Шықтым",
  "provider.arrive": "Жеттім",
  "provider.startWork": "Жұмысты бастау",
  "provider.complete": "Тапсырысты аяқтау",
  "provider.cancelOrder": "Тапсырысты бас тарту",
  "provider.cancelReason": "Бас тарту себебі",
  "provider.confirmCancel": "Бас тартуды растау",
  "provider.cancelError": "Тапсырысты бас тарту мүмкін болмады.",
  "provider.actionError": "Әрекетті орындау мүмкін болмады.",
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
  "admin.developmentAccess": "Жергілікті қолжетімділік",
  "admin.developmentAccessBody":
    "Тестілік OTP арқылы кіріңіз. Пайдаланушы тек жергілікті ортаның аудиттелетін модераторы ретінде қолданылады.",
  "admin.moderation.title": "Орындаушыларды қолмен модерациялау",
  "admin.moderation.queue": "Тексеру кезегі",
  "admin.moderation.filters": "Сүзгілер",
  "admin.moderation.overdue": "SLA мерзімі өтті",
  "admin.moderation.review": "Профиль мен құжаттарды тексеру",
  "admin.moderation.approve": "Мақұлдау",
  "admin.moderation.reject": "Қабылдамау",
  "admin.moderation.suspend": "Санатты тоқтату",
  "admin.moderation.audit": "Аудит тарихы",
  "admin.moderation.statusFilter": "Мәртебе",
  "admin.moderation.categoryFilter": "Санат",
  "admin.moderation.activeQueue": "Белсенді кезек",
  "admin.moderation.allCategories": "Барлық санаттар",
  "admin.moderation.loading": "Кезек жүктелуде",
  "admin.moderation.loadError": "Модерация кезегін жүктеу мүмкін болмады.",
  "admin.moderation.empty": "Таңдалған сүзгілер бойынша өтінім жоқ",
  "admin.moderation.selectSubmission": "Тексеру үшін сол жақтан өтінімді таңдаңыз",
  "admin.moderation.loadingDetail": "Өтінім жүктелуде",
  "admin.moderation.detailError": "Өтінімді жүктеу мүмкін болмады.",
  "admin.moderation.iin": "ЖСН",
  "admin.moderation.city": "Қала",
  "admin.moderation.taxStatus": "Салық мәртебесі",
  "admin.moderation.documentVersion": "Құжат нұсқасы",
  "admin.moderation.generalDocuments": "Жалпы құжаттар",
  "admin.moderation.categoryDocuments": "Санат құжаттары",
  "admin.moderation.noDocuments": "Құжаттар жүктелмеген",
  "admin.moderation.openDocument": "Ашу",
  "admin.moderation.documentError": "Құжатты ашу мүмкін болмады",
  "admin.moderation.noHistory": "Тарих әзірге бос",
  "admin.moderation.decisionReason": "Шешім себебі",
  "admin.moderation.reasonPlaceholder": "Шешімнің негізін жазыңыз",
  "admin.moderation.startReview": "Тексеруді бастау",
  "admin.moderation.actionError": "Модерация әрекетін орындау мүмкін болмады.",
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
  "providerOnboarding.title": "Provider profile",
  "providerOnboarding.loading": "Loading profile",
  "providerOnboarding.loadError": "The provider profile could not be loaded.",
  "providerOnboarding.profileSaved": "Profile saved",
  "providerOnboarding.displayName": "Name or business name",
  "providerOnboarding.iin": "IIN",
  "providerOnboarding.city": "City",
  "providerOnboarding.taxStatus": "Tax status",
  "providerOnboarding.chooseTaxStatus": "Choose status",
  "providerOnboarding.taxIp": "Individual entrepreneur",
  "providerOnboarding.taxSelfEmployed": "Self-employed / special tax regime",
  "providerOnboarding.savingProfile": "Saving",
  "providerOnboarding.saveProfile": "Save profile",
  "providerOnboarding.identityDocuments": "Identity documents",
  "providerOnboarding.facePhoto": "Face photo",
  "providerOnboarding.identityDocument": "Identity document",
  "providerOnboarding.chooseCategory": "Choose a service category",
  "providerOnboarding.addCategory": "Add category",
  "providerOnboarding.submitError": "The category could not be submitted for moderation.",
  "providerOnboarding.submitting": "Submitting",
  "providerOnboarding.submit": "Submit for moderation",
  "providerOnboarding.completeRequired": "Complete the profile and upload required documents.",
  "providerOnboarding.documentMissing": "Document not uploaded",
  "providerOnboarding.uploadError": "The file could not be uploaded",
  "providerOnboarding.uploading": "Uploading",
  "providerOnboarding.replaceDocument": "Replace",
  "providerOnboarding.uploadDocument": "Upload",
  "providerOnboarding.status.draft": "Draft",
  "providerOnboarding.status.submitted": "Submitted",
  "providerOnboarding.status.under_review": "Under review",
  "providerOnboarding.status.approved": "Approved",
  "providerOnboarding.status.rejected": "Rejected",
  "providerOnboarding.status.suspended": "Suspended",
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
  "chat.inputPlaceholder": "Message...",
  "chat.send": "Send",
  "chat.empty": "Send your first message to the provider",
  "chat.openChat": "Open chat",
  "chat.closeChat": "Close chat",
  "admin.chat.disputeReview": "Order chat for dispute review",
  "maps.liveTracking": "Live tracking",
  "maps.customerMarker": "Customer point",
  "maps.providerMarker": "Provider marker",
  "maps.staleState": "Last known point is shown",
  "maps.helpNow": "Need help",
  "maps.orders": "Orders",
  "maps.profile": "Profile",
  "maps.location": "My location",
  "maps.locating": "Locating...",
  "maps.locationError": "Could not determine location",
  "maps.pickPoint": "Tap the map to choose the location",
  "maps.createOrder": "Create order",
  "maps.closePanel": "Close",
  "maps.customerMode": "Customer mode",
  "maps.providerMode": "Provider mode",
  "maps.switchToCustomer": "Switch to customer mode",
  "maps.switchToProvider": "Switch to provider mode",
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
  "offers.title": "Provider offers",
  "offers.empty": "Waiting for offers…",
  "offers.select": "Select",
  "offers.selecting": "Selecting…",
  "offers.arrival": "min",
  "offers.cancelOrder": "Cancel order",
  "offers.cancelReason": "Reason for cancellation",
  "offers.confirmCancel": "Confirm cancellation",
  "offers.selectError": "Could not select provider. Please try again.",
  "offers.cancelError": "Could not cancel the order.",
  "review.title": "Rate your provider",
  "review.prompt": "How did the service go?",
  "review.commentPlaceholder": "Leave a comment (optional)",
  "review.submit": "Submit review",
  "review.submitting": "Submitting...",
  "review.submitted": "Thank you for your feedback!",
  "review.skip": "Skip",
  "review.error": "Could not submit review. Please try again.",
  "order.status.provider_selected": "Provider selected — awaiting departure",
  "order.status.provider_en_route": "Provider is on the way",
  "order.status.provider_arrived": "Provider has arrived",
  "order.status.in_progress": "In progress",
  "order.status.completed": "Order completed",
  "order.status.cancelled_by_customer": "You cancelled the order",
  "order.status.cancelled_by_provider": "Provider cancelled the order",
  "order.status.cancelled_by_admin": "Order cancelled by administrator",
  "provider.feedTitle": "Available orders",
  "provider.feedEmpty": "There are no matching orders yet",
  "provider.feedUnavailable": "The feed is unavailable. Check profile and category moderation.",
  "provider.walletBalance": "Available balance",
  "provider.freeResponses": "Free responses",
  "provider.offerCount": "Offers",
  "provider.distance": "Distance",
  "provider.openOrder": "Open order",
  "provider.offerPrice": "Your price, KZT",
  "provider.arrivalMinutes": "Arrival, minutes",
  "provider.offerComment": "Comment",
  "provider.offerCommentPlaceholder": "Clarify terms and arrival time",
  "provider.submitOffer": "Submit offer",
  "provider.submittingOffer": "Submitting",
  "provider.offerSubmitted": "Offer published",
  "provider.offerError": "Offer failed. Check balance and service-profile eligibility.",
  "provider.activeOrder": "Active order",
  "provider.depart": "Departed",
  "provider.arrive": "Arrived",
  "provider.startWork": "Start work",
  "provider.complete": "Complete order",
  "provider.cancelOrder": "Cancel order",
  "provider.cancelReason": "Reason for cancellation",
  "provider.confirmCancel": "Confirm cancellation",
  "provider.cancelError": "Could not cancel the order.",
  "provider.actionError": "Could not perform action.",
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
  "admin.developmentAccess": "Local access",
  "admin.developmentAccessBody":
    "Sign in with the test OTP. The user is used only as an audited moderator in the local environment.",
  "admin.moderation.title": "Manual provider moderation",
  "admin.moderation.queue": "Review queue",
  "admin.moderation.filters": "Filters",
  "admin.moderation.overdue": "SLA overdue",
  "admin.moderation.review": "Profile and document review",
  "admin.moderation.approve": "Approve",
  "admin.moderation.reject": "Reject",
  "admin.moderation.suspend": "Suspend category",
  "admin.moderation.audit": "Audit history",
  "admin.moderation.statusFilter": "Status",
  "admin.moderation.categoryFilter": "Category",
  "admin.moderation.activeQueue": "Active queue",
  "admin.moderation.allCategories": "All categories",
  "admin.moderation.loading": "Loading queue",
  "admin.moderation.loadError": "The moderation queue could not be loaded.",
  "admin.moderation.empty": "No submissions match the selected filters",
  "admin.moderation.selectSubmission": "Select a submission on the left to review it",
  "admin.moderation.loadingDetail": "Loading submission",
  "admin.moderation.detailError": "The submission could not be loaded.",
  "admin.moderation.iin": "IIN",
  "admin.moderation.city": "City",
  "admin.moderation.taxStatus": "Tax status",
  "admin.moderation.documentVersion": "Document version",
  "admin.moderation.generalDocuments": "General documents",
  "admin.moderation.categoryDocuments": "Category documents",
  "admin.moderation.noDocuments": "No documents uploaded",
  "admin.moderation.openDocument": "Open",
  "admin.moderation.documentError": "The document could not be opened",
  "admin.moderation.noHistory": "No history yet",
  "admin.moderation.decisionReason": "Decision reason",
  "admin.moderation.reasonPlaceholder": "Describe the basis for the decision",
  "admin.moderation.startReview": "Start review",
  "admin.moderation.actionError": "The moderation action could not be completed.",
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
