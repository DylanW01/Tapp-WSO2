import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";
import { AuthLayoutComponent } from "./layouts/auth-layout/auth-layout.component";
import { CommonModule } from "@angular/common";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ToastrModule } from "ngx-toastr";
import { AppRoutingModule } from "./app-routing.module";
import { ComponentsModule } from "./components/components.module";
import { NgxUiLoaderModule, NgxUiLoaderConfig, SPINNER, POSITION, PB_DIRECTION, NgxUiLoaderRouterModule, NgxUiLoaderHttpModule } from "ngx-ui-loader";
import { AuthConfigModule } from "./auth/auth-config.module";
import { AuthInterceptor } from "angular-auth-oidc-client";

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  bgsColor: "$default",
  bgsOpacity: 1,
  bgsPosition: "bottom-right",
  delay: 100,
  maxTime: 30000,
  bgsType: "rectangle-bounce",
  blur: 5,
  fgsColor: "$default",
  fgsPosition: "center-center",
  fgsType: "rectangle-bounce",
  logoUrl: "../assets/img/brand/tapp-logos_transparent_icon.png",
  overlayColor: "rgba(40, 40, 40, 0.8)",
  pbColor: "$default",
};

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 10000,
      progressBar: true,
    }),
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    NgxUiLoaderModule,
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    NgxUiLoaderHttpModule.forRoot({ delay: 100, maxTime: 10000 }),
    NgxUiLoaderRouterModule.forRoot({ showForeground: false }),
    AuthConfigModule,
  ],
  declarations: [AppComponent, AdminLayoutComponent, AuthLayoutComponent],
  providers: [HttpClient, { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
