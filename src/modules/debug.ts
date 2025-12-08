import { gameState, calculateEndTime, displayFinish } from "./game.ts"
import { queryDb } from "./database.ts"

/// U ovoj datoteci se nalaze gumbovi i funkcije koje sam koristio za debug

// Gumbovi za debug
export const printGameStateEl = document.getElementById('printgamestate') as HTMLElement
export const printEndTimeEl = document.getElementById('printend') as HTMLElement
export const displayFinishEl = document.getElementById('displayfinish') as HTMLElement
export const queryDbEl = document.getElementById('query-db') as HTMLElement

export const printGameState = () => {
    console.log(gameState)
}

export const printEndTime = () => {
    console.log(`Your time to finish:\n ${calculateEndTime()}`)
}

export const populateDebugElems = () => {
    const actionsDiv = document.getElementById('actions')
    console.log(actionsDiv)
    const printGameStateEl = document.createElement('button')
    printGameStateEl.innerText = 'Print game state'
    printGameStateEl.addEventListener('click', (event) => {
        event.preventDefault()
        printGameState()
    })
    actionsDiv?.appendChild(printGameStateEl)
    const printEndTimeEl = document.createElement('button')
    printEndTimeEl.innerText = 'Print current end time'
    printEndTimeEl.addEventListener('click', (event) => {
        event.preventDefault()
        printEndTime()
    })
    actionsDiv?.appendChild(printEndTimeEl)
    const displayFinishEl = document.createElement('button')
    displayFinishEl.innerText = 'Display finish'
    displayFinishEl.addEventListener('click', (event) => {
        event.preventDefault()
        displayFinish()
    })
    actionsDiv?.appendChild(displayFinishEl)
    const queryDbEl = document.createElement('button')
    queryDbEl.innerText = 'Query DB'
    queryDbEl.addEventListener('click', (event) => {
        event.preventDefault()
        queryDb('/api/leaderboard')
    })
    actionsDiv?.appendChild(queryDbEl)
}
