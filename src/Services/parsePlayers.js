"use strict"

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require('axios').default;
const https = require('https')

/**
 * Represents the game data, parsed from gokgs
 */
class Game {
    /**
     * 
     * @param {string} gameFile -- string with url to sgf file
     * @param {string} white - name of white player (god bless it will be the same as {@link Player} name) 
     * @param {string} black - name of black player (god bless it will be the same as {@link Player} name) 
     * @param {string} gameOptions 
     * @param {Date} startDate 
     * @param {boolean} isRating 
     * @param {string} result
     */
    constructor(gameFile, white, black, gameOptions, startDate) {
        this.gameFile = gameFile;
        this.white = white;
        this.black = black;
        this.gameOptions = gameOptions;
        this.startDate = startDate;
    }

    async getSGF() {
        fetchData(this.gameFile)
    }
}

/**
 * Represents players model with parsed from gokgs data
 */
class Player {
    /**
     * Constructs Player
     * @param {string} name - Playesr name
     * @param {Game} game1 - The newer {@link Game} of the player
     * @param {Game} game2 - The older {@link Game} of the player
     */
    constructor(name, game1, game2) {
        this.name = name;
        this.game1 = game1;
        this.game2 = game2;
    }
}

/**
 * Help class for building chain of messages
 */
class messageSender {
    constructor() {
        this.chain = new Array();
        this.logs = new Array();
        this.getResponses = new Array();
        this.callbacks = new Array();
        this.session = "";
        this.url = "https://www.gokgs.com/json-cors/access";
        this.httpsAgent = new https.Agent({ keepAlive: true });
        this.serverEmpty = false;
        this.started = false;
    }

    /**
     * Add login message
     * @param {string} user 
     * @param {string} pass
     * @returns {messageSender}
     */
    Login(user, pass) {
        let msg = {
            name: user,
            password: pass,
            locale: "en_US",
            type: "LOGIN"
        }
        let msgCopy = new Object()
        Object.assign(msgCopy, msg)

        msg.password = "***"
        this.log(`add #${this.chain.length}`, msg)

        this.chain.push(msgCopy)


        return this
    }

    getServerEmpty() {
        return this.serverEmpty
    }

    isStarted() {
        return this.started
    }

    async Close() {
        while (!this.getServerEmpty()) {
            await new Promise(r => setTimeout(r, 200));
        }
        await axios.post(this.url, { type: "LOGOUT" }, this.getAxiosConfig())
    }

    /**
     * @param {Object} msg 
     * @returns {messageSender}
     */
    Add(msg) {
        this.log(`add #${this.chain.length}`, msg)
        this.chain.push(msg)
        return this
    }

    async Send() {
        let n = 0;
        while (this.chain.length !== 0) {
            await this.sendMessage(this.chain.shift(), n++)
                .catch(e => {
                    this.log(`send error #${n - 1}`, e);
                    throw e;
                });
        }
    }

    /**
     * 
     * @callback kgsMessageCallback
     * @param {Object} message 
     */

    /**
     * 
     * @param {string} type - message type, consult https://www.gokgs.com/json/downstream.html
     * @param {kgsMessageCallback} callback
     */
    SetCallback(callback) {
        this.callbacks.push(callback)
    }

    RunCallbacks() {
        while (this.getResponses.length !== 0) {
            const r = this.getResponses.shift();
            if (!r.data) continue;
            r.data.messages.forEach(m => this.callbacks.forEach(cl => cl(m)));
        }
    }

    getAxiosConfig() {
        return { httpsAgent: this.httpsAgent, withCredentials: true, headers: { Cookie: this.session } }
    }

    /**
     * 
     * @param {string} msg 
     * @param {any} data 
     */
    log(msg, data) {
        if (data.hasOwnProperty("password")) {
            let copy = new Object()
            Object.assign(copy, data)
            copy.password = "***"
            this.logs.push({ message: msg, data: copy })
            return
        }
        this.logs.push({ message: msg, data: data })
    }

    /**
     * @private
     * @param {import("axios").AxiosResponse} x 
     */
    mapResponse(x) {
        // dont map config, as it may store private data
        return {
            status: x.status,
            statusTest: x.statusText,
            headers: JSON.stringify(x.headers),
            data: JSON.stringify(x.data)
        }
    }

