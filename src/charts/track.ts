// track.ts
export default class Track {
    public rank: number;
    public name: string;
    public artist: string;
    public playcount: number;
    public album?: string;

    constructor(name: string, artist: string, rank: number, playcount: number, album?: string) {
        this.name = name;
        this.artist = artist;
        this.rank = rank;
        this.playcount = playcount;
        this.album = album;
    }
}