import { Module } from "@nestjs/common";

import { ChatModule } from "../chat/chat.module.js";
import { AuditModule } from "../foundation/audit/audit.module.js";
import { ConfigurationModule } from "../foundation/configuration/configuration.module.js";
import { DatabaseModule } from "../foundation/database/database.module.js";
import { HealthModule } from "../foundation/health/health.module.js";
import { HttpFoundationModule } from "../foundation/http/http-foundation.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { LiveLocationModule } from "../live-location/live-location.module.js";
import { ModerationModule } from "../moderation/moderation.module.js";
import { OffersModule } from "../offers/offers.module.js";
import { OrdersModule } from "../orders/orders.module.js";
import { ProviderServicesModule } from "../provider-services/provider-services.module.js";
import { ReputationModule } from "../reputation/reputation.module.js";
import { ServiceCatalogModule } from "../service-catalog/service-catalog.module.js";
import { WalletModule } from "../wallet/wallet.module.js";

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    AuditModule,
    HttpFoundationModule,
    HealthModule,
    IdentityModule,
    ServiceCatalogModule,
    ProviderServicesModule,
    ModerationModule,
    WalletModule,
    OrdersModule,
    OffersModule,
    ChatModule,
    LiveLocationModule,
    ReputationModule,
  ],
})
export class ApiRootModule {}
