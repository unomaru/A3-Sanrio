(() => {const stageSvg = d3.select("#podiumStageChart");
    const stageWidth = +stageSvg.attr("width");
    const stageHeight = +stageSvg.attr("height");

    const expandedSvgHeight = 850;
    const collapsedSvgHeight = 800;

    stageSvg.attr("height", collapsedSvgHeight);

    const stageMargin = { top: 40, right: 40, bottom: 100, left: 40 };
    const stageInnerWidth = stageWidth - stageMargin.left - stageMargin.right;
    const stageInnerHeight = stageHeight - stageMargin.top - stageMargin.bottom;

    function getCurrentSvgHeight() {
        return +stageSvg.attr("height");
    }

    const stageG = stageSvg.append("g")
        .attr("transform", `translate(${stageMargin.left},${stageMargin.top})`);

    const expandedPodiumAreaHeight = 360;
    const collapsedPodiumAreaHeight = 520;

    function getCurrentPodiumAreaHeight() {
        return waitingVisible ? expandedPodiumAreaHeight : collapsedPodiumAreaHeight;
    }

    function getCurrentWaitingAreaTop() {
        return getCurrentPodiumAreaHeight() + 70;
    }

    const imageSize = 64;
    const highlightedImageSize = 76;

    // yearSlider
    const stageYearSlider = d3.select("#stageYearSlider");
    const stageYearLabel = d3.select("#stageYearLabel");

    // Play animation
    const stagePlayPauseBtn = d3.select("#stagePlayPauseBtn");

    let stageIsPlaying = false;
    let stagePlayInterval = null;

    // Toggle Button
    const toggleWaitingBtn = d3.select("#toggleWaitingBtn");
    let waitingVisible = false;
    toggleWaitingBtn.text("Show Waiting Area ▼");

    // Map character names to local image files
    const imageMap = {
        "Hello Kitty": "images/kitty.webp",
        "Little Twin Stars": "images/little twin stars.gif",
        "My Melody": "images/MyMelody.webp",
        "Pompompurin": "images/pompom.png",
        "Cinnamoroll": "images/Cinnamoroll.webp",
        "Kuromi": "images/Kuromi.webp",
        "Pochacco": "images/Pochacco.webp",
        "Bad Badtz-Maru": "images/Bad Badtz.webp",
        "Dear Daniel": "images/Dear Daniel.webp",
        "Tuxedosam": "images/Tuxedosam.webp",
        "Charmmykitty": "images/charmmy.webp",
        "Patty & Jimmy": "images/Patty&Jimmy.webp",
        "Gudetama": "images/gudetama.png",
        "Sugarbunnies": "images/Sugarbunnies.webp",
        "Yoshikitty": "images/yoshi.png",
        "SHOW BY ROCK!!": "images/show.png",
        "U*Sa*Ha*Na": "images/Usahana.png",
        "Corocorokuririn": "images/Corocorokuririn.webp",
        "GOEXPANDA": "images/GOEXPANDA.webp",
        "Hangyodon": "images/hangyodon.webp",
        "Jewelpet": "images/jewel.png",
        "KIRIMI-chan": "images/kirimi.png",
        "Kerokerokeroppi": "images/Keroppi.webp",
        "Cogimyun": "images/Cogimyun.png",
        "Fuku-chan": "images/Fuku.webp",
        "ShinganCrimsonZ": "images/shingan.webp",
        "Bonbonribbon": "images/Bonbon.webp",
        "Chibimaru": "images/Chibimaru.webp",
        "Chocopanda": "images/Choco.webp",
        "Cinnamoangels": "images/CinnaAngels.webp",
        "Marshmallowmitainafuwafuwanyanko": "images/Marsh.webp",
        "Minna no Tābō": "images/Minna no Tabo.webp",
        "Mocha": "images/Mocha.webp",
        "Muffin": "images/muffin.webp",
        "Okigaru Friends": "images/Okigaru.webp",
        "Plasmagica": "images/plasmagica.webp",
        "Sweetcoron": "images/Sweetcorn.webp",
        "Taraiguma no Landry": "images/tarai.webp",
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
            return getCurrentPodiumAreaHeight() - podiumHeight(rank);
        }

        function podiumColor(rank) {
            if (rank === 1) return "#f6c445";
            if (rank === 2) return "#cfd6dd";
            if (rank === 3) return "#d79a5d";
            return "#f5b6d2";
        }

        // baseline
        const baseline = stageG.append("line")
            .attr("x1", 0)
            .attr("x2", stageInnerWidth)
            .attr("y1", getCurrentPodiumAreaHeight())
            .attr("y2", getCurrentPodiumAreaHeight())
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
        const cols = Math.min(14, allCharacters.length);
        const rowHeight = 65;
        const cellWidth = stageInnerWidth / cols;
        //const waitingAreaTop = podiumAreaHeight + 80;

        function waitingPosition(character) {
            const index = allCharacters.indexOf(character);
            const col = index % cols;
            const row = Math.floor(index / cols);

            return {
                x: col * cellWidth + cellWidth / 2,
                y: getCurrentWaitingAreaTop() + row * rowHeight
            };
        }

        function hiddenWaitingPosition(character) {
            const index = allCharacters.indexOf(character);
            const col = index % cols;

            return {
                x: col * cellWidth + cellWidth / 2,
                y: getCurrentSvgHeight() + 120
            };
        }

        function podiumPosition(rank) {
            return {
                x: podiumX(rank) + podiumX.bandwidth() / 2,
                y: podiumY(rank) - 22
            };
        }

        // waiting area label
        const waitingLabel = stageG.append("text")
            .attr("x", 0)
            .attr("y", getCurrentWaitingAreaTop() - 40)
            .attr("font-size", 16)
            .attr("font-weight", "600")
            .attr("fill", "#7a5b6a")
            .attr("opacity", 0)
            .text("Waiting area");

        // CHARACTER NODES //
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
            .attr("opacity", 0)
            .text("");

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
            stageYearLabel.text(year);

            const yearRows = (dataByYear.get(year) || [])
                .slice()
                .sort((a, b) => a.rank - b.rank);

            console.table(yearRows);

            const rankByCharacter = new Map(yearRows.map(d => [d.character, d.rank]));

            const t = stageSvg.transition().duration(900).ease(d3.easeCubicInOut);

            charGroups.transition(t)
                .attr("transform", d => {
                    const rank = rankByCharacter.get(d);

                    if (rank != null) {
                        const pos = podiumPosition(rank);
                        return `translate(${pos.x}, ${pos.y})`;
                    }

                    if (waitingVisible) {
                        const pos = waitingPosition(d);
                        return `translate(${pos.x}, ${pos.y})`;
                    }

                    const pos = hiddenWaitingPosition(d);
                    return `translate(${pos.x}, ${pos.y})`;
                });

            charGroups.select(".char-rank")
                .transition(t)
                .attr("opacity", d => {
                    const rank = rankByCharacter.get(d);
                    return rank != null ? 1 : 0;
                })
                .text(d => {
                    const rank = rankByCharacter.get(d);
                    return rank != null ? `#${rank}` : "";
                });

            charGroups.select(".char-name")
                .transition(t)
                .attr("opacity", d => {
                    const rank = rankByCharacter.get(d);
                    return rank != null ? 1 : 0;
                })
                .text(d => {
                    const rank = rankByCharacter.get(d);
                    return rank != null ? d : "";
                });

            charGroups.select(".char-image")
                .transition(t)
                .attr("opacity", d => {
                    const rank = rankByCharacter.get(d);
                    if (rank != null) return 1;
                    return waitingVisible ? 0.8 : 0;
                })
                .attr("width", d => rankByCharacter.get(d) != null ? highlightedImageSize : imageSize)
                .attr("height", d => rankByCharacter.get(d) != null ? highlightedImageSize : imageSize)
                .attr("x", d => rankByCharacter.get(d) != null ? -highlightedImageSize / 2 : -imageSize / 2)
                .attr("y", d => rankByCharacter.get(d) != null ? -highlightedImageSize / 2 : -imageSize / 2);
        }

        function updateWaitingAreaLayout() {
            const newHeight = waitingVisible ? expandedSvgHeight : collapsedSvgHeight;

            stageSvg
                .transition()
                .duration(500)
                .attr("height", newHeight);

            baseline
                .transition()
                .duration(500)
                .attr("y1", getCurrentPodiumAreaHeight())
                .attr("y2", getCurrentPodiumAreaHeight());

            podiumGroups
                .transition()
                .duration(500)
                .attr("transform", rank => `translate(${podiumX(rank)}, ${podiumY(rank)})`);

            waitingLabel
                .transition()
                .duration(500)
                .attr("y", getCurrentWaitingAreaTop() - 40)
                .attr("opacity", waitingVisible ? 1 : 0);

            const currentYear = +stageYearSlider.property("value");
            updatePodiumStage(currentYear);
        }

        stageYearSlider
            .attr("min", d3.min(years))
            .attr("max", d3.max(years))
            .attr("step", 1)
            .property("value", d3.min(years));

        stageYearSlider.on("input", function () {
            if (stageIsPlaying) {
                stageIsPlaying = false;
                stagePlayPauseBtn.text("Play");
                clearInterval(stagePlayInterval);
                stagePlayInterval = null;
            }

            updatePodiumStage(+this.value);
        });

        stagePlayPauseBtn.on("click", function () {
            console.log("play clicked");

            if (stageIsPlaying) {
                stageIsPlaying = false;
                stagePlayPauseBtn.text("Play");
                clearInterval(stagePlayInterval);
                stagePlayInterval = null;
                return;
            }

            stageIsPlaying = true;
            stagePlayPauseBtn.text("Pause");

            stagePlayInterval = setInterval(() => {
                const currentYear = +stageYearSlider.property("value");
                let nextYear = currentYear + 1;

                if (nextYear > d3.max(years)) {
                    nextYear = d3.min(years);
                }

                stageYearSlider.property("value", nextYear);
                updatePodiumStage(nextYear);
            }, 1200);
        });

        toggleWaitingBtn.on("click", function () {
            waitingVisible = !waitingVisible;

            toggleWaitingBtn.text(
                waitingVisible ? "Hide Waiting Area ▲" : "Show Waiting Area ▼"
            );

            updateWaitingAreaLayout();

            const currentYear = +stageYearSlider.property("value");
            updatePodiumStage(currentYear);
        });

        toggleWaitingBtn.text("Show Waiting Area ▼");
        updateWaitingAreaLayout();
        updatePodiumStage(d3.min(years));
    });
})();