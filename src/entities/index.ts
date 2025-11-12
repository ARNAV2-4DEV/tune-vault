/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: playlists
 * Interface for Playlists
 */
export interface Playlists {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  playlistName?: string;
  /** @wixFieldType image */
  coverImage?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  creator?: string;
  /** @wixFieldType boolean */
  isPublic?: boolean;
  /** @wixFieldType date */
  creationDate?: Date | string;
}


/**
 * Collection ID: songs
 * Interface for Songs
 */
export interface Songs {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  artistName?: string;
  /** @wixFieldType text */
  albumName?: string;
  /** @wixFieldType number */
  duration?: number;
  /** @wixFieldType image */
  albumArt?: string;
  /** @wixFieldType text */
  genre?: string;
  /** @wixFieldType date */
  releaseDate?: Date | string;
  /** @wixFieldType text */
  spotifyTrackId?: string;
}


/**
 * Collection ID: topcharts
 * Interface for TopCharts
 */
export interface TopCharts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  songTitle?: string;
  /** @wixFieldType text */
  artistName?: string;
  /** @wixFieldType image */
  albumArt?: string;
  /** @wixFieldType number */
  chartPosition?: number;
  /** @wixFieldType text */
  duration?: string;
  /** @wixFieldType text */
  genre?: string;
  /** @wixFieldType url */
  externalUrl?: string;
}
