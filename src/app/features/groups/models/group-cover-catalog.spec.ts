import { resolveGroupCover } from './group-cover-catalog';
import { GroupType } from './group-type.model';

describe('Group overview cover resolution', () => {
  it('resolves hosted covers and keeps a local thumbnail for offline use', () => {
    const cover = resolveGroupCover(GroupType.Couple, 'couple-4');
    expect(cover.src).toBe('https://shareorb.app/group-covers/couple-4.jpg');
    expect(cover.thumbnailSrc).toBe('assets/images/group-cover/thumbnails/couple-4.webp');
    expect(resolveGroupCover(GroupType.Trip, 'paris-sunset').src).toBe(
      'https://shareorb.app/group-covers/paris-sunset.png',
    );
  });

  it('uses the default cover for the group type if the saved key is unavailable', () => {
    for (const key of [null, 'unknown', 'couple-4']) {
      expect(resolveGroupCover(GroupType.Roommates, key).src).toBe(
        'https://shareorb.app/group-covers/roommate-1.png',
      );
    }
    expect(resolveGroupCover(undefined).src).toBe(
      'https://shareorb.app/group-covers/other-1.png',
    );
  });
});
