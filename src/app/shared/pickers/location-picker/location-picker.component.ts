import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { Coordinates, PlaceLocation } from './location.model';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Plugins, Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit, OnDestroy {
@Output() locationPick = new EventEmitter<PlaceLocation>();
@Input() showPreview = false;
selectedLocationImage : string;
isLoading = false;
clickListener: any;

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private http: HttpClient,
    private alertCtrl: AlertController
    ) { }

  ngOnInit() {}

  onPickLocation(){
    this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {text: 'Auto-Locate', handler: ()=>{ this.locateUser()}},
        {text: 'Pick on Map', handler: ()=>{ this.openMap() }},
        {text: 'Cancel', role: 'cancel'},
      ]
    }).then(asEl => {
      asEl.present();
    });
  }

  private locateUser(){
   if(!Capacitor.isPluginAvailable('Geolocation')){
    this.showErrorAlert();
    return;
    }
    this.isLoading = true;
    Plugins.Geolocation.getCurrentPosition()
    .then(geoPosition => {
      const coordinates: Coordinates = { lat: geoPosition.coords.latitude, lng: geoPosition.coords.longitude}
      this.createPlace(coordinates);
      this.isLoading = false;
    })
    .catch(err => {
      this.isLoading = false;
      this.showErrorAlert();
    })
  }

  private showErrorAlert(){
    this.alertCtrl.create({
      header: 'Could not fetch location',
      message: 'Please use the map to pick a location!',
      buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

  private openMap() {
    this.modalCtrl.create({
      component: MapModalComponent
    }).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if (!modalData.data){
          return;
        } 
        const coordinates: Coordinates = { lat: modalData.data.lat, lng:  modalData.data.lng}
        this.createPlace(coordinates);
      })
      modalEl.present();      
    });
  }

  private createPlace(coordinates : Coordinates) {
    const pickedLocation: PlaceLocation = {
      lat: coordinates.lat,
      lng: coordinates.lng,
      address: null,
      staticMapImageUrl: null
    }
    this.isLoading = true;
    this.getAddress(coordinates.lat,coordinates.lng).pipe(switchMap(address => {
      pickedLocation.address = address;
      return of(this.getMapImage(pickedLocation.lat,pickedLocation.lng,14))
    })).subscribe(staticMapImageUrl => {
      pickedLocation.staticMapImageUrl = staticMapImageUrl;
      this.selectedLocationImage = staticMapImageUrl;
      this.isLoading = false;
    });
  }

  private getAddress(lat: number, lng: number){
    return this.http
    .get<any>(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${
        environment.googleMapsAPIKey
      }`
    ).pipe(map((geoData:any)  => {
      if(!geoData ||  !geoData.results || geoData.results.length == 0){
        return null;
      } else {
        return geoData.results[0].formatted_address;
      }
    }));
  }

  getMapImage(lat: number, lng: number, zoom: number){
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}
    &key=${environment.googleMapsAPIKey}`;
  }

  ngOnDestroy(){

  }

}
