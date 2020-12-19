import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  NavController,
} from "@ionic/angular";
import { Subscription } from "rxjs";
import { switchMap,take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { BookingService } from "src/app/bookings/booking.service";
import { CreateBookingComponent } from "src/app/bookings/create-booking/create-booking.component";
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';
import { Place } from "../../place.model";
import { PlacesService } from "../../places.service";

@Component({
  selector: "app-place-details",
  templateUrl: "./place-details.page.html",
  styleUrls: ["./place-details.page.scss"],
})
export class PlaceDetailsPage implements OnInit, OnDestroy {
  place: Place;
  isBookable = false;
  placesSub: Subscription;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has("placeId")) {
        this.navCtrl.navigateBack("/places/tabs/discover");
        return;
      }
      let fetchedUserId : string;
      this.authService.userId.pipe(take(1),switchMap(userId => {
        if(!userId){
          throw new Error('Found no user!');           
        } 
        fetchedUserId = userId;
        return this.placesService
        .getPlace(paramMap.get("placeId"));
      })).subscribe((place) => {          
          this.place = place;
          this.isBookable = place.userId !== fetchedUserId;
          this.isLoading = false;
        }, error => {
          this.isLoading = false;
          this.alertCtrl.create({
            header: 'An error ocurred!',
            message: 'Could not load place.',
            buttons: [{
              text: 'Okay', handler: () => {
                this.router.navigate(['/places/tabs/discover']);
              }
            }]
          }).then(alertEl => {
            alertEl.present();
          })
        });
      });
  }

  onBookPlace() {
    this.actionSheetCtrl
      .create({
        header: "Choose an Action",
        buttons: [
          {
            text: "Select Date",
            handler: () => {
              this.openBookingModal("select");
            },
          },
          {
            text: "Random Date",
            handler: () => {
              this.openBookingModal("random");
            },
          },
          {
            text: "Cancel",
            role: "destructive",
          },
        ],
      })
      .then((actionSheetEl) => {
        actionSheetEl.present();
      });

    // this.router.navigateByUrl('/places/tabs/discover');
    // this.navCtrl.navigateBack("/places/tabs/discover");    //adds backward animation
    // this.navCtrl.pop(); pops all the pages present in the stack. This won't work on refresh page. as there wont be any pages on the stack.
  }

  openBookingModal(mode: "select" | "random") {
    console.log(mode);
    this.modalCtrl
      .create({
        component: CreateBookingComponent,
        componentProps: { selectedPlace: this.place, selectedMode: mode },
      })
      .then((modalEl) => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then((resultData) => {
        let result: any = resultData.data.bookingData;
        if (resultData.role === "confirm") {
          this.loadingCtrl.create({
            message: 'Booking place..'
          }).then(loadingEl => {
            loadingEl.present();
            this.bookingService.addBooking(
              this.place.id,
              this.place.title,
              this.place.imageUrl,
              result.firstName,
              result.lastName,
              result.guestNumber,
              result.startDate,
              result.endDate
            ).subscribe(res => {
              console.log(res);
              loadingEl.dismiss();
              this.navCtrl.navigateBack("/places/tabs/discover");
            });
          })
          

        }
      });
  }

  onShowFullMap(){
    this.modalCtrl.create({
      component: MapModalComponent
    }).then(modalEl => {
      modalEl.present();
    });
  }

  ngOnDestroy() {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }
}
