import type { Card, CardLocation, GameState } from "../types/index";
import * as debug from './debug.ts';
import * as database from './database.ts'
import { showGreeter } from './greeter.ts';
import { createContainerElems, generateFancyHoursMinutes, generateFancyDate, calcTimeDiff } from "./helpers.ts"

// Elementi igre
const dealPileEl = document.getElementById('deck-pile') as HTMLElement
const dealEl = document.getElementById('deck-deal') as HTMLElement
const finishContainerEl = document.getElementById('finish') as HTMLElement
const deskContainerEl = document.getElementById('board') as HTMLElement
const spriteImg = document.getElementById('cards-png') as HTMLImageElement

// Kontrolni gumbovi
const resetEl = document.getElementById('reset-game') as HTMLElement

/// Ova varijabla kontrolira debug elemente
export const debugEnabled = false

//// Postavljanje igre \\\\

/// Funkcija koja postavlja igru, pozvana kad se stranica učita
const initializeGame = async () => {

    const savedNameQuery = await fetch('/api/currentplayer', { method: 'GET', headers: { 'Accept': 'text/plain' } })
    const savedName = await savedNameQuery.text()
    console.log(`curr playername: ${savedName}, ${gameState.player_name}`)
    gameState.player_name = savedName
    putPlayerName(savedName)
    const css = document.createElement('style')
    const styles = `.card--front { background-image: url("${spriteImg.src}"); }`
    css.appendChild(document.createTextNode(styles))
    document.head.appendChild(css)

    // Napravi sve karte
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j <= 13; j++) {
            const el = document.createElement('div')
            el.classList.add('card', `card--${gameState.types[i]}-${j}`, 'card--back')

            gameState.cards.push({
                el: el,
                type: gameState.types[i],
                number: j,
                facingUp: false,
            })
        }
    }

    // Napravi završne hrpe
    for (let i = 0; i < 4; i++) {
        const el = document.createElement('div')
        el.classList.add('finish-deck', `finish-deck--${i}`)
        gameState.finish.push({
            el: el,
            cards: [],
        })
        finishContainerEl.appendChild(el)
    }

    // Napravi hrpe na stolu
    for (let i = 0; i < 7; i++) {
        const el = document.createElement('div')
        el.classList.add('board-deck', `board-deck--${i}`)
        gameState.desk.push({
            el: el,
            cards: [],
        })
        deskContainerEl.appendChild(el)
    }

    resetEl.onclick = clickReset
    if (debugEnabled) {
        debug.populateDebugElems()
    }
    resetCards()
    console.log(`initgame, playername: ${savedName}, ${gameState.player_name}`)
    if (gameState.player_name === '/') {
        showGreeter()
    } else {
        updateCurrentPlayer()
    }
}

if (document.location.pathname === '/home') {
    document.addEventListener('DOMContentLoaded', initializeGame)
}

/// Kad korisnik pokuša zatvoriti stranicu, provjerimo treba li napraviti zapis
const onTryExit = (_event: Event) => {
    if (calculateScore() > 0) {
        writeGame()
    }
}

/// Postavljamo početno vrijeme i počinjemo slušati za pokušaj izlazak iz igre
export const setStartTime = async () => {
    startTime = new Date()
    window.addEventListener('beforeunload', onTryExit)
}


export const putPlayerName = async (name: string) => {
    await fetch('/api/updatecurrentplayer', {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: `${name}`
    })
}

/// Zapisuje rezultat u bazu
const writeGame = () => {
    if (gameState.player_name !== '/') {
        if (!endTime) {
            endTime = new Date()
        }
        database.writeResultToDb(gameState.player_name, generateFancyHoursMinutes(startTime), generateFancyHoursMinutes(endTime), calcTimeDiff(startTime, endTime), generateFancyDate(endTime), calculateScore())
    }
}

// Vrijeme početka, milisekunde on 01.01.1970.
let startTime: Date

/// Što se dogodi kad klikeno 'Nova igra'
const clickReset = () => {
    endTime = new Date()
    if (calculateScore() > 0) {
        writeGame()
    }
    resetCards()
}

