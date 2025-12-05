/// Tip karte, clubs, diamonds, hearts, spades
export type CardType = 'c' | 'd' | 'h' | 's'

/// Boja karte, 0 crna, 1 crvena
export type CardColor = 0 | 1

/// Opisuje kartu
export interface Card {
    // Poveznica na HTML element
    el: HTMLElement
    // Tip karte
    type: CardType
    // Broj karte
    number: number
    // Na koju stranu je karta okrenuta. true -> lice karte vidljivo, false -> lice karte nevidljivo
    facingUp: boolean
}

/// Gdje se karta nalazi
export interface CardLocation {
    // U kojoj se hrpi nalazi karta
    location: 'desk' | 'finish' | 'deal'
    // Ako je u finish/desku ovo je broj, oznacava u kojem redu se nalazi
    pileIndex: number | 'pile' | 'deal'
    // Pozicija karte u hrpi
    cardIndexInDeck: number
}

/// Gamestate prati stanje igre
export interface GameState {
    // Sadrži moguće tipove karti
    types: CardType[]
    // Tip karte: boja karte
    colors: Record<CardType, CardColor>
    // Sadrži sve karte u igri
    cards: Card[]
    // Sadrži deal hrpe
    deal: {
        // Hrpa sa kartama
        pile: DeckPile
        // Izdavajuča hrpa
        deal: DeckPile
    }
    // Finish hrpa
    finish: DeckPile[]
    // Hrpa na stolu
    desk: DeckPile[]
    // Trentune moguća odredišta za karte
    destinations: Destination[]
    // Ime trenutnog igrača
    player_name: string
}

/// Hrpa karata
export interface DeckPile {
    // Povezani HTML element
    el: HTMLElement | null
    // Lista indexa karti u hrpi
    cards: number[]
}

export interface Destination {
    // Element mogućeg odredišta
    el: HTMLElement | null
    // Lokacija odredišta
    target: CardLocation
    // Indeks karte koja se kreće
    cardIndex: number
}
