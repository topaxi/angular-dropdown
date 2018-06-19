import {
  BehaviorSubject
} from 'rxjs/BehaviorSubject';

import {
  Component,
  Directive,
  Attribute,
  Input,
  Output,
  ElementRef,
  AfterViewInit,
  OnChanges,
  ContentChild,
  SimpleChanges,
  EventEmitter,
  QueryList,
  ViewContainerRef
} from '@angular/core';

import { AngularDropdownControlDirective }
  from './angular-dropdown-control.directive';
import { AngularDropdownContentComponent }
  from './angular-dropdown-content.component';

import { calculatePosition, calculateInPlacePosition } from './utils';
import { Observable } from 'rxjs/Observable';

export interface AngularDropdownPositionChanges {
  vPosition: 'above' | 'below';
  hPosition: 'right' | 'center' | 'left';
}

let id = 1;
function generateDropdownId() {
  return id++;
}

export type VerticalPosition = 'auto' | 'above' | 'below';
export type HorizontalPosition = 'auto' | 'right' | 'center' | 'left';

export interface DropdownContentPosition {
  readonly hPosition: HorizontalPosition | null;
  readonly vPosition: VerticalPosition | null;
  readonly top: string | null;
  readonly left: string | null;
  readonly bottom: string | null;
  readonly right: string | null;
}

const EmptyDropdownContentPosition = Object.freeze({
  vPosition: null,
  hPosition: null,
  top: null,
  left: null,
  bottom: null,
  right: null
});

@Directive({
  selector: 'ng-dropdown,[ngDropdown],[ng-dropdown]',
  host: {
    '[class.render-in-place]': 'renderInPlace',
    '[class.ng-dropdown]': 'true',
  }
})
export class AngularDropdownDirective implements OnChanges {
  id?: string;

  @Input()
  renderInPlace: boolean = false;

  @ContentChild(AngularDropdownControlDirective)
  control: AngularDropdownControlDirective | null = null;

  previousVerticalPosition: VerticalPosition | null = null;
  previousHorizontalPosition: HorizontalPosition | null = null;
  matchTriggerWidth: boolean = false;

  isOpen$ = new BehaviorSubject(false);
  position$ = new BehaviorSubject<Readonly<DropdownContentPosition>>(EmptyDropdownContentPosition);

  get dropdownId() {
    return `ng-dropdown-content-${this.uniqueId}`
  }

  @Input()
  calculatePosition: Function = calculatePosition;
  @Input()
  calculateInPlacePosition: Function = calculateInPlacePosition;

  @Input()
  disabled: boolean = false;

  @Input()
  beforeOpen: (() => boolean) | (() => Observable<boolean>)  | null= null;

  @Input()
  beforeClose: (() => boolean) | null = null;

  @Input()
  public verticalPosition: VerticalPosition = 'auto';
  @Input()
  public horizontalPosition: HorizontalPosition = 'auto';

  @Output('open')
  onOpen = new EventEmitter<void>();

  @Output('close')
  onClose = new EventEmitter<void>();

  get triggerElement(): HTMLElement {
    return this.control!.element.nativeElement;
  }

  get dropdownElement(): HTMLElement {
    return document.getElementById(this.dropdownId)!;
  }

  @ContentChild(AngularDropdownContentComponent)
  private dropdownContent?: AngularDropdownContentComponent;

  private uniqueId: number | string | null = null;
  private width: number | null = null;

  constructor(@Attribute('id') id?: string) {
    this.initializeId(id);
    this.createDefaultWormholeOutlet();
  }

  ngOnChanges({ disabled }: SimpleChanges): void {
    if (disabled &&
        disabled.firstChange === false &&
        disabled.currentValue === true &&
        disabled.previousValue !== true) {
      this.disable();
    }
  }

  open(): void {
    if (this.disabled || this.isOpen$.getValue()) {
      return;
    }

    let open$: Observable<boolean> = Observable.of(true);

    if (this.beforeOpen) {
      const result = this.beforeOpen();
      if (result instanceof Observable) {
        open$ = result;
      } else {
        open$ = Observable.of(result);
      }

    }

    open$.subscribe( (open) => {
      if (open) {
        this.isOpen$.next(true);
        this.onOpen.emit();
      }
    });

  }

  close(skipFocus = false): void {
    if (this.disabled || !this.isOpen$.getValue()) {
      return;
    }

    if (this.beforeClose && this.beforeClose() === false) {
      return;
    }

    Object.assign(this, {
      hPosition: null,
      vPosition: null,
      top: null,
      right: null,
      bottom: null,
      left: null,
      width: null,
      previousVerticalPosition: null,
      previousHorizontalPosition: null
    });
    this.isOpen$.next(false);
    this.onClose.emit();

    if (!skipFocus) {
      if (this.triggerElement instanceof HTMLElement &&
          this.triggerElement.tabIndex > -1) {
        this.triggerElement.focus();
      }
    }
  }

  toggle(): void {
    if (this.isOpen$.getValue()) {
      this.close();
    }
    else {
      this.open();
    }
  }

  disable(): void {
    this.disabled = true;
    this.close();
  }

  enable(): void {
    this.disabled = false;
  }

  reposition = (): AngularDropdownPositionChanges | null => {
    if (!this.isOpen$.getValue()) {
      return null;
    }

    let dropdownElement = this.dropdownElement;
    if (!dropdownElement || !this.triggerElement) {
      return null;
    }

    let calculatePosition = this.renderInPlace ?
      this.calculateInPlacePosition :
      this.calculatePosition;

    let options = {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      matchTriggerWidth: this.matchTriggerWidth,
      previousHorizontalPosition: this.previousHorizontalPosition,
      previousVerticalPosition: this.previousVerticalPosition,
    };

    let positionData = calculatePosition(this.triggerElement, dropdownElement, options);

    return this.applyReposition(this.triggerElement, dropdownElement, positionData);
  }

  private applyReposition(trigger: Element, dropdown: HTMLElement, positions: any): AngularDropdownPositionChanges {
    let changes: any = {
      hPosition: positions.horizontalPosition,
      vPosition: positions.verticalPosition
    };
    if (positions.style) {
      changes.top = `${positions.style.top}px`;
      // The component can be aligned from the right or from the left, but not from both.
      if (positions.style.left != null) {
        changes.left = `${positions.style.left}px`;
        changes.right = null;
      } else if (positions.style.right != null) {
        changes.right = `${positions.style.right}px`;
        changes.left = null;
      }
      if (positions.style.width != null) {
        changes.width = `${positions.style.width}px`;
      }
      if (this.position$.getValue().top == null) {
        // Bypass on the first reposition only to avoid flickering.
        Object.keys(positions.style).forEach(k =>
          dropdown.style[k as any] = positions.style[k]
        )
      }
    }

    this.position$.next(changes);

    this.previousHorizontalPosition = positions.horizontalPosition;
    this.previousVerticalPosition = positions.verticalPosition;

    return changes;
  }

  private initializeId(id?: string): void {
    if (id) {
      this.id = this.uniqueId = id;
    }
    else {
      this.uniqueId = generateDropdownId();
      this.id = `ng-dropdown-${this.uniqueId}`;
    }
  }

  private createDefaultWormholeOutlet(): void {
    if (!document.getElementById('ng-dropdown-outlet')) {
      let outlet = document.createElement('div');
      outlet.id = 'ng-dropdown-outlet';
      document.body.insertBefore(outlet, document.body.firstChild);
    }
  }
}
