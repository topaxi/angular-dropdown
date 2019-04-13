# Angular Dropdown

A simple angular dropdown component

## Installation

```bash
$ yarn add angular-dropdown ng-wormhole
```

Import `AngularDropdownModule` in your app:

```typescript
import { NgModule } from '@angular/core';
import { AngularDropdownModule } from 'angular-dropdown';

@NgModule({
  imports: [AngularDropdownModule]
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

_renderInPlace: boolean = false_
Should the component render its children in place?

```html
<div ngDropdown [renderInPlace]="true">
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent>
    ...
  </div>
</div>
```

_calculatePosition: (trigger: Element, dropdown: Element, options: any) => any_
Overwrite the default calculatePosition function

_calculateInPlacePosition: (trigger: Element, dropdown: Element, options: any) => any_
Overwrite the default calculatePosition function used when dropdown is
rendered in-place.

_disabled: boolean = false_
Disable the dropdown

_beforeOpen: () => boolean = null_
Hook before the dropdown is opened, return false to cancel it.

_beforeClose: () => boolean = null_
Hook before the dropdown is closed, return false to cancel it.

_verticalPosition: 'auto' | 'above' | 'below'_
Vertical positioning

_horizontalPosition: 'auto' | 'right' | 'center' | 'left'_
Horizontal positioning

### Outputs

_open: void_
Triggers when opening the dropdown

```html
<div ngDropdown (open)="doSomething()">
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent>
    ...
  </div>
</div>
```

_close: void_
Triggers when closing the dropdown

```html
<div ngDropdown (close)="doSomething()">
  <button ngDropdownControl>Open Dropdown!</button>
  <div ngDropdownContent>
    ...
  </div>
</div>
```

### Programatically open/close

```html
<div ngDropdown #dropdown="ngDropdown">
  <button (click)="ngDropdown.open()">Open Dropdown!</button>
  <button (click)="ngDropdown.close()">Close Dropdown!</button>

  <div ngDropdownContent>
    ...
  </div>
</div>
```

## ngDropdownContent

### Inputs

_dropdownClass: string_
Class to apply on the dropdown element, classes with animations will be
properly animated.

_transitioningInClass: string = 'ng-dropdown-content--transitioning-in'_
Class which will be applied when the dropdown element is inserted into the DOM.

_transitionedInClass: string = 'ng-dropdown-content--transitioned-in'_
Class which will be applied once the transitioningInClass animation finished.

_transitioningOutClass: string = 'ng-dropdown-content--transitioning-out'_
Class which will be applied when closing the dropdown.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

# Credits

This component is heavily inspired by
[ember-basic-dropdown](https://github.com/cibernox/ember-basic-dropdown).
Contributions from @cibernox, @locks and others.
