import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../configuration/configuration.module.js";
import { DevelopmentPrivateObjectStorage } from "./development-private-object-storage.js";
import { PRIVATE_OBJECT_STORAGE } from "./private-object-storage.port.js";

@Module({
  imports: [ConfigurationModule],
  providers: [
    DevelopmentPrivateObjectStorage,
    { provide: PRIVATE_OBJECT_STORAGE, useExisting: DevelopmentPrivateObjectStorage },
  ],
  exports: [PRIVATE_OBJECT_STORAGE],
})
export class StorageModule {}
