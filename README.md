# Angular Dropdown

A simple angular dropdown component

## Installation

```bash
$ yarn add angular-dropdown angular-wormhole
```

Import `AngularDropdownModule` in your app:

```typescript
import { NgModule } from '@angular/core';
import { AngularDropdownModule } from 'angular-wormhole';

@NgModule({
  imports: [
    AngularDropdownModule
  ]
})
export class AppModule {}
```

In your SASS stylesheet:

```scss
@import '~angular-dropdown/styles';
```

### Example usage

```html
<div ngDropdown>
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent dropdownClass="slide-fade">
    <ul>
      <li><a href="#">Dropdown Item 1</a></li>
      <li><a href="#">Dropdown Item 2</a></li>
      <li><a href="#">Dropdown Item 3</a></li>
      <li><a href="#">Dropdown Item 4</a></li>
    </ul>
  </div>
</div>
```

## ngDropdown

### Inputs

*renderInPlace: boolean = false*
Should the component render its children in place?

```html
<div ngDropdown [renderInPlace]="true">
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent>
    ...
  </div>
</div>
```

*calculatePosition: (trigger: Element, dropdown: Element, options: any) => any*
Overwrite the default calculatePosition function

*calculateInPlacePosition: (trigger: Element, dropdown: Element, options: any) => any*
Overwrite the default calculatePosition function used when dropdown is
rendered in-place.

*disabled: boolean = false*
Disable the dropdown

*beforeOpen: () => boolean = null*
Hook before the dropdown is opened, return false to cancel it.

*beforeClose: () => boolean = null*
Hook before the dropdown is closed, return false to cancel it.

*verticalPosition: 'auto' | 'above' | 'below'*
Vertical positioning

*horizontalPosition: 'auto' | 'right' | 'center' | 'left'*
Horizontal positioning

### Outputs

*open: void*
Triggers when opening the dropdown

```html
<div ngDropdown (open)="doSomething()">
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent>
    ...
  </div>
</div>
```

*close: void*
Triggers when closing the dropdown

```html
<div ngDropdown (close)="doSomething()">
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent>
    ...
  </div>
</div>
```

## ngDropdownContent

### Inputs

*dropdownClass: string*
Class to apply on the dropdown element, classes with animations will be
properly animated.

*transitioningInClass: string = 'ng-dropdown-content--transitioning-in'*
Class which will be applied when the dropdown element is inserted into the DOM.

*transitionedInClass: string = 'ng-dropdown-content--transitioned-in'*
Class which will be applied once the transitioningInClass animation finished.

*transitioningOutClass: string = 'ng-dropdown-content--transitioning-out'*
Class which will be applied when closing the dropdown.

# Credits

This component is heavily inspired by
[ember-basic-dropdown](https://github.com/cibernox/ember-basic-dropdown).
Contributions from @cibernox, @locks and others.