/// Postavljanje karti na hrpe
export const resetCards = () => {
    if (document.getElementById("greeter-outer"))
        return

    const victoryElement = document.getElementById('victory-container-outer')
    victoryElement?.remove()

    // clear decks
    for (let i = 0; i < 7; i++) {
        const { el } = gameState.desk[i]
        if (el !== null) {
            el.onclick = handleClick(i, el)
        }
        gameState.desk[i].cards = []
    }
    for (let i = 0; i < 4; i++) {
        gameState.finish[i].cards = []
    }
    gameState.deal.pile.cards = []
    gameState.deal.deal.cards = []

    // randomise cards
    gameState.cards.sort(() => (Math.random() < 0.5 ? -1 : 1))

    requestAnimationFrame(() => {
        for (let i = 0; i < gameState.finish.length; i++) {
            const { el } = gameState.finish[i]
            if (el !== null) {
                el.onclick = handleClick(i, el)
            }
        }
        for (let i = 0; i < gameState.cards.length; i++) {
            const { facingUp, el } = gameState.cards[i]
            gameState.deal.pile.cards.push(i)

            el.onclick = handleClick(i, el)

            if (facingUp) {
                faceDown(i)
            }
            dealPileEl.appendChild(el)
        }
        let card = 0
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const last = getLastOnDesk(j)
                if (last !== null) {
                    appendCardElToCard(last, card)
                } else {
                    appendToDesk(j, card)
                }

                gameState.desk[j].cards.push(card)

                const index = gameState.deal.pile.cards.indexOf(card)
                gameState.deal.pile.cards.splice(index, 1)

                if (j === i) {
                    faceUp(card)
                }
                card++
            }
        }
    })
    if (debugEnabled) {
        console.log(`------- New Game -------`)
    }

    calculateScore()
    setStartTime()
}

/// Objekt koji sadrži informacije o cijeloj igri. Prati sve karte u igri i gdje se one nalaze
export const gameState: GameState = {
    types: ['c', 'd', 'h', 's'],
    colors: { c: 0, d: 1, h: 1, s: 0 },
    /// Sadrži objekte karti
    cards: [],
    deal: {
        pile: {
            el: null,
            /// Indeksi karti
            cards: [],
        },
        deal: {
            el: null,
            /// Indeksi karti
            cards: [],
        },
    },
    /// Sadrži hrpe
    finish: [],
    /// Sadrži hrpe
    desk: [],
    /// Sadrži Destination objekte
    destinations: [],
    /// Ime trentunog igrača
    player_name: "/"
}


//// Jednostavne funkcije vezane za karte \\\\

/// Jednostavna funkcija za provjerivanje da li je x tipa Card
const isCard = (x: any): x is Card => {
    return (x as Card) !== undefined && (x as Card) !== null;
}

/// Getter funkcija, dobavljanje karte po indeksu
const getCard = (cardIndex: number) => gameState.cards[cardIndex]

/// Jednostavna funkcija za provjerivanje da li je x tipa CardLocation
const isCardLocation = (x: any): x is CardLocation => {
    return (x as CardLocation) !== undefined && (x as CardLocation) !== null;
}

/// Nalazi lokaciju karte po indeksu
const getCardLocation = (cardIndex: number): CardLocation | undefined => {
    for (let i = 0; i < 7; i++) {
        const returnCardIndex = gameState.desk[i].cards.indexOf(cardIndex)
        /// indexOf vraća -1 ako ne postoji u arrayu
        if (returnCardIndex > -1) {
            return { location: 'desk', pileIndex: i, cardIndexInDeck: returnCardIndex }
        }
    }

    for (let i = 0; i < 4; i++) {
        const returnCardIndex = gameState.finish[i].cards.indexOf(cardIndex)
        /// indexOf vraća -1 ako ne postoji u arrayu
        if (returnCardIndex > -1) {
            return { location: 'finish', pileIndex: i, cardIndexInDeck: returnCardIndex }
        }
    }

    const indexInDealPile = gameState.deal.pile.cards.indexOf(cardIndex)
    if (indexInDealPile > -1) {
        return { location: 'deal', pileIndex: 'pile', cardIndexInDeck: indexInDealPile }
    }

    const indexInDealDeal = gameState.deal.deal.cards.indexOf(cardIndex)
    if (indexInDealDeal > -1) {
        return { location: 'deal', pileIndex: 'deal', cardIndexInDeck: indexInDealDeal }
    }
    if (debugEnabled) {
        console.log(`getCardLocation nije pronašo kartu sa indexom ` + cardIndex)
    }
    return undefined;

}

