const dbApi = window.SheetMusicDB || {};
const addScore = dbApi.addScore;
const getAllScores = dbApi.getAllScores;
const putScore = dbApi.putScore;

const listView = document.getElementById("listView");
const formView = document.getElementById("formView");
const scoreList = document.getElementById("scoreList");
const form = document.getElementById("scoreForm");
const titleInput = document.getElementById("title");
const composerInput = document.getElementById("composer");
const arrangerInput = document.getElementById("arranger");
const publisherInput = document.getElementById("publisher");
const voicingInput = document.getElementById("voicing");
const yearPublishedInput = document.getElementById("yearPublished");
const lastPerformedDateInput = document.getElementById("lastPerformedDate");
const licenseCountInput = document.getElementById("licenseCount");
const liturgicalSeasonInput = document.getElementById("liturgicalSeason");
const notesInput = document.getElementById("notes");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const exportBtn = document.getElementById("exportBtn");
const incrementalExportBtn = document.getElementById("incrementalExportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");
const syncStatus = document.getElementById("syncStatus");
const LAST_SYNC_AT_KEY = "sheetmusic.lastSyncAt";

document.getElementById("addBtn").onclick = () => {
    listView.classList.add("hidden");
    formView.classList.remove("hidden");
};

form.onsubmit = async (e) => {
    e.preventDefault();

    if (typeof addScore !== "function") {
        syncStatus.textContent = "Database is not initialized. Refresh the page and try again.";
        return;
    }

    const now = new Date().toISOString();
    const score = normalizeScore({
        id: crypto.randomUUID(),
        title: titleInput.value,
        composer: composerInput.value,
        arranger: arrangerInput.value,
        publisher: publisherInput.value,
        voicing: voicingInput.value,
        liturgicalSeason: liturgicalSeasonInput.value,
        tags: liturgicalSeasonInput.value.split(",").map((t) => t.trim()).filter(Boolean),
        yearPublished: Number(yearPublishedInput.value) || null,
        lastPerformedDate: lastPerformedDateInput.value,
        licenseCount: Number(licenseCountInput.value) || 0,
        notes: notesInput.value,
        createdAt: now,
        updatedAt: now
    });

    await addScore(score);
    await refreshList();

    formView.classList.add("hidden");
    listView.classList.remove("hidden");
    form.reset();
};

async function loadScores(query = "", sortBy = "title") {
    if (typeof getAllScores !== "function") {
        syncStatus.textContent = "Database is not initialized. Refresh the page and try again.";
        return;
    }

    const scores = await getAllScores();
    const filtered = filterScores(scores, query);
    const sorted = sortScores(filtered, sortBy);

    scoreList.innerHTML = "";

    sorted.forEach(score => {
        const li = document.createElement("li");
        const yearText = score.yearPublished ? ` · ${score.yearPublished}` : "";
        const performedText = score.lastPerformedDate ? ` · Last performed: ${score.lastPerformedDate}` : "";
        const seasonText = score.liturgicalSeason ? ` · ${score.liturgicalSeason}` : "";
        li.textContent = `${score.title} — ${score.composer}${yearText}${performedText}${seasonText}`;
        scoreList.appendChild(li);
    });
}

function filterScores(scores, query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return scores;
    }

    return scores.filter((score) => {
        const fields = [
            score.title,
            score.composer,
            score.arranger,
            score.publisher,
            score.voicing,
            score.liturgicalSeason,
            score.yearPublished,
            score.lastPerformedDate,
            ...(Array.isArray(score.tags) ? score.tags : [])
        ];

        return fields.some((value) =>
            String(value || "").toLowerCase().includes(normalizedQuery)
        );
    });
}

function sortScores(scores, sortBy) {
    const sorted = [...scores];

    sorted.sort((a, b) => {
        if (sortBy === "yearPublished") {
            const left = Number(a.yearPublished) || 0;
            const right = Number(b.yearPublished) || 0;
            return right - left;
        }

        if (sortBy === "lastPerformedDate") {
            const left = a.lastPerformedDate || "";
            const right = b.lastPerformedDate || "";
            return right.localeCompare(left);
        }

        const left = String(a[sortBy] || "").toLowerCase();
        const right = String(b[sortBy] || "").toLowerCase();
        return left.localeCompare(right);
    });

    return sorted;
}

function refreshList() {
    return loadScores(searchInput.value, sortSelect.value);
}

