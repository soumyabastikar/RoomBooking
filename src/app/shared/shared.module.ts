import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { MapModalComponent } from "./map-modal/map-modal.component";
import { LocationPickerComponent } from "./pickers/location-picker/location-picker.component";
import { AgmCoreModule } from '@agm/core';
import { ImagePickerComponent } from './picker/image-picker/image-picker.component';

@NgModule({
  declarations: [LocationPickerComponent, MapModalComponent, ImagePickerComponent],
  imports: [
    CommonModule,
    IonicModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyB3P1U1KZYcRvql3VMXl2-g5GQlaK6AVlQ",
    }),
  ],
  exports: [LocationPickerComponent, MapModalComponent,ImagePickerComponent],
  entryComponents: [MapModalComponent],
})
export class SharedModule {}
