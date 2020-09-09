import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ReplaceableComponents } from '../models/replaceable-components';
import { BehaviorSubject, Observable } from 'rxjs';
import { noop } from '../utils/common-utils';
import { map, filter } from 'rxjs/operators';
import { InternalStore } from '../utils/internal-store-utils';

@Injectable({ providedIn: 'root' })
export class ReplaceableComponentsService {
  private store: InternalStore<ReplaceableComponents.ReplaceableComponent[]>;

  get replaceableComponents$(): Observable<ReplaceableComponents.ReplaceableComponent[]> {
    return this.store.sliceState(state => state);
  }

  get replaceableComponents(): ReplaceableComponents.ReplaceableComponent[] {
    return this.store.state;
  }

  get onUpdate$(): Observable<ReplaceableComponents.ReplaceableComponent[]> {
    return this.store.sliceUpdate(state => state);
  }

  constructor(private ngZone: NgZone, private router: Router) {
    this.store = new InternalStore([]);
  }

  // TODO: Create a shared service for route reload and more
  private reloadRoute() {
    const { shouldReuseRoute } = this.router.routeReuseStrategy;
    const setRouteReuse = (reuse: typeof shouldReuseRoute) => {
      this.router.routeReuseStrategy.shouldReuseRoute = reuse;
    };

    setRouteReuse(() => false);
    this.router.navigated = false;

    this.ngZone.run(async () => {
      await this.router.navigateByUrl(this.router.url).catch(noop);
      setRouteReuse(shouldReuseRoute);
    });
  }

  add(replaceableComponent: ReplaceableComponents.ReplaceableComponent, reload?: boolean): void {
    let replaceableComponents = this.store.state;

    const index = replaceableComponents.findIndex(
      component => component.key === replaceableComponent.key,
    );

    if (index > -1) {
      replaceableComponents[index] = replaceableComponent;
    } else {
      replaceableComponents = [...replaceableComponents, replaceableComponent];
    }

    this.store.patch(replaceableComponents);

    if (reload) this.reloadRoute();
  }

  get(replaceableComponentKey: string): ReplaceableComponents.ReplaceableComponent {
    return this.replaceableComponents.find(component => component.key === replaceableComponentKey);
  }

  get$(replaceableComponentKey: string): Observable<ReplaceableComponents.ReplaceableComponent> {
    return this.replaceableComponents$.pipe(
      map(components => components.find(component => component.key === replaceableComponentKey)),
    );
  }
}
