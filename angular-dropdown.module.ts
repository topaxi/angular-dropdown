import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularWormholeModule } from 'angular-wormhole';
import { AngularDropdownComponent } from './angular-dropdown.component';
import { AngularDropdownContentComponent }
  from './angular-dropdown-content.component';

@NgModule({
  imports: [
    BrowserModule,
    AngularWormholeModule
  ],
  declarations: [
    AngularDropdownComponent,
    AngularDropdownContentComponent
  ],
  exports: [
    AngularDropdownComponent,
    AngularDropdownContentComponent
  ]
})
export class AngularDropdownModule {}
