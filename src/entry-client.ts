import './style.scss'
import type { Card, CardLocation, GameState } from "./types";
import * as debug from './debug';

// Elementi igre
const dealPileEl = document.getElementById('deck-pile') as HTMLElement
const dealEl = document.getElementById('deck-deal') as HTMLElement
const finishContainerEl = document.getElementById('finish') as HTMLElement
const deskContainerEl = document.getElementById('board') as HTMLElement
const spriteImg = document.getElementById('cards-png') as HTMLImageElement

// Kontrolni gumbovi
const resetEl = document.getElementById('reset-game') as HTMLElement
const leaderboardEl = document.getElementById('leaderboard') as HTMLElement

/// Ova varijabla kontrolira debug elemente
const debugEnabled = true

//// Postavljanje igre \\\\

/// Funkcija koja postavlja igru, pozvana kad se stranica učita
const initializeGame = () => {
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

    resetEl.onclick = resetCards
    leaderboardEl.onclick = displayLeaderboard
    if (debugEnabled) {
        debug.populateDebugElems()
    }
    resetCards()
    showGreeter()
}

document.addEventListener('DOMContentLoaded', initializeGame)

// Vrijeme početka, milisekunde on 01.01.1970.
let startTime: number

/// Postavljanje karti na hrpe
const resetCards = () => {
    const victoryElement = document.getElementById('victory-container-outer')
    victoryElement?.remove()

    startTime = new Date().getTime()

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
    player_name: '/'
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

/// Pokazujemo igraču završetak
export const displayFinish = () => {
    if (document.getElementById('victory-container-outer')) {
        return
    }
    const outerContainerEl = document.createElement('div')
    outerContainerEl.classList.add('victory-container-outer')
    outerContainerEl.setAttribute("id", "victory-container-outer")
    document.body.appendChild(outerContainerEl)

    const innerContainerEl = document.createElement('div')
    innerContainerEl.classList.add('victory-container-inner')
    outerContainerEl.appendChild(innerContainerEl)

    const victoryText = document.createElement('p')
    victoryText.classList.add('victory-text')
    victoryText.innerText = 'Pobjeda!'
    innerContainerEl.appendChild(victoryText)

    const victorySubText = document.createElement('p')
    victorySubText.classList.add('victory-subtext')
    const finishTime = calculateEndTime()
    victorySubText.innerText = `Vaše vrijeme:\n ${finishTime}`
    victoryText.appendChild(victorySubText)
}

const createContainerElems = (classBaseName: string): { outerContainerEl: HTMLElement, innerContainerEl: HTMLElement } => {
    let outerContainerEl = document.getElementById(`${classBaseName}-outer`)
    if (!outerContainerEl) {
        outerContainerEl = document.createElement('div')
        outerContainerEl.classList.add(`${classBaseName}-outer`)
        outerContainerEl.setAttribute("id", `${classBaseName}-outer`)
        document.body.appendChild(outerContainerEl)
    }

    let innerContainerEl = document.getElementById(`${classBaseName}-inner`)
    if (!innerContainerEl) {
        innerContainerEl = document.createElement('div')
        innerContainerEl.classList.add(`${classBaseName}-inner`)
        innerContainerEl.setAttribute("id", `${classBaseName}-inner`)
        document.body.appendChild(innerContainerEl)
    }
    outerContainerEl.appendChild(innerContainerEl)

    return { outerContainerEl, innerContainerEl }
}

const showGreeter = () => {
    const { outerContainerEl: _, innerContainerEl } = createContainerElems('greeter')

    gameState.player_name = '/'
    updateCurrentPlayer()

    const greetText = document.createElement('p')
    greetText.classList.add('greeter-welcome')
    greetText.innerText = 'Dobrodošli!'
    innerContainerEl.appendChild(greetText)

    const loginButton = document.createElement('button')
    loginButton.innerText = 'Prijava'

    loginButton.addEventListener('click', showLogin)
    innerContainerEl.appendChild(loginButton)

    const registerButton = document.createElement('button')
    registerButton.innerText = 'Registracija'

    registerButton.addEventListener('click', showRegister)
    innerContainerEl.appendChild(registerButton)

}

const closeGreeter = () => {
    const loginButton = document.getElementById('button')
    loginButton?.removeEventListener('click', showLogin)
    const registerButton = document.getElementById('button')
    registerButton?.removeEventListener('click', showRegister)

    document.getElementById('greeter-outer')?.remove()
    updateCurrentPlayer()
}

const updateCurrentPlayer = () => {
    const currentplayerdiv = document.getElementById('currentplayer')
    const currentplayertext = document.getElementById('currentplayertext')
    const logoutLink = document.getElementById('logout')
    if (gameState.player_name === '/') {
        if (currentplayerdiv) {
            currentplayerdiv.style.display = "none"
        }
        if (currentplayertext) {
            currentplayertext.innerText = `Trenutni igrač: /`
        }
        return
    }

    if (currentplayerdiv) {
        currentplayerdiv.style.display = "flex"
    }
    if (currentplayertext) {
        currentplayertext.innerText = `Trenutni igrač: ${gameState.player_name}`
    }

    if (logoutLink) {
        logoutLink.onclick = showGreeter
    }
}

const showLogin = () => {
    const { outerContainerEl, innerContainerEl } = createContainerElems('login')

    const closeButton = document.createElement('a')
    closeButton.innerText = `✖`
    innerContainerEl.appendChild(closeButton)
    const removeOuterContainer = () => {
        outerContainerEl.remove()
    }
    closeButton.onclick = removeOuterContainer

    const prijavaText = document.createElement('p')
    prijavaText.innerText = 'Prijava'
    innerContainerEl.appendChild(prijavaText)

    const loginForm = document.createElement('form')
    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.name = 'nameInput'
    nameInput.placeholder = 'Vaše ime ovdje...'

    const passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    passwordInput.name = 'passInput'
    passwordInput.placeholder = 'Lozinka...'

    const submitNameButton = document.createElement('button')
    submitNameButton.type = 'submit'
    submitNameButton.innerText = 'Prijava'

    loginForm.appendChild(nameInput)
    loginForm.appendChild(passwordInput)
    loginForm.appendChild(submitNameButton)
    innerContainerEl.appendChild(loginForm)

    const loginClick = async (event: Event) => {
        event.preventDefault()
        document.getElementById('error-msg')?.remove()
        let fail = false
        const nameValue = nameInput.value.trim()
        if (nameValue.length === 0) {
            nameInput.placeholder = 'Ime ne smije biti prazno!'
            fail = true
        }

        const passValue = passwordInput.value.trim()

        if (passValue.length < 5) {
            passwordInput.placeholder = 'Lozinka prekratka!'
            fail = true
        }

        if (passValue.length === 0) {
            passwordInput.placeholder = 'Lozinka ne smije biti prazna!'
            fail = true
        }

        if (fail) {
            return
        }

        if (await verifyLogin(nameValue, passValue)) {
            outerContainerEl.remove()
            loginForm.removeEventListener('click', loginClick)
            gameState.player_name = nameValue
            closeGreeter()
            return
        }

        const errorEl = document.createElement('p')
        errorEl.classList.add('error-msg')
        errorEl.setAttribute('id', 'error-msg')
        errorEl.innerText = 'Netočno ime ili lozinka!'
        innerContainerEl.appendChild(errorEl)
    }

    loginForm.addEventListener('submit', loginClick)

}

const showRegister = async () => {
    const { outerContainerEl, innerContainerEl } = createContainerElems('register')

    const closeButton = document.createElement('a')
    closeButton.innerText = `✖`
    innerContainerEl.appendChild(closeButton)
    const removeOuterContainer = () => {
        outerContainerEl.remove()
    }
    closeButton.onclick = removeOuterContainer

    const RegistracijaText = document.createElement('p')
    RegistracijaText.innerText = 'Registracija'
    RegistracijaText.classList.add('regtext')
    innerContainerEl.appendChild(RegistracijaText)

    const registerForm = document.createElement('form')
    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.name = 'nameInput'
    nameInput.placeholder = 'Vaše ime ovdje...'

    const passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    passwordInput.name = 'passInput'
    passwordInput.placeholder = 'Lozinka...'

    const submitNameButton = document.createElement('button')
    submitNameButton.type = 'submit'
    submitNameButton.innerText = 'Registriraj'

    registerForm.appendChild(nameInput)
    registerForm.appendChild(passwordInput)
    registerForm.appendChild(submitNameButton)
    innerContainerEl.appendChild(registerForm)

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        document.getElementById('error-msg')?.remove()
        let fail = false
        const nameValue = nameInput.value.trim()
        if (nameValue.length === 0) {
            nameInput.placeholder = 'Ime ne smije biti prazno!'
            fail = true
        }

        const passValue = passwordInput.value.trim()

        if (passValue.length < 5) {
            const errorEl = document.createElement('p')
            errorEl.classList.add('error-msg')
            errorEl.setAttribute('id', 'error-msg')
            errorEl.innerText = 'Lozinka mora biti duža od 5 znakova!'
            innerContainerEl.appendChild(errorEl)
            fail = true
        }

        if (passValue.length === 0) {
            passwordInput.placeholder = 'Lozinka ne smije biti prazna!'
            fail = true
        }
        if (!fail && await nameExistsInDb(nameValue)) {
            const errorEl = document.createElement('p')
            errorEl.classList.add('error-msg')
            errorEl.setAttribute('id', 'error-msg')
            errorEl.innerText = 'Ime već postoji u bazi!'
            innerContainerEl.appendChild(errorEl)
            fail = true
        }

        if (fail) {
            return
        }
        gameState.player_name = nameValue
        writeToUserDb({ name: nameValue, password: passValue })
        outerContainerEl.remove()
        closeGreeter()
    })
}

