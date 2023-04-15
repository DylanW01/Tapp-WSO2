import { Component, OnInit } from "@angular/core";
import { ServerService } from "src/app/server.service";

@Component({
  selector: "app-header-info-cards",
  templateUrl: "./header-info-cards.component.html",
  styleUrls: ["./header-info-cards.component.scss"],
})
export class HeaderInfoCardsComponent implements OnInit {
  constructor(private server: ServerService) {}

  totalBowsers: number;
  activeBowsers: number;
  pendingTickets: number;
  activeTickets: number;

  ngOnInit(): void {
    this.getBowserCount();
    this.getActiveBowsers();
    this.getPendingTickets();
    this.geActiveTickets();
  }

  getBowserCount() {
    this.server.getBowsersCount().then((response: any[]) => {
      this.totalBowsers =  response[0]["COUNT(*)"];
    });
  }

  getActiveBowsers() {
    this.server.getActiveBowserCount().then((response: any[]) => {
      this.activeBowsers =  response[0]["COUNT(*)"];
    });
  }

  getPendingTickets() {
    this.server.getPendingTicketCount().then((response: any[]) => {
      this.pendingTickets =  response[0]["COUNT(*)"];
    });
  }

  geActiveTickets() {
    this.server.getActiveTicketCount().then((response: any[]) => {
      this.activeTickets =  response[0]["COUNT(*)"];
    });
  }
}
