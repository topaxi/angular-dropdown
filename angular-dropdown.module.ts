import { NgModule }
  from '@angular/core';
import { BrowserModule }
  from '@angular/platform-browser';

import { AngularWormholeModule }
  from 'angular-wormhole';

import { AngularDropdownDirective }
  from './angular-dropdown.directive';
import { AngularDropdownContentComponent }
  from './angular-dropdown-content.component';
import { AngularDropdownControlDirective }
  from './angular-dropdown-control.directive';

@NgModule({
  imports: [
    BrowserModule,
    AngularWormholeModule
  ],
  declarations: [
    AngularDropdownDirective,
    AngularDropdownControlDirective,
    AngularDropdownContentComponent
  ],
  exports: [
    AngularDropdownDirective,
    AngularDropdownControlDirective,
    AngularDropdownContentComponent
  ]
})
export class AngularDropdownModule {}
