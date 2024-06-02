import { NgModule } from "@angular/core";
import { initializeApp } from "@angular/fire/app";
import { connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import { connectFirestoreEmulator, getFirestore, initializeFirestore, provideFirestore } from "@angular/fire/firestore";
import { connectFunctionsEmulator, getFunctions, provideFunctions } from "@angular/fire/functions";
import { connectStorageEmulator, getStorage, provideStorage } from "@angular/fire/storage";
import { environment } from "src/environments/environment";
import { AuthService } from "./services/auth.service";
import { CardDeckService } from "./services/card-deck.service";
import { FileUploadService } from "./services/file-upload.service";
import { EstimatorService } from "./services/estimator.service";
import { JiraService } from "./services/jira.service";
import { LinearService } from "./services/linear.service";
import { MeetApiService } from "./services/meet-api.service";
import { MeteredUsageService } from "./services/metered-usage.service";
import { OrganizationService } from "./services/organization.service";
import { PaymentService } from "./services/payment.service";
import { PermissionsService } from "./services/permissions.service";
import { ReactionsService } from "./services/reactions.service";
import { RecurringMeetingLinkService } from "./services/recurring-meeting-link.service";
import { TeamsService } from "./services/teams.service";
import { WebexApiService } from "./services/webex-api.service";
import { RoomResolver } from "./room/room.resolver";
import { RoomDataService } from "./room/room-data.service";

@NgModule({
    imports: [
      provideFirestore(() => {
        let firestore;
        if (environment.useEmulators) {
          const app = initializeApp(environment.firebase);
          firestore = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
          });
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        } else {
          firestore = getFirestore();
        }
        return firestore;
      }),
      provideAuth(() => {
        const auth = getAuth();
        if (environment.useEmulators) {
          connectAuthEmulator(auth, 'http://localhost:9099', {
            disableWarnings: true,
          });
        }
        return auth;
      }),
      provideStorage(() => {
        const storage = getStorage();
        if (environment.useEmulators) {
          connectStorageEmulator(storage, 'localhost', 9199);
        }
        return storage;
      }),
      provideFunctions(() => {
        const functions = getFunctions();
        if (environment.useEmulators) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
        }
        return functions;
      }),
    ],
    providers: [
        AuthService,
        CardDeckService,
        FileUploadService,
        EstimatorService,
        JiraService,
        LinearService,
        MeetApiService,
        MeteredUsageService,
        OrganizationService,
        PaymentService,
        PermissionsService,
        ReactionsService,
        RecurringMeetingLinkService,
        TeamsService,
        WebexApiService,
        RoomResolver,
        RoomDataService
    ]
  })
export class FirebaseModule {}