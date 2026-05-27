export type BarReview = {
  id: string;
  author: string;
  text: string;
  rating: number;
};

export type Bar = {
  id: string;
  name: string;
  type: string;
  neighborhood: string;
  distance: string;
  rating: number;
  reviews: number;
  price: string;
  latitude: number;
  longitude: number;
  isSaved: boolean;
  image: string;
  tags: string[];
  about: string;
  reviewHighlights: BarReview[];
  isImported?: boolean;
  phone?: string | null;
  businessHours?: string | null;
  formattedAddress?: string | null;
  poiType?: string | null;
  website?: string | null;
  amapPhotoUrls?: string[];
};

export const featuredBars: Bar[] = [
  {
    id: 'alchemy',
    name: 'The Alchemist',
    type: 'Cocktail Bar',
    neighborhood: "Jing'an",
    distance: '1.2 km',
    rating: 4.8,
    reviews: 128,
    price: '180 / person',
    latitude: 31.2298,
    longitude: 121.4548,
    isSaved: true,
    image:
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=85',
    tags: ['Cocktail', 'Date Night', 'Quiet'],
    about:
      'A polished cocktail lounge with warm lighting, precise drinks, and a calm late-night mood for unhurried conversations.',
    reviewHighlights: [
      { id: 'alchemy-r1', author: 'Mia', rating: 5, text: 'Beautiful room, excellent martinis, and the service felt effortless.' },
      { id: 'alchemy-r2', author: 'Leo', rating: 4.8, text: 'A premium spot for a quieter night out near Jing’an.' },
    ],
  },
  {
    id: 'sober-company',
    name: 'Sober Company',
    type: 'Speakeasy',
    neighborhood: 'Xuhui',
    distance: '1.6 km',
    rating: 4.6,
    reviews: 96,
    price: '150 / person',
    latitude: 31.2096,
    longitude: 121.4461,
    isSaved: false,
    image:
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=85',
    tags: ['Speakeasy', 'Craft', 'Hidden'],
    about:
      'A layered speakeasy experience with thoughtful cocktails, dim corners, and a discreet crowd after work.',
    reviewHighlights: [
      { id: 'sober-r1', author: 'Iris', rating: 4.7, text: 'The menu is playful without feeling loud. Great for a first stop.' },
      { id: 'sober-r2', author: 'Kevin', rating: 4.5, text: 'Low-key entrance, polished drinks, and a relaxed Xuhui energy.' },
    ],
  },
  {
    id: 'nest-rooftop',
    name: 'Nest Rooftop',
    type: 'Rooftop',
    neighborhood: 'Pudong',
    distance: '2.1 km',
    rating: 4.7,
    reviews: 76,
    price: '220 / person',
    latitude: 31.2382,
    longitude: 121.4996,
    isSaved: false,
    image:
      'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=900&q=85',
    tags: ['Rooftop', 'Skyline', 'Sunset'],
    about:
      'A refined rooftop bar with skyline views, soft seating, and an easy golden-hour atmosphere.',
    reviewHighlights: [
      { id: 'nest-r1', author: 'Alex', rating: 4.8, text: 'The view carries the night. Best right before sunset.' },
      { id: 'nest-r2', author: 'Nora', rating: 4.6, text: 'A little pricey, but the terrace feels genuinely special.' },
    ],
  },
  {
    id: 'la-social',
    name: 'La Social',
    type: 'Wine Bar',
    neighborhood: 'French Concession',
    distance: '2.3 km',
    rating: 4.5,
    reviews: 64,
    price: '130 / person',
    latitude: 31.2144,
    longitude: 121.4582,
    isSaved: true,
    image:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85',
    tags: ['Wine', 'Friends', 'Easygoing'],
    about:
      'A friendly wine bar with soft music, small plates, and a neighborhood feel that still reads elevated.',
    reviewHighlights: [
      { id: 'social-r1', author: 'June', rating: 4.5, text: 'Cozy without being cramped. A reliable place to meet friends.' },
      { id: 'social-r2', author: 'Sam', rating: 4.4, text: 'Great wine list and a very easy French Concession mood.' },
    ],
  },
  {
    id: 'violet-room',
    name: 'Violet Room',
    type: 'Live Music',
    neighborhood: 'Huangpu',
    distance: '2.8 km',
    rating: 4.9,
    reviews: 142,
    price: '210 / person',
    latitude: 31.2323,
    longitude: 121.4817,
    isSaved: false,
    image:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=85',
    tags: ['Live Music', 'Club', 'Late Night'],
    about:
      'A stylish late-night room with live sets, violet lighting, and a crowd that leans dressed-up but relaxed.',
    reviewHighlights: [
      { id: 'violet-r1', author: 'Luna', rating: 5, text: 'The music programming is excellent and the room photographs beautifully.' },
      { id: 'violet-r2', author: 'Chen', rating: 4.8, text: 'Best for a bigger night. Drinks are strong and the sound is clean.' },
    ],
  },
];

export const homeCategories = ['All', '\u9152\u5427', '\u6e05\u5427', 'Livehouse', '\u7cbe\u917f', 'Whisky'];

export function getBarById(id: string) {
  return featuredBars.find((bar) => bar.id === id);
}
