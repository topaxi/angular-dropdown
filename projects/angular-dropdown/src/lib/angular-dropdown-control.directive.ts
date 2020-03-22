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
import { Subscription } from 'rxjs';

@Directive({
  selector: '[ng-dropdown-control],[ngDropdownControl]',
  host: {
    '[attr.aria-haspopup]': 'true',
    '[attr.aria-controls]': 'dropdown.id',
    '[attr.aria-expanded]': 'isDropdownOpen',
    '[class.ng-dropdown-control]': 'true',
    '[class.active]': 'isDropdownOpen'
  }
})
export class AngularDropdownControlDirective {
  isDropdownOpen: boolean = false;
  dropdownStateSubscription?: Subscription;

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

  ngOnInit() {
    this.dropdownStateSubscription = this.dropdown.isOpen$.subscribe(
      isOpen => (this.isDropdownOpen = isOpen)
    );
  }

  ngOnDestroy(){
    this.dropdownStateSubscription && this.dropdownStateSubscription.unsubscribe();
  }
}
