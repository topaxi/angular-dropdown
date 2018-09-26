import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgWormholeModule } from 'ng-wormhole';

import { AngularDropdownDirective } from './angular-dropdown.directive';
import { AngularDropdownContentComponent } from './angular-dropdown-content.component';
import { AngularDropdownControlDirective } from './angular-dropdown-control.directive';

@NgModule({
  imports: [CommonModule, NgWormholeModule],
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
