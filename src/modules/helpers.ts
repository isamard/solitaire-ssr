/// Jednostavni generator vanjskog i unutrašnjeg elementa.
export const createContainerElems = (classBaseName: string): { outerContainerEl: HTMLElement, innerContainerEl: HTMLElement } => {
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

/// Generira prikaz datuma (npr. '01.01.2025.')
export const generateFancyDate = (time: Date) => {
    const day = time.getDate()
    const month = time.getMonth()
    return `${(day < 10) ? '0' : ''}${day}.${(month < 10) ? '0' : ''}${month}.${time.getFullYear()}.`
}

/// Generira prikaz sati i minuta (npr. '15:05')
export const generateFancyHoursMinutes = (time: Date) => {
    const hours = time.getHours()
    const minutes = time.getMinutes()
    return `${(hours < 10) ? '0' : ''}${hours}:${(minutes < 10) ? '0' : ''}${minutes}`
}

/// Generira prikaz razlike dvoje vremena u minutama i sekundama ('15:20')
export const calcTimeDiff = (start: Date, end: Date) => {
    const timeDiff = new Date(end.getTime() - start.getTime())
    const minutes = timeDiff.getMinutes()
    const seconds = timeDiff.getSeconds()
    return ((minutes < 10) ? '0' : '') + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds
}
