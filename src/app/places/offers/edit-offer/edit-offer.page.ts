import { Component, OnDestroy, OnInit } from "@angular/core";
import { Place } from "../../place.model";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, LoadingController, NavController } from "@ionic/angular";
import { PlacesService } from "../../places.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subscription } from "rxjs";

@Component({
  selector: "app-edit-offer",
  templateUrl: "./edit-offer.page.html",
  styleUrls: ["./edit-offer.page.scss"],
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  editForm: FormGroup;
  placesSub: Subscription;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private loadingCtrl: LoadingController,
    private alertCtrl : AlertController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has("placeId")) {
        this.navCtrl.navigateBack("/places/tabs/offers");
        return;
      }
      this.isLoading = true;
      this.placesSub = this.placesService
        .getPlace(paramMap.get("placeId"))
        .subscribe((place) => {
          this.place = place;
          this.editForm = new FormGroup({
            title: new FormControl(this.place.title, {
              updateOn: "blur",
              validators: [Validators.required],
            }),
            description: new FormControl(this.place.description, {
              updateOn: "blur",
              validators: [Validators.required, Validators.maxLength(180)],
            }),
          });
          this.isLoading = false;
        }, error => {
          this.isLoading = false;
          this.alertCtrl.create({
            header: 'An error occurred!',
            message: 'Place could not be fetched. Please try again later.',
            buttons: [{text: 'Okay', handler: () => {
              this.router.navigate(['/places/tabs/offers']);
            }}]
          }).then(alertEl => {
            alertEl.present();
          })
        });
    });
  }

  onEditOffer() {
    if (!this.editForm.valid) {
      return;
    } else {
      this.loadingCtrl
        .create({
          message: "Creating place..",
        })
        .then((loadingEL) => {
          loadingEL.present();
          this.placesService
            .updatePlace(
              this.place.id,
              this.editForm.value.title,
              this.editForm.value.description
            )
            .subscribe(() => {
              loadingEL.dismiss();
              this.editForm.reset();
              this.router.navigate(["/places/tabs/offers"]);
            });
        });
    }
  }

  ngOnDestroy() {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }
}
