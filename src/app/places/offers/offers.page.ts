import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { IonItemSliding } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit,OnDestroy {
offers: Place[];
isLoading = false;
private placesSub: Subscription;
  constructor(private placeService: PlacesService, private router: Router) { }

  ngOnInit() {
    this.placeService.places.subscribe(places => {
      this.offers = places;
    });
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.placeService.fetchPlaces().subscribe(res => {
      this.isLoading = false;
    });
  }

  onEdit(offerId: string, slidingItem: IonItemSliding){
    console.log('edit called');
    slidingItem.close();
    this.router.navigate(['/','places','tabs','offers','edit',offerId]);
  }

  ngOnDestroy(){
    if(this.placesSub){
      this.placesSub.unsubscribe();
    }
  }

}
