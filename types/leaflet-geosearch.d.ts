declare module 'leaflet-geosearch' {
  import * as L from 'leaflet';
  export function GeoSearchControl(options: any): L.Control;
  export class OpenStreetMapProvider {
    constructor(options?: any);
    search(options: { query: string }): Promise<any[]>;
  }
}