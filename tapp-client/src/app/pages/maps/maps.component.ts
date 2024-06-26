import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Observable, map, catchError, of } from "rxjs";
import { ServerService } from "src/app/server.service";

declare var google: any;

@Component({
  selector: "app-maps",
  templateUrl: "./maps.component.html",
  styleUrls: ["./maps.component.scss"],
})
export class MapsComponent implements OnInit {
  apiLoaded: Observable<boolean>;
  timeout;
  interval: NodeJS.Timer;

  // ---- MAP INIT ----
  constructor(httpClient: HttpClient, private ngxLoader: NgxUiLoaderService, private toastr: ToastrService, private server: ServerService) {
    this.apiLoaded = httpClient.jsonp("https://maps.googleapis.com/maps/api/js?key=AIzaSyASHU1WvCipdeZGJoIeI-TQkLKoPur3PDE", "callback").pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // ---- BOWSER MARKER ICONS ----
  center: google.maps.LatLngLiteral = { lat: 51.8994, lng: -2.0783 };
  userLocationIcon = {
    url: "https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",
    scaledSize: new google.maps.Size(35, 35),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17.5, 17.5),
  };
  bowserIcon = {
    url: "https://maps.google.com/mapfiles/kml/shapes/water.png",
    scaledSize: new google.maps.Size(35, 35),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17.5, 17.5),
  };
  bowserSpannerIcon = {
    url: "https://maps.google.com/mapfiles/kml/shapes/mechanic.png",
    scaledSize: new google.maps.Size(35, 35),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17.5, 17.5),
  };
  bowserOfflineIcon = {
    url: "https://maps.google.com/mapfiles/kml/shapes/caution.png",
    scaledSize: new google.maps.Size(35, 35),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17.5, 17.5),
  };

  // ---- ICON OPTIONS ----
  userMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    icon: this.userLocationIcon,
  };
  bowserMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    icon: this.bowserIcon,
  };
  bowserSpannerMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    icon: this.bowserSpannerIcon,
  };
  bowserOfflineMarkerOptions: google.maps.MarkerOptions = {
    draggable: false,
    icon: this.bowserOfflineIcon,
  };

  // ---- INIT LOCATION ARRAY ----
  bowsersPositions: google.maps.LatLngLiteral[] = [];
  bowserSpannerPositions: google.maps.LatLngLiteral[] = [];
  bowserOfflinePositions: google.maps.LatLngLiteral[] = [];
  userLocation: google.maps.LatLngLiteral[] = [];

  // ---- MAP OPTIONS ----
  options: google.maps.MapOptions = {
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    styles: [
      {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [{ color: "#444444" }],
      },
      {
        featureType: "landscape",
        elementType: "all",
        stylers: [{ color: "#f2f2f2" }],
      },
      {
        featureType: "poi",
        elementType: "all",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "road",
        elementType: "all",
        stylers: [{ saturation: -100 }, { lightness: 45 }],
      },
      {
        featureType: "road.highway",
        elementType: "all",
        stylers: [{ visibility: "simplified" }],
      },
      {
        featureType: "road.arterial",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "transit",
        elementType: "all",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "water",
        elementType: "all",
        stylers: [{ color: "#5e72e4" }, { visibility: "on" }],
      },
    ],
  };

  // ------- END OF MAP SETUP -------

  ngOnInit() {
    this.ngxLoader.start();
    this.timeout = setTimeout(() => {
      this.ngxLoader.stop();
      this.toastr.warning("Please allow location access to use the maps feature", "Cannot find location");
    }, 10000);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.userLocation.push({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        this.center = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.ngxLoader.stop();
        clearTimeout(this.timeout);
      });
    } else {
      this.ngxLoader.stop();
      this.toastr.warning("Please allow location access to use the maps feature", "Cannot find location");
    }
    this.getBowsersForMap();
    this.autoRefresh();
  }

  autoRefresh() {
    this.interval = setInterval(() => {
      this.getBowsersForMap();
    }, 30000);
  }

  populateBowserMap(bowsers) {
    this.bowsersPositions = [];
    this.bowserOfflinePositions = [];
    this.bowserSpannerPositions = [];
    bowsers.forEach((bowser) => {
      if (bowser.status === "Active") {
        this.bowsersPositions.push({
          lat: bowser.lat,
          lng: bowser.lon,
        });
      } else if (bowser.status === "Inactive") {
        this.bowserOfflinePositions.push({
          lat: bowser.lat,
          lng: bowser.lon,
        });
      } else if (bowser.status === "Problematic") {
        this.bowserSpannerPositions.push({
          lat: bowser.lat,
          lng: bowser.lon,
        });
      }
    });
  }

  ngOnDestroy() {
    this.ngxLoader.stopBackground();
    clearTimeout(this.timeout);
  }

  addActiveBowser(event) {
    this.bowsersPositions.push(event.latLng.toJSON());
  }
  addInactiveBowser(event) {
    this.bowserOfflinePositions.push(event.latLng.toJSON());
  }
  addProblematicBowser(event) {
    this.bowserSpannerPositions.push(event.latLng.toJSON());
  }

  private getBowsersForMap() {
    this.server.getBowsers().then((response: any[]) => {
      this.populateBowserMap(response);
    });
  }
}
