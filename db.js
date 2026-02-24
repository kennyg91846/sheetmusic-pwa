const DB_NAME = "SheetMusicDB";
const STORE_NAME = "scores";
const VERSION = 2;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const store = db.objectStoreNames.contains(STORE_NAME)
                ? event.target.transaction.objectStore(STORE_NAME)
                : db.createObjectStore(STORE_NAME, { keyPath: "id" });

            if (!store.indexNames.contains("title")) {
                store.createIndex("title", "title", { unique: false });
            }
            if (!store.indexNames.contains("composer")) {
                store.createIndex("composer", "composer", { unique: false });
            }
            if (!store.indexNames.contains("tags")) {
                store.createIndex("tags", "tags", { multiEntry: true });
            }
            if (!store.indexNames.contains("yearPublished")) {
                store.createIndex("yearPublished", "yearPublished", { unique: false });
            }
            if (!store.indexNames.contains("lastPerformedDate")) {
                store.createIndex("lastPerformedDate", "lastPerformedDate", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addScore(score) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).add(score);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

async function putScore(score) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(score);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

async function getAllScores() {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}

window.SheetMusicDB = {
    openDB,
    addScore,
    putScore,
    getAllScores
};
