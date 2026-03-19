const stageSvg = d3.select("#podiumStageChart");
const stageWidth = +stageSvg.attr("width");
const stageHeight = +stageSvg.attr("height");

const stageMargin = { top: 80, right: 40, bottom: 180, left: 40 };
const stageInnerWidth = stageWidth - stageMargin.left - stageMargin.right;
const stageInnerHeight = stageHeight - stageMargin.top - stageMargin.bottom;

const stageG = stageSvg.append("g")
    .attr("transform", `translate(${stageMargin.left},${stageMargin.top})`);

const podiumAreaHeight = 360;
const waitingAreaTop = podiumAreaHeight + 140;

const imageSize = 64;
const highlightedImageSize = 76;

// Reuse the main slider + label
const yearSlider = d3.select("#yearSlider");
const yearLabel = d3.select("#yearLabel");

// Map character names to local image files
const imageMap = {
    "Hello Kitty": "images/kitty.webp",
    "Little Twin Stars": "images/LittleTwinStars.jpeg",
    "My Melody": "images/MyMelody.webp",
    "Pompompurin": "images/Pompompurin.jpeg",
    "Cinnamoroll": "images/Cinnamoroll.webp",
    "Kuromi": "images/Kuromi.webp",
    "Pochacco": "images/Pochacco.webp",
    "Bad Badtz-Maru": "images/Bad Badtz.webp",
    "Dear Daniel": "images/Dear Daniel.webp",
    "Tuxedosam": "images/Tuxedosam.webp",
    "Charmmykitty": "images/Charmmykitty.webp",
    "Patty & Jimmy": "images/Patty&Jimmy.webp",
    "Gudetama": "images/Gudetama.jpg",
    "Sugarbunnies": "images/Sugarbunnies.webp",
    "Yoshikitty": "images/Yoshikitty.jpg",
    "SHOW BY ROCK!!": "images/Show by rock.jpeg",
    "U*Sa*Ha*Na": "images/Usahana.png",
    "Corocorokuririn": "images/Corocorokuririn.webp",
    "GOEXPANDA": "images/GOEXPANDA.webp",
    "Hangyodon": "images/Hangyodon.png",
    "Jewelpet": "images/Jewelpet.webp",
    "KIRIMI-chan": "images/Kirimi.jpeg",
    "Kerokerokeroppi": "images/Keroppi.webp",
    "Cogimyun": "images/Cogimyun.png",
    "Fuku-chan": "images/Fuku.webp",
    "ShinganCrimsonZ": "images/Shingan.webp",
    "Bonbonribbon": "images/Bonbon.webp",
    "Chibimaru": "images/Chibimaru.webp",
    "Chocopanda": "images/Choco.webp",
    "Cinnamoangels": "images/CinnaAngels.webp",
    "Marshmallowmitainafuwafuwanyanko": "images/Marsh.webp",
    "Minna no Tābō": "images/Minna no Tabo.webp",
    "Mocha": "images/Mocha.webp",
    "Muffin": "images/Muffin.webp",
    "Okigaru Friends": "images/Okigaru.webp",
    "Plasmagica": "images/Plasmagica.webp",
    "Sweetcoron": "images/Sweetcorn.webp",
    "Taraiguma no Landry": "images/Taraiguma.webp",
    "Trichronika": "images/Trichronika.webp",
    "Tsurezure Naru Ayatsuri Mugenan": "images/Tsurezure.webp",
    "Turfy": "images/Turfy.webp",
};

