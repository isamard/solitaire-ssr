import { queryDb } from "./database.ts"
import { createContainerElems } from "./helpers.ts"

const leaderboardEl = document.getElementById('leaderboard')
const statisticsEl = document.getElementById('statistics')

let victoriesByName = new Map<string, number>()

/// Pokažemo igraču tablicu rezultata
const displayLeaderboard = async () => {
    if (statisticsEl) {
        statisticsEl.onclick = displayStatistics
    }

    const table = document.createElement('table')
    table.classList.add('leaderboard-table')

    const dbData = await queryDb('/api/queryleaderboarddb')
    const rowNames = Object.keys(dbData[0])

    const tableRowNames = document.createElement('tr')
    rowNames.forEach((rowname) => {
        const thEl = document.createElement('th')
        let finalName = rowname
        switch (rowname) {
            case "pocetnovrijeme":
                finalName = 'Početno vrijeme'
                break;
            case "zavrsnovrijeme":
                finalName = 'Završno vrijeme'
                break;
            case "ukupnovrijeme":
                finalName = 'Ukupno vrijeme'
                break;
        }
        thEl.textContent = finalName.charAt(0).toUpperCase() + finalName.slice(1)
        thEl.classList.add('table-row-names')
        tableRowNames.appendChild(thEl)
    })

    const thEl = document.createElement('th')
    thEl.textContent = 'Pobjeda?'
    thEl.classList.add('table-row-names')
    tableRowNames.appendChild(thEl)

    table.appendChild(tableRowNames)

    dbData.forEach((entry: any) => {
        const rowEl = document.createElement("tr")
        rowNames.forEach((rowName => {
            const tdEl = document.createElement("td")
            tdEl.textContent = entry[rowName]
            rowEl.appendChild(tdEl)
        }))
        const tdEl = document.createElement("td")
        tdEl.textContent = `${entry['bodovi'] === 52 ? `✔` : `✖`}`
        const gottenvalue = victoriesByName.get(`${entry['ime']}`)

        if (!gottenvalue)
            victoriesByName.set(`${entry['ime']}`, 0)

        if (entry['bodovi'] === 52) {
            //@ts-ignore
            victoriesByName.set(`${entry['ime']}`, victoriesByName.get(`${entry['ime']}`) + 1)
        }


        rowEl.appendChild(tdEl)
        table.appendChild(rowEl)
    });

    leaderboardEl?.appendChild(table);
}

const displayStatistics = async () => {
    const statisticsContainer = document.getElementById('statistics-outer')

    if (statisticsContainer) {
        statisticsContainer.remove()
        return
    }

    const { outerContainerEl, innerContainerEl } = createContainerElems('statistics')
    const dbData = await queryDb('/api/queryleaderboarddb')

    const closeButton = document.createElement('a')
    closeButton.innerText = `✖`
    innerContainerEl.appendChild(closeButton)
    const removeOuterContainer = () => {
        outerContainerEl.remove()
    }
    closeButton.onclick = removeOuterContainer

    const headerTitle = document.createElement('p')
    headerTitle.innerText = 'Statistike'
    headerTitle.classList.add('title')
    innerContainerEl.appendChild(headerTitle)

    const statsDiv = document.createElement('div')
    statsDiv.classList.add('statsdiv')

    innerContainerEl.appendChild(statsDiv)

    const averageTimeLabel = document.createElement('p')
    averageTimeLabel.innerText = 'Prosječno vrijeme igre:'
    averageTimeLabel.classList.add('subheader')
    statsDiv.appendChild(averageTimeLabel)

    const calculateAvgTime = () => {
        const convertToMiliseconds = (minutes: number, seconds: number) => ((minutes * 60 + seconds) * 1000)
        let sum: number = 0
        for (let i = 0; i < dbData.length; i++) {
            const vrijemeString: string = dbData[i]['ukupnovrijeme']
            const minutesMatch = vrijemeString.match('.*:')
            const secondsMatch = vrijemeString.match(':.*')

            if (!minutesMatch || !secondsMatch)
                continue

            const minutes = Number(minutesMatch[0].slice(0, 2))
            const seconds = Number(secondsMatch[0].slice(1, 3))

            sum += convertToMiliseconds(minutes, seconds)
        }
        const avgMilliseconds = sum / dbData.length

        const millisecondToMinuteSecond = (milliseconds: number) => {
            var minutes = Math.floor(milliseconds / 60000);
            var seconds = ((milliseconds % 60000) / 1000).toFixed(0);
            return (minutes < 10 ? '0' : '') + minutes + ":" + (Number(seconds) < 10 ? '0' : '') + seconds;
        }
        return millisecondToMinuteSecond(avgMilliseconds)
    }

    const averageTime = document.createElement('p')
    averageTime.innerText = `${calculateAvgTime()}`
    averageTimeLabel.appendChild(averageTime)

    const averageScoreLabel = document.createElement('p')
    averageScoreLabel.innerText = 'Prosjek bodova:'
    averageScoreLabel.classList.add('subheader')
    statsDiv.appendChild(averageScoreLabel)

    const calcAvgScore = async () => {
        let sum = 0
        for (let i = 0; i < dbData.length; i++) {
            sum += dbData[i]['bodovi']
        }
        return sum / dbData.length
    }
    const avgTime = await calcAvgScore()
    const averageScore = document.createElement('p')
    averageScore.innerText = `${avgTime}`
    averageScoreLabel.appendChild(averageScore)

    const mostVictoriesLabel = document.createElement('p')
    mostVictoriesLabel.innerText = 'Najviše pobjeda:'
    mostVictoriesLabel.classList.add('subheader')
    statsDiv.appendChild(mostVictoriesLabel)

    const findMostVictories = () => {
        let biggest: number = 0
        let biggestname: string = 'unknown'
        for (var value of victoriesByName) {
            if (value[1] > biggest) {
                biggest = value[1]
                biggestname = value[0]
            }
        }

        return { biggestname, biggest }
    }


    const mostVictories = document.createElement('p')
    const { biggest, biggestname } = findMostVictories()
    if (biggestname === 'unknown') {
        mostVictories.innerText = `Nema bilježenih pobjeda.`
    } else {
        mostVictories.innerText = `${biggestname}: ${biggest} pobjeda!`
    }
    mostVictoriesLabel.appendChild(mostVictories)

}

if (document.location.pathname === '/leaderboard') {
    document.addEventListener('DOMContentLoaded', displayLeaderboard)
}