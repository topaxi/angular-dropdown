import {
  Component,
  Attribute,
  Input,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  NgZone
} from '@angular/core';

import { AngularDropdownComponent } from './angular-dropdown.component';
import {
  closest,
  waitForAnimation
} from './utils';

const MutationObserver = window.MutationObserver;

@Component({
  selector: 'ng-dropdown-content',
  template: '<ng-content></ng-content>',
  host: {
    '[style.top]': 'dropdown?.top',
    '[style.right]': 'dropdown?.right',
    '[style.bottom]': 'dropdown?.bottom',
    '[style.left]': 'dropdown?.left',
    '[class.render-in-place]': 'dropdown?.renderInPlace',
    '[class.ng-dropdown-content--above]': 'dropdown?.verticalPosition === "above"',
    '[class.ng-dropdown-content--below]': 'dropdown?.verticalPosition === "below"',
    '[class.ng-dropdown-content--right]': 'dropdown?.horizontalPosition === "right"',
    '[class.ng-dropdown-content--center]': 'dropdown?.horizontalPosition === "center"',
    '[class.ng-dropdown-content--left]': 'dropdown?.horizontalPosition === "left"'
  }
})
export class AngularDropdownContentComponent
    implements AfterViewInit, OnChanges, OnDestroy {
  @Input()
  id: string;

  @Input()
  dropdown: AngularDropdownComponent;

  @Input()
  isOpen: boolean = false;

  private hasMoved: boolean = false;
  private _animationClass: string = null;
  private isTouchDevice: boolean = 'ontouchstart' in window;
  private mutationObserver: MutationObserver = null;

  //@Attribute('transitioning-in-class')
  private transitioningInClass = 'ng-dropdown--transitioning-in';
  //@Attribute('transitioned-in-class')
  private transitionedInClass = 'ng-dropdown--transitioned-in';
  //@Attribute('transitioning-out-class')
  private transitioningOutClass = 'ng-dropdown--transitioning-out';

  constructor(
    public element: ElementRef,
    private zone: NgZone
  ) {
  }

  set animationClass(className: string) {
    if (this._animationClass && className !== this._animationClass) {
      this.element.nativeElement.classList.remove(this._animationClass);
    }
    else if (className) {
      this.element.nativeElement.classList.add(className);
    }
    this._animationClass = className;
  }

  get animationClass(): string {
    return this._animationClass;
  }

  get triggerElement(): Element {
    return this.dropdown.triggerElement;
  }

  ngAfterViewInit(): void {
    this.animationClass = this.transitioningInClass;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].isFirstChange()) {
        this.element.nativeElement.id = this.id;
      }
      if (changes['isOpen'].currentValue) {
        this.open()
      }
      else {
        this.close();
      }
    }
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  open(): void {
    document.body.addEventListener('mousedown', this.handleRootMouseDown, true);

    if (this.isTouchDevice) {
      document.body.addEventListener('touchstart', this.touchStartHandler, true);
      document.body.addEventListener('touchend', this.handleRootMouseDown, true);
    }

    let changes = this.dropdown.reposition();
    if (!this.dropdown.renderInPlace) {
      this.addGlobalEvents();
      this.startObservingDomMutations();
    }
    else if (changes.vPosition === 'above') {
      this.startObservingDomMutations();
    }

    requestAnimationFrame(() => this.animateIn());
  }

  close(): void {
    this.teardown();
    this.animateOut();
  }

  private repositionInZone = () =>
    this.zone.run(() => this.dropdown.reposition());

  private animateIn(): void {
    waitForAnimation(this.element.nativeElement, () => {
      this.animationClass = this.transitionedInClass;
    });
  }

  private animateOut(): void {
    let parentElement = this.dropdown.renderInPlace ?
      this.element.nativeElement.parentElement.parentElement :
      this.element.nativeElement.parentElement;
    let clone = this.element.nativeElement.cloneNode(true);
    clone.id = `${this.element.nativeElement.id}--clone`;
    clone.classList.remove(this.transitionedInClass);
    clone.classList.remove(this.transitioningInClass);
    clone.classList.add(this.transitioningOutClass);
    parentElement.appendChild(clone);
    this.animationClass = this.transitioningInClass;
    waitForAnimation(clone, () => parentElement.removeChild(clone));
  }

  private handleRootMouseDown = (e: MouseEvent): void => {
    if (this.hasMoved || this.element.nativeElement.contains(<Node>e.target) ||
        this.triggerElement && this.triggerElement.contains(<Node>e.target)) {
      this.hasMoved = false;
      return;
    }

    let closestDropdown = closest(<Element>e.target, 'ng-dropdown-content');
    if (closestDropdown) {
      let trigger = document.querySelector(
        `[aria-controls=${closestDropdown.getAttribute('id')}]`
      );
      let parentDropdown = closest(trigger, 'ng-dropdown-content');
      if (parentDropdown && parentDropdown.getAttribute('id') === this.id) {
        this.hasMoved = false;
        return;
      }
    }

    this.dropdown.close(true);
  }

  private startObservingDomMutations(): void {
    if (MutationObserver) {
      this.mutationObserver = new MutationObserver(mutations => {
        if (mutations[0].addedNodes.length ||
            mutations[0].removedNodes.length) {
          this.repositionInZone();
        }
      });
      this.mutationObserver.observe(this.element.nativeElement, {
        childList: true,
        subtree: true
      });
    }
    else {
      this.element.nativeElement.addEventListener('DOMNodeInserted', this.repositionInZone, false);
      this.element.nativeElement.addEventListener('DOMNodeRemoved', this.repositionInZone, false);
    }
  }

  private stopObservingDomMutations(): void {
    if (MutationObserver) {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    }
    else {
      if (this.element.nativeElement) {
        this.element.nativeElement.removeEventListener('DOMNodeInserted', this.repositionInZone);
        this.element.nativeElement.removeEventListener('DOMNodeRemoved', this.repositionInZone);
      }
    }
  }

  private addGlobalEvents(): void {
    window.addEventListener('scroll', this.repositionInZone);
    window.addEventListener('resize', this.repositionInZone);
    window.addEventListener('orientationchange', this.repositionInZone);
  }

  private removeGlobalEvents(): void {
    window.removeEventListener('scroll', this.repositionInZone);
    window.removeEventListener('resize', this.repositionInZone);
    window.removeEventListener('orientationchange', this.repositionInZone);
  }

  private touchStartHandler = (e: TouchEvent) => {
    document.body.addEventListener('touchmove', this.touchMoveHandler, true);
  }

  private touchMoveHandler = (e: TouchEvent) => {
    this.hasMoved = true;
    document.body.removeEventListener('touchmove', this.touchMoveHandler, true);
  }

  private teardown() {
    this.removeGlobalEvents();
    this.stopObservingDomMutations();
    document.body.removeEventListener('mousedown', this.handleRootMouseDown, true);

    if (this.isTouchDevice) {
      document.body.removeEventListener('touchstart', this.touchStartHandler, true);
      document.body.removeEventListener('touchend', this.handleRootMouseDown, true);
    }
  }
}