const nameExistsInDb = async (name: string): Promise<boolean> => {
    const dbData = await queryDb('/api/queryusers')
    for (let record of dbData) {
        if (record['name'] === name)
            return true
    }
    return false
}

const verifyLogin = async (name: string, password: string): Promise<boolean> => {
    const dbData = await queryDb('/api/queryusers')
    for (let record of dbData) {
        if (record['name'] === name && record['password'] === password)
            return true
    }
    return false
}

/// Izračun vremena od početka igre. U minutama i sekundama.
export const calculateEndTime = () => {
    // Vrijeme kraja, milisekunde on 01.01.1970.
    const endTime = new Date().getTime()
    const timeToFinish = new Date(endTime - startTime)
    const minutes = timeToFinish.getMinutes()
    const seconds = timeToFinish.getSeconds()
    return ((minutes < 10) ? '0' : '') + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;
}

////// Database \\\\\\

/// Upit baze. Vraća nam sve upise u tablici.
export const queryDb = async (apiURI: string) => {
    const response = await fetch(apiURI, { method: 'GET', headers: { 'Accept': 'application/json' } })
    if (!response.ok) {
        throw new Error(`Failed to fetch database rows: ${response.statusText}`)
    }
    const rows = await response.json()
    if (debugEnabled) {
        console.log(rows)
    }
    return rows
}