/// Možemo li staviti kartu indeksa placingIndex na kartu indeksa placedOnIndex? Samo za karte na stolu
const canBePlacedOnCard = (placingIndex: number, placedOnIndex: number): boolean => {
    const placingCard = getCard(placingIndex)
    const placedOnCard = getCard(placedOnIndex)
    if ((gameState.colors[placedOnCard.type] !== gameState.colors[placingCard.type]) && placedOnCard.number - 1 === placingCard.number) {
        return true
    }
    return false
}

/// Pokazuje lice karte
const faceUp = (cardIndex: number) => {
    gameState.cards[cardIndex].facingUp = true
    requestAnimationFrame(() => {
        gameState.cards[cardIndex].el.classList.add('card--front')
        gameState.cards[cardIndex].el.classList.remove('card--back')
    })
}

/// Sakriva lice karte
const faceDown = (cardIndex: number) => {
    gameState.cards[cardIndex].facingUp = false
    requestAnimationFrame(() => {
        gameState.cards[cardIndex].el.classList.remove('card--front')
        gameState.cards[cardIndex].el.classList.add('card--back')
    })
}

/// Getter funkcija za hrpu po lokaciji i indeksu
const getPile = (location: 'desk' | 'deal' | 'finish', deckIndex: number | 'pile' | 'deal') => {
    if (location === 'deal')
        return gameState.deal[deckIndex as 'pile' | 'deal']
    return gameState[location][deckIndex as number]
}

/// Nalazi zanju kartu na stolu indeksu deskIndex
const getLastOnDesk = (deskIndex: number): number | null => {
    const deskLength = gameState.desk[deskIndex].cards.length
    if (!deskLength)
        return null
    return gameState.desk[deskIndex].cards[deskLength - 1]
}

/// Nalazi zanju kartu na stolu indeksu deskIndex i pokazuje njezino lice
const faceUpLastOnDesk = (deskIndex: number) => {
    const lastOnDesk = getLastOnDesk(deskIndex)
    if (!lastOnDesk) {
        return
    }
    faceUp(lastOnDesk)
}

/// Dodaje element karte na element druge karte
const appendCardElToCard = (targetCardIndex: number, cardIndex: number) => {
    gameState.cards[targetCardIndex].el.appendChild(gameState.cards[cardIndex].el)
}

/// Dodaje element karte indeksa cardIndex na stolnu hrpu indeksa deskIndex 
const appendToDesk = (deskIndex: number, cardIndex: number) => {
    const targetDesk = gameState.desk[deskIndex]
    if (!targetDesk) {
        if (debugEnabled) {
            console.log(`Pokušao dodati kartu indeksa ` + { cardIndex } + ` nepostojećoj stolnoj hrpi` + { deskIndex });
        }
        return
    }
    targetDesk.el?.appendChild(gameState.cards[cardIndex].el)
}

/// Nalazi zadnju kartu na hrpi
const getLastOnPile = (deck: 'finish' | 'deal' | 'desk', deckIndex: number | 'pile' | 'deal'): Card | {} => {
    if (deck === 'deal') {
        if (deckIndex === 'pile') {
            const cardIndex = gameState.deal.pile.cards[gameState.deal.pile.cards.length - 1]
            return getCard(cardIndex)
        }
        if (deckIndex === 'deal') {
            const cardIndex = gameState.deal.deal.cards[gameState.deal.deal.cards.length - 1]
            return getCard(cardIndex)
        }
    }

    if (deck === 'desk') {
        const cardIndex = gameState.desk[deckIndex as number].cards[gameState.desk[deckIndex as number].cards.length - 1]
        return getCard(cardIndex)
    }

    if (deck === 'finish' && gameState.finish.length > 0) {
        const cardIndex = gameState.finish[deckIndex as number].cards[gameState.finish[deckIndex as number].cards.length - 1]
        return getCard(cardIndex)
    }

    return {}
}

