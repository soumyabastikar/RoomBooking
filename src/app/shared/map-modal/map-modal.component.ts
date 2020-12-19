/// <reference types="@types/googlemaps" />
import { Component, OnInit } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit {
  height = 0;
  lat = 37.1761;
  lng = 3.5881;

  constructor(private modalCtrl: ModalController,public platform: Platform) {
    this.height = platform.height() - 56;
   }

  ngOnInit() {  
  }

  onCancel(){
    this.modalCtrl.dismiss();
  }

}
