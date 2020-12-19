import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = false;

  constructor(private loadingCtrl: LoadingController,private alertCtrl: AlertController, private authService: AuthService, private router:  Router) { }

  ngOnInit() {
  }

  authenticate(email: string, password: string) {
    let authenticationMode  = this.isLogin? this.authService.logIn(email,password) :  this.authService.signUp(email,password);
    this.isLoading = true;
    this.loadingCtrl.create({keyboardClose: true, message: 'Logging in...'}).then(loadingEl => {
      loadingEl.present();
      authenticationMode.subscribe(resData => {
        this.isLoading = false;
        loadingEl.dismiss();
        this.router.navigateByUrl('/places/tabs/discover');
      }, errorResponse => {
        loadingEl.dismiss();
        const code = errorResponse.error.error.message;
        let message = 'Could not sign you up, please try again.'
        if(code == 'EMAIL_EXISTS'){
          message = 'The email address is already in use by another account.';
        } else if(code == 'EMAIL_NOT_FOUND'){
          message = 'There is no user record corresponding to this identifier. The user may have been deleted.';
        } else if(code == 'INVALID_PASSWORD'){
          message = 'The password is invalid or the user does not have a password.';
        }
        this.showAlert(message);
      });
    });
  }

  onSubmit(form : NgForm){
    if(!form.valid){
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    form.reset();    
    this.authenticate(email, password);
  }

  onSwitchAuthMode(){
    this.isLogin = !this.isLogin;
  }

  private showAlert(message: string){
    this.alertCtrl.create({
      header: 'Authentication failed',
      message: message,
      buttons: ['Okay']
    }).then(alertEl => {
      alertEl.present();
    });
  }

}
