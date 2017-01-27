import {
  Component,
  Attribute,
  Input,
  Output,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  SimpleChanges,
  EventEmitter,
  QueryList,
  ViewContainerRef
} from '@angular/core';

import { AngularDropdownContentComponent }
  from './angular-dropdown-content.component';

import { calculatePosition, calculateInPlacePosition } from './utils';

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

@Component({
  selector: 'ng-dropdown',
  template: '<ng-wormhole to="#ng-dropdown-outlet" ' +
                '[renderInPlace]="renderInPlace">' +
              '<div *ngIf="overlay && isOpen" class="ng-dropdown-overlay"></div>' +
              '<ng-dropdown-content *ngIf="isOpen" [id]="dropdownId" ' +
                  'class="ng-dropdown-content slide-fade" ' +
                  '[isOpen]="isOpen" ' +
                  '[dropdown]="this">' +
                '<ng-content></ng-content>' +
              '</ng-dropdown-content>' +
            '</ng-wormhole>',
  styles: [`
    :host { display: none; }
    :host.render-in-place { display: block }
  `],
  host: {
    '[class.render-in-place]': 'renderInPlace'
  }
})
export class AngularDropdownComponent
    implements AfterViewInit, OnDestroy, OnChanges {
  id: string;

  @Input()
  renderInPlace: boolean = false;

  @Input()
  triggerElement: Element = null;

  previousVerticalPosition: VerticalPosition = null;
  previousHorizontalPosition: HorizontalPosition = null;
  matchTriggerWidth: boolean = false;

  isOpen: boolean = false;
  top: number = null;
  left: number = null;
  bottom: number = null;
  right: number = null;

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
  beforeOpen: () => boolean = null;

  @Input()
  beforeClose: () => boolean = null;

  @Output('open')
  onOpen: EventEmitter<void> = new EventEmitter<void>();

  @Output('close')
  onClose: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild(AngularDropdownContentComponent)
  private dropdownContent: AngularDropdownContentComponent;

  private uniqueId: number | string = null;
  private width: number = null;

  constructor(
      @Attribute('vertical-position')
      public verticalPosition: VerticalPosition = 'auto',
      @Attribute('horizontal-position')
      public horizontalPosition: HorizontalPosition = 'auto',
      private element: ElementRef,
      @Attribute('id')
      id?: string) {
    this.initializeId(id);
    this.createDefaultWormholeOutlet();
  }

  ngAfterViewInit(): void {
    this.triggerElement.addEventListener('click', () => this.toggle());
    this.triggerElement.setAttribute('aria-controls', this.id);
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] &&
        changes['disabled'].currentValue === true &&
        changes['disabled'].previousValue !== true) {
      this.disable();
    }
  }

  open(): void {
    if (this.disabled || this.isOpen) {
      return;
    }

    if (this.beforeOpen && this.beforeOpen() === false) {
      return;
    }

    this.onOpen.emit();
    this.isOpen = true;
  }

  close(skipFocus = false): void {
    if (this.disabled || !this.isOpen) {
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
    this.isOpen = false;
    this.onClose.emit();

    if (!skipFocus) {
      if (this.triggerElement instanceof HTMLElement &&
          this.triggerElement.tabIndex > -1) {
        this.triggerElement.focus();
      }
    }
  }

  toggle(): void {
    if (this.isOpen) {
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

  reposition = (): AngularDropdownPositionChanges => {
    if (!this.isOpen) {
      return;
    }

    let dropdownElement = this.dropdownElement;
    if (!dropdownElement || !this.triggerElement) {
      return;
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

  private applyReposition(trigger: Element, dropdown: HTMLElement, positions): AngularDropdownPositionChanges {
    let changes: any = {
      hPosition: positions.horizontalPosition,
      vPosition: positions.verticalPosition
    };
    if (positions.style) {
      changes.top = `${positions.style.top}px`;
      // The component can be aligned from the right or from the left, but not from both.
      if (positions.style.left !== undefined) {
        changes.left = `${positions.style.left}px`;
        changes.right = null;
      } else if (positions.style.right !== undefined) {
        changes.right = `${positions.style.right}px`;
        changes.left = null;
      }
      if (positions.style.width !== undefined) {
        changes.width = `${positions.style.width}px`;
      }
      if (this.top === null) {
        // Bypass on the first reposition only to avoid flickering.
        Object.keys(positions.style).forEach(k =>
          dropdown.style[k] = positions.style[k]
        )
      }
    }

    Object.assign(this, changes);

    this.previousHorizontalPosition = positions.horizontalPosition;
    this.previousVerticalPosition = positions.verticalPosition;

    return changes;
  }

  private get dropdownElement(): HTMLElement {
    return document.getElementById(this.dropdownId);
  }

  private initializeId(id?): void {
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
