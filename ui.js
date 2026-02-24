import { addScore, getAllScores } from "./db.js";

const listView = document.getElementById("listView");
const formView = document.getElementById("formView");
const scoreList = document.getElementById("scoreList");
const form = document.getElementById("scoreForm");

document.getElementById("addBtn").onclick = () => {
    listView.classList.add("hidden");
    formView.classList.remove("hidden");
};

form.onsubmit = async (e) => {
    e.preventDefault();

    const score = {
        id: crypto.randomUUID(),
        title: title.value,
        composer: composer.value,
        arranger: arranger.value,
        publisher: publisher.value,
        instrumentation: instrumentation.value,
        voicing: voicing.value,
        tags: tags.value.split(",").map(t => t.trim()),
        purchaseDate: purchaseDate.value,
        licenseCount: Number(licenseCount.value),
        notes: notes.value
    };

    await addScore(score);
    await loadScores();

    formView.classList.add("hidden");
    listView.classList.remove("hidden");
    form.reset();
};

async function loadScores(query = "") {
    const scores = await getAllScores();
    const filtered = filterScores(scores, query);

    scoreList.innerHTML = "";

    filtered.forEach(score => {
        const li = document.createElement("li");
        li.textContent = `${score.title} — ${score.composer}`;
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
            ...(Array.isArray(score.tags) ? score.tags : [])
        ];

        return fields.some((value) =>
            String(value || "").toLowerCase().includes(normalizedQuery)
        );
    });
}

document.getElementById("searchInput").addEventListener("input", (e) => {
    loadScores(e.target.value);
});

loadScores();