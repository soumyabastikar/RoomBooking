import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, from } from "rxjs";
import { map, tap } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { User } from "./user.model";
import { Plugins, Capacitor } from "@capacitor/core";

interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
  registered?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AuthService implements OnDestroy {
  // tslint:disable-next-line:variable-name
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;


  constructor(private http: HttpClient) {}

  autoLogin() {
    let expirationTime: Date;
    return from(Plugins.Storage.get({ key: "authData" })).pipe(
      map((storedData) => {
        if (!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as {
          userId: string;
          token: string;
          tokenExpirationDate: string;
          email: string;
        };
        expirationTime = new Date(parsedData.tokenExpirationDate);
        if (expirationTime <= new Date()) {
          return null;
        }
        const user = new User(parsedData.userId, parsedData.email, parsedData.token, expirationTime);
        return user;
      }),
      tap(user => {
        this._user.next(user);
        if(user){
          this.autoLogout(expirationTime.getTime() - new Date().getTime());
        }        
      }),
      map(user => {
        return !!user;
      })
    );
  }

  signUp(email: string, password: string) {
    let newUser = {
      email: email,
      password: password,
      returnSecureToken: true,
    };
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`,
        newUser
      )
      .pipe(tap(this.setUserData.bind(this)));
  }

  logIn(email: string, password: string) {
    console.log(new Date());
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`,
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(tap(this.setUserData.bind(this)));
  }

  logout() {
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null);
    Plugins.Storage.remove({key: 'authData'});
  }

  private autoLogout(duration: number){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  get userIsAuthenticated() {
    return this._user.pipe(
      map((user) => {
        if (user) {
          return !!user.token;
        } else return false;
      })
    );
  }

  get token() {
    return this._user.pipe(
      map((user) => {
        if (user) {
          return user.token;
        } else {
          return null;
        }
      })
    );
  }

  get userId() {
    return this._user.pipe(
      map((user) => {
        if (user) {
          return user.id;
        } else {
          return null;
        }
      })
    );
  }

  private setUserData(userData: AuthResponseData) {
    const expirationTime = new Date(
      new Date().getTime() + +userData.expiresIn * 1000
    );
    const user = new User(
      userData.localId,
      userData.email,
      userData.idToken,
      expirationTime
    );      
    console.log(expirationTime);
    this._user.next(user);
    if(user){
      this.autoLogout(expirationTime.getTime() - new Date().getTime());
    }        
    this.storeAuthData(
      userData.localId,
      userData.idToken,
      expirationTime.toISOString(),
      userData.email
    );
  }

  private storeAuthData(
    userId: string,
    token: string,
    tokenExpirationDate: string,
    email: string
  ) {
    const data = JSON.stringify({
      userId: userId,
      token: token,
      tokenExpirationDate: tokenExpirationDate,
      email: email
    });
    Plugins.Storage.set({ key: "authData", value: data });
  }

  ngOnDestroy(){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
  }
}
