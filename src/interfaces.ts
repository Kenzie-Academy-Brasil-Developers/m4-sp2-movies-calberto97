
export interface iMovieRequest {
    name: string,
    description?: string,
    duration: number,
    price: number
}

export interface iMovieUpdateRequest {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
}

export interface iMovieResult extends iMovieRequest {
    id: number
}

export type tRequiredKeys = "name" | "duration" | "price";
export type tUpdateKeys =
  | "name"
  | "duration"
  | "description"
  | "price";