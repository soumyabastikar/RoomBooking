import { Injectable } from "@angular/core";
import { BehaviorSubject, of } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { Place } from "./place.model";
import { take, map, tap, delay, switchMap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { PlaceLocation } from '../shared/pickers/location-picker/location.model';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: "root",
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]);

  get places() {
    return this._places;
  }

  getPlace(id: string) {
   return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http
      .get<PlaceData>(
        `https://ionic-angular-sb.firebaseio.com/offered-places/${id}.json?auth=${token}`
      )
    }),
        map((placeData) => {
          return new Place(
            id,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.availableFrom),
            new Date(placeData.availableTo),
            placeData.userId,
            placeData.location
          );
        })
      );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    image: string,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation
  ) {
    let generatedId: string;
    let newPlace: Place;
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.authService.token
      }),
      take(1),
      switchMap(token => {
      if(!fetchedUserId){
        throw new Error('UserId not found!');
      }
      newPlace = new Place(
        Math.random().toString(),
        title,
        description,
        image,
        price,
        dateFrom,
        dateTo,
        fetchedUserId,
        location
      );
      return this.http
      .post<{ name: string }>(
        `https://ionic-angular-sb.firebaseio.com/offered-places.json?auth=${token}`,
        {
          ...newPlace,
          id: null,
        }
      )
    }),
        switchMap((resData) => {
          generatedId = resData.name;
          return this.places;
        }),
        take(1),
        tap((places) => {
          newPlace.id = generatedId;
          this._places.next(places.concat(newPlace));
        })
      );
  }

  updatePlace(
    placeId: string,
    title: string,
    description: string
  ) {
    let updatedPlaces: Place[];
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.places.pipe(
        take(1),
        switchMap((places) => {
          if(!places || places.length <= 0){
            return this.fetchPlaces();
          } else {
            return of(places);
          }
        }),
        switchMap(places => {
          const updatedPlaceIndex = places.findIndex((pl) => pl.id === placeId);
          updatedPlaces = [...places];
          const oldPlace = updatedPlaces[updatedPlaceIndex];
          updatedPlaces[updatedPlaceIndex] = new Place(
            oldPlace.id,
            title,
            description,
            oldPlace.imageUrl,
            oldPlace.price,
            oldPlace.availableFrom,
            oldPlace.availableTo,
            oldPlace.userId,
            oldPlace.location
          );
          return this.http.put(
            `https://ionic-angular-sb.firebaseio.com/offered-places/${placeId}.json?auth=${token}`,
            { ...updatedPlaces[updatedPlaceIndex], id: null }
          );
        }),
        tap(() => {
          this._places.next(updatedPlaces);
        })
      );
    }));   
  }

  fetchPlaces() {
   return this.authService.token.pipe(take(1),switchMap(token => {
      return this.http
      .get<{ [key: string]: PlaceData }>(
        `https://ionic-angular-sb.firebaseio.com/offered-places.json?auth=${token}`
      )
    }),map((resData) => {
          const places = [];
          for (const key in resData) {
            if (resData.hasOwnProperty(key)) {
              places.push(
                new Place(
                  key,
                  resData[key].title,
                  resData[key].description,
                  resData[key].imageUrl,
                  resData[key].price,
                  new Date(resData[key].availableFrom),
                  new Date(resData[key].availableTo),
                  resData[key].userId,
                  resData[key].location
                )
              );
            }
          }
          return places;
        }),
        tap((places) => {
          this._places.next(places);
          console.log(this._places);
          console.log(places)
        }));
  }

  constructor(private authService: AuthService, private http: HttpClient) {}
}

// new Place(
//   "p1",
//   "Manhattan Mansion",
//   "A Night in New York City!",
//   "https://images.unsplash.com/photo-1532960401447-7dd05bef20b0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80",
//   150,
//   new Date("2019-01-01"),
//   new Date("2019-12-31"),
//   "soum"
// ),
// new Place(
//   "p2",
//   "Sunnyvale Mansion",
//   "Cali calling!",
//   "https://ssl.cdn-redfin.com/photo/8/mbphoto/086/genMid.ML81693086_8.jpg",
//   120,
//   new Date("2019-01-01"),
//   new Date("2019-12-31"),
//   "shrey"
// ),
// new Place(
//   "p3",
//   "Spain Mansion",
//   "Disfruta en Espana!",
//   "https://ssl.cdn-redfin.com/photo/8/mbphoto/086/genMid.ML81693086_8.jpg",
//   80,
//   new Date("2019-01-01"),
//   new Date("2019-12-31"),
//   "rach"
// ),
