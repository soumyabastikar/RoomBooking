import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Booking } from './booking.model';
import { BookingService } from './booking.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  bookingSub: Subscription;
  isLoading = false;

  constructor(private bookingService: BookingService, private loadingCtrl: LoadingController) { }

  ngOnInit() {
    this.bookingSub =  this.bookingService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
      console.log(this.loadedBookings);
    });
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.bookingService.fetchBookings().subscribe( res => {
      this.isLoading = false;
      console.log(this.loadedBookings);
    });
  }  

  onCancelBooking(bookingId: string, slidingBooking: IonItemSliding){
    slidingBooking.close();
    this.loadingCtrl.create({
      message: 'Cancelling Booking..'
    }).then(loadingEl => {
      loadingEl.present();
      this.bookingService.cancelBooking(bookingId).subscribe(res => {
        loadingEl.dismiss();
      });
    });

  }

  ngOnDestroy(){
    if(this.bookingSub){
      this.bookingSub.unsubscribe();
    }
  }

}
