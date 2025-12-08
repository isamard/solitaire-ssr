import { debugEnabled } from "./game"

/// Pitamo bazu postoji li ime u bazi. Koristi se pri registraciji
export const nameExistsInDb = async (name: string): Promise<boolean> => {
    const dbData = await queryDb('/api/queryusers')
    for (let record of dbData) {
        if (record['name'] === name)
            return true
    }
    return false
}

/// Pitamo bazu da li su ime i lozinka ispravni
export const verifyLogin = async (name: string, password: string): Promise<boolean> => {
    const dbData = await queryDb('/api/queryusers')
    for (let record of dbData) {
        if (record['name'] === name && record['password'] === password)
            return true
    }
    return false
}

/// Pišemo informacije novog korisnika u bazu
export const writeToUserDb = async (name: string, password: string) => {
    await fetch('/api/writetouserdb', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'name': name,
            'password': password
        })
    })
}

/// Piše rezultat igre u tablicu.
export const writeResultToDb = async (name: string, start_time: string, end_time: string, time: string, date: string, score: number) => {
    await fetch('/api/writetoleaderboarddb', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'name': name,
            'start_time': start_time,
            'end_time': end_time,
            'time': time,
            'date': date,
            'score': score,
        })
    })
}

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