d3.csv("data/sanrio.csv").then(raw => {
    const data = raw.map(d => ({
        year: +d["Year"],
        rank: +d["Rank"],
        character: d["Character Name"] ? d["Character Name"].trim() : ""
    })).filter(d =>
        Number.isFinite(d.year) &&
        Number.isFinite(d.rank) &&
        d.character !== "" &&
        d.year >= 2000 &&
        d.year <= 2024
    );

    console.log("FILTERED DATA:", data);

    const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
    const dataByYear = d3.group(data, d => d.year);

    const allCharacters = [...new Set(data.map(d => d.character))].sort((a, b) => a.localeCompare(b));
    console.log("ALL CHARACTERS IN FILTERED DATA:", allCharacters);

    // ---------- FIXED PODIUMS ----------
    const podiumRanks = d3.range(1, 11);

    const podiumX = d3.scaleBand()
        .domain(podiumRanks)
        .range([0, stageInnerWidth])
        .padding(0.15);

    function podiumHeight(rank) {
        return 90 + (11 - rank) * 22;
    }

    function podiumY(rank) {
        return podiumAreaHeight - podiumHeight(rank);
    }

    function podiumColor(rank) {
        if (rank === 1) return "#f6c445";
        if (rank === 2) return "#cfd6dd";
        if (rank === 3) return "#d79a5d";
        return "#f5b6d2";
    }

    // baseline
    stageG.append("line")
        .attr("x1", 0)
        .attr("x2", stageInnerWidth)
        .attr("y1", podiumAreaHeight)
        .attr("y2", podiumAreaHeight)
        .attr("stroke", "#d9c8d2")
        .attr("stroke-width", 2);

    // draw podiums once
    const podiumG = stageG.append("g").attr("class", "podiums");

    const podiumGroups = podiumG.selectAll(".podium-slot")
        .data(podiumRanks)
        .join("g")
        .attr("class", "podium-slot")
        .attr("transform", rank => `translate(${podiumX(rank)}, ${podiumY(rank)})`);

    podiumGroups.append("rect")
        .attr("width", podiumX.bandwidth())
        .attr("height", rank => podiumHeight(rank))
        .attr("rx", 10)
        .attr("fill", rank => podiumColor(rank))
        .attr("stroke", "#cc8eb0")
        .attr("stroke-width", 2);

    podiumGroups.append("text")
        .attr("x", podiumX.bandwidth() / 2)
        .attr("y", rank => podiumHeight(rank) - 18)
        .attr("text-anchor", "middle")
        .attr("font-size", 28)
        .attr("font-weight", "700")
        .attr("fill", "#6b2d4a")
        .text(rank => rank);

    // ---------- WAITING AREA ----------
    const cols = Math.min(8, allCharacters.length);
    const cellWidth = stageInnerWidth / cols;
    const rowHeight = 120;

    function waitingPosition(character) {
        const index = allCharacters.indexOf(character);
        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
            x: col * cellWidth + cellWidth / 2,
            y: waitingAreaTop + row * rowHeight
        };
    }

    function podiumPosition(rank) {
        return {
            x: podiumX(rank) + podiumX.bandwidth() / 2,
            y: podiumY(rank) - 22
        };
    }

    // waiting area label
    stageG.append("text")
        .attr("x", 0)
        .attr("y", waitingAreaTop - 35)
        .attr("font-size", 16)
        .attr("font-weight", "600")
        .attr("fill", "#7a5b6a")
        .text("Waiting area");

    // ---------- CHARACTER NODES ----------
    const charactersG = stageG.append("g").attr("class", "characters");

    const charGroups = charactersG.selectAll(".character-node")
        .data(allCharacters, d => d)
        .join("g")
        .attr("class", "character-node")
        .attr("transform", d => {
            const pos = waitingPosition(d);
            return `translate(${pos.x}, ${pos.y})`;
        });

    charGroups.append("text")
        .attr("class", "char-name")
        .attr("x", 0)
        .attr("y", -imageSize / 2 - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("font-weight", "600")
        .attr("fill", "#333")
        .text(d => d);

    charGroups.append("image")
        .attr("class", "char-image")
        .attr("x", -imageSize / 2)
        .attr("y", -imageSize / 2)
        .attr("width", imageSize)
        .attr("height", imageSize)
        .attr("href", d => imageMap[d] || "assets/images/placeholder.png");

    charGroups.append("text")
        .attr("class", "char-rank")
        .attr("x", 0)
        .attr("y", imageSize / 2 + 18)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("font-weight", "700")
        .attr("fill", "#6b2d4a")
        .text("");

    function updatePodiumStage(year) {
        yearLabel.text(year);

        const yearRows = (dataByYear.get(year) || [])
            .slice()
            .sort((a, b) => a.rank - b.rank);

        console.table(yearRows);

        const rankByCharacter = new Map(yearRows.map(d => [d.character, d.rank]));

        const t = stageSvg.transition().duration(900).ease(d3.easeCubicInOut);

        charGroups.transition(t)
            .attr("transform", d => {
                const rank = rankByCharacter.get(d);
                const pos = rank != null ? podiumPosition(rank) : waitingPosition(d);
                return `translate(${pos.x}, ${pos.y})`;
            });

        charGroups.select(".char-rank")
            .transition(t)
            .text(d => {
                const rank = rankByCharacter.get(d);
                return rank != null ? `#${rank}` : "";
            });

        charGroups.select(".char-name")
            .transition(t)
            .attr("opacity", d => rankByCharacter.get(d) != null ? 1 : 0.9);

        charGroups.select(".char-image")
            .transition(t)
            .attr("opacity", d => rankByCharacter.get(d) != null ? 1 : 0.8)
            .attr("width", d => rankByCharacter.get(d) != null ? highlightedImageSize : imageSize)
            .attr("height", d => rankByCharacter.get(d) != null ? highlightedImageSize : imageSize)
            .attr("x", d => rankByCharacter.get(d) != null ? -highlightedImageSize / 2 : -imageSize / 2)
            .attr("y", d => rankByCharacter.get(d) != null ? -highlightedImageSize / 2 : -imageSize / 2);
    }

    yearSlider
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("step", 1)
        .property("value", d3.min(years))
        .on("input", function () {
            updatePodiumStage(+this.value);
        });

    updatePodiumStage(d3.min(years));
});