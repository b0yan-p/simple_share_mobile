import { GroupType } from './group-type.model';

const COVER_FILES: Record<GroupType, string[]> = {
  [GroupType.Trip]: [
    'alicante-sunset.png',
    'banja-luka-sunset.png',
    'paris-sunset.png',
    'santorini-sunset.png',
    'seville-sunset.png',
    'tokyo-sunset.png',
  ],
  [GroupType.Roommates]: [
    'roommate-1.png',
    'roommate-2.png',
    'roommate-3.png',
    'roommate-4.png',
    'roommate-5.png',
  ],
  [GroupType.Couple]: [
    'couple-1.jpg',
    'couple-2.jpg',
    'couple-3.jpg',
    'couple-4.jpg',
    'couple-5.jpg',
  ],
  [GroupType.Other]: [
    'other-1.png',
    'other-2.png',
    'other-3.png',
    'other-4.png',
    'other-5.png',
  ],
};

const PUBLIC_COVER_ROOT = 'https://shareorb.app/group-covers';
const LOCAL_THUMBNAIL_ROOT = 'assets/images/group-cover/thumbnails';

export function getGroupCovers(type: GroupType) {
  return COVER_FILES[type].map((file) => {
    const key = file.slice(0, file.lastIndexOf('.'));
    return {
      key,
      src: `${PUBLIC_COVER_ROOT}/${file}`,
      thumbnailSrc: `${LOCAL_THUMBNAIL_ROOT}/${key}.webp`,
      label: key.replace(/-/g, ' '),
    };
  });
}

export function isGroupCoverKey(type: GroupType, key?: string | null): boolean {
  return getGroupCovers(type).some((cover) => cover.key === key);
}

export function resolveGroupCover(type: GroupType | undefined, savedKey?: string | null) {
  const covers = getGroupCovers(type ?? GroupType.Other);
  return covers.find((cover) => cover.key === savedKey) ?? covers[0];
}
