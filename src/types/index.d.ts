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
        deal: DeckDeal
    }
    // Finish hrpa
    finish: FinishDeck[]
    // Hrpa na stolu
    desk: DeskDeck[]
    // Trentune moguća odredišta za karte
    destinations: Destination[]
}

/// Hrpa karata
export interface DeckPile {
    // Povezani HTML element
    el: HTMLElement | null
    // Lista indexa karti u hrpi
    cards: number[]
}

export interface DeckDeal extends DeckPile { }
export interface FinishDeck extends DeckPile { }
export interface DeskDeck extends DeckPile { }

export interface Destination {
    // Element mogućeg odredišta
    el: HTMLElement | null
    // Lokacija odredišta
    target: CardLocation
    // Indeks karte koja se kreće
    cardIndex: number
}


/*
//todo
export interface MovingState {
    card: Card | {} // Consider defining a more specific type or interface.
    element: HTMLElement | null
    index: number
    capture: boolean
    container: {
        cards: number[]
    }
    target: any // Define more specifically if possible.
    origin: any // Define more specifically if possible.
    offset: {
        x: number
        y: number
    }
    destinations: any[] // Define more specifically if possible.
}
*/