/// Da li je cardIndex zadnja karta na hrpi?
const isLastOnPile = (cardIndex: number): boolean | null => {
    const locationInfo = getCardLocation(cardIndex)
    if (!isCardLocation(locationInfo))
        return null
    const { location, pileIndex } = locationInfo
    if (getLastOnPile(location, pileIndex) === getCard(cardIndex))
        return true
    return false
}

/// Pregledava igru za moguća odredišta za kartu cardIndex
const highlightAvailableDestinations = (cardIndex: number) => {
    const Card = getCard(cardIndex)
    // Ako je as (broj 1) pronađemo prazni finish
    if (Card.number === 1) {
        for (let i = 0; i < 4; i++) {
            const { el, cards } = getPile('finish', i)
            if (cards.length === 0) {
                gameState.destinations.push({
                    el: el,
                    target: {
                        location: 'finish',
                        pileIndex: i,
                        cardIndexInDeck: gameState.finish[i].cards.indexOf(cardIndex),
                    },
                    cardIndex,
                })
            }
        }

    }
    // Možemo li kartu staviti u koji finish?
    if (isLastOnPile(cardIndex)) {
        for (let i = 0; i < 4; i++) {
            if (gameState.finish[i].cards.length === 0) {
                continue
            }
            const lastCard = getLastOnPile('finish', i)
            if (isCard(lastCard)) {
                if (Card.type === lastCard.type && lastCard.number + 1 === Card.number) {
                    gameState.destinations.push({
                        el: lastCard.el,
                        target: {
                            location: 'finish',
                            pileIndex: i,
                            cardIndexInDeck: gameState.finish[i].cards.indexOf(cardIndex),
                        },
                        cardIndex,
                    })
                }
            }
        }
    }

    // Može li karta stati gdje na stolu?
    for (let i = 0; i < 7; i++) {
        const lastOnDesk = getLastOnDesk(i)
        if (lastOnDesk !== null) {
            if (canBePlacedOnCard(cardIndex, lastOnDesk)) {
                gameState.destinations.push({
                    el: gameState.cards[lastOnDesk].el,
                    target: {
                        location: 'desk',
                        pileIndex: i,
                        cardIndexInDeck: gameState.desk[i].cards.indexOf(cardIndex),
                    },
                    cardIndex,
                })
            }
        } else {
            /// Kralj
            if (Card.number !== 13) {
                continue
            }
            gameState.destinations.push({
                el: gameState.desk[i].el,
                target: {
                    location: 'desk',
                    pileIndex: i,
                    cardIndexInDeck: gameState.desk[i].cards.indexOf(cardIndex),
                },
                cardIndex,
            })
        }
    }
    highlightDestinations()
}

/// Napravi mali highlight na potencijalnim odredištima 
const highlightDestinations = () => {
    for (var destination of gameState.destinations) {
        const { el } = destination
        el?.classList.add('highlight')
    }
}

/// Makne sve highlight elemente
const removeHighlights = () => {
    for (var destination of gameState.destinations) {
        const { el } = destination
        el?.classList.remove('highlight')
    }
    gameState.destinations = []
}

/// Pomiče kartu indeksa cardIndex i sve karte poslije nje u listi u odredišnu hrpu destinationDeck indeksa deckIndex
const moveCardToDeck = (cardIndex: number, destinationDeck: string, deckIndex: number | 'pile' | 'deal') => {
    const locationInfo = getCardLocation(cardIndex)
    if (!isCardLocation(locationInfo)) {
        return
    }

    const { location, pileIndex: pile, cardIndexInDeck: cardIndexInLocation } = locationInfo

    /// Array za pomaknuti
    let movingArray: number[]

    if (location === 'deal') {
        movingArray = gameState[location][pile as 'deal' | 'pile'].cards.filter(
            (elem, _index, array) => array.indexOf(elem) >= cardIndexInLocation
        )
    } else {
        movingArray = gameState[location][pile as number].cards.filter(
            (elem, _index, array) => array.indexOf(elem) >= cardIndexInLocation
        )
    }
    if (location === 'deal') {
        gameState[location][pile as 'deal' | 'pile'].cards = gameState[location][pile as 'deal' | 'pile'].cards.filter(
            (elem) => movingArray.indexOf(elem) === -1
        )
    } else {
        gameState[location][pile as number].cards = gameState[location][pile as number].cards.filter(
            (elem) => movingArray.indexOf(elem) === -1
        )
    }

    if (destinationDeck === 'deal') {
        gameState[destinationDeck][deckIndex as 'deal' | 'pile'].cards = gameState[destinationDeck][deckIndex as 'deal' | 'pile'].cards.concat(movingArray)
    } else {
        gameState[destinationDeck as 'finish' | 'desk'][deckIndex as number].cards = gameState[destinationDeck as 'finish' | 'desk'][deckIndex as number].cards.concat(movingArray)
    }

    calculateScore()
    checkFinish()
    if (debugEnabled) {
        console.log(`Moved`)
        console.log(getCard(cardIndex))
        console.log(`from ` + location + ` ` + pile + ` to ` + destinationDeck + ` ` + deckIndex)
    }

}

