import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { GroupType } from '../../models/group-type.model';
import { Group } from '../../models/group.model';
import { GroupFacade } from '../../services/group-facade.service';
import { GroupService } from '../../services/group.service';
import { GroupItemComponent } from './group-item.component';

describe('Group cover selection', () => {
  const facade = jasmine.createSpyObj<GroupFacade>('GroupFacade', [
    'createGroup',
    'updateGroup',
  ]);
  const service = jasmine.createSpyObj<GroupService>('GroupService', ['getOne']);
  let fixture: ComponentFixture<GroupItemComponent>;

  function render(group: Partial<Group>) {
    service.getOne.and.returnValue(of({ currency: 'EUR', name: 'Shared', ...group } as Group));
    fixture = TestBed.createComponent(GroupItemComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function options(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.cover-option'));
  }

  function selectedLabels(): (string | null)[] {
    return options()
      .filter((option) => option.getAttribute('aria-pressed') === 'true')
      .map((option) => option.getAttribute('aria-label'));
  }

  beforeEach(() => {
    facade.createGroup.calls.reset();
    facade.updateGroup.calls.reset();
    const saved = { id: 'saved' } as Group;
    facade.createGroup.and.returnValue(of(saved));
    facade.updateGroup.and.returnValue(of(saved));

    TestBed.configureTestingModule({
      imports: [GroupItemComponent],
      providers: [
        provideIonicAngular({ animated: false }),
        provideRouter([]),
        { provide: GroupFacade, useValue: facade },
        { provide: GroupService, useValue: service },
        { provide: UiService, useValue: { itemLoading: () => false } },
        { provide: ToastService, useValue: { successToast: () => undefined } },
      ],
    });
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  it('selects the first Other cover on creation and sends its key on submit', () => {
    const component = render({ id: 'new' });
    expect(selectedLabels()).toEqual(['other 1']);
    expect(facade.createGroup).not.toHaveBeenCalled();

    component.submit();
    expect(facade.createGroup).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: GroupType.Other, coverImageKey: 'other-1' }),
    );
  });

  it('loads an existing cover and keeps exactly one selected when another is tapped', () => {
    const component = render({
      id: 'saved',
      type: GroupType.Trip,
      coverImageKey: 'paris-sunset',
    });
    expect(selectedLabels()).toEqual(['paris sunset']);

    options()[1].click();
    fixture.detectChanges();
    expect(selectedLabels()).toEqual(['banja luka sunset']);
    options()[1].click();
    fixture.detectChanges();
    expect(selectedLabels()).toEqual(['banja luka sunset']);
    expect(facade.updateGroup).not.toHaveBeenCalled();

    component.submit();
    expect(facade.updateGroup).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 'saved',
        type: GroupType.Trip,
        coverImageKey: 'banja-luka-sunset',
      }),
    );
  });

  it('filters covers and resets the selection when the group type changes', () => {
    const component = render({
      id: 'saved',
      type: GroupType.Couple,
      coverImageKey: 'couple-2',
    });
    component.changeGroupType(GroupType.Roommates);
    fixture.detectChanges();

    expect(options().map((option) => option.getAttribute('aria-label'))).toEqual([
      'roommate 1',
      'roommate 2',
      'roommate 3',
      'roommate 4',
      'roommate 5',
    ]);
    expect(selectedLabels()).toEqual(['roommate 1']);
    expect(options()[0].querySelector('img')?.getAttribute('src')).toBe(
      'assets/images/group-cover/thumbnails/roommate-1.webp',
    );
    expect(component.form.controls.coverImageKey.value).toBe('roommate-1');
    expect(facade.updateGroup).not.toHaveBeenCalled();
  });

  it('selects a default for a legacy group without a saved key', () => {
    render({ id: 'saved', type: GroupType.Couple, coverImageKey: null });
    expect(selectedLabels()).toEqual(['couple 1']);
  });

  it('shows navigation for overflowing covers and updates the available directions', () => {
    render({ id: 'new', type: GroupType.Trip });
    const root = fixture.nativeElement as HTMLElement;
    const strip = root.querySelector<HTMLElement>('.cover-strip')!;
    spyOnProperty(strip, 'clientWidth').and.returnValue(230);
    spyOnProperty(strip, 'scrollWidth').and.returnValue(460);
    const scrollLeft = spyOnProperty(strip, 'scrollLeft').and.returnValue(0);
    strip.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    const previous = root.querySelector<HTMLButtonElement>('[aria-label="Previous covers"]')!;
    const next = root.querySelector<HTMLButtonElement>('[aria-label="Next covers"]')!;
    expect(previous.disabled).toBeTrue();
    expect(next.disabled).toBeFalse();

    const scroller: { scrollBy(options: ScrollToOptions): void } = strip;
    const scrollBy = spyOn(scroller, 'scrollBy');
    next.click();
    expect(scrollBy).toHaveBeenCalledWith(jasmine.objectContaining({ left: 230 }));

    scrollLeft.and.returnValue(230);
    strip.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(previous.disabled).toBeFalse();
    expect(next.disabled).toBeTrue();
    expect(selectedLabels()).toEqual(['alicante sunset']);

    previous.click();
    expect(scrollBy).toHaveBeenCalledWith(jasmine.objectContaining({ left: -230 }));
  });

  it('blocks submission when the selected key is missing or from another type', () => {
    const component = render({ id: 'new' });
    for (const key of ['', 'couple-1']) {
      component.form.controls.coverImageKey.setValue(key);
      expect(component.form.hasError('invalidGroupCover')).toBeTrue();
      component.submit();
    }
    expect(facade.createGroup).not.toHaveBeenCalled();
  });
});
