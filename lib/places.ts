import { canonicalCity, normalizeText } from "@/lib/city-names"

// Coordinates of towns, so searching a city can include whoever travels that far without asking a geocoder each time.
// Rounded to about a kilometre; the booking itself calculates the exact distance on the server.
const PLACES: Record<string, [number, number]> = {
  Amsterdam: [52.37, 4.9], Rotterdam: [51.92, 4.48], "Den Haag": [52.08, 4.3], Utrecht: [52.09, 5.12], Eindhoven: [51.44, 5.48], Groningen: [53.22, 6.57],
  Tilburg: [51.56, 5.09], Almere: [52.37, 5.22], Breda: [51.59, 4.78], Nijmegen: [51.84, 5.86], Apeldoorn: [52.21, 5.97], Haarlem: [52.38, 4.64],
  Arnhem: [51.98, 5.91], Enschede: [52.22, 6.89], Amersfoort: [52.16, 5.39], Zaandam: [52.44, 4.83], "'s-Hertogenbosch": [51.69, 5.31], Zwolle: [52.52, 6.09],
  Zoetermeer: [52.06, 4.49], Leiden: [52.16, 4.49], Leeuwarden: [53.2, 5.79], Maastricht: [50.85, 5.69], Dordrecht: [51.81, 4.67], Ede: [52.05, 5.67],
  "Alphen aan den Rijn": [52.13, 4.66], Alkmaar: [52.63, 4.75], Emmen: [52.78, 6.9], Delft: [52.01, 4.36], Venlo: [51.37, 6.17], Deventer: [52.25, 6.16],
  Sittard: [51.0, 5.87], Geleen: [50.97, 5.83], Helmond: [51.48, 5.66], Oss: [51.77, 5.52], Amstelveen: [52.3, 4.86], Hilversum: [52.22, 5.18], Heerlen: [50.89, 5.98],
  Purmerend: [52.5, 4.95], Roosendaal: [51.53, 4.46], Schiedam: [51.92, 4.4], Spijkenisse: [51.85, 4.33], Lelystad: [52.52, 5.47], Vlaardingen: [51.91, 4.34],
  Almelo: [52.36, 6.66], Gouda: [52.01, 4.71], Hoorn: [52.64, 5.06], Assen: [53.0, 6.56], "Bergen op Zoom": [51.49, 4.29], "Capelle aan den IJssel": [51.93, 4.58],
  Veenendaal: [52.03, 5.56], Katwijk: [52.2, 4.41], Zeist: [52.09, 5.24], Nieuwegein: [52.03, 5.09], Roermond: [51.19, 5.99], Woerden: [52.09, 4.88],
  Doetinchem: [51.96, 6.3], Middelburg: [51.5, 3.61], Vlissingen: [51.45, 3.57], "Den Helder": [52.96, 4.76], Terneuzen: [51.33, 3.83], Houten: [52.03, 5.17],
  IJsselstein: [52.02, 5.04], Vianen: [51.99, 5.09], Culemborg: [51.96, 5.23], Tiel: [51.89, 5.43], Bilthoven: [52.13, 5.2], Soest: [52.17, 5.29], Baarn: [52.21, 5.29],
  Huizen: [52.3, 5.24], Bussum: [52.27, 5.17], Naarden: [52.3, 5.16], Weesp: [52.31, 5.04], Diemen: [52.34, 4.96], Hoofddorp: [52.3, 4.69], Aalsmeer: [52.26, 4.76],
  Uithoorn: [52.24, 4.83], Mijdrecht: [52.21, 4.86], Haarlemmermeer: [52.3, 4.69], Heemstede: [52.35, 4.62], Zandvoort: [52.37, 4.53], Beverwijk: [52.49, 4.66],
  Heemskerk: [52.51, 4.67], Castricum: [52.55, 4.67], Heerhugowaard: [52.67, 4.85], Schagen: [52.79, 4.8], Volendam: [52.5, 5.07], Edam: [52.51, 5.05],
  Enkhuizen: [52.7, 5.29], Noordwijk: [52.24, 4.45], Lisse: [52.26, 4.56], Hillegom: [52.29, 4.58], Sassenheim: [52.23, 4.52], Voorschoten: [52.13, 4.45],
  Wassenaar: [52.14, 4.4], Voorburg: [52.07, 4.36], Rijswijk: [52.04, 4.32], Naaldwijk: [51.99, 4.21], Maassluis: [51.92, 4.25], Hellevoetsluis: [51.83, 4.13],
  Barendrecht: [51.86, 4.54], Ridderkerk: [51.87, 4.6], Zwijndrecht: [51.82, 4.63], Papendrecht: [51.83, 4.69], Sliedrecht: [51.82, 4.77], Gorinchem: [51.83, 4.97],
  Leerdam: [51.89, 5.09], Bodegraven: [52.08, 4.75], Waddinxveen: [52.04, 4.65], Waalwijk: [51.68, 5.07], Oosterhout: [51.64, 4.86], Etten: [51.57, 4.64],
  "Etten-Leur": [51.57, 4.64], Zevenbergen: [51.65, 4.6], Goes: [51.5, 3.89], Zierikzee: [51.65, 3.92], Veghel: [51.62, 5.55], Uden: [51.66, 5.62], Boxtel: [51.59, 5.33],
  Best: [51.51, 5.39], Veldhoven: [51.42, 5.4], Geldrop: [51.42, 5.56], Valkenswaard: [51.35, 5.46], Deurne: [51.46, 5.79], Boxmeer: [51.65, 5.94], Cuijk: [51.73, 5.88],
  Weert: [51.25, 5.71], Kerkrade: [50.87, 6.06], Venray: [51.53, 5.98], Wageningen: [51.97, 5.67], Zutphen: [52.14, 6.2], Winterswijk: [51.97, 6.72], Zevenaar: [51.93, 6.07],
  Barneveld: [52.14, 5.58], Nijkerk: [52.22, 5.48], Harderwijk: [52.34, 5.62], Ermelo: [52.3, 5.62], Epe: [52.35, 5.98], Nunspeet: [52.38, 5.78], Dronten: [52.53, 5.72],
  Emmeloord: [52.71, 5.75], Kampen: [52.56, 5.91], Meppel: [52.7, 6.19], Steenwijk: [52.79, 6.12], Hengelo: [52.27, 6.79], Oldenzaal: [52.31, 6.93], Rijssen: [52.31, 6.52],
  Raalte: [52.39, 6.28], Hardenberg: [52.57, 6.62], Hoogeveen: [52.72, 6.48], Coevorden: [52.66, 6.74], Drachten: [53.11, 6.1], Sneek: [53.03, 5.66],
  Heerenveen: [52.96, 5.92], Harlingen: [53.17, 5.42], Dokkum: [53.33, 6.0], Veendam: [53.11, 6.88], Winschoten: [53.14, 7.03], Stadskanaal: [52.99, 6.95], Delfzijl: [53.33, 6.92],
  Rhenen: [51.96, 5.57], "Wijk bij Duurstede": [51.97, 5.34], Maarssen: [52.14, 5.04], Breukelen: [52.17, 5.0], Scheveningen: [52.11, 4.28], Kaatsheuvel: [51.66, 5.03],
  Antwerpen: [51.22, 4.4], Gent: [51.05, 3.72], Brugge: [51.21, 3.22], Brussel: [50.85, 4.35], Leuven: [50.88, 4.7], Hasselt: [50.93, 5.34], Mechelen: [51.03, 4.48],
  Turnhout: [51.32, 4.94], Genk: [50.97, 5.5], Aalst: [50.94, 4.04], Kortrijk: [50.83, 3.26], Oostende: [51.23, 2.92], "Sint-Niklaas": [51.17, 4.14], Luik: [50.63, 5.57],
  Aken: [50.78, 6.08], Keulen: [50.94, 6.96], Dusseldorf: [51.23, 6.78], Munster: [51.96, 7.63], Duisburg: [51.43, 6.76], Essen: [51.46, 7.01],
}

const BY_NAME = new Map(Object.entries(PLACES).map(([name, point]) => [normalizeText(name), point]))

/** The coordinates of a town ("Utrecht", "Utrecht, Nederland"), or null when it is not in the table. */
function placeOf(text: string): [number, number] | null {
  const first = text.split(",")[0]
  return BY_NAME.get(normalizeText(canonicalCity(first))) ?? null
}

/** Straight-line distance in whole km, like the booking; null when one of the towns is unknown. */
export function townDistance(from: string, to: string): number | null {
  const a = placeOf(from)
  const b = placeOf(to)
  if (!a || !b) return null
  const rad = Math.PI / 180
  const h =
    Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}
