export const GOLDEN_PHOTO_SLOTS = ['hero', 'story', 'gallery1', 'gallery2', 'gallery3', 'gallery4', 'gallery5', 'gallery6'] as const;
export type WeddingPhotoSlot = typeof GOLDEN_PHOTO_SLOTS[number];
export type WeddingPhotos = Partial<Record<WeddingPhotoSlot, string>>;

export interface WeddingEventDetails {
  title: string;
  time: string;
  venue: string;
}

export interface GoldenWeddingDetails {
  firstParents: string;
  secondParents: string;
  storyTitle: string;
  venueAddress: string;
  firstPhone: string;
  secondPhone: string;
  events: WeddingEventDetails[];
}

/** Defaults transcribed from the supplied Nimesh & Dilhani invitation. */
export const GOLDEN_WEDDING_DETAILS: GoldenWeddingDetails = {
  firstParents: 'Mr. & Mrs. Sunil Perera',
  secondParents: 'Mr. & Mrs. Ranjith Silva',
  storyTitle: 'Two Hearts, One Journey',
  venueAddress: 'Colombo, Sri Lanka',
  firstPhone: '+94777654321',
  secondPhone: '+94771234567',
  events: [
    { title: 'Poruwa Ceremony', time: '09:00', venue: 'Residence' },
    { title: 'Wedding Ceremony', time: '10:30', venue: 'Grand Monarch, Colombo' },
    { title: 'Reception', time: '18:30', venue: 'Grand Monarch, Colombo' },
    { title: 'After Party', time: '21:00', venue: 'Grand Monarch, Colombo' },
  ],
};