//// Događaji kad kliknemo elemente \\\\

/// Što se dogodi kad kliknemo element
const handleClick = (index: number, clickedEl: HTMLElement) => (event: MouseEvent) => {
    event.stopPropagation()

    if (document.getElementById('greeter-outer')) {
        return
    }

    if (clickedEl.classList.contains('card')) {
        return handleCardClick(index, clickedEl)
    }

    if (clickedEl.classList.contains('finish-deck') || clickedEl.classList.contains('board-deck')) {
        return handleDeckClick(clickedEl)
    }

}

/// Što se dogodi kad kliknemo hrpu
const handleDeckClick = (clickedEl: HTMLElement) => {
    if (gameState.destinations.length === 0 || !clickedEl.classList.contains('highlight')) {
        removeHighlights()
        return
    }

    for (var destination of gameState.destinations) {
        if (destination.el !== clickedEl) {
            continue
        }

        const locationInfo = getCardLocation(destination.cardIndex)
        const card = getCard(destination.cardIndex)
        moveCardToDeck(destination.cardIndex, destination.target.location, destination.target.pileIndex)
        if (isCardLocation(locationInfo)) {
            if (locationInfo.location === 'desk') {
                faceUpLastOnDesk(locationInfo.pileIndex as number)
            }
        }
        clickedEl.appendChild(card.el)

        for (var destinationToClear of gameState.destinations) {
            destinationToClear.el?.classList.remove('highlight')
        }
        gameState.destinations = []
    }
}

/// Što se dogodi kad kliknemo kartu
const handleCardClick = (cardIndex: number, clickedEL: HTMLElement) => {
    const { el, facingUp } = getCard(cardIndex)
    const locationInfo = getCardLocation(cardIndex)

    if (!locationInfo)
        return

    if (!facingUp) {
        /// Jedino reagiramo ako smo kliknuli hrpu
        if (!(locationInfo.location === 'deal' && locationInfo.pileIndex === 'pile')) {
            return
        }

        if (gameState.destinations.length !== 0) {
            removeHighlights()
            return
        }
        // Ako je nešto u deal-u, prvo ga vratimo na hrpu
        if (gameState.deal.deal.cards.length > 0) {
            for (var localCardIndex of gameState.deal.deal.cards) {
                const { el: localCardEl } = getCard(localCardIndex)
                dealPileEl.appendChild(localCardEl)
                faceDown(localCardIndex)
            }
            /// Typescript nema concat() koji dopušta spajanje lista tako da lista 1 ide na početak liste 2, tako da moram to ovako napraviti
            const middleArray = gameState.deal.deal.cards.reverse().concat(gameState.deal.pile.cards)
            gameState.deal.pile.cards = middleArray
            gameState.deal.deal.cards = []
        }

        const pileLength = gameState.deal.pile.cards.length

        for (var i = pileLength - 1; i > Math.max(-1, pileLength - 4); i--) {
            const localCardIndex = gameState.deal.pile.cards[i]
            faceUp(localCardIndex)
            moveCardToDeck(localCardIndex, 'deal', 'deal')
            const { el: localCardEl } = getCard(localCardIndex)
            dealEl.appendChild(localCardEl)
        }
        return
    }

    /// Samo zadnju kartu možemo pomicati na deal-u
    if (locationInfo.location === 'deal' && locationInfo.pileIndex === 'deal') {
        const lastOnPile = getLastOnPile('deal', 'deal')
        if (isCard(lastOnPile)) {
            if (el !== lastOnPile.el) {
                return
            }
        }
    }

    /// Pokažemo moguća odredišta ako ih trenutno nema
    if (gameState.destinations.length === 0) {
        highlightAvailableDestinations(cardIndex)
        return
    }

    if (!clickedEL.classList.contains('highlight')) {
        removeHighlights()
        return
    }

    for (var destination of gameState.destinations) {
        if (destination.el !== clickedEL) {
            continue
        }

        const locationInfo = getCardLocation(destination.cardIndex)
        const card = getCard(destination.cardIndex)
        moveCardToDeck(destination.cardIndex, destination.target.location, destination.target.pileIndex)
        if (isCardLocation(locationInfo)) {
            if (locationInfo.location === 'desk') {
                faceUpLastOnDesk(locationInfo.pileIndex as number)
            }
            clickedEL.appendChild(card.el)
        }

        for (var destinationToClear of gameState.destinations) {
            destinationToClear.el?.classList.remove('highlight')
        }
        gameState.destinations = []
    }
}

