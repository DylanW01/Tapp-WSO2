import { Component, Inject, OnInit } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { LoginResponse, OidcSecurityService } from "angular-auth-oidc-client";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { filter, map, Observable } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "Tapp";
  public isAuthenticated$!: Observable<boolean>;

  constructor(public oidcSecurityService: OidcSecurityService, private _router: Router) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe((loginResponse: LoginResponse) => {
      const { isAuthenticated, userData, accessToken, idToken, configId } = loginResponse;

      /*...*/
    });
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
  }
}