    /**
     * 
     * @private
     * @param {import("axios").AxiosResponse} x 
     * @returns {string}
     */
    setSession(x) {
        x.headers["set-cookie"].forEach(x => {
            if (x.includes("JSESSIONID")) {
                this.session = x.toString()
            }
        })
    }

    /**
     * @private
     * @param {Object} msgObj 
     */
    async sendMessage(msgObj, n) {
        this.log(`send #${n}`, msgObj)
        const msg = JSON.stringify(msgObj);
        await axios.post(this.url, msg, this.getAxiosConfig())
            .then(async (x) => {
                this.log(`post response #${n}`, this.mapResponse(x));
                if (this.session === "") this.setSession(x)
                await axios.get(this.url, this.getAxiosConfig())
                    .then(x => {
                        this.log(`get response #${n}`, this.mapResponse(x));
                        this.getResponses.push(x);
                    })
                    .catch(x => { throw new Error(`error: get #${n} request with failed: ${x}`) })
                    // .catch(x => { this.log("error", `error: get #${n} request with failed: ${x}`) })
            })
            .catch(x => { throw new Error(`error: post #${n} request with ${msg} failed: ${x}`) })
    }
}

async function fetchData(url) {
    const response = await axios.get(url)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            throw Error(`error fetching content from ${url}: ${error.message}`);
        });
    return response;
}

/**
 * 
 * Retrives games list from kgs api
 * 
 * @param {string} name - player name
 * @param {messageSender} ms
 * @returns {Promise<Array<Game>>}
 */
export async function getGames(ms, name) {
    // ms.SetCallback((x, log) => {
    //     if (x.type === "ARCHIVE_JOIN") {
    //         log("ARCHIVE_JOIN", x)
    //     }
    //     if (x.type === "ARCHIVE_NONEXISTANT") {
    //         log("ARCHIVE_NONEXISTANT", x)
    //     }
    // });
    await ms.Add({ type: "JOIN_ARCHIVE_REQUEST", name: name })
    return null
}

export function parseGames(games) {
    return games.map(x => {
        let date = new Date(x.timestamp);
        let white;
        let black;
        if (x.players.hasOwnProperty("white")) {
            white = x.players.white.name.toString();
            black = x.players.black.name.toString();
        }
        else {
            white = x.players.owner.name.toString();
            black = "self";
        }
        const postfix = (x.revision) ? "-"+x.revision : "";
        const sgfPath = `https://www.gokgs.com/games/${date.getFullYear()}/${date.getDate()}/${date.getDay()}/${white}-${black}${postfix}.sgf`
        return new Game(sgfPath, white, black, "", date)
    }).sort((a, b) => { return a.startDate - b.startDate})
}

export async function ParsePlayersData() {
    const response = await fetchData("https://www.gokgs.com/top100.jsp");
    const dom = new JSDOM(response);
    let users = new Array();
    dom.window.document.querySelector("table").querySelectorAll("tr").forEach((tr) => {
        const tds = Array.from(tr.querySelectorAll("td").values());
        if (tds.length === 3) {
            users.push(tds[1].textContent);
        }
    });


    let ms = new messageSender()
    let players = new Array()
    ms.SetCallback((x) => {
        if (x.type === "ARCHIVE_JOIN") {
            const games = parseGames(x.games)
            players.push(new Player(x.user, games[0], games[1]));
        }
        if (x.type === "ARCHIVE_NONEXISTANT") {
            console.log(`cant get archive for ${x.name}: ${x.type}`);
        }
    })
    ms.Login("WetJulia1", "ero98b");

    users.map((u, i) => {
        ms.Add({type: "JOIN_ARCHIVE_REQUEST", name: u});
    });
    await ms.Send()
        .then(() => ms.RunCallbacks())
        .catch((x) => { console.log(ms.logs); throw Error(`cant send: ${x}`); });
    return players;
}



/*
{
  "type": "LOGIN",
  "name": "WetJulia1",
  "password": "ero98b",
  "locale": "en_US"
}

{"type": "JOIN_ARCHIVE_REQUEST", "name": "lorc"}

"type": "PLAYBACK_ADD"

*/