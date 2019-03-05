import { Observable, BehaviorSubject, of } from 'rxjs';
import { skip, first, filter } from 'rxjs/operators';

import {
  Component,
  Directive,
  Attribute,
  Inject,
  Input,
  Output,
  ElementRef,
  AfterViewInit,
  OnChanges,
  ContentChild,
  SimpleChanges,
  EventEmitter,
  QueryList,
  ViewContainerRef,
  forwardRef
} from '@angular/core';

import { DOCUMENT } from '@angular/common';

import { AngularDropdownControlDirective } from './angular-dropdown-control.directive';
import { AngularDropdownContentComponent } from './angular-dropdown-content.component';

import { calculatePosition, calculateInPlacePosition } from './utils';

export interface AngularDropdownPositionChanges {
  vPosition: 'above' | 'below';
  hPosition: 'right' | 'center' | 'left';
}

let _id = 1;
function generateDropdownId() {
  return _id++;
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
    '[class.ng-dropdown]': 'true'
  }
})
export class AngularDropdownDirective implements OnChanges {
  id?: string;

  @Input()
  renderInPlace = false;

  @ContentChild(AngularDropdownControlDirective)
  control: AngularDropdownControlDirective | null = null;

  previousVerticalPosition: VerticalPosition | null = null;
  previousHorizontalPosition: HorizontalPosition | null = null;
  matchTriggerWidth = false;

  private _isOpen$ = new BehaviorSubject(false);
  isOpen$ = this._isOpen$.pipe(skip(1));

  position$ = new BehaviorSubject<Readonly<DropdownContentPosition>>(
    EmptyDropdownContentPosition
  );

  get dropdownId() {
    return `ng-dropdown-content-${this.uniqueId}`;
  }

  @Input()
  calculatePosition: Function = calculatePosition;
  @Input()
  calculateInPlacePosition: Function = calculateInPlacePosition;

  @Input()
  disabled = false;

  @Input()
  beforeOpen: (() => boolean | Observable<boolean>) | null = null;

  @Input()
  beforeClose: (() => boolean | Observable<boolean>) | null = null;

  @Input()
  public verticalPosition: VerticalPosition = 'auto';
  @Input()
  public horizontalPosition: HorizontalPosition = 'auto';

  @Output('open')
  onOpen = this.isOpen$.pipe(filter(open => open === true));

  @Output('close')
  onClose = this.isOpen$.pipe(filter(open => open === false));

  get triggerElement(): HTMLElement | null {
    return this.control && this.control.element.nativeElement;
  }

  get dropdownElement(): HTMLElement | null {
    return this.document.getElementById(this.dropdownId);
  }

  @ContentChild(forwardRef(() => AngularDropdownContentComponent))
  private dropdownContent?: AngularDropdownContentComponent;

  private uniqueId: number | string | null = null;
  private width: number | null = null;
  private document: Document;

  constructor(@Inject(DOCUMENT) document: any, @Attribute('id') id?: string) {
    this.document = document;
    this.initializeId(id);
    this.createDefaultWormholeOutlet();
  }

  ngOnChanges({ disabled }: SimpleChanges): void {
    if (
      disabled &&
      disabled.firstChange === false &&
      disabled.currentValue === true &&
      disabled.previousValue !== true
    ) {
      this.disable();
    }
  }

  open(): void {
    if (this.disabled || this._isOpen$.getValue()) {
      return;
    }

    let open$ = of(true);

    if (this.beforeOpen) {
      const result = this.beforeOpen();
      open$ = result instanceof Observable ? result : of(result);
    }

    open$
      .pipe(
        first(),
        filter(open => open === true)
      )
      .subscribe(() => this._isOpen$.next(true));
  }

  close(skipFocus = false): void {
    if (this.disabled || !this._isOpen$.getValue()) {
      return;
    }

    let close$ = of(true);

    if (this.beforeClose) {
      const result = this.beforeClose();
      close$ = result instanceof Observable ? result : of(result);
    }

    close$
      .pipe(
        first(),
        filter(close => close === true)
      )
      .subscribe(() => {
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
        this._isOpen$.next(false);

        if (!skipFocus) {
          if (
            this.triggerElement instanceof HTMLElement &&
            this.triggerElement.tabIndex > -1
          ) {
            this.triggerElement.focus();
          }
        }
      });
  }

  toggle(): void {
    if (this._isOpen$.getValue()) {
      this.close();
    } else {
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
    if (!this._isOpen$.getValue()) {
      return null;
    }

    const dropdownElement = this.dropdownElement;
    if (!dropdownElement || !this.triggerElement) {
      return null;
    }

    const _calculatePosition = this.renderInPlace
      ? this.calculateInPlacePosition
      : this.calculatePosition;

    const options = {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      matchTriggerWidth: this.matchTriggerWidth,
      previousHorizontalPosition: this.previousHorizontalPosition,
      previousVerticalPosition: this.previousVerticalPosition
    };

    const positionData = _calculatePosition(
      this.triggerElement,
      dropdownElement,
      options
    );

    return this.applyReposition(
      this.triggerElement,
      dropdownElement,
      positionData
    );
  };

  private applyReposition(
    trigger: Element,
    dropdown: HTMLElement,
    positions: any
  ): AngularDropdownPositionChanges {
    const changes: any = {
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
        Object.keys(positions.style).forEach(
          k => (dropdown.style[k as any] = positions.style[k])
        );
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
    } else {
      this.uniqueId = generateDropdownId();
      this.id = `ng-dropdown-${this.uniqueId}`;
    }
  }

  private createDefaultWormholeOutlet(): void {
    if (!this.document.getElementById('ng-dropdown-outlet')) {
      const outlet = this.document.createElement('div');
      outlet.id = 'ng-dropdown-outlet';
      this.document.body.insertBefore(outlet, this.document.body.firstChild);
    }
  }
}