function normalizeScore(score) {
    const createdAt = score.createdAt || score.updatedAt || new Date().toISOString();
    const updatedAt = score.updatedAt || createdAt;

    return {
        id: score.id,
        title: String(score.title || "").trim(),
        composer: String(score.composer || "").trim(),
        arranger: String(score.arranger || "").trim(),
        publisher: String(score.publisher || "").trim(),
        voicing: String(score.voicing || "").trim(),
        liturgicalSeason: String(score.liturgicalSeason || "").trim(),
        tags: Array.isArray(score.tags) ? score.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
        yearPublished: Number(score.yearPublished) || null,
        lastPerformedDate: String(score.lastPerformedDate || ""),
        licenseCount: Number(score.licenseCount) || 0,
        notes: String(score.notes || ""),
        createdAt,
        updatedAt
    };
}

function getIsoTimestampValue(value) {
    const parsed = Date.parse(value || "");
    return Number.isNaN(parsed) ? 0 : parsed;
}

function getLastSyncAt() {
    return localStorage.getItem(LAST_SYNC_AT_KEY) || "";
}

function setLastSyncAt(value) {
    localStorage.setItem(LAST_SYNC_AT_KEY, value);
}

function getLatestTimestamp(values) {
    let maxValue = "";
    let maxTime = 0;

    values.forEach((value) => {
        const timestamp = getIsoTimestampValue(value);
        if (timestamp > maxTime) {
            maxTime = timestamp;
            maxValue = new Date(timestamp).toISOString();
        }
    });

    return maxValue;
}

async function exportScores(mode = "full") {
    const scores = await getAllScores();
    const since = getLastSyncAt();
    const exportableScores = mode === "incremental"
        ? scores.filter((score) => getIsoTimestampValue(score.updatedAt || score.createdAt) > getIsoTimestampValue(since))
        : scores;

    const exportedAt = new Date().toISOString();
    const payload = {
        schemaVersion: 1,
        mode,
        since,
        exportedAt,
        records: exportableScores
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sheetmusic-${mode}-export-${timestamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setLastSyncAt(exportedAt);

    if (mode === "incremental") {
        const sinceText = since || "the beginning";
        syncStatus.textContent = `Incremental export complete: ${exportableScores.length} score(s) since ${sinceText}.`;
        return;
    }

    syncStatus.textContent = `Exported ${exportableScores.length} score(s).`;
}

async function importAndAppendScores(file) {
    if (typeof getAllScores !== "function" || typeof putScore !== "function") {
        throw new Error("Database is not initialized. Refresh the page and try again.");
    }

    const rawText = await file.text();
    const parsed = JSON.parse(rawText);
    const incomingRecords = Array.isArray(parsed) ? parsed : parsed.records;

    if (!Array.isArray(incomingRecords)) {
        throw new Error("Import file must contain a records array or a top-level array.");
    }

    const existingScores = await getAllScores();
    const existingById = new Map(existingScores.map((score) => [score.id, score]));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const record of incomingRecords) {
        if (!record || !record.id) {
            skipped += 1;
            continue;
        }

        const normalized = normalizeScore(record);
        const existing = existingById.get(normalized.id);

        if (!existing) {
            await putScore(normalized);
            existingById.set(normalized.id, normalized);
            inserted += 1;
            continue;
        }

        const incomingUpdated = getIsoTimestampValue(normalized.updatedAt);
        const existingUpdated = getIsoTimestampValue(existing.updatedAt || existing.createdAt);

        if (incomingUpdated >= existingUpdated) {
            await putScore({ ...existing, ...normalized });
            existingById.set(normalized.id, { ...existing, ...normalized });
            updated += 1;
        } else {
            skipped += 1;
        }
    }

    const importedMaxUpdatedAt = getLatestTimestamp(
        incomingRecords.map((record) => record?.updatedAt || record?.createdAt)
    );
    const syncTimestamp = getLatestTimestamp([
        getLastSyncAt(),
        parsed?.exportedAt,
        importedMaxUpdatedAt,
        new Date().toISOString()
    ]);
    if (syncTimestamp) {
        setLastSyncAt(syncTimestamp);
    }

    await refreshList();
    syncStatus.textContent = `Import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`;
}

searchInput.addEventListener("input", () => {
    refreshList();
});

sortSelect.addEventListener("change", () => {
    refreshList();
});

exportBtn.addEventListener("click", async () => {
    try {
        await exportScores("full");
    } catch (error) {
        syncStatus.textContent = `Export failed: ${error.message}`;
    }
});

incrementalExportBtn.addEventListener("click", async () => {
    try {
        await exportScores("incremental");
    } catch (error) {
        syncStatus.textContent = `Export failed: ${error.message}`;
    }
});

importBtn.addEventListener("click", () => {
    importFileInput.click();
});

importFileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
        return;
    }

    try {
        await importAndAppendScores(file);
    } catch (error) {
        syncStatus.textContent = `Import failed: ${error.message}`;
    } finally {
        importFileInput.value = "";
    }
});

loadScores("", sortSelect.value);