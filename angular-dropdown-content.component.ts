import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

import {
  Component,
  Input,
  Host,
  Inject,
  forwardRef,
  AfterViewChecked,
  OnInit,
  OnDestroy,
  NgZone
} from '@angular/core';

import { AngularDropdownDirective } from './angular-dropdown.directive';
import {
  closest,
  waitForAnimation
} from './utils';

const MutationObserver = (window as any).MutationObserver;

@Component({
  selector: 'ng-dropdown-content,[ng-dropdown-content],[ngDropdownContent]',
  template: '<ng-wormhole *ngIf="dropdown.isOpen$ | async" to="#ng-dropdown-outlet" '+
                '[renderInPlace]="dropdown.renderInPlace">' +
              '<div *ngIf="overlay && (dropdown.isOpen$ | async)" ' +
                  'class="ng-dropdown-overlay"></div>' +
              '<div id="{{dropdown.dropdownId}}" ' +
                  'class="ng-dropdown-content {{dropdownClass}}" ' +
                  '[style.top]="(dropdown.position$ | async).top" ' +
                  '[style.right]="(dropdown.position$ | async).right" ' +
                  '[style.bottom]="(dropdown.position$ | async).bottom" ' +
                  '[style.left]="(dropdown.position$ | async).left" ' +
                  `[class.render-in-place]="dropdown.renderInPlace"` +
                  `[class.ng-dropdown-content--above]="(dropdown.position$ | async).vPosition === 'above'" ` +
                  `[class.ng-dropdown-content--below]="(dropdown.position$ | async).vPosition === 'below'" ` +
                  `[class.ng-dropdown-content--right]="(dropdown.position$ | async).hPosition === 'right'" ` +
                  `[class.ng-dropdown-content--center]="(dropdown.position$ | async).hPosition === 'center'" ` +
                  `[class.ng-dropdown-content--left]="(dropdown.position$ | async).hPosition === 'left'">` +
                '<ng-content></ng-content>' +
              '</div>' +
            '</ng-wormhole>' +
            '<div *ngIf="!dropdown.isOpen$ | async" id="{{dropdown.dropdownId}}" ' +
                'class="ng-dropdown-placeholder"></div>',
  styles: [`
    :host { display: none; }
    :host.render-in-place { display: block; position: absolute; }
  `],
  host: {
    '[class.render-in-place]': 'dropdown.renderInPlace',
  }
})
export class AngularDropdownContentComponent
    implements OnInit, AfterViewChecked, OnDestroy {
  @Input()
  dropdownClass: string = '';

  private hasMoved: boolean = false;
  private _animationClass: string | null = null;
  private isTouchDevice: boolean = 'ontouchstart' in window;
  private mutationObserver: MutationObserver | null = null;
  private destroy$ = new Subject<void>();

  @Input()
  transitioningInClass: string = 'ng-dropdown-content--transitioning-in';
  @Input()
  transitionedInClass: string = 'ng-dropdown-content--transitioned-in';
  @Input()
  transitioningOutClass: string = 'ng-dropdown-content--transitioning-out';

  private get dropdownElement(): HTMLElement {
    return this.dropdown.dropdownElement;
  }

  private shouldOpen = false;

  constructor(
      @Host()
      @Inject(forwardRef(() => AngularDropdownDirective))
      public dropdown: AngularDropdownDirective,
      private zone: NgZone) {
  }

  ngOnInit(): void {
    this.dropdown.onOpen
      .takeUntil(this.destroy$)
      .subscribe(() => this.shouldOpen = true);

    this.dropdown.onClose
      .takeUntil(this.destroy$)
      .subscribe(() => this.close());
  }

  set animationClass(className: string | null) {
    if (this._animationClass && className !== this._animationClass) {
      this.dropdownElement.classList.remove(this._animationClass);
    }
    else if (className) {
      this.dropdownElement.classList.add(className);
    }
    this._animationClass = className;
  }

  get animationClass(): string | null {
    return this._animationClass;
  }

  get triggerElement(): Element {
    return this.dropdown.triggerElement;
  }

  ngAfterViewChecked() {
    if (this.shouldOpen) {
      this.animationClass = this.transitioningInClass;
      requestAnimationFrame(() => this.open());
      this.shouldOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.teardownEvents();
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
    else if (changes !== null && changes.vPosition === 'above') {
      this.startObservingDomMutations();
    }

    requestAnimationFrame(() => this.animateIn());
  }

  close(): void {
    this.teardownEvents();
    this.animateOut();
  }

  private repositionInZone = () =>
    this.zone.run(() => this.dropdown.reposition());

  private animateIn(): void {
    waitForAnimation(this.dropdownElement, () => {
      this.animationClass = this.transitionedInClass;
    });
  }

  private animateOut(): void {
    let parentElement = this.dropdown.renderInPlace ?
      this.dropdownElement.parentElement!.parentElement :
      this.dropdownElement.parentElement;
    let clone = this.dropdownElement.cloneNode(true) as HTMLElement;
    clone.id = `${this.dropdownElement.id}--clone`;
    clone.classList.remove(this.transitionedInClass);
    clone.classList.remove(this.transitioningInClass);
    clone.classList.add(this.transitioningOutClass);
    parentElement!.appendChild(clone);
    this.animationClass = this.transitioningInClass;
    waitForAnimation(clone, () => parentElement!.removeChild(clone));
  }

  private handleRootMouseDown = (e: Event): void => {
    if (this.hasMoved || this.dropdownElement.contains(<Node>e.target) ||
        this.triggerElement && this.triggerElement.contains(<Node>e.target)) {
      this.hasMoved = false;
      return;
    }

    let closestDropdown = closest(<Element>e.target, 'ng-dropdown-content');
    if (closestDropdown) {
      let trigger = document.querySelector(
        `[aria-controls=${closestDropdown.getAttribute('id')}]`
      );
      let parentDropdown = closest(trigger!, 'ng-dropdown-content');
      if (parentDropdown &&
          parentDropdown.getAttribute('id') === this.dropdown.dropdownId) {
        this.hasMoved = false;
        return;
      }
    }

    this.dropdown.close(true);
  }

  private startObservingDomMutations(): void {
    if (MutationObserver) {
      this.mutationObserver = new MutationObserver((mutations: any) => {
        if (mutations[0].addedNodes.length ||
            mutations[0].removedNodes.length) {
          this.repositionInZone();
        }
      });
      this.mutationObserver!.observe(this.dropdownElement, {
        childList: true,
        subtree: true
      });
    }
    else {
      this.dropdownElement.addEventListener('DOMNodeInserted', this.repositionInZone, false);
      this.dropdownElement.addEventListener('DOMNodeRemoved', this.repositionInZone, false);
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
      if (this.dropdownElement) {
        this.dropdownElement.removeEventListener('DOMNodeInserted', this.repositionInZone);
        this.dropdownElement.removeEventListener('DOMNodeRemoved', this.repositionInZone);
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

  private touchStartHandler = (e: Event) => {
    document.body.addEventListener('touchmove', this.touchMoveHandler, true);
  }

  private touchMoveHandler = (e: Event) => {
    this.hasMoved = true;
    document.body.removeEventListener('touchmove', this.touchMoveHandler, true);
  }

  private teardownEvents() {
    this.removeGlobalEvents();
    this.stopObservingDomMutations();
    document.body.removeEventListener('mousedown', this.handleRootMouseDown, true);

    if (this.isTouchDevice) {
      document.body.removeEventListener('touchstart', this.touchStartHandler, true);
      document.body.removeEventListener('touchend', this.handleRootMouseDown, true);
    }
  }
}
