import { Injectable, ɵConsole } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AuthService } from '../auth/auth.service';
import { Booking } from "./booking.model";
import { take, map,tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData{
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId:string;
  placeImage:string;
  placeTitle: string;
  userId:string;
}

@Injectable({ providedIn: "root" })
export class BookingService {
  constructor(private authService: AuthService, private http: HttpClient) {}

  private _bookings = new BehaviorSubject<Booking[]>([]);
  get bookings() {
    return this._bookings;
  }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId : string;
    let newBooking: Booking;
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if(!userId){
        throw new Error('userId not found!');
      }  
      fetchedUserId = userId;
      return this.authService.token;
    }), take(1), switchMap(token =>{
        newBooking = new Booking(
          Math.random().toString(),
          placeId,
          fetchedUserId,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          guestNumber,
          dateFrom,
          dateTo
        );   
        return this.http.post<{ name: string }>(`https://ionic-angular-sb.firebaseio.com/bookings.json?auth=${token}`, 
        {
          ...newBooking,
          id: null
        }) 
      }),
        switchMap((resData) => {
          generatedId = resData.name;
          return this.bookings;
        }),
        take(1),
        tap(bookings =>{
          newBooking.id = generatedId;
          this._bookings.next(bookings.concat(newBooking));
        }));    
  }


  cancelBooking(bookingId: string) {
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.delete(`https://ionic-angular-sb.firebaseio.com/bookings/${bookingId}.json?auth=${token}`)
    }), switchMap(() => {
      return this.bookings;
    }), take(1), tap(bookings => {
      this._bookings.next(bookings.filter(el => el.id !== bookingId));
    }));   
  }

  fetchBookings(){
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if(!userId){
        throw new Error('User id not found!');
      }
      fetchedUserId = userId;
      return this.authService.token;
    }), take(1), switchMap(token => {
      return this.http.get<{[key: string]: BookingData}>(`https://ionic-angular-sb.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${fetchedUserId}"&auth=${token}`)
      .pipe(
        map((resData) => {
          const bookings = [];
          for(const key in resData){
            if(resData.hasOwnProperty(key)){
              bookings.push(new Booking(
                key,
                resData[key].placeId,
                resData[key].userId,
                resData[key].placeTitle,
                resData[key].placeImage,
                resData[key].firstName,
                resData[key].lastName,
                resData[key].guestNumber,
                new Date(resData[key].bookedFrom),
                new Date(resData[key].bookedTo)
              ));
            }
          }
          return bookings;
        }),
        tap(bookings => {
          this._bookings.next(bookings);
        })
      );
    }))
  }
}
