import { NgModule } from "@angular/core";
import { AuthModule } from "angular-auth-oidc-client";

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: "https://localhost:9443/oauth2/authorize",
        redirectUrl: "https://localhost:4200/",
        postLogoutRedirectUri: window.location.origin,
        clientId: "jQmbznK8c9mg90UftWYzfOtUmuwa",
        scope: "openid profile email offline_access", // 'openid profile offline_access ' + your scopes
        responseType: "code",
        silentRenew: true,
        useRefreshToken: true,
        secureRoutes: ["http://localhost:8080/"],
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
