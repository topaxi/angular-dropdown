import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AngularDropdownModule } from 'angular-dropdown';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AngularDropdownModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
