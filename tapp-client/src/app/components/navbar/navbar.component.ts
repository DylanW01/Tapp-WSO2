import { Component, OnInit, ElementRef, Inject } from "@angular/core";
import { ROUTES } from "../sidebar/sidebar.component";
import { Location, LocationStrategy, PathLocationStrategy } from "@angular/common";
import { Router } from "@angular/router";
import { filter, map, Observable } from "rxjs";
import { OidcSecurityService } from "angular-auth-oidc-client";

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnInit {
  public focus;
  public listTitles: any[];
  public location: Location;
  userData$: any;
  constructor(location: Location, private element: ElementRef, private router: Router, public oidcSecurityService: OidcSecurityService) {
    this.location = location;
  }

  public ngOnInit(): void {
    this.listTitles = ROUTES.filter((listTitle) => listTitle);
    this.oidcSecurityService.getUserData().subscribe((userData) => {
      this.userData$ = userData;
    });
  }

  getTitle() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === "#") {
      titlee = titlee.slice(1);
    }

    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }
    return "Dashboard";
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
  }
}
