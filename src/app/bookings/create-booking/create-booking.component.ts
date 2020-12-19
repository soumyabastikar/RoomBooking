import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { NgForm } from '@angular/forms';
import { ModalController, NavController } from "@ionic/angular";
import { Place } from "src/app/places/place.model";

@Component({
  selector: "app-create-booking",
  templateUrl: "./create-booking.component.html",
  styleUrls: ["./create-booking.component.scss"],
})
export class CreateBookingComponent implements OnInit {
  @Input() selectedPlace: Place;
  @Input() selectedMode: "select" | "random";
  @ViewChild('f', {static: true}) bookingForm : NgForm;
  startDate: string;
  endDate: string;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    const availableFrom = new Date(this.selectedPlace.availableFrom);
    const availableTo = new Date(this.selectedPlace.availableTo);
    if (this.selectedMode === "random") {
      this.startDate = new Date(
        availableFrom.getTime() +
          Math.random() *
            (availableTo.getTime() -
              7 * 24 * 60 * 60 * 1000 -
              availableFrom.getTime())
      ).toISOString();

      this.endDate = new Date(
        new Date(this.startDate).getTime() +
          Math.random() * (new Date(this.startDate).getTime() +
          6 * 24 * 60 * 60 * 1000 -
          new Date(this.startDate).getTime())
      ).toISOString();
    }
  }

  onBookPlace() {
    if(!this.bookingForm.valid || !this.datesValid){
      return;
    }    
    this.modalCtrl.dismiss({
      bookingData: {
        firstName: this.bookingForm.value['first-name'],
        lastName: this.bookingForm.value['last-name'],
        guestNumber: +this.bookingForm.value['guest-number'],
        startDate: this.bookingForm.value['date-from'],
        endDate: this.bookingForm.value['date-to']
      }
    }, "confirm");
  }

  onCancel() {    
    this.modalCtrl.dismiss(null, "cancel");
  }

  datesValid(){
    const startDate = new Date(this.bookingForm.value['date-from']);
    const endDate = new Date(this.bookingForm.value['date-to']);
    return endDate > startDate;
  }
}
