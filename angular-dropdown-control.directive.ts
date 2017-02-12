import {
  Directive,
  ElementRef,
  Inject,
  forwardRef,
  Input,
  Host,
  HostListener
} from '@angular/core';

import { AngularDropdownDirective }
  from './angular-dropdown.directive';

@Directive({
  selector: '[ng-dropdown-control],[ngDropdownControl]',
  host: {
    '[attr.aria-haspopup]': 'true',
    '[attr.aria-controls]': 'dropdown.id',
    '[class.ng-dropdown-control]': 'true'
  }
})
export class AngularDropdownControlDirective {
  @HostListener('click', [ '$event' ])
  onClick(e: Event): void {
    e.stopPropagation();

    if (!this.dropdown.disabled) {
      this.dropdown.toggle();
    }
  }

  constructor(
      @Host()
      @Inject(forwardRef(() => AngularDropdownDirective))
      public dropdown: AngularDropdownDirective,
      public element: ElementRef) {
  }
}