/// Piše rezultat u bazu.
const writeVictoryToDb = async (victor_info: { name: string, time: string }) => {
    await fetch('/api/writetoleaderboarddb', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'name': victor_info.name,
            'time': victor_info.time
        })
    })
}

const writeToUserDb = async (user_info: { name: string, password: string }) => {
    await fetch('/api/writetouserdb', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'name': user_info.name,
            'password': user_info.password
        })
    })
}



/// Pokažemo igraču tablicu rezultata
const displayLeaderboard = async () => {
    if (document.getElementById('leaderboard-container-outer')) {
        closeLeaderboard()
        return
    }
    const outerContainerEl = document.createElement('div')
    outerContainerEl.classList.add('leaderboard-container-outer')
    outerContainerEl.setAttribute("id", "leaderboard-container-outer")
    document.body.appendChild(outerContainerEl)

    const innerContainerEl = document.createElement('div')
    innerContainerEl.classList.add('leaderboard-container-inner')
    outerContainerEl.appendChild(innerContainerEl)

    const closeButton = document.createElement('button')
    closeButton.innerText = 'Zatvori'
    closeButton.onclick = closeLeaderboard

    innerContainerEl.appendChild(closeButton)

    const table = document.createElement('table')
    table.classList.add('leaderboard-table')

    /*
    {
        { name: "xyz", time: "zyx"},
        { name: "xyz", time: "zyx"},
        { name: "xyz", time: "zyx"}
    }
    */
    const dbData = await queryDb('/api/queryleaderboarddb')
    const rowNames = Object.keys(dbData[0])

    const tableRowNames = document.createElement('tr')
    rowNames.forEach((rowname) => {
        const thEl = document.createElement('th')
        thEl.textContent = rowname.charAt(0).toUpperCase() + rowname.slice(1)
        thEl.classList.add('table-row-names')
        tableRowNames.appendChild(thEl)
    })
    table.appendChild(tableRowNames)

    dbData.forEach((entry: any) => {
        const rowEl = document.createElement("tr")
        rowNames.forEach((rowName => {
            const tdEl = document.createElement("td")
            tdEl.textContent = entry[rowName]
            rowEl.appendChild(tdEl)
        }))
        table.appendChild(rowEl)
    });

    innerContainerEl.appendChild(table);
}

const closeLeaderboard = () => {
    const leaderboardEl = document.getElementById('leaderboard-container-outer')
    leaderboardEl?.remove()
}