//// Sve u vezi finish-a \\\\

/// Provjera da li je igra gotova
const checkFinish = () => {
    // Provjera da li je igra gotova
    for (let finishDeckIndex = 0; finishDeckIndex <= gameState.finish.length - 1; finishDeckIndex++) {
        if (gameState.finish[finishDeckIndex].cards.length !== 13) {
            return
        }
    }
    displayFinish()
}

/// Pokazujemo igraču završetak
export const displayFinish = () => {
    if (document.getElementById('victory-container-outer')) {
        return
    }

    const { outerContainerEl: _, innerContainerEl } = createContainerElems('victory-container')

    const victoryText = document.createElement('p')
    victoryText.classList.add('victory-text')
    victoryText.innerText = 'Pobjeda!'
    innerContainerEl.appendChild(victoryText)

    const victorySubText = document.createElement('p')
    victorySubText.classList.add('victory-subtext')
    const endtimestring = calculateEndTime()
    victorySubText.innerText = `Vaše vrijeme:\n ${endtimestring}`
    victoryText.appendChild(victorySubText)
}


let endTime: Date
/// Izračun vremena od početka igre. U minutama i sekundama.
export const calculateEndTime = () => {
    // Vrijeme kraja, milisekunde on 01.01.1970.
    endTime = new Date()
    const timeToFinish = new Date(endTime.getTime() - startTime.getTime())
    const minutes = timeToFinish.getMinutes()
    const seconds = timeToFinish.getSeconds()
    return ((minutes < 10) ? '0' : '') + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds
}

/// Ažuriranje trenutnog igrača, ako nemamo igrača onda ne prikazujemo relevantne elemente
export const updateCurrentPlayer = () => {
    const currentplayerdiv = document.getElementById('currentplayer')
    const currentplayertext = document.getElementById('currentplayertext')
    const logoutLink = document.getElementById('logout')
    if (gameState.player_name === '/' && currentplayerdiv) {
        currentplayerdiv.style.display = "none"
        return
    }

    if (currentplayerdiv) {
        currentplayerdiv.style.display = "flex"
    }
    if (currentplayertext) {
        currentplayertext.innerText = `Trenutni igrač: ${gameState.player_name}`
    }

    if (logoutLink) {
        logoutLink.onclick = () => {
            window.removeEventListener('beforeunload', onTryExit)
            resetCards()
            logOut()
        }
    }
}

/// Odjavljujemo igrača i pokazujemo login
const logOut = () => {
    gameState.player_name = '/'
    putPlayerName('/')
    showGreeter()
}

// Kalkulacija bodova, 1 karta na finish-u = 1 bod
const calculateScore = () => {
    let score = 0
    for (let finishDeckIndex = 0; finishDeckIndex <= gameState.finish.length - 1; finishDeckIndex++) {
        score += gameState.finish[finishDeckIndex].cards.length
    }

    const scoreEl = document.getElementById('score')
    if (scoreEl) {
        scoreEl.innerText = `Bodovi: ${score}`
    }
    return score
}
