import { defer, finalize, Observable, ReplaySubject, take } from 'rxjs';

/**
 * Kicks off a fire-and-forget loader and completes once it reports back.
 *
 * The loaders in this app subscribe to themselves and return void, so the only
 * way to know when one has finished is a subject they next on. Subscribing to
 * that subject *after* calling the loader would be a race: the offline branches
 * short-circuit before any I/O and settle synchronously, so the notification
 * would fire into nothing and the caller would wait forever. Relaying through a
 * ReplaySubject that is connected first closes that hole.
 */
export function runAndSettle(settled: Observable<void>, start: () => void): Observable<void> {
  return defer(() => {
    const relay = new ReplaySubject<void>(1);
    const sub = settled.pipe(take(1)).subscribe(relay);

    start();

    return relay.pipe(
      take(1),
      finalize(() => sub.unsubscribe()),
    );
  });
}
