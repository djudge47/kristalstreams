// Curated example title information, not a provider catalog or availability check.
export interface CatalogPreviewItem {
  id: number; title: string; image: string; category: string; releaseYear: number;
  type: 'movie' | 'tv' | 'sports'; description: string;
}

export const catalogPreviewItems: readonly CatalogPreviewItem[] = [
  {
    "id": 501,
    "title": "Sinners",
    "image": "https://media.themoviedb.org/t/p/w1280/4CkZl1LK6a5rXBqJB2ZP77h3N5i.jpg",
    "category": "Horror",
    "releaseYear": 2025,
    "type": "movie",
    "description": "Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back."
  },
  {
    "id": 502,
    "title": "Mickey 17",
    "image": "https://media.themoviedb.org/t/p/w1280/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg",
    "category": "Sci-Fi",
    "releaseYear": 2025,
    "type": "movie",
    "description": "Mickey Barnes has found himself in the extraordinary circumstance of working for an employer who demands the ultimate commitment to the job... to die, for a living."
  },
  {
    "id": 503,
    "title": "Superman",
    "image": "https://media.themoviedb.org/t/p/w1280/wPLysNDLffQLOVebZQCbXJEv6E6.jpg",
    "category": "Action",
    "releaseYear": 2025,
    "type": "movie",
    "description": "Superman embarks on a journey to reconcile his Kryptonian heritage with his human upbringing as Clark Kent of Smallville, Kansas."
  },
  {
    "id": 504,
    "title": "A Minecraft Movie",
    "image": "https://media.themoviedb.org/t/p/w1280/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
    "category": "Adventure",
    "releaseYear": 2025,
    "type": "movie",
    "description": "Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination."
  },
  {
    "id": 505,
    "title": "Severance",
    "image": "https://media.themoviedb.org/t/p/w1280/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
    "category": "Thriller",
    "releaseYear": 2025,
    "type": "tv",
    "description": "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. Season 2 continues as Mark and his friends learn the dire consequences of trifling with the severance barrier."
  },
  {
    "id": 506,
    "title": "Andor",
    "image": "https://media.themoviedb.org/t/p/w1280/khZqmwHQicTYoS7Flreb9EddFZC.jpg",
    "category": "Sci-Fi",
    "releaseYear": 2025,
    "type": "tv",
    "description": "In an era filled with danger, deception and intrigue, Cassian Andor will discover the difference he can make in the struggle against the tyrannical Galactic Empire."
  },
  {
    "id": 507,
    "title": "The White Lotus",
    "image": "https://media.themoviedb.org/t/p/w1280/gbSaK9v1CbcYH1ISgbM7XObD2dW.jpg",
    "category": "Drama",
    "releaseYear": 2025,
    "type": "tv",
    "description": "A social satire set at an exclusive Thai resort following various guests and employees over the span of a week as darker complexities emerge."
  },
  {
    "id": 508,
    "title": "Adolescence",
    "image": "https://media.themoviedb.org/t/p/w1280/20i4nShZZg1g1VFHSB8xpaYM4r7.jpg",
    "category": "Crime",
    "releaseYear": 2025,
    "type": "tv",
    "description": "When a 13-year-old is accused of the murder of a classmate, his family, therapist and the detective in charge are all left asking: what really happened?"
  }
];

export function findCatalogPreview(type: string | undefined, id: string | undefined) {
  if (!id || !/^[1-9]\d*$/.test(id)) return undefined;
  const number = Number(id);
  if (!Number.isSafeInteger(number)) return undefined;
  return catalogPreviewItems.find(item => item.id === number && item.type === type);
}
