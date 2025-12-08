
import { gameState, updateCurrentPlayer, setStartTime, putPlayerName } from "./game.ts"
import * as database from "./database.ts"
import { createContainerElems } from "./helpers.ts"

/// Prikazuje početnu stranicu
export const showGreeter = () => {
    const { outerContainerEl: _, innerContainerEl } = createContainerElems('greeter')

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

/// Pozvano pri uspješnoj prijavi ili registraciji
const succeedLogin = () => {
    const loginButton = document.getElementById('button')
    loginButton?.removeEventListener('click', showLogin)
    const registerButton = document.getElementById('button')
    registerButton?.removeEventListener('click', showRegister)

    document.getElementById('greeter-outer')?.remove()
    updateCurrentPlayer()
    console.log(`succeedlogin playername ${gameState.player_name}`)
    setStartTime()
}

/// Helper za jednostavno prikazivanje greški (npr. kriva lozinka)
const createErrorMsg = (errorstring: string, attachEl: HTMLElement) => {
    const errorEl = document.createElement('p')
    errorEl.classList.add('error-msg')
    errorEl.setAttribute('id', 'error-msg')
    errorEl.innerText = errorstring
    attachEl.appendChild(errorEl)
}

/// Prikazuje prijavu
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

    const onInput = (event: Event) => {
        event.preventDefault()
    }

    nameInput.oninput = (_event) => {
        if (nameInput.value !== '') {
            window.addEventListener('beforeunload', onInput)
        } else {
            window.removeEventListener('beforeunload', onInput)
        }
    }

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

        if (nameValue.length > 15) {
            createErrorMsg('Ime može biti najviše 15 znakova!', innerContainerEl)
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

        if (await database.verifyLogin(nameValue, passValue)) {
            outerContainerEl.remove()
            loginForm.removeEventListener('click', loginClick)
            gameState.player_name = nameValue
            putPlayerName(nameValue)
            window.removeEventListener('beforeunload', onInput)
            succeedLogin()
            return
        }

        createErrorMsg('Netočno ime ili lozinka!', innerContainerEl)
    }

    loginForm.addEventListener('submit', loginClick)

}

/// Prikazuje registraciju
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

    const onInput = (event: Event) => {
        event.preventDefault()
    }

    nameInput.oninput = (_event) => {
        if (nameInput.value !== '') {
            window.addEventListener('beforeunload', onInput)
        } else {
            window.removeEventListener('beforeunload', onInput)
        }
    }

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

        if (nameValue.length > 15) {
            createErrorMsg('Ime može biti najviše 15 znakova!', innerContainerEl)
            fail = true
        }

        const passValue = passwordInput.value.trim()

        if (passValue.length < 5) {
            createErrorMsg('Lozinka mora biti duža od 5 znakova!', innerContainerEl)
            fail = true
        }

        if (passValue.length === 0) {
            passwordInput.placeholder = 'Lozinka ne smije biti prazna!'
            fail = true
        }
        const nameExists = await database.nameExistsInDb(nameValue)
        if (nameExists) {
            createErrorMsg('Ime već postoji u bazi!', innerContainerEl)
            fail = true
        }

        if (fail) {
            return
        }
        gameState.player_name = nameValue
        putPlayerName(nameValue)
        database.writeToUserDb(nameValue, passValue)
        outerContainerEl.remove()
        window.removeEventListener('beforeunload', onInput)
        succeedLogin()
    })
}